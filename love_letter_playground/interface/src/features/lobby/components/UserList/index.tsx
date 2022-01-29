import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { RootState } from 'app/store';

import styles from './index.module.scss'

const mapProps = (state: RootState) => ({
  lobby: state.lobby.lobby
});

const connector = connect(mapProps);

type Props = ConnectedProps<typeof connector>;

const UserList: React.FC<Props> = (props) => {
  return (
    <div className={styles.UserList}>
      {props.lobby.users.map(user => {
        return (
          <p key={user.id}>User {user.id}</p>
        )
      })}
    </div>
  )
};

export default connector(UserList);
