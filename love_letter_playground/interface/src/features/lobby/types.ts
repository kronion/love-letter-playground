export class GameSettings {
  private MIN_PLAYERS = 2;
  private MAX_PLAYERS = 4;

  private _numPlayers: number = this.MIN_PLAYERS;

  get numPlayers() {
    return this._numPlayers;
  }

  set numPlayers(players: number) {
    if (players <= this.MIN_PLAYERS) {
      throw new Error(`At least ${this.MIN_PLAYERS} required`)
    } else if (players >= this.MAX_PLAYERS) {
      throw new Error(`At most ${this.MAX_PLAYERS} allowed`)
    }
    this._numPlayers = players;
  }
}
