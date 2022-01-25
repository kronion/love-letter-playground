import { createSelector } from 'reselect'

import { RootState } from 'app/store';
import { State as GameState } from 'features/game/slice';
import { Card, GameAction, Play, Player, PriestInfo, RawApiGameAction, RawApiPlay, RawApiPlayer, RawApiPriestInfo } from 'types';


export const getGameReducerState = (state: RootState): GameState => {
  return state.game;
}

const buildGameAction = (data: RawApiGameAction): GameAction => {
  return {
    card: new Card(data.card),
    guess: data.guess ? new Card(data.guess) : null,
    id: data.id,
    target: data.target
  }
}

const buildPlay = (data: RawApiPlay): Play => {
  return {
    action: buildGameAction(data.action),
    player: data.player,
    discard: data.discard ? new Card(data.discard) : null,
    discardingPlayer: data.discardingPlayer
  }
}

const buildPlayer = (data: RawApiPlayer): Player => {
  return {
    active: data.active,
    hand: data.hand?.map(cardId => new Card(cardId)),
    name: data.name,
    position: data.position,
    safe: data.safe,
    wins: 0
  }
}

const buildPriestInfo = (data: RawApiPriestInfo): PriestInfo => {
  const newData: {[key: number]: Card} = {}
  for (const [key, value] of Object.entries(data)) {
    newData[Number.parseInt(key)] = new Card(value)
  }
  return newData
}

export const getGameState = createSelector([ getGameReducerState ], (state) => {
  return {
    cardsRemaining: state.cardsRemaining,
    chosenCard: state.chosenCard,
    currentPlayer: state.currentPlayer,
    discard: state.discard.map(cardId => new Card(cardId)),
    gameOver: state.gameOver,
    guess: state.guess ? new Card(state.guess) : null,
    hand: state.hand.map(cardId => new Card(cardId)),
    players: state.players.map(player => buildPlayer(player)),
    plays: state.plays.map(play => buildPlay(play)),
    priestInfo: buildPriestInfo(state.priestInfo),
    target: state.target,
    validActions: state.validActions.map(action => buildGameAction(action)),
    watching: state.watching,
    winners: state.winners
  }
});

const getGuessId = createSelector([ getGameReducerState ], (state) => state.guess);
const getTargetPosition = createSelector([ getGameReducerState ], (state) => state.target);

const getActions = createSelector([ getGameState ], (state) => state.validActions);
export const getChosenCard = createSelector([ getGameState ], (state) => {
  return (state.chosenCard !== null) ? state.hand[state.chosenCard] : null;
});
export const getHand = createSelector([ getGameState ], (state) => state.hand);
const players = createSelector([ getGameState ], (state) => state.players);

export const getChosenGameAction = createSelector(
  [ getActions, getChosenCard, getGuessId, getTargetPosition ],
  (actions, card, guessId, targetPos) => {
    return actions.find(action => {
      const actionGuess = action.guess?.value ?? null;
      return action.card.value === card?.value && actionGuess === guessId && action.target === targetPos;
    });
  }
)

export const getHumanPlayer = createSelector(
  [ players ],
  (players) => {
    return players[0]
  }
)
export const getTargetPlayer = createSelector([ getGameState ], (state) => {
  return state.target ? state.players[state.target] : null;
});

export const validTargetsExist = createSelector(
  [ getChosenCard, players ],
  (chosenCard, players) => {
    if (!chosenCard?.hasTarget()) {
      return false
    }

    let validPlayers = players
    if (chosenCard.value !== Card.CardValue.PRINCE) {
      validPlayers = players.filter(p => p.position !== 0)
    }

    return validPlayers.some(p => p.active && !p.safe)
  }
)

