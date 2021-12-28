import { createAction, createAsyncThunk } from '@reduxjs/toolkit'
import { Action } from 'redux'
import { ThunkAction } from 'redux-thunk'

import { buildGameState, Endpoint } from '../api'
import { Card, GameAction, GameState, Player } from '../types'
import { State } from './reducer'
import { getHumanPlayer } from './selectors'

type Timeout = ReturnType<typeof setTimeout>

const MOVE_DELAY = 2500

export enum ActionTypes {
  CHOOSE_CARD = 'CHOOSE_CARD',
  CHOOSE_GUESS = 'CHOOSE_GUESS',
  CHOOSE_TARGET = 'CHOOSE_TARGET',
  CONNECT = 'CONNECT',
  RECONNECT = 'RECONNECT',
  REGISTER_TIMEOUT = 'REGISTER_TIMEOUT',
  RESET = 'RESET',
  UPDATE = 'UPDATE',
  WATCH = 'WATCH'
}

export interface ChooseCardAction extends Action {
  type: typeof ActionTypes.CHOOSE_CARD
  card: Card | null
}

export interface ChooseGuessAction extends Action {
  type: typeof ActionTypes.CHOOSE_GUESS
  guess: Card | null
}

export interface ChooseTargetAction extends Action {
  type: typeof ActionTypes.CHOOSE_TARGET
  target: Player | null
}

interface ConnectAction extends Action {
  type: typeof ActionTypes.CONNECT
}

interface ReconnectAction extends Action {
  type: typeof ActionTypes.RECONNECT
  data: GameState
}

interface RegisterTimeoutAction extends Action {
  type: typeof ActionTypes.REGISTER_TIMEOUT
  timeout: Timeout
}

interface ResetAction extends Action {
  type: typeof ActionTypes.RESET
  data: GameState
}

export interface UpdateAction extends Action {
  type: typeof ActionTypes.UPDATE
  data: GameState
}
 
export interface WatchAction extends Action {
  type: typeof ActionTypes.WATCH
}

const chooseCard = createAction<Card | null>("choose_card");

const chooseGuess = createAction("choose_guess", (guessId: number | null) => {
  const guess = guessId ? new Card(guessId) : null
  return {
    payload: guess
  }
});

const chooseTarget = createAction<Player | null>("choose_target")

const registerTimeout = createAction<Timeout>("register_timeout");

const connect = createAction<WebSocket>("connect");
const startConnect = createAsyncThunk("start_connect", async (_, { dispatch }) => {
  const ws = new WebSocket(`ws://${window.location.host}/api/ws`)
  ws.onopen = e => {
    console.log(e);
    // TODO PICK UP FROM HERE
    dispatch(connect(ws));
  }
});

const create = createAsyncThunk<void, void, { state: State }>("create", async (_, { dispatch, getState }) => {
  const { timeouts } = getState();
  timeouts.map(id => clearTimeout(id));
  const response = await fetch(Endpoint.CREATE, {method: "post"});
  if (response.ok) {
    dispatch(startReset());
  }
});

const play = createAsyncThunk<void, GameAction, { state: State }>("play", async (action, { dispatch, getState }) => {
  dispatch(chooseCard(null));
  dispatch(chooseGuess(null));
  dispatch(chooseTarget(null));

  const response = await fetch(`${Endpoint.STEP}/${action.id}`);
  const data = buildGameState(await response.json());
  dispatch(update(data));
  const state = getState();
  const human = getHumanPlayer(state);
  if (!state.gameOver && ((human.active && state.currentPlayer !== human.position) || state.watching)) {
    const tid = setTimeout(() => dispatch(step()), MOVE_DELAY)
    dispatch(registerTimeout(tid))
  }
});

const reset = createAction<GameState>("reset");
const startReset = createAsyncThunk<void, void, { state: State }>("start_reset", async (_, { dispatch, getState }) => {
  // Clear any queued actions
  const { timeouts } = getState();
  timeouts.map(id => clearTimeout(id));

  const response = await fetch(Endpoint.RESET);
  const data = await response.json();
  dispatch(reset(buildGameState(data)));

  // If the first action isn't being taken by the human player, start stepping forward
  const state = getState();
  if (state.currentPlayer !== getHumanPlayer(state).position) {
    const tid = setTimeout(() => dispatch(step()), MOVE_DELAY)
    dispatch(registerTimeout(tid))
  }
});

const step = createAsyncThunk<void, void, { state: State }>("step", async  (_, { dispatch, getState }) => {
  const response = await fetch(Endpoint.STEP);
  const data = buildGameState(await response.json());
  dispatch(update(data));
  const state = getState();
  const human = getHumanPlayer(state);
  if (!state.gameOver && ((human.active && state.currentPlayer !== human.position) || state.watching)) {
    const tid = setTimeout(() => dispatch(step()), MOVE_DELAY);
    dispatch(registerTimeout(tid));
  }
});

const update = createAction<GameState>("update");

const watch = createAction("watch");
const startWatch = createAsyncThunk<void, void, { state: State }>("start_watch", async (_, { dispatch, getState }) => {
  dispatch(watch());
  const { gameOver } = getState();
  if (!gameOver) {
      const tid = setTimeout(() => dispatch(step()), MOVE_DELAY)
      dispatch(registerTimeout(tid))
    }
});

export type AppAction = (
    ChooseCardAction
  | ChooseGuessAction
  | ChooseTargetAction
  | ConnectAction
  | ReconnectAction
  | RegisterTimeoutAction
  | ResetAction
  | UpdateAction
  | WatchAction
)

export default {
  chooseCard,
  chooseGuess,
  chooseTarget,
  connect,
  create,
  play,
  registerTimeout,
  reset,
  startConnect,
  startReset,
  startWatch,
  step,
  update,
  watch,
}
