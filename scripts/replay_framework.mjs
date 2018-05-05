import { frameHandlers } from './replay_frames.mjs';

const isMultiplayer = true;

// Gross, but we need Player accessible to Function objects
const globalObject = typeof window != 'undefined' ? window :
  typeof global != 'undefined' ? global :
    typeof WorkerGlobalScope != 'undefined' ? WorkerGlobalScope :
      this;

globalObject.currentTick = 0;
globalObject.Player = class {
  constructor(name, tick = globalObject.currentTick) {
    this.name = name;
    this.tick = tick;
    if (initializedServer) {
      serverPlayer.tick = tick;
      serverPlayer.act(`AddPlayer ${name}`);
    }
  }
};

for (let frameHandler of frameHandlers) {
  const methodName = `${frameHandler[1][0].toLowerCase()}${frameHandler[1].substring(1)}`.replace('?', '_');
  globalObject.Player.prototype[methodName] = function (...theArgs) {
    const argString = theArgs.join(', ');
    this.act(`${frameHandler[1]}${argString == '' ? '' : ` ${argString}`}`);
  };
}

let initializedServer = false;
const serverPlayer = new Player(isMultiplayer ? '65535' : '255');
initializedServer = true;

globalObject.Player.prototype.act = function (action) {
  const frameText = `@${this.tick}(${this.name}): ${action}`;
  globalObject.dispatchEvent(new CustomEvent('frame', { detail: frameText }));
};

const parseReplayJs = (text) => {
  globalObject.currentTick = 0;
  serverPlayer.tick = 0;
  serverPlayer[`join${isMultiplayer ? 'Multi' : 'Single'}Player`]();
  new Function(text)();
};

export { parseReplayJs };
