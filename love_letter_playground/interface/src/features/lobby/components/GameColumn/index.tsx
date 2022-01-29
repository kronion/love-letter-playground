import React from 'react';

import GameCreator from 'features/lobby/components/GameColumn/GameCreator';
import GameList from 'features/lobby/components/GameColumn/GameList';

import styles from './index.module.scss';

const GameColumn = () => {
  return (
    <div className={styles.GameColumn}>
      <GameCreator />
      <GameList />
    </div>
  )
};

export default GameColumn;
