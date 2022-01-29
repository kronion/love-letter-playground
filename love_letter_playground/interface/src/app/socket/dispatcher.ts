// This isn't in the same module as the rest of the slice
// in order to avoid a cyclical dependency.

import { actions as gameActions } from 'features/game/slice';
import { actions as lobbyActions } from 'features/lobby/slice';

export default (data, dispatch) => {
  console.log(data);
  if (data.operation === "create") {
    if (data.status === 201) {
      let gameData = data.data;
      dispatch(gameActions.reset(gameData));
    }
  }
  else if (data.operation === "lobby") {
    dispatch(lobbyActions.update(data.data));
  }
  else if (data.operation === "reset") {
    let gameData = data.data;
    dispatch(gameActions.reset(gameData));
  }
  else if (data.operation === "status") {
    let gameData = data.data;
    if (gameData !== null) {
      dispatch(gameActions.reset(gameData));
    }
  }
  else if (data.operation === "step") {
    let gameData = data.data;
    dispatch(gameActions.update(gameData));
  }
  else {
    throw Error("operation not recognized");
  }
};
