import {Action, Selector, State, StateContext, Store} from "@ngxs/store";
import {Participant} from "../../game/model";
import {Injectable} from "@angular/core";

export interface UserStateModel {
  participant?: Participant;
}

const defaultState: UserStateModel = {};

export class SetCurrentUser {
  static readonly type = '[User] Set Current User'
  constructor(public participant: Participant) {
  }
}

@State({
  name: 'ppUser',
  defaults: defaultState
})
@Injectable()
export class UserState {

  @Selector()
  static currentUser(state: UserStateModel): Participant | undefined {
    return state.participant;
  }

  @Action(SetCurrentUser)
  setCurrentUser(ctx: StateContext<UserStateModel>, action: SetCurrentUser) {
    ctx.setState({
      participant: action.participant
    })
  }

}
