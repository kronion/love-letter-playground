import React from 'react'
import { connect, ConnectedProps } from 'react-redux'

import { actions } from 'features/game/slice';

const connector = connect(null, { create: actions.sendCreate });

type Props = ConnectedProps<typeof connector>

class Lobby extends React.Component<Props> {
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

export default connector(Lobby);
