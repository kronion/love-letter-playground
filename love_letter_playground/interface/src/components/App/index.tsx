import React, { useEffect } from 'react'
import { connect, ConnectedProps } from 'react-redux'

import { connect as serverConnect } from '../../redux/actions'
import { State } from '../../redux/reducer'
import Game from '../Game'
import Menu from '../Menu'

import styles from './index.module.scss'


const mapState = (state: State) => ({
  connecting: state.connecting,
  running: state.running
})

const mapDispatch = {
  serverConnect
}

const connector = connect(mapState, mapDispatch)

type Props = ConnectedProps<typeof connector>

const App: React.FC<Props> = props => {
  useEffect(() => {
    if (props.connecting) {
      props.serverConnect()
    }
  }, [props.connecting])

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
