import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { RootState } from '../../app/store';
import Game from '../../features/game/Game';
import Lobby from '../../features/lobby/Lobby';

import styles from './index.module.scss';


const mapState = (state: RootState) => ({
  connecting: state.socket.connecting,
  running: state.game.running
});

const connector = connect(mapState);

type Props = ConnectedProps<typeof connector>;

const App: React.FC<Props> = props => {
  console.log(props);
  return (
    <div className={styles.App}>
    {props.connecting
      ? null
      : (
        props.running
          ? <Game />
          : <Lobby />
        )
      }
    </div>
  )
};

export default connector(App);
