// The mods in the repository's mods/ folder, on Final Quest 2: they all
// load and fit (enabled or not), and the example plays.

import { afterEach, expect, spyOn, test, type Mock } from 'bun:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { applyMods, loadMod, loadMods, type ModdableGame } from '@fq2ts/engine/mods';
import { makeGameWith } from '@fq2ts/engine/fixture';
import content from '../content/index.ts';
import type { Flags, Shared } from '../content/start.ts';
import { BUILT_IN_MODS } from '../built-in-mods.ts';
import { LIST, builtInModsSource, modFolders } from '../tools/mods.ts';
import { bestiary, config, gameWorld, itemCatalogue, newPlayer, pick, screenText } from './helpers.ts';

const MODS = join(import.meta.dir, '..', 'mods');
const fq2 = (): ModdableGame<Flags, Shared> => ({ content, world: gameWorld(), items: itemCatalogue, monsters: bestiary });

let random: Mock<() => number> | null = null;
afterEach(() => {
    random?.mockRestore();
    random = null;
});

test('every mod in mods/ loads and fits the game', async () => {
    const folders = readdirSync(MODS, { withFileTypes: true }).filter((entry) => entry.isDirectory());
    expect(folders.length).toBeGreaterThan(0);
    for (const folder of folders) {
        applyMods(fq2(), [await loadMod(join(MODS, folder.name))]);
    }
});

test('built-in-mods.ts lists every mod in mods/ (else: bun run mods:list)', () => {
    expect(readFileSync(LIST, 'utf8')).toBe(builtInModsSource(MODS));
});

test('the built-in mods are their folders\' mod.ts, and load as a compiled game loads them', async () => {
    const names = modFolders(MODS);
    for (const name of names) {
        const load = BUILT_IN_MODS[name];
        expect(load).toBeFunction();
        expect(await load?.()).toBe(await import(join(MODS, name, 'mod.ts')));
    }
    const mods = await loadMods(MODS, names, undefined, { builtIn: BUILT_IN_MODS, builtInOnly: true });
    expect(mods.map((m) => m.dir).sort()).toEqual(names.map((name) => join(MODS, name)));
});

// FQ2 with the wishing well, and a player just north of it with some gold.
async function wishingWell(wishes: number) {
    const modded = applyMods(fq2(), [await loadMod(join(MODS, 'wishing-well'))]);
    const player = { ...newPlayer({ screen: 82, x: 10, y: 9, gold: 5, hp: 100 }), flags: { ...modded.content.start.flags, 'wishing-well.wishes': wishes } };
    return makeGameWith(modded.content, { ...modded, config, player });
}

const RESUME = pick(4);
const LEAVE = ['escape', 'escape'];

test('the wishing well takes a coin for a wish', async () => {
    const { game, term } = await wishingWell(0);
    // random(3) comes up 1: the wish refreshes the player.
    random = spyOn(Math, 'random').mockReturnValue(0);
    term.feed(...RESUME, 'down', () => {
        expect(screenText(term.screen)).toContain('An old stone well.');
        return 'enter';
    }, () => {
        expect(screenText(term.screen)).toContain('You feel refreshed.');
        return 'x';
    }, ...LEAVE);
    await game.run();
    expect(term.remaining).toBe(0);
    expect(game.playing).toMatchObject({ gold: 4, hp: game.playing.maxHp, flags: { 'wishing-well.wishes': 1 } });
});

test('every tenth wish brings up a lucky coin', async () => {
    const { game, term } = await wishingWell(9);
    term.feed(...RESUME, 'down', 'enter', () => {
        expect(screenText(term.screen)).toContain('a lucky coin!');
        return 'x';
    }, ...LEAVE);
    await game.run();
    expect(game.playing.items).toMatchObject({ 'lucky-coin': 1 });
});
