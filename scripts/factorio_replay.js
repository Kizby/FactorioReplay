import { read, write, fetch, setBuffer, eof, datString, error } from './parse.js';

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
  [0x2a, 'Build', ['fixed32', 'fixed32', 'direction', 'isDragging', 'isGhost', 'uint8ProbablyZero']],
  [0x2b, 'Run', 'direction'],
  [0x2e, 'OpenEquipmentGrid', 'slotInInventory'],
  [0x31, 'ClickItemStack', 'slotInInventory'],
  [0x32, 'SplitItemStack', 'slotInInventory'],
  [0x33, 'TransferItemStack', 'slotInInventory'],
  [0x34, 'TransferInventory', 'slotInInventory'],
  [0x35, 'CheckSum', ['checkSum', 'previousTick']],
  [0x36, 'Craft', ['uint16', 'uint32OrAll']],
  [0x38, 'Shoot', ['shotTarget', 'fixed32', 'fixed32']],
  [0x39, 'ChooseRecipe', ['uint8', 'uint8']],
  [0x3A, 'MoveSelectionLarge', ['fixed32', 'fixed32']],
  [0x3B, 'Pipette', 'uint16'],
  [0x3D, 'SplitInventory', 'slotInInventory'],
  [0x3F, 'ToggleFilter', ['slotInInventory', 'uint16']],
  [0x43, 'ChooseTechnology', 'uint16'],
  [0x48, 'Chat', 'string'],
  [0x4C, 'ChooseCraftingItemGroup', 'uint8'],
  [0x51, 'PlaceInEquipmentGrid', ['uint32', 'uint32', 'uint8ProbablyFour']],
  [0x52, 'TransferFromEquipmentGrid', ['uint32', 'uint32', 'transferCount']],
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
    const checkSum = fetch.checkSum();
    let playerNumber = curPlayer, unknown1 = 0, unknown2 = 0;
    if (!eof()) {
      playerNumber = fetch.num();
      unknown1 = fetch.num();
      unknown2 = fetch.num();
    }
    write.uint8(playerNumber);
    write.uint24(unknown1);
    write.checkSum(checkSum);
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
    const name = fetch.string(',');
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
    const sideLength = fetch.num();
    const nextString = fetch.string(',');
    const isGhost = nextString == 'Ghost';
    let unknown1 = 0;
    if (!eof() || (!isGhost && nextString.length > 0)) {
      if (isGhost) {
        nextString = fetch.string(',');
      }
      unknown1 = parseInt(nextString);
    }
    write.uint8(unknown1);
    write.uint8(sideLength);
    write.bool(isGhost);
    write.uint8ProbablyZero();
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
    const x = fetch.num(), y = fetch.num();
    write.uint8((x + 8) * 16 + (y + 8));
  }],
  [0x96, 'MoveSelectionTiny', () => {
    return `${(read.uint8() - 128) / 256}, ${(read.uint8() - 128) / 256}`;
  }, () => {
    write.uint8((fetch.num() * 256) + 128);
    write.uint8((fetch.num() * 256) + 128);
  }],
  [0x97, 'MoveSelection', () => {
    const y = read.fixed16();
    const x = read.fixed16();
    return `${x}, ${y}`
  }, () => {
    const x = fetch.num();
    write.fixed16(); // Write y first
    write.fixed16(x);
  }],
  [0x99, 'Toolbelt', 'uint16'],
  [0x9A, 'ChooseWeapon', 'uint16'],
  [0xA1, 'TransferEntityStack', 'inOut'],
  [0xA2, 'RotateEntity', () => {
    const isCounterClockwise = read.bool();
    return isCounterClockwise ? 'CCW' : 'CW';
  }, () => {
    write.bool(fetch.string() == 'CCW');
  }],
  [0xA3, 'SplitEntityStack', 'inOut'],
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
      setBuffer(new Uint8Array(reader.result));

      let result = document.createElement('div');
      result.id = 'replayDiv';
      result.contentEditable = true;

      while (!eof()) {
        let inputAction = read.uint8();
        let tickStr = read.tick();
        let frameHandler = inputActionByteToFrameHandler[inputAction];
        if (frameHandler) {
          let frameArgs = '';
          if (frameHandler.length == 4) {
            // Arbitrary read/write functions
            frameArgs = `${frameHandler[2]()}`;
          } else if (frameHandler.length == 3) {
            // Simple sequence of reads
            if (Array.isArray(frameHandler[2])) {
              for (let arg = 0; arg < frameHandler[2].length; arg++) {
                const frameArg = read[frameHandler[2][arg]]();
                if (frameArg.length == 0) {
                  // Optional parameter
                  continue;
                }
                if (frameArgs.length > 0) {
                  frameArgs = `${frameArgs}, `;
                }
                frameArgs = `${frameArgs}${frameArg}`;
              }
            } else {
              frameArgs = `${read[frameHandler[2]]()}`;
            }
          }
          if (frameArgs.length > 0) {
            frameArgs = ` ${frameArgs}`;
          }
          appendElement(result, 'span', `${tickStr}${frameHandler[1]}${frameArgs}`);
        } else if (!eof()) {
          appendElement(result, 'span', fetch.unhandledBytes());
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
  setBuffer(getTextRecursively(replayDiv, false));
  let failed = false;
  let datStringLen = 0;
  for (let lineType = fetch.char(); !failed && !eof(); lineType = fetch.char()) {
    // Used in a couple of the cases
    if (lineType == '?') {
      // Arbitrary bytes
      fetch.string(':');
      write.bytes();
    } else if (lineType == '@') {
      // Typical case - command at a given tick
      const [tick, player] = fetch.tick();
      fetch.whitespace();

      let name = fetch.string(' ');
      const frameHandler = inputActionNameToFrameHandler[name];
      if (!frameHandler) {
        console.error(`Can't handle InputAction "${name}"; only emitting before @${tick}(${player})`);
        failed = true;
        break;
      }

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
        failed = true;
        break;
      }
      datStringLen = datString.length;
    } // else unrecognized line types are treated as comments
    fetch.restOfLine();
  }

  const byteArray = new Uint8Array(datStringLen / 2);
  for (let i = 0; i < datStringLen / 2; i++) {
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
