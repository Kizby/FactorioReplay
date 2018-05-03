import { parseReplayDat, getReplayDatBytes } from '../scripts/index.mjs';
import fs from 'fs';

let allPass = true;

const redCode = '\u001b[0;31m';
const greenCode = '\u001b[0;32m';
const clearCode = '\u001b[0m';

const testOneDirectory = (dir) => {
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
    console.error(` ${numDifferent} line${numDifferent != 1 ? 's' : ''} changed overall.`);
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

  if (pass) {
    console.log(`${greenCode}${dir} replays match!${clearCode}`);
  } else {
    allPass = false;
  }
}

const runTests = () => {
  const testDirs = fs.readdirSync('tests');
  for (let dir of testDirs) {
    const fd = fs.openSync(`tests/${dir}`, 'r');
    if (fs.fstatSync(fd).isDirectory()) {
      testOneDirectory(dir);
    }
    fs.closeSync(fd);
  }
};

runTests();

process.exit(allPass ? 0 : 1);
