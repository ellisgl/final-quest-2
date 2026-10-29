// The mods in the repository's mods/ folder, on Final Quest 2: they all
// load and fit (enabled or not), and the example plays.

import { afterEach, expect, spyOn, test, type Mock } from 'bun:test';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { applyMods, loadMod, type ModdableGame } from '@fq2ts/engine/mods';
import { makeGameWith } from '@fq2ts/engine/fixture';
import content from '../content/index.ts';
import type { Flags, Shared } from '../content/start.ts';
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

// FQ2 with the wishing well, and a player just north of it with some gold.
async function wishingWell(wishes: number) {
    const modded = applyMods(fq2(), [await loadMod(join(MODS, 'wishing-well'))]);
    const player = { ...newPlayer({ screen: 82, x: 9, y: 8, gold: 5, hp: 100 }), flags: { ...modded.content.start.flags, 'wishing-well.wishes': wishes } };
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
