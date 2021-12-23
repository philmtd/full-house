import {Injectable} from "@angular/core";
import {Observable, Subject} from "rxjs";

export type WebSocketState = number;

@Injectable()
export class WebsocketService {

  private stream$: Subject<MessageEvent> = new Subject();
  private ws?: WebSocket;
  private retryConnectionId: number = -1;

  constructor() {
    this.connect();
  }

  public get state(): WebSocketState | null {
    return this.ws ? this.ws.readyState : null;
  }

  public stream(): Observable<MessageEvent> {
    return this.stream$.asObservable();
  }

  public connect() {
    if (this.state != null) {
      return;
    }

    const reconnection = (event: CloseEvent) => {
      if (event.code === 1000) {
        return;
      }

      // reconnection
      this.retryConnectionId = window.setTimeout(() => {
        this.ws = this.createWebsocket((e) => reconnection(e));
      }, 2000);
    };

    this.ws = this.createWebsocket(evt => reconnection(evt))

  }

  private getConnectionUrl(): string {
    const protocol = location.protocol === 'http:' ? 'ws:' : 'wss:';
    return `${protocol}//${location.host}/api/ws`;
  }

  private createWebsocket(onClose: (event: CloseEvent) => any): WebSocket {
    const ws = new WebSocket(this.getConnectionUrl())
    ws.onerror = err => {
      console.log("Websocket error", err)
    }
    ws.onclose = event => {
      console.log("Websocket connection closed")
      onClose(event)
    }
    ws.onopen = () => {
      console.log("Websocket connection established")
    }
    ws.onmessage = msg => {
      console.log("Websocket message received")
      this.stream$.next(msg)
    }
    return ws;
  }

  public close() {
    if (!this.ws) return;

    if (this.ws.readyState === WebSocket.CLOSED) {
      clearTimeout(this.retryConnectionId);
    }

    this.ws.close(1000);
    this.ws = undefined;
  }

}
