package websocket

import (
	"encoding/json"
	"fullhouse/pkg/fullhouse/logger"
	"fullhouse/pkg/fullhouse/utils"
	"log/slog"
	"strings"
	"sync"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

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
	log                 *slog.Logger
	broadcast           chan []byte
	register            chan *WebsocketClient
	unregister          chan *WebsocketClient
	clients             utils.SynchronizedMap[*WebsocketClient, bool]
	observersMutex      sync.RWMutex
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
	h.observersMutex.Lock()
	defer h.observersMutex.Unlock()

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
	h.log.Debug("counted clients with session id", slog.String("id", id), slog.Int("count", count))
	return count
}

func (h *WebsocketHub) BroadcastToClients(message interface{}, clientIds []string) {
	h.log.Debug("broadcasting to clients", slog.Any("clientIds", clientIds))
	msg, err := json.Marshal(message)
	if err != nil {
		return
	}
	idSet := make(map[string]struct{}, len(clientIds))
	for _, id := range clientIds {
		idSet[strings.ToLower(id)] = struct{}{}
	}
	h.clients.Range(func(client *WebsocketClient, value bool) bool {
		if _, ok := idSet[strings.ToLower(client.sessionId)]; !ok {
			return true
		}
		sent, dropped := client.trySend(msg)
		if sent {
			sentWebsocketMessages.Inc()
		} else if dropped {
			// Slow or dead client. Drop it instead of blocking the broadcast
			// for everyone else.
			h.log.Warn("dropping slow websocket client", slog.String("sessionId", client.sessionId))
			h.asyncUnregister(client)
		}
		return true
	})
}

// asyncUnregister enqueues an unregister request without blocking the caller
// even if the unregister channel is currently full.
func (h *WebsocketHub) asyncUnregister(client *WebsocketClient) {
	select {
	case h.unregister <- client:
	default:
		go func() { h.unregister <- client }()
	}
}

func (h *WebsocketHub) unregisterClient(client *WebsocketClient) {
	h.log.Debug("unregistering client", slog.String("sessionId", client.sessionId))
	if _, ok := h.clients.Get(client); !ok {
		return
	}
	h.clients.Delete(client)
	client.closeSend()
	activeWebsocketSessions.Dec()

	if h.CountClientsWithSessionId(client.sessionId) == 0 {
		h.log.Debug("All websocket sessions with id unregistered. Notifying observers.", slog.String("sessionId", client.sessionId))
		h.observersMutex.RLock()
		observers := make([]UnregisterObserver, len(h.unregisterObservers))
		copy(observers, h.unregisterObservers)
		h.observersMutex.RUnlock()
		for _, listener := range observers {
			listener.AllWebsocketSessionsWithIdUnregistered(client.sessionId)
		}
	}
}

func (h *WebsocketHub) registerClient(client *WebsocketClient) {
	h.log.Debug("registering client", slog.String("sessionId", client.sessionId))
	h.clients.Put(client, true)
	activeWebsocketSessions.Inc()
}

func (h *WebsocketHub) onBroadcast(message []byte) {
	h.log.Debug("broadcasting message to all")
	h.clients.Range(func(client *WebsocketClient, value bool) bool {
		sent, dropped := client.trySend(message)
		if sent {
			sentWebsocketMessages.Inc()
		} else if dropped {
			h.asyncUnregister(client)
		}
		return true
	})
}

func (h *WebsocketHub) run() {
	for {
		select {
		case client := <-h.register:
			h.registerClient(client)
		case client := <-h.unregister:
			h.unregisterClient(client)
		case message := <-h.broadcast:
			h.onBroadcast(message)
		}
	}
}
