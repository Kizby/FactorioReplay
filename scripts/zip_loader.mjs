import './jszip/jszip.mjs';

const loadedZip = {
  name: '?',
  zip: null
};

const parseFileFromJSZip = (zip, filename) => {
  loadedZip.zip = zip;
  for (let filename in zip.files) {
    if (!zip.files.hasOwnProperty(filename)) {
      continue;
    }
    loadedZip.name = filename.substring(0, filename.search(/\//));
    break;
  }
  const object = zip.file(`${loadedZip.name}/${filename}`);
  return object ? object.async('arraybuffer') : new Promise((resolve, _reject) => { resolve(new ArrayBuffer()) });
};

const parseFileFromZip = (zipBytes, filename) => {
  const jszip = new JSZip();
  return jszip.loadAsync(zipBytes)
    .then(zip => parseFileFromJSZip(zip, filename), console.error);
};

const parseReplayFromZip = (zipBytes) => {
  return parseFileFromZip(zipBytes, 'replay.dat');
};

const parseLevelFromZip = (zipBytes) => {
  return parseFileFromZip(zipBytes, 'level.dat');
};

const getZipWithReplay = (replayDat, preserveDate) => {
  if (undefined !== replayDat) {
    // Update the zip and before returning
    const name = `${loadedZip.name}/replay.dat`;
    let options = {};
    if (preserveDate) {
      options.date = loadedZip.zip.file(name).date;
    }
    loadedZip.zip.file(name, replayDat, options);
  }
  return loadedZip;
};

export { parseLevelFromZip, parseReplayFromZip, getZipWithReplay };
