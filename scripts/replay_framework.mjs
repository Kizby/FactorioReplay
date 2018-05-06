import { frameHandlers } from './replay_frames.mjs';

const isMultiplayer = true;

// Gross, but we need Player accessible to Function objects
const globalObject = typeof window != 'undefined' ? window :
  typeof global != 'undefined' ? global :
    typeof WorkerGlobalScope != 'undefined' ? WorkerGlobalScope :
      this;

let warnedAboutNegativeTicks = false;

// All positions are game coordinates, all speeds are tiles per tick
let nextPlayerId = 0;
globalObject.currentTick = 0;
globalObject.Player = class {
  constructor(name, tick = globalObject.currentTick) {
    this.name = name;
    this.id = nextPlayerId++;
    this._tick = tick;
    this.position = [0, 0];
    this.velocity = [0, 0];
    this.runSpeed = 0.15;
    if (initializedServer) {
      serverPlayer.tick = tick;
      serverPlayer.act(`AddPlayer ${name}`);
    }
  }

  get tick() {
    return this._tick;
  }
  set tick(newTick) {
    if (!warnedAboutNegativeTicks && newTick < this._tick) {
      console.warn(`Reducing player tick from ${this._tick} to ${newTick} - position information can no longer be guanteed valid`);
    }
    this.position[0] += (newTick - this._tick) * this.velocity[0];
    this.position[1] += (newTick - this._tick) * this.velocity[1];
    this._tick = newTick;
  }
};

for (const frameHandler of frameHandlers) {
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
  nextPlayerId = 0;
  globalObject.currentTick = 0;
  serverPlayer.tick = 0;
  serverPlayer[`join${isMultiplayer ? 'Multi' : 'Single'}Player`]();
  new Function(text)();
};

export { parseReplayJs };

//////////////////////////////////////
//                                  //
//  Useful functions and overrides  //
//                                  //
//////////////////////////////////////

// Round toward zero to the next tetrakibitile
globalObject.roundToFixed = (num) => {
  return Math[num > 0 ? 'floor' : 'ceil'](num * 256) / 256;
}

// Override run to update velocity vector
const directionToVector = {
  'N': [0, -1],
  'NW': [-Math.sqrt(2) / 2, -Math.sqrt(2) / 2],
  'W': [1, 0],
  'SW': [-Math.sqrt(2) / 2, Math.sqrt(2) / 2],
  'S': [0, 1],
  'SE': [Math.sqrt(2) / 2, Math.sqrt(2) / 2],
  'E': [-1, 0],
  'NE': [Math.sqrt(2) / 2, -Math.sqrt(2) / 2],
};
globalObject.Player.prototype._run = globalObject.Player.prototype.run;
globalObject.Player.prototype.run = function (dir) {
  if (!directionToVector.hasOwnProperty(dir)) {
    console.error(`Player.run called with invalid direction ${dir}`);
    return;
  }
  this.velocity[0] = roundToFixed(directionToVector[dir][0] * this.runSpeed);
  this.velocity[1] = roundToFixed(directionToVector[dir][1] * this.runSpeed);
  this._run(dir);
};

globalObject.Player.prototype._stopRunning = globalObject.Player.prototype.stopRunning;
globalObject.Player.prototype.stopRunning = function () {
  this.velocity = [0, 0];
  this._stopRunning();
}

globalObject.Player.prototype.print = function (str) {
  this.chat(`/c game.players[1].print(${str})`)
};

globalObject.Player.prototype.checkPosition = function () {
  this.print(`"Checking position - expected: {${this.position[0]}, ${this.position[1]}}"`);
  this.print(`"----------------------actual: {" .. game.players[${this.id + 1}].character.position.x .. ", " .. game.players[${this.id + 1}].character.position.y .. "}"`);
};


// Calculate player starting positions
const startingPositions = (() => {
  const result = [];
  // Fails starting at player 49
  // Feel free to add more logic to handle higher player counts :)
  const blocked = new Set();
  for (let i = 0; i < 49; i++) {
    let pos = [0, 0];
    if (blocked.has(pos.toString())) {
      layers:
      for (let layer = 1; ; layer++) {
        // NW Corner
        pos = [-layer, -layer];
        if (!blocked.has(pos.toString())) {
          break;
        }
        // SW Corner
        pos = [-layer, layer];
        if (!blocked.has(pos.toString())) {
          break;
        }
        // NE Corner
        pos = [layer, -layer];
        if (!blocked.has(pos.toString())) {
          break;
        }

        // Edges
        for (let offset = 1; offset < 2 * layer; offset += 1) {
          // N Edge
          pos = [-layer + offset, -layer];
          if (!blocked.has(pos.toString())) {
            break layers;
          }
          // S Edge
          pos = [-layer + offset, layer];
          if (!blocked.has(pos.toString())) {
            break layers;
          }
          // W Edge
          pos = [-layer, -layer + offset];
          if (!blocked.has(pos.toString())) {
            break layers;
          }
          // E Edge
          pos = [layer, -layer + offset];
          if (!blocked.has(pos.toString())) {
            break layers;
          }
        }

        // SE Corner
        pos = [layer, layer];
        if (!blocked.has(pos.toString())) {
          break;
        }
      }
    }
    const realX = roundToFixed(pos[0] * 0.2);
    const realY = roundToFixed(pos[1] * 0.2);
    result[i] = [realX, realY];
    for (let j = -2; j <= 2; j++) {
      for (let k = -2; k <= 2; k++) {
        const maybeBlocked = [pos[0] + j, pos[1] + k];
        const realDeltaX = Math.abs(realX - roundToFixed(maybeBlocked[0] * 0.2));
        const realDeltaY = Math.abs(realY - roundToFixed(maybeBlocked[1] * 0.2));
        //console.log("Testing " + realDeltaX + ", " + realDeltaY + ": " );
        // Player radius for collision is 0.4 tiles
        if (realDeltaX < 0.4 && realDeltaY < 0.4) {
          if (blocked.add(maybeBlocked.toString())) {
            //console.log(maybeBlocked + " blocked by " + pos);
          }
        }
      }
    }
  }
  return result;
})();

globalObject.spawnPlayers = (nameList) => {
  const players = [];
  if (nameList.length > startingPositions.length) {
    console.warn(`Spawning too many (${nameList.length}) players at once - only have calculated start positions for the first ${startingPositions.length}`);
  }
  for (let i = 0; i < nameList.length && i < startingPositions.length; i++) {
    players[i] = new Player(nameList[i]);
    players[i].position = [startingPositions[i][0], startingPositions[i][1]];
  }
  return players;
}