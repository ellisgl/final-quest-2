import { afterEach, describe, expect, spyOn, test, type Mock } from 'bun:test';
import { ARENA_NEWS_RUN, ARENA_STAKE, arena, gladiator } from '../../content/scripts/arena.ts';
import { today } from '../../content/scripts/realm.ts';
import type { FightResult } from '@fq2ts/engine/combat';
import { newPlayer, pick, screenText, scriptContext, trigger, type Step } from '../helpers.ts';

const RULES = pick(0);
const FIGHT = pick(1);
const LEAVE = pick(2);

let random: Mock<() => number> | null = null;
afterEach(() => {
    random?.mockRestore();
    random = null;
});

// The arena with its fights decided in advance, one result each, and the news.
function setUp(steps: readonly Step[], results: readonly FightResult[], { gold = 200, flags = {} } = {}) {
    const news: string[] = [];
    const context = scriptContext({ player: newPlayer({ gold, hp: 200 }, flags), steps, news: (text) => news.push(text) });
    const { g, game } = context;
    const left = [...results];
    const fight = spyOn(g, 'fight').mockImplementation((monster, options) => {
        const result = left.shift() ?? 'fled';
        if (result === 'won') {
            g.gold += monster.gold;
        } else if (result === 'lost') {
            options?.defeat?.(game.playing);
        }
        return Promise.resolve(result);
    });
    return { ...context, news, fight };
}

describe('the arena', () => {
    test('is by the castle: the door on the Castle Gates', () => {
        expect(() => trigger(243, 19, 9)).not.toThrow();
    });

    test("a gladiator is the player's own stats, give or take", () => {
        const { g } = scriptContext({ player: newPlayer({ strength: 20, defense: 10, maxHp: 300 }) });
        random = spyOn(Math, 'random').mockReturnValue(0);
        expect(gladiator(g)).toMatchObject({ name: 'Brutus', pronoun: 'he', hp: 270, defense: 8, gold: ARENA_STAKE * 2, attacks: [{ power: 14 }] });
        random.mockReturnValue(0.9999);
        expect(gladiator(g)).toMatchObject({ name: 'Vex the Quick', pronoun: 'she', hp: 330, defense: 12, attacks: [{ power: 26 }] });
    });

    test('the rules, then leaving', async () => {
        const { g, term, fight } = setUp([
            ...RULES,
            () => {
                expect(screenText(term.screen)).toContain(`You pay $${ARENA_STAKE} and fight one of my gladiators.`);
                return 'x';
            },
            ...LEAVE,
        ], []);
        await arena(g);
        expect(term.remaining).toBe(0);
        expect(fight).not.toHaveBeenCalled();
    });

    test('winning pays double, and you can go again; losing leaves you beaten, and out until tomorrow', async () => {
        const { g, term, fight } = setUp([...FIGHT, ...FIGHT], ['won', 'lost']);
        await arena(g);
        expect(term.remaining).toBe(0);
        expect(fight).toHaveBeenCalledTimes(2);
        // (Paid twice, and paid double once.)
        expect(g.gold).toBe(200 - 2 * ARENA_STAKE + 2 * ARENA_STAKE);
        expect(g.hp).toBe(5);
        expect(g.flags.arenaLostDay).toBe(today());
    });

    test('running away is losing too, to the crowd', async () => {
        const { g, term } = setUp([
            ...FIGHT,
            () => {
                expect(screenText(term.screen)).toContain('Coward! Coward!');
                return 'x';
            },
        ], ['fled']);
        await arena(g);
        expect(term.remaining).toBe(0);
        expect(g.flags.arenaLostDay).toBe(today());
    });

    test(`${ARENA_NEWS_RUN} wins in a row make the news`, async () => {
        const { g, news } = setUp([...FIGHT, ...FIGHT, ...FIGHT, ...LEAVE], ['won', 'won', 'won']);
        g.name = 'Hero';
        await arena(g);
        expect(news).toEqual([`{yellow}Hero won ${ARENA_NEWS_RUN} fights in a row at the arena.`]);
    });

    test('not after losing today, and not without the money', async () => {
        const beaten = setUp([...FIGHT, 'x', ...LEAVE], [], { flags: { arenaLostDay: today() } });
        await arena(beaten.g);
        expect(beaten.term.remaining).toBe(0);
        expect(beaten.fight).not.toHaveBeenCalled();

        const poor = setUp([...FIGHT, () => {
            expect(screenText(poor.term.screen)).toContain(`No $${ARENA_STAKE}?`);
            return 'x';
        }, ...LEAVE], [], { gold: ARENA_STAKE - 1 });
        await arena(poor.g);
        expect(poor.term.remaining).toBe(0);
        expect([poor.g.gold, poor.fight.mock.calls.length]).toEqual([ARENA_STAKE - 1, 0]);
    });
});
