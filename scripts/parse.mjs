import {
  fromIEEE754Double,
  fromIEEE754Single,
  toIEEE754Double,
} from './parse_ieee.mjs';
import { idMapTypes, signalIdTypes, idMaps } from './id_maps.mjs';

let curIndex,
  buffer,
  curTick,
  curPlayer,
  datString,
  error = '',
  lastTickStart;

const fetch = {
  bytes: (count) => {
    let result = '';
    for (
      ;
      curIndex < buffer.length && (undefined === count || count > 0);
      ++curIndex
    ) {
      const char = buffer[curIndex];
      if (char == '\n') {
        if (count === undefined) {
          // No more bytes
          break;
        }
        // Permit newlines in byte sequence if we're looking for a certain number of bytes
        continue;
      }
      if (/\s/.test(char)) {
        continue; // Consume the space
      }
      const byte = buffer.substring(curIndex, curIndex + 2);
      if (!/[a-fA-F0-9][a-fA-F0-9]/.test(byte)) {
        error = 'Bad character in byte sequence';
        return;
      }
      result += byte;
      ++curIndex; // Increment a second time to consume both characters
      if (count !== undefined) {
        --count;
      }
    }
    if (undefined !== count && count > 0) {
      error = 'Not enough bytes at end of input';
    } else if (0 === count) {
      fetch.commaAndWhitespace();
    }
    return result;
  },
  char: () => {
    return buffer[curIndex++];
  },
  checkSum: (next = ',') => {
    let checkSum = fetch.string(next);
    let result = '';
    // Need to make this little endian
    while (checkSum.length > 0) {
      result += checkSum.substring(checkSum.length - 2);
      checkSum = checkSum.substring(0, checkSum.length - 2);
    }
    return result;
  },
  commaAndWhitespace: () => {
    let result = '';
    if (buffer[curIndex] == ',') {
      curIndex++;
      result = ',';
    }
    return result + fetch.whitespace();
  },
  literalString: (expected) => {
    const actual = buffer.substring(curIndex, curIndex + expected.length);
    if (actual != expected) {
      error = `Failed to match expected string: wanted "${expected}", got "${actual}"`;
      return false;
    }
    curIndex += expected.length;
    fetch.whitespace();
    return true;
  },
  num: (next = ',') => {
    let endIndex = curIndex;
    while (buffer[endIndex] != next && buffer[endIndex] != '\n') {
      endIndex++;
    }
    const result = parseFloat(buffer.substring(curIndex, endIndex));
    curIndex = endIndex;
    fetch.commaAndWhitespace();
    return result;
  },
  string: (delimiter, finalDelimiter = '\n') => {
    let endIndex = buffer.indexOf(finalDelimiter, curIndex);
    if (delimiter !== undefined) {
      const commaIndex = buffer.indexOf(delimiter, curIndex);
      if (-1 != commaIndex && commaIndex < endIndex) {
        endIndex = commaIndex;
      }
    }
    const result = buffer.substring(curIndex, endIndex).trim();
    curIndex = endIndex;
    fetch.commaAndWhitespace();
    return result;
  },
  restOfLine: () => {
    const startIndex = curIndex;
    curIndex = buffer.indexOf('\n', curIndex) + 1;
    if (0 == curIndex) {
      // Got to the end of input
      curIndex = buffer.length;
    }
    return buffer.substring(startIndex, curIndex);
  },
  tick: (isRelative) => {
    const colonIndex = buffer.indexOf(':', curIndex);
    if (colonIndex == -1) {
      error = `Failed to obtain tick on line after tick ${curTick}`;
      return [curTick, curPlayer];
    }
    const tickStr = buffer.substring(curIndex, colonIndex);
    let openIndex = tickStr.indexOf('(');
    if (isRelative) {
      curTick += parseInt(tickStr.substring(0, openIndex));
    } else {
      curTick = parseInt(tickStr.substring(0, openIndex));
    }
    let closeIndex = tickStr.indexOf(')', openIndex + 1);
    curPlayer = tickStr.substring(openIndex + 1, closeIndex);
    if (/[0123456789]/.test(curPlayer[0])) {
      curPlayer = mapValIfPossible(curPlayer, 'player');
    }
    curIndex = colonIndex + 1;

    return [curTick, curPlayer];
  },
  unhandledBytes: () => {
    curIndex = lastTickStart;
    const startIndex = curIndex;
    let tickGuess = read.tick();
    tickGuess = tickGuess.replace('@', '?');
    curIndex = startIndex - 1; // Take back the bytes we've tried to interpret
    const endIndex = tryFindHeartbeat(buffer, curIndex);
    return `${tickGuess}${read.bytes(endIndex - curIndex)}`;
  },
  whitespace: () => {
    const startIndex = curIndex;
    while ('\n' != buffer[curIndex] && /\s/.test(buffer[curIndex])) {
      curIndex++;
    }
    return buffer.substring(startIndex, curIndex);
  },
};

const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const leaveReasons = [
  '',
  'Dropped',
  'Reconnecting',
  'MalformedData',
  'Desynced',
  'CouldNotKeepUp',
  'AFK',
];
const inventories = [
  [],
  [undefined, 'Player', 'Toolbelt', 'Gun', 'Ammo', 'Armor', 'Tool'],
  [],
  [],
  [undefined, 'FuelOrContainer', 'Input', 'Output'],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
];
const shotTargets = ['None', 'Enemy', 'Selected'];
const transferCounts = ['None?', 'One', 'All'];
const trainAccelerations = ['Coast', 'Accelerate', 'Decelerate', 'Reverse'];
const trainJunctionChoices = ['Right', 'Straight', 'Left'];
const cheatIndex = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  'AllTechs',
  'NotAllTechs',
  9,
  10,
  11,
  'StarterItems',
  'NoStarterItems',
  14,
  'GodMode',
  'NotGodMode',
  17,
  'AlwaysDay',
  'NotAlwaysDay',
];
const characterTabs = [undefined, 'Crafting', 'Character', 'Logistics'];
const mouseButton = {
  NONE: '0x0001',
  '0x0001': 'NONE',
  LEFT: '0x0002',
  '0x0002': 'LEFT',
  RIGHT: '0x0004',
  '0x0004': 'RIGHT',
  LEFT_AND_RIGHT: '0x0006',
  '0x0006': 'LEFT_AND_RIGHT',
  MIDDLE: '0x0008',
  '0x0008': 'MIDDLE',
  BUTTON_4: '0x0010',
  '0x0010': 'BUTTON_4',
  BUTTON_5: '0x0020',
  '0x0020': 'BUTTON_5',
  BUTTON_6: '0x0040',
  '0x0040': 'BUTTON_6',
  BUTTON_7: '0x0080',
  '0x0080': 'BUTTON_7',
  BUTTON_8: '0x0100',
  '0x0100': 'BUTTON_8',
  BUTTON_9: '0x0200',
  '0x0200': 'BUTTON_9',
  ALL: '0x03fe',
  '0x03fe': 'ALL',
};

const mapValIfPossible = (val, category) => {
  let idMap, mapped;
  if (
    category !== undefined &&
    (idMap = idMaps[category]) !== undefined &&
    (mapped = idMap[val]) !== undefined
  ) {
    return mapped;
  }
  return val;
};

const read = {
  uint8: (category) => {
    return mapValIfPossible(buffer[curIndex++], category);
  },
  uint16: (category) => {
    return mapValIfPossible(
      buffer[curIndex++] + buffer[curIndex++] * 0x100,
      category
    );
  },
  // Doubt these actually exist, but useful for unknowns
  uint24: () => {
    return (
      buffer[curIndex++] +
      buffer[curIndex++] * 0x100 +
      buffer[curIndex++] * 0x10000
    );
  },
  uint32: () => {
    return (
      buffer[curIndex++] +
      buffer[curIndex++] * 0x100 +
      buffer[curIndex++] * 0x10000 +
      buffer[curIndex++] * 0x1000000
    );
  },
  uint64: () => {
    return (
      BigInt(
        buffer[curIndex++] +
          buffer[curIndex++] * 0x100 +
          buffer[curIndex++] * 0x10000 +
          buffer[curIndex++] * 0x1000000 +
          buffer[curIndex++] * 0x100000000 +
          buffer[curIndex++] * 0x10000000000 +
          buffer[curIndex++] * 0x1000000000000
      ) +
      BigInt(buffer[curIndex++]) * 0x100000000000000n
    );
  },
  int8: () => {
    let num = read.uint8();
    if (num >= 0x80) {
      num -= 0x100;
    }
    return num;
  },
  int16: () => {
    let num = read.uint16();
    if (num >= 0x8000) {
      num -= 0x10000;
    }
    return num;
  },
  int32: () => {
    let num = read.uint32();
    if (num >= 0x80000000) {
      num -= 0x100000000;
    }
    return num;
  },
  int64: () => {
    let num = read.uint64();
    if (num >= 0x8000000000000000n) {
      num -= 0x10000000000000000n;
    }
    return num;
  },
  optUint16: (category) => {
    let num = read.uint8();
    if (255 == num) {
      num = read.uint16();
    }
    return mapValIfPossible(num, category);
  },
  optUint32: () => {
    let num = read.uint8();
    if (255 == num) {
      num = read.uint32();
    }
    return num;
  },
  fixed16: () => {
    return read.int16() / 256;
  },
  fixed32: () => {
    return read.int32() / 256;
  },
  string: () => {
    const len = read.optUint32();
    let result = '';
    for (let i = 0; i < len; i++) {
      result += String.fromCharCode(buffer[curIndex++]);
    }
    return result;
  },
  bytes: (length) => {
    let result = '';
    for (let i = 0; i < length; i++) {
      let byte = read.uint8().toString(16);
      if (byte.length == 1) {
        byte = '0' + byte;
      }
      if (i > 0) {
        result += ' ';
      }
      result += byte;
    }
    return result;
  },
  bytesUntil: (targetBytes, inclusive = true) => {
    const startIndex = curIndex;
    const actualBytes = [];
    for (let i = 0; i < targetBytes.length && !eof(); i++) {
      actualBytes[i] = read.uint8();
    }
    let endIndex = buffer.length;
    while (true) {
      let found = true;
      for (let i = 0; i < targetBytes.length; i++) {
        if (targetBytes[i] != actualBytes[i]) {
          found = false;
          break;
        }
      }
      if (found || eof()) {
        endIndex = curIndex;
        if (!inclusive) {
          endIndex -= targetBytes.length;
        }
        curIndex = startIndex;
        break;
      }
      // Rotate a new byte in
      for (let i = 0; i < actualBytes.length - 1; i++) {
        actualBytes[i] = actualBytes[i + 1];
      }
      actualBytes[actualBytes.length - 1] = read.uint8();
    }
    return read.bytes(endIndex - startIndex);
  },
  mouseButton: () => {
    let bytes = read.bytes(2).replace(' ', '');
    bytes = bytes[2] + bytes[3] + bytes[0] + bytes[1];
    return mouseButton['0x' + bytes];
  },
  bool: () => {
    const parsed = read.uint8();
    if (parsed != 0 && parsed != 1) {
      console.log(`Invalid bool value: ${parsed} at ${curTick}`);
    }
    return parsed == 1;
  },
  checkSum: () => {
    const rawCheckSum = read.uint32();
    let checkSum = rawCheckSum.toString(16);
    while (checkSum.length < 8) {
      checkSum = '0' + checkSum;
    }
    return checkSum;
  },
  dir: () => {
    let a = read.uint8();
    return a <= 7
      ? directions[a]
      : `${directions[a % 16]}->${directions[a >> 4]}`;
  },
  direction: () => {
    return directions[read.uint8()];
  },
  leaveReason: () => {
    return leaveReasons[read.uint8()];
  },
  itemStackTarget: () => {
    const inventory = idMaps['inventory'][read.uint8()];
    const invType = idMaps['inventoryType'][read.uint8()];
    const localShelfTarget = read.bool();
    return `${inventory}, ${invType}, ${localShelfTarget}`;
  },
  inv: () => {
    return `${inventories[1][read.uint8()]}`;
  },
  slotInInventory: () => {
    const whichInventory = read.uint8();
    const slot = read.uint16();
    const inventoryContext = read.uint16();
    let inventory = inventories[inventoryContext];
    if (inventory) inventory = inventory[whichInventory];
    if (!inventory) inventory = 'a';
    return `${
      inventory ? inventory : `${whichInventory}, ${inventoryContext}`
    }, ${slot}`;
  },
  tick: () => {
    lastTickStart = curIndex;
    curTick = read.uint32();
    curPlayer = read.optUint16('player');
    if (idMaps.player['Server'] === undefined) {
      idMaps.player['Server'] = curPlayer;
      idMaps.player[curPlayer] = 'Server';
      curPlayer = 'Server';
    }
    return `@${curTick}(${curPlayer}): `;
  },
  isDragging: () => {
    return read.bool() ? 'Dragging' : '';
  },
  isGhost: () => {
    return read.bool() ? 'Ghost' : '';
  },
  uint8ProbablyZero: () => {
    const num = read.uint8();
    return num == 0 ? '' : num;
  },
  uint16ProbablyZero: () => {
    const num = read.uint16();
    return num == 0 ? '' : num;
  },
  uint24ProbablyZero: () => {
    const num = read.uint24();
    return num == 0 ? '' : num;
  },
  uint8ProbablyFour: () => {
    const num = read.uint8();
    return num == 4 ? '' : num;
  },
  previousTick: () => {
    const num = read.uint32();
    return num == curTick - 1 ? '' : num;
  },
  uint32OrAll: () => {
    const num = read.uint32();
    return num == 0xffffffff ? 'all' : num;
  },
  shotTarget: () => {
    return shotTargets[read.uint8()];
  },
  transferCount: () => {
    return transferCounts[read.uint8()];
  },
  inOut: () => {
    if (read.bool()) {
      return 'In';
    }
    return 'Out';
  },
  float: () => {
    const bytes = buffer.slice(curIndex, (curIndex += 4));
    return fromIEEE754Single(bytes.reverse());
  },
  double: () => {
    const bytes = buffer.slice(curIndex, (curIndex += 8));
    return fromIEEE754Double(bytes.reverse());
  },
  curPlayer: () => {
    const player = read.player();
    if (player == curPlayer) {
      return '';
    }
    return player;
  },
  player: () => {
    return mapValIfPossible(read.uint16(), 'player');
  },
  trainJunctionChoice: () => {
    return trainJunctionChoices[read.uint8()];
  },
  trainAcceleration: () => {
    return trainAccelerations[read.uint8()];
  },
  blueprintIcons: () => {
    const iconCount = read.uint8();
    let result = '';
    for (let i = 0; i < iconCount; i++) {
      if (i > 0) {
        result = `${result}, `;
      }
      const category = read.uint8();
      result = `${result}${read[signalIdTypes[category]]()}`;
    }
    return result;
  },
  blueprintOrBook: (recursive = false) => {
    let result = '';
    const blueprintId = read.uint32();
    let blueprintContainer;
    if (recursive) {
      blueprintContainer = read.item();
    }
    const blueprintBytes = read.bytes(20);
    let unknown3 = '';
    if (!recursive) {
      blueprintContainer = read.item();
      unknown3 = read.uint8ProbablyZero();
    }
    const icons = read.blueprintIcons();
    const name = read.string();
    if (!recursive) {
      const terminus = read.uint32();
      if (terminus != 0xffffffff) {
        throw `No terminus on saved blueprint?`;
      }
    }
    if (name === '') {
      result = `${blueprintId} =`;
    } else {
      result = `${name} (${blueprintId}) =`;
    }
    result = `${result} ${blueprintBytes} in a ${blueprintContainer}`;
    if (unknown3 != '') {
      result = `${result} (${unknown3})`;
    }
    result = `${result} with icons [${icons}]`;
    if (blueprintContainer == 'blueprint-book') {
      result = `${result}:`;
      const containerBlueprintCount = read.uint8();
      for (let i = 0; i < containerBlueprintCount; i++) {
        if (i > 0) {
          result = `${result},`;
        }
        result = `${result} ${read.blueprintOrBook(true)}`;
      }
      result = `${result};`;
    }
    return result;
  },
  blueprintDesc: () => {
    // ['uint16', 'uint32', 'checkSum', 'checkSum', 'uint16', 'uint16', 'bool', 'uint16', 'uint16', 'uint16', 'uint8', 'entity', 'fixed16', 'fixed16', 'uint16', 'uint16', 'item', 'uint16', 'checkSum', 'uint8']
    const unknown1 = read.uint16();
    const blueprintId = read.uint32();
    const unknown2 = read.bytes(8);
    const extraBytes = read.bytesUntil([0, 0, 18, 0], /*inclusive=*/ false);
    const major = read.uint16();
    const minor = read.uint16();
    const patch = read.uint16();
    const unknown4 = read.uint24();
    const itemCount = extraBytes.length == 8 ? 1 : read.uint32();
    if (itemCount > 9000) {
      throw 'Oops';
    }
    const items = [];
    for (let i = 0; i < itemCount; ++i) {
      const name = `${read.entity()}`;
      const x = read.fixed16();
      const y = read.fixed16();
      const unknown5 = read.uint16();
      items.push(`${name} at ${x}, ${y} (${unknown5})`);
    }
    const icons = read.blueprintIcons();
    const unknown6 = read.uint16();
    const unknown7 = read.uint8();
    const unknown8 = read.checkSum();
    return `Blueprint ${blueprintId} (from ${major}.${minor}.${patch}): [${items.join(
      ', '
    )}] with icons ${icons}, [${unknown1}, ${unknown2}, ${extraBytes}, ${unknown6}, ${unknown7}, ${unknown8}]`;
  },
  cheatType: () => {
    const val = read.uint32();
    return cheatIndex[val] || val;
  },
  characterTab: () => {
    const val = read.uint8();
    return characterTabs[val] || val;
  },
};

const write = {
  uint8: (val = fetch.string(','), category) => {
    let num = parseInt(val);
    if (isNaN(num) && category !== undefined) {
      num = mapValIfPossible(val, category);
      if (isNaN(num)) {
        error = `Can't parse ${val} as a ${category}`;
      }
    }
    let result = num.toString(16);
    if (result.length < 2) {
      result = '0' + result;
    }
    datString += result;
    return num;
  },
  uint16: (val = fetch.string(','), category) => {
    let num = parseInt(val);
    if (isNaN(num) && category !== undefined) {
      num = mapValIfPossible(val, category);
      if (isNaN(num)) {
        error = `Can't parse ${val} as a ${category}`;
      }
    }
    write.uint8(num & 0xff);
    write.uint8((num / 0x100) & 0xff);
  },
  uint24: (num = fetch.num()) => {
    write.uint16(num & 0xffff);
    write.uint8((num / 0x10000) & 0xff);
  },
  uint32: (num = fetch.num()) => {
    write.uint16(num & 0xffff);
    write.uint16((num / 0x10000) & 0xffff);
  },
  int8: (num = fetch.num()) => {
    if (num < 0) {
      num += 0x100;
    }
    write.uint8(num);
  },
  int16: (num = fetch.num()) => {
    if (num < 0) {
      num += 0x10000;
    }
    write.uint16(num);
  },
  optUint16: (val = fetch.string(), category, hint) => {
    let num = parseInt(mapValIfPossible(val, category));
    if (isNaN(num)) {
      // Don't have this id wired up yet - do that now
      num = hint;
      idMaps[category][num] = val;
      idMaps[category][val] = num;
    }
    if (num > 254) {
      write.uint8(255);
      write.uint16(num);
    } else {
      write.uint8(num);
    }
  },
  int32: (num = fetch.num()) => {
    if (num < 0) {
      num += 0x100000000;
    }
    write.uint32(num);
  },
  fixed16: (num = fetch.num()) => {
    write.int16(num * 256);
  },
  fixed32: (num = fetch.num()) => {
    write.int32(num * 256);
  },
  optUint32: (num = fetch.num()) => {
    if (num > 254) {
      write.uint8(255);
      write.uint32(num);
    } else {
      write.uint8(num);
    }
  },
  string: (stopAtComma, val) => {
    if (undefined === val) {
      val = fetch.string(stopAtComma ? ',' : undefined);
    }
    write.optUint32(val.length);
    for (let i = 0; i < val.length; i++) {
      write.uint8(val.charCodeAt(i));
    }
  },
  bytes: (count) => {
    datString += fetch.bytes(count);
  },
  mouseButton: () => {
    const button = fetch.string(',');
    let bytes = `${mouseButton[button]}`.slice(2);
    bytes = bytes[2] + bytes[3] + bytes[0] + bytes[1];
    write.uint8(parseInt(bytes[0] + bytes[1], 16));
    write.uint8(parseInt(bytes[2] + bytes[3], 16));
  },
  bool: (val) => {
    if (val === undefined) {
      val = fetch.string() == 'true';
    }
    write.uint8(val ? 1 : 0);
  },
  checkSum: (checkSum) => {
    if (checkSum === undefined) {
      checkSum = fetch.checkSum();
    }
    datString += checkSum;
    fetch.commaAndWhitespace();
  },
  dir: () => {
    const result = fetch.string(',');
    console.log(result);
  },
  direction: () => {
    const direction = fetch.string(',');
    for (let i = 0; i < directions.length; i++) {
      if (directions[i] == direction) {
        write.uint8(i);
        return;
      }
    }
    error = `Can't parse direction "${direction}"`;
  },
  leaveReason: () => {
    const leaveReason = fetch.string(',');
    for (let i = 0; i < leaveReasons.length; i++) {
      if (leaveReasons[i] == leaveReason) {
        write.uint8(i);
        return;
      }
    }
    error = `Can't parse leave reason "${leaveReason}"`;
  },
  slotInInventory: () => {
    let inventoryContext, whichInventory;
    if ('0123456789'.indexOf(buffer[curIndex]) == -1) {
      const inventory = fetch.string(',');
      var found = false;
      for (let i = 0; !found && i < inventories.length; i++) {
        for (let j = 0; j < inventories[i].length; j++) {
          if (inventories[i][j] == inventory) {
            inventoryContext = i;
            whichInventory = j;
            found = true;
            break;
          }
        }
      }
      if (!found) {
        error = `Can't parse inventory "${inventory}"`;
      }
    } else {
      whichInventory = fetch.num();
      inventoryContext = fetch.num();
    }
    write.uint8(whichInventory);
    write.uint16();
    write.uint16(inventoryContext);
  },
  isNotDragging: () => {
    write.bool(fetch.string(',') != 'Dragging');
  },
  isNotGhost: () => {
    write.bool(fetch.string(',') != 'Ghost');
  },
  uint8ProbablyZero: (next = '\n') => {
    const num = buffer[curIndex] == next ? 0 : fetch.num(next);
    write.uint8(num);
  },
  uint16ProbablyZero: () => {
    const num = buffer[curIndex] == '\n' ? 0 : fetch.num();
    write.uint16(num);
    return num;
  },
  uint24ProbablyZero: () => {
    const num = buffer[curIndex] == '\n' ? 0 : fetch.num();
    write.uint24(num);
    return num;
  },
  uint8ProbablyFour: () => {
    const num = buffer[curIndex] == '\n' ? 4 : fetch.num();
    write.uint8(num);
  },
  previousTick: () => {
    const num = buffer[curIndex] == '\n' ? curTick - 1 : fetch.num();
    write.uint32(num);
  },
  uint32OrAll: () => {
    const num = fetch.string(',');
    write.uint32(num == 'all' ? 0xffffffff : parseInt(num));
  },
  shotTarget: () => {
    const shotTarget = fetch.string(',');
    for (let i = 0; i < shotTargets.length; i++) {
      if (shotTargets[i] == shotTarget) {
        write.uint8(i);
        return;
      }
    }
    error = `Can't parse shotTarget "${shotTarget}"`;
  },
  transferCount: () => {
    const transferCount = fetch.string(',');
    for (let i = 0; i < transferCounts.length; i++) {
      if (transferCounts[i] == transferCount) {
        write.uint8(i);
        return;
      }
    }
    error = `Can't parse transferCount "${transferCount}"`;
  },
  inOut: () => {
    write.bool(fetch.string() == 'In');
  },
  curPlayer: () => {
    const num =
      buffer[curIndex] == '\n'
        ? mapValIfPossible(curPlayer, 'player')
        : fetch.num();
    write.uint16(num);
  },
  double: () => {
    const num = fetch.num();
    const array = toIEEE754Double(num);
    for (let i = array.length - 1; i >= 0; i--) {
      write.uint8(array[i]);
    }
  },
  trainJunctionChoice: () => {
    const trainJunctionChoice = fetch.string(',');
    for (let i = 0; i < trainJunctionChoices.length; i++) {
      if (trainJunctionChoices[i] == trainJunctionChoice) {
        write.uint8(i);
        return;
      }
    }
    error = `Can't parse train junction choice "${trainJunctionChoice}"`;
  },
  trainAcceleration: () => {
    const trainAcceleration = fetch.string(',');
    for (let i = 0; i < trainAccelerations.length; i++) {
      if (trainAccelerations[i] == trainAcceleration) {
        write.uint8(i);
        return;
      }
    }
    error = `Can't parse train acceleration "${trainAcceleration}"`;
  },
  blueprintIcons: (inSavedBlueprint = false) => {
    const category = [];
    const id = [];
    const finalDelimiter = inSavedBlueprint ? ']' : '\n';
    while (buffer[curIndex] != finalDelimiter) {
      const oneIcon = fetch.string(',', finalDelimiter);
      let found = false;
      for (let i = 0; i < signalIdTypes.length; i++) {
        if (idMaps[signalIdTypes[i]].hasOwnProperty(oneIcon)) {
          category.push(i);
          id.push(idMaps[signalIdTypes[i]][oneIcon]);
          found = true;
          break;
        }
      }
      if (!found) {
        error = `Failed to determine category and id for: ${oneIcon}`;
        break;
      }
    }
    write.uint8(category.length);
    for (let i = 0; i < category.length; i++) {
      write.uint8(category[i]);
      write.item(id[i]);
    }
  },
  blueprintOrBook: (recursive = false) => {
    const maybeNameAndId = fetch.string('=');
    let id;
    let name = '';
    if (maybeNameAndId.endsWith(')')) {
      // looks like: "<name> (<id>)"
      id = maybeNameAndId.substring(
        maybeNameAndId.lastIndexOf('(') + 1,
        maybeNameAndId.lastIndexOf(')')
      );
      name = maybeNameAndId.substring(0, maybeNameAndId.lastIndexOf('(') - 1);
    } else {
      // looks like: "<id>"
      id = maybeNameAndId;
    }

    write.uint16(id);

    fetch.literalString('=');

    const blueprintBytes = fetch.bytes(20);

    if (!fetch.literalString('in a')) {
      return;
    }

    if (recursive) {
      const blueprintContainer = fetch.string(' ');
      write.item(blueprintContainer);
    }

    datString += blueprintBytes;

    if (!recursive) {
      const blueprintContainer = fetch.string(' ');
      write.item(blueprintContainer);
      if ('(' == buffer[curIndex]) {
        ++curIndex;
        const unknown = fetch.num(')');
        write.uint8(unknown);
        if (!fetch.literalString(')')) {
          return;
        }
      } else {
        write.uint8(0);
      }
    }

    if (!fetch.literalString('with icons [')) {
      return;
    }

    write.blueprintIcons(true);

    if (!fetch.literalString(']')) {
      return;
    }

    write.string(false, name);

    if (!recursive) {
      write.uint16(0xffff);
    }

    if (buffer[curIndex] == ':') {
      // Need to call this recursively on the contents of this container
      ++curIndex;
      // Hack to let the recursive calls write directly to datString
      // We'll overwrite this 0 later with the real count
      const savedDatLen = datString.length;
      write.uint8(0);
      let count = 0;
      while (buffer[curIndex] != ';') {
        if (count > 0) {
          fetch.commaAndWhitespace();
        }
        write.blueprintOrBook(true);
        ++count;
      }
      ++curIndex;

      if (count > 0) {
        // Overwrite the previously claimed 0 count with the actual value
        let countBytes = count.toString(16);
        if (countBytes.length < 2) {
          countBytes = '0' + countBytes;
        }
        datString =
          datString.substring(0, savedDatLen) +
          countBytes +
          datString.substring(savedDatLen + 2);
      }
    }
  },
  cheatType: () => {
    const val = fetch.string();
    const index = cheatIndex.indexOf(val);
    write.uint32(index != -1 ? index : val);
  },
  characterTab: () => {
    const val = fetch.string();
    const index = characterTabs.indexOf(val);
    write.uint8(index != -1 ? index : val);
  },
};

// Add convenience functions to directly parse known mapped ids (read.item() etc.)
for (let i = 0; i < idMapTypes.length; i++) {
  read[idMapTypes[i][0]] = () => read[idMapTypes[i][1]](idMapTypes[i][0]);
  write[idMapTypes[i][0]] = (val = fetch.string(',')) =>
    write[idMapTypes[i][1]](val, idMapTypes[i][0]);
}

const tryFindHeartbeat = (buffer, curIndex) => {
  // Factorio emits CheckSum frames every second, on the second, so try to find the next one
  // Find the next CheckSum frame
  for (
    let searchIndex = curIndex;
    searchIndex + 6 <= buffer.length;
    searchIndex++
  ) {
    if (buffer[searchIndex] != 0x4a) {
      // Not a checksum
      continue;
    }
    const tick =
      buffer[searchIndex + 1] +
      (buffer[searchIndex + 2] << 8) +
      (buffer[searchIndex + 3] << 16) +
      (buffer[searchIndex + 4] << 24);
    if (tick % 60 != 0) {
      // Not an even second
      continue;
    }
    if (buffer[searchIndex + 5] != 0) {
      // Not the host player
      continue;
    }

    // Found a matching frame!
    return searchIndex;
  }
  // Didn't find anything, so just consume the rest of the buffer
  return buffer.length;
};

const setBuffer = (newBuffer) => {
  buffer = newBuffer;
  curIndex = 0;
  datString = '';
  error = '';
};

const eof = () => {
  return curIndex >= buffer.length;
};

const expect = (func, data) => {
  let lastIndex = curIndex;
  let nextBytes = func();
  if (nextBytes != data) {
    console.log(
      `Unexpected bytes (0x${nextBytes.toString(
        16
      )}) at offset 0x${lastIndex.toString(16)}`
    );
    throw 'Not parsing more';
  }
};

const progress = () => {
  return curIndex / buffer.length;
};

export {
  read,
  write,
  fetch,
  setBuffer,
  expect,
  eof,
  datString,
  error,
  idMaps,
  tryFindHeartbeat,
  progress,
};
