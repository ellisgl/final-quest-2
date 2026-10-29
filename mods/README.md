# Mods

Each folder here is a mod. Only the ones named in `FQ2_ENABLE_MODS` (in
`.env`, with commas between) are added to the game when it starts (`bun
start`, `bun run server`); the rest are left alone.

[wishing-well](wishing-well/) is an example: `FQ2_ENABLE_MODS=wishing-well`
switches it on. See
[docs/mods.md](../docs/mods.md) for how to write one.
