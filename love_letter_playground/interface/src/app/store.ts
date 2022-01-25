import { configureStore } from '@reduxjs/toolkit';

import { createSocketMiddleware } from 'app/socket/middleware';
import { reducer as socketReducer } from 'app/socket/slice';
import lobbyReducer from 'features/lobby/slice';
import { reducer as gameReducer} from 'features/game/slice';


export const store = configureStore({
  reducer: {
    game: gameReducer,
    lobby: lobbyReducer,
    socket: socketReducer,
  },
  middleware: getDefaultMiddleware => {
    const socketMiddleware = createSocketMiddleware(`ws://${window.location.host}/api/ws`);
    return getDefaultMiddleware().concat(socketMiddleware);
  }
});

export default store;

// Infer the `RootState` type from the store itself
export type RootState = ReturnType<typeof store.getState>
