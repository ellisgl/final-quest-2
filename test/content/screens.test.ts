// The one-off triggers written directly in content/screens/.

import { describe, expect, test } from 'bun:test';
import content from '../../content/index.ts';
import { newPlayer, row, scriptContext, trigger } from '../helpers.ts';

const show = (screen: number) => {
    const script = content.screens[screen]?.show;
    if (!script) {
        throw new Error(`Screen ${screen} has no show script.`);
    }
    return script;
};

describe('signs and simple messages', () => {
    test('a sign', async () => {
        const { g, term } = scriptContext({ player: newPlayer({ screen: 81 }) });
        await trigger(81, 26, 11)(g);
        expect(row(term.screen, 23)).toContain('The Sign Reads:  ↑-- Stone Valley   ↓-- Hill Valley');
    });

    test('tiles that share a message', async () => {
        for (const x of [45, 46]) {
            const { g, term } = scriptContext({ player: newPlayer({ screen: 2 }) });
            await trigger(2, x, 8)(g);
            expect(row(term.screen, 23)).toContain('A warm and cozy barn...');
        }
    });

    test('a door', async () => {
        const { g } = scriptContext({ player: newPlayer({ screen: 721 }) });
        await trigger(721, 41, 19)(g);
        expect(g.destination).toEqual({ screen: 82, x: 11, y: 18 });
    });
});

describe('north of Stone Valley', () => {
    test("gold lies near the barn until it's picked up", async () => {
        const { g, term } = scriptContext({ player: newPlayer({ screen: 2, x: 30, y: 10 }) });
        await show(2)(g);
        expect(term.screen.cell(40, 19)).toMatchObject({ ch: 'o', fg: 14 });
        await trigger(2, 40, 19)(g);
        expect(g.gold).toBe(75);
        expect(g.flags.goldNearBarn).toBe(false);
        await trigger(2, 40, 19)(g);
        expect(g.gold).toBe(75);

        const after = scriptContext({ player: newPlayer({ screen: 2, x: 30, y: 10 }, { goldNearBarn: false }) });
        await show(2)(after.g);
        expect(after.term.screen.cell(40, 19).ch).toBe(' ');
    });
});

describe('Stone Valley', () => {
    test('the warp to Port City', async () => {
        const { g } = scriptContext({ player: newPlayer({ screen: 82 }) });
        await trigger(82, 29, 17)(g);
        expect(g.destination).toEqual({ screen: 486, x: 4, y: 13 });
    });

    test('the local warp and back', async () => {
        const { g } = scriptContext({ player: newPlayer({ screen: 82, x: 47, y: 21 }) });
        await trigger(82, 47, 22)(g);
        expect([g.x, g.y]).toEqual([79, 22]);
        await trigger(82, 78, 22)(g);
        expect([g.x, g.y]).toEqual([47, 21]);
    });

    test("Port City's warp back", async () => {
        const { g } = scriptContext({ player: newPlayer({ screen: 486 }) });
        await trigger(486, 3, 13)(g);
        expect(g.destination).toEqual({ screen: 82, x: 28, y: 17 });
    });
});

describe('your house', () => {
    test('the toilet', async () => {
        const { g, game, term } = scriptContext();
        await trigger(721, 28, 8)(g);
        expect(row(term.screen, 23)).toContain('Ahh.. Much better!');
        game.newTurn();
        await trigger(721, 28, 8)(g);
        expect(row(term.screen, 23)).toContain('Yuck!');
    });
});

describe('the house with the minigun', () => {
    test('finding it, once, and using it at once', async () => {
        const { g, game, term } = scriptContext({ player: newPlayer({ screen: 725, items: { stick: 1 }, weapon: 'stick' }) });
        await trigger(725, 33, 13)(g);
        expect(g.count('minigun')).toBe(1);
        expect(g.weapon?.id).toBe('minigun');
        expect(g.count('stick')).toBe(1);
        expect(row(term.screen, 23)).toContain('You find a Minigun on the table, and arm yourself with it!');
        game.newTurn();
        await trigger(725, 33, 13)(g);
        expect(g.count('minigun')).toBe(1);
        expect(row(term.screen, 23)).toContain('An empty table.');
    });
});

describe('the ghost town', () => {
    test('the old man runs, then just watches', async () => {
        const { g, game, term } = scriptContext({ player: newPlayer({ screen: 242 }) });
        await trigger(242, 62, 6)(g);
        expect(row(term.screen, 23)).toContain('When he sees you he runs into his house.');
        game.newTurn();
        await trigger(242, 62, 6)(g);
        expect(row(term.screen, 23)).toContain('The man peers at you through the window.');
    });
});

describe('the warps west of the Moorish village', () => {
    test('there and back', async () => {
        const { g } = scriptContext({ player: newPlayer({ screen: 321, x: 60, y: 16 }) });
        await trigger(321, 60, 17)(g);
        expect([g.x, g.y]).toEqual([75, 12]);
        await trigger(321, 74, 12)(g);
        expect([g.x, g.y]).toEqual([61, 17]);
    });
});

describe("the boat to the dragon's island", () => {
    test('out and back', async () => {
        const out = scriptContext({ player: newPlayer({ screen: 166 }), steps: ['x'] });
        await trigger(166, 46, 5)(out.g);
        expect(out.g.destination).toEqual({ screen: 86, x: 42, y: 18 });
        const back = scriptContext({ player: newPlayer({ screen: 86 }), steps: ['x'] });
        await trigger(86, 43, 19)(back.g);
        expect(back.g.destination).toEqual({ screen: 166, x: 46, y: 6 });
    });
});

describe('the castle doors', () => {
    test('remember which door you left by', async () => {
        for (const x of [41, 42]) {
            const { g } = scriptContext({ player: newPlayer({ screen: 726 }) });
            await trigger(726, x, 22)(g);
            expect(g.flags.castleExitX).toBe(x);
            expect(g.destination).toEqual({ screen: 243, x: 36, y: 17 });
        }
    });
});

describe('the Moorish hut', () => {
    test('says something and goes in', async () => {
        const { g, term } = scriptContext({ player: newPlayer({ screen: 322 }) });
        await trigger(322, 42, 12)(g);
        expect(row(term.screen, 23)).toContain('An old deserted hut.');
        expect(g.destination).toEqual({ screen: 805, x: 40, y: 15 });
    });
});

describe('the hotel scenes', () => {
    test('the guard scene plays the first time inside the hotel', async () => {
        const { g } = scriptContext({ player: newPlayer({ screen: 724, x: 41, y: 17 }) });
        await show(724)(g);
        expect(g.flags.hotelScene).toBe(1);
        expect([g.x, g.y]).toEqual([41, 15]);
        await show(724)(g);
        expect(g.flags.hotelScene).toBe(1);
    });

    test('then the man runs off outside, once', async () => {
        const { g, term } = scriptContext({ player: newPlayer({ screen: 163, x: 32, y: 18 }, { hotelScene: 1 }) });
        await show(163)(g);
        expect(g.flags.hotelScene).toBe(2);
        expect(row(term.screen, 23)).toContain('The man is running!!!!');
        await show(163)(g);
        expect(g.flags.hotelScene).toBe(2);
    });

    test('the sign on the table', async () => {
        const { g, term } = scriptContext({ player: newPlayer({ screen: 724 }), steps: ['x'] });
        await trigger(724, 45, 14)(g);
        expect(row(term.screen, 9)).toContain('*** ATTENTION ***');
    });
});
