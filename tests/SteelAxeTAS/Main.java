import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public class Main {
  private static int runningSpeed = 38; // Tetrakibitiles, per tick
  private static int runningSpeedDiag = 27; // Tetrakibitiles, per tick
  private static int playerReach = 1536; // Tetrakibitiles
  private static PrintStream out;
  private static double[][] startingPositions = new double[49][2];
  private static Map<Integer, double[]> playerSelections = new HashMap<>();

  private static void act(int tick, int player, String command) {
    out.println("@" + tick + "(" + player + "): " + command);
  }

  // Pass the path to the replay.txt file you want to create
  public static void main(String[] args) throws IOException {
    out = new PrintStream(new FileOutputStream(new File(args[0])));
    act(0, 65535, "JoinMultiPlayer");

    // Steelaxe Run
    addPlayer("SteelAxeBot", 0);
    act(0, 0, "ShowInfo");
    act(0, 0, "Craft " + RECIPE.IRON_AXE + ", 1");
    act(0, 0, "Run SW");
    moveSelectionTo(0, 0, new double[]{-9, 7});
    double[] chestPos = {-4, -2};

    // Once player 0 is out of the way, add the copper miners
    int numCopperMiners = 8;
    int totalCopper = 160;
    int spawnMinersTick = 2;
    int firstOreTick = 88;
    int copperSmeltTicks = 210;
    double[][] copperOres = {{1.5, 1.5}, {1.5, 0.5}, {1.5, -1.5}, {0.5, 1.5}};
    double[][] copperFurnaces = {{-4, -3}, {-2, -3}, {0, -3}, {2, -3},
        {4, -3}, {-2, -5}, {0, -5}, {2, -5}};
    for (int i = 0; i < numCopperMiners; i++) {
      int curPlayer = addPlayer("CopperMiner" + (i + 1), spawnMinersTick);
      playerSelections.put(curPlayer, startingPositions[0]);
      act(spawnMinersTick, curPlayer, "Craft " + RECIPE.IRON_AXE + ", 2");
      double[] orePos = copperOres[i % copperOres.length];
      moveSelectionTo(spawnMinersTick, curPlayer, orePos);
      act(spawnMinersTick, curPlayer, "StartMining");
      double[] furnacePos = copperFurnaces[i % copperFurnaces.length];
      if (i < copperFurnaces.length) {
        act(spawnMinersTick, curPlayer, "Toolbelt 1");
        act(spawnMinersTick, curPlayer, "Build " + furnacePos[0] + ", " + furnacePos[1] + ", N");
      }
      for (int j = 1; j < totalCopper / numCopperMiners; j++) {
        act(spawnMinersTick + firstOreTick + 125 * j, curPlayer, "StopMining");
        act(spawnMinersTick + firstOreTick + 125 * j, curPlayer, "ClickItemStack Player, 0");
        moveSelectionTo(spawnMinersTick + firstOreTick + 125 * j, curPlayer, furnacePos);
        act(spawnMinersTick + firstOreTick + 125 * j, curPlayer, "TransferEntityStack In");
        if (j == totalCopper / numCopperMiners - 1) {
          act(spawnMinersTick + firstOreTick + 125 * j, curPlayer, "LeaveGame");
        } else {
          moveSelectionTo(spawnMinersTick + firstOreTick + 125 * j, curPlayer, orePos);
          act(spawnMinersTick + firstOreTick + 125 * j, curPlayer, "StartMining");
        }
      }
    }

    double[][] coalOres = {{1.5, -0.5}};
    int numCoalMiners = 8;
    int totalCoal = 32;
    for (int i = 0; i < numCoalMiners; i++) {
      int curPlayer = addPlayer("CoalMiner" + (i + 1), spawnMinersTick);
      playerSelections.put(curPlayer, startingPositions[0]);
      act(spawnMinersTick, curPlayer, "Craft " + RECIPE.IRON_AXE + ", 2");
      double[] orePos = coalOres[i % coalOres.length];
      if (i == 6) {
        orePos = new double[]{-1.5, 1.5}; // Got pushed out of the way by player 0
      }
      moveSelectionTo(spawnMinersTick, curPlayer, orePos);
      act(spawnMinersTick, curPlayer, "StartMining");
      double[] furnacePos = copperFurnaces[i % copperFurnaces.length];
      for (int j = 1; j < totalCoal / numCoalMiners; j++) {
        act(spawnMinersTick + firstOreTick + 125 * j, curPlayer, "StopMining");
        act(spawnMinersTick + firstOreTick + 125 * j, curPlayer, "ClickItemStack Player, 0");
        moveSelectionTo(spawnMinersTick + firstOreTick + 125 * j, curPlayer, furnacePos);
        act(spawnMinersTick + firstOreTick + 125 * j, curPlayer, "TransferEntityStack In");
        //if (j == 3) break;
        if (j == totalCoal / numCoalMiners - 1) {
          act(spawnMinersTick + firstOreTick + 125 * j, curPlayer, "LeaveGame");
        } else {
          moveSelectionTo(spawnMinersTick + firstOreTick + 125 * j, curPlayer, orePos);
          act(spawnMinersTick + firstOreTick + 125 * j, curPlayer, "StartMining");
        }
      }
    }

    int spawnCraftersTick = spawnMinersTick + 20;
    int chestTicks = 31;
    int chestDoneTick = spawnCraftersTick + chestTicks;
    {
      int curPlayer = addPlayer("ChestCrafter", spawnCraftersTick);
      act(spawnCraftersTick, curPlayer, "Craft " + RECIPE.IRON_CHEST + ", 1");
      act(chestDoneTick, curPlayer, "Toolbelt 2");
      act(chestDoneTick, curPlayer, "Build " + chestPos[0] + ", " + chestPos[1] + ", N");
      act(chestDoneTick, curPlayer, "LeaveGame");
    }
    Container chest = new Container();

    int numPipes = 10;
    int pipeTicks = 31;
    int pipesPerCrafter = 2;
    int pipesDoneTick = spawnCraftersTick + pipesPerCrafter * pipeTicks;
    for (int i = 1; i <= numPipes / pipesPerCrafter; i++) {
      int curPlayer = addPlayer("PipeCrafter" + i, spawnCraftersTick);
      act(spawnCraftersTick, curPlayer, "Craft " + RECIPE.PIPE + ", " + pipesPerCrafter);
      act(pipesDoneTick, curPlayer, "MoveSelection " + chestPos[0] + ", " + chestPos[1]);
      act(pipesDoneTick, curPlayer, "ClickItemStack Toolbelt, 2");
      act(pipesDoneTick, curPlayer, "TransferEntityStack In");
      act(pipesDoneTick, curPlayer, "LeaveGame");
    }

    int numGears = 112;
    int gearTicks = 31;
    int gearsPerCrafter = 4;
    int gearsDoneTick = spawnCraftersTick + gearsPerCrafter * gearTicks;
    for (int i = 1; i <= numGears / gearsPerCrafter; i++) {
      int curPlayer = addPlayer("GearCrafter" + i, spawnCraftersTick);
      act(spawnCraftersTick, curPlayer, "Craft " + RECIPE.IRON_GEAR_WHEEL + ", " + gearsPerCrafter);
      act(gearsDoneTick, curPlayer, "MoveSelection " + chestPos[0] + ", " + chestPos[1]);
      act(gearsDoneTick, curPlayer, "ClickItemStack Player, 0");
      act(gearsDoneTick, curPlayer, "TransferEntityStack In");
      act(gearsDoneTick, curPlayer, "LeaveGame");
    }

    int numBelts = 20;
    int beltTicks = 62;
    int beltsPerCrafter = 4;
    int beltsDoneTick = spawnCraftersTick + (beltsPerCrafter / 2) * beltTicks; // 2 per recipe
    for (int i = 1; i <= numBelts / beltsPerCrafter; i++) {
      int curPlayer = addPlayer("BeltCrafter" + i, spawnCraftersTick);
      act(spawnCraftersTick, curPlayer,
          "Craft " + RECIPE.TRANSPORT_BELT + ", " + (beltsPerCrafter / 2));
      act(beltsDoneTick, curPlayer, "MoveSelection " + chestPos[0] + ", " + chestPos[1]);
      act(beltsDoneTick, curPlayer, "ClickItemStack Toolbelt, 2");
      act(beltsDoneTick, curPlayer, "TransferEntityStack In");
      act(beltsDoneTick, curPlayer, "LeaveGame");
    }

    int numMules = 2;
    for (int i = 1; i <= numMules; i++) {
      int curPlayer = addPlayer("IronMule" + i, chestDoneTick);
      act(chestDoneTick, curPlayer, "ClickItemStack Player, 0");
      act(chestDoneTick, curPlayer, "MoveSelection " + chestPos[0] + ", " + chestPos[1]);
      act(chestDoneTick, curPlayer, "TransferEntityStack In");
      act(chestDoneTick, curPlayer, "LeaveGame");
    }

    int getToTreeTick = 64;
    act(getToTreeTick, 0, "StartMining");
    act(getToTreeTick, 0, "StopRunning");
    //checkLuaVar("tostring(game.player.character.position.x) .. \", \" .. tostring(game.player.character.position.y)", getToTreeTick);
    double[] atTreePos = {-6.75, 5.90625};

    int ticksToMineTree = 100;
    //checkLuaVar("tostring(game.player.character.mining_state.mining)", getToTreeTick + ticksToMineTree - 3, getToTreeTick + ticksToMineTree + 3, 1);
    act(getToTreeTick + ticksToMineTree, 0, "StopMining");
    act(getToTreeTick + ticksToMineTree, 0, "Craft " + RECIPE.WOOD + ", 1");
    act(getToTreeTick + ticksToMineTree, 0, "Craft " + RECIPE.WOOD + ", 1");
    act(getToTreeTick + ticksToMineTree, 0, "Run N");
    moveSelectionTo(getToTreeTick + ticksToMineTree, 0, chestPos);

    int nearChestTick;
    double[] nearChestPos = {atTreePos[0], atTreePos[1]};
    {
      boolean closeToFurnace = false;
      for (int i = 1; ; i++) {
        nearChestPos[1] -= runningSpeed / 256.;
        if (!closeToFurnace) {
          if (canReach(nearChestPos, chestPos, playerReach / 256.)) {
            // Close enough
            closeToFurnace = true;
          }
        } else {
          if (!canReach(nearChestPos, chestPos, playerReach / 256.)) {
            // Barely too far
            nearChestTick = getToTreeTick + ticksToMineTree + i - 3;
            break;
          }
        }
      }
    }
    act(nearChestTick, 0, "StopRunning");
    act(nearChestTick, 0, "OpenTargetInventory");
    act(nearChestTick, 0, "TransferInventory FuelOrContainer, 31");
    act(nearChestTick, 0, "Craft " + RECIPE.BOILER + ", 1");
    act(nearChestTick, 0, "Craft " + RECIPE.STEAM_ENGINE + ", 1");

    // Calculate when first copper is available
    int copperAvailableTick = spawnMinersTick + firstOreTick + 125 + copperSmeltTicks + 4;
    if (nearChestTick > copperAvailableTick) {
      throw new RuntimeException("Need to reorder copper acquisition");
    }

    {
      int curPlayer = addPlayer("CopperFetcher", copperAvailableTick);
      for (int i = 0; i < totalCopper / copperFurnaces.length; i++) {
        int nextCopperTick = copperAvailableTick + copperSmeltTicks * i;
        for (int j = 0; j < copperFurnaces.length; j++) {
          moveSelectionTo(nextCopperTick, curPlayer, copperFurnaces[j]);
          act(nextCopperTick, curPlayer, "OpenTargetInventory");
          act(nextCopperTick, curPlayer, "TransferItemStack Output, 0");
          if (i == 0) {
            act(nextCopperTick, curPlayer, "TransferItemStack FuelOrContainer, 0");
          }
          act(nextCopperTick, curPlayer, "CloseWindow");
        }
        moveSelectionTo(nextCopperTick, curPlayer, chestPos);
        act(nextCopperTick, curPlayer, "OpenTargetInventory");
        act(nextCopperTick, curPlayer, "TransferInventory Player, 31");
        chest.insert(ITEM.COPPER_PLATE, copperFurnaces.length, nextCopperTick);
        act(nextCopperTick, curPlayer, "CloseWindow");
        if (i == totalCopper / copperFurnaces.length - 1) {
          act(nextCopperTick, curPlayer, "LeaveGame");
        }
      }
    }

    int[] scienceStartTicks = {300, 930, 1350, 1980, 2610};
    int scienceTicks = 301;
    int scienceDoneTick = 4850;
    int[] craftLabTicks = new int[5];
    int labTicks = 121;
    int curSciencePlayer = 89; // Scry ahead to know when we'll spawn
    // I ran the code through all the placeholders that would be needed up through CircuitCrafters,
    // then copied that list up here so we'd have it available for displacing the ScienceCrafters
    for (int i : new int[]{62, 65, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 78, 83, 85, 86, 88}) {
      placeholders.add(i);
    }
    // We would make the ScienceCrafters after the CircuitCrafters since they spawn later, but we
    // want Science packs to have maximum priority in taking copper, so they need to add their
    // constraints to the chest Container first
    for (int i = 1; i <= scienceStartTicks.length; i++) {
      int scienceStartTick = scienceStartTicks[i - 1] + copperAvailableTick + 2;
      addPlayer("ScienceCrafter" + i, scienceStartTick, curSciencePlayer++);
      moveSelectionTo(scienceStartTick, curSciencePlayer, chestPos);
      act(scienceStartTick, curSciencePlayer, "OpenTargetInventory");
      int curScienceTick = scienceStartTick;
      while (curScienceTick < scienceDoneTick) {
        act(curScienceTick, curSciencePlayer, "TransferInventory FuelOrContainer, 31");
        act(curScienceTick, curSciencePlayer, "Craft " + RECIPE.SCIENCE_PACK_1 + ", 1");
        if (!chest.remove(ITEM.COPPER_PLATE, 1, curScienceTick)) {
          throw new RuntimeException("Not enough copper for science?");
        }
        act(curScienceTick, curSciencePlayer, "TransferInventory Player, 31");
        int craftDoneTick = curScienceTick + scienceTicks;
        act(craftDoneTick, curSciencePlayer, "TransferInventory Player, 31");
        chest.insert(ITEM.SCIENCE_PACK_1, 1, craftDoneTick);
        if (curScienceTick == scienceStartTick) {
          craftLabTicks[i - 1] = craftDoneTick - labTicks;
        }
        curScienceTick = craftDoneTick;
        if (curScienceTick >= scienceDoneTick) {
          act(curScienceTick, curSciencePlayer, "LeaveGame");
        }
      }
    }

    int numCables = 160;
    int cableTicks = 31;
    List<Integer> cableCrafters = new ArrayList<>();
    // May as well make cables as fast as copper comes out of the furnaces
    for (int i = 1; i <= copperFurnaces.length; i++) {
      if (i == 4 || i == 6 || i == 7 || i == 8) {
        // These players would spawn in the way of mining resources, so we add/remove placeholders
        addPlaceholders(i == 7 ? 10 : 1);
      }
      int curPlayer = addPlayer("CableCrafter" + i, copperAvailableTick);
      cableCrafters.add(curPlayer);
      moveSelectionTo(copperAvailableTick, curPlayer, chestPos);
      act(copperAvailableTick, curPlayer, "OpenTargetInventory");
    }
    {
      Map<ITEM, Integer> ingredients = new HashMap<>();
      ingredients.put(ITEM.COPPER_PLATE, 1);
      Map<ITEM, Integer> results = new HashMap<>();
      results.put(ITEM.COPPER_CABLE, 2);
      teamCraft(numCables / 2, RECIPE.COPPER_CABLE, ingredients, results, cableCrafters, chest,
          copperAvailableTick, cableTicks, copperSmeltTicks);
    }

    int cablesAvailableTick = copperAvailableTick + cableTicks;
    act(cablesAvailableTick, 0, "ToggleFilter Toolbelt, 9, " + ITEM.COAL);
    act(cablesAvailableTick, 0, "TransferInventory FuelOrContainer, 31");
    if (!chest.remove(ITEM.COPPER_CABLE, 10, cablesAvailableTick)) {
      throw new RuntimeException("Not enough cable for pump/poles");
    }
    act(cablesAvailableTick, 0, "Craft " + RECIPE.OFFSHORE_PUMP + ", 1");
    act(cablesAvailableTick, 0, "Craft " + RECIPE.SMALL_ELECTRIC_POLE + ", 1");
    act(cablesAvailableTick, 0, "Craft " + RECIPE.SMALL_ELECTRIC_POLE + ", 1");
    act(cablesAvailableTick, 0, "TransferInventory Player, 31");
    act(cablesAvailableTick, 0, "CloseWindow");
    act(cablesAvailableTick, 0, "Run NW");
    int firstPoleDoneTick = cablesAvailableTick + 31 * 4;

    int numCircuits = 50;
    int numCircuitCrafters = 6;
    List<Integer> circuitCrafters = new ArrayList<>();
    final int circuitTicks = 31;
    for (int i = 1; i <= numCircuitCrafters; i++) {
      int nextCableTick = copperAvailableTick + cableTicks;
      if (i == 4 || i == 5 || i == 6) {
        // In the way, so spawn placeholders that we'll clear once everyone's spawned
        addPlaceholders(i == 5 ? 2 : 1);
      }
      int curPlayer = addPlayer("CircuitCrafter" + i, nextCableTick);
      circuitCrafters.add(curPlayer);
      moveSelectionTo(nextCableTick, curPlayer, chestPos);
      act(nextCableTick, curPlayer, "OpenTargetInventory");
    }
    {
      Map<ITEM, Integer> ingredients = new HashMap<>();
      ingredients.put(ITEM.COPPER_CABLE, 3);
      Map<ITEM, Integer> results = new HashMap<>();
      results.put(ITEM.ELECTRONIC_CIRCUIT, 1);
      teamCraft(numCircuits, RECIPE.ELECTRONIC_CIRCUIT, ingredients, results, circuitCrafters,
          chest, copperAvailableTick + cableTicks, circuitTicks, copperSmeltTicks);
    }
    curPlayer = curSciencePlayer + 1; // Now is when the science crafters actually spawn

    double xTargetForPump = -7.90625;
    double[] afterNWForPumpPos = {nearChestPos[0], nearChestPos[1]};
    int ticksNWForPump;
    for (ticksNWForPump = 1; ; ticksNWForPump++) {
      afterNWForPumpPos[0] -= runningSpeedDiag / 256.;
      afterNWForPumpPos[1] -= runningSpeedDiag / 256.;
      if (afterNWForPumpPos[0] <= xTargetForPump) {
        break;
      }
    }
    act(cablesAvailableTick + ticksNWForPump, 0, "Run N");

    double[] nearPumpPos = {afterNWForPumpPos[0], afterNWForPumpPos[1]};
    int nearPumpTick;
    {
      double[] pumpCornerPos = {-11, -27}; //{-10.5, -26.2};
      for (int i = 1; ; i++) {
        nearPumpPos[1] -= runningSpeed / 256.;
        if (canReach(nearPumpPos, pumpCornerPos, playerReach / 256.)) {
          nearPumpTick = cablesAvailableTick + ticksNWForPump + i;
          break;
        }
      }
    }
    //-10.6, -26
    act(nearPumpTick, 0, "StopRunning");
    act(nearPumpTick, 0, "Toolbelt 2");
    act(nearPumpTick, 0, "Build -11.5, -26.5, N"); // Offshore pump
    act(nearPumpTick, 0, "Toolbelt 1");
    act(nearPumpTick, 0, "Build -11, -24.5, E"); // Boiler
    moveSelectionTo(nearPumpTick, 0, new double[]{-11, -24.5});
    act(nearPumpTick, 0, "Toolbelt 9");
    act(nearPumpTick, 0, "TransferEntityStack In");
    act(nearPumpTick, 0, "Toolbelt 4");
    act(nearPumpTick, 0, "Build -7.5, -24.5, E"); // Steam engine
    act(nearPumpTick, 0, "Run S");

    if (firstPoleDoneTick < nearPumpTick) {
      throw new RuntimeException("Need to reorder pole placement");
    }
    // Electric poles
    act(firstPoleDoneTick, 0, "Toolbelt 1");
    act(firstPoleDoneTick, 0, "Build -4.5, -21.5, E");
    act(firstPoleDoneTick, 0, "Build -4.5, -14.5, E");
    act(firstPoleDoneTick + 31, 0, "Toolbelt 1");
    act(firstPoleDoneTick + 40, 0, "Build -4.5, -7.5, E");
    int backHomeTick = firstPoleDoneTick + 85;
    act(backHomeTick, 0, "Build -4.5, -0.5, E");
    act(backHomeTick, 0, "StopRunning");
    moveSelectionTo(backHomeTick, 0, chestPos);
    act(backHomeTick, 0, "ToggleFilter Toolbelt, 8, " + ITEM.LAB);
    act(backHomeTick, 0, "ToggleFilter Toolbelt, 9, " + ITEM.SCIENCE_PACK_1);

    double[][] labs = {{-6.5, -11.5}, {-6.5, -8.5}, {-6.5, -5.5}, {-6.5, -2.5}, {-6.5, 0.5}};
    for (int i = 1; i <= labs.length; i++) {
      int craftLabTick = craftLabTicks[i - 1];
      act(craftLabTick, 0, "OpenTargetInventory");
      act(craftLabTick, 0, "TransferInventory FuelOrContainer, 31");
      act(craftLabTick, 0, "Craft " + RECIPE.LAB + ", 1");
      act(craftLabTick, 0, "TransferInventory Player, 31");
      act(craftLabTick, 0, "CloseWindow");
      int craftDoneTick = craftLabTick + labTicks;
      act(craftDoneTick, 0, "Toolbelt 8");
      act(craftDoneTick, 0, "Build " + labs[i - 1][0] + ", " + labs[i - 1][1] + ", E");

      int curScienceTick = craftDoneTick;
      if (i == 1) {
        act(craftDoneTick, 0, "ChooseTechnology " + RESEARCH.STEEL_PROCESSING);
      }
      while (curScienceTick <= scienceDoneTick + scienceTicks) {
        // Grab science into filter slot
        act(curScienceTick, 0, "OpenTargetInventory");
        act(curScienceTick, 0, "TransferInventory FuelOrContainer, 31");
        act(curScienceTick, 0, "TransferInventory Player, 31");
        act(curScienceTick, 0, "CloseWindow");

        moveSelectionTo(curScienceTick, 0, labs[i - 1]);
        act(curScienceTick, 0, "Toolbelt 9");
        act(curScienceTick, 0, "TransferEntityStack In");
        moveSelectionTo(curScienceTick, 0, chestPos);
        curScienceTick += scienceTicks;
      }
    }

    placeholders.clear(); // Don't need these anymore
    int steelStartTick = 5180;

    moveSelectionTo(steelStartTick, 0, copperFurnaces[0]);
    act(steelStartTick, 0, "OpenTargetInventory");

    int steelTicks = 1051;
    int steelDoneTick = steelStartTick + steelTicks;
    {
      int curPlayer = addPlayer("SteelCrafter", steelStartTick);
      act(steelStartTick, curPlayer, "ToggleFilter Toolbelt, 2, " + ITEM.IRON_PLATE);
      moveSelectionTo(steelStartTick, curPlayer, chestPos);
      act(steelStartTick, curPlayer, "OpenTargetInventory");
      // Grab some iron
      act(steelStartTick, curPlayer, "TransferInventory FuelOrContainer, 31");
      act(steelStartTick, curPlayer, "TransferInventory Player, 31");
      act(steelStartTick, curPlayer, "ClickItemStack Toolbelt, 2");
      for (int i = 0; i < 5; i++) {
        act(steelStartTick, curPlayer, "CloseWindow");
        moveSelectionTo(steelStartTick, curPlayer, copperFurnaces[i]);
        act(steelStartTick, curPlayer, "OpenTargetInventory");
        for (int j = 0; j < 5; j++) {
          act(steelStartTick, curPlayer, "SplitItemStack Input, 0");
        }
      }
      act(steelStartTick, curPlayer, "ClearCursor");
      act(steelStartTick, curPlayer, "Craft " + RECIPE.IRON_STICK + ", 1");

      act(steelDoneTick, curPlayer, "CloseWindow");
      for (int i = 0; i < 5; i++) {
        moveSelectionTo(steelDoneTick, curPlayer, copperFurnaces[i]);
        act(steelDoneTick, curPlayer, "TransferEntityStack Out");
      }
      moveSelectionTo(steelDoneTick, curPlayer, chestPos);
      act(steelDoneTick, curPlayer, "OpenTargetInventory");
      act(steelDoneTick, curPlayer, "TransferInventory Player, 31");
      act(steelDoneTick, curPlayer, "LeaveGame");
    }

    act(steelDoneTick, 0, "CloseWindow");
    moveSelectionTo(steelDoneTick, 0, chestPos);
    act(steelDoneTick, 0, "OpenTargetInventory");
    act(steelDoneTick, 0, "TransferInventory FuelOrContainer, 31");
    act(steelDoneTick, 0, "Craft " + RECIPE.STEEL_AXE + ", 1");
    act(steelDoneTick, 0, "ClickItemStack Tool, 0");
    act(steelDoneTick, 0, "ClickItemStack Player, 31");
    act(steelDoneTick, 0, "CloseWindow");
    act(steelDoneTick + 31, 0, "Chat SteelAxe acquired in " + (steelDoneTick + 31) + " ticks ("
        + (steelDoneTick + 31) / 60. + " seconds)");
    // StopRunning is a useful nop to force the replay to run until at least that tick
    // For finished saves, change the 4-byte integer at offset 0x37 in level.dat to the tick
    // count you want the replay to stop at, and if there are no commands past that, it will stop
    act(steelDoneTick + 600, 0, "StopRunning");
  }

  private static int curPlayer = 0;

  private static int addPlayer(String name, int tick) {
    addPlayer(name, tick, curPlayer);
    curPlayer++;
    return curPlayer - 1;
  }

  private static void addPlayer(String name, int tick, int playerNumber) {
    for (int i = 1; i <= placeholders.size(); i++) {
      if (placeholders.get(i - 1) < playerNumber) {
        act(tick, 0, "AddPlayer Placeholder" + i + ", " + placeholders.get(i - 1) + ", 1");
      }
    }
    act(tick, 0, "AddPlayer " + name + ", " + playerNumber + ", 1");
    for (int i = placeholders.size(); i > 0; i--) {
      if (placeholders.get(i - 1) < playerNumber) {
        act(tick, placeholders.get(i - 1), "LeaveGame");
      }
    }
  }

  private static List<Integer> placeholders = new ArrayList<>();

  private static void addPlaceholders(int count) {
    for (int i = 0; i < count; i++) {
      if (!placeholders.contains(curPlayer)) {
        placeholders.add(curPlayer);
      }
      curPlayer++;
    }
  }

  // Players should already have the source+destination inventory open, with slot 31 empty
  private static void teamCraft(int count, RECIPE recipe, Map<ITEM, Integer> ingredients,
      Map<ITEM, Integer> results, List<Integer> crafters, Container chest, int startTick,
      int craftTicks, int stepTicks) {
    List<Integer> craftersLeft = new ArrayList<>(crafters);
    for (int i = 0; count > 0; i++) {
      int nextCraftTick = startTick + (i / crafters.size()) * stepTicks;
      int crafterPlayer = crafters.get(i % crafters.size());
      if (!craftersLeft.contains(crafterPlayer) || !chest.remove(ingredients, nextCraftTick)) {
        continue;
      }
      act(nextCraftTick, crafterPlayer, "TransferInventory FuelOrContainer, 31");
      act(nextCraftTick, crafterPlayer, "Craft " + recipe + ", 1");
      --count;
      act(nextCraftTick, crafterPlayer, "TransferInventory Player, 31");
      int craftDoneTick = nextCraftTick + craftTicks;
      act(craftDoneTick, crafterPlayer, "TransferInventory Player, 31");
      chest.insert(results, craftDoneTick);
      if (count < craftersLeft.size()) {
        act(craftDoneTick, crafterPlayer, "LeaveGame");
        craftersLeft.remove(craftersLeft.indexOf(crafterPlayer));
      }
    }
  }

  private static void checkLuaVar(String luaVar, int tick) {
    checkLuaVar(luaVar, tick, tick + 1, 1);
  }

  private static void checkLuaVar(String luaVar, int startTick, int endTick, int step) {
    for (int i = startTick; i < endTick; i += step) {
      act(i, 0, "Chat /c game.player.print(tostring(game.tick) .. \": \" .. " + luaVar + ")");
    }
  }

  private static void moveSelectionTo(int tick, int player, double[] target) {
    double[] pos = playerSelections.get(player);
    if (null == pos) {
      pos = startingPositions[0];
    }
    act(tick, player, "MoveSelection " + (target[0] - pos[0]) + ", " + (target[1] - pos[1]));
    playerSelections.put(player, target);
  }

  private static boolean canReach(double[] a, double[] b, double distance) {
    return (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]) < distance * distance;
  }

  // Silly method to make players spiral out in a rectangle with colors to match the given image
  // It probably only works on images with even height and width, but you can probably tweak it
  // until it works with more images
  private static void drawImage(BufferedImage image) {
    //  Arbitrary image
    int alphaThreshold = 200; // Pixels with alpha less than this (out of 255) will be left out
    int width = image.getWidth() - 1;
    int height = image.getHeight();

    // Black magic to get a nice spiral with room to run in the middle of it
    int innerLegCount = width - 1;
    int eccentricity = height - width - 1;
    int playerCount =
        (innerLegCount / 2 * 2 + 2 + eccentricity) * ((innerLegCount + 1) / 2 * 2 + 1);
    String[] routes = new String[playerCount];
    char[] directions = {'S', 'E', 'N', 'W'};
    int direction = 2;
    int[] curMax = new int[4];
    for (int i = 2; i < 6; i++) {
      curMax[(direction + i) % directions.length] = i - 2;
      if (i % 2 == 0) {
        curMax[(direction + i) % directions.length] += eccentricity;
      }
    }
    int curPlayer;
    for (curPlayer = 0; curPlayer < eccentricity; curPlayer++) {
      routes[curPlayer] = "" + directions[(direction + 1) % directions.length];
      for (int i = 0; i < eccentricity - curPlayer; i++) {
        routes[curPlayer] += directions[direction];
      }
    }
    direction = (direction + 1) % directions.length;
    routes[curPlayer++] = "" + directions[direction];
    routes[curPlayer++] =
        "" + directions[(direction + 1) % directions.length] + directions[direction];
    direction = (direction + 1) % directions.length;
    int cur = eccentricity;
    for (int i = curPlayer; i < playerCount; i++) {
      if (routes[i - 1].length() == playerCount - i) {
        routes[i] = routes[i - 1].substring(0, routes[i - 1].length() - 1);
      } else if (cur < curMax[direction]) {
        routes[i] =
            routes[i - 1].substring(0, routes[i - 1].length() - 1) + directions[direction] + routes[
                i - 1].substring(routes[i - 1].length() - 1);
        cur++;
      } else {
        routes[i] = routes[i - 1].substring(0, routes[i - 1].length() - 1);
        curMax[direction] += 4;
        cur = 0;
        direction = (direction + 1) % directions.length;
      }
    }

    int[][] coordinates = new int[routes.length][2];
    int[] offset = {0, 0};
    for (int i = 0; i < routes.length; i++) {
      int[] coordinate = coordinates[i];
      for (int j = 0; j < routes[i].length(); j++) {
        switch (routes[i].charAt(j)) {
          case 'S':
            coordinate[1]++;
            break;
          case 'E':
            coordinate[0]++;
            break;
          case 'N':
            coordinate[1]--;
            break;
          case 'W':
            coordinate[0]--;
            break;
          default:
            assert false;
        }
      }
      if (coordinate[0] < offset[0]) {
        offset[0] = coordinate[0];
      }
      if (coordinate[1] < offset[1]) {
        offset[1] = coordinate[1];
      }
    }
    for (int i = 0; i < coordinates.length; i++) {
      int[] coordinate = coordinates[i];
      coordinate[0] -= offset[0];
      coordinate[1] -= offset[1];
      if (coordinate[0] < 0 || height <= coordinate[0]) {
        assert false;
      }
      if (coordinate[1] < 0 || width <= coordinate[1]) {
        assert false;
      }
    }

    Color[] colors = new Color[routes.length];
    for (int i = 0; i < routes.length; i++) {
      colors[i] = new Color(image.getRGB(coordinates[i][0], coordinates[i][1]), true);
      if (colors[i].getAlpha() < alphaThreshold) {
        colors[i] = null;
      }
    }

    int step = 6;
    curPlayer = 0;
    for (int i = 0; i < playerCount; i++) {
      Color color = colors[i];
      if (color == null) {
        continue;
      }
      int curTick = step * curPlayer;
      char lastDir = '?';
      act(curTick, 0, "AddPlayer , " + curPlayer + ", 1");
      act(curTick, curPlayer,
          "Chat /color " + color.getRed() + " " + color.getGreen() + " " + color.getBlue() + " " + (
              color.getAlpha() * 100 / 255));
      for (int j = 0; j < routes[i].length(); j++, curTick += step) {
        char dir = routes[i].charAt(j);
        if (dir != lastDir) {
          act(curTick, curPlayer, "Run " + dir);
          lastDir = dir;
        }
      }
      act(curTick, curPlayer, "StopRunning");
      ++curPlayer;
    }
    act(playerCount * step + 500, 0, "StopRunning");
  }

  static class Container {

    Map<ITEM, Map<Integer, Integer>> contents = new HashMap<>();

    public void insert(ITEM item, int amount, int tick) {
      if (amount < 0) {
        throw new RuntimeException("inserting negative items?");
      }
      Map<Integer, Integer> map = contents.computeIfAbsent(item, k -> new TreeMap<>());
      map.put(tick, map.getOrDefault(tick, 0) + amount);
    }

    public void insert(Map<ITEM, Integer> items, int tick) {
      items.forEach((k, v) -> insert(k, v, tick));
    }

    public boolean remove(ITEM item, int amount, int tick) {
      if (amount < 0) {
        throw new RuntimeException("removing negative items?");
      }
      boolean removedAmount = false;
      int quantity = 0;
      Map<Integer, Integer> map = contents.computeIfAbsent(item, k -> new TreeMap<>());
      // Make sure this is consistent with the currently known history (and future) of this item
      for (Map.Entry<Integer, Integer> entry : map.entrySet()) {
        if (!removedAmount && entry.getKey() > tick) {
          quantity -= amount;
          if (quantity < 0) {
            return false;
          }
          removedAmount = true;
        }
        quantity += entry.getValue();
        if (quantity < 0) {
          return false;
        }
      }

      map.put(tick, map.getOrDefault(tick, 0) - amount);
      return true;
    }

    public boolean remove(Map<ITEM, Integer> items, int tick) {
      List<Map.Entry<ITEM, Integer>> orderedItems = new ArrayList<>(items.entrySet());
      for (int i = 0; i < orderedItems.size(); i++) {
        if (!remove(orderedItems.get(i).getKey(), orderedItems.get(i).getValue(), tick)) {
          for (int j = i - 1; j >= 0; j++) {
            // Put back the ones we took out
            insert(orderedItems.get(j).getKey(), orderedItems.get(j).getValue(), tick);
          }
          return false;
        }
      }
      return true;
    }
  }

  enum RECIPE {
    R00, R01, R02, R03, R04, R05, R06, R07, R08, R09, R0A, R0B, R0C, R0D, R0E, R0F,
    R10, BOILER, R12, R13, R14, R15, R16, R17, R18, R19, R1A, R1B, CONCRETE, R1D, R1E, COPPER_CABLE,
    COPPER_PLATE, R21, R22, R23, R24, R25, R26, R27, R28, R29, R2A, R2B, R2C, R2D, ELECTRONIC_CIRCUIT, R2F,
    R30, R31, R32, R33, R34, R35, R36, R37, R38, R39, R3A, R3B, R3C, R3D, R3E, R3F,
    R40, R41, R42, R43, R44, R45, R46, R47, R48, R49, R4A, R4B, R4C, HAZARD_CONCRETE, R4E, R4F,
    R50, R51, R52, IRON_AXE, IRON_CHEST, IRON_GEAR_WHEEL, IRON_PLATE, IRON_STICK, LAB, R59, R5A, R5B, R5C, R5D, R5E, R5F,
    R60, R61, R62, R63, R64, R65, R66, R67, R68, R69, R6A, R6B, R6C, R6D, OFFSHORE_PUMP, R6F,
    R70, R71, R72, R73, R74, PIPE, R76, R77, R78, R79, R7A, R7B, R7C, R7D, R7E, R7F,
    R80, R81, R82, R83, R84, R85, R86, R87, R88, R89, R8A, R8B, R8C, R8D, R8E, R8F,
    R90, R91, R92, R93, R94, R95, R96, R97, SCIENCE_PACK_1, R99, R9A, R9B, R9C, R9D, SMALL_ELECTRIC_POLE, R9F,
    RA0, RA1, RA2, RA3, RA4, RA5, RA6, RA7, RA8, STEAM_ENGINE, RAA, STEEL_AXE, RAC, RAD, RAE, RAF,
    STONE_FURNACE, RB1, RB2, RB3, RB4, RB5, RB6, RB7, RB8, TRANSPORT_BELT, RBA, RBB, RBC, RBD, WOOD, RBF,
    RC0, RC1, RC2, RC3, RC4, RC5, RC6, RC7, RC8, RC9, RCA, RCB, RCC, RCD, RCE, RCF,
    RD0, RD1, RD2, RD3, RD4, RD5, RD6, RD7, RD8, RD9, RDA, RDB, RDC, RDD, RDE, RDF,
    RE0, RE1, RE2, RE3, RE4, RE5, RE6, RE7, RE8, RE9, REA, REB, REC, RED, REE, REF,
    RF0, RF1, RF2, RF3, RF4, RF5, RF6, RF7, RF8, RF9, RFA, RFB, RFC, RFD, RFE, RFF;

    @Override
    public String toString() {
      return String.valueOf(ordinal());
    }
  }

  enum RESEARCH {
    R00, AUTOMATION, R02, R03, R04, R05, R06, R07, R08, LOGISTICS_1, R0A, R0B, OPTICS, R0D, R0E, TURRETS,
    R10, WALLS, R12, R13, R14, R15, LANDFILL, R17, R18, R19, R1A, R1B, R1C, R1D, STEEL_PROCESSING, R1F,
    R20, R21, R22, R23, R24, R25, R26, R27, R28, R29, R2A, R2B, R2C, R2D, R2E, R2F,
    R30, R31, R32, R33, R34, R35, R36, R37, R38, R39, R3A, R3B, R3C, R3D, R3E, R3F,
    R40, R41, R42, R43, R44, R45, R46, TOOLBELT, R48, R49, R4A, R4B, R4C, R4D, R4E, R4F,
    R50, R51, R52, R53, R54, R55, R56, R57, R58, R59, R5A, R5B, R5C, MILITARY_1, R5E, R5F,
    R60, R61, R62, R63, R64, R65, R66, R67, R68, R69, R6A, R6B, R6C, R6D, R6E, R6F,
    R70, R71, R72, R73, R74, R75, R76, R77, R78, R79, R7A, R7B, R7C, R7D, R7E, R7F,
    R80, R81, R82, R83, R84, R85, R86, R87, R88, R89, R8A, R8B, R8C, R8D, R8E, R8F,
    R90, R91, R92, R93, R94, R95, R96, R97, R98, R99, R9A, R9B, R9C, R9D, R9E, R9F,
    RA0, RA1, RA2, RA3, RA4, RA5, RA6, RA7, RA8, RA9, RAA, RAB, RAC, RAD, RAE, RAF,
    RB0, RB1, RB2, RB3, RB4, RB5, RB6, RB7, RB8, RB9, RBA, RBB, RBC, RBD, RBE, RBF,
    RC0, RC1, RC2, RC3, RC4, RC5, RC6, RC7, RC8, RC9, RCA, RCB, RCC, RCD, RCE, RCF,
    RD0, RD1, RD2, RD3, RD4, RD5, RD6, RD7, RD8, RD9, RDA, RDB, RDC, RDD, RDE, RDF,
    RE0, RE1, RE2, RE3, RE4, RE5, RE6, RE7, RE8, RE9, REA, REB, REC, RED, REE, REF,
    RF0, RF1, RF2, RF3, RF4, RF5, RF6, RF7, RF8, RF9, RFA, RFB, RFC, RFD, RFE, RFF;

    @Override
    public String toString() {
      return String.valueOf(ordinal());
    }
  }

  enum ITEM {
    R00, R01, R02, HANDGUN, R04, R05, R06, R07, R08, R09, R0A, R0B, COPPER_CABLE, R0D, R0E, R0F,
    R10, R11, R12, R13, R14, BURNER_DRILL, R16, R17, IRON_CHEST, R19, R1A, R1B, R1C, R1D, R1E, R1F,
    RAW_WOOD, R21, R22, SCIENCE_PACK_1, R24, R25, R26, R27, STONE_FURNACE, R29, R2A, R2B, R2C, R2D, R2E, R2F,
    R30, R31, TRANSPORT_BELT, R33, R34, R35, R36, R37, COAL, R39, R3A, R3B, R3C, R3D, R3E, R3F,
    R40, R41, R42, R43, R44, IRON_PLATE, R46, R47, R48, R49, R4A, R4B, R4C, R4D, R4E, R4F,
    R50, R51, R52, R53, R54, R55, R56, R57, R58, R59, R5A, R5B, R5C, R5D, R5E, R5F,
    R60, R61, R62, R63, R64, R65, R66, R67, R68, R69, R6A, R6B, R6C, R6D, R6E, R6F,
    R70, R71, R72, R73, R74, COPPER_PLATE, R76, R77, R78, R79, R7A, R7B, R7C, R7D, R7E, R7F,
    R80, R81, R82, R83, R84, R85, R86, R87, R88, R89, R8A, R8B, R8C, R8D, R8E, R8F,
    R90, R91, R92, R93, R94, R95, R96, R97, R98, R99, R9A, R9B, R9C, R9D, R9E, R9F,
    RA0, RA1, RA2, STEEL, RA4, RA5, RA6, RA7, RA8, ELECTRONIC_CIRCUIT, RAA, RAB, RAC, RAD, IRON_ORE, RAF,
    RB0, RB1, RB2, RB3, RB4, RB5, RB6, RB7, RB8, RB9, RBA, RBB, RBC, RBD, RBE, RBF,
    RC0, LAB, RC2, RC3, RC4, RC5, RC6, RC7, RC8, RC9, RCA, RCB, RCC, RCD, RCE, RCF,
    RD0, RD1, RD2, RD3, RD4, RD5, RD6, RD7, RD8, RD9, RDA, RDB, RDC, RDD, RDE, RDF,
    RE0, RE1, RE2, RE3, RE4, RE5, RE6, RE7, RE8, RE9, REA, REB, REC, RED, REE, REF,
    RF0, RF1, RF2, RF3, RF4, RF5, RF6, RF7, RF8, RF9, RFA, RFB, RFC, RFD, RFE, RFF;

    @Override
    public String toString() {
      return String.valueOf(ordinal());
    }
  }

}
