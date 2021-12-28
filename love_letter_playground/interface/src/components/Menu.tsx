import React from 'react'
import { connect, ConnectedProps } from 'react-redux'

import Action from '../redux/actions'

const connector = connect(null, { create: Action.create });

type Props = ConnectedProps<typeof connector>

class Menu extends React.Component<Props> {
  render() {
    return (
      <div>
        <button onClick={this.props.create}>Start game</button>
      </div>
    )
  }
}

export default connector(Menu);
