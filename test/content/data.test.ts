// Checks that the game's content fits its world: every screen and trigger
// exists, and every script sends the player somewhere real.

import { describe, expect, test } from 'bun:test';
import content from '../../content/index.ts';
import { start, type Flags } from '../../content/start.ts';
import { MAP_HEIGHT, MAP_WIDTH } from '@fq2ts/engine/world';
import { ScriptContext } from '@fq2ts/engine/script';
import { gameWorld, makeGame, newPlayer, placedScreens } from '../helpers.ts';

const world = gameWorld();

const placed = placedScreens();
const screens = Object.entries(placed).map(([n, s]) => ({ n: Number(n), at: Object.entries(s?.at ?? {}), show: s?.show }));

test('the player starts somewhere real', () => {
    expect(world.has(start.screen)).toBe(true);
    expect(world.isSolid(start.screen, start.x, start.y)).toBe(false);
    expect(world.isOutdoors(start.mapScreen)).toBe(true);
});

test.each(screens.map((s) => [s.n]))('screen %i exists', (n) => {
    expect(world.has(n)).toBe(true);
});

test.each(screens.flatMap((s) => s.at.map(([xy]) => [s.n, xy])))('screen %i: trigger %s is on the map', (_, xy) => {
    const [x = 0, y = 0] = xy.split(',').map(Number);
    expect(x).toBeGreaterThanOrEqual(1);
    expect(x).toBeLessThanOrEqual(MAP_WIDTH);
    expect(y).toBeGreaterThanOrEqual(1);
    expect(y).toBeLessThanOrEqual(MAP_HEIGHT);
});

// Two players: a new game, and a player who has done everything.
const flagSets: [string, Partial<Flags>, Record<string, number>][] = [
    ['a new game', {}, {}],
    [
        'a seasoned player',
        {
            toiletUsed: true,
            goldNearBarn: false,
            womanOffersCocoa: false,
            hasBankAccount: true,
            bankGold: 100,
            hotelScene: 2,
            ownsCastle: true,
            castleExitX: 42,
            oldManSeen: true,
            hadDrink: true,
            foundMinigun: true,
        },
        { wildberries: 25, 'port-city-pass': 1, stick: 1, vest: 1 },
    ],
];

describe.each(flagSets)('with the flags of %s', (_, flags, items) => {
    // Every trigger, answering every question with Escape.
    test.each(screens.flatMap((s) => s.at.map(([xy]) => [s.n, xy])))('screen %i, %s leads somewhere real', async (n, xy) => {
        const [x = 1, y = 1] = xy.split(',').map(Number);
        const { game } = makeGame({ player: newPlayer({ screen: n, x, y, items }, flags), fallback: 'escape' });
        const g = new ScriptContext(game);
        const script = placed[n]?.at?.[`${x},${y}`];
        expect(script).toBeDefined();
        await script?.(g);
        const p = game.playing;
        expect(world.has(p.screen)).toBe(true);
        if (g.destination) {
            const { screen, x: dx, y: dy } = g.destination;
            expect(world.has(screen)).toBe(true);
            expect(dx >= 1 && dx <= MAP_WIDTH && dy >= 1 && dy <= MAP_HEIGHT).toBe(true);
            expect(world.isSolid(screen, dx, dy)).toBe(false);
        }
        expect(p.x >= 1 && p.x <= MAP_WIDTH && p.y >= 1 && p.y <= MAP_HEIGHT).toBe(true);
    });

    test.each(screens.filter((s) => s.show).map((s) => [s.n]))("screen %i's show script runs", async (n) => {
        const { game } = makeGame({ player: newPlayer({ screen: n, x: 40, y: 15, items }, flags), fallback: 'escape' });
        await content.screens[n]?.show?.(new ScriptContext(game));
        expect(game.playing.screen).toBe(n);
    });
});
