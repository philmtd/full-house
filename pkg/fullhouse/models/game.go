package models

import (
	"fullhouse/pkg/fullhouse/config"
	"strings"
	"sync"
	"time"
)

type AdminSettings struct {
	AllowOthersToReveal  bool `json:"allowOthersToReveal"`
	AllowOthersToRestart bool `json:"allowOthersToRestart"`
}

var DefaultAdminSettings = AdminSettings{
	AllowOthersToReveal:  true,
	AllowOthersToRestart: true,
}

type Game struct {
	Name             string
	Slug             string
	CreatorSessionId string
	Participants     []*Participant
	LastInteraction  time.Time
	GameState        GameState
	VotingScheme     VotingScheme
	AdminSettings    AdminSettings
	Lock             sync.RWMutex
}

type SchemeTooltipMapping struct {
	Value   float32 `json:"value"`
	Tooltip string  `json:"tooltip"`
}

func SchemeTooltipMappingFromConfig(mapping []config.SchemeTooltipMapping) []SchemeTooltipMapping {
	result := []SchemeTooltipMapping{}
	for _, m := range mapping {
		result = append(result, SchemeTooltipMapping{
			Value:   m.Value,
			Tooltip: m.Tooltip,
		})
	}
	return result
}

type VotingScheme struct {
	Name                 string                 `json:"name"`
	Scheme               []float32              `json:"scheme"`
	Labels               []string               `json:"labels"`
	IncludesQuestionmark bool                   `json:"includesQuestionmark"`
	SchemeTooltipMapping []SchemeTooltipMapping `json:"schemeTooltipMapping"`
}

func VotingSchemeFromConfig(scheme config.VotingScheme) VotingScheme {
	return VotingScheme{
		Name:                 scheme.Name,
		Scheme:               scheme.Scheme,
		Labels:               scheme.Labels,
		IncludesQuestionmark: scheme.IncludesQuestionmark,
		SchemeTooltipMapping: SchemeTooltipMappingFromConfig(scheme.SchemeTooltipMapping),
	}
}

type GameDTO struct {
	Name                 string            `json:"name"`
	Slug                 string            `json:"slug"`
	CreatorParticipantId string            `json:"creatorParticipantId"`
	Participants         []*ParticipantDTO `json:"participants"`
	GameState            GameStateDTO      `json:"gameState"`
	VotingScheme         VotingScheme      `json:"votingScheme"`
	AdminSettings        AdminSettings     `json:"adminSettings"`
}

func NewGame(name, slug, creatorSessionId string, votingScheme VotingScheme) *Game {
	return &Game{
		Name:             name,
		Slug:             slug,
		CreatorSessionId: creatorSessionId,
		Participants:     []*Participant{},
		LastInteraction:  time.Now(),
		GameState: GameState{
			Phase:                VOTING,
			VotesByParticipantId: make(map[string]any),
		},
		VotingScheme:  votingScheme,
		AdminSettings: DefaultAdminSettings,
		Lock:          sync.RWMutex{},
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
	var creatorParticipantId string
	for _, p := range game.Participants {
		if strings.EqualFold(p.SessionId, game.CreatorSessionId) {
			creatorParticipantId = p.Id
			break
		}
	}

	return &GameDTO{
		Name:                 game.Name,
		Slug:                 game.Slug,
		CreatorParticipantId: creatorParticipantId,
		Participants:         participants,
		GameState:            ToGameStateDTO(game.GameState, game.Participants),
		VotingScheme:         game.VotingScheme,
		AdminSettings:        game.AdminSettings,
	}
}

func (g *Game) FindParticipantIdBySessionId(sessionId string) string {
	g.Lock.RLock()
	defer g.Lock.RUnlock()
	for _, p := range g.Participants {
		if strings.EqualFold(p.SessionId, sessionId) {
			return p.Id
		}
	}
	return ""
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
