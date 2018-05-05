# FactorioReplay [![Build Status](https://travis-ci.org/Kizby/FactorioReplay.svg?branch=master)](https://travis-ci.org/Kizby/FactorioReplay)
Inspect, modify, and generate replay files for Factorio. This is a relatively simplistic parser/generator for the replay.dat format Factorio uses to store saved replays. You can try it at https://kizby.github.io/FactorioReplay/ - just drag your save file onto the page, and it will tell you the sequence of actions in the replay. If you add or remove any actions, you can click the "Save MyGame.zip" button, put the downloaded save back in your saves folder, and check out the Replay in Factorio. If you make changes, you'll probably want to get rid of any Checksum commands afterwards since they probably will no longer match what Factorio expects.

This code can probably be broken in myriad ways at this early point - if you can break it, please file an issue, ideally with a test case to reproduce it. Pull requests for new features or bug fixes are definitely welcome, but I'm fairly curmudgeonly about dependencies and intend to keep this work as [vanilla](http://vanilla-js.com/) as possible.

Any Factorio icons or data used in this tool belong to Wube Software.

# Replay Framework
If you're familiar with Javascript, you can use the box on the right to write code that will run and populate the text box on the left. For example,
```javascript
const player = new Player('TASBot');
player.craft('iron-axe', 1);
for (let i = 0; i < 20; i++) {
  player.run('NESW'[i % 4]);
  player.tick += 60;
}
player.stopRunning();
```
will make a player named TASBot craft an iron axe and run in a few circles. For now, the only documentation of available methods is in the code itself (specifically in scripts/replay_frames.mjs, with the first letter lowercase), but anyone who would like to add real documentation would be much appreciated :)
