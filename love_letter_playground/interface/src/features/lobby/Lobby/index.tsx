import React from 'react';

import GameColumn from 'features/lobby/components/GameColumn';
import UserList from 'features/lobby/components/UserList';

import styles from './index.module.scss'

const Lobby = () => {
  return (
    <div className={styles.Lobby}>
      <GameColumn />
      <UserList />
    </div>
  )
};

export default Lobby;
