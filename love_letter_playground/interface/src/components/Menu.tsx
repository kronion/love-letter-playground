import React from 'react'
import { connect, ConnectedProps } from 'react-redux'

import { create } from '../redux/actions'

const connector = connect(null, { create })

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
