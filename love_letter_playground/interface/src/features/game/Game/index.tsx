import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { actions } from '../slice';
import Board from '../components/Board';
import GameStatus from '../components/GameStatus';
import Opponents from '../components/Opponents';
import PlayerHand from '../components/PlayerHand';

import styles from './index.module.scss'

const mapDispatch = {
  reset: actions.sendReset,
}

const connector = connect(null, mapDispatch)

type Props = ConnectedProps<typeof connector>

const Game: React.FC<Props> = (props) => {
  return (
    <div className={styles.Game}>
      <button onClick={() => props.reset()}>Reset</button>
      <Opponents/>
      <Board/>
      <PlayerHand/>
      <GameStatus/>
    </div>
  )
}

export default connector(Game);
