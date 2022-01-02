import { createAction, createAsyncThunk } from '@reduxjs/toolkit'

import { buildGameState, Endpoint } from '../api'
import { Card, GameAction, GameState, Player } from '../types'
import { State } from './reducer'
import { getHumanPlayer } from './selectors'

const MOVE_DELAY = 2500

const chooseCard = createAction<Card | null>("choose_card");

const chooseGuess = createAction("choose_guess", (guessId: number | null) => {
  const guess = guessId ? new Card(guessId) : null
  return {
    payload: guess
  }
});

const chooseTarget = createAction<Player | null>("choose_target")

type Timeout = ReturnType<typeof setTimeout>
const registerTimeout = createAction<Timeout>("register_timeout");

const create = createAsyncThunk<void, void, { state: State }>("create", async (_, { dispatch, getState }) => {
  const { timeouts } = getState();
  timeouts.map(id => clearTimeout(id));
  dispatch(socketSend({action: "CREATE"}));
  // const response = await fetch(Endpoint.CREATE, {method: "post"});
  // if (response.ok) {
  //   dispatch(startReset());
  // }
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

const socketConnected = createAction("socket_connected");
const socketReceive = data => {
  console.log(data);
};
const socketSend = createAction<object>("socket_send");

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

export default {
  chooseCard,
  chooseGuess,
  chooseTarget,
  create,
  play,
  registerTimeout,
  reset,
  socketConnected,
  socketReceive,
  socketSend,
  startReset,
  startWatch,
  step,
  update,
  watch,
}
