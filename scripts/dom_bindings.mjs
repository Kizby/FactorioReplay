import { parseReplayDat, parseReplayJs, getReplayDatBytes } from './index.mjs';
import { loadLevelDat } from './level_loader.mjs';
import { parseReplayFromZip, getZipWithReplay } from './zip_loader.mjs';

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

const loadReplayTxt = (text) => {
  replayTextArea.value = text;
};

const loadReplayDat = (arrayBuffer) => {
  const result = parseReplayDat(arrayBuffer);
  loadReplayTxt(result);
};

const loadReplayJs = (text) => {
  replayJsTextArea.value = text;
  replayTextArea.value = parseReplayJs(text);
}

const loadZip = (arrayBuffer) => {
  parseReplayFromZip(arrayBuffer).then((replayDat) => {
    loadReplayDat(replayDat);
    exportZipButton.innerText = `Save ${getZipWithReplay().name}.zip`;
    exportZipButton.hidden = false;
  }, console.error);
}

// Probably accurate enough?
const lineBreak = /Win/.test(navigator.platform) ? '\r\n' : '\n';

const getTextRecursively = (node, respectPlatform) => {
  let result = node.value;
  // Normalize line endings
  result = result.replace(/\r\n/g, '\n');
  if (respectPlatform) {
    // This might just be restoring what was there, but if there were \r\n's in the textarea, we
    // don't want to turn them into \r\r\n's
    result = result.replace(/\n/g, lineBreak);
  }
  return result;
}

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
  } else if (filename.endsWith('.zip')) {
    reader.addEventListener('loadend', () => {
      loadZip(reader.result);
    });
    reader.readAsArrayBuffer(file);
  }
});

exportDatButton.addEventListener('click', () => {
  const result = getReplayDatBytes(getTextRecursively(replayTextArea, false));
  download(result, 'replay.dat', 'application/octet-stream');
});

exportTxtButton.addEventListener('click', () => {
  const result = getTextRecursively(replayTextArea, true);
  download(result, 'replay.txt', 'text/plain');
});

exportJsButton.addEventListener('click', () => {
  const result = getTextRecursively(replayJsTextArea, true);
  download(result, 'replay.js', 'text/plain');
});

runJsButton.addEventListener('click', () => {
  parseReplayJs(getTextRecursively(replayJsTextArea));
});

exportZipButton.addEventListener('click', () => {
  const text = getTextRecursively(replayDiv, true);
  const dat = getReplayDatBytes(text);
  const zip = getZipWithReplay(dat);
  zip.zip.generateAsync({ type: "arraybuffer" }).then((array) =>
    download(array, zip.name, 'application/zip')
  );
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
  const initialText = getTextRecursively(replayTextArea);
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
