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
    if (typeof delimiter !== undefined) {
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
  tick: () => {
    const colonIndex = buffer.indexOf(':', curIndex);
    if (colonIndex == -1) {
      error = `Failed to obtain tick on line after tick ${curTick}`;
      return [curTick, curPlayer];
    }
    const tickStr = buffer.substring(curIndex, colonIndex);
    let openIndex = tickStr.indexOf('(');
    curTick = parseInt(tickStr.substring(0, openIndex));
    let closeIndex = tickStr.indexOf(')', openIndex + 1);
    curPlayer = parseInt(tickStr.substring(openIndex + 1, closeIndex));
    curIndex = colonIndex + 1;

    return [curTick, curPlayer];
  },
  unhandledBytes: () => {
    const startIndex = curIndex - 1;
    let tickGuess = fetch.tick();
    tickGuess = tickGuess.replace('@', '?');
    curIndex = startIndex; // Take back the bytes we've tried to interpret
    const endIndex = tryFindHeartbeat();
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
[undefined, 'FuelOrContainer', 'Input', 'Output']];
const shotTargets = ['None', 'Enemy', 'Selected'];
const transferCounts = [undefined, 'One', 'All'];

const read = {
  uint8: () => {
    return buffer[curIndex++];
  },
  uint16: () => {
    return buffer[curIndex++]
      + (buffer[curIndex++] * 0x100);
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
  optUint16: () => {
    let num = read.uint8();
    if (255 == num) {
      num = read.uint16();
    }
    return num;
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
    curPlayer = read.optUint16();
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
  }
};

const write = {
  uint8: (num = fetch.num()) => {
    let result = num.toString(16);
    if (result.length < 2) {
      result = '0' + result;
    }
    datString += result;
  },
  uint16: (num = fetch.num()) => {
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
  int16: (num = fetch.num()) => {
    if (num < 0) {
      num += 0x10000;
    }
    write.uint16(num);
  },
  optUint16: (num = fetch.num()) => {
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
      val = fetch.string(',');
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
    if (typeof val === undefined) {
      val = (fetch.string() == 'true');
    }
    write.uint8(val ? 1 : 0);
  },
  checkSum: (checkSum) => {
    if (typeof checkSum === undefined) {
      checkSum = fetch.checkSum();
    }
    datString += checkSum;
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
  }
};

const tryFindHeartbeat = () => {
  // Factorio emits CheckSum frames every second, on the second, so try to find the next one
  while (curTick % 60 != 0) {
    curTick++;
  }

  // datString should always be unused when this is called, but just in case
  const savedDatString = datString;
  datString = '';
  write.uint8(0x35); // CheckSum
  write.uint32(curTick);
  write.optUint16(0);

  const byteArray = new Uint8Array(datString.length / 2);
  for (let i = 0; i < datString.length / 2; i++) {
    byteArray[i] = parseInt(datString.substring(2 * i, 2 * i + 2), 16);
  }
  datString = savedDatString;

  // Find the next CheckSum frame
  outerLoop:
  for (let searchIndex = curIndex; searchIndex + byteArray.length <= buffer.length; searchIndex++) {
    for (let i = 0; i < byteArray.length; i++) {
      if (byteArray[i] != buffer[searchIndex + i]) {
        // Almost as bad as a goto - js could really use first-class multi-level continue/break
        continue outerLoop;
      }
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
};

const eof = () => {
  return curIndex >= buffer.length;
};

export { read, write, fetch, setBuffer, eof, datString, error };