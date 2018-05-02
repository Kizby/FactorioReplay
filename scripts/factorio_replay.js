import { read, write, fetch, setBuffer, eof, datString, error } from './parse.js';
import { frameHandlers } from './replay_frames.js';
import { loadLevelDat } from './level_loader.js';
import './jszip/jszip.js';

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

const appendElement = (node, tag, contents) => {
  const element = document.createElement(tag);
  if (undefined !== contents) {
    element.textContent = contents;
  }
  node.appendChild(element);
};

const showButtons = () => {
  exportDatButton.hidden = false;
  exportTxtButton.hidden = false;
  sortByTickButton.hidden = false;
  sortByPlayerButton.hidden = false;
};

const loadReplayTxt = (text) => {
  let result = document.createElement('div');
  result.id = 'replayDiv';
  result.contentEditable = true;
  result.spellcheck = false;

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
  showButtons();
};

const loadReplayDat = (arrayBuffer) => {
  setBuffer(new Uint8Array(arrayBuffer));

  let result = document.createElement('div');
  result.id = 'replayDiv';
  result.contentEditable = true;
  result.spellcheck = false;

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
  showButtons();
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
  const filename = file.name.toLowerCase();
  if (filename.endsWith('.txt')) {
    reader.addEventListener('loadend', () => {
      loadReplayTxt(reader.result);
    });
    reader.readAsText(file);
  } else if (filename.endsWith('.dat')) {
    if (filename.startsWith('replay')) {
      reader.addEventListener('loadend', () => {
        loadReplayDat(reader.result);
      });
    } else if (filename.startsWith('level')) {
      reader.addEventListener('loadend', () => {
        loadLevelDat(reader.result);
      });
    }
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
  const curLineBreak = respectPlatform ? lineBreak : '\n';
  if (node.nodeName == 'BR') {
    return curLineBreak;
  }
  let result = '';
  const nodes = node.childNodes;
  for (let i = 0; i < nodes.length; i++) {
    let next = getTextRecursively(nodes[i], respectPlatform);
    if (nodes[i].nodeType == Node.ELEMENT_NODE && nodes[i].nodeName == 'DIV') {
      // Add a line break before and after every DIV
      if (result != '' && !result.endsWith(curLineBreak) && !next.startsWith(curLineBreak)) {
        next = `${curLineBreak}${next}`;
      }
      if (!next.endsWith(curLineBreak)) {
        next = `${next}${curLineBreak}`;
      }
    }
    result = `${result}${next}`;
  }
  return result;
}

exportDatButton.addEventListener('click', () => {
  setBuffer(getTextRecursively(replayDiv, false));
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
  if (initialText.indexOf('+') != -1) {
    console.error('Can\'t sort by tick with relative ticks');
    return;
  }
  let lines = initialText.split('\n');
  stableSort(lines, compare);
  const finalText = lines.join('\n');
  if (initialText != finalText) {
    loadReplayTxt(finalText);
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

// Expose this for convenience
window.loadText = loadReplayTxt;