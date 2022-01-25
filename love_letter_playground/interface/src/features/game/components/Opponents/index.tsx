import classNames from 'classnames';
import React from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { RootState } from 'app/store';
import Card from 'features/game/components/Card';
import { getChosenCard, getGameState, getTargetPlayer } from 'features/game/selectors';
import { actions } from 'features/game/slice';

import styles from './index.module.scss';

const mapProps = (state: RootState) => {
  const gameState = getGameState(state);

  return ({
    chosenCard: getChosenCard(state),
    currentPlayer: gameState.currentPlayer,
    gameOver: gameState.gameOver,
    players: gameState.players,
    priestInfo: gameState.priestInfo,
    target: getTargetPlayer(state),
  });
};

const mapDispatch = {
  chooseTarget: actions.chooseTarget,
};

const connector = connect(mapProps, mapDispatch);

type Props = ConnectedProps<typeof connector>;

const Opponents: React.FC<Props> = (props) => {
  return (
    <div className={styles.Opponents}>
      {props.players.map((p) => {
        if (p.position > 0) {
          const classes = [`${styles.opponent}`, {
            [`${styles.active}`]: p.active,
            [`${styles.current}`]: p.position === props.currentPlayer,
            [`${styles.out}`]: !p.active,
          }];

          return (
            <div key={p.position} className={classNames(classes)}>
              <div className={styles.hand}>
                {p.active
                  ? props.priestInfo[p.position]
                    ? (
                      <div className={styles.cardWrapper}>
                        <Card card={props.priestInfo[p.position]}/>
                      </div>
                    )
                    : (
                      <div className={styles.cardWrapper}>
                        <Card faceUp={false}/>
                      </div>
                    )
                  : (
                    <div className={styles.cardWrapper}>
                      <Card empty={true}/>
                    </div>
                  )
                }
                {!props.gameOver && p.active && p.position === props.currentPlayer &&
                  <Card faceUp={false}/>
                }
              </div>
              <div className={styles.description}>
                <p className={styles.name}>{p.name}</p>
                <div>Wins: {p.wins}</div>
              </div>
              {props.chosenCard?.hasTarget() && p.active && !p.safe &&
                (
                  props.target?.position === p.position
                    ? <button onClick={() => props.chooseTarget(null)}>Deselect target</button>
                    : <button onClick={() => props.chooseTarget(p.position)}>Choose as target</button>
                )
              }
            </div>
          );
        }
      })}
    </div>
  );
};

export default connector(Opponents);
