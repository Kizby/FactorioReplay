import { parseReplayFromZip, getZipWithReplay } from './zip_loader.mjs';
import { tryFindHeartbeat } from './parse.mjs'

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

const stripReplayDat = (arrayBuffer) => {
  return new Promise((resolve) => {
    const buffer = new Uint8Array(arrayBuffer);
    const strippedSegments = [];
    for (let curIndex = 0; curIndex < buffer.length;) {
      const nextIndex = tryFindHeartbeat(buffer, curIndex);
      strippedSegments.push(buffer.subarray(curIndex, nextIndex));
      curIndex = nextIndex + 14; // Checksum frames are 14 bytes long
    }
    const strippedLength = strippedSegments.reduce((sum, element) => sum + element.length, 0);
    const strippedBuffer = new Uint8Array(strippedLength);
    let curIndex = 0;
    for (const segment of strippedSegments) {
      strippedBuffer.set(segment, curIndex);
      curIndex += segment.length;
    }
    return resolve(strippedBuffer);
  });
};

const stripZip = (arrayBuffer) => {
  return parseReplayFromZip(arrayBuffer)
    .then(replayDat => stripReplayDat(replayDat), console.error)
    .then(dat => getZipWithReplay(dat), console.error);
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
  if (filename.endsWith('.dat')) {
    reader.addEventListener('loadend', () =>
      stripReplayDat(reader.result)
        .then(result => download(result, file.name, 'application/octet-stream'), console.error)
    );
    reader.readAsArrayBuffer(file);
  } else if (filename.endsWith('.zip')) {
    reader.addEventListener('loadend', () =>
      stripZip(reader.result)
        .then(zip => zip.zip.generateAsync({
          type: "arraybuffer",
          compression: "DEFLATE",
          compressionOptions: {
            level: 5
          }
        }), console.error)
        .then(array => download(array, file.name, 'application/zip'), console.error)
    );

    reader.readAsArrayBuffer(file);
  }
});
