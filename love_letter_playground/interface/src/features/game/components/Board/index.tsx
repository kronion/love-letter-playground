import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { RootState } from 'app/store';
import Deck from 'features/game/components/Deck';
import Play from 'features/game/components/Play';
import { getGameState } from 'features/game/selectors';

import styles from './index.module.scss';

const mapProps = (state: RootState) => ({
  plays: getGameState(state).plays,
});

const connector = connect(mapProps);

type Props = ConnectedProps<typeof connector>;

const Board: React.FC<Props> = (props) => {
  return (
    <div className={styles.Board}>
      <Deck/>
      <div className={styles.plays}>
      {props.plays.map((play, i) => ({play, i})).reverse().map(o => {
          return <Play key={o.i} play={o.play}/>
        })}
      </div>
    </div>
  );
};

export default connector(Board);
