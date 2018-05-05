const player = new Player('TASBot');
player.craft('iron-axe', 1);
for (let i = 0; i < 20; i++) {
  player.run('NESW'[i % 4]);
  player.tick += 60;
}
player.stopRunning();
