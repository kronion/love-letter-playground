import { configureStore, createReducer } from '@reduxjs/toolkit';
// import { current } from 'immer'

import { Card, GameState, Player } from '../types';
import Actions from './actions';
import { createSocketMiddleware } from './middleware';


export interface State extends GameState {
  chosenCard: Card | null
  connecting: boolean
  guess: Card | null
  players: Player[]
  running: boolean
  target: Player | null
  timeouts: ReturnType<typeof setTimeout>[]
  watching: boolean
}

const initialState: State = {
  chosenCard: null,
  connecting: true,
  guess: null,
  running: false,
  target: null,
  timeouts: [],

  cardsRemaining: 0,
  currentPlayer: null,
  discard: [],
  gameOver: false,
  hand: [],
  players: [],
  plays: [],
  priestInfo: [],
  validActions: [],
  watching: false,
  winners: [],
}

export const store = configureStore({
  reducer: createReducer(initialState, (builder) => {
    builder
      .addCase(Actions.chooseCard, (state, action) => {
        state.chosenCard = action.payload;
      })
      .addCase(Actions.chooseGuess, (state, action) => {
        state.guess = action.payload;
      })
      .addCase(Actions.chooseTarget, (state, action) => {
        state.target = action.payload;
      })
      .addCase(Actions.registerTimeout, (state, action) => {
        state.timeouts.push(action.payload)
      })
      .addCase(Actions.reset, (state, action) => {
        state = {
          ...initialState,
          ...action.payload,
          players: action.payload.players.map(p => {
            const { wins, ...rest } = p
            return {...rest, wins: state.players[p.position]?.wins ?? wins} as Player
          }),
          running: true
        }
        return state;
      })
      .addCase(Actions.socketConnected, (state) => {
        state.connecting = false;
      })
      .addCase(Actions.update, (state, action) => {
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
      })
      .addCase(Actions.watch, (state) => {
        state.watching = true;
      });
  }),
  middleware: getDefaultMiddleware => {
    const socketMiddleware = createSocketMiddleware(`ws://${window.location.host}/api/ws`);
    return getDefaultMiddleware().concat(socketMiddleware);
  }
});

export default store;
