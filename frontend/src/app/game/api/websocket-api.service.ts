import {Injectable} from "@angular/core";
import {WebsocketService} from "./websocket.service";
import {Observable} from "rxjs";
import {Game} from "../model";
import {filter, map} from "rxjs/operators";

@Injectable()
export class WebsocketApi {

  constructor(private ws: WebsocketService) {
  }

  public gameState(slug: string): Observable<Game> {
    return this.ws.stream().pipe(map(evt => {
        return JSON.parse(evt.data) as Game
      }),
      filter(g => g && g.slug === slug)
    );
  }

  public reconnect() {
    this.ws.close();
    this.ws.connect();
  }
}
