import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {Game, Participant} from "../model";

@Injectable()
export class Api {

  constructor(private client: HttpClient) {
  }

  public createNewGame(name: string, scheme: Array<number>): Observable<Game> {
    return this.client.post<Game>(`/api/game/new`, {
      name: name,
      votingScheme: scheme
    });
  }

  public getGame(slug: string): Observable<Game> {
    return this.client.get<Game>(`/api/game/${slug}`);
  }

  public createUser(name: string): Observable<Participant> {
    return this.client.post<Participant>(`/api/participant/new`, {
      name: name
    });
  }

  public joinGame(slug: string, participant: Participant): Observable<Game> {
    return this.client.post<Game>(`/api/game/${slug}/join`, participant);
  }

  public vote(slug: string, vote?: number): Observable<any> {
    return this.client.post(`/api/game/${slug}/vote`, {
      vote: vote,
      voted: vote !== undefined
    });
  }

  public progressGame(slug: string): Observable<any> {
    return this.client.post(`/api/game/${slug}/progress`, {});
  }
}
