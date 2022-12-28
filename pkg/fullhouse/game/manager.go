package game

import (
	"context"
	"fmt"
	"fullhouse/pkg/fullhouse/logger"
	"fullhouse/pkg/fullhouse/models"
	"fullhouse/pkg/fullhouse/websocket"
	"github.com/google/uuid"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"go.uber.org/zap"
	"strings"
	"sync"
	"time"
)

type KeyedMutex struct {
	mutexes sync.Map // Zero value is empty and ready for use
}

func (m *KeyedMutex) Lock(key string) func() {
	value, _ := m.mutexes.LoadOrStore(key, &sync.Mutex{})
	mtx := value.(*sync.Mutex)
	mtx.Lock()

	return mtx.Unlock
}

var (
	totalCreatedGamesCounter = promauto.NewCounter(prometheus.CounterOpts{
		Name:        "full_house_created_games_count_total",
		Help:        "The total number of created games since application start",
		ConstLabels: nil,
	})
	totalVotings = promauto.NewCounter(prometheus.CounterOpts{
		Name:        "full_house_votings_total",
		Help:        "The total number of completed votings since application start",
		ConstLabels: nil,
	})
	gamesLock         = sync.RWMutex{}
	progressGamesLock = KeyedMutex{}
)

type GameManager struct {
	games        []*models.Game
	log          *zap.SugaredLogger
	websocketHub *websocket.WebsocketHub
	ctx          context.Context
}

func New(websocketHub *websocket.WebsocketHub, ctx context.Context) *GameManager {
	manager := &GameManager{
		games:        []*models.Game{},
		log:          logger.New("gameManager"),
		websocketHub: websocketHub,
		ctx:          ctx,
	}
	manager.cleanOldGamesPeriodically()
	manager.websocketHub.SubscribeToUnregistrations(manager)

	promauto.NewGaugeFunc(prometheus.GaugeOpts{
		Name: "full_house_active_games_size",
		Help: "The number of active games",
	}, func() float64 {
		return float64(len(manager.games))
	})

	return manager
}

func (g *GameManager) GetGameBySlug(slug string) (*models.GameDTO, error) {
	game, err := g.findGame(slug)
	if err != nil {
		return nil, err
	}
	return models.ToGameDto(game), nil
}

func (g *GameManager) CreateGame(game *models.GameDTO) *models.GameDTO {
	slugExists := func(s string) bool {
		for _, existing := range g.games {
			if existing.Slug == s {
				return true
			}
		}
		return false
	}
	var slug string

	for {
		slug = GetRandomSlug()
		if !slugExists(slug) {
			break
		}
	}

	createdGame := models.NewGame(game.Name, slug, game.VotingScheme)
	gamesLock.Lock()
	g.games = append(g.games, createdGame)
	gamesLock.Unlock()
	g.log.Infow("created new game", "name", createdGame.Name, "slug", createdGame.Slug)
	totalCreatedGamesCounter.Inc()
	return models.ToGameDto(createdGame)
}

func (g *GameManager) CreateParticipant(name string) *models.ParticipantDTO {
	return &models.ParticipantDTO{
		Name: name,
		Id:   uuid.New().String(),
	}
}

func (g *GameManager) JoinGame(slug string, dto *models.ParticipantDTO, sessionId string) (*models.GameDTO, error) {
	if sessionId == "" {
		sessionId = uuid.New().String()
	}
	game, err := g.findGame(slug)
	if err != nil {
		return nil, fmt.Errorf("game with slug not found: %s", slug)
	}
	defer g.broadcastGameState(slug)

	participant := &models.Participant{
		Name:      dto.Name,
		Id:        dto.Id,
		SessionId: sessionId,
	}
	exists := false

	game.Lock.Lock()
	for _, p := range game.Participants {
		if p.Id == dto.Id {
			exists = true
			p.Name = dto.Name // update name
			break
		}
	}
	if !exists {
		game.Participants = append(game.Participants, participant)
		g.log.Infow("player joined game", "slug", slug, "sessionId", sessionId, "playerName", participant.Name)
	}
	game.Lock.Unlock()
	g.updateInteractionTimestamp(slug)
	return models.ToGameDto(game), nil
}

func (g *GameManager) Vote(slug string, vote *models.VoteDTO, participantId string) error {
	gameBySlug, err := g.findGame(slug)
	if err != nil {
		return err
	}

	if gameBySlug.GameState.Phase == models.REVEALED {
		g.updateInteractionTimestamp(slug)
		return nil
	}

	gameBySlug.Lock.Lock()
	if vote.Vote != nil {
		gameBySlug.GameState.VotesByParticipantId[participantId] = vote.Vote
	} else {
		delete(gameBySlug.GameState.VotesByParticipantId, participantId)
	}
	gameBySlug.Lock.Unlock()
	g.broadcastGameState(slug)
	g.updateInteractionTimestamp(slug)
	return nil
}

func (g *GameManager) ProgressGameToNextState(slug string) error {
	unlock := progressGamesLock.Lock(slug)
	defer unlock()

	gameBySlug, err := g.findGame(slug)
	if err != nil {
		return fmt.Errorf("game not found")
	}
	if gameBySlug.GameState.Phase == models.VOTING {
		totalVotings.Inc()
	}

	if gameBySlug.GameState.LastTransition.Add(3 * time.Second).After(time.Now()) {
		g.log.Infow("not progressing game to next state because the last transition occurred less than 3 seconds ago", "slug", slug)

		return nil
	}

	gameBySlug.GameState.ProgressToNextPhase()
	g.log.Infow("progressing game to next state", "slug", slug, "newPhase", gameBySlug.GameState.Phase)
	g.updateInteractionTimestamp(slug)
	defer g.broadcastGameState(slug)
	return nil
}

func (g *GameManager) broadcastGameState(slug string) {
	currentGame, err := g.findGame(slug)

	if err != nil {
		return
	}

	gameDto := models.ToGameDto(currentGame)
	var clientIds []string

	currentGame.Lock.RLock()
	for _, participant := range currentGame.Participants {
		clientIds = append(clientIds, participant.SessionId)
	}
	currentGame.Lock.RUnlock()
	g.websocketHub.BroadcastToClients(gameDto, clientIds)
}

func (g *GameManager) updateInteractionTimestamp(slug string) {
	if game, err := g.findGame(slug); err == nil {
		game.LastInteraction = time.Now()
	}
}

func (g *GameManager) findGame(slug string) (*models.Game, error) {
	gamesLock.RLock()
	defer gamesLock.RUnlock()

	for _, game := range g.games {
		if strings.EqualFold(game.Slug, slug) {
			return game, nil
		}
	}
	return nil, fmt.Errorf("game not found")
}

func (g *GameManager) cleanOldGamesPeriodically() {
	cleanUp := func() {
		gamesLock.Lock()
		defer gamesLock.Unlock()

		g.log.Debugw("checking for expired games")
		now := time.Now()
		toRemove := []int{}
		for idx, game := range g.games {
			game.Lock.RLock()
			participantCount := len(game.Participants)
			game.Lock.RUnlock()
			if participantCount > 0 {
				continue
			}
			if game.LastInteraction.Add(1 * time.Hour).Before(now) {
				g.log.Infow("game timed out", "slug", game.Slug)
				toRemove = append(toRemove, idx)
			}
		}
		for _, indexToRemove := range toRemove {
			g.games = append(g.games[:indexToRemove], g.games[indexToRemove+1:]...)
		}
	}

	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		for {
			select {
			case <-ticker.C:
				cleanUp()
			case <-g.ctx.Done():
				ticker.Stop()
				return
			}
		}
	}()
}

func (g *GameManager) AllWebsocketSessionsWithIdUnregistered(sessionId string) {
	gamesLock.RLock()
	defer gamesLock.RUnlock()

	for _, game := range g.games {
		if game.CountParticipantsBySessionId(sessionId) > 0 {
			g.log.Debugw("starting delayed removal of user in game", "slug", game.Slug, "sessionId", sessionId)
			go g.delayedRemoval(game.Slug, sessionId)
		}
	}
}

func (g *GameManager) delayedRemoval(slug, unregisteredId string) {
	time.Sleep(5 * time.Second)
	if g.websocketHub.CountClientsWithSessionId(unregisteredId) == 0 {
		game, err := g.findGame(slug)
		if err != nil {
			return
		}
		g.log.Debugw("removing disconnected participant from game", "slug", slug, "sessionId", unregisteredId)
		if modified := game.RemoveParticipantBySessionId(unregisteredId); modified {
			g.broadcastGameState(slug)
		}
	}
}
