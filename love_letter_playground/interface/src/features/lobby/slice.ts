import { createSlice, PayloadAction } from '@reduxjs/toolkit'


// TODO make a Game type
interface State {
  games: number[]
}

const initialState: State = { games: [] }

const lobbySlice = createSlice({
  name: 'lobby',
  initialState,
  reducers: {
    update(state, action: PayloadAction<number[]>) {
      state.games = action.payload;
    },
  },
});

export default lobbySlice.reducer;
