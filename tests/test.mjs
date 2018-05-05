import { parseReplayDat, getReplayDatBytes } from '../scripts/index.mjs';
import { parseReplayFromZip, getZipWithReplay } from '../scripts/zip_loader.mjs';
import { parseReplayJs } from '../scripts/replay_framework.mjs';
import fs from 'fs';

let allPass = true;

const redCode = '\u001b[0;31m';
const greenCode = '\u001b[0;32m';
const clearCode = '\u001b[0m';

const testOneDirectory = async (dir) => {
  let pass = true;
  const replayDatRaw = fs.readFileSync(`tests/${dir}/replay.dat`);

  const replayTxt = fs.readFileSync(`tests/${dir}/replay.txt`, 'ascii').replace(/\r\n/g, '\n');
  const parsedTxt = parseReplayDat(replayDatRaw);
  if (replayTxt != parsedTxt) {
    pass = false;
    console.error(`${redCode}${dir} parse of replay.dat does not match replay.txt.${clearCode}`);
    const replayLines = replayTxt.split('\n');
    const parsedLines = parsedTxt.split('\n');
    let numDifferent = 0;
    for (let i = 0; i < replayLines.length && i < parsedLines.length; i++) {
      if (replayLines[i] != parsedLines[i]) {
        if (numDifferent == 0) {
          console.error(` Line ${i + 1} has changed from < to >`);
          console.error(` <${replayLines[i]}`)
          console.error(` >${parsedLines[i]}`)
        }
        numDifferent++;
      }
    }
    console.error(` ${numDifferent} line${numDifferent != 1 ? 's' : ''} (out of ${replayLines.length}) changed overall.`);
  }

  const replayDat = new Uint8Array(replayDatRaw);
  const parsedDat = getReplayDatBytes(replayTxt);
  for (let i = 0; i < replayDat.length || i < parsedDat.length; i++) {
    if (i >= replayDat.length || i >= parsedDat.length || replayDat[i] != parsedDat[i]) {
      pass = false;
      console.error(`${redCode}${dir} parse of replay.txt does not match replay.dat at byte 0x${i.toString(16)}${clearCode}`);
      break;
    }
  }

  const saveZipRaw = fs.readFileSync(`tests/${dir}/${dir}.zip`);
  await parseReplayFromZip(saveZipRaw).then((rawDatFromZip) => {
    const parsedDatFromZip = new Uint8Array(rawDatFromZip);
    for (let i = 0; i < replayDat.length || i < parsedDatFromZip.length; i++) {
      if (i >= replayDat.length || i >= parsedDatFromZip.length || replayDat[i] != parsedDatFromZip[i]) {
        pass = false;
        console.error(`${redCode}${dir} replay.dat in ${dir}.zip does not match replay.dat at byte 0x${i.toString(16)}${clearCode}`);
        break;
      }
    }
  });

  const zip = getZipWithReplay(replayDat, true);
  if (zip.name != dir) {
    pass = false;
    console.error(`${redCode}${dir} save in ${dir}.zip has the wrong name: "${zip.name}". It should be "${dir}".${clearCode}`);
  }
  const saveZipBytes = new Uint8Array(saveZipRaw);
  await zip.zip.generateAsync({ type: "arraybuffer" }).then((array) => {
    const generatedZipBytes = new Uint8Array(array);
    for (let i = 0; i < saveZipBytes.length || i < generatedZipBytes.length; i++) {
      if (i >= saveZipBytes.length || i >= generatedZipBytes.length || saveZipBytes[i] != generatedZipBytes[i]) {
        pass = false;
        console.error(`${redCode}${dir} generated ${dir}.zip does not match original ${dir}.zip at byte 0x${i.toString(16)}${clearCode}`);
        break;
      }
    }
  });

  if (fs.existsSync(`tests/${dir}/replay.js`)) {
    globalReplayText = [];
    const replayJs = fs.readFileSync(`tests/${dir}/replay.js`, 'ascii').replace(/\r\n/g, '\n');
    parseReplayJs(replayJs);
    const replayLines = replayTxt.split('\n');
    let numDifferent = 0;
    for (let i = 0; i < replayLines.length && i < globalReplayText.length; i++) {
      if (replayLines[i] != globalReplayText[i]) {
        if (numDifferent == 0) {
          pass = false;
          console.error(`${redCode}${dir} parse of replay.js does not match replay.txt.${clearCode}`);
          console.error(` Line ${i + 1} has changed from < to >`);
          console.error(` <${replayLines[i]}`)
          console.error(` >${globalReplayText[i]}`)
        }
        numDifferent++;
      }
    }
    if (numDifferent > 0) {
      console.error(` ${numDifferent} line${numDifferent != 1 ? 's' : ''} (out of ${replayLines.length}) changed overall.`);
    }
  }


  if (pass) {
    console.log(`${greenCode}${dir} replays match!${clearCode}`);
  } else {
    allPass = false;
  }
}

// Add infrastructure to catch the events replay_framework.mjs uses to emit replay.txt
let globalReplayText = [];

// Gross hack, but it works
global.dispatchEvent = function (event) {
  globalReplayText[globalReplayText.length] = `${event.detail}`;
};
global.CustomEvent = class {
  constructor(name, extras) {
    this.name = name;
    this.detail = extras.detail;
  }
}

// Actually run the tests
const runTests = async () => {
  const testDirs = fs.readdirSync('tests');
  for (let dir of testDirs) {
    const fd = fs.openSync(`tests/${dir}`, 'r');
    if (fs.fstatSync(fd).isDirectory()) {
      try {
        await testOneDirectory(dir);
      } catch (e) {
        console.error(e);
        allPass = false;
      }
    }
    fs.closeSync(fd);
  }
  process.exit(allPass ? 0 : 1);
};

runTests();
