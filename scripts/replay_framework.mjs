import { frameHandlers } from './replay_frames.mjs';
import { idMaps } from './id_maps.mjs';
import { recipes } from './recipes.mjs';

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
    this.selection = [0, 0];
    this.cursorSlot = -1;
    this.cursorStack = undefined;
    this.inventory = [{ name: 'iron-plate', amount: 8 }, { name: 'wood', amount: 1 }, { name: 'burner-mining-drill', amount: 1 }, { name: 'stone-furnace', amount: 1 }];
    this.craftEndTick = -1;
    this.scheduledActions = {};
    if (initializedServer) {
      serverPlayer.tick = tick;
      serverPlayer.act(`AddPlayer ${name}`);
    }
  }

  get tick() {
    return this._tick;
  }
  set tick(newTick) {
    if (newTick == this._tick) {
      // Nothing to do
      return;
    }
    if (this != serverPlayer) {
      if (newTick < this._tick) {
        if (!warnedAboutNegativeTicks) {
          console.warn(`Reducing player tick from ${this._tick} to ${newTick} - position/inventory information can no longer be guanteed valid`);
        }
      } else {
        for (let i = this._tick + 1; i <= newTick; ++i) {
          if (this.scheduledActions[i]) {
            doTickUpdate(this, i);
            for (const action of this.scheduledActions[i]) {
              action();
            }
            delete this.scheduledActions[i];
          }
        }
      }
    }
    doTickUpdate(this, newTick);
  }
};

const sortInventory = (player) => {
  player.inventory.sort((a, b) => {
    let result = idMaps.item[a.name] - idMaps.item[b.name];
    if (result != 0) {
      return result;
    }
    return b.amount - a.amount;
  });
};

const doTickUpdate = (player, newTick) => {
  player.position[0] += (newTick - player._tick) * player.velocity[0];
  player.position[1] += (newTick - player._tick) * player.velocity[1];
  if (-1 != player.cursorSlot) {
    // The cursorSlot item doesn't get sorted
    const currentCursorStack = player.inventory.splice(player.cursorSlot, 1)[0];
    if (currentCursorStack != player.cursorStack) {
      console.warn(`cursorStack/cursorSlot mismatch!? cursorStack claims ${player.cursorStack} but cursorSlot (${player.cursorSlot}) claims ${currentCursorStack}`)
    };
  }
  for (let i = 0; i < player.inventory.length; ++i) {
    if (player.inventory[i].amount === 0) {
      if (player.cursorSlot == i) {
        player.cursorSlot = -1;
        player.cursorStack = undefined;
      }
      player.inventory.splice(i, 1);
      --i;
    }
  }
  sortInventory(player);
  if (-1 != player.cursorSlot) {
    player.inventory.splice(player.cursorSlot, 0, player.cursorStack);
  }
  player._tick = newTick;
};

globalObject.Player.prototype.schedule = function (tick, action) {
  if (tick < this.tick) {
    console.warn(`Can't schedule an action for the past! ${tick} < ${this.tick}`);
    return;
  }
  if (tick === this.tick) {
    // Just do it now, I guess
    action();
    return;
  }
  if (this.scheduledActions[tick] === undefined) {
    this.scheduledActions[tick] = [];
  }
  this.scheduledActions[tick].push(action);
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
  'W': [-1, 0],
  'SW': [-Math.sqrt(2) / 2, Math.sqrt(2) / 2],
  'S': [0, 1],
  'SE': [Math.sqrt(2) / 2, Math.sqrt(2) / 2],
  'E': [1, 0],
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

globalObject.Player.prototype.checkInventory = function (str) {
  this.print(`"Checking inventory - expected: {${this.inventory.reduce((a, b) => a + `${b.name}: ${b.amount}, `, '')}}"`);
  this.print(`"-----------------------actual:"`);
  this.chat("/c for item, count in pairs(game.player.get_inventory(1).get_contents()) do game.player.print(item .. \": \" .. count) end");
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
};

globalObject.Player.prototype.runTo = function (targetPos) {
  const delta = [targetPos[0] - this.position[0], targetPos[1] - this.position[1]];
  const absDelta = [Math.abs(delta[0]), Math.abs(delta[1])];
  const targetIsEast = delta[0] > 0;
  const targetIsSouth = delta[1] > 0;
  if (absDelta[0] > this.runSpeed && absDelta[1] > this.runSpeed) {
    // It's worth running diagonally to get closer
    const orthDistance = Math.min(absDelta[0], absDelta[1]);
    const orthStep = roundToFixed(this.runSpeed * Math.sqrt(2) / 2);
    const diagTicks = Math.floor(orthDistance / orthStep);
    this.run(`${targetIsSouth ? 'S' : 'N'}${targetIsEast ? 'E' : 'W'}`);
    this.tick += diagTicks;

    // Update deltas for any remaining movement
    delta[0] = targetPos[0] - this.position[0];
    delta[1] = targetPos[1] - this.position[1];
    absDelta[0] = Math.abs(delta[0]);
    absDelta[1] = Math.abs(delta[1]);
  }
  if (absDelta[0] > this.runSpeed) {
    // It's worth running E/W to get closer
    const step = roundToFixed(this.runSpeed);
    const ticks = Math.floor(absDelta[0] / step);
    this.run(`${targetIsEast ? 'E' : 'W'}`);
    this.tick += ticks;
  }
  if (absDelta[1] > this.runSpeed) {
    // It's worth running N/S to get closer
    const step = roundToFixed(this.runSpeed);
    const ticks = Math.floor(absDelta[1] / step);
    this.run(`${targetIsSouth ? 'S' : 'N'}`);
    this.tick += ticks;
  }
  this.stopRunning();
};

globalObject.Player.prototype._moveSelection = globalObject.Player.prototype.moveSelection;
globalObject.Player.prototype.moveSelection = function (x, y) {
  this.selection[0] += x;
  this.selection[1] += y;
  this._moveSelection(x, y);
};

globalObject.Player.prototype.moveSelectionTo = function (pos) {
  const x = pos[0] - this.selection[0];
  const y = pos[1] - this.selection[1];
  this.moveSelection(x, y);
};

globalObject.Player.prototype.isSelectedBy = function (pos) {
  const delta = [pos[0] - this.position[0], pos[1] - this.position[1]];
  return -0.4 < delta[0] && delta[0] < 0.4 &&
    -1.4 < delta[1] && delta[1] < 0.2;
};

globalObject.Player.prototype._clickItemStack = globalObject.Player.prototype.clickItemStack;
globalObject.Player.prototype.clickItemStack = function (context, slot) {
  if (context === 'Player') {
    if (slot === this.cursorSlot) {
      // Deselecting
      this.cursorSlot = -1;
      this.cursorStack = undefined;
    } else if (this.cursorSlot === -1) {
      // Selecting
      this.cursorSlot = slot;
      this.cursorStack = this.inventory[this.cursorSlot];
    } else {
      // Swapping
      this.cursorStack = this.inventory.splice(slot, 1, this.cursorStack)[0];
      this.inventory.splice(this.cursorSlot, 1, this.cursorStack);
    }
  }
  this._clickItemStack(context, slot);
};

globalObject.Player.prototype._build = globalObject.Player.prototype.build;
globalObject.Player.prototype.build = function (x, y, direction) {
  if (-1 == this.cursorSlot) {
    console.warn('Nothing on the cursor to build!');
  } else {
    this.cursorStack.amount--;
    if (this.cursorStack.amount == 0) {
      this.cursorSlot = -1;
      this.cursorStack = undefined;
    }
  }
  this._build(x, y, direction);
};

globalObject.Player.prototype._dropItem = globalObject.Player.prototype.dropItem;
globalObject.Player.prototype.dropItem = function (x, y) {
  if (-1 == this.cursorSlot) {
    console.warn('Nothing on the cursor to dropItem!');
  } else {
    this.cursorStack.amount--;
    if (this.cursorStack.amount == 0) {
      this.cursorSlot = -1;
      this.cursorStack = undefined;
    }
  }
  this._dropItem(x, y);
};

globalObject.Player.prototype._transferEntityStack = globalObject.Player.prototype.transferEntityStack;
globalObject.Player.prototype.transferEntityStack = function (inOut) {
  if (inOut === "In") {
    if (-1 == this.cursorSlot) {
      console.warn('Nothing on the cursor to transferEntityStack In!');
    } else {
      this.cursorStack.amount = 0;
      this.cursorSlot = -1;
      this.cursorStack = undefined;
    }
  }
  this._transferEntityStack(inOut);
};

globalObject.Player.prototype._clearCursor = globalObject.Player.prototype.clearCursor;
globalObject.Player.prototype.clearCursor = function () {
  this.cursorSlot = -1;
  this.cursorStack = undefined;
  this._clearCursor();
};

globalObject.Player.prototype._craft = globalObject.Player.prototype.craft;
globalObject.Player.prototype.craft = function (recipeName, count) {
  const recipe = recipes[recipeName];
  const ingredients = recipe.ingredients;
  const products = recipe.products;

  // Count how many of each of the ingredients we currently have
  let invIngredients = Array(ingredients.length).fill(0);
  for (let i = 0; i < ingredients.length; ++i) {
    for (const invStack of this.inventory) {
      if (invStack.name === ingredients[i].name) {
        invIngredients[i] += invStack.amount;
      }
    }
  }

  let realCount = count;
  if (realCount === 'all') {
    for (let i = 0; i < invIngredients.length; ++i) {
      const newCount = invIngredients[i] / ingredients[i].amount;
      if (0 == newCount) {
        console.warn(`Don't have the ${ingredients[i].name} for any ${recipeName}`);
      }
      if (realCount === 'all' || newCount < realCount) {
        realCount = newCount;
      }
    }
  }

  // Confirm we have as many as we need
  let haveEnough = true;
  for (let i = 0; i < ingredients.length; ++i) {
    if (ingredients[i].amount * realCount > invIngredients[i]) {
      console.warn(`Don't have enough ${ingredients[i].name} for ${recipeName} (have ${invIngredients[i]}, need ${ingredients[i].amount * realCount})`);
      haveEnough = false;
    }
  }
  if (!haveEnough) {
    console.warn(`Skipping Craft ${recipeName} ${count}`);
    return;
  }

  // Remove the ingredients from the inventory
  for (const ingredient of ingredients) {
    let toRemove = ingredient.amount * realCount;
    for (let invStack of this.inventory) {
      if (invStack.name === ingredient.name) {
        if (toRemove <= invStack.amount) {
          invStack.amount -= toRemove;
          break;
        } else {
          toRemove -= invStack.amount;
          invStack.amount = 0;
        }
      }
    }
  }

  // Schedule the crafts
  const startTick = this.craftEndTick <= this.tick ? this.tick : this.craftEndTick;
  for (const product of products) {
    for (let i = 1; i <= realCount; ++i) {
      this.schedule(startTick + i * (1 + 60 * recipe.energy), () => {
        this.stow(product.name, product.amount);
      });
    }
  }
  this.craftEndTick = startTick + realCount * (1 + 60 * recipe.energy);

  this._craft(recipeName, count);
}

globalObject.Player.prototype.grab = function (item) {
  for (let i = 0; i < this.inventory.length; ++i) {
    if (this.inventory[i].name === item) {
      this.clickItemStack('Player', i);
      return;
    }
  }
  console.warn(`No ${item} in inventory to grab! Did you forget to explicitly stow it?`);
};

globalObject.Player.prototype.stow = function (item, count) {
  for (const stack of this.inventory) {
    if (stack.name === item) {
      // TODO: handle stack limits
      stack.amount += count;
      return;
    }
  }
  this.inventory.push({ name: item, amount: count });
  sortInventory(this);
};