import { afterEach, describe, expect, spyOn, test, type Mock } from 'bun:test';
import { MemoryWorld } from '@fq2ts/engine/shared';
import type { NearbyPlayer } from '@fq2ts/engine/game';
import { EVIL, UNWELCOME, WANTED, alignmentText, cleaner, cow, deed, richNightstand } from '../../content/scripts/deeds.ts';
import { bar, cityGuards, oldWoman } from '../../content/scripts/places.ts';
import { healer } from '../../content/scripts/town.ts';
import { WYRMSLAYER, WYRMSWORN, wyrm, wyrmslayersGift } from '../../content/scripts/realm.ts';
import { newPlayer, pick, screenText, scriptContext } from '../helpers.ts';

const DAY = 86_400_000;
const NOON = new Date(2026, 9, 26, 12, 0).getTime();

const mocks: Mock<() => number>[] = [];
afterEach(() => {
    for (const mock of mocks.splice(0)) {
        mock.mockRestore();
    }
});

// The clock, `days` after noon on a day in the test.
function at(days: number): void {
    mocks.push(spyOn(Date, 'now').mockReturnValue(NOON + days * DAY));
}

describe('deeds', () => {
    test('each counts once a day, and moves alignment', () => {
        at(0);
        const { g } = scriptContext();
        expect(deed(g, 'tip', 1)).toBe(true);
        expect(deed(g, 'tip', 1)).toBe(false);
        expect(deed(g, 'kick', -1)).toBe(true);
        expect(g.alignment).toBe(0);
        at(1);
        expect(deed(g, 'tip', 1)).toBe(true);
        expect(g.alignment).toBe(1);
    });

    test('alignment in words', () => {
        expect(alignmentText(0)).toContain('0 {gray}(neither good nor evil)');
        expect(alignmentText(4)).toContain('+4 {gray}(good)');
        expect(alignmentText(9)).toContain('(a saint)');
        expect(alignmentText(-5)).toContain('-5 {gray}(evil)');
        expect(alignmentText(-10)).toContain('(wicked)');
    });

    test("the bar's cleaner: tip him, or laugh at him", async () => {
        at(0);
        const tip = scriptContext({ player: newPlayer({ gold: 20 }), steps: [...pick(0), 'x'] });
        await cleaner(tip.g);
        expect([tip.g.gold, tip.g.alignment]).toEqual([15, 1]);
        const broke = scriptContext({ player: newPlayer({ gold: 2 }), steps: [...pick(0), 'x'] });
        await cleaner(broke.g);
        expect([broke.g.gold, broke.g.alignment]).toEqual([2, 0]);
        const mock = scriptContext({ steps: [...pick(1), 'x'] });
        await cleaner(mock.g);
        expect(mock.g.alignment).toBe(-1);
    });

    test("the rich couple's purse: once a day", async () => {
        at(0);
        const { g, term } = scriptContext({ player: newPlayer({ gold: 0 }), steps: [...pick(0), 'x'] });
        await richNightstand(g);
        expect([g.gold, g.alignment]).toEqual([30, -1]);
        await richNightstand(g);
        expect(term.remaining).toBe(0);
        expect(g.gold).toBe(30);
    });

    test("the old woman's chores, or her cupboard", async () => {
        at(0);
        const help = scriptContext({ player: newPlayer({}, { womanOffersCocoa: false }), steps: [...pick(1), 'x'] });
        await oldWoman(help.g);
        expect(help.g.alignment).toBe(1);
        const rifle = scriptContext({ player: newPlayer({ gold: 0 }, { womanOffersCocoa: false }), steps: [...pick(2), 'x'] });
        await oldWoman(rifle.g);
        expect([rifle.g.gold, rifle.g.alignment]).toEqual([10, -1]);
    });

    test('the cow: berries to feed it (if you have some), or a kick', async () => {
        at(0);
        const feed = scriptContext({ player: newPlayer({ items: { wildberries: 2 } }), steps: [...pick(0), 'x'] });
        await cow(feed.g);
        expect([feed.g.count('wildberries'), feed.g.alignment]).toEqual([1, 1]);
        // (No berries: kicking is the first choice there is.)
        const kick = scriptContext({ steps: [...pick(0), 'x'] });
        await cow(kick.g);
        expect(kick.g.alignment).toBe(-1);
    });

});

describe('who treats the evil differently', () => {
    test(`the bartender won't serve his best at ${UNWELCOME}`, async () => {
        const { g, term } = scriptContext({ player: { ...newPlayer(), alignment: UNWELCOME }, steps: [...pick(0), () => {
            expect(screenText(term.screen)).toContain('Not for your kind.');
            return 'x';
        }, ...pick(3)] });
        await bar(g);
        expect(g.flags.hadDrink).toBe(false);
    });

    test(`the nurse charges double at ${EVIL}`, async () => {
        const { g, term } = scriptContext({ player: { ...newPlayer({ hp: 200, gold: 500 }), alignment: EVIL }, steps: [...pick(0), () => {
            expect(screenText(term.screen)).toContain('It costs $4 for every hitpoint healed.');
            return 'enter';
        }, 'x'] });
        await healer(g);
        expect(g.gold).toBe(500 - 50 * 4);
    });

    test(`Port City's guards turn them away at ${WANTED}, pass or no pass`, async () => {
        const { g } = scriptContext({ player: { ...newPlayer({ screen: 486, x: 3, y: 9, items: { 'port-city-pass': 1 } }), alignment: WANTED } });
        await cityGuards(g);
        expect([g.x, g.y]).toEqual([2, 9]);
    });
});

describe('the Wyrmsworn', () => {
    test(`at ${EVIL}, the evil can kneel to the Wyrm: the Wyrmsworn, in the hall`, async () => {
        at(0);
        const store = new MemoryWorld();
        const { g, term } = scriptContext({
            worldStore: store,
            player: { ...newPlayer({ name: 'Mal' }, { wyrmslayer: true }), alignment: EVIL, title: WYRMSLAYER },
            steps: [
                () => {
                    expect(screenText(term.screen)).toContain('Kneel before it');
                    return 'down';
                },
                'enter',
                'x',
            ],
        });
        await wyrm(g);
        expect([g.title, g.flags.wyrmsworn, g.flags.wyrmslayer]).toEqual([WYRMSWORN, true, false]);
        expect(String(store.get('heroes'))).toContain('Mal knelt before the Wyrm');

        const good = scriptContext({
            player: { ...newPlayer(), alignment: EVIL + 1 },
            steps: [
                () => {
                    expect(screenText(good.term.screen)).not.toContain('Kneel');
                    return 'escape';
                },
            ],
        });
        await wyrm(good.g);
    });

    test('U curses someone next to them, once a day; and there has to be someone', async () => {
        at(0);
        const wounds: [number, string][] = [];
        const bob: NearbyPlayer = { name: 'Bob', hp: 90, maxHp: 90, wound: (n, why) => wounds.push([n, why]) };
        const { g, term } = scriptContext({ player: newPlayer({ name: 'Mal' }, { wyrmsworn: true }), nearby: () => [bob], steps: ['enter', 'x'] });
        await wyrmslayersGift(g);
        expect(term.remaining).toBe(0);
        expect(wounds).toEqual([[30, "{lightred}Mal curses you in the Wyrm's name! You lose 30 hitpoints."]]);
        await wyrmslayersGift(g);
        expect(wounds).toHaveLength(1);

        const alone = scriptContext({ player: newPlayer({}, { wyrmsworn: true }) });
        const said = spyOn(alone.g, 'write');
        await wyrmslayersGift(alone.g);
        expect(said).toHaveBeenLastCalledWith('{gray}There is no one close enough to curse.');
    });
});
