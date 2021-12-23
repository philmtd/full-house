package models

import (
	"strings"
	"sync"
	"time"
)

var FibonacciVoteSchema = []float32{0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, -1}
var ExtendedFibonacciSchema = []float32{0, 0.25, 0.5, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, -1}

type Game struct {
	Name            string
	Slug            string
	Participants    []*Participant
	LastInteraction time.Time
	GameState       GameState
	VotingScheme    []float32
	Lock            sync.RWMutex
}

type GameDTO struct {
	Name         string            `json:"name"`
	Slug         string            `json:"slug"`
	Participants []*ParticipantDTO `json:"participants"`
	GameState    GameStateDTO      `json:"gameState"`
	VotingScheme []float32         `json:"votingScheme"`
}

func NewGame(name, slug string, votingScheme []float32) *Game {
	return &Game{
		Name:            name,
		Slug:            slug,
		Participants:    []*Participant{},
		LastInteraction: time.Now(),
		GameState: GameState{
			Phase:                VOTING,
			VotesByParticipantId: make(map[string]float32),
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
