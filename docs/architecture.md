# How it works

A tour of the code for anyone who wants to understand it or change it: what
the parts are, how they fit, and what happens, step by step, when a player
presses a key. It assumes you can read TypeScript; it doesn't assume you've
written a game before. (To make a game, see [making-a-game.md](https://github.com/ellisgl/hello-quest/blob/main/docs/making-a-game.md);
to write a mod, [mods.md](mods.md).)

## The parts

```
 final-quest-2 (this repo)          hello-quest
   content/  data/  fq2.ts            content.ts  data/  hello.ts
   server.ts  tools/                  tools/
        │                                  │
        ▼                                  ▼
 fq2ts-engine ◄──── fq2ts-server  (multiplayer, in the browser)
   the game itself ◄── fq2ts-tools  (map viewer, editor, generator)
```

- **The engine** ([fq2ts-engine](https://github.com/ellisgl/fq2ts-engine/tree/main/src)) is
  everything a game of this kind needs: a screen of coloured characters, a
  keyboard, a world of screens, a player, scripts, fights, items, saves. It
  knows nothing about Final Quest 2.
- **A game** is content (TypeScript: what happens) and data (JSON: maps,
  items, monsters), handed to the engine. Final Quest 2 is one; Hello Quest
  is the smallest one.
- **The server** runs a game for many players at once, over the network.
- **The tools** edit and draw a game's maps.

The engine never imports a game, the server or the tools; they import it.
That's what lets any game use it.

## The engine, file by file

Roughly from the bottom up:

| File | What it is |
|---|---|
| [validate.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/validate.ts), [assert.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/assert.ts) | Checking data read from files (`record`, `field`, `integer`...), and lookups that can only fail through a bug (`at`). |
| [chars.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/chars.ts) | What fits in one screen cell: one character one column wide. Everything shown goes through it, so nothing a player types can break the screen. |
| [screen.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/screen.ts) | The 80x25 grid of cells, and turning it into terminal output. |
| [terminal.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/terminal.ts) | The keyboard and the real terminal: raw input becomes key names; the screen is sent out. |
| [text.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/text.ts) | The text markup (`{yellow}`, `{x 10}`, `{center}`...) drawn onto the screen. |
| [icy.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/icy.ts) | Pictures drawn in Icy Draw (`.icy`: layers, and tags for text), turned into markup. |
| [ui.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/ui.ts) | Building blocks: menus (`choose`), text boxes, the status bar, scrolling text. |
| [world.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/world.ts) | The map: screens on a grid, each 79x22 cells, read from JSON files. |
| [player.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/player.ts), [items.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/items.ts) | The player's state (what's saved), and the item catalogue. |
| [combat.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/combat.ts) | Monsters, encounter tables, and the fight screen. |
| [shared.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/shared.ts) | The world's state (`g.world`): what belongs to everyone, not one player. |
| [script.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/script.ts) | `ScriptContext`, the `g` every script gets: the whole API for content. |
| [game.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/game.ts) | `Game`: the title menu, walking about, running triggers, messages, saving. The heart of it. |
| [saves.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/saves.ts), [files.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/files.ts) | Save slots, written safely. |
| [data.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/data.ts), [mods.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/mods.ts) | Reading a game's data folder, and adding mods to it. |
| [testing.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/testing.ts), [fixture.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/fixture.ts) | A pretend terminal for tests, and Test Quest, a tiny game to test with. |

## The screen and the terminal

The game never writes to the terminal directly. It draws on a `Screen`: an
80x25 grid where each cell has a character, a foreground and background
colour, and whether it blinks (`screen.put(x, y, ch, fg, bg)`, or
`draw(screen, '{yellow}markup')` from text.ts). Coordinates start at 1, as
in the original game. Colours are 0 to 255: the 16 CGA colours, then
xterm's palette. Each screen knows its terminal's colour depth (true
colour, 256 or 16) and draws each colour as the nearest that terminal can
show.

When the game waits for a key, the `Terminal` *flushes* the screen:
`Screen.render()` compares every cell with what was sent last time, and
sends only the ones that changed, as ANSI escape codes (move the cursor
here, these colours, these characters). Drawing the whole map again costs
nothing on the wire if nothing changed, which is why the game can redraw
freely, and why a slow connection still feels quick.

The other way, the terminal reads raw bytes from the keyboard and turns
them into events: `parseKeys` makes `'\x1b[A'` into `'up'`, `'\r'` into
`'enter'`, and so on. Events wait in a queue (at most 256: more is someone
flooding) until the game asks for one with `term.key()`.

`Terminal` takes its input and output as interfaces (`TerminalInput`,
`TerminalOutput`). In a real terminal they're `process.stdin` and
`process.stdout`; on the server they're a network connection (RemoteIO);
in tests, a `FakeTerminal` that plays back a list of keys. The game can't
tell the difference, so the same game runs in all three.

## The life of a keypress

The player is standing in Stone Valley and presses the right arrow. What
happens:

1. **The keyboard.** The terminal's input gets the bytes `ESC [ C`.
   `parseKeys` makes them `'right'`, and `Terminal.push` hands the event to
   whoever is waiting for one.
2. **Waiting.** The game is in `Game.waitKey()`, inside `Game.play()`'s
   loop. Before each wait it calls `idle()`: tell the server where the
   player is (`moved`), redraw other players if they moved, show messages
   from outside. Then `term.key(timeout)` flushes the screen and waits. The
   timeout is for the status bar message, which goes after a few seconds,
   and the screensaver.
3. **Which key.** `play()` looks the key up: arrows and 8 4 6 2 are moves
   (`MOVES`); I, M, B, R, ? and Escape are built-in screens; the game's
   own keys (FQ2's F) and a server's (P, L, T...) are scripts; anything
   else might start a cheat word.
4. **The step.** `Game.move(1, 0)` works out the new cell. Off the edge of
   the screen, `crossEdge` goes to the next screen. Otherwise, if the cell
   has a trigger (a script in `content.screens[82].at`, by its `"x,y"`),
   it runs first; then, unless the cell is solid or the script said
   otherwise, the player moves there (`placePlayer`), and on a screen with
   monsters, on wild ground, one might attack (`encounter`).
5. **The script.** `runScript` makes a `ScriptContext` (`g`) and calls the
   script with it. The script uses `g` to do things: `g.write('...')` puts
   a message on the status bar; `g.cls()` and `g.print(...)` take the
   screen for a scene; `g.goto(screen, x, y)` asks to travel; `g.gold += 5`
   changes the player. Scripts are `async`, so `await g.key()` simply
   waits for the player, as long as it takes.
6. **After the script.** `runScript` looks at what it did. If it asked to
   travel, the game goes there (`travel`), which draws the new screen and
   runs any trigger where the player lands. If it took the screen, the map
   is drawn again (`redraw`). Then `checkpoint` hands the player's state to
   `autosave`, if the game has one (the server does).
7. **Drawing.** `placePlayer` puts back the cell the player left and draws
   ☺ in the new one; a message changes the status bar. Nothing has been
   sent yet.
8. **Back to waiting.** The loop comes round to `waitKey` again, which
   flushes the screen: only the two cells and the status bar go out.

So the whole game is a loop of *wait for a key, change some state, draw on
the screen*, and everything it shows goes through the screen. A script
never has to think about the terminal, the network or other players.

## Content and scripts

A game gives the engine a `Content` object
([content/index.ts](../content/index.ts)): its title
screen, help, status line, the start player, its opening, its inventory
screen, and, most of all, `screens`: for each screen, the scripts that run
when the player steps on a tile and when it's drawn (`show`).

Final Quest 2 has a file for each screen in
[content/screens/](../content/screens/), named for its number like its map.
Its `triggers` are named by a character (`D: door(725, 31, 15)`), and the
map's `triggers` rows put each character on its tiles: the map says where,
the content says what. `placeTriggers` (game.ts) turns them into `at`
scripts, "x,y" for each tile, as the game starts, and stops it with the
screen named if a character on a map has no trigger, a trigger is on no
tile, or a tile has two. A screen can also give `at` scripts itself, as
mods do.

Final Quest 2's title, help, credits and world map legend are pictures
drawn in Icy Draw ([content/ui.ts](../content/ui.ts) reads `data/art/*.icy`):
icy.ts draws their layers together into markup, and fills in their tags
with text from `config.json`. The title's `Menu` layer gives the menu box
(`title.menu.box`), where the server puts its login menus and questions.

`Content<Flags, World>` takes two types: the game's flags (what each
player remembers: `{ hadDrink: boolean; ... }`) and its world state (what
everyone shares: `{ castleOwners: readonly string[]; ... }`). They make
`g.flags.hadDrink` and `g.world.castleOwners` checked by the compiler, so a
typo is an error before the game runs.

Data comes from JSON files, read once at start and checked as they're read
(`readGameData`, with validate.ts underneath): a bad file stops the game
with the file and the bad value named, before the screen is taken over.

## Saving

The player is a plain object (`Player`: where they are, hitpoints, gold,
items, flags...), so saving is writing it as JSON. Loading checks every
field (`restorePlayer`): flags and items the game no longer has are
dropped, new ones get their start values, and a player on a screen that's
gone starts again at the start. Single-player keeps save slots in files,
with the world's state beside the player; the server keeps players in its
database, and one world for everyone.

## Mods

A mod is a folder with a `mod.ts`. Before the `Game` is made, `loadMods`
imports each one, and `applyMods` adds it to the game: its items, monsters,
maps and scripts merged in, its flags and world state kept apart under its
own name. The game only ever sees the merged content, so to it a mod is
just more content.

## The server

[fq2ts-server](https://github.com/ellisgl/fq2ts-server/tree/main/src) runs one game for everyone, in
one process:

```
                                     ┌─► Game (Ann)   ─┐
 web ──────► Connection ─► Terminal ─┼─► Game (Bob)   ─┼─► Realm: who's where
             (RemoteIO)    Session   └─► Game (Cat)   ─┘   Store: SQLite
```

- **A connection** ([server.ts](https://github.com/ellisgl/fq2ts-server/blob/main/src/server.ts)) is one
  player's web socket, from the page ([client.html](https://github.com/ellisgl/fq2ts-server/blob/main/src/client.html),
  using xterm.js). Each gets a `RemoteIO`, which pretends to be a keyboard
  and a terminal, and a `Terminal` on top, so the game runs exactly as it
  does on your own screen.
- **The guard** ([guard.ts](https://github.com/ellisgl/fq2ts-server/blob/main/src/guard.ts)) checks each
  connection as it opens: banned addresses, too many connections, and later
  too many wrong passwords or emails.
- **A session** ([session.ts](https://github.com/ellisgl/fq2ts-server/blob/main/src/session.ts)) is the
  front door: log in, sign up (with an email address, confirmed with a
  code), reset a password. Then it makes the player's `Game` and plays it.
- **The realm** ([realm.ts](https://github.com/ellisgl/fq2ts-server/blob/main/src/realm.ts)) knows who is
  playing and where, and passes things between their games: other players
  to draw, things said, arrivals.
- **The store** ([store.ts](https://github.com/ellisgl/fq2ts-server/blob/main/src/store.ts)) is the SQLite
  database: accounts, players, letters, news, bans. Its layout grows a step
  at a time ([migrations.ts](https://github.com/ellisgl/fq2ts-server/blob/main/src/migrations.ts)), and an
  older database is brought up to date when the server starts.
- **The extra keys** each have a file: talking and mail
  ([talk.ts](https://github.com/ellisgl/fq2ts-server/blob/main/src/talk.ts)), fights between players
  ([pvp.ts](https://github.com/ellisgl/fq2ts-server/blob/main/src/pvp.ts)), gifts
  ([gifts.ts](https://github.com/ellisgl/fq2ts-server/blob/main/src/gifts.ts)), bounties
  ([bounty.ts](https://github.com/ellisgl/fq2ts-server/blob/main/src/bounty.ts)), lists
  ([lists.ts](https://github.com/ellisgl/fq2ts-server/blob/main/src/lists.ts)), the admin menu
  ([admin.ts](https://github.com/ellisgl/fq2ts-server/blob/main/src/admin.ts)).
- **Days** ([days.ts](https://github.com/ellisgl/fq2ts-server/blob/main/src/days.ts)) turn at midnight;
  **the world's state** ([world-state.ts](https://github.com/ellisgl/fq2ts-server/blob/main/src/world-state.ts))
  is kept in the database and shared by every game.

### One process, many players, no locks

JavaScript runs one thing at a time: while Ann's game handles her key,
nothing else runs. Everything waits at an `await`: Bob's game is waiting
for Bob's key, Cat's for an email to be sent. So no two pieces of code ever
change the same thing at once, and the server needs no locks. The rule
that matters instead: **between two `await`s, check and change together**.
Something checked before an `await` may have changed after it, because
others ran meanwhile. That's why a fight between players checks its target
again once it's chosen, and settles with the target's game as it is at the
end of the fight, not as it was at the start.

### Telling another player's game something

Bob's game is busy with Bob: it might be in a shop, a fight or a menu. Ann
can't draw on Bob's screen in the middle of that. So other games only *tell*
Bob's game things, and it acts on them when it's next idle:

- `game.othersChanged()`: other players moved (redraw their ☻).
- `game.refresh()`: something drawn changed (the world, Bob's gold).
- `game.notify(text)`: a message ("Ann enters the realm.").

Each sets a flag or queues the message, and calls `term.wake()`, which ends
Bob's game's wait for a key early, as if it had timed out. The game wakes in
`waitKey`, does what it was told in `idle()`, and waits again. If Bob is in
a shop, nothing wakes, and it's all done when he's back on the map.
`game.waiting` says whether a game is idle on the map, which is when
another player can, say, attack it.

## Tests

`bun test` runs about 1,500 tests in a few seconds. Three kinds, each a
level up:

- **Pieces on their own**: parse this map file, damage from this blow, this
  store query.
- **Whole games on a pretend terminal**: `FakeTerminal` plays back a list
  of steps (keys, or functions that look at the screen and return the next
  key), so a test can play a game from the title screen to the end and
  check what was on the screen at each moment. The engine tests play Test
  Quest ([fixture.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/fixture.ts)); FQ2's tests play
  Final Quest 2.
- **The real server**: the server tests start a server and connect to it
  over web sockets, as players would. A model of each
  client's screen ([screen-model.ts](https://github.com/ellisgl/fq2ts-server/blob/main/test/screen-model.ts))
  follows what the server sends, so a test can wait until "Bob says: hello"
  is on Ann's screen.

`bun run check` runs the type checker, the linter and every test; it must
pass before a change goes in.

## Conventions

- TypeScript as strict as it goes, and no `any`, no `as` casts, no `!`:
  data from outside is checked into its type (validate.ts), not asserted.
- Code style is PER (4 spaces, single quotes, braces always); ESLint
  checks it, and `bunx eslint --fix .` fixes most of it.
- Comments say what something is for and why, in plain words; the names
  say what.
- Everything a player can make the server keep is bounded: queues, caches,
  mailboxes, the news. A test checks each bound.

## Where to start reading

1. [games/hello/content.ts](https://github.com/ellisgl/hello-quest/blob/main/content.ts): a whole game in one
   file.
2. [script.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/script.ts): everything content can
   do.
3. [game.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/game.ts), from `play()`: the loop
   described above.
4. [screen.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/screen.ts) and
   [terminal.ts](https://github.com/ellisgl/fq2ts-engine/blob/main/src/terminal.ts): drawing and keys.
5. For the server: [server.ts](https://github.com/ellisgl/fq2ts-server/blob/main/src/server.ts)'s
   `startServer`, then [session.ts](https://github.com/ellisgl/fq2ts-server/blob/main/src/session.ts)
   and [realm.ts](https://github.com/ellisgl/fq2ts-server/blob/main/src/realm.ts).
