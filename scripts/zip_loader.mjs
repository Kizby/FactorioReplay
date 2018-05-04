import './jszip/jszip.js';

const loadedZip = {
  name: '?',
  zip: null
};

const parseReplayFromJSZip = (zip) => {
  loadedZip.zip = zip;
  zip.forEach((path, file) => {
    if (path.endsWith('/')) {
      loadedZip.name = path.substring(0, path.search(/\//));
    }
  });
  return zip.file(`${loadedZip.name}/replay.dat`)
    .async('arraybuffer');
};

const parseReplayFromZip = (zipBytes) => {
  loadedZip.bytes = zipBytes;
  const zip = new JSZip();
  return zip.loadAsync(zipBytes)
    .then(parseReplayFromJSZip, console.error);
};

const getZipWithReplay = (replayDat) => {
  if (undefined !== replayDat) {
    // Update the zip and before returning
    loadedZip.zip.file(`${loadedZip.name}/replay.dat`, replayDat);
  }
  return loadedZip;
};

export { parseReplayFromZip, getZipWithReplay };
