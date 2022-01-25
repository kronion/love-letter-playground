import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { RootState } from 'app/store';
import { getGameState, getHumanPlayer } from 'features/game/selectors';
import { actions } from 'features/game/slice';

import styles from './index.module.scss';

const mapState = (state: RootState) => {
  const gameState = getGameState(state);

  return {
    gameOver: gameState.gameOver,
    playerOut: !getHumanPlayer(state).active,
    watching: gameState.watching
  };
};

const mapDispatch = {
  reset: actions.sendReset,
  watch: actions.watch,
};

const connector = connect(mapState, mapDispatch);

type Props = ConnectedProps<typeof connector>;

const GameStatus: React.FC<Props> = (props) => {
  const display = (props.gameOver || props.playerOut) && !props.watching;

  if (display) {
    return (
      <>
        <div className={styles.Overlay}/>
        <div className={styles.GameStatus} onClick={props.watch}>
          <div className={styles.gameOverMenu} onClick={(e) => {
            e.stopPropagation()
          }}>
            <h1 className={styles.announcement}>{props.playerOut ? 'DEFEAT' : 'VICTORY'}</h1>
            <div>
              <button onClick={() => props.watch()}>{props.gameOver ? 'Review' : 'Continue watching'} Game</button>
              <button onClick={() => props.reset()}>New game</button>
            </div>
          </div>
        </div>
      </>
    );
  }
  else {
    return null;
  }
};

export default connector(GameStatus);
