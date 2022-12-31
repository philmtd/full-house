package models

import (
	"fullhouse/pkg/fullhouse/config"
	"strings"
	"sync"
	"time"
)

type Game struct {
	Name            string
	Slug            string
	Participants    []*Participant
	LastInteraction time.Time
	GameState       GameState
	VotingScheme    VotingScheme
	Lock            sync.RWMutex
}

type VotingScheme struct {
	Name                 string    `json:"name"`
	Scheme               []float32 `json:"scheme"`
	IncludesQuestionmark bool      `json:"includesQuestionmark"`
}

func VotingSchemeFromConfig(scheme config.VotingScheme) VotingScheme {
	return VotingScheme{
		Name:                 scheme.Name,
		Scheme:               scheme.Scheme,
		IncludesQuestionmark: scheme.IncludesQuestionmark,
	}
}

type GameDTO struct {
	Name         string            `json:"name"`
	Slug         string            `json:"slug"`
	Participants []*ParticipantDTO `json:"participants"`
	GameState    GameStateDTO      `json:"gameState"`
	VotingScheme VotingScheme      `json:"votingScheme"`
}

func NewGame(name, slug string, votingScheme VotingScheme) *Game {
	return &Game{
		Name:            name,
		Slug:            slug,
		Participants:    []*Participant{},
		LastInteraction: time.Now(),
		GameState: GameState{
			Phase:                VOTING,
			VotesByParticipantId: make(map[string]any),
		},
		VotingScheme: votingScheme,
		Lock:         sync.RWMutex{},
	}
}

func ToGameDto(game *Game) *GameDTO {
	participants := []*ParticipantDTO{}
	game.Lock.RLock()
	defer game.Lock.RUnlock()
	for _, participant := range game.Participants {
		participants = append(participants, &ParticipantDTO{
			Name: participant.Name,
			Id:   participant.Id,
		})
	}
	return &GameDTO{
		Name:         game.Name,
		Slug:         game.Slug,
		Participants: participants,
		GameState:    ToGameStateDTO(game.GameState, game.Participants),
		VotingScheme: game.VotingScheme,
	}
}

func (g *Game) CountParticipantsBySessionId(id string) int {
	countSessionIds := 0
	g.Lock.RLock()
	defer g.Lock.RUnlock()
	for _, participant := range g.Participants {
		if strings.EqualFold(participant.SessionId, id) {
			countSessionIds++
		}
	}
	return countSessionIds
}

func (g *Game) RemoveParticipantBySessionId(id string) bool {
	var participantId string
	g.Lock.Lock()
	defer g.Lock.Unlock()
	for i, participant := range g.Participants {
		if strings.EqualFold(participant.SessionId, id) {
			participantId = participant.Id
			g.Participants = append(g.Participants[:i], g.Participants[i+1:]...)
		}
	}
	if participantId != "" {
		delete(g.GameState.VotesByParticipantId, participantId)
		return true
	} else {
		return false
	}
}
