#!/usr/bin/env bun
// Final Quest 2 -- run with:  bun fq2.ts [--debug] [--mods DIR] [--enable-mods LIST]
// or: bun start / bun run debug
//
// The mods in LIST (or FQ2_ENABLE_MODS, in .env), folders' names with
// commas between, come from DIR, or the mods folder where the game is
// started (see @fq2ts/engine/mods). None are added unless they're listed.

import { join, resolve } from 'node:path';
import { Terminal } from '@fq2ts/engine/terminal';
import { Saves } from '@fq2ts/engine/saves';
import { Game } from '@fq2ts/engine/game';
import { readGameData } from '@fq2ts/engine/data';
import { applyMods, loadMods, readModList } from '@fq2ts/engine/mods';
import { mapSize } from '@fq2ts/engine/world';

const args = process.argv.slice(2);
const debug = args.includes('--debug') || args.some((a) => a.toLowerCase() === '-debugmode');
const modsAt = args.indexOf('--mods');
const modsDir = resolve(modsAt >= 0 ? (args[modsAt + 1] ?? 'mods') : 'mods');
const enableAt = args.indexOf('--enable-mods');
const enabledMods = enableAt >= 0 ? args[enableAt + 1] : process.env['FQ2_ENABLE_MODS'];
const root = import.meta.dir;

// Load (and check) all the content, data and mods before taking over the
// terminal, so that errors (a wrong .env setting, say) are readable.
let game;
try {
    const { default: content } = await import('./content/index.ts');
    const { config, ...data } = readGameData(join(root, 'data'));
    game = new Game({
        // (The screen is the size config.json says: 80x25.)
        term: new Terminal({ name: 'Final Quest 2', size: config.screen }),
        config,
        ...applyMods({ content, ...data }, await loadMods(modsDir, readModList(enabledMods, '--enable-mods (or FQ2_ENABLE_MODS)'), mapSize(config.screen))),
        saves: new Saves(join(root, 'saves')),
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
