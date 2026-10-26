#!/usr/bin/env bun
// Final Quest 2 -- run with:  bun fq2.ts [--debug] [--mods DIR]
// or: bun start / bun run debug
//
// Mods come from DIR, or the mods folder where the game is started, if
// there is one (see @fq2ts/engine/mods).

import { join, resolve } from 'node:path';
import { Terminal } from '@fq2ts/engine/terminal';
import { Saves } from '@fq2ts/engine/saves';
import { Game } from '@fq2ts/engine/game';
import { readGameData } from '@fq2ts/engine/data';
import { applyMods, loadMods } from '@fq2ts/engine/mods';

const args = process.argv.slice(2);
const debug = args.includes('--debug') || args.some((a) => a.toLowerCase() === '-debugmode');
const modsAt = args.indexOf('--mods');
const modsDir = resolve(modsAt >= 0 ? (args[modsAt + 1] ?? 'mods') : 'mods');
const root = import.meta.dir;

// Load (and check) all the content, data and mods before taking over the
// terminal, so that errors (a wrong .env setting, say) are readable.
let game;
try {
    const { default: content } = await import('./content/index.ts');
    const { config, ...data } = readGameData(join(root, 'data'));
    game = new Game({
        term: new Terminal({ name: 'Final Quest 2' }),
        config,
        ...applyMods({ content, ...data }, await loadMods(modsDir)),
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
