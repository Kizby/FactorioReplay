import { fromIEEE754Double, fromIEEE754Single, toIEEE754Double } from './parse_ieee.mjs';
import { idMapTypes, idMaps } from './id_maps.mjs';

let curIndex, buffer, curTick, curPlayer, datString, error = '';

const fetch = {
  char: () => {
    return buffer[curIndex++];
  },
  checkSum: () => {
    let checkSum = fetch.string(',');
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
  num: () => {
    let endIndex = curIndex;
    while (buffer[endIndex] != ',' && buffer[endIndex] != '\n') {
      endIndex++;
    }
    const result = parseFloat(buffer.substring(curIndex, endIndex));
    curIndex = endIndex;
    fetch.commaAndWhitespace();
    return result;
  },
  string: (delimiter) => {
    let endIndex = buffer.indexOf('\n', curIndex);
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
    curIndex -= 5;
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
const leaveReasons = ['', 'Dropped', 'Reconnecting', 'MalformedData', 'Desynced', 'CouldNotKeepUp', 'AFK'];
const inventories = [[],
[undefined, 'Player', 'Toolbelt', 'Gun', 'Ammo', 'Armor', 'Tool'],
[],
[],
[undefined, 'FuelOrContainer', 'Input', 'Output'],
[]];
const shotTargets = ['None', 'Enemy', 'Selected'];
const transferCounts = [undefined, 'One', 'All'];
const trainAccelerations = ['Coast', 'Accelerate', 'Decelerate', 'Reverse'];
const trainJunctionChoices = ['Right', 'Straight', 'Left'];

const mapValIfPossible = (val, category) => {
  let idMap, mapped;
  if (category !== undefined &&
    (idMap = idMaps[category]) !== undefined &&
    (mapped = idMap[val]) !== undefined) {
    return mapped;
  }
  return val;
}

const read = {
  uint8: (category) => {
    return mapValIfPossible(buffer[curIndex++], category);
  },
  uint16: (category) => {
    return mapValIfPossible(
      buffer[curIndex++]
      + (buffer[curIndex++] * 0x100), category)
  },
  // Doubt these actually exist, but useful for unknowns
  uint24: () => {
    return buffer[curIndex++]
      + (buffer[curIndex++] * 0x100)
      + (buffer[curIndex++] * 0x10000);
  },
  uint32: () => {
    return buffer[curIndex++]
      + (buffer[curIndex++] * 0x100)
      + (buffer[curIndex++] * 0x10000)
      + (buffer[curIndex++] * 0x1000000);
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
  optUint16: (category) => {
    let num = read.uint8();
    if (255 == num) {
      num = read.uint16(category);
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
  bytesUntil: (targetBytes) => {
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
  bool: () => {
    return read.uint8() == 1;
  },
  checkSum: () => {
    const rawCheckSum = read.uint32();
    let checkSum = rawCheckSum.toString(16);
    while (checkSum.length < 8) {
      checkSum = '0' + checkSum;
    }
    return checkSum;
  },
  direction: () => {
    return directions[read.uint8()];
  },
  leaveReason: () => {
    return leaveReasons[read.uint8()];
  },
  slotInInventory: () => {
    const whichInventory = read.uint8();
    const slot = read.uint16();
    const inventoryContext = read.uint16();
    const inventory = inventories[inventoryContext][whichInventory];
    return `${inventory ? inventory : `${whichInventory}, ${inventoryContext}`}, ${slot}`;
  },
  tick: () => {
    curTick = read.uint32();
    curPlayer = read.optUint16('player');
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
    const bytes = buffer.slice(curIndex, curIndex += 4);
    return fromIEEE754Single(bytes.reverse());
  },
  double: () => {
    const bytes = buffer.slice(curIndex, curIndex += 8);
    return fromIEEE754Double(bytes.reverse());
  },
  curPlayer: () => {
    const playerNum = read.uint16();
    if (mapValIfPossible(playerNum, 'player') == curPlayer) {
      return '';
    }
    return playerNum;
  },
  trainJunctionChoice: () => {
    return trainJunctionChoices[read.uint8()];
  },
  trainAcceleration: () => {
    return trainAccelerations[read.uint8()];
  },
};

const write = {
  uint8: (val = fetch.string(','), category) => {
    let num = parseInt(val);
    if (isNaN(num) && category !== undefined) {
      num = mapValIfPossible(val, category);
    }
    let result = num.toString(16);
    if (result.length < 2) {
      result = '0' + result;
    }
    datString += result;
  },
  uint16: (val = fetch.string(','), category) => {
    let num = parseInt(val);
    if (isNaN(num) && category !== undefined) {
      num = mapValIfPossible(val, category);
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
  optUint16: (val = fetch.string(), category) => {
    const num = parseInt(mapValIfPossible(val, category));
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
    for (; curIndex < buffer.length && (undefined === count || count > 0); ++curIndex) {
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
        error = "Bad character in byte sequence";
        return;
      }
      datString += byte;
      ++curIndex; // Increment a second time to consume both characters
      if (count !== undefined) {
        --count;
      }
    }
    if (undefined !== count && count > 0) {
      error = "Not enough bytes at end of input";
    } else if (0 === count) {
      fetch.commaAndWhitespace();
    }
  },
  bool: (val) => {
    if (val === undefined) {
      val = (fetch.string() == 'true');
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
  isDragging: () => {
    write.bool(fetch.string(',') == 'Dragging');
  },
  isGhost: () => {
    write.bool(fetch.string(',') == 'Ghost');
  },
  uint8ProbablyZero: () => {
    const num = (buffer[curIndex] == '\n') ? 0 : fetch.num();
    write.uint8(num);
  },
  uint16ProbablyZero: () => {
    const num = (buffer[curIndex] == '\n') ? 0 : fetch.num();
    write.uint16(num);
    return num;
  },
  uint24ProbablyZero: () => {
    const num = (buffer[curIndex] == '\n') ? 0 : fetch.num();
    write.uint24(num);
    return num;
  },
  uint8ProbablyFour: () => {
    const num = (buffer[curIndex] == '\n') ? 4 : fetch.num();
    write.uint8(num);
  },
  previousTick: () => {
    const num = (buffer[curIndex] == '\n') ? curTick - 1 : fetch.num();
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
    const num = (buffer[curIndex] == '\n') ? mapValIfPossible(curPlayer, 'player') : fetch.num();
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
};

// Add convenience functions to directly parse known mapped ids (read.item() etc.)
for (let i = 0; i < idMapTypes.length; i++) {
  read[idMapTypes[i][0]] = () => read[idMapTypes[i][1]](idMapTypes[i][0]);
  write[idMapTypes[i][0]] = (val = fetch.string(',')) => write[idMapTypes[i][1]](val, idMapTypes[i][0]);
}

const tryFindHeartbeat = (buffer, curIndex) => {
  // Factorio emits CheckSum frames every second, on the second, so try to find the next one
  // Find the next CheckSum frame
  for (let searchIndex = curIndex; searchIndex + 6 <= buffer.length; searchIndex++) {
    if (buffer[searchIndex] != 0x35) {
      // Not a checksum
      continue;
    }
    const tick = buffer[searchIndex + 1] + (buffer[searchIndex + 2] << 8) + (buffer[searchIndex + 3] << 16) + (buffer[searchIndex + 4] << 24);
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
    console.log(`Unexpected bytes (0x${nextBytes.toString(16)}) at offset 0x${lastIndex.toString(16)}`);
  }
};

export { read, write, fetch, setBuffer, expect, eof, datString, error, idMaps, tryFindHeartbeat };