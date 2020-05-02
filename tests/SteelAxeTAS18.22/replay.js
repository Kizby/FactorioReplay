const ticksPerSmelt = 192;
const ticksPerMine = 240;
const ticksPerPlayerMine = 120;

const player = new Player('TASBot');
player.showInfo();
player.craft('iron-gear-wheel', 3);
player.run('N');

player.tick = 23;
player.grab('burner-mining-drill');
player.build(5, -13, 'N');
let miners = [[5.5, -13.5]];

player.tick++;
player.moveSelectionTo([5, -13]);
player.grab('wood');
player.transferEntityStack('In');
const woodStart = player.tick;

player.tick = 32;
player.run('NE');

player.tick += 4;
player.grab('stone-furnace');
player.build(5, -15, 'N');
let furnaces = [[5.5, -15.5]];
player.clearCursor();

player.tick = 32 + 94;
player.stopRunning();
player.moveSelectionTo([11, -19]); // Huge rock
player.startMining();

player.tick += 6*60 + 1;
player.stopMining();
player.stow('coal', 49);
player.stow('stone', 38);

player.craft('stone-furnace', 7);

const fuelMiner = (pos) => () => {
	player.pushSelection(pos);
	player.grab('coal');
	player.dropItem(...pos);
	player.clearCursor();
	player.popSelection();
	player.schedule(player.tick + 1600, fuelMiner(pos));
};
player.schedule(woodStart + 800, fuelMiner(miners[0]));

const fuelFurnace = (pos) => () => {
	player.pushSelection(pos);
	player.grab('coal');
	player.dropItem(...pos);
	player.clearCursor();
	player.popSelection();
	player.schedule(player.tick + 2666, fuelFurnace(pos));
};
fuelFurnace(furnaces[0])();
const smeltStart = player.tick;
const ironOrePos = [9, -17];

const doMine = () => {
	player.startMining();
	player.schedule(player.tick + ticksPerPlayerMine + 1, doSmelt);
};
const doSmelt = () => {
	player.stopMining();
	player.stow('iron-ore', 1);
	player.grab('iron-ore');
	player.pushSelection(furnaces[1])
	player.dropItem(...furnaces[1]);
	player.popSelection();
	doMine();
};

player.moveSelectionTo(ironOrePos);
doMine();

player.tick = smeltStart + ticksPerPlayerMine;
player.grab('stone-furnace');
player.build(7, -18, 'N');
furnaces.push([7.5, -18.5]);

player.tick++;
fuelFurnace(furnaces[1])();

player.tick = smeltStart + ticksPerSmelt + 3;
player.pushSelection(furnaces[0]);
player.clearCursor();
player.transferEntityStack('Out');
player.stow('iron-plate', 1);
player.popSelection();
player.craft('burner-mining-drill', 1);

player.tick += 121;

player.tick = 8000;
player.openPlayerInventory();
console.log(player.inventory);