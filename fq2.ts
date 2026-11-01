#!/usr/bin/env bun
// Final Quest 2 -- run with:  bun fq2.ts [--debug] [--mods DIR] [--enable-mods LIST]
//                                         [--saves DIR] [--player NAME]
// or: bun start / bun run debug
//
// --saves DIR keeps the save slots in DIR instead of the game's saves
// folder, and --player NAME starts new games as NAME without asking: as a
// BBS door, say, each caller gets their own slots and plays as themselves.
//
// The mods in LIST (or FQ2_ENABLE_MODS, in .env), folders' names with
// commas between, come from DIR, or the mods folder where the game is
// started (see @fq2ts/engine/mods). None are added unless they're listed.
// Compiled with Perry, the game has the code of the mods in mods/ built in
// (built-in-mods.ts: bun run mods:list), and only those can be listed.

import { join, resolve } from 'node:path';
import { Terminal } from '@fq2ts/engine/terminal';
import { Saves } from '@fq2ts/engine/saves';
import { Game } from '@fq2ts/engine/game';
import { readGameData } from '@fq2ts/engine/data';
import { applyMods, loadMods, readModList } from '@fq2ts/engine/mods';
import { mapSize } from '@fq2ts/engine/world';
import { NAME_LENGTH } from './content/story.ts';
import { ROOT } from './content/root.ts';
import { BUILT_IN_MODS } from './built-in-mods.ts';

const args = process.argv.slice(2);
const debug = args.includes('--debug') || args.some((a) => a.toLowerCase() === '-debugmode');
const modsAt = args.indexOf('--mods');
// A compiled game has its mods' code built in (built-in-mods.ts), and looks
// for their folders next to the binary, like data/.
const compiled = process.versions['perry'] !== undefined;
const modsDir = modsAt >= 0 ? resolve(args[modsAt + 1] ?? 'mods') : compiled ? join(ROOT, 'mods') : resolve('mods');
const enableAt = args.indexOf('--enable-mods');
const enabledMods = enableAt >= 0 ? args[enableAt + 1] : process.env['FQ2_ENABLE_MODS'];
const savesAt = args.indexOf('--saves');
const playerAt = args.indexOf('--player');
const player = playerAt >= 0 ? (args[playerAt + 1] ?? '').trim().slice(0, NAME_LENGTH) : '';
const savesDir = savesAt >= 0 ? resolve(args[savesAt + 1] ?? 'saves') : join(ROOT, 'saves');

// Load (and check) all the content, data and mods before taking over the
// terminal, so that errors (a wrong .env setting, say) are readable.
let game;
try {
    const { default: fq2 } = await import('./content/index.ts');
    // A new game's player already has a name, so the story doesn't ask.
    const content = player ? { ...fq2, start: { ...fq2.start, name: player } } : fq2;
    const { config, ...data } = readGameData(join(ROOT, 'data'));
    game = new Game({
        // (The screen is the size config.json says: 80x25.)
        term: new Terminal({ name: 'Final Quest 2', size: config.screen }),
        config,
        ...applyMods({ content, ...data }, await loadMods(modsDir, readModList(enabledMods, '--enable-mods (or FQ2_ENABLE_MODS)'), mapSize(config.screen), compiled ? { builtIn: BUILT_IN_MODS, builtInOnly: true } : {})),
        saves: new Saves(savesDir),
        debug,
    });
} catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
}

const { term } = game;
term.onInterrupt = () => {
    term.stop();
    process.exit(130);
};

try {
    term.start();
} catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
}

try {
    await game.run();
    term.stop();
    process.exit(0);
} catch (err) {
    term.stop();
    console.error(err);
    process.exit(1);
}
