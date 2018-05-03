import { parseReplayDat, getReplayDatBytes } from '../scripts/index.mjs';
import fs from 'fs';

let allPass = true;

const redCode = '\u001b[0;31m';
const greenCode = '\u001b[0;32m';
const clearCode = '\u001b[0m';

const testOneDirectory = (dir) => {
  let pass = true;
  const replayDat = fs.readFileSync(`tests/${dir}/replay.dat`);
  const replayTxt = fs.readFileSync(`tests/${dir}/replay.txt`, 'ascii').replace(/\r\n/g, '\n');

  const parsedTxt = parseReplayDat(replayDat);
  if (replayTxt != parsedTxt) {
    pass = false;
    console.error(`${redCode}${dir} parse of replay.dat does not match replay.txt.${clearCode}`);
  }

  const parsedDat = getReplayDatBytes(replayTxt);
  if (new Uint8Array(replayDat) != parsedDat) {
    pass = false;
    console.error(`${redCode}${dir} parse of replay.txt does not match replay.dat.${clearCode}`);
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
