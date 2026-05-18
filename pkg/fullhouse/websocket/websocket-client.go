package websocket

import (
	"bytes"
	"log"
	"log/slog"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 4 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer
	maxMessageSize = 2048
)

var (
	newline  = []byte{'\n'}
	space    = []byte{' '}
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
)

type WebsocketClient struct {
	hub       *WebsocketHub
	conn      *websocket.Conn
	send      chan []byte
	sessionId string
	log       *slog.Logger

	// sendMutex guards send/close of the send channel so concurrent
	// senders/closers cannot panic. closed is set to true after the channel
	// has been closed.
	sendMutex sync.Mutex
	closed    bool
}

// trySend attempts a non-blocking send on the client's send channel. It
// returns:
//   - sent == true if the message was enqueued.
//   - dropped == true if the buffer was full (caller should consider the
//     client slow/dead and unregister it).
//   - both false if the channel has already been closed.
//
// trySend never panics on send-on-closed channel.
func (c *WebsocketClient) trySend(msg []byte) (sent bool, dropped bool) {
	c.sendMutex.Lock()
	defer c.sendMutex.Unlock()
	if c.closed {
		return false, false
	}
	select {
	case c.send <- msg:
		return true, false
	default:
		return false, true
	}
}

// closeSend closes the send channel exactly once and reports whether this
// call performed the close.
func (c *WebsocketClient) closeSend() bool {
	c.sendMutex.Lock()
	defer c.sendMutex.Unlock()
	if c.closed {
		return false
	}
	c.closed = true
	close(c.send)
	return true
}

func (c *WebsocketClient) readPump() {
	defer func() {
		c.hub.unregister <- c
		_ = c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { _ = c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		message = bytes.TrimSpace(bytes.ReplaceAll(message, newline, space))
		c.hub.broadcast <- message
	}
}

// writePump pumps messages from the hub to the websocket connection.
//
// A goroutine running writePump is started for each connection. The
// application ensures that there is at most one writer to a connection by
// executing all writes from this goroutine.
func (c *WebsocketClient) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		_ = c.conn.Close()
		// Make sure the hub eventually drops this client even if only the
		// write side is broken. Use a non-blocking send-with-fallback so
		// writePump cannot deadlock the hub.
		select {
		case c.hub.unregister <- c:
		default:
			go func() { c.hub.unregister <- c }()
		}
	}()
	for {
		select {
		case message, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			_, _ = w.Write(message)

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
