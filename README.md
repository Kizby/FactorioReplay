# FactorioReplay [![Build Status](https://travis-ci.org/Kizby/FactorioReplay.svg?branch=master)](https://travis-ci.org/Kizby/FactorioReplay)
Inspect, modify, and generate replay files for Factorio. This is a relatively simplistic parser/generator for the replay.dat format Factorio uses to store saved replays. You can try it at https://kizby.github.io/FactorioReplay/ - just drag your replay.dat file (inside your unzipped save file¹) onto the page, and it will tell you the sequence of actions in the replay. If you add or remove any actions, you can click the "Export replay.dat" button, put the downloaded replay.dat into your save zip, and check out the Replay in Factorio. If you make changes, you'll probably want to get rid of any Checksum commands afterwards since they probably will no longer match what Factorio expects.

This code can probably be broken in myriad ways at this early point - if you can break it, please file an issue, ideally with a test case to reproduce it. Pull requests for new features or bug fixes are definitely welcome, but I'm fairly curmudgeonly about dependencies and intend to keep this work as [vanilla](http://vanilla-js.com/) as possible.

Any Factorio icons or data used in this tool belong to Wube Software.

¹In Windows at least, dragging and dropping from inside compressed folders doesn't seem to work
