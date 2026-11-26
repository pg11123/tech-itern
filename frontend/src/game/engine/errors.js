// Thrown on engine misuse: illegal action, wrong phase, bad battle config.
// The UI only sends actions from getLegalActions, so players never see these.
export class BattleError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BattleError';
  }
}
