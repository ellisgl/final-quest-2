# Final Quest 2 - TypeScript Rewrite

Final Quest 2 is a text-mode RPG writen QBASIC in late 90s, early 00s, inspired by Legend of the Red Dragon (both 1 and 2) by Seth Robinson. This is a TypeScript rewrite of it that runs in a terminal with [Bun](https://bun.sh/).

The original QBASIC source, level editor, map renderer, map generator and REF scripting docs are in the original repo: [bafetk/final-quest-2](https://github.com/bafetk/final-quest-2).

The rewrite, in a terminal:

![main menu](screenshots/menu.png)

![first screen](screenshots/firstscreen.png)

## Running

You need [Bun](https://bun.sh/) and a terminal of at least 80x25:

```sh
bun install            # the engine, server and tools (from GitHub), and the dev tools
bun start              # or: bun fq2.ts
bun run debug          # or: bun fq2.ts --debug   (position display, S = settings editor)
```

Saved games go to `saves/` as JSON. The game draws in true colour, 256 colours or 16, depending on what the terminal says it supports (`COLORTERM` and `TERM`). Set `FQ2_COLORS` to `true`, `256` or `16` to choose for yourself.

While exploring: arrows (or 8 4 6 2) walk, **I** or **V** shows your stats and inventory (pick an item to use, equip or drop it), **M** the world map, **B** the last messages, **R** redraws the screen, **?** lists the keys and **Esc** goes back to the title menu.

Text and maps are Unicode (UTF-8): a map cell can hold any character one column wide (letters with accents, Greek, Cyrillic, box drawing, blocks, symbols...), but not wide ones like emoji or CJK, which would put the screen out of line. Anything that doesn't fit a cell is shown as `?`.

Items are defined in `data/items.json` and monsters and encounter tables in `data/monsters.json`.

## Multiplayer server

```sh
bun run server                     # web on http://127.0.0.1:8080/
bun run server --host 0.0.0.0      # let other computers connect (-h for all the options)
```

Players connect with a web browser, make an account, and play. Every account has an email address, confirmed with a code sent to it, and one address can only have one account. A forgotten password is reset from the login menu with another code, and the address can be changed from the menu in the game (Escape), which takes the password and a code sent to the new address. The codes are sent through an SMTP server:

```sh
FQ2_SMTP_PASSWORD=... bun run server --smtp-host smtp.example.com --smtp-user game@example.com
```

Without `--smtp-host`, emails are written to the server's log instead, for trying it out.

Every option can also be set as an environment variable (`--smtp-host` is `FQ2_SMTP_HOST`, and so on), or kept in a `.env` file in the folder the server is started from: copy [.env.example](.env.example) to `.env` and fill it in. Options on the command line win. `.env` is ignored by git, so the SMTP password stays out of the repository.

Players' games are saved in `server-data/fq2.sqlite` as they go (passwords are stored as argon2id hashes). The server listens only on this computer unless given `--host`. The web page is plain HTTP, so over the internet put it behind HTTPS (see [docs/deploying.md](docs/deploying.md)).

Players see each other on the map (☻) and hear when someone enters or leaves the realm. On the server, T says something to the players on your screen, Y yells to everyone, W reads and writes letters, D shows the daily news, H fights a player next to you (not on safe screens, three times a day), G gives a player next to you gold or an item (A accepts what you're offered), K is the bounty board in town (gold on a player's head, for whoever beats them), P lists who's in the realm, S names the players on your screen, B shows the last messages (what was said, who came and went) and L ranks every player; ? lists them all. Everyone shares the Wyrm in the mountains west of Stone Valley, wearing it down together, one fight a day each, and the realm's deeds go on the hall of heroes' plaque in Stone Valley. F, anywhere, shows the hall, who owns the castle and how the Wyrm is. A new day dawns at midnight. Admins (`bun run admin admin NAME`) press ! in the game to kick, ban and unban players; [docs/deploying.md](docs/deploying.md) covers running a server for real: systemd, HTTPS, backups and upgrades. The cheat words are off on the server, and swear words are starred out of what players say and write (clean mode: `--bad-words FILE` for your own list, `--no-clean` to turn it off). See [docs/multiplayer.md](docs/multiplayer.md) for what's next.

## Mods

Mods add screens, items, monsters and scripts to the game without changing it. Each is a folder in `mods/` with a `mod.ts` (TypeScript, using the same `g` API as the game's scripts) and any data files; the game and the server load them when they start (`--mods DIR` for another folder). [mods/_wishing-well/](mods/_wishing-well/) is an example (rename it without the `_` to switch it on), and [docs/mods.md](docs/mods.md) explains how to write one. Mods are code: only install ones you trust.

## Drawing the screens

The title, help, credits and the world map's legend are drawn in [Icy Draw](https://github.com/mkrueger/icy_tools/blob/master/crates/icy_draw/README.md) (0.6 or later) and kept in its own format in [data/art/](data/art/): open a `.icy` file there, change it, and save it. The game reads them as they are, so there's nothing to export.

- **Layers** are drawn bottom first, as Icy Draw shows them; hidden ones aren't drawn. Some have jobs, by name: the title's `Menu` layer is the inside of the menu box (the menus and login questions go wherever it is), the credits' `Frame` layer is shown in a random colour (anything in it that isn't black), and `legend.icy` is a layer with an alpha channel, drawn over the world map, so its empty cells leave the map alone.
- **Tags** are where text from `config.json` goes. A tag's replacement is the text, with `@TITLE@`, `@VERSION@`, `@REVISION@` and `@COMPANY@` filled in: `Welcome to @TITLE@ @VERSION@ by @COMPANY@.` is one tag. The game lines it up in the tag (left, centred or right) in the tag's colours, and cuts it if it's too long; the preview, what Icy Draw shows in its place, sets how long the tag is. [data/art/final-quest-2.toml](data/art/final-quest-2.toml) lists them: copy it to `~/.config/icy_draw/data/plugins/taglists/` to pick them in the tag dialog.
- Use the 16 standard colours or xterm's 256, and characters one column wide (CP437, or any in a Unicode document). The game refuses a file with layer effects, a custom palette's colours or wide characters, naming what it can't draw; fonts, palettes and images are left out.

## Tools

New versions of the original's map tools, working on `data/maps/` directly:

```sh
bun run edit                       # the level editor (in the terminal; press ? for its keys)
bun run generate                   # fill every blank outdoor screen with generated terrain
bun run generate -s 8-10 --seed 7 -p preview.html -n   # try a seed without saving
bun run view                       # write world.html: the whole world, to open in a browser
bun run view -s 82,721-726         # only some screens (-o sets the output file, -h for help)
bun run art export 82              # write screen 82 as data/art/maps/0082.icy, to draw in Icy Draw
bun run art import 82              # bring it back into data/maps/0082.json (no screens: every .icy there)
```

The editor opens on an overview of the whole 80x24 world grid, one cell per screen, coloured by kind. From there you can create, copy, delete and re-kind screens, and press Enter to edit one. Screens are painted with a brush (character, colours, and whether it's solid) using the keyboard or the mouse. Left-drag paints, right-drag selects, and a middle click picks up a cell as the brush. The bottom row is a palette: click the brush for the character picker, a colour to use it, `fg` or `bg` (or press A) to pick from all 256 colours, or HARD/SOFT to switch. In the overview, click a screen to select it and click again to open it. There's a character picker (pages of box drawing, blocks, symbols, arrows, letters and more; or type any character, or give its code point with Tab), rectangle selections with fill, copy and stamp, undo/redo, and overlays for solid cells and trigger tiles. S saves to the map folder, and only screens that changed are rewritten.

![the level editor, on Stone Valley](screenshots/leveleditor.png)

The viewer lays the outdoor screens out where they sit on the world grid and lists the interiors after them, in their real characters and colours. It can zoom, and outline solid cells and trigger tiles.

![the whole world in the viewer](screenshots/view.png)

The generator fills outdoor screens with land, water, forest, mountains and winding trails in the style of the hand-made screens. First create the screens in the editor (N makes a blank screen of a chosen kind); the generator fills blank screens, and only replaces finished ones with `--force`.
- Water follows the kinds: water screens become lakes and seas, and coasts form where they meet land, including hand-made land.
- Terrain comes from noise over the whole world, so neighbouring screens line up at their edges.
- Towns get a clearing in the middle, left for building by hand.
- Roads and open ground on a hand-made neighbour carry on across the edge, and any walkable patch that ends up cut off gets a path cleared to it.
- The same `--seed` always gives the same result, and `--preview` writes an HTML page of the new screens and their neighbours.

`bun run art` puts maps in [Icy Draw](https://github.com/mkrueger/icy_tools/blob/master/crates/icy_draw/README.md). Each screen's file has a layer for each part of it: `Tiles`, the screen as it looks (add more layers over it if you like: they're drawn together, as Icy Draw shows them), then `Terrain` (each cell's letter as in the map files: `.` grass, `f` forest, `m` mountain, `w` water, `r` road, `_` floor, `#` structure; a cell left empty gets the terrain its look suggests), `Solid` (anything drawn there is solid) and `Triggers` (the screen's trigger characters), which start hidden. Import checks every cell and names the file and cell of anything a map can't hold. The screen's name, kind and encounters stay in its map file, and the exported files are a working copy (git ignores them): the maps are still `data/maps/`.

## Development

Bun runs the TypeScript directly but doesn't type-check it, so check before committing:

```sh
bun run check          # tsc (strict) + eslint (typescript-eslint strict-type-checked) + tests
bun test               # just the tests
bun run coverage       # tests with a coverage report
```

Code style follows the PER Coding Style (adapted from PHP): 4-space indents, single quotes, braces on every block, explicit `public`/`private`, no trailing whitespace. ESLint enforces it (`bunx eslint --fix .` fixes most of it). The code avoids `any`, `as` casts and `!` assertions. Lookups that can only miss because of a bug go through `at()`/`cellAt()` in [assert.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/assert.ts), which throw. JSON files and saved games are checked when they're loaded ([validate.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/validate.ts)), so a bad file fails with the path to the bad value, e.g. `monsters.json.monsters[1].hp: expected a whole number`.

## Layout

This repository is Final Quest 2, a game built on packages that other games can use, each in its own repository and installed from GitHub (`package.json` pins each to a tag):

- [fq2ts-engine](https://github.com/ellisgl/fq2ts-engine) (`@fq2ts/engine`) is the game engine: terminal, screen, text markup, world, combat, items, saves, and the `g` API that scripts use ([script.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/script.ts)). [testing.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/testing.ts) is a kit for testing games: a `FakeTerminal` that plays back scripted key presses, so whole games can be driven from a test, and small maps, worlds and monsters.
- [fq2ts-server](https://github.com/ellisgl/fq2ts-server) (`@fq2ts/server`) is the multiplayer server: web connections, accounts with email addresses, saves (SQLite, with [migrations](https://github.com/ellisgl/fq2ts-server/blob/main/src/migrations.ts)), and each player's session. [cli.ts](https://github.com/ellisgl/fq2ts-server/blob/main/src/cli.ts) is its command line, which a game runs with its content.
- [fq2ts-tools](https://github.com/ellisgl/fq2ts-tools) (`@fq2ts/tools`) holds the map tools (see Tools above); a game gives them its map folder and trigger tiles.
- [hello-quest](https://github.com/ellisgl/hello-quest) is Hello Quest, the smallest whole game on the engine: three screens, a sign, a hermit and some monsters. [docs/making-a-game.md](https://github.com/ellisgl/hello-quest/blob/main/docs/making-a-game.md) builds it step by step, as a guide to making your own.
And in this one:

- [fq2.ts](fq2.ts) is the single-player entry point, [server.ts](server.ts) the multiplayer one, and [tools/](tools/) runs the map tools on its maps.
- [content/](content/) is the game itself: every screen's triggers and all the scripts, written as async TypeScript functions (converted from the original REF files). [content/screens/](content/screens/) has a file for each screen, named for its number like its map: its triggers are named by a character, and the map's `triggers` rows put each character on its tiles. [content/start.ts](content/start.ts) holds the starting player and the `Flags` type, so a misspelled flag is a compile error.
- [data/](data/) holds the game data as JSON: `config.json` (from VARS.DAT), `items.json` (the item catalogue), `monsters.json` (monsters and encounter tables, from NOSCR.DAT) and one file per screen in `data/maps/` (from MAPS.DAT, now with screen names and terrain). `data/art/` holds the screens drawn in Icy Draw (see Drawing the screens above).
- Tests (`bun:test`) sit in each repository's `test/` folder. The packages test themselves on Test Quest ([fixture.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/fixture.ts)), a tiny game of four screens and a few triggers, with its data in [fixture/](https://github.com/ellisgl/fq2ts-engine/tree/main/src/fixture), so they don't need Final Quest 2. FQ2's own tests are in [test/](test/): its scripts, data and maps, with its fixtures in [helpers.ts](test/helpers.ts). [content/data.test.ts](test/content/data.test.ts) runs every trigger in the game and checks that it sends the player somewhere real.
- [mods/](mods/) holds the mods to add to the game, and [docs/mods.md](docs/mods.md) is the guide to writing them ([mods.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/mods.ts) is the loader).
- [docs/architecture.md](docs/architecture.md) is a tour of how it all works: the parts, the life of a keypress, the server, and where to start reading.
- [docs/multiplayer.md](docs/multiplayer.md) is the plan for live multiplayer (in the browser, LORD II style).

## License

See [LICENSE](LICENSE).
