import { read, write, fetch, setBuffer, expect, eof } from './parse.mjs';
import { idMapTypes, idMaps } from './id_maps.mjs';

const loadLevelDat = (arrayBuffer) => {
  setBuffer(new Uint8Array(arrayBuffer));
  const [major, minor, patch] = [read.uint16(), read.uint16(), read.uint16()];
  console.log(`Factorio version: ${major}.${minor}.${patch}`);
  if (major != 1 || minor != 1 || patch != 59) {
    console.error(
      `This tool has only been tested on Factorio 1.1.59! Use it with version ${major}.${minor}.${patch} at your own risk!`
    );
  }

  console.log(`Unknown: ${read.uint32()}`);

  const scenario = read.string();
  const scenarioContext = read.string();
  console.log(`Scenario: ${scenario}(${scenarioContext})`);

  expect(read.uint32, 1);
  expect(read.uint32, 0x1000000);
  expect(read.uint8, major);
  expect(read.uint8, minor);
  expect(read.uint8, patch);

  const buildNumber = read.uint16();
  console.log(`Build number: ${buildNumber}`);

  expect(read.uint8, 1);

  const modCount = read.optUint32();
  console.log('Mods:');
  for (let i = 0; i < modCount; i++) {
    const modName = read.string();
    const [modMajor, modMinor, modPatch] = [
      read.uint8(),
      read.uint8(),
      read.uint8(),
    ];
    const modCheckSum = read.checkSum();
    console.log(
      ` ${modName} v${modMajor}.${modMinor}.${modPatch}, config checksum ${modCheckSum}`
    );
  }

  expect(read.uint32, 0);
  expect(read.uint32, 5);
  expect(read.uint16, 0);

  const lastTick = read.uint32();
  console.log(`Current map tick: ${lastTick}`);
  expect(read.uint32, lastTick);
  expect(read.uint32, lastTick);

  const water = {
    scale: read.float(),
    coverage: read.float(),
  };
  console.log(`Water:`);
  console.log(` Scale: ${water.scale}`);
  console.log(` Coverage: ${water.coverage}`);

  const resourceCount = read.uint8();
  for (let i = 0; i < resourceCount; i++) {
    const name = read.string();
    const [frequency, size, richness] = [
      read.float(),
      read.float(),
      read.float(),
    ];
    console.log(`${name}:`);
    console.log(` Frequency: ${frequency}`);
    console.log(` Size: ${size}`);
    console.log(` Richness: ${richness}`);
  }

  expect(read.uint16, 0x100);

  const seed = read.uint32();
  console.log(`Map seed: ${seed}`);

  const [mapWidth, mapHeight] = [read.uint32(), read.uint32()];
  console.log(`Map size: ${mapWidth}x${mapHeight}`);

  expect(read.uint32, 0x20007fff);
  expect(read.uint32, 0x2000ffff);
  expect(read.uint32, 0x7fffffff);
  expect(read.uint32, 0xe000);
  expect(read.uint32, 0xe000);
  expect(read.uint32, 0x80010000);

  const startingArea = read.float();
  console.log(`Starting area: ${startingArea}`);

  const isPeaceful = read.bool();
  console.log(`Peaceful: ${isPeaceful}`);

  expect(read.uint8, 1);
  expect(read.uint16, 0x7fff);
  expect(read.uint8, 0);
  expect(read.uint32, 0);
  expect(read.uint32, 0);

  expect(read.string, 'cliff');
  const cliff = {
    frequency: read.float(),
    continuity: read.float(),
  };

  console.log(`Cliffs:`);
  console.log(` Frequency: ${cliff.frequency}`);
  console.log(` Continuity: ${cliff.continuity}`);

  expect(read.float, 1);
  expect(read.uint8, 1);
  const pollutionEnabled = read.bool();
  console.log(`Pollution: ${pollutionEnabled ? 'Enabled' : 'Disabled'}`);
  console.log(` Diffusion ratio: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(
    ` Absorption modifier: ${(expect(read.uint8, 1), read.double())}`
  );
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(
    ` Minimum to damage trees: ${(expect(read.uint8, 1), read.double())}`
  );
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(
    ` Absorbed per damaged tree: ${(expect(read.uint8, 1), read.double())}`
  );
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(
    ` Attack cost modifier: ${(expect(read.uint8, 1), read.double())}`
  );
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);

  console.log(
    `Unknown: ${(expect(read.uint8, 1), read.bool()) ? 'Enabled' : 'Disabled'}`
  );
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(
    ` Unknown: ${(expect(read.uint8, 1), read.bool()) ? 'Enabled' : 'Disabled'}`
  );

  console.log(
    `Evolution: ${
      (expect(read.uint8, 1), read.bool()) ? 'Enabled' : 'Disabled'
    }`
  );
  console.log(` Time factor: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Destroy factor: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Pollution factor: ${(expect(read.uint8, 1), read.double())}`);

  console.log(
    `Enemy Expansion: ${
      (expect(read.uint8, 1), read.bool()) ? 'Enabled' : 'Disabled'
    }`
  );
  console.log(
    ` Maximum expansion distance: ${(expect(read.uint8, 1), read.uint32())}`
  );
  console.log(` Unknown: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Minimum group size: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(` Maximum group size: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(
    ` Minimum cooldown (ticks): ${(expect(read.uint8, 1), read.uint32())}`
  );
  console.log(
    ` Maximum cooldown (ticks): ${(expect(read.uint8, 1), read.uint32())}`
  );
  console.log(` Unknown: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(
    ` Unknown: ${(expect(read.uint8, 1), read.bool()) ? 'Enabled' : 'Disabled'}`
  );
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);

  console.log(` Unknown: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.uint32())}`);
  console.log(` Unknown: ${(expect(read.uint8, 1), read.double())}`);

  console.log(` Unknown: ${(expect(read.uint8, 1), read.uint8())}`);

  expect(read.uint32, 0);
  expect(read.uint32, 100);
  expect(read.uint32, 500);

  expect(read.uint8, 1);
  expect(read.uint8, 3);
  expect(read.double, 2);
  expect(read.double, 3);
  expect(read.double, 4);
  expect(read.uint8, 1);
  expect(read.uint32, 20);

  expect(read.uint32, 3);
  expect(read.uint32, 0);
  expect(read.uint32, 0);
  // console.log(`Recipe difficulty: ${read.bool() ? 'Expensive' : 'Normal'}`);
  // console.log(`Technology difficulty: ${read.bool() ? 'Expensive' : 'Normal'}`);
  // console.log(`Technology price multiplier: ${read.double()}`);

  for (let i = 0; i < 16; i++) {
    console.log(`Unknown: ${read.checkSum()}`);
  }
  expect(read.uint32, 0);
  //expect(read.uint32, 0);

  const parseDataValues = (name, readNum) => {
    idMaps[name] = {};
    const numData = readNum();
    console.log(` ${name}: {`);
    for (let i = 0; i < numData; i++) {
      const category = read.string();
      console.log(`  // ${category}:`);
      const numItems = readNum();
      for (let j = 0; j < numItems; j++) {
        const itemName = read.string();
        const itemId = readNum();
        idMaps[name][itemName] = itemId;
        idMaps[name][itemId] = itemName;
        console.log(`   "${itemName}": ${itemId},`);
        console.info(`   ${itemId}: "${itemName}",`);
      }
    }
    console.info(`},`);
  };

  console.log('idMaps = {');
  // We skip the last one (force) for now since that's handled below
  for (let i = 0; i < idMapTypes.length - 1; i++) {
    parseDataValues(idMapTypes[i][0], read[idMapTypes[i][1]]);
  }

  const numJsons = read.uint8();
  if (numJsons > 0) {
    console.log('Json files:');
  }
  for (let i = 0; i < numJsons; i++) {
    console.log(` ${read.string()}: ${read.string()}`);
  }

  expect(read.uint32, 316);
  expect(read.uint32, 1);
  expect(read.uint32, 1);
  expect(read.uint32, 1);
  expect(read.uint32, 0);
  expect(read.uint32, 0);
  expect(read.uint32, 1);
  expect(read.uint32, 1);
  expect(read.uint32, 0);
  expect(read.uint32, 0);
  expect(read.uint8, 0);

  const numForces = read.uint32();
  idMaps.force = {};
  if (numForces > 0) {
    console.log(` force: {`);
  }
  for (let i = 0; i < numForces; i++) {
    const forceId = read.uint8();
    const forceName = read.string();
    idMaps.force[forceId] = forceName;
    idMaps.force[forceName] = forceId;
    console.log(`   "${forceName}": ${forceId},`);
    console.info(`   ${forceId}: "${forceName}",`);
    // Boatload of data for each force, (check LuaForce for a small sample)
    // We'll just cheat to skip it now, but it may be worth parsing someday
    // Hope this doesn't change size much...
    // Update 0.18.21, this section is now variable size so we need to actually
    // figure this out
    if (true) return;
    read.bytes(49314);
  }
  console.log(' };');
  console.log('};');

  // Look for the start of the second resource spec
  let byteQueue = [read.uint8(), read.uint8(), read.uint8()];
  while (
    byteQueue[0] != water.frequency ||
    byteQueue[1] != water.size ||
    byteQueue[2] != resourceCount
  ) {
    byteQueue[0] = byteQueue[1];
    byteQueue[1] = byteQueue[2];
    byteQueue[2] = read.uint8();
  }

  console.log(`Water:`);
  console.log(
    ` Frequency: ${
      water.frequency == 0
        ? 'Only in starting area'
        : frequencies[water.frequency]
    }`
  );
  console.log(` Size: ${sizes[water.size]}`);

  for (let i = 0; i < resourceCount; i++) {
    const name = read.string();
    const [frequency, size, richness] = [
      frequencies[read.uint8()],
      sizes[read.uint8()],
      richnesses[read.uint8()],
    ];
    console.log(`${name}:`);
    console.log(` Frequency: ${frequency}`);
    console.log(` Size: ${size}`);
    console.log(` Richness: ${richness}`);
  }

  expect(read.uint16, 0x100);

  expect(read.uint32, seed);
  console.log(`Map seed: ${seed}`);

  expect(read.uint32, mapWidth);
  expect(read.uint32, mapHeight);
  console.log(`Map size: ${mapWidth}x${mapHeight}`);

  expect(read.uint32, 0x30007fff);
  expect(read.uint32, 0x3000ffff);
  expect(read.uint32, 0x7fffffff);
  expect(read.uint32, 0xd000);
  expect(read.uint32, 0xd000);
  expect(read.uint32, 0);

  expect(read.uint8, startingArea);
  console.log(`Starting area: ${sizes[startingArea]}`);

  expect(read.bool, isPeaceful);
  console.log(`Peaceful: ${isPeaceful}`);

  expect(read.uint8, 1);
  expect(read.uint32, 0x7fff);
  expect(read.uint8, 0);
  expect(read.uint32, 0);
  expect(read.uint16, 0);

  expect(read.string, 'cliff');
  expect(read.float, cliff.size);
  expect(read.float, cliff.frequency);
  console.log(`Cliffs:`);
  console.log(` Frequency: ${cliff.frequency}${cliffFrequencyString}`);
  console.log(` Size: ${cliff.size}${cliffSizeString}`);

  // Cheat again because this block seems to be variable size
  let targetQueue = [
    6,
    'n'.charCodeAt(0),
    'a'.charCodeAt(0),
    'u'.charCodeAt(0),
    'v'.charCodeAt(0),
    'i'.charCodeAt(0),
    's'.charCodeAt(0),
  ];
  let foundNauvis = true;
  for (let i = 0; i < targetQueue.length; i++) {
    byteQueue[i] = read.uint8();
    foundNauvis = foundNauvis && byteQueue[i] == targetQueue[i];
  }
  while (!foundNauvis) {
    foundNauvis = true;
    for (let i = 0; i < targetQueue.length - 1; i++) {
      byteQueue[i] = byteQueue[i + 1];
      foundNauvis = foundNauvis && byteQueue[i] == targetQueue[i];
    }
    byteQueue[targetQueue.length - 1] = read.uint8();
    foundNauvis =
      foundNauvis &&
      byteQueue[targetQueue.length - 1] == targetQueue[targetQueue.length - 1];
  }

  const surface = 'nauvis';
  console.log(`Surface: ${surface}`);
  expect(read.uint8, 0);
  expect(read.uint32, 0);
  console.log(`Unknown: ${read.double()}`);
  console.log(`Unknown: ${read.double()}`);
  console.log(`Unknown: ${read.double()}`);
  console.log(`Unknown: ${read.double()}`);
  console.log(`Unknown: ${read.double()}`);
  expect(read.uint8, 0);
  expect(read.uint32, 0);
  expect(read.uint32, 0);
  console.log(`Unknown: ${read.double()}`);
  console.log(`Unknown: ${read.float()}`);
  console.log(`Unknown: ${read.double()}`);

  read.bytes(1963);

  const numLuas = read.uint8();
  if (numLuas > 0) {
    console.log('Lua files:');
  }
  for (let i = 0; i < numLuas; i++) {
    console.log(` ${read.string()}: ${read.string()}`);
  }

  expect(read.uint8, 0);
  expect(read.double, 1);
  expect(read.uint32, 5);
  expect(read.uint32, 7);
  expect(read.uint32, 0);
  expect(read.uint16, 0);
  expect(read.uint32, 32);
  expect(read.uint32, 0);
  expect(read.uint16, 0);
  expect(read.uint32, 33);
  expect(read.uint32, 0);
  expect(read.uint16, 0);
  expect(read.uint32, 34);
  expect(read.uint16, 0);
  expect(read.uint32, 35);
  expect(read.uint16, 0);
  expect(read.uint16, 65535);
  expect(read.uint32, 0);
  expect(read.uint16, 0);
  expect(read.uint32, 1);
  expect(read.uint16, 0);
  expect(read.uint32, 0);
  expect(read.uint32, 0);
  expect(read.uint32, 0);
  expect(read.uint8, 0);
  expect(read.uint32, 0xffffffff);
  expect(read.uint16, 256);
  expect(read.uint32, 1);
  expect(read.uint32, 1);
  expect(read.uint32, 0);
  expect(read.uint8, 0);
  console.log(`Map settings preset: ${read.string()}`);
  while (!eof()) {
    expect(read.uint8, 0);
  }
};

export { loadLevelDat, idMaps };
