# Writing mods

A mod adds to a game without changing it: new screens, things that happen
on existing screens, items, monsters, and its own saved state. Mods are
TypeScript (or JavaScript) modules, so they can do anything the game's own
scripts do, through the same `g` API.

The example in [mods/wishing-well/](../mods/wishing-well/) puts a
wishing well in Stone Valley. It's switched off; set
`FQ2_ENABLE_MODS=wishing-well` in `.env` to play with it.

> Mods are code, run with the game's own permissions, like the add-ons of a
> BBS door game. Only install mods you trust.

## Installing and switching off

Each mod is a folder in `mods/`, where the game or server is started. Only
the ones named in `FQ2_ENABLE_MODS` in `.env` (folders' names, with commas
between) are added; the rest are left alone, and their code never runs:

```sh
FQ2_ENABLE_MODS=wishing-well,my-mod            # in .env: these two
bun start --enable-mods wishing-well           # or on the command line
bun start --mods ~/fq2-mods                    # mods from somewhere else
bun run server --mods /srv/mods                # the same for the server (or FQ2_MODS in .env)
```

Taking a mod out of the list switches it off. A name with no folder is an
error. The server logs each mod it adds
(`Mod: The Wishing Well 1.0.0 (wishing-well)`), and a mod that can't be
added stops the game or server with a message saying why.

## A mod's folder

```
mods/wishing-well/
  mod.ts          the mod: its name, flags and scripts (required)
  items.json      new items, as in the game's data/items.json
  monsters.json   new monsters and encounter tables, as in data/monsters.json
  maps/           new screens, one file per screen, as in data/maps/
```

Only `mod.ts` (or `mod.js`) is needed. The data files are checked as the
game's are, and their errors name the mod (`wishing-well/items.json[0].kind:
...`). Screens can be made with the level editor: `bun run edit -m
mods/my-mod/maps`, then N for a new screen. The editor only sees the mod's
screens there, so pick numbers the game doesn't use. Screen numbers are
places on the world grid (80 across): an outdoor screen next to one of the
game's joins up with it, so the player can walk across.

## mod.ts

```ts
import type { Mod } from '@fq2ts/engine/mods';

export default {
    id: 'wishing-well',          // lower case letters, digits and dashes
    name: 'The Wishing Well',
    version: '1.0.0',
    api: 1,                      // the mod API it was written for
    description: 'A wishing well in Stone Valley.',
    flags: { wishes: 0 },        // the mod's own state, saved with the player
    screens: {
        82: {
            // Runs every time screen 82 is drawn (after the game's own).
            show: (g) => {
                g.overlay('{x 36}{y 18}{lightcyan}○');
            },
            // Runs when the player steps on (36,18).
            at: {
                '36,18': async (g, mod) => {
                    g.cls();
                    g.print('An old stone well.', '');
                    if ((await g.choice(['Make a wish', 'Walk on'])) === 0 && (await g.spend(1))) {
                        mod.flags.wishes++;
                        g.print('', 'Plink.');
                        await g.key();
                    }
                },
            },
        },
    },
} satisfies Mod<{ wishes: number }>;
```

- **Import only the type** (`import type`). It's there for type checking
  and is gone at run time, so the mod needs nothing installed to run.
  `satisfies Mod<...>` checks the whole mod and types every script's `g`
  and `mod`.
- **`api`** is the version of what mods are given. A mod written for
  another version isn't loaded. It's 1 today.
- **Scripts** are called with `g`, everything the game's own scripts get
  (see `ScriptContext` in
  [packages/engine/src/script.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/script.ts)), and
  `mod`, which holds the mod's flags. Scripts can be `async`.
- **`world`** is the mod's own world state, as `flags` are its own
  flags: what belongs to the world rather than a player (shared by
  everyone on a server). Values are like flags, or lists of strings; use
  them as `mod.world.name`, and set a new list rather than changing one.
  The game's own is in `g.world`, untyped.
- **`flags`** are the mod's own: give each its starting value (true or
  false, a number or a string) and use them as `mod.flags.wishes`. They're
  saved with the player as `"wishing-well.wishes"`, so they can't clash
  with the game's or another mod's. The game's own flags are in `g.flags`
  (untyped: `g.flags['ownsCastle']`).
- **`screens`** gives `show` and `at` scripts for any screen, the game's
  or the mod's own (from `maps/`). Tiles are `"x,y"`. (The game's own
  screens name their triggers by a character marked on their maps; a mod's
  maps can't mark them yet, so mods use `at`.)
- **`events`** are scripts for monsters' after-fight hooks: a monster in
  the mod's monsters.json with `"after": { "won": "eel-prize" }` runs the
  mod's `eel-prize` event when the player beats it.
- **`newGame`** runs after the game's own opening, when a new game starts:
  a place to give the player something to start with.

## The rules

Mods only add. Anything a mod adds that's already there is an error naming
the mod, so that two mods can never quietly fight over the same thing:

- an item, monster, encounter table or event with an id already in use;
- a screen (in `maps/`) whose number is already in use;
- a trigger (`at`) on a tile that already has one.

`show` scripts and `newGame` don't clash: they all run, the game's first,
then the mods' in order of their ids. Scripts for a screen that doesn't
exist (in the game or any mod) are an error too.

Mods are loaded in order of their ids, and a mod can use what the game
has: its screens, items and monsters. It can't change or remove them.

## Saved games

A save keeps the mod's flags and items. If the mod is removed, the save
still loads: the mod's flags and items are dropped, and a player standing
on one of its screens starts again at the start screen.

## Testing a mod

A mod is a plain object, so it can be tested like the game's scripts. See
[test/mods.test.ts](../test/mods.test.ts): it adds the
wishing well to Final Quest 2 with `loadMod` and `applyMods`, and plays it
on a scripted terminal.
