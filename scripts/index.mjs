import {
  read,
  write,
  fetch,
  setBuffer,
  eof,
  datString,
  error,
} from './parse.mjs';
import { frameHandlers, resetPlayers } from './replay_frames.mjs';

let inputActionByteToFrameHandler = [],
  inputActionNameToFrameHandler = [];
for (let i = 0; i < frameHandlers.length; i++) {
  inputActionByteToFrameHandler[frameHandlers[i][0]] = frameHandlers[i];
  inputActionNameToFrameHandler[frameHandlers[i][1]] = frameHandlers[i];
}
console.log(inputActionNameToFrameHandler);

function* parseReplayDat(arrayBuffer) {
  setBuffer(new Uint8Array(arrayBuffer));
  resetPlayers();

  while (!eof()) {
    let line = '';
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
      line = `${tickStr}${frameHandler[1]}${frameArgs}`;
    } else if (!eof()) {
      line = fetch.unhandledBytes();
    }
    yield line;
  }
}

const getReplayDatBytes = (text) => {
  setBuffer(text);
  resetPlayers();
  let failed = false;
  let datStringLen = 0;
  for (
    let lineType = fetch.char();
    !failed && !eof();
    lineType = fetch.char()
  ) {
    if (lineType == '?') {
      // Arbitrary bytes
      fetch.tick();
      write.bytes();
    } else if (lineType == '@' || lineType == '+') {
      // Typical case
      // @ - command at a given tick
      // + - command at an offset from the last command
      const [tick, player] = fetch.tick(lineType == '+');
      console.log(tick, player);
      fetch.whitespace();

      let name = fetch.string(' ');
      console.log(name);
      const frameHandler = inputActionNameToFrameHandler[name];
      if (!frameHandler) {
        console.error(
          `Can't handle InputAction "${name}"; only emitting before @${tick}(${player})`
        );
        failed = true;
        break;
      }

      write.uint8(frameHandler[0]);
      write.uint32(tick);

      // If this is a Join frame, we won't have server id info wired up yet
      let hint;
      switch (name) {
        case 'JoinMultiPlayer':
          hint = 65535;
          break;
        case 'JoinSinglePlayer':
          hint = 255;
          break;
      }
      write.optUint16(player, 'player', hint);

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
        console.error(
          `Parse failed with error "${error}"; only emitting before @${tick}(${player}) `
        );
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
  return byteArray;
};

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

const compareTick = (a, b) => {
  let aTick = 0x100000000,
    bTick = 0x100000000; // If we don't get a valid tick, put these elements at the end
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
};

const comparePlayer = (a, b) => {
  let aPlayer = '\u00ff',
    bPlayer = '\u00ff'; // If we don't get a valid player, put these elements at the end
  const openPosA = a.indexOf('(');
  const closePosA = a.indexOf(')', openPosA);
  if (openPosA != -1 && closePosA != -1) {
    aPlayer = a.substring(openPosA + 1, closePosA);
  }
  const openPosB = b.indexOf('(');
  const closePosB = b.indexOf(')', openPosB);
  if (openPosB != -1 && closePosB != -1) {
    bPlayer = b.substring(openPosB + 1, closePosB);
  }
  // Basically strcmp
  return aPlayer < bPlayer ? -1 : +(aPlayer > bPlayer);
};

export {
  parseReplayDat,
  getReplayDatBytes,
  stableSort,
  compareTick,
  comparePlayer,
};
