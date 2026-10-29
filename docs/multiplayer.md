# Multiplayer plan

Final Quest 2 was inspired by Legend of the Red Dragon II, a multiplayer BBS
door game. This is the plan for live multiplayer in the TypeScript version:
players connect to one server with a web browser, see each other move
around the map, talk, and fight.

Single-player stays as it is (`bun start`, with save slots). Multiplayer is a
separate entry point (`bun run server`).

## Architecture

```
                       +------------- server.ts (one Bun process) -------------+
 browser (wterm)  WS>| WebConnection    -> Terminal -> Session (Game) --+     |
                       |                                                 v     |
                       |        Realm: who's online, where, chat, news,        |
                       |        shared flags, PvP ---- SQLite (bun:sqlite)      |
                       +-------------------------------------------------------+
```

- **Connections** turn a socket into the `TerminalInput` / `TerminalOutput`
  pair `Terminal` already accepts.
  - The web client is a static page with wterm (xterm.js at first),
    sending keys and resizes over a WebSocket (the editor's mouse support works there too).
- **Session**: today's `Game`, one per connection, with the player's state
  loaded from and saved to the database instead of save slots.
- **Realm**: the shared state of everyone online. It tracks who's on which
  screen, passes events between sessions (moves, chat, arrivals), holds the
  world-wide flags and writes the news.
- **Storage**: SQLite through `bun:sqlite` (built into Bun): accounts,
  players (as JSON), world flags, news, mail.

The server is one process, so shared state needs no locks: a check and a
change with no `await` between them can't be interrupted.

## What players get

| Key | |
|---|---|
| (map) | Other players drawn live on your screen; notices when they arrive and leave |
| P / L | Who's online / every player, ranked |
| S | The names of the players on your screen |
| B | The last messages: what was said, who came and went |
| T / Y | Talk to your screen / yell to everyone |
| W | Write mail; new mail is announced when you log in |
| D | The daily news: deaths, PvP results, big purchases... |
| H | Fight a player on your square (not on safe screens) |

Shared world state makes some things unique (only one player can own the
castle). A daily cycle at midnight resets per-day things.

## Phases

Each phase ends playable, tested and committed.

0. **Groundwork, still single-player.**
   - The game reports when to save the player (`autosave`), so the server
     can keep them in the database instead of save slots.
   - The game knows whether it's showing the map or a full-screen script,
     so other players' moves are only drawn on the map.
   - Text players write (names; later chat and mail) is escaped, so it
     can't inject colour markup into other players' screens.
1. **The server.** SSH and WebSocket transports and the browser page;
   accounts with password hashes (`Bun.password`, argon2id); login and new
   player screens in place of save and load; autosave; idle timeout and a
   connection limit; each session's errors contained to that session.
2. **Presence.** Live positions on the map, arrival and departure notices,
   P and L.
3. **Talking.** T, Y, mail, the daily news, chat in the back-buffer (B).
4. **Shared world.** Content declares world flags beside player flags;
   scripts get `g.world` and `g.news(text)`.
5. **PvP and days.** H runs a fight against the other player's stats (as
   LORD fought players), and they're told the result; safe screens get a
   flag in the map files (and an editor key); midnight maintenance.
6. **Operations.** A config file (ports, limits), logging, admin kick and
   ban, deployment notes (systemd; TLS for the web through a reverse proxy).

## Status

- **Phase 0: done.** `autosave`, `Game.showingMap`, `escapeMarkup`.
- **Phase 1: done.** `bun run server` (see the README). Notes:
  - Output is UTF-8 only (open question 1, decided).
  - The server listens on 127.0.0.1 unless given `--host`.
  - Bun 1.3's `server.stop()` promise never settles once a web socket has
    connected (it does stop listening), so shutdown doesn't wait on it.
  - An account's name is its player's name; a new game doesn't ask again.
  - Every account has an email address, confirmed with a 6-digit code
    before it can play (accounts from before this are asked for one when
    they log in). A confirmed address belongs to one account (unconfirmed
    ones can be shared, so no one can hold an address they don't own; the
    first to confirm it gets it). "Forgot password" on the login menu
    emails a reset code. "Change email" on the in-game menu asks for the
    password, then a code sent to the new address, and tells the old one.
    Codes work for 15 minutes and 5 guesses and are stored hashed; another
    can be sent after a minute, and one connection can send 5 emails.
    Mail goes through SMTP (nodemailer), or into the log without
    `--smtp-host`.
  - The database's layout is a list of steps in [fq2ts-server's migrations.ts](https://github.com/ellisgl/fq2ts-server/blob/main/src/migrations.ts);
    opening a database runs the steps it hasn't had (SQLite's
    `user_version` counts them), each in a transaction, and a database
    from a newer server is refused. To change the layout, add a step.
  - SSH (ssh2) on port 2222: any user name, no password, then the same
    login screen. Only a shell: no commands, forwarding or file transfer.
    The host key (ed25519) is made on first start. A client gets 30
    seconds to ask for a terminal. (SSH has since been taken out: the
    server is played only in the browser.)

- **Phase 2: done.** Other players are drawn on the map (☻; you're ☺),
  arrivals in and departures from the realm are announced, and P lists
  who's in the realm and where, L every player by experience.
  - The server's `Realm` keeps who's where. A game is told about
    changes (`othersChanged`, `notify`) and only redraws when it's next
    waiting for a key on the map, never in the middle of a script; the
    terminal's `wake()` ends that wait early.
  - The game reports the player's place (`moved`), draws what the server
    gives it (`figures`), and takes the server's keys (`keys`, listed by ?).
  - The cheat words are off on the server (`cheats: false`): QUAKE opened
    the settings editor, which no one should have on a shared world.
  - ssh2 makes a host key it can't read about one time in 250; new keys
    are checked and made again.
  - Server tests keep a model of each client's screen (the server sends
    only what changed), and look for text on that.
- **Phase 3: done.** T says something to the players on your screen, Y
  yells it to everyone, W reads and writes letters (to anyone, online or
  not; you're told of new ones as you arrive), D is the news of today and
  yesterday (who's come to the realm, who was beaten by what). What's said
  goes in the back-buffer (B) with the other messages.
  - Players can speak once a second, a visit can send 10 letters, a
    mailbox keeps 50 and the news 7 days, so none of it grows without end.
  - What players type is escaped, so it can't colour anyone's screen.
  - The engine's `g.askLine` asks on the status bar (the map stays), and
    `g.ask` is `g.input` that Escape cancels. A message with more waiting
    behind it shows for 1.5 seconds instead of 4.

- **Phase 4: done.** The world's state: content declares it beside the
  flags (`Content<Flags, World>`, `world: {...}`), and scripts use it as
  `g.world`, typed. On the server everyone shares one world, kept in the
  database (step 5); a change redraws everyone. In single-player it's
  saved with the game. Values are like flags, or lists of strings.
  `g.news(text)` puts a line in the daily news. Mods get `mod.world`.
  - Final Quest 2: anyone can buy the castle, and the world keeps the list
    of everyone who has (`castleOwners`); the guard names them. The barn
    gold and the minigun stay each player's own.

- **Phase 5: done.** H fights a player next to you on the map: you fight
  their stats (strength and weapon to hit, defence and armour to take
  blows, their hitpoints now), and they're told at once and of the end.
  The loser gives the winner half their gold and is left on 1 hitpoint;
  the winner gets a tenth of the loser's experience, and the news has it.
  - Not on safe screens: interiors, and screens marked `"safe": true` in
    their map files (P in the editor's overview). Not against a player on
    1 hitpoint, nor one in a scene of their own, and 3 fights a day.
  - At midnight (server time) a new day dawns: the news says so, and
    each player's fights and the content's daily flags (`Content.daily`;
    FQ2's one drink a day) start again: at once for those in the realm,
    as they arrive for the rest. The server keeps its day in the database
    (step 6), so a day that turned while it was down is noticed.
  - The engine's fights take `defeat` and `victory` options (what losing
    does, and winning says).

- **Phase 6: done.** Running it for real: [deploying.md](deploying.md)
  (systemd, HTTPS through Caddy or nginx, the firewall, backups,
  upgrades).
  - Admins (marked with `bun run admin admin NAME`) get `!` in the game:
    kick a player (they're told why), ban or unban an account, tell
    everyone something. `bun run admin` lists accounts, bans and unbans
    from the command line. A banned player is told why at the door.
    Kicks and bans are logged. (Database step 7.)
  - `--web-host` (`FQ2_WEB_HOST`) let the web page listen only to the
    proxy while SSH listened to everyone. (Gone with SSH: `--host` is
    where the web page listens.)
  - The config file is `.env`; the log is the server's output (the
    journal, under systemd).

- **Since:** FQ2's towns are safe from fights between players. Game rules
  a server can change (`server/rules.ts`: fights a day, what's won, chat,
  letters, news, emails), each a command line option and `.env` setting.
  Bans on addresses (`!`, and `bun run admin ban-address`), with each
  account's last address kept (database step 8), and `FQ2_TRUST_PROXY`
  for web players' real addresses behind a proxy. A guard
  (`server/guard.ts`) limits connections an address can make a minute,
  and stops logins from an address, or to an account, after too many
  wrong passwords across connections.

- **And:** L reads the rankings kept beside the saves (step 9), not
  every save. G and A give and accept gold or items between players
  (nothing moves until it's accepted, and only if the giver still has
  it). K is the bounty board, in town (step 10): gold on a player's head,
  paid up front, collected by whoever beats them in a fight. In Final
  Quest 2, the Wyrm's hitpoints are the world's, so everyone wears it
  down together (once a day each; the last blow is rewarded; it returns
  stronger three days later), and the hall of heroes keeps the realm's
  lasting deeds (the Wyrm's slayers, the first to buy the castle).

- **Clean mode** (LORD II's swear patrol): swear words are starred out
  of what players say, yell and write, and new players can't be called
  one ([fq2ts-server's clean.ts](https://github.com/ellisgl/fq2ts-server/blob/main/src/clean.ts)). Whole words, unless the entry
  goes on with a *; numbers standing for letters ("sh1t") count. On by
  default; `--bad-words FILE` gives a server's own list, `--no-clean`
  turns it off.
- **S** names the others on your screen (in the status bar, or a list if
  there are too many), as in LORD II. LORD II's B (the messages you
  missed) was there already: the engine's back-buffer keeps the last
  100, from other players too.
- **Players who leave stay in the world** (as in LORD II): where they
  were, sleeping (a dimmer ☻; S says "(sleeping)"), for 7 days after
  their last visit (`--away-days`). H finds them too, even on safe
  screens: the fight is against their save, which is changed and saved
  (it doesn't count as them playing), and they're sent a letter from
  whoever it was saying how it went. A player on 1 hitpoint can't be
  fought, so a beaten player isn't beaten again. Inns (screens marked
  `"inn": true` in their map files, I in the editor's overview) are the
  only safe places to leave, with homes (`"home": true`, H in the
  editor's overview), where leaving the realm, however it's left, is
  sleeping safely in one's own bed, for nothing: in FQ2, your house in
  Stone Valley. FQ2's inns: the
  hotel in Hill Valley, the bar in Port City, and the Red Dragon Inn (a
  room through the inn's door in the walled town north of Port City,
  screen 406; screens 1121-1125 are unused copies of that town). Z there
  takes a room
  (`--inn-cost`, $20), saves and closes the connection, and the player
  is off the map until they're back. Each save keeps where it is and
  whether its player is asleep at an inn (database step 11).
  Leaving the realm from the Escape menu anywhere else warns the player
  first ("You'll sleep here, where anyone can attack you..."), with
  "Return to the game" picked (and Escape for it) and "Leave anyway"
  below. (Closing the browser leaves without a warning.)
- **Jobs** (the engine's, LORD II's deliveries: see the README) are in
  L: each player's jobs done is kept beside their save (database step
  12), and L has a Jobs column for a game whose flags have the engine's
  `jobsDone`.

- **Bounty hunters** come after players with a price on their head: 1
  step in 40 onto wild ground (`--hunter-odds`), away from safe screens,
  whether random monsters are on or not (the engine's `ambush`). A hunter
  is made from the player's own stats, give or take; one who wins
  collects the bounty (it comes off the board), one who's beaten leaves
  it. The news has both.

- **Good and evil**: each save keeps its player's alignment beside it
  (database step 14), and L has an Align column for a game that uses it
  (its start player has `alignment`). Attacking a sleeping player costs
  1. The engine's `g.nearby()` is the players next to this one, from the
  server (none alone), each with `wound(amount, why)`: FQ2's Wyrmsworn
  curse them with it.

## Testing

- Realm logic: several `FakeTerminal` sessions in one test.
- One integration test that starts the server on a random port and
  connects with WebSockets.

## Open questions

1. ~~**Character set.**~~ Decided: UTF-8 only. The game uses
   Unicode throughout (any character one column wide), not CP437, so
   CP437-only BBS clients aren't supported.
2. ~~**Which flags become world-wide.**~~ Decided: everyone can buy the
   castle, and the world keeps the list of who has. The barn gold and the
   minigun stay each player's.
3. ~~**PvP rules.**~~ Decided: the loser gives half their gold to the
   winner and is left on 1 hitpoint; only players next to you can be
   attacked. Players who've left stay where they were, sleeping, and can
   be attacked there unless they took a room at an inn (as LORD II, where
   only inns were safe for players who'd left).
4. ~~**Telnet sends passwords in the clear.**~~ Decided: the web client
   over TLS only. (SSH was there too for a while, and has been taken out.)
   Before that: SSH (any user
   name, no password, then the game's login screen) for secure terminal
   play, and the web client over TLS. Telnet was there at first (for LANs
   and BBSes), and has since been taken out: it sent passwords in the
   clear. No telnet over TLS: few clients support it.
