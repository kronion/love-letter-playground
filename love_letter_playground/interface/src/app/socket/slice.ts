import { createAction, createSlice } from '@reduxjs/toolkit';

interface State {
  connecting: boolean
}

const initialState: State = {
  connecting: true
}

const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    socketConnected: (state) => {
      state.connecting = false;
    },
  },
});

const send = createAction<object>("socket_send");

export const actions = {
  ...socketSlice.actions,
  send,
}

export const reducer = socketSlice.reducer;
