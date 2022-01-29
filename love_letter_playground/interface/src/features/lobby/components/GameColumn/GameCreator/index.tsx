import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { RootState } from 'app/store';
import { actions } from 'features/lobby/slice';

// import styles from './index.module.scss'

const mapState = (state: RootState) => ({
  creatingGame: state.lobby.newGameSettings !== null
});

const mapDispatch = {
  startCreation: actions.createGame,
  create: actions.sendCreate
}

const connector = connect(mapState, mapDispatch);

type Props = ConnectedProps<typeof connector>

const GameCreator: React.FC<Props> = (props) => {
  return (
    <div>
      <button onClick={props.startCreation}>Create game</button>
      {props.creatingGame && (
        <div>
          <label># of Players</label>
          {/* Don't pass event to redux-toolkit's AsyncThunk. */}
          {/* This avoids an error from reusing synthetic events after they've been released. */}
          <button onClick={() => props.create()}>Create game</button>
        </div>
      )}
    </div>
  )
};

export default connector(GameCreator);
