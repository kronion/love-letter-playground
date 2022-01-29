import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { RootState } from 'app/store';

// import styles from './index.module.scss'

const mapProps = (state: RootState) => ({
  games: state.lobby.lobby.games
});

const mapDispatch = {};

const connector = connect(mapProps, mapDispatch);

type Props = ConnectedProps<typeof connector>;

const GameList: React.FC<Props> = (props) => {
  return (
    <div>
      {props.games.length > 0
        ? props.games.map(game => {
          return (
            <p key={game.id}>{game.id}</p>
          )
        })
        : (
          <p>No games found.</p>
        )
      }
    </div>
  )
};

export default connector(GameList);
