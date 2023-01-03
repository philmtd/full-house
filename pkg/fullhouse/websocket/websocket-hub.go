package websocket

import (
	"encoding/json"
	"fullhouse/pkg/fullhouse/logger"
	"fullhouse/pkg/fullhouse/utils"
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

type UnregisterObserver interface {
	AllWebsocketSessionsWithIdUnregistered(clientId string)
}

type WebsocketHub struct {
	log                 *zap.SugaredLogger
	broadcast           chan []byte
	register            chan *WebsocketClient
	unregister          chan *WebsocketClient
	clients             utils.SynchronizedMap[*WebsocketClient, bool]
	unregisterObservers []UnregisterObserver
}

func newWebsocketHub() *WebsocketHub {
	return &WebsocketHub{
		log:        logger.New("WebsocketHub"),
		broadcast:  make(chan []byte, 256),
		register:   make(chan *WebsocketClient, 256),
		unregister: make(chan *WebsocketClient, 256),
		clients:    utils.NewSynchronizedMap[*WebsocketClient, bool](),
	}
}

func (h *WebsocketHub) SubscribeToUnregistrations(observer UnregisterObserver) {
	lock.Lock()
	defer lock.Unlock()

	h.unregisterObservers = append(h.unregisterObservers, observer)
}

func (h *WebsocketHub) CountClientsWithSessionId(id string) int {
	count := 0
	h.clients.Range(func(client *WebsocketClient, value bool) bool {
		if strings.EqualFold(client.sessionId, id) {
			count++
		}
		return true
	})
	h.log.Debugw("counted clients with session id", "id", id, "count", count)
	return count
}

func (h *WebsocketHub) BroadcastToClients(message interface{}, clientIds []string) {
	h.log.Debugw("broadcasting to clients", "clientIds", clientIds)
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
	h.clients.Range(func(client *WebsocketClient, value bool) bool {
		if containsClientId(client.sessionId) {
			client.send <- msg
			sentWebsocketMessages.Inc()
		}
		return true
	})
}

func (h *WebsocketHub) unregisterClient(client *WebsocketClient) {
	h.log.Debugw("unregistering client", "sessionId", client.sessionId)
	lock.Lock()
	defer lock.Unlock()
	var doUnregister = false
	if _, ok := h.clients.Get(client); ok {
		h.clients.Delete(client)
		doUnregister = true
	}
	if doUnregister {
		close(client.send)
		activeWebsocketSessions.Dec()

		if h.CountClientsWithSessionId(client.sessionId) == 0 {
			h.log.Debugw("All websocket sessions with id unregistered. Notifying observers.", "sessionId", client.sessionId)
			for _, listener := range h.unregisterObservers {
				listener.AllWebsocketSessionsWithIdUnregistered(client.sessionId)
			}
		}
	}
}

func (h *WebsocketHub) registerClient(client *WebsocketClient) {
	h.log.Debugw("registering client", "sessionId", client.sessionId)
	h.clients.Put(client, true)
	activeWebsocketSessions.Inc()
}

func (h *WebsocketHub) onBroadcast(message []byte) {
	h.log.Debugw("broadcasting message to all")
	h.clients.Range(func(client *WebsocketClient, value bool) bool {
		select {
		case client.send <- message:
			sentWebsocketMessages.Inc()
		default:
			go h.unregisterClient(client)
		}
		return true
	})
}

func (h *WebsocketHub) run() {
	for {
		select {
		case client := <-h.register:
			go h.registerClient(client)
		case client := <-h.unregister:
			go h.unregisterClient(client)
		case message := <-h.broadcast:
			go h.onBroadcast(message)
		}
	}
}
