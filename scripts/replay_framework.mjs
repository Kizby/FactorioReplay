import { frameHandlers } from './replay_frames.mjs';

const isMultiplayer = true;

// Gross, but we need Player accessible to Function objects
const globalObject = window || global || WorkerGlobalScope;

globalObject.currentTick = 0;
globalObject.Player = class {
  constructor(name, tick = globalObject.currentTick) {
    this.name = name;
    this.tick = tick;
    if (initializedServer) {
      serverPlayer.tick = tick;
      globalObject.act(serverPlayer, `AddPlayer ${name}`);
    }
  }
};

for (let frameHandler of frameHandlers) {
  const methodName = `${frameHandler[1][0].toLowerCase()}${frameHandler[1].substring(1)}`.replace('?', '_');
  globalObject.Player.prototype[methodName] = function (...theArgs) {
    const argString = theArgs.join(', ');
    const actionString = `${frameHandler[1]}${argString == '' ? '' : ` ${argString}`}`;
    globalObject.act(this, actionString);
  };
}

let initializedServer = false;
const serverPlayer = new Player(isMultiplayer ? '65535' : '255');
initializedServer = true;

globalObject.act = (player, action) => {
  const frameText = `@${player.tick}(${player.name}): ${action}`;
  globalObject.dispatchEvent(new CustomEvent('frame', { detail: frameText }));
};

const parseReplayJs = (text) => {
  globalObject.act(serverPlayer, `Start${isMultiplayer ? 'Multi' : 'Single'}Player`);
  new Function(text)();
};

export { parseReplayJs };
