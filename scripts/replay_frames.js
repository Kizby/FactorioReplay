import { read, write, fetch } from './parse.js';
import { idMaps } from './id_maps.js';

// Keep track of player names the same way we track everything else
idMaps.player = {};

export const frameHandlers = [
  // IgnoreRemaining seems to stop replay parsing and makes the replay continue playing forever
  // instead of stopping at the tick at offset 0x37 in level.dat
  [0x00, 'IgnoreRemaining'],
  [0x01, 'StopRunning'],
  [0x02, 'StartMining'],
  [0x03, 'StopMining'],
  [0x04, 'EnterVehicle'],
  [0x05, 'OpenTargetInventory'],
  [0x06, 'CloseWindow'],
  [0x07, 'OpenPlayerInventory'],
  [0x08, 'ConnectTrain'],
  [0x09, 'DisconnectTrain'],
  [0x0A, 'ClearSelection'],
  [0x0B, 'ClearCursor'],
  [0x0C, 'Unknown0C'],
  [0x0D, 'OpenTechnologies'],
  [0x0E, 'Unknown0E'],
  [0x0F, 'Unknown0F'],
  [0x10, 'OpenBlueprintLibrary'],
  [0x11, 'OpenProductionStatistics'],
  [0x12, 'OpenKillStatistics'],
  [0x13, 'Unknown13'],
  [0x14, 'Unknown14'],
  [0x15, 'Unknown15'],
  [0x16, 'CopyEntitySettings'],
  [0x17, 'Unknown17'],
  [0x18, 'Unknown18'],
  [0x19, 'ShowInfo'],
  [0x1A, 'JoinSinglePlayer'],
  [0x1B, 'JoinMultiPlayer'],
  [0x1C, 'Unknown1C'],
  [0x1D, 'OpenBonuses'],
  [0x1E, 'OpenTrains'],
  [0x1F, 'OpenAchievements'],
  [0x23, 'Lag?'],
  [0x27, 'OpenLogisticNetworks'],
  [0x29, 'DropItem', ['fixed32', 'fixed32']],
  [0x2a, 'Build', ['fixed32', 'fixed32', 'direction', 'isDragging', 'isGhost', 'uint8ProbablyZero']],
  [0x2b, 'Run', 'direction'],
  [0x2e, 'OpenEquipmentGrid', 'slotInInventory'],
  [0x31, 'ClickItemStack', 'slotInInventory'],
  [0x32, 'SplitItemStack', 'slotInInventory'],
  [0x33, 'TransferItemStack', 'slotInInventory'],
  [0x34, 'TransferInventory', 'slotInInventory'],
  [0x35, 'CheckSum', ['checkSum', 'previousTick']],
  [0x36, 'Craft', ['recipe', 'uint32OrAll']],
  [0x38, 'Shoot', ['shotTarget', 'fixed32', 'fixed32']],
  [0x39, 'ChooseRecipe', ['recipe']],
  [0x3A, 'MoveSelectionLarge', ['fixed32', 'fixed32']],
  [0x3B, 'Pipette', 'uint16'],
  [0x3D, 'SplitInventory', 'slotInInventory'],
  [0x3F, 'ToggleFilter', ['slotInInventory', 'item']],
  [0x43, 'ChooseTechnology', 'technology'],
  [0x48, 'Chat', 'string'],
  [0x4C, 'ChooseCraftingItemGroup', 'itemGroup'],
  [0x51, 'PlaceInEquipmentGrid', ['uint32', 'uint32', 'uint8ProbablyFour']],
  [0x52, 'TransferFromEquipmentGrid', ['uint32', 'uint32', 'transferCount']],
  [0x56, 'LimitSlots', 'slotInInventory'],
  [0x57, 'ChooseFilterCategory', 'itemGroup'],
  [0x68, 'ConnectionInfo?', () => {
    const playerNumber = read.curPlayer();
    const unknown1 = read.uint16();
    const checkSum = read.checkSum();
    const unknown2 = read.uint24(); // No ideas, always 0?
    let unknown3 = '';
    if (256 == unknown2) {
      unknown3 = read.bytes(30); // This random blob happens on connections in lan games
    }
    const extras = (playerNumber.toString().length == 0 && unknown1 == 0 && unknown2 == 0)
      ? ''
      : `, ${playerNumber}, ${unknown2}, ${unknown3}`;
    return `${checkSum}${extras}`;
  }, () => {
    const checkSum = fetch.checkSum();
    write.curPlayer();
    write.uint16ProbablyZero();
    write.checkSum(checkSum);

    const unknown2 = write.uint24ProbablyZero();
    if (256 == unknown2) {
      write.bytes(30);
    }
  }],
  [0x6F, 'AddPlayer', () => {
    const playerNumber = read.optUint16();
    const force = read.force();
    const name = read.string();
    idMaps.player[name] = playerNumber;
    idMaps.player[playerNumber] = name;
    return `${name}, ${playerNumber}, ${force}`;
  }, () => {
    const name = fetch.string(',');
    const playerNumber = fetch.num();
    idMaps.player[name] = playerNumber;
    idMaps.player[playerNumber] = name;
    write.optUint16(playerNumber);
    write.force();
    write.string(true, name);
  }],
  [0x76, 'PlaceArea', () => {
    const x = read.fixed32();
    const y = read.fixed32();
    const direction = read.direction();
    const unknown1 = read.uint8(); // No ideas?
    const sideLength = read.uint8();
    const isGhost = read.bool();
    const unknown2 = read.uint8(); // No ideas?
    const unknowns = (unknown1 == 0 && unknown2 == 0) ? '' : `, ${unknown1}, ${unknown2}`;
    return `${x}, ${y}, ${direction}, ${sideLength}${isGhost ? ', Ghost' : ''}${unknowns}`
  }, () => {
    write.fixed32();
    write.fixed32();
    write.direction();
    const sideLength = fetch.num();
    const nextString = fetch.string(',');
    const isGhost = nextString == 'Ghost';
    let unknown1 = 0;
    if (!eof() || (!isGhost && nextString.length > 0)) {
      if (isGhost) {
        nextString = fetch.string(',');
      }
      unknown1 = parseInt(nextString);
    }
    write.uint8(unknown1);
    write.uint8(sideLength);
    write.bool(isGhost);
    write.uint8ProbablyZero();
  }],
  [0x91, 'UpdateResolution', ['uint32', 'uint32']],
  [0x9c, 'EnableAutoLaunch', 'bool'],
  [0x94, 'PickUpNearbyItems', 'bool'],
  [0x95, 'MoveSelectionSmall', () => {
    const rawDelta = read.uint8();
    const x = ((rawDelta & 0xf0) / 0x10) - 8;
    const y = (rawDelta & 0xf) - 8;
    return `${x}, ${y}`
  }, () => {
    const x = fetch.num(), y = fetch.num();
    write.uint8((x + 8) * 16 + (y + 8));
  }],
  [0x96, 'MoveSelectionTiny', () => {
    return `${(read.uint8() - 128) / 256}, ${(read.uint8() - 128) / 256}`;
  }, () => {
    write.uint8((fetch.num() * 256) + 128);
    write.uint8((fetch.num() * 256) + 128);
  }],
  [0x97, 'MoveSelection', () => {
    const y = read.fixed16();
    const x = read.fixed16();
    return `${x}, ${y}`
  }, () => {
    const x = fetch.num();
    write.fixed16(); // Write y first
    write.fixed16(x);
  }],
  [0x99, 'Toolbelt', 'uint16'],
  [0x9A, 'ChooseWeapon', 'uint16'],
  [0xA1, 'TransferEntityStack', 'inOut'],
  [0xA2, 'RotateEntity', () => {
    const isCounterClockwise = read.bool();
    return isCounterClockwise ? 'CCW' : 'CW';
  }, () => {
    write.bool(fetch.string() == 'CCW');
  }],
  [0xA3, 'SplitEntityStack', 'inOut'],
  [0xA7, 'UnknownA7', 'uint8'],
  [0xB4, 'LeaveGame', 'leaveReason'],
];