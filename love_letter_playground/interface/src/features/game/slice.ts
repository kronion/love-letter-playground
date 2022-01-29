import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
// import { current } from 'immer'

import { actions as socketActions } from 'app/socket/slice';
import { CardId, CardPosition, GameAction, PlayerPosition, Player, RawApiGameState } from 'types';


// TODO add storage of player wins across games
interface State extends RawApiGameState {
  chosenCard: CardPosition | null
  connecting: boolean
  guess: CardId | null
  running: boolean
  target: PlayerPosition | null
  watching: boolean
};

const initialState: State = {
  chosenCard: null,
  connecting: true,
  guess: null,
  running: false,
  target: null,
  watching: false,

  cardsRemaining: 0,
  currentPlayer: null,
  discard: [],
  gameOver: false,
  hand: [],
  players: [],
  plays: [],
  priestInfo: [],
  validActions: [],
  winners: [],
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    chooseCard: (state, action: PayloadAction<CardPosition | null>) => {
      state.chosenCard = action.payload;
    },
    chooseGuess: (state, action: PayloadAction<CardId | null>) => {
      state.guess = action.payload;
    },
    chooseTarget: (state, action: PayloadAction<PlayerPosition | null>) => {
      state.target = action.payload;
    },
    reset: (state, action: PayloadAction<RawApiGameState>) => {
      state = {
        ...initialState,
        ...action.payload,
        connecting: false,
        running: true
      }
      return state;
    },
    socketConnected: (state) => {
      state.connecting = false;
    },
    update: (state, action: PayloadAction<RawApiGameState>) => {
      state = {
        ...state,
        ...action.payload,
        players: action.payload.players.map(p => {
          const { wins, ...rest } = p
          return {...rest, wins: state.players[p.position].wins} as Player
        })
      }
      for (const winner of state.winners) {
        state.players[winner].wins += 1
      }
      return state
    },
    watch: (state) => {
      state.watching = true;
    },
  },
});

const play = createAsyncThunk<void, GameAction, { state: State }>("play", async (action, { dispatch }) => {
  dispatch(gameSlice.actions.chooseCard(null));
  dispatch(gameSlice.actions.chooseGuess(null));
  dispatch(gameSlice.actions.chooseTarget(null));
  dispatch(socketActions.send({operation: "step", action_id: action.id }))
});

const sendCreate = createAsyncThunk<void, void, { state: State }>("create", async (_, { dispatch }) => {
  dispatch(socketActions.send({operation: "create"}));
});

const sendReset = createAsyncThunk("send_reset", async (_, { dispatch }) => {
  dispatch(socketActions.send({operation: "reset"}));
});

export const actions = {
  ...gameSlice.actions,
  play,
  sendCreate,
  sendReset,
};

export const reducer = gameSlice.reducer;
