import React from 'react'
import { connect, ConnectedProps } from 'react-redux'

import Action from '../redux/actions'

const connector = connect(null, { create: Action.sendCreate });

type Props = ConnectedProps<typeof connector>

class Menu extends React.Component<Props> {
  render() {
    return (
      <div>
        {/* Don't pass event to redux-toolkit's AsyncThunk. */}
        {/* This avoids an error from reusing synthetic events after they've been released. */}
        <button onClick={() => this.props.create()}>Start game</button>
      </div>
    )
  }
}

export default connector(Menu);
