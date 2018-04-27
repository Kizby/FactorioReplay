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
    while (buffer[curIndex] == ' ') {
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

  const readUint8 = () => {
    return buffer[curIndex++];
  };

  const writeUint8 = (num = fetchNum()) => {
    let result = num.toString(16);
    if (result.length < 2) {
      result = '0' + result;
    }
    datString += result;
  };

  const readUint16 = () => {
    return buffer[curIndex++]
      + (buffer[curIndex++] * 0x100);
  };

  const writeUint16 = (num = fetchNum()) => {
    writeUint8(num & 0xff);
    writeUint8((num / 0x100) & 0xff);
  };

  // Doubt these actually exist, but useful for unknowns
  const readUint24 = () => {
    return buffer[curIndex++]
      + (buffer[curIndex++] * 0x100)
      + (buffer[curIndex++] * 0x10000);
  };

  const writeUint24 = (num = fetchNum()) => {
    writeUint16(num & 0xffff);
    writeUint8((num / 0x10000) & 0xff);
  };

  const readUint32 = () => {
    return buffer[curIndex++]
      + (buffer[curIndex++] * 0x100)
      + (buffer[curIndex++] * 0x10000)
      + (buffer[curIndex++] * 0x1000000);
  };

  const writeUint32 = (num = fetchNum()) => {
    writeUint16(num & 0xffff);
    writeUint16((num / 0x10000) & 0xffff);
  };

  const readInt16 = () => {
    let num = readUint16();
    if (num >= 0x8000) {
      num -= 0x10000;
    }
    return num;
  };

  const writeInt16 = (num = fetchNum()) => {
    if (num < 0) {
      num += 0x10000;
    }
    writeUint16(num);
  };

  const readOptUint16 = () => {
    let num = readUint8();
    if (255 == num) {
      num = readUint16();
    }
    return num;
  };

  const writeOptUint16 = (num = fetchNum()) => {
    if (num > 254) {
      writeUint8(255);
      writeUint16(num);
    } else {
      writeUint8(num);
    }
  };

  const readInt32 = () => {
    let num = readUint32();
    if (num >= 0x80000000) {
      num -= 0x100000000;
    }
    return num;
  };

  const writeInt32 = (num = fetchNum()) => {
    if (num < 0) {
      num += 0x100000000;
    }
    writeUint32(num);
  };

  const readFixed16 = () => {
    return readInt16() / 256;
  };

  const writeFixed16 = (num = fetchNum()) => {
    writeInt16(num * 256);
  };

  const readFixed32 = () => {
    return readInt32() / 256;
  };

  const writeFixed32 = (num = fetchNum()) => {
    writeInt32(num * 256);
  };

  const readOptUint32 = () => {
    let num = readUint8();
    if (255 == num) {
      num = readUint32();
    }
    return num;
  };

  const writeOptUint32 = (num = fetchNum()) => {
    if (num > 254) {
      writeUint8(255);
      writeUint32(num);
    } else {
      writeUint8(num);
    }
  };

  const readString = () => {
    const len = readOptUint32();
    let result = '';
    for (let i = 0; i < len; i++) {
      result += String.fromCharCode(buffer[curIndex++]);
    }
    return result;
  };

  const writeString = (stopAtComma, val) => {
    if (undefined === val) {
      val = fetchString(stopAtComma);
    }
    writeOptUint32(val.length);
    for (let i = 0; i < val.length; i++) {
      writeUint8(val.charCodeAt(i));
    }
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

  const readBytes = (length) => {
    let result = '';
    for (let i = 0; i < length; i++) {
      let byte = readUint8().toString(16);
      if (byte.length == 1) {
        byte = '0' + byte;
      }
      if (i > 0) {
        result += ' ';
      }
      result += byte;
    }
    return result;
  };

  const writeBytes = (count) => {
    for (let i = 0; i < count; i++) {
      if (buffer[curIndex] == ' ') {
        curIndex++; // Consume the space
      }
      datString += buffer.substring(curIndex, curIndex += 2);
    }
  };

  const readBool = () => {
    return readUint8() == 1;
  };

  const writeBool = (val) => {
    if (undefined === val) {
      val = (fetchString() == 'true');
    }
    writeUint8(val ? 1 : 0);
  };

  const readCheckSum = () => {
    const rawCheckSum = readUint32();
    let checkSum = rawCheckSum.toString(16);
    while (checkSum.length < 8) {
      checkSum = '0' + checkSum;
    }
    return checkSum;
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

  const writeCheckSum = () => {
    datString += fetchCheckSum();
  };

  const inventories = [[],
  [undefined, 'Player', 'Toolbelt', 'Gun', 'Ammo', 'Armor', 'Tool'],
  [],
  [],
  [undefined, 'FuelOrContainer', 'Input', 'Output']];
  const getInventory = (context, which) => {
    return inventories[context][which];
  };

  const getIndicesForInventory = () => {
    const inventory = fetchString(true);
    for (let i = 0; i < inventories.length; i++) {
      for (let j = 0; j < inventories[i].length; j++) {
        if (inventories[i][j] == inventory) {
          return [i, j];
        }
      }
    }
  };

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const readDirection = () => {
    return directions[readUint8()];
  };

  const writeDirection = () => {
    const direction = fetchString(true);
    for (let i = 0; i < directions.length; i++) {
      if (directions[i] == direction) {
        writeUint8(i);
        return;
      }
    }
    error = `Can't parse direction "${direction}"`;
  };

  const leaveReasons = ['', 'Dropped', 'Reconnecting', 'MalformedData', 'Desynced', 'CouldNotKeepUp', 'AFK'];
  const readLeaveReason = () => {
    return leaveReasons[readUint8()];
  };

  const writeLeaveReason = () => {
    const leaveReason = fetchString(true);
    for (let i = 0; i < leaveReasons.length; i++) {
      if (leaveReasons[i] == leaveReason) {
        writeUint8(i);
        return;
      }
    }
    error = `Can't parse leave reason "${leaveReason}"`;
  };

  const expect = (val) => {
    if (buffer.substring(curIndex, curIndex + val.length) == val) {
      curIndex += val.length;
      return true;
    }
    return false;
  };

  const tickHandler = () => {
    curTick = readUint32();
    curPlayer = readOptUint16();
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
    [0x0D, 'OpenTechnologies'],
    [0x0F, 'Unknown0F'],
    [0x10, 'OpenBlueprintLibrary'],
    [0x11, 'OpenProductionStatistics'],
    [0x12, 'OpenKillStatistics'],
    [0x16, 'CopyEntitySettings'],
    [0x19, 'ShowInfo'],
    [0x1a, 'JoinSinglePlayer'],
    [0x1b, 'JoinMultiPlayer'],
    [0x23, 'Lag?'],
    [0x27, 'OpenLogisticNetworks'],
    [0x29, 'DropItem', () => {
      return `${readFixed32()}, ${readFixed32()}`;
    }, () => {
      writeFixed32();
      writeFixed32();
    }],
    [0x2a, 'Build', () => {
      const x = readFixed32();
      const y = readFixed32();
      const direction = readDirection();
      const isDragging = readBool();
      const isGhost = readBool();
      const unknown = readUint8();
      const unknowns = (unknown == 0) ? '' : `, ${unknown}`;
      return `${x}, ${y}, ${direction}${isDragging ? ', Dragging' : ''}${isGhost ? ', Ghost' : ''}${unknowns}`
    }, () => {
      writeFixed32();
      writeFixed32();
      writeDirection();
      let isDragging = false;
      if (buffer[curIndex] == 'D') {
        fetchString();
        isDragging = true;
      }
      writeBool(isDragging);
      let isGhost = false;
      if (buffer[curIndex] == 'G') {
        fetchString();
        isGhost = true;
      }
      writeBool(isGhost);
      let unknown = 0;
      if (buffer[curIndex] != '\n') {
        unknown = fetchNum();
      }
      writeUint8(unknown);
    }],
    [0x2b, 'Run', readDirection, writeDirection],
    [0x2e, 'OpenEquipmentGrid', () => {
      const whichInventory = readUint8();
      const slot = readUint16();
      const inventoryContext = readUint16();
      const inventory = getInventory(inventoryContext, whichInventory);
      return `${inventory ? inventory : `${whichInventory}, ${inventoryContext}`}, ${slot}`;
    }, () => {
      let inventoryContext, whichInventory;
      if ('0123456789'.indexOf(buffer[curIndex]) == -1) {
        [inventoryContext, whichInventory] = getIndicesForInventory();
      } else {
        whichInventory = fetchNum();
        inventoryContext = fetchNum();
      }
      writeUint8(whichInventory);
      writeUint16();
      writeUint16(inventoryContext);
    }],
    [0x31, 'ClickItemStack', () => {
      const whichInventory = readUint8();
      const slot = readUint16();
      const inventoryContext = readUint16();
      const inventory = getInventory(inventoryContext, whichInventory);
      return `${inventory ? inventory : `${whichInventory}, ${inventoryContext}`}, ${slot}`;
    }, () => {
      let inventoryContext, whichInventory;
      if ('0123456789'.indexOf(buffer[curIndex]) == -1) {
        [inventoryContext, whichInventory] = getIndicesForInventory();
      } else {
        whichInventory = fetchNum();
        inventoryContext = fetchNum();
      }
      writeUint8(whichInventory);
      writeUint16();
      writeUint16(inventoryContext);
    }],
    [0x32, 'SplitItemStack', () => {
      const whichInventory = readUint8();
      const slot = readUint16();
      const inventoryContext = readUint16();
      const inventory = getInventory(inventoryContext, whichInventory);
      return `${inventory ? inventory : `${whichInventory}, ${inventoryContext}`}, ${slot}`;
    }, () => {
      let inventoryContext, whichInventory;
      if ('0123456789'.indexOf(buffer[curIndex]) == -1) {
        [inventoryContext, whichInventory] = getIndicesForInventory();
      } else {
        whichInventory = fetchNum();
        inventoryContext = fetchNum();
      }
      writeUint8(whichInventory);
      writeUint16();
      writeUint16(inventoryContext);
    }],
    [0x33, 'TransferItemStack', () => {
      const whichInventory = readUint8();
      const slot = readUint16();
      const inventoryContext = readUint16();
      const inventory = getInventory(inventoryContext, whichInventory);
      return `${inventory ? inventory : `${whichInventory}, ${inventoryContext}`}, ${slot}`;
    }, () => {
      let inventoryContext, whichInventory;
      if ('0123456789'.indexOf(buffer[curIndex]) == -1) {
        [inventoryContext, whichInventory] = getIndicesForInventory();
      } else {
        whichInventory = fetchNum();
        inventoryContext = fetchNum();
      }
      writeUint8(whichInventory);
      writeUint16();
      writeUint16(inventoryContext);
    }],
    [0x34, 'TransferInventory', () => {
      const whichInventory = readUint8();
      const slot = readUint16();
      const inventoryContext = readUint16();
      const inventory = getInventory(inventoryContext, whichInventory);
      return `${inventory ? inventory : `${whichInventory}, ${inventoryContext}`}, ${slot}`;
    }, () => {
      let inventoryContext, whichInventory;
      if ('0123456789'.indexOf(buffer[curIndex]) == -1) {
        [inventoryContext, whichInventory] = getIndicesForInventory();
      } else {
        whichInventory = fetchNum();
        inventoryContext = fetchNum();
      }
      writeUint8(whichInventory);
      writeUint16();
      writeUint16(inventoryContext);
    }],
    [0x35, 'CheckSum', () => {
      const checkSum = readCheckSum();
      const previousTick = readUint32();
      return `${checkSum}${previousTick == curTick - 1 ? '' : `, ${previousTick}`}`;
    }, () => {
      writeCheckSum();
      if (buffer[curIndex] != '\n') {
        writeUint32();
      } else {
        writeUint32(curTick - 1);
      }
    }],
    [0x36, 'Craft', () => {
      const recipeId = readUint16();
      let quantity = readUint32();
      if (0xffffffff == quantity) {
        quantity = 'all';
      }
      return `${recipeId}, ${quantity}`;
    }, () => {
      writeUint16();
      if (buffer[curIndex] == 'a') {
        fetchString();
        writeUint32(0xffffffff);
      } else {
        writeUint32();
      }
    }],
    [0x38, 'Shoot', () => {
      const shotTypes = ['None', 'Enemy', 'Selected'];
      return `${shotTypes[readUint8()]}, ${readFixed32()}, ${readFixed32()}`
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
      writeUint8(rawShotType);
      writeFixed32();
      writeFixed32();
    }],
    [0x39, 'ChooseRecipe', () => {
      return `${readUint8()}, ${readUint8()}`;
    }, () => {
      writeUint8();
      writeUint8();
    }],
    [0x3A, 'MoveSelectionLarge', () => {
      return `${readFixed32()}, ${readFixed32()}`
    }, () => {
      writeFixed32();
      writeFixed32();
    }],
    [0x3B, 'Pipette', readUint16, writeUint16],
    [0x3D, 'SplitInventory', () => {
      const whichInventory = readUint8();
      const slot = readUint16();
      const inventoryContext = readUint16();
      const inventory = getInventory(inventoryContext, whichInventory);
      return `${inventory ? inventory : `${whichInventory}, ${inventoryContext}`}, ${slot}`;
    }, () => {
      let inventoryContext, whichInventory;
      if ('0123456789'.indexOf(buffer[curIndex]) == -1) {
        [inventoryContext, whichInventory] = getIndicesForInventory();
      } else {
        whichInventory = fetchNum();
        inventoryContext = fetchNum();
      }
      writeUint8(whichInventory);
      writeUint16();
      writeUint16(inventoryContext);
    }],
    [0x3F, 'ToggleFilter', () => {
      const whichInventory = readUint8();
      const slot = readUint16();
      const inventoryContext = readUint16();
      const inventory = getInventory(inventoryContext, whichInventory);
      const itemId = readUint16();
      return `${inventory ? inventory : `${whichInventory}, ${inventoryContext}`}, ${slot}, ${itemId}`;
    }, () => {
      let inventoryContext, whichInventory;
      if ('0123456789'.indexOf(buffer[curIndex]) == -1) {
        [inventoryContext, whichInventory] = getIndicesForInventory();
      } else {
        whichInventory = fetchNum();
        inventoryContext = fetchNum();
      }
      writeUint8(whichInventory);
      writeUint16();
      writeUint16(inventoryContext);
      writeUint16();
    }],
    [0x43, 'ChooseTechnology', readUint16, writeUint16],
    [0x48, 'Chat', readString, writeString],
    [0x4C, 'ChooseCraftingItemGroup', readUint8, writeUint8],
    [0x51, 'PlaceInEquipmentGrid', () => {
      const column = readUint32();
      const row = readUint32();
      const unknown = readUint8();
      return `${column}, ${row}${unknown == 4 ? '' : unknown}`;
    }, () => {
      writeUint32();
      writeUint32();
      if (buffer[curIndex] != '\n') {
        writeUint8();
      } else {
        writeUint8(4);
      }
    }],
    [0x52, 'TransferFromEquipmentGrid', () => {
      const column = readUint32();
      const row = readUint32();
      const rawHowMany = readUint8();
      let howMany = rawHowMany;
      if (rawHowMany == 1) {
        howMany = 'One'
      } else if (rawHowMany == 2) {
        howMany = 'All'
      }
      return `${column}, ${row}, ${howMany}`;
    }, () => {
      writeUint32();
      writeUint32();
      if (buffer[curIndex] == 'O') {
        fetchString();
        writeUint8(1);
      } else if (buffer[curIndex] == 'A') {
        fetchString();
        writeUint8(2);
      } else {
        writeUint8();
      }
    }],
    [0x56, 'LimitSlots', () => {
      const whichInventory = readUint8();
      const slotCount = readUint16();
      const inventoryContext = readUint16();
      const inventory = getInventory(inventoryContext, whichInventory);
      return `${inventory ? inventory : `${whichInventory}, ${inventoryContext}`}, ${slotCount}`;
    }, () => {
      let inventoryContext, whichInventory;
      if ('0123456789'.indexOf(buffer[curIndex]) == -1) {
        [inventoryContext, whichInventory] = getIndicesForInventory();
      } else {
        whichInventory = fetchNum();
        inventoryContext = fetchNum();
      }
      writeUint8(whichInventory);
      writeUint16();
      writeUint16(inventoryContext);
    }],
    [0x57, 'ChooseFilterCategory', readUint8, readUint8],
    [0x68, 'ConnectionInfo?', () => {
      const playerNumber = readUint8();
      const unknown1 = readUint24(); // No ideas, always 0?
      const checkSum = readCheckSum();
      const unknown2 = readUint24(); // No ideas, always 0?
      let unknown3 = '';
      if (256 == unknown2) {
        unknown3 = readBytes(30); // This random blob happens on connections in lan games
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
      writeUint8(playerNumber);
      writeUint24(unknown1);
      datString += checkSum;
      writeUint24(unknown2);
      if (256 == unknown2) {
        writeBytes(30);
      }
    }],
    [0x6F, 'AddPlayer', () => {
      const playerNumber = readOptUint16();
      const force = readUint8(); // Always 1? Maybe force?
      const name = readString();
      return `${name}, ${playerNumber}, ${force}`;
    }, () => {
      const name = fetchString(true);
      writeOptUint16();
      writeUint8();
      writeString(true, name);
    }],
    [0x76, 'PlaceArea', () => {
      const x = readFixed32();
      const y = readFixed32();
      const direction = readDirection();
      const unknown1 = readUint8(); // No ideas?
      const sideLength = readUint8();
      const isGhost = readBool();
      const unknown2 = readUint8(); // No ideas?
      const unknowns = (unknown1 == 0 && unknown2 == 0) ? '' : `, ${unknown1}, ${unknown2}`;
      return `${x}, ${y}, ${direction}, ${sideLength}${isGhost ? ', Ghost' : ''}${unknowns}`
    }, () => {
      writeFixed32();
      writeFixed32();
      writeDirection();
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
      writeUint8(unknown1);
      writeUint8(sideLength);
      writeBool(isGhost);
      writeUint8(unknown2);
    }],
    [0x91, 'UpdateResolution', () => {
      return `${readUint32()}, ${readUint32()}`;
    }, () => {
      writeUint32();
      writeUint32();
    }],
    [0x9c, 'EnableAutoLaunch', readBool, writeBool],
    [0x94, 'PickUpNearbyItems', readBool, writeBool],
    [0x95, 'MoveSelectionSmall', () => {
      const rawDelta = readUint8();
      const x = ((rawDelta & 0xf0) / 0x10) - 8;
      const y = (rawDelta & 0xf) - 8;
      return `${x}, ${y}`
    }, () => {
      const x = fetchNum(), y = fetchNum();
      writeUint8((x + 8) * 16 + (y + 8));
    }],
    [0x96, 'MoveSelectionTiny', () => {
      return `${(readUint8() - 128) / 256}, ${(readUint8() - 128) / 256}`;
    }, () => {
      writeUint8((fetchNum() * 256) + 128);
      writeUint8((fetchNum() * 256) + 128);
    }],
    [0x97, 'MoveSelection', () => {
      const y = readFixed16();
      const x = readFixed16();
      return `${x}, ${y}`
    }, () => {
      const x = fetchNum();
      writeFixed16(); // Write y first
      writeFixed16(x);
    }],
    [0x99, 'Toolbelt', readUint16, writeUint16],
    [0x9A, 'ChooseWeapon', readUint16, writeUint16],
    [0xA1, 'TransferEntityStack', () => {
      const isInto = readBool();
      return isInto ? 'In' : 'Out';
    }, () => {
      writeBool(fetchString() == 'In');
    }],
    [0xA2, 'RotateEntity', () => {
      const isCounterClockwise = readBool();
      return isCounterClockwise ? 'CCW' : 'CW';
    }, () => {
      writeBool(fetchString() == 'CCW');
    }],
    [0xA3, 'SplitEntityStack', () => {
      const isInto = readBool();
      return isInto ? 'In' : 'Out';
    }, () => {
      writeBool(fetchString() == 'In');
    }],
    [0xA7, 'UnknownA7', readUint8, writeUint8],
    [0xB4, 'LeaveGame', readLeaveReason, writeLeaveReason],
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

        let inputAction = readUint8();
        let frameHandler = inputActionByteToFrameHandler[inputAction];
        while (frameHandler) {
          appendElement(result, 'span', `${tickHandler()}${frameHandler[1]}${frameHandler.length > 2 ? ` ${frameHandler[2]()}` : ''}`);
          appendElement(result, 'br');
          if (curIndex == buffer.length) {
            break;
          }
          inputAction = readUint8();
          frameHandler = inputActionByteToFrameHandler[inputAction];
        }
        if (curIndex < buffer.length) {
          --curIndex; // Take back the byte we interpreted as an InputAction
          appendElement(result, 'span', 'Unhandled bytes:');
          appendElement(result, 'br');
          appendElement(result, 'span', `${readBytes(buffer.length - curIndex)}`);
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

  const skipComments = () => {
    while (curIndex < buffer.length && buffer[curIndex] != '@' && buffer.substring(curIndex, curIndex + 17) != 'UnhandledBytes:\n') {
      // Any line not starting with an @ is treated as a comment
      fetchString();
      expect('\n');
    }
  };

  exportDatButton.addEventListener('click', () => {
    buffer = getTextRecursively(replayDiv, false);
    if (!buffer.endsWith('\n')) {
      buffer = `${buffer}\n`;
    }
    curIndex = 0;
    datString = '';
    let failed = false;
    skipComments();
    while (expect('@')) {
      let colonIndex = buffer.indexOf(':', curIndex);
      let [tick, player] = getTick(buffer.substring(curIndex, colonIndex));
      curIndex = colonIndex + 1;
      while (buffer[curIndex] == ' ') {
        curIndex++;
      }

      let name = '';
      while (buffer[curIndex] != ' ' && buffer[curIndex] != '\n') {
        name += buffer[curIndex++];
      }
      skipCommaAndSpaces();
      let frameHandler = inputActionNameToFrameHandler[name];
      if (!frameHandler) {
        console.error(`Can't handle InputAction "${name}"; only emitting before @${tick}(${player})`);
        failed = true;
        break;
      }

      let lengthBeforeFrame = datString.length;
      writeUint8(frameHandler[0]);
      writeUint32(tick);
      writeOptUint16(player);

      if (frameHandler.length > 2) {
        frameHandler[3]();
      }
      if ('' != error) {
        console.error(`Parse failed with error "${error}"; only emitting before @${tick}(${player}) `);
        error = '';
        datString = datString.substring(0, lengthBeforeFrame);
        failed = true;
        break;
      }
      expect('\n');
      skipComments();
    }
    if (!failed && expect('Unhandled bytes:\n')) {
      writeBytes((buffer.length - curIndex) / 3);
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
      if (a.startsWith('@')) {
        const parsedTick = parseInt(a.substring(1));
        if (!isNaN(parsedTick)) {
          aTick = parsedTick;
        }
      }
      if (b.startsWith('@')) {
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