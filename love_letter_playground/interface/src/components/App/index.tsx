import React from 'react'
import { connect, ConnectedProps } from 'react-redux'

import { State } from '../../redux/reducer'
import Game from '../Game'
import Menu from '../Menu'

import styles from './index.module.scss'


const mapState = (state: State) => ({
  connecting: state.connecting,
  running: state.running
})

const connector = connect(mapState)

type Props = ConnectedProps<typeof connector>

const App: React.FC<Props> = props => {
  console.log(props);
  return (
    <div className={styles.App}>
    {props.connecting
      ? null
      : (
        props.running
          ? <Game />
          : <Menu />
        )
      }
    </div>
  )
}

export default connector(App);
