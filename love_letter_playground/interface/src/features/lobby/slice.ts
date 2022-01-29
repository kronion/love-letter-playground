import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { actions as socketActions } from 'app/socket/slice';
import { GameSettings } from 'features/lobby/types';

import { Lobby } from 'types';


// TODO make a Game type
interface State {
  lobby: Lobby
  newGameSettings: GameSettings | null
};

const initialState: State = {
  lobby: {
    games: [],
    users: []
  },
  newGameSettings: null,
};

const lobbySlice = createSlice({
  name: 'lobby',
  initialState,
  reducers: {
    setNumPlayers(state, action: PayloadAction<number>) {
      if (state.newGameSettings !== null) {
        state.newGameSettings.numPlayers = action.payload;
      }
    },
    createGame(state) {
      state.newGameSettings = new GameSettings();
    },
    update(state, action: PayloadAction<Lobby>) {
      state.lobby = action.payload;
    },
  },
});

const sendCreate = createAsyncThunk<void, void, { state: State }>("create", async (_, { dispatch }) => {
  dispatch(socketActions.send({operation: "create"}));
});

export const actions = {
  ...lobbySlice.actions,
  sendCreate,
};
export const reducer = lobbySlice.reducer;
