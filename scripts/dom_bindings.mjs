import {
  parseReplayDat,
  getReplayDatBytes,
  stableSort,
  compareTick,
  comparePlayer,
} from './index.mjs';
import { loadLevelDat } from './level_loader.mjs';
import {
  parseLevelFromZip,
  parseReplayFromZip,
  getZipWithReplay,
} from './zip_loader.mjs';
import { parseReplayJs } from './replay_framework.mjs';
import { progress } from './parse.mjs';

let replayText = '';

// Function to download data to a file
// From https://stackoverflow.com/a/30832210
const download = (data, filename, type) => {
  var file = new Blob([data], { type: type });
  if (window.navigator.msSaveOrOpenBlob)
    // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename);
  else {
    // Others
    var a = document.createElement('a'),
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

const showReplayTxt = () => {
  if (replayText.length > 5000000) {
    replayTextArea.value = `// Only showing first 5MB of replay.txt so your tab stays responsive; you can still download the whole thing if you'd like\n${replayText.substring(
      0,
      5000000
    )}`;
    replayTextArea.readOnly = true;
  } else {
    replayTextArea.value = replayText;
    replayTextArea.readOnly = false;
  }
};

const generateLines = (generator) => {
  let nextLine;
  // Yield every thousand lines
  for (let i = 0; i < 1000; i++) {
    nextLine = generator.next();
    if (nextLine.done) {
      break;
    }
    replayText += `${nextLine.value}\n`;
  }
  if (!nextLine.done) {
    replayTextArea.value = `Loading ${(progress() * 100).toFixed(1)}%`;
    setTimeout(generateLines, 0, generator);
  } else {
    const expectedRenderTime = Math.ceil(
      Math.min(replayText.length / 500000, 10)
    );
    replayTextArea.value = `Rendering replay.txt! It could take up to ${expectedRenderTime} seconds.`;
    setTimeout(showReplayTxt, expectedRenderTime > 5 ? 500 : 0); // Make sure the render warning can render if it will take more than 5 seconds
  }
};

const loadReplayDat = (arrayBuffer) => {
  const lineGenerator = parseReplayDat(arrayBuffer);
  replayText = '';
  replayTextArea.readOnly = true;
  generateLines(lineGenerator);
};

const loadReplayJs = (text) => {
  replayJsTextArea.value = text;
  replayTextArea.value = '';
  parseReplayJs(text);
  sortReplayLines(compareTick);
};

const loadZip = (arrayBuffer) => {
  (parseLevelDat.checked
    ? parseLevelFromZip(arrayBuffer).then(loadLevelDat, console.error)
    : Promise.resolve()
  ).finally(() =>
    parseReplayFromZip(arrayBuffer).then((replayDat) => {
      loadReplayDat(replayDat);
      exportZipButton.innerText = `Save ${getZipWithReplay().name}.zip`;
      exportZipButton.hidden = false;
    })
  );
};

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
};

document.body.addEventListener('dragover', (event) => {
  if (
    event.dataTransfer.items &&
    event.dataTransfer.items.length > 0 &&
    event.dataTransfer.items[0].kind == 'file'
  ) {
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
      replayText = reader.result;
      showReplayTxt();
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
  } else if (filename.endsWith('.js')) {
    reader.addEventListener('loadend', () => {
      loadReplayJs(reader.result);
    });
    reader.readAsText(file);
  }
});

exportDatButton.addEventListener('click', () => {
  const result = getReplayDatBytes(getTextRecursively(replayTextArea, false));
  download(result, 'replay.dat', 'application/octet-stream');
});

exportTxtButton.addEventListener('click', () => {
  if (replayTextArea.readOnly) {
    // Need to use the contents of replayText
    let downloadText = replayText;
    if (lineBreak != '\n') {
      downloadText = replayText.replace(/\n/g, lineBreak);
    }
    download(downloadText, 'replay.txt', 'text/plain');
  } else {
    // User may have edited this, so get what's actually there
    download(
      getTextRecursively(replayTextArea, true),
      'replay.txt',
      'text/plain'
    );
  }
});

exportJsButton.addEventListener('click', () => {
  const result = getTextRecursively(replayJsTextArea, true);
  download(result, 'replay.js', 'text/plain');
});

runJsButton.addEventListener('click', () => {
  replayTextArea.value = '';
  parseReplayJs(getTextRecursively(replayJsTextArea));
  sortReplayLines(compareTick);
});

window.addEventListener('frame', (event) => {
  replayTextArea.value += event.detail + '\n';
});

exportZipButton.addEventListener('click', () => {
  const text = getTextRecursively(replayTextArea, true);
  const dat = getReplayDatBytes(text);
  const zip = getZipWithReplay(dat);
  zip.zip
    .generateAsync({
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 5,
      },
    })
    .then((array) => download(array, zip.name, 'application/zip'));
});

const sortReplayLines = (compare) => {
  const initialText = getTextRecursively(replayTextArea);
  if (initialText.indexOf('+') != -1) {
    console.error("Can't sort by tick with relative ticks");
    return;
  }
  let lines = initialText.split('\n');
  stableSort(lines, compare);
  const finalText = lines.join('\n');
  if (initialText != finalText) {
    replayText = finalText;
    showReplayTxt();
  }
};

sortByTickButton.addEventListener('click', () => sortReplayLines(compareTick));
sortByPlayerButton.addEventListener('click', () =>
  sortReplayLines(comparePlayer)
);

// Adapted from http://jsfiddle.net/2wAzx/13/
const makeIndentsBetter = (el) => {
  el.addEventListener('keydown', (e) => {
    const key = e.keyCode || e.which;
    if (key != 9 && key != 13) {
      // Short circuit out
      return true;
    }

    // get caret position/selection
    const val = el.value,
      start = el.selectionStart,
      end = el.selectionEnd;

    let textToInsert = '';
    let caretMove = 0;

    if (key === 9) {
      // tab was pressed
      textToInsert = '\t';
      caretMove = 1;
    } else if (key === 13) {
      // enter was pressed
      // Use the indentation of the current line on the next line
      // Implicitly handles the not found (-1) case
      const lastLineEnd = val.lastIndexOf('\n', start - 1);
      const currentIndent = val
        .substring(lastLineEnd + 1)
        .match(/([ \t]*).*/)[1];

      textToInsert = lineBreak + currentIndent;
      // Only advance the caret past the line break if it's not already there
      caretMove = currentIndent.length + (val[start] == lineBreak[0] ? 0 : 1);
    }

    // set textarea value to: text before caret + new whitespace + text after caret
    el.value = val.substring(0, start) + textToInsert + val.substring(end);
    // put caret at right position again
    el.selectionStart = el.selectionEnd = start + caretMove;

    // prevent the browser from adding its own newline
    e.preventDefault();

    // Make sure textarea scrolls so caret is visible
    el.blur();
    el.focus();
    return false;
  });
};

for (let textArea of document.getElementsByTagName('textarea')) {
  makeIndentsBetter(textArea);
}

// Expose this for convenience
window.loadText = (text) => {
  replayText = text;
  showReplayTxt();
};
