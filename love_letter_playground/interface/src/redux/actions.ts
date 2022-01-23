import { createAction, createAsyncThunk } from '@reduxjs/toolkit'

import { CardId, CardPosition, GameAction, GameState, PlayerPosition, RawApiGameState } from '../types'
import { State } from './reducer'

const chooseCard = createAction<CardPosition | null>("choose_card");
const chooseGuess = createAction<CardId | null>("choose_guess");
const chooseTarget = createAction<PlayerPosition | null>("choose_target")

const sendCreate = createAsyncThunk<void, void, { state: State }>("create", async (_, { dispatch }) => {
  dispatch(socketSend({operation: "create"}));
});

const play = createAsyncThunk<void, GameAction, { state: State }>("play", async (action, { dispatch }) => {
  dispatch(chooseCard(null));
  dispatch(chooseGuess(null));
  dispatch(chooseTarget(null));
  dispatch(socketSend({operation: "step", action_id: action.id }))
});

const reset = createAction<RawApiGameState>("reset");
const sendReset = createAsyncThunk("send_reset", async (_, { dispatch }) => {
  dispatch(socketSend({operation: "reset"}));
});

const socketConnected = createAction("socket_connected");
const socketReceive = (data, dispatch) => {
  if (data.operation === "create") {
    if (data.status === 201) {
      let gameData = data.data;
      dispatch(reset(gameData));
    }
  }
  else if (data.operation === "reset") {
    let gameData = data.data;
    dispatch(reset(gameData));
  }
  else if (data.operation === "status") {
    let gameData = data.data;
    if (gameData !== null) {
      dispatch(reset(gameData));
    }
  }
  else if (data.operation === "step") {
    let gameData = data.data;
    dispatch(update(gameData));
  }
  else {
    throw Error("operation not recognized");
  }
};
const socketSend = createAction<object>("socket_send");

const update = createAction<GameState>("update");

const watch = createAction("watch");

export default {
  chooseCard,
  chooseGuess,
  chooseTarget,
  play,
  reset,
  sendCreate,
  sendReset,
  socketConnected,
  socketReceive,
  socketSend,
  update,
  watch,
}
