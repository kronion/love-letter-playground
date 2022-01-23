import classNames from 'classnames'
import React from 'react'
import { connect, ConnectedProps } from 'react-redux'

import Actions from '../../redux/actions'
import { State } from '../../redux/reducer'
import { getChosenCard, getHand, getHumanPlayer, getTargetPlayer } from '../../redux/selectors'
import { Card as CardType } from '../../types'
import Card from '../Card'

import styles from './index.module.scss'
import SelectionWizard from './SelectionWizard'

const mapProps = (state: State) => ({
  chosenCard: getChosenCard(state),
  chosenCardPos: state.chosenCard,
  disabled: state.currentPlayer !== 0,
  hand: getHand(state),
  player: getHumanPlayer(state),
  target: getTargetPlayer(state),
})

const mapDispatch = {
  chooseCard: Actions.chooseCard,
  chooseTarget: Actions.chooseTarget,
}

const connector = connect(mapProps, mapDispatch)

type Props = ConnectedProps<typeof connector>

const PlayerHand: React.FC<Props> = (props) => {
  const classes = [`${styles.PlayerHand}`, {
    [`${styles.active}`]: props.player.active,
    [`${styles.current}`]: !props.disabled,
    [`${styles.out}`]: !props.player.active,
  }]

  return (
    <div className={classNames(classes)}>
      <div className={styles.hand}>
        {props.player.active
          ? props.hand.map((card, pos) => {
            if (card.value !== 0) {
              const selected = pos === props.chosenCardPos;
              const input = (!(props.disabled || selected)) ? pos : null;
              const onClick = () => props.chooseCard(input);

              const passedProps = {
                card,
                disabled: props.disabled,
                onClick,
                selectable: true,
                selected
              }
              return (
                <div key={pos} className={styles.cardContainer}>
                  {selected && <SelectionWizard/>}
                  {!selected && props.chosenCard?.value === CardType.CardValue.PRINCE &&
                    (
                      <div className={styles.targetButton}>
                        {props.target?.position === props.player.position
                          ? <button onClick={() => props.chooseTarget(null)}>Deselect target</button>
                          : <button onClick={() => props.chooseTarget(props.player.position)}>Choose as target</button>
                        }
                      </div>
                    )
                  }
                  <Card {...passedProps}/>
                </div>
              )
            }
          })
          : <Card empty={true}/>
        }
      </div>
      <div className={styles.description}>
        <p className={styles.name}>{props.player.name}</p>
        <div>Wins: {props.player.wins}</div>
      </div>
    </div>
  )
}

export default connector(PlayerHand);
