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
  [0x04, 'ToggleDriving'],
  [0x05, 'OpenGui'],
  [0x06, 'CloseGui'],
  [0x07, 'OpenCharacterGui'],
  [0x08, 'OpenCurrentVehicleGui'],
  [0x09, 'ConnectRollingStock'],
  [0x0a, 'DisconnectRollingStock'],
  [0x0b, 'SelectedEntityCleared'],
  [0x0c, 'ClearCursor'],
  [0x0d, 'ResetAssemblingMachine'],
  [0x0e, 'OpenTechnologyGui'],
  [0x0f, 'LaunchRocket'],
  [0x10, 'OpenProductionGui'],
  [0x11, 'StopRepair'],
  [0x12, 'CancelNewBlueprint'],
  [0x13, 'CloseBlueprintRecord'],
  [0x14, 'CopyEntitySettings'],
  [0x15, 'PasteEntitySettings'],
  [0x16, 'DestroyOpenedItem'],
  [0x17, 'CopyOpenedItem'],
  [0x18, 'ToggleShowEntityInfo'],
  [0x19, 'SingleplayerInit'],
  [0x1a, 'MultiplayerInit'],
  [0x1b, 'DisconnectAllPlayers'],
  [0x1c, 'SwitchToRenameStopGui'],
  [0x1d, 'OpenBonusGui'],
  [0x1e, 'OpenTrainsGui'],
  [0x1f, 'OpenAchievementsGui'],
  [0x20, 'CycleBlueprintBookForwards'],
  [0x21, 'CycleBlueprintBookBackwards'],
  [0x22, 'CycleClipboardForwards'],
  [0x23, 'CycleClipboardBackwards'],
  [0x24, 'StopMovementInTheNextTick'],
  [0x25, 'ToggleEnableVehicleLogisticsWhileMoving'],
  [0x26, 'ToggleDeconstructionItemEntityFilterMode'],
  [0x27, 'ToggleDeconstructionItemTileFilterMode'],
  [0x28, 'OpenLogisticGui'],
  [0x29, 'SelectNextValidGun'],
  [0x2a, 'ToggleMapEditor'],
  [0x2b, 'DeleteBlueprintLibrary'],
  [0x2c, 'GameCreatedFromScenario'],
  [0x2d, 'StartServer'],
  [0x2e, 'ActivateCut'],
  [0x2f, 'ActivatePaste'],
  [0x30, 'Undo'],
  [0x31, 'TogglePersonalRoboport'],
  [0x32, 'ToggleEquipmentMovementBonus'],
  [0x33, 'TogglePersonalLogisticRequests'],
  [0x34, 'ToggleEntityLogisticRequests'],
  [0x35, 'StopBuildingByMoving'],
  [0x36, 'FlushOpenedEntityFluid'],
  [0x37, 'ForceFullCRC'],
  [0x38, 'OpenTipsAndTricksGui', ['uint8', 'uint8', 'uint8', 'uint8']],
  [0x39, 'OpenBlueprintLibraryGui', ['uint8', 'uint8']],
  [0x3a, 'ChangeBlueprintLibraryTab', ['uint8', 'uint8']],
  [0x3b, 'DropItem', ['fixed32', 'fixed32']],
  [
    0x3c,
    'Build',
    () => {
      let result = '';
      result += read.fixed32() + ', '; // x
      result += read.fixed32() + ', '; // y
      result += read.direction() + ', '; // direction
      let bool1 = read.uint8(); //isDragging();
      let bool2 = read.uint8(); //isGhost();
      result += `${bool1}, ${bool2}, `;
      let isDragging = bool2 == 1;
      if (isDragging) {
        result += `${read.fixed32()}, ${read.fixed32()}, `;
        let is = read.uint8();
        result += (is >> 5) + ', ' + ((is >> 1) % 2) + ', ';
      }
      if (bool1 == 1 && bool2 == 0) {
        result += `${read.uint8()}, `;
      }
      return result;
    },
    () => {
      write.fixed32();
      write.fixed32();
      write.direction();
      write.uint8();
      if (write.uint8() == 1) {
        write.fixed32();
        write.fixed32();
      }
    },
  ],
  [0x3d, 'StartWalking', 'direction'],
  [0x3e, 'BeginMiningTerrain', ['fixed32', 'fixed32']],
  [0x3f, 'ChangeRidingState', ['direction', 'uint8', 'bool']],
  [
    0x40,
    'OpenItem',
    [
      'inv', //
      'uint16',
      'inventory',
      'inventoryType',
    ],
  ],
  [0x41, 'OpenParentOfOpenedItem', 'slotInInventory'],
  [0x42, 'ResetItem', 'slotInInventory'],
  [0x43, 'DestroyItem', 'slotInInventory'],
  [0x44, 'OpenModItem', 'slotInInventory'],
  [0x45, 'OpenEquipment', 'slotInInventory'],
  [0x46, 'CursorTransfer', 'slotInInventory'],
  [0x47, 'CursorSplit', 'slotInInventory'],
  [0x48, 'StackTransfer', 'slotInInventory'],
  [0x49, 'InventoryTransfer', 'slotInInventory'],
  [0x4a, 'CheckCRCHeuristic', ['checkSum', 'previousTick']],
  [0x4b, 'Craft', ['recipe', 'uint32OrAll']],
  [0x4c, 'WireDragging', ['fixed32', 'fixed32']],
  [0x4d, 'ChangeShootingState', ['fixed32', 'fixed32']],
  [0x4e, 'SetupAssemblingMachine'],
  [0x4f, 'SelectedEntityChanged', ['fixed32', 'fixed32']],
  [
    0x50,
    'SmartPipette',
    ['uint8', 'uint8', 'uint8', 'uint8', 'uint8', 'uint8'],
  ],
  [0x51, 'StackSplit', 'slotInInventory'],
  [0x52, 'InventorySplit', 'slotInInventory'],
  [0x53, 'CancelCraft'],
  [0x54, 'SetFilter'],
  [0x55, 'CheckCRC'],
  [0x56, 'SetCircuitCondition'],
  [0x57, 'SetSignal'],
  [0x58, 'StartResearch', 'fixed16'],
  [0x59, 'SetLogisticFilterItem'],
  [0x5a, 'SetLogisticFilterSignal'],
  [0x5b, 'SetCircuitModeOfOperation'],
  [
    0x5c,
    'GuiClick',
    [
      'uint32', //
      'mouseButton',
      'bool', // alt
      'bool', // ctrl
      'bool', // shift
    ],
  ],
  [0x5d, 'GuiConfirmed'],
  [0x5e, 'WriteToConsole', 'string'],
  [0x5f, 'MarketOffer'],
  [0x60, 'AddTrainStation'],
  [0x61, 'ChangeTrainStopStation'],
  [0x62, 'ChangeActiveItemGroupForCrafting', 'itemGroup'],
  [0x63, 'ChangeActiveItemGroupForFilters', 'itemGroup'],
  [0x64, 'ChangeActiveCharacterTab'],
  [0x65, 'GuiTextChanged'],
  [0x66, 'GuiCheckedStateChanged'],
  [0x67, 'GuiSelectionStateChanged'],
  [0x68, 'GuiSelectedTabChanged', 'slotInInventory'],
  [0x69, 'GuiValueChanged'],
  [0x6a, 'GuiSwitchStateChanged'],
  [0x6b, 'GuiLocationChanged'],
  [0x6c, 'PlaceEquipment', ['int32', 'int32', 'int8']],
  [0x6d, 'TakeEquipment', ['int32', 'int32', 'int8']],
  [0x6e, 'UseItem'],
  [0x6f, 'SendSpidertron', ['fixed32', 'fixed32']],
  [0x70, 'UseArtilleryRemote'],
  [0x71, 'SetInventoryBar'],
  [0x72, 'MoveOnZoom'],
  [0x73, 'StartRepair'],
  [
    0x74,
    'Deconstruct',
    [
      'int32',
      'int32',
      'int32',
      'int32',
      'int16',
      'int16',
      'bool', // skipFogOfWar
    ],
  ],
  [
    0x75,
    'Upgrade',
    [
      'int32',
      'int32',
      'int32',
      'int32',
      'int16',
      'int16',
      'bool', // skipFogOfWar
      'bool', // loader
    ],
  ],
  [
    0x76,
    'Copy',
    [
      'int32',
      'int32',
      'int32',
      'int32',
      'int16',
      'int16',
      'bool', // skipFogOfWar
    ],
  ],
  [0x77, 'AlternativeCopy'],
  [0x78, 'SelectBlueprintEntities', 'item'],
  [0x79, 'AltSelectBlueprintEntities'],
  [0x7a, 'SetupBlueprint'],
  [0x7b, 'SetupSingleBlueprintRecord'],
  [0x7c, 'CopyOpenedBlueprint', 'blueprintDesc'],
  [0x7d, 'ReassignBlueprint'],
  [0x7e, 'OpenBlueprintRecord'],
  [0x7f, 'GrabBlueprintRecord'],
  [0x80, 'DropBlueprintRecord', ['uint8', 'uint8']],
  [0x81, 'DeleteBlueprintRecord'],
  [0x82, 'UpgradeOpenedBlueprintByRecord'],
  [0x83, 'UpgradeOpenedBlueprintByItem'],
  [0x84, 'SpawnItem'],
  [0x85, 'SpawnItemStackTransfer'],
  [
    0x86,
    'UpdateBlueprintShelf',
    [
      'uint8',
      'uint8',
      'uint8',
      'uint8',
      'uint8',
      'uint8',
      'uint8',
      'uint8',
      'uint8',
      'uint8',
      'uint8',
      'uint8',
      'uint8',
      'uint8',
      'uint8',
    ],
  ],
  [0x87, 'TransferBlueprint'],
  [0x88, 'TransferBlueprintImmediately'],
  [0x89, 'EditBlueprintToolPreview'],
  [0x8a, 'RemoveCables'],
  [0x8b, 'ExportBlueprint'],
  [0x8c, 'ImportBlueprint', 'customInput'],
  [0x8d, 'ImportBlueprintsFiltered'],
  [
    0x8e,
    'PlayerJoinGame',
    () => {
      const playerNumber = read.uint24();
      const force = read.force();
      const name = read.string();
      const playerType = read.uint16();
      let extras = ``;
      if (playerType != 256) {
        // Map editor player?
        extras = `, type=${playerType}`;
      }
      if (playerNumber == playerCount) {
        idMaps.player[name] = playerNumber;
        idMaps.player[playerNumber] = name;
        ++playerCount;
      } else if (idMaps.player[playerNumber] != name) {
        // Factorio won't be happy, but let's make it representable
        extras = `${extras}, id=${playerNumber}`;

        // Go ahead and add it to the map anyway
        idMaps.player[name] = playerNumber;
        idMaps.player[playerNumber] = name;
      }
      if (force != 'player') {
        extras = `${extras}, force=${force}`;
      }
      return `${name}${extras}`;
    },
    () => {
      const name = fetch.string(',');
      let extra = fetch.string(',');
      let playerNumber = idMaps.player[name] || playerCount;
      let playerType = 256; // Regular player
      let force = 'player';
      while (extra != '') {
        const parts = extra.split('=');
        switch (parts[0]) {
          case 'type':
            playerType = parts[1];
            break;
          case 'id':
            playerNumber = parts[1];
            break;
          case 'force':
            force = parts[1];
            break;
        }
        extra = fetch.string(',');
      }
      if (playerNumber == playerCount) {
        playerCount++;
      }
      idMaps.player[name] = playerNumber;
      idMaps.player[playerNumber] = name;
      write.uint24(playerNumber);
      write.force(force);
      write.string(true, name);
      write.uint16(playerType);
    },
  ],
  [0x8f, 'PlayerAdminChange'],
  [0x90, 'CancelDeconstruct'],
  [0x91, 'CancelUpgrade'],
  [0x92, 'ChangeArithmeticCombinatorParameters'],
  [0x93, 'ChangeDeciderCombinatorParameters'],
  [0x94, 'ChangeProgrammableSpeakerParameters'],
  [0x95, 'ChangeProgrammableSpeakerAlertParameters'],
  [0x96, 'ChangeProgrammableSpeakerCircuitParameters'],
  [0x97, 'SetVehicleAutomaticTargetingParameters'],
  [0x98, 'BuildTerrain'],
  [0x99, 'ChangeTrainWaitCondition'],
  [0x9a, 'ChangeTrainWaitConditionData'],
  [
    0x9b,
    'CustomInput',
    [
      'uint8',
      'uint8',
      'uint8',
      'uint8',
      'uint8',
      'uint8',
      'uint8',
      'uint8',
      'uint8',
      'uint8',
      'uint8',
    ],
  ],
  [0x9c, 'ChangeItemLabel'],
  [0x9d, 'ChangeItemDescription'],
  [0x9e, 'ChangeEntityLabel'],
  [0x9f, 'BuildRail'],
  [0xa0, 'CancelResearch'],
  [0xa1, 'SelectArea'],
  [0xa2, 'AltSelectArea'],
  [0xa3, 'ReverseSelectArea'],
  [0xa4, 'ServerCommand'],
  [0xa5, 'SetControllerLogisticTrashFilterItem'],
  [0xa6, 'SetEntityLogisticTrashFilterItem'],
  [
    0xa7,
    'SetInfinityContainerFilterItem',
    [
      'item', //
      'uint8', //
      'uint8', //
      'uint8', //
      'uint8', //
      'uint8', //
      'uint8', //
      'uint8', //
      // 'uint8', //
      // 'uint16',
      // 'uint32',
    ],
  ],
  [0xa8, 'SetInfinityPipeFilter'],
  [0xa9, 'ModSettingsChanged'],
  [0xaa, 'SetEntityEnergyProperty'],
  [0xab, 'EditCustomTag'],
  [0xac, 'EditPermissionGroup'],
  [0xad, 'ImportBlueprintString'],
  [0xae, 'ImportPermissionsString'],
  [0xaf, 'ReloadScript'],
  [0xb0, 'ReloadScriptDataTooLarge'],
  [0xb1, 'GuiElemChanged'],
  [0xb2, 'BlueprintTransferQueueUpdate'],
  [0xb3, 'DragTrainSchedule'],
  [0xb4, 'DragTrainWaitCondition'],
  [0xb5, 'SelectItem'],
  [0xb6, 'SelectEntitySlot'],
  [0xb7, 'SelectTileSlot'],
  [0xb8, 'SelectMapperSlot'],
  [
    0xb9,
    'DisplayResolutionChanged',
    ['uint8', 'uint8', 'uint8', 'uint8', 'uint8', 'uint8', 'uint8', 'uint8'],
  ],
  [0xba, 'QuickBarSetSlot'],
  [
    0xbb,
    'QuickBarPickSlot',
    [
      'uint16', // location
      'bool', // pickGhostCursor
      'bool', // cursorSplit
    ],
  ],
  [0xbc, 'QuickBarSetSelectedPage'],
  [0xbd, 'PlayerLeaveGame'],
  [
    0xbe,
    'MapEditorAction', // too much to handle in one go, maybe needs separate file
    () => {
      let result = '';
      const action = read.uint8('editorAction');
      result += action + ', ';
      switch (action) {
        case 'BuildEntity':
          result += read.fixed32() + ', '; // x
          result += read.fixed32() + ', '; // y
          result += read.direction() + ', '; // direction
          let isDragging = read.isDragging();
          result += isDragging + isDragging ? ', ' : '';
          // if (isDragging)
          result += read.uint8() + ', ';
          // result += read.uint32() + ', '; // surfaceIndex
          // result += read.fixed32() + ', ';
          // result += read.fixed32() + ', ';
          result += read.uint8() + ', ';
          result += read.uint8() + ', '; // entityPrototype
          break;
        case 'DropItem':
          result += read.uint32() + ', '; // surfaceIndex
          result += read.fixed32() + ', ';
          result += read.fixed32() + ', ';
          result += read.uint8() + ', '; // entityPrototype
          break;
        case 'DeleteSurface':
        case 'RemoveAllEntities':
        case 'ReplaceTilesWithLabTiles':
        case 'RegenerateAllDecoratives':
        case 'RemoveEmptyChunks':
          result += read.uint32() + ', '; // surfaceIndex
          break;
        case 'CloneItem':
        case 'DeleteItem':
          result += read.uint32() + ', '; // ItemStackTargetSpecification
          result += read.uint32() + ', '; //
          break;
        case 'SetForceCeaseFire':
        case 'SetForceFriend':
          result += read.uint8() + ', '; // force id
          result += read.bool() + ', '; // bool
          result += read.uint32() + ', ';
          result += read.uint32() + ', ';
          result += read.uint8() + ', ';
          break;
        case 'SetForceShareChart':
        case 'SetForceFriendlyFireEnabled':
          result += read.uint8() + ', '; // force id
          result += read.bool() + ', '; // bool
          break;
        case 'CreateSurface':
          result += read.string() + ', ';
          result += read.uint32() + ', ';
          result += read.uint32() + ', ';
          break;
        case 'SetEditorTool':
          result += idMaps['editorType'][read.uint8()] + ', ';
          result += read.uint32(); // toolIndex
          break;
        case 'SetCliffEditorID':
        case 'SetResourceEditorID':
          result += read.uint8() + ', ' + read.uint8(); // entityId
          break;
        case 'SetEntityEditorID':
          result += idMaps['entity'][read.uint8()] + ', ' + read.uint8(); // entityId
          break;
        case 'RemoveEntity':
        case 'ChangeTileVariation':
          result += read.fixed32() + ', ';
          result += read.fixed32() + ', ';
          result += read.bool();
          break;
        case 'DeleteForce':
        case 'SetBuildAsForce':
        case 'SetDestinationForce':
        case 'SwitchToForce':
          result += idMaps['force'][read.uint8()]; // forceId
          break;
        case 'SwitchToSurface':
        case 'CreateForce':
        case 'SetEntityTag':
          result += read.string() + ', ';
          break;
        case 'SetEntityVariation':
        case 'SetEntityDifficultyMask':
          result += read.uint8() + ', ';
          break;
        case 'SetEntityHealth':
        case 'TickCustom':
        case 'ChangeToolSize':
          result += read.uint32() + ', ';
          break;
        case 'SetBrushToolRepetition':
        case 'SetCursorToolIntensity':
        case 'SetBrushToolIntensity':
        case 'SetBrushToolSize':
          result += read.uint8() + ', ';
          result += read.uint8() + ', ';
          result += read.uint8() + ', ';
          result += read.uint8() + ', ';
          result += read.uint8() + ', ';
          result += read.uint8() + ', ';
          result += read.uint8() + ', ';
          result += read.uint8() + ', ';
          result += read.uint8() + ', ';
          result += read.uint8() + ', ';
          result += read.uint8() + ', ';
          result += read.uint8() + ', ';
          result += read.uint8() + ', ';

          break;
        case 'SetBrushToolShape':
          result += idMaps['editorType'][read.uint8()] + ', ';
          result += read.uint32() + ', '; // toolIndex
          result += read.uint8();
          break;
        case 'SetTileEditorID':
        case 'InstantResearch':
        case 'UnResearch':
        case 'SetDecorativeEditorID':
        case 'ClearCursor':
        // result += read.uint32() + ', ';
        case 'SetActiveEditor':
          result += idMaps['editorType'][read.uint8()];
          break;
        case 'SetCorpseExpires':
        case 'SetPlacedCorpsesNeverExpire':
        case 'SetShowCharacterTabInControllerGui':
        case 'SetShowInfinityFiltersInControllerGui':
        case 'SetInfinityRemoveUnfilteredItems':
        case 'SetEntityIndestructible':
        case 'SetEntityNotMinable':
        case 'SetEntityNotRotatable':
        case 'SetEntityNotOperable':
        case 'SetEntityToBeLooted':
        case 'SetRecipeLocked':
        case 'ChangeEntityVariation':
        case 'ChangeCliffVariation':
        case 'ChangeResourceVariation':
        case 'SetAlwaysDrawPositions':
        case 'SetAlwaysDrawAreas':
        case 'SetSnapScriptingObjectsToGrid':
        case 'SetCloneAreaManualCollisionMode':
        case 'SetCloneAreaSmartDragMode':
        case 'SetSnapCloneAreaToChunk':
        case 'SetSnapCloneAreaToGrid':
        case 'SetClearDestinationDecoratives':
        case 'SetClearDestinationEntities':
        case 'SetCloneDecoratives':
        case 'SetCloneEntities':
        case 'SetCloneTiles':
        case 'SetSmartOutOfMapCollisionMode':
        case 'SetSmartEntityCollisionMode':
        case 'SetSmartTileCollisionMode':
        case 'SetRemoveCollidingDecoratives':
        case 'SetShowHiddenEntities':
        case 'SetFillBuiltEntityEnergyBuffers':
        case 'SetGenerateNeighborChunks':
        case 'SetInstantRailPlanner':
        case 'SetInstantUpgrading':
        case 'SetInstantDeconstruction':
        case 'SetInstantBlueprintBuilding':
        case 'SetDrawCursorLight':
        case 'SetShowAdditionalEntityInfoGui':
        case 'SetShowEntityHealthBars':
        case 'SetShowEntityTags':
        case 'SetShowStatusIcons':
        case 'SetRenderAsDay':
        case 'SetEntityUpdatePaused':
          result += read.bool() + ', ';
          break;
        default:
          break;
      }
      return result;
    },
    () => {}, // todo
  ],
  [0xbf, 'PutSpecialItemInMap'],
  [0xc0, 'PutSpecialRecordInMap'],
  [0xc1, 'ChangeMultiplayerConfig'],
  [0xc2, 'AdminAction'],
  [0xc3, 'LuaShortcut'],
  [0xc4, 'TranslateString'],
  [0xc5, 'FlushOpenedEntitySpecificFluid'],
  [0xc6, 'ChangePickingState', ['uint8']],
  [0xc9, 'SelectedEntityChangedRelative', ['fixed16', 'fixed16']], // Don't know
  [
    0xc7,
    'SelectedEntityChangedVeryClose',
    () => {
      const num = read.uint8();
      const x = ((num & 0xf) * 0x10 + 8) / 16;
      const y = ((num & 0xf0) + 8) / 16;
      return `${x}, ${y}`;
    },
    () => {
      const x = fetch.string(',');
      const y = fetch.string(',');
      const num = ((x * 16 - 8) | 0) / 0x10 + ((y * 16 - 8) | 0);
      write.uint8(num);
    },
  ], // Don't know
  [0xc8, 'SelectedEntityChangedVeryClosePrecise', ['uint8', 'uint8']], // Don't know
  [
    0xca,
    'SelectedEntityChangedBasedOnUnitNumber',
    ['uint8', 'uint8', 'uint8', 'uint8'],
  ], // Don't know
  [0xcb, 'SetAutosortInventory'],
  [0xcc, 'SetFlatControllerGui', ['uint8']],
  [0xcd, 'SetRecipeNotifications'],
  [0xce, 'SetAutoLaunchRocket'],
  [0xcf, 'SwitchConstantCombinatorState'],
  [0xd0, 'SwitchPowerSwitchState'],
  [0xd1, 'SwitchInserterFilterModeState'],
  [0xd2, 'SwitchConnectToLogisticNetwork'],
  [0xd3, 'SetBehaviorMode'],
  [0xd4, 'FastEntityTransfer', 'uint8'],
  [0xd5, 'RotateEntity', 'direction'],
  [0xd6, 'FastEntitySplit'],
  [0xd7, 'SetTrainStopped'],
  [0xd8, 'ChangeControllerSpeed', ['uint32', 'uint32']],
  [0xd9, 'SetAllowCommands'],
  [0xda, 'SetResearchFinishedStopsGame'],
  [0xdb, 'SetInserterMaxStackSize'],
  [0xdc, 'OpenTrainGui'],
  [0xdd, 'SetEntityColor'],
  [0xde, 'SetDeconstructionItemTreesAndRocksOnly'],
  [0xdf, 'SetDeconstructionItemTileSelectionMode', ['uint8', 'uint8', 'uint8']],
  [0xe0, 'DeleteCustomTag'],
  [0xe1, 'DeletePermissionGroup'],
  [0xe2, 'AddPermissionGroup'],
  [0xe3, 'SetInfinityContainerRemoveUnfilteredItems', 'bool'],
  [0xe4, 'SetCarWeaponsControl'],
  [0xe5, 'SetRequestFromBuffers'],
  [0xe6, 'ChangeActiveQuickBar'],
  [0xe7, 'OpenPermissionsGui'],
  [0xe8, 'DisplayScaleChanged'],
  [0xe9, 'SetSplitterPriority'],
  [0xea, 'GrabInternalBlueprintFromText'],
  [0xeb, 'SetHeatInterfaceTemperature'],
  [0xec, 'SetHeatInterfaceMode'],
  [0xed, 'OpenTrainStationGui'],
  [0xee, 'RemoveTrainStation'],
  [0xef, 'GoToTrainStation'],
  [0xf0, 'RenderModeChanged', 'uint8'],
  [0xf1, 'SetPlayerColor'],
  [0xf2, 'PlayerClickedGpsTag'],
  [0xf3, 'SetTrainsLimit'],
  [0xf4, 'ClearRecipeNotification', 'recipe'],
  [0xf5, 'SetLinkedContainerLinkID'],
];

function handleEditorActions() {}
