package websocket

import (
	"fullhouse/pkg/fullhouse/logger"
	"go.uber.org/zap"
	"net/http"
)

type WebsocketHandler struct {
	log *zap.SugaredLogger
	Hub *WebsocketHub
}

func NewWebsocketHandler() *WebsocketHandler {
	handler := &WebsocketHandler{
		log: logger.New("WebsocketHandler"),
		Hub: newWebsocketHub(),
	}
	go handler.Hub.run()
	return handler
}

func (h *WebsocketHandler) HandleMessages(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		h.log.Error(err)
		return
	}
	sessionId, err := r.Cookie("SESSION_ID")
	if err != nil {
		h.log.Error(err)
		return
	}
	client := &WebsocketClient{hub: h.Hub, conn: conn, send: make(chan []byte, 512), sessionId: sessionId.Value, log: logger.New("WebsocketClient")}
	client.hub.register <- client

	// Allow collection of memory referenced by the caller by doing all work in
	// new goroutines.
	go client.writePump()
	go client.readPump()
}
