import { read, write, fetch, setBuffer, eof, datString, error } from './parse.mjs';
import { frameHandlers } from './replay_frames.mjs';
import { loadLevelDat } from './level_loader.mjs';
import './jszip/jszip.js';

let inputActionByteToFrameHandler = [], inputActionNameToFrameHandler = [];
for (let i = 0; i < frameHandlers.length; i++) {
  inputActionByteToFrameHandler[frameHandlers[i][0]] = frameHandlers[i];
  inputActionNameToFrameHandler[frameHandlers[i][1]] = frameHandlers[i];
}

const parseReplayDat = (arrayBuffer) => {
  setBuffer(new Uint8Array(arrayBuffer));

  let result = '';
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
    result = `${result}${line}\n`;
  }
  return result;
}

const getReplayDatBytes = (text) => {
  setBuffer(text);
  let failed = false;
  let datStringLen = 0;
  for (let lineType = fetch.char(); !failed && !eof(); lineType = fetch.char()) {
    if (lineType == '?') {
      // Arbitrary bytes
      fetch.string(':');
      write.bytes();
    } else if (lineType == '@' || lineType == '+') {
      // Typical case
      // @ - command at a given tick
      // + - command at an offset from the last command
      const [tick, player] = fetch.tick(lineType == '+');
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
      write.optUint16(player, 'player');

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
  return byteArray;
};

export { parseReplayDat, getReplayDatBytes };
