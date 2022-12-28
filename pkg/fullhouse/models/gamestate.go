package models

import "time"

type GamePhase = string

const (
	VOTING   GamePhase = "VOTING"
	REVEALED GamePhase = "REVEALED"
)

type VoteDTO struct {
	Voted bool `json:"voted"`
	Vote  any  `json:"vote"`
}

type GameState struct {
	Phase                GamePhase
	VotesByParticipantId map[string]any
	LastTransition       time.Time
}

type GameStateDTO struct {
	Phase                GamePhase          `json:"phase"`
	VotesByParticipantId map[string]VoteDTO `json:"votesByParticipantId"`
	LastTransition       time.Time          `json:"lastTransition"`
}

func ToGameStateDTO(state GameState, participants []*Participant) GameStateDTO {
	votesByParticipantId := make(map[string]VoteDTO)
	for _, participant := range participants {
		if vote, ok := state.VotesByParticipantId[participant.Id]; ok {
			votesByParticipantId[participant.Id] = VoteDTO{
				Voted: true,
				Vote:  &vote,
			}
		} else {
			votesByParticipantId[participant.Id] = VoteDTO{
				Voted: false,
				Vote:  nil,
			}
		}
	}
	return GameStateDTO{
		Phase:                state.Phase,
		VotesByParticipantId: votesByParticipantId,
		LastTransition:       state.LastTransition,
	}
}

func (g *GameState) ProgressToNextPhase() {
	if g.Phase == VOTING {
		g.Phase = REVEALED
	} else {
		g.VotesByParticipantId = make(map[string]any)
		g.Phase = VOTING
	}
	g.LastTransition = time.Now()
}
