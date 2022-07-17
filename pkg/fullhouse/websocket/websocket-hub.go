package websocket

import (
	"encoding/json"
	"fullhouse/pkg/fullhouse/logger"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"go.uber.org/zap"
	"strings"
	"sync"
)

var lock = sync.RWMutex{}

var activeWebsocketSessions = promauto.NewGauge(prometheus.GaugeOpts{
	Name: "full_house_active_websocket_sessions",
	Help: "The number of currently active websocket sessions",
})

var sentWebsocketMessages = promauto.NewCounter(prometheus.CounterOpts{
	Name: "full_house_sent_websocket_messages_total",
	Help: "The total number of sent websocket messages to all clients since application start",
})

type WebsocketHub struct {
	log                 *zap.SugaredLogger
	broadcast           chan []byte
	register            chan *WebsocketClient
	unregister          chan *WebsocketClient
	clients             map[*WebsocketClient]bool
	unregisterListeners []chan string
}

func newWebsocketHub() *WebsocketHub {
	return &WebsocketHub{
		log:        logger.New("WebsocketHub"),
		broadcast:  make(chan []byte),
		register:   make(chan *WebsocketClient),
		unregister: make(chan *WebsocketClient),
		clients:    make(map[*WebsocketClient]bool),
	}
}

func (h *WebsocketHub) SubscribeToUnregistrations(out chan string) {
	lock.Lock()
	defer lock.Unlock()

	h.unregisterListeners = append(h.unregisterListeners, out)
}

func (h *WebsocketHub) CountClientsWithSessionId(id string) int {
	lock.RLock()
	defer lock.RUnlock()
	count := 0
	for client := range h.clients {
		if strings.EqualFold(client.sessionId, id) {
			count++
		}
	}
	h.log.Debugw("counted clients with session id", "id", id, "count", count)
	return count
}

func (h *WebsocketHub) BroadcastToClients(message interface{}, clientIds []string) {
	h.log.Debugw("broadcasting to clients", "clientIds", clientIds)
	lock.RLock()
	defer lock.RUnlock()
	msg, err := json.Marshal(message)
	if err != nil {
		return
	}
	containsClientId := func(id string) bool {
		for _, clientId := range clientIds {
			if strings.EqualFold(id, clientId) {
				return true
			}
		}
		return false
	}
	for client := range h.clients {
		if containsClientId(client.sessionId) {
			client.send <- msg
			sentWebsocketMessages.Inc()
		}
	}
}

func (h *WebsocketHub) unregisterClient(client *WebsocketClient) {
	h.log.Debugw("unregistering client", "sessionId", client.sessionId)
	lock.Lock()
	var doUnregister = false
	if _, ok := h.clients[client]; ok {
		delete(h.clients, client)
		doUnregister = true
	}
	lock.Unlock()
	if doUnregister {
		close(client.send)
		for _, listener := range h.unregisterListeners {
			listener <- client.sessionId
		}
		activeWebsocketSessions.Dec()
	}
}

func (h *WebsocketHub) registerClient(client *WebsocketClient) {
	h.log.Debugw("registering client", "sessionId", client.sessionId)
	lock.Lock()
	defer lock.Unlock()
	h.clients[client] = true
	activeWebsocketSessions.Inc()
}

func (h *WebsocketHub) onBroadcast(message []byte) {
	h.log.Debugw("broadcasting message to all")
	lock.RLock()
	defer lock.RUnlock()
	for client := range h.clients {
		select {
		case client.send <- message:
			sentWebsocketMessages.Inc()
		default:
			go h.unregisterClient(client)
		}
	}
}

func (h *WebsocketHub) run() {
	for {
		select {
		case client := <-h.register:
			h.registerClient(client)
		case client := <-h.unregister:
			go h.unregisterClient(client)
		case message := <-h.broadcast:
			h.onBroadcast(message)
		}
	}
}
