import { Injectable, NgZone, inject } from "@angular/core";
import {Observable, Subject} from "rxjs";

export type WsState = number;

@Injectable()
export class WebsocketService {
  private zone = inject(NgZone);

  private stream$: Subject<MessageEvent> = new Subject();
  private ws?: WebSocket;
  private retryConnectionId: number = -1;

  constructor() {
    this.connect();
  }

  public stream(): Observable<MessageEvent> {
    return this.stream$.asObservable();
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    if (this.retryConnectionId !== -1) {
      clearTimeout(this.retryConnectionId);
      this.retryConnectionId = -1;
    }

    const reconnection = (event: CloseEvent) => {
      this.ws = undefined;

      if (event.code === 1000) {
        return;
      }

      if (this.retryConnectionId !== -1) {
        clearTimeout(this.retryConnectionId);
      }
      this.retryConnectionId = window.setTimeout(() => {
        this.retryConnectionId = -1;
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
      this.zone.run(() => {
        console.log("Websocket message received")
        this.stream$.next(msg)
      });
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
