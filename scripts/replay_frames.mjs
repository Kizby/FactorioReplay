import { read, write, fetch } from './parse.mjs';
import { idMaps } from './id_maps.mjs';

// Keep track of player names the same way we track everything else
idMaps.player = {};
let playerCount = 0;
export const resetPlayers = () => {
  idMaps.player = {};
  playerCount = 0;
};

export const frameHandlers = [
  [0x01, 'StopRunning'],
  [0x02, 'StartMining'],
  [0x03, 'StopMining'],
  [0x04, 'EnterVehicle'],
  [0x05, 'OpenTargetInventory'],
  [0x06, 'CloseWindow'],
  [0x07, 'OpenPlayerInventory'],
  [0x08, 'ConnectTrain'],
  [0x09, 'DisconnectTrain'],
  [0x0a, 'ClearSelection'],
  [0x0b, 'ClearCursor'],
  [0x0d, 'OpenTechnologies'],
  [0x0f, 'OpenBlueprintLibrary'],
  [0x10, 'OpenProductionStatistics'],
  [0x12, 'OpenKillStatistics'],
  [0x14, 'CopyEntitySettings'],
  [0x15, 'PasteEntitySettings'],
  [0x18, 'ShowInfo'],
  [0x1c, 'OpenBonuses'],
  [0x1d, 'OpenTrains'],
  [0x1e, 'OpenAchievements'],
  [0x1f, 'OpenTutorials'],/*
  [0x27, 'OpenLogisticNetworks'],
  [0x2d, 'MoveTrain', ['trainJunctionChoice', 'trainAcceleration']],
  [0x3a, 'MoveSelectionLarge', ['fixed32', 'fixed32']],
  [0x3b, 'Pipette', 'uint16'],
  [0x3d, 'SplitInventory', 'slotInInventory'],
  [0x3f, 'ToggleFilter', ['slotInInventory', 'item']],
  [0x48, 'Chat', 'string'],
  [0x57, 'ChooseFilterCategory', 'itemGroup'],
  [0x5b, 'SelectBlueprintArea', ['fixed32', 'fixed32', 'fixed32', 'fixed32', 'uint32', 'item', 'uint8']],
  [0x5d, 'SaveBlueprint', ['uint8', 'uint8', 'uint8', 'uint8', 'uint32', 'blueprintIcons']],
  [0x60, 'OpenMyBlueprint', 'uint32'],
  [0x65, 'DeleteMyBlueprint', 'uint32'],
  [0x66, 'NewBlueprint', 'item'],
  //[0x6a, 'Unknown6A', () => {
  //  return read.bytes(102); // Or something -.-
  //}, write.bytes],
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
  [0x7a, 'SetItemName', 'string'],
  [0x7b, 'RailPlanner', ['fixed32', 'fixed32', 'int8', 'direction', 'uint8', 'uint8ProbablyZero', 'uint8ProbablyZero', 'uint8ProbablyZero', 'uint8ProbablyZero', 'uint8ProbablyZero']],
  [0x8f, 'SetDestructionFilter', ['entity', 'uint16']],
  [0x91, 'UpdateResolution', ['uint32', 'uint32']],
  [0x9c, 'EnableAutoLaunch', 'bool'],
  [0x98, 'SelectTrain', 'uint32'],
  [0x9a, 'ChooseWeapon', 'uint16'],
  [0xa7, 'UnknownA7', 'uint8'],
  [0xab, 'SetTreesRocksOnly', 'bool'],
  [0xb4, 'LeaveGame', 'leaveReason'],*/

  // Apparently changed sometime between 0.16.late and 0.18.recent
  [0x19, 'JoinSinglePlayer'],
  [0x1a, 'JoinMultiPlayer'],
  [0x2a, 'ToggleExoskeleton'],
  [0x2d, 'StartServer?'],
  [0x32, 'TogglePersonalRoboport'],
  [0x33, 'ToggleExoskeleton'],
  [0x34, 'TogglePersonalLogistics'],
  [0x35, 'CLICK'],
  [0x36, 'DropItem', ['fixed32', 'fixed32']],
  [0x37, 'Build', ['fixed32', 'fixed32', 'direction', 'isNotDragging', 'isNotGhost', 'uint16ProbablyZero']],
  [0x38, 'Run', 'direction'],
  [0x3b, 'OpenEquipmentGrid', 'slotInInventory'],
  [0x3e, 'ClickItemStack', 'slotInInventory'],
  [0x3f, 'SplitItemStack', 'slotInInventory'],
  [0x40, 'TransferItemStack', 'slotInInventory'],
  [0x41, 'TransferInventory', 'slotInInventory'],
  [0x42, 'CheckSum', ['checkSum', 'previousTick']],
  [0x43, 'Craft', ['recipe', 'uint32OrAll']],
  [0x45, 'ShootSelected', ['uint8', 'fixed32', 'fixed32']],
  [0x46, 'ChooseRecipe', ['recipe']],
  [0x47, 'Shoot', ['fixed32', 'fixed32']],
  [0x50, 'ChooseTechnology', 'technology'],
  [0x54, 'Cheat', ['cheatType', 'uint32', 'uint8']],
  [0x5a, 'ChooseCraftingItemGroup', 'itemGroup'],
  [0x5c, 'ChooseCharacterTab', 'characterTab'],
  [0x64, 'PlaceInEquipmentGrid', ['uint32', 'uint32', 'uint8ProbablyFour']],
  [0x65, 'TransferFromEquipmentGrid', ['uint32', 'uint32', 'transferCount']],
  [0x68, 'LimitSlots', 'slotInInventory'],
  [0x7a, 'LoadSavedBlueprints', () => {
    // Can't just use read.player since it's a uint16 here, not an optUint16
    const playerNumber = read.uint16();
    const nextBlueprintId = read.uint32();
    const checkSum = read.checkSum();
    const unknown2 = read.uint8ProbablyZero();
    const blueprintCount = read.uint8();
    let result = `${idMaps.player[playerNumber]} (nextId=${nextBlueprintId}, checksum=${checkSum})`;
    if (unknown2 !== '') {
      result = `${result} ${unknown2}`;
    }
    result = `${result}; ${blueprintCount} blueprints:`;

    for (let i = 0; i < blueprintCount; i++) {
      if (i > 0) {
        result = `${result},`;
      }
      result = `${result} ${read.blueprintOrBook()}`;
    }
    if (read.uint8() != 0) {
      throw "No null terminus on blueprint list?";
    }
    return result;
  }, () => {
    // Can't just use write.player since it's a uint16 here, not an optUint16
    write.uint16(idMaps.player[fetch.string(' ')]);
    if (!fetch.literalString('(nextId=')) return;
    write.uint32();
    if (!fetch.literalString('checksum=')) return;
    const checkSum = fetch.checkSum(')');
    write.checkSum(checkSum);
    if (!fetch.literalString(')')) return;
    write.uint8ProbablyZero(';');
    if (!fetch.literalString(';')) return;
    const blueprintCountString = fetch.string(' ');
    const blueprintCount = write.uint8(blueprintCountString);
    if (!fetch.literalString('blueprints:')) return;
    for (let i = 0; i < blueprintCount; i++) {
      if (i > 0) {
        fetch.commaAndWhitespace();
      }
      write.blueprintOrBook();
    }
    write.uint8(0);
  }],
  [0x81, 'AddPlayer', () => {
    const playerNumber = read.uint24();
    const force = read.force();
    const name = read.string();
    const wat = read.uint16();
    let extras = `, ${wat}`;
    if (playerNumber == playerCount) {
      idMaps.player[name] = playerNumber;
      idMaps.player[playerNumber] = name;
      ++playerCount;
    } else if (idMaps.player[playerNumber] != name) {
      // Factorio won't be happy, but let's make it representable
      extras = `${extras}, ${playerNumber}`;

      // Go ahead and add it to the map anyway
      idMaps.player[name] = playerNumber;
      idMaps.player[playerNumber] = name;
    }
    if (force != 'player') {
      extras = `${extras}, ${force}`;
    }
    return `${name}${extras}`;
  }, () => {
    const name = fetch.string(',');
    const wat = fetch.num();
    let extra = fetch.string(',');
    let playerNumber = idMaps.player[name] || playerCount;
    if (extra != '' && /[1234567890]/.test(extra[0])) {
      playerNumber = parseInt(extra);
      extra = fetch.string(',');
    } else if (playerNumber == playerCount) {
      playerCount++;
    }
    let force = 'player';
    if (extra != '') {
      force = extra;
    }
    idMaps.player[name] = playerNumber;
    idMaps.player[playerNumber] = name;
    write.uint24(playerNumber);
    write.force(force);
    write.string(true, name);
    write.uint16(wat);
  }],
  [0xaa, 'SetQuickbarSlot', ['uint16', 'uint32', 'uint8ProbablyZero']],
  [0xab, 'Quickbar', ['uint16', 'uint16ProbablyZero']],
  [0xac, 'SetActiveQuickbar', ['uint8', 'uint8']],
  [0xb4, 'PickUpNearbyItems', 'bool'],
  [0xb5, 'MoveSelectionSmall', () => {
    const rawDelta = read.uint8();
    const x = ((rawDelta & 0xf0) / 0x10) - 8;
    const y = (rawDelta & 0xf) - 8;
    return `${x}, ${y}`
  }, () => {
    const x = fetch.num(), y = fetch.num();
    write.uint8((x + 8) * 16 + (y + 8));
  }],
  [0xb6, 'MoveSelectionTiny', () => {
    return `${(read.uint8() - 128) / 256}, ${(read.uint8() - 128) / 256} `;
  }, () => {
    write.uint8((fetch.num() * 256) + 128);
    write.uint8((fetch.num() * 256) + 128);
  }],
  [0xb7, 'MoveSelection', () => {
    const y = read.fixed16();
    const x = read.fixed16();
    return `${x}, ${y} `
  }, () => {
    const x = fetch.num();
    write.fixed16(); // Write y first
    write.fixed16(x);
  }],
  [0xc0, 'TransferEntityStack', 'inOut'],
  [0xc1, 'RotateEntity', () => {
    const isCounterClockwise = read.bool();
    return isCounterClockwise ? 'CCW' : 'CW';
  }, () => {
    write.bool(fetch.string() == 'CCW');
  }],
  [0xc2, 'SplitEntityStack', 'inOut'],
  [0xc4, 'SetZoom', 'double'],
  [0xd3, 'RotateActiveQuickbars', 'uint8'],
  [0xdd, 'ToggleMap', 'uint8'],
  [0xde, 'SetPlayerColorBGRA', ['uint8', 'uint8', 'uint8', 'uint8']],
];