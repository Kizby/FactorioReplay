import './jszip/jszip.mjs';

const loadedZip = {
  name: '?',
  zip: null
};

const parseReplayFromJSZip = (zip) => {
  loadedZip.zip = zip;
  for (let filename in zip.files) {
    if (!zip.files.hasOwnProperty(filename)) {
      continue;
    }
    loadedZip.name = filename.substring(0, filename.search(/\//));
    break;
  }
  const object = zip.file(`${loadedZip.name}/replay.dat`);
  return object ? object.async('arraybuffer') : new Promise((resolve, reject) => { resolve(new ArrayBuffer()) });
};

const parseReplayFromZip = (zipBytes) => {
  const zip = new JSZip();
  return zip.loadAsync(zipBytes)
    .then(parseReplayFromJSZip, console.error);
};

const getZipWithReplay = (replayDat, preserveDate) => {
  if (undefined !== replayDat) {
    // Update the zip and before returning
    const name = `${loadedZip.name}/replay.dat`;
    let options = {};
    if (preserveDate) {
      options = { date: loadedZip.zip.file(name).date };
    }
    loadedZip.zip.file(name, replayDat, options);
  }
  return loadedZip;
};

export { parseReplayFromZip, getZipWithReplay };
