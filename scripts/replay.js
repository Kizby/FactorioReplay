/* Map exchange:
>>>eNpjYBBgMGZgYGBm5mFJzk/MYWRl5UrOLyhILdLNL0oF8jiTi0pT
UnXzM3OYGZjZUlKLU4tKmJmZWVIywTRXal5qbqVuUmJxKlCeNb0osbg
YKMyRWZSfBzIBKMhSnJiXAhRjLS7JzwOrKilKTS1mZWTlLi1KzMsszY
UqZGDUs/r4q6FFjgGE/9czGPz/D8JA1gWgE0EYCBgZGIECMMCanJOZl
sbA0ODCwKDgCJSrFlnn/rBqij0jRF7PAcr4ABWJ2A0VedAKZUSshjI6
DkMZDvNhjHoYo9+B0RgMPtsjGBC7SoAmQy3hcEAwIJItYEnG3rdbF3w
/dsGO8c/Kj5d8kxLsGTNlQ30FSt/bASXZQb5ighOzZoLATpgPGGBmPr
CHSt20Zzx7BgTe2DOygnSIgAgHCyBxwBsYigJ8QNaCHiChIMMAc5odz
BgRB8Y0MPgG88ljGOOyPbo/VBwYbUCGy4GIEyACbCHcZYxQZqQDREIS
IQvUasSAbH0KwnMnYTYeRrIazQ0qMDeYOGDxApqIClLAc4HsSYETL5j
hjgCG4AV2GA8Yt8wMCPDBfo7bI1sABfCTmA==<<<
*/

const chestPlayer = new Player('chest1');
chestPlayer.runTo([-3.5, -1.5]);
currentTick += 4;

const rawField = `         CCCCCCCCCCCCCCCCCCCCCCCCCCCC
         CCCCCCCCCCCCCCCCCCCCCCCCCCC
         CCCCCCCCCCCCCCCCCCCCCCCCCC
         CCCCCCCCCCCCCCCCCCCCCCCCC
         CCCCCCCCCCCCCCCCCCCCCCCCC
          CCCCCCCCCCCCCCCCCCCCCCCC
         CCCCCCCCCCCCCCCCCCCCCCCCC
          CCCCCCCCCCCCCCCCCCCCCCCC
          CCCCCCCCCCCCCCCCCCCCCCCC
          CCCCCCCCCCCCCCCCCCCCCCCC
          CCCCCCCCCCCCCCCCCCCCCCCC
          CCCCCCCCCCCCCCCCCCCCCCCC
          CCCCCCCCCCCCCCCCCCCCCCC
           CCCCCCCCCCCCCCCCCCCCC
           CCCCCCCCCCCCCCCCCCCC
           CCCCCCCCCCCCCCCCCCC
           CCCCCCCCCCCCCCCCCC
           CCCCCCCCCCCCCCCCC
           LCCCCCCCCCCCCCCC
          LLCCCCCCCCCCCCCC
          LLCCCCCCCCCCCCCC
         LLLCCCCCCCCCCCCCCC
        LLLLLCCCCCCCCCCCCC
        LLLLLCCCCCCCCCCCCC
       LLLLLLCCCCCCCCCCLLL
       LLLLLLLCCCCCLLLLLLL
      ${true ? '' : 'LLLLLLLLLCCCLLLLLLLL'}
     LLLLLLLLLLLLLLLLLLLLL
     LLLLLLLLLLLLLLLLLLLLL
    LLLLLLLLLLLLLLLLLLLLL
   LLLLLLLLLLLLLLLLLLLLL
  LLLLLLLLLLLLLLLLLLLLLL
LLLLLLLLLLLLLLLLLLLLLL
LLLLLLLLLLLLLLLLLLLLL
LLLLLLLLLLLLLLLLLLLLLLL
LLLLLLLLLLLLLLLLLLLLLL
LLLLLLLLLLLLLLLLLLLLLL`;
const fieldKey = { 'C': 'copper-ore', 'L': 'coal' };

const miners = [];
let startPos = [-9.5, -25.5];
let pos = [startPos[0], startPos[1]];
for (let i = 0; i < rawField.length; i++) {
  if (rawField[i] == '\n') {
    pos[1] += 1;
    pos[0] = startPos[0];
    continue;
  }
  let resource = fieldKey[rawField[i]];
  if (resource != undefined) {
    miners[miners.length] = { pos: [pos[0], pos[1] + 153 / 256], resource: resource };
  }
  pos[0] += 1;
}
miners.sort((a, b) => {
  return (b.pos[0] * b.pos[0] + b.pos[1] * b.pos[1]) - (a.pos[0] * a.pos[0] + a.pos[1] * a.pos[1]);
});

const lerp = (vec, r) => {
  if (r < 0) return [0, 0];
  if (r > 1) return vec;
  return [vec[0] * r, vec[1] * r];
}

const resourceCounts = { 'copper-ore': 0, 'coal': 0 };
for (const miner of miners) {
  miner.player = new Player(`${miner.resource}-miner${++resourceCounts[miner.resource]}`);
  miner.player.craft('iron-axe', 1);
  // Drop off the furnace with chestPlayer
  miner.player.moveSelectionTo(lerp(chestPlayer.position, currentTick / chestPlayer.tick));
  miner.player.toolbelt(1);
  miner.player.transferEntityStack('In');
  miner.player.runTo(miner.pos);
  miner.player.moveSelectionTo([miner.pos[0], miner.pos[1] - 153 / 256]);
  miner.player.startMining();
  currentTick += 4;
}

const furnaceTenderDelta = [6, 12];
const furnaceTenderStartPos = [-13 - 8 * furnaceTenderDelta[0], 0 - 2 * furnaceTenderDelta[1]];
const orderedFurnaceTenderDeltas = [0, 4, -3, 2, -1];
const furnaceTenderPos = [furnaceTenderStartPos[0], furnaceTenderStartPos[1]];
const furnaceTenders = [];
currentTick = -4;
const storedChestPlayerTick = chestPlayer.tick;
for (let i = 1; i <= 45; i++) {
  currentTick += 17 * 4;
  // 17 players have spawned, which means 17 furnaces, plus ours
  furnaceTenders[i] = new Player(`furnace-tender${i}`);
  furnaceTenders[i].position = [-153 / 256, -153 / 256]; // We're spawning on top of another player
  chestPlayer.tick = currentTick;
  chestPlayer.toolbelt(1);
  // Aim for the top of the furnace tender hitbox
  chestPlayer.moveSelectionTo([furnaceTenders[i].position[0], furnaceTenders[i].position[1] - 350 / 256]);
  chestPlayer.transferEntityStack('In');
  furnaceTenders[i].runTo(furnaceTenderPos);
  furnaceTenders[i].toolbelt(1);
  const furnaceStartPos = [-2 + furnaceTenders[i].position[0], -5 + furnaceTenders[i].position[1]];
  const furnaceDelta = [2, 2];
  const furnacePos = [furnaceStartPos[0], furnaceStartPos[1]];
  for (let j = 1; j <= 18; j++) {
    furnaceTenders[i].build(furnacePos[0], furnacePos[1], 'N');
    furnacePos[0] += furnaceDelta[0];
    if (j % 3 == 0) {
      furnacePos[0] = furnaceStartPos[0];
      furnacePos[1] += furnaceDelta[1];
    }
  }

  furnaceTenderPos[0] += furnaceTenderDelta[0];
  if (i % 9 == 0) {
    furnaceTenderPos[0] = furnaceTenderStartPos[0];
    furnaceTenderPos[1] += orderedFurnaceTenderDeltas[i / 9] * furnaceTenderDelta[1];
  }
}
chestPlayer.tick = storedChestPlayerTick;
chestPlayer.tick += 100000;
chestPlayer.stopRunning();
