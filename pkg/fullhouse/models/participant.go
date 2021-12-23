package models

type ParticipantDTO struct {
	Name string `json:"name"`
	Id   string `json:"id"`
}

type Participant struct {
	Name      string
	Id        string
	SessionId string
}
