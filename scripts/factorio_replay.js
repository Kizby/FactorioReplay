'use strict';

const appendElement = (node, tag, contents) => {
  const element = document.createElement(tag);
  if (undefined !== contents) {
    element.textContent = contents;
  }
  node.appendChild(element);
};

const loadText = (text) => {
  let result = document.createElement('div');
  result.id = 'replayDiv';
  result.contentEditable = true;

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length == 0 && i == lines.length - 1) {
      // Don't add spurious line for last linebreak
      break;
    }
    appendElement(result, 'span', lines[i]);
    appendElement(result, 'br');
  }
  replayDiv.parentNode.replaceChild(result, replayDiv);
  exportDatButton.hidden = false;
  exportTxtButton.hidden = false;
  sortByTickButton.hidden = false;
  sortByPlayerButton.hidden = false;
};

(() => {
  let buffer, curIndex, curTick, curPlayer, datString, error = '';

  const skipCommaAndSpaces = () => {
    if (buffer[curIndex] == ',') {
      curIndex++;
    }
    while ('\n' != buffer[curIndex] && /\s/.test(buffer[curIndex])) {
      curIndex++;
    }
  };

  const fetchNum = () => {
    let endIndex = curIndex;
    while (buffer[endIndex] != ',' && buffer[endIndex] != '\n') {
      endIndex++;
    }
    const result = parseFloat(buffer.substring(curIndex, endIndex));
    curIndex = endIndex;
    skipCommaAndSpaces();
    return result;
  };

  const fetchString = (stopAtComma) => {
    let endIndex = buffer.indexOf('\n', curIndex);
    if (stopAtComma) {
      const commaIndex = buffer.indexOf(',', curIndex);
      if (-1 != commaIndex && commaIndex < endIndex) {
        endIndex = commaIndex;
      }
    }
    const result = buffer.substring(curIndex, endIndex).trim();
    curIndex = endIndex;
    skipCommaAndSpaces();
    return result;
  };

  const fetchCheckSum = () => {
    let checkSum = fetchString(true);
    let result = '';
    // Need to make this little endian
    while (checkSum.length > 0) {
      result += checkSum.substring(checkSum.length - 2);
      checkSum = checkSum.substring(0, checkSum.length - 2);
    }
    return result;
  };

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const leaveReasons = ['', 'Dropped', 'Reconnecting', 'MalformedData', 'Desynced', 'CouldNotKeepUp', 'AFK'];
  const inventories = [[],
  [undefined, 'Player', 'Toolbelt', 'Gun', 'Ammo', 'Armor', 'Tool'],
  [],
  [],
  [undefined, 'FuelOrContainer', 'Input', 'Output']];

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
  };

  const write = {
    uint8: (num = fetchNum()) => {
      let result = num.toString(16);
      if (result.length < 2) {
        result = '0' + result;
      }
      datString += result;
    },
    uint16: (num = fetchNum()) => {
      write.uint8(num & 0xff);
      write.uint8((num / 0x100) & 0xff);
    },
    uint24: (num = fetchNum()) => {
      write.uint16(num & 0xffff);
      write.uint8((num / 0x10000) & 0xff);
    },
    uint32: (num = fetchNum()) => {
      write.uint16(num & 0xffff);
      write.uint16((num / 0x10000) & 0xffff);
    },
    int16: (num = fetchNum()) => {
      if (num < 0) {
        num += 0x10000;
      }
      write.uint16(num);
    },
    optUint16: (num = fetchNum()) => {
      if (num > 254) {
        write.uint8(255);
        write.uint16(num);
      } else {
        write.uint8(num);
      }
    },
    int32: (num = fetchNum()) => {
      if (num < 0) {
        num += 0x100000000;
      }
      write.uint32(num);
    },
    fixed16: (num = fetchNum()) => {
      write.int16(num * 256);
    },
    fixed32: (num = fetchNum()) => {
      write.int32(num * 256);
    },
    optUint32: (num = fetchNum()) => {
      if (num > 254) {
        write.uint8(255);
        write.uint32(num);
      } else {
        write.uint8(num);
      }
    },
    string: (stopAtComma, val) => {
      if (undefined === val) {
        val = fetchString(stopAtComma);
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
        skipCommaAndSpaces();
      }
    },
    bool: (val) => {
      if (undefined === val) {
        val = (fetchString() == 'true');
      }
      write.uint8(val ? 1 : 0);
    },
    checkSum: () => {
      datString += fetchCheckSum();
    },
    direction: () => {
      const direction = fetchString(true);
      for (let i = 0; i < directions.length; i++) {
        if (directions[i] == direction) {
          write.uint8(i);
          return;
        }
      }
      error = `Can't parse direction "${direction}"`;
    },
    leaveReason: () => {
      const leaveReason = fetchString(true);
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
        const inventory = fetchString(true);
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
        whichInventory = fetchNum();
        inventoryContext = fetchNum();
      }
      write.uint8(whichInventory);
      write.uint16();
      write.uint16(inventoryContext);
    },
  };

  const expect = (val) => {
    if (buffer.substring(curIndex, curIndex + val.length) == val) {
      curIndex += val.length;
      return true;
    }
    return false;
  };

  const tickHandler = () => {
    curTick = read.uint32();
    curPlayer = read.optUint16();
    return `@${curTick}(${curPlayer}): `;
  };

  const getTick = (tickStr) => {
    // @ has already been consumed
    let openIndex = tickStr.indexOf('(');
    curTick = parseInt(tickStr.substring(0, openIndex));
    let closeIndex = tickStr.indexOf(')', openIndex + 1);
    curPlayer = parseInt(tickStr.substring(openIndex + 1, closeIndex));

    return [curTick, curPlayer];
  };

  const frameHandlers = [
    // IgnoreRemaining seems to stop replay parsing and makes the replay continue playing forever
    // instead of stopping at the tick at offset 0x37 in level.dat
    [0x00, 'IgnoreRemaining'],
    [0x01, 'StopRunning'],
    [0x02, 'StartMining'],
    [0x03, 'StopMining'],
    [0x04, 'EnterVehicle'],
    [0x05, 'OpenTargetInventory'],
    [0x06, 'CloseWindow'],
    [0x07, 'OpenPlayerInventory'],
    [0x08, 'ConnectTrain'],
    [0x09, 'DisconnectTrain'],
    [0x0A, 'ClearSelection'],
    [0x0B, 'ClearCursor'],
    [0x0C, 'Unknown0C'],
    [0x0D, 'OpenTechnologies'],
    [0x0E, 'Unknown0E'],
    [0x0F, 'Unknown0F'],
    [0x10, 'OpenBlueprintLibrary'],
    [0x11, 'OpenProductionStatistics'],
    [0x12, 'OpenKillStatistics'],
    [0x13, 'Unknown13'],
    [0x14, 'Unknown14'],
    [0x15, 'Unknown15'],
    [0x16, 'CopyEntitySettings'],
    [0x17, 'Unknown17'],
    [0x18, 'Unknown18'],
    [0x19, 'ShowInfo'],
    [0x1A, 'JoinSinglePlayer'],
    [0x1B, 'JoinMultiPlayer'],
    [0x1C, 'Unknown1C'],
    [0x1D, 'OpenBonuses'],
    [0x1E, 'OpenTrains'],
    [0x1F, 'OpenAchievements'],
    [0x23, 'Lag?'],
    [0x27, 'OpenLogisticNetworks'],
    [0x29, 'DropItem', ['fixed32', 'fixed32']],
    [0x2a, 'Build', () => {
      const x = read.fixed32();
      const y = read.fixed32();
      const direction = read.direction();
      const isDragging = read.bool();
      const isGhost = read.bool();
      const unknown = read.uint8();
      const unknowns = (unknown == 0) ? '' : `, ${unknown}`;
      return `${x}, ${y}, ${direction}${isDragging ? ', Dragging' : ''}${isGhost ? ', Ghost' : ''}${unknowns}`
    }, () => {
      write.fixed32();
      write.fixed32();
      write.direction();
      let isDragging = false;
      if (buffer[curIndex] == 'D') {
        fetchString();
        isDragging = true;
      }
      write.bool(isDragging);
      let isGhost = false;
      if (buffer[curIndex] == 'G') {
        fetchString();
        isGhost = true;
      }
      write.bool(isGhost);
      let unknown = 0;
      if (buffer[curIndex] != '\n') {
        unknown = fetchNum();
      }
      write.uint8(unknown);
    }],
    [0x2b, 'Run', 'direction'],
    [0x2e, 'OpenEquipmentGrid', 'slotInInventory'],
    [0x31, 'ClickItemStack', 'slotInInventory'],
    [0x32, 'SplitItemStack', 'slotInInventory'],
    [0x33, 'TransferItemStack', 'slotInInventory'],
    [0x34, 'TransferInventory', 'slotInInventory'],
    [0x35, 'CheckSum', () => {
      const checkSum = read.checkSum();
      const previousTick = read.uint32();
      return `${checkSum}${previousTick == curTick - 1 ? '' : `, ${previousTick}`}`;
    }, () => {
      write.checkSum();
      if (buffer[curIndex] != '\n') {
        write.uint32();
      } else {
        write.uint32(curTick - 1);
      }
    }],
    [0x36, 'Craft', () => {
      const recipeId = read.uint16();
      let quantity = read.uint32();
      if (0xffffffff == quantity) {
        quantity = 'all';
      }
      return `${recipeId}, ${quantity}`;
    }, () => {
      write.uint16();
      if (buffer[curIndex] == 'a') {
        fetchString();
        write.uint32(0xffffffff);
      } else {
        write.uint32();
      }
    }],
    [0x38, 'Shoot', () => {
      const shotTypes = ['None', 'Enemy', 'Selected'];
      return `${shotTypes[read.uint8()]}, ${read.fixed32()}, ${read.fixed32()}`
    }, () => {
      const shotType = fetchString(true);
      let rawShotType = -1;
      if (shotType == 'None') {
        rawShotType = 0;
      } else if (shotType == 'Enemy') {
        rawShotType = 1;
      } else if (shotType == 'Selected') {
        rawShotType = 2;
      }
      write.uint8(rawShotType);
      write.fixed32();
      write.fixed32();
    }],
    [0x39, 'ChooseRecipe', ['uint8', 'uint8']],
    [0x3A, 'MoveSelectionLarge', ['fixed32', 'fixed32']],
    [0x3B, 'Pipette', 'uint16'],
    [0x3D, 'SplitInventory', 'slotInInventory'],
    [0x3F, 'ToggleFilter', ['slotInInventory', 'uint16']],
    [0x43, 'ChooseTechnology', 'uint16'],
    [0x48, 'Chat', 'string'],
    [0x4C, 'ChooseCraftingItemGroup', 'uint8'],
    [0x51, 'PlaceInEquipmentGrid', () => {
      const column = read.uint32();
      const row = read.uint32();
      const unknown = read.uint8();
      return `${column}, ${row}${unknown == 4 ? '' : unknown}`;
    }, () => {
      write.uint32();
      write.uint32();
      if (buffer[curIndex] != '\n') {
        write.uint8();
      } else {
        write.uint8(4);
      }
    }],
    [0x52, 'TransferFromEquipmentGrid', () => {
      const column = read.uint32();
      const row = read.uint32();
      const rawHowMany = read.uint8();
      let howMany = rawHowMany;
      if (rawHowMany == 1) {
        howMany = 'One'
      } else if (rawHowMany == 2) {
        howMany = 'All'
      }
      return `${column}, ${row}, ${howMany}`;
    }, () => {
      write.uint32();
      write.uint32();
      if (buffer[curIndex] == 'O') {
        fetchString();
        write.uint8(1);
      } else if (buffer[curIndex] == 'A') {
        fetchString();
        write.uint8(2);
      } else {
        write.uint8();
      }
    }],
    [0x56, 'LimitSlots', 'slotInInventory'],
    [0x57, 'ChooseFilterCategory', 'uint8'],
    [0x68, 'ConnectionInfo?', () => {
      const playerNumber = read.uint8();
      const unknown1 = read.uint24(); // No ideas, always 0?
      const checkSum = read.checkSum();
      const unknown2 = read.uint24(); // No ideas, always 0?
      let unknown3 = '';
      if (256 == unknown2) {
        unknown3 = read.bytes(30); // This random blob happens on connections in lan games
      }
      const extras = (playerNumber == curPlayer && unknown1 == 0 && unknown2 == 0)
        ? ''
        : `, ${playerNumber}, ${unknown1}, ${unknown2}, ${unknown3}`;
      return `${checkSum}${extras}`;
    }, () => {
      const checkSum = fetchCheckSum();
      let playerNumber = curPlayer, unknown1 = 0, unknown2 = 0;
      if (buffer[curIndex] != '\n') {
        playerNumber = fetchNum();
        unknown1 = fetchNum();
        unknown2 = fetchNum();
      }
      write.uint8(playerNumber);
      write.uint24(unknown1);
      datString += checkSum;
      write.uint24(unknown2);
      if (256 == unknown2) {
        write.bytes(30);
      }
    }],
    [0x6F, 'AddPlayer', () => {
      const playerNumber = read.optUint16();
      const force = read.uint8(); // Always 1? Maybe force?
      const name = read.string();
      return `${name}, ${playerNumber}, ${force}`;
    }, () => {
      const name = fetchString(true);
      write.optUint16();
      write.uint8();
      write.string(true, name);
    }],
    [0x76, 'PlaceArea', () => {
      const x = read.fixed32();
      const y = read.fixed32();
      const direction = read.direction();
      const unknown1 = read.uint8(); // No ideas?
      const sideLength = read.uint8();
      const isGhost = read.bool();
      const unknown2 = read.uint8(); // No ideas?
      const unknowns = (unknown1 == 0 && unknown2 == 0) ? '' : `, ${unknown1}, ${unknown2}`;
      return `${x}, ${y}, ${direction}, ${sideLength}${isGhost ? ', Ghost' : ''}${unknowns}`
    }, () => {
      write.fixed32();
      write.fixed32();
      write.direction();
      const sideLength = fetchNum();
      let isGhost = false;
      if (buffer[curIndex] == 'G') {
        isGhost = true;
        while (buffer[curIndex] != ',' && buffer[curIndex] != '\n') {
          curIndex++;
        }
      }
      let unknown1 = 0, unknown2 = 0;
      if (buffer[curIndex] != '\n') {
        unknown1 = fetchNum();
        unknown2 = fetchNum();
      }
      write.uint8(unknown1);
      write.uint8(sideLength);
      write.bool(isGhost);
      write.uint8(unknown2);
    }],
    [0x91, 'UpdateResolution', ['uint32', 'uint32']],
    [0x9c, 'EnableAutoLaunch', 'bool'],
    [0x94, 'PickUpNearbyItems', 'bool'],
    [0x95, 'MoveSelectionSmall', () => {
      const rawDelta = read.uint8();
      const x = ((rawDelta & 0xf0) / 0x10) - 8;
      const y = (rawDelta & 0xf) - 8;
      return `${x}, ${y}`
    }, () => {
      const x = fetchNum(), y = fetchNum();
      write.uint8((x + 8) * 16 + (y + 8));
    }],
    [0x96, 'MoveSelectionTiny', () => {
      return `${(read.uint8() - 128) / 256}, ${(read.uint8() - 128) / 256}`;
    }, () => {
      write.uint8((fetchNum() * 256) + 128);
      write.uint8((fetchNum() * 256) + 128);
    }],
    [0x97, 'MoveSelection', () => {
      const y = read.fixed16();
      const x = read.fixed16();
      return `${x}, ${y}`
    }, () => {
      const x = fetchNum();
      write.fixed16(); // Write y first
      write.fixed16(x);
    }],
    [0x99, 'Toolbelt', 'uint16'],
    [0x9A, 'ChooseWeapon', 'uint16'],
    [0xA1, 'TransferEntityStack', () => {
      const isInto = read.bool();
      return isInto ? 'In' : 'Out';
    }, () => {
      write.bool(fetchString() == 'In');
    }],
    [0xA2, 'RotateEntity', () => {
      const isCounterClockwise = read.bool();
      return isCounterClockwise ? 'CCW' : 'CW';
    }, () => {
      write.bool(fetchString() == 'CCW');
    }],
    [0xA3, 'SplitEntityStack', () => {
      const isInto = read.bool();
      return isInto ? 'In' : 'Out';
    }, () => {
      write.bool(fetchString() == 'In');
    }],
    [0xA7, 'UnknownA7', 'uint8'],
    [0xB4, 'LeaveGame', 'leaveReason'],
  ];

  let inputActionByteToFrameHandler = [], inputActionNameToFrameHandler = [];
  for (let i = 0; i < frameHandlers.length; i++) {
    inputActionByteToFrameHandler[frameHandlers[i][0]] = frameHandlers[i];
    inputActionNameToFrameHandler[frameHandlers[i][1]] = frameHandlers[i];
  }

  // Function to download data to a file
  // From https://stackoverflow.com/a/30832210
  const download = (data, filename, type) => {
    var file = new Blob([data], { type: type });
    if (window.navigator.msSaveOrOpenBlob) // IE10+
      window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
      var a = document.createElement("a"),
        url = URL.createObjectURL(file);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 0);
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
    const frameHandler = inputActionNameToFrameHandler['CheckSum'];
    write.uint8(frameHandler[0]);
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

  document.body.addEventListener('dragover', (event) => {
    if (event.dataTransfer.items &&
      event.dataTransfer.items.length > 0 &&
      event.dataTransfer.items[0].kind == 'file') {
      event.preventDefault();
    }
  });

  document.body.addEventListener('drop', (event) => {
    event.preventDefault();
    const file = event.dataTransfer.items[0].getAsFile();
    const reader = new FileReader();
    if (file.name.toLowerCase().endsWith('.txt')) {
      reader.addEventListener('loadend', () => {
        loadText(reader.result);
      });
      reader.readAsText(file);
    } else {
      reader.addEventListener('loadend', () => {
        buffer = new Uint8Array(reader.result);
        curIndex = 0;

        let result = document.createElement('div');
        result.id = 'replayDiv';
        result.contentEditable = true;

        while (curIndex < buffer.length) {
          let inputAction = read.uint8();
          let tickStr = tickHandler();
          let frameHandler = inputActionByteToFrameHandler[inputAction];
          if (frameHandler) {
            let frameArgs = '';
            if (frameHandler.length == 4) {
              // Arbitrary read/write functions
              frameArgs = ` ${frameHandler[2]()}`;
            } else if (frameHandler.length == 3) {
              // Simple sequence of reads
              if (Array.isArray(frameHandler[2])) {
                for (let arg = 0; arg < frameHandler[2].length; arg++) {
                  if (frameArgs.length > 0) {
                    frameArgs = `${frameArgs}, `;
                  }
                  frameArgs = `${frameArgs}${read[frameHandler[2][arg]]()}`;
                }
                frameArgs = ` ${frameArgs}`;
              } else {
                frameArgs = ` ${read[frameHandler[2]]()}`;
              }
            }
            appendElement(result, 'span', `${tickStr}${frameHandler[1]}${frameArgs}`.trim());
          } else if (curIndex < buffer.length) {
            const startIndex = curIndex - 1;
            let tickGuess = tickHandler();
            tickGuess = tickGuess.replace('@', '?');
            curIndex = startIndex; // Take back the bytes we've tried to interpret
            const endIndex = tryFindHeartbeat();
            appendElement(result, 'span', `${tickGuess}${read.bytes(endIndex - curIndex)}`);
          }
          appendElement(result, 'br');
        }
        replayDiv.parentNode.replaceChild(result, replayDiv);
        exportDatButton.hidden = false;
        exportTxtButton.hidden = false;
        sortByTickButton.hidden = false;
        sortByPlayerButton.hidden = false;
      });
      reader.readAsArrayBuffer(file);
    }
  });

  // Probably accurate enough?
  const lineBreak = /Win/.test(navigator.platform) ? '\r\n' : '\n';

  const getTextRecursively = (node, respectPlatform) => {
    if (node.nodeType == Node.TEXT_NODE) {
      return node.nodeValue;
    }
    if (node.nodeType != Node.ELEMENT_NODE) {
      return '';
    }
    if (node.nodeName == 'BR') {
      return respectPlatform ? lineBreak : '\n';
    }
    let result = '';
    const nodes = node.childNodes;
    for (let i = 0; i < nodes.length; i++) {
      const next = getTextRecursively(nodes[i], respectPlatform);
      if (result != '' && nodes[i].nodeType == Node.ELEMENT_NODE && nodes[i].nodeName == 'DIV' && !result.endsWith('\n')) {
        result = `${result}\n${next}`;
        if (!result.endsWith('\n')) {
          result = `${result}\n`;
        }
      } else {
        result = `${result}${next}`;
      }
    }
    return result;
  }

  exportDatButton.addEventListener('click', () => {
    buffer = getTextRecursively(replayDiv, false);
    if (!buffer.endsWith('\n')) {
      buffer = `${buffer}\n`;
    }
    curIndex = 0;
    datString = '';
    let failed = false;
    for (let lineType = buffer[curIndex]; !failed && curIndex < buffer.length; lineType = buffer[curIndex]) {
      // Used in a couple of the cases
      const colonIndex = buffer.indexOf(':', curIndex);
      switch (lineType) {
        default:
          // Unrecognized line types are treated as comments
          curIndex = buffer.indexOf('\n', curIndex) + 1;
          if (0 == curIndex) {
            // Got to then end of input
            curIndex = buffer.length;
            break;
          }
          continue;
        case '?':
          // Arbitrary bytes
          curIndex++;
          if (-1 != colonIndex) {
            curIndex = colonIndex + 1;
          }
          write.bytes();
          expect('\n');
          continue;
        case '@':
          // Typical case - command at a given tick
          curIndex++;
          const [tick, player] = getTick(buffer.substring(curIndex, colonIndex));
          curIndex = colonIndex + 1;
          while (buffer[curIndex] == ' ') {
            curIndex++;
          }

          let name = '';
          while (buffer[curIndex] != ' ' && buffer[curIndex] != '\n') {
            name += buffer[curIndex++];
          }
          const frameHandler = inputActionNameToFrameHandler[name];
          if (!frameHandler) {
            console.error(`Can't handle InputAction "${name}"; only emitting before @${tick}(${player})`);
            failed = true;
            break;
          }

          const lengthBeforeFrame = datString.length;
          write.uint8(frameHandler[0]);
          write.uint32(tick);
          write.optUint16(player);

          if (frameHandler.length == 4) {
            // Arbitrary read/write functions
            frameHandler[3]();
          } else if (frameHandler.length == 3) {
            // Simple sequence of writes
            if (Array.isArray(frameHandler[2])) {
              for (let arg = 0; arg < frameHandler[2].length; arg++) {
                write[frameHandler[2][arg]]();
              }
            } else {
              write[frameHandler[2]]();
            }
          }
          if ('' != error) {
            console.error(`Parse failed with error "${error}"; only emitting before @${tick}(${player}) `);
            error = '';
            datString = datString.substring(0, lengthBeforeFrame);
            failed = true;
            break;
          }
          expect('\n');
      }
    }

    const byteArray = new Uint8Array(datString.length / 2);
    for (let i = 0; i < datString.length / 2; i++) {
      byteArray[i] = parseInt(datString.substring(2 * i, 2 * i + 2), 16);
    }
    download(byteArray, 'replay.dat', 'application/octet-stream');
  });

  exportTxtButton.addEventListener('click', () => {
    let result = getTextRecursively(replayDiv, true);
    download(result, 'replay.txt', 'text/plain');
  });

  // Logic stolen from https://medium.com/@fsufitch/is-javascript-array-sort-stable-46b90822543f
  const stableSort = (array, compare) => {
    let keyedArray = array.map((el, index) => [el, index]);
    keyedArray.sort((a, b) => {
      const rawCompare = compare(a[0], b[0]);
      if (rawCompare != 0) {
        return rawCompare;
      }
      return a[1] - b[1];
    });
    for (let i = 0; i < array.length; i++) {
      array[i] = keyedArray[i][0];
    }
  };

  const sortReplayLines = (compare) => {
    const initialText = getTextRecursively(replayDiv);
    let lines = initialText.split('\n');
    stableSort(lines, compare);
    const finalText = lines.join('\n');
    if (initialText != finalText) {
      loadText(finalText);
    }
  };

  sortByTickButton.addEventListener('click', () => {
    sortReplayLines((a, b) => {
      let aTick = 0x100000000, bTick = 0x100000000; // If we don't get a valid tick, put these elements at the end
      if (a.startsWith('@') || a.startsWith('?')) {
        const parsedTick = parseInt(a.substring(1));
        if (!isNaN(parsedTick)) {
          aTick = parsedTick;
        }
      }
      if (b.startsWith('@') || b.startsWith('?')) {
        const parsedTick = parseInt(b.substring(1));
        if (!isNaN(parsedTick)) {
          bTick = parsedTick;
        }
      }
      return aTick - bTick;
    });
  });

  sortByPlayerButton.addEventListener('click', () => {
    sortReplayLines((a, b) => {
      let aPlayer = 0x10000, bPlayer = 0x10000; // If we don't get a valid player, put these elements at the end
      const openPosA = a.indexOf('(');
      if (openPosA != -1) {
        const parsedPlayer = parseInt(a.substring(openPosA + 1));
        if (!isNaN(parsedPlayer)) {
          aPlayer = parsedPlayer;
        }
      }
      const openPosB = b.indexOf('(');
      if (openPosB != -1) {
        const parsedPlayer = parseInt(b.substring(openPosB + 1));
        if (!isNaN(parsedPlayer)) {
          bPlayer = parsedPlayer;
        }
      }
      return aPlayer - bPlayer;
    });
  });
})();