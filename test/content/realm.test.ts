// The Wyrm, fought by everyone, and the hall of heroes.

import { afterEach, describe, expect, spyOn, test, type Mock } from 'bun:test';
import { MemoryWorld } from '@fq2ts/engine/shared';
import { WYRMSLAYER, WYRM_RETURNS_AFTER, daysBetween, fame, hallOfHeroes, isWyrmslayer, today, wyrm, wyrmMaxHp, wyrmslayersGift } from '../../content/scripts/realm.ts';
import { castle } from '../../content/scripts/places.ts';
import { makeGame, newPlayer, pick, screenText, scriptContext } from '../helpers.ts';

const DAY = 86_400_000;
const NOON = new Date(2026, 9, 26, 12, 0).getTime();
const mocks: { mockRestore(): void }[] = [];
afterEach(() => {
    for (const m of mocks.splice(0)) {
        m.mockRestore();
    }
});

// The clock at a day from NOON, and dice that roll high (the player hits
// first, and hard).
function at(days: number): void {
    mocks.push(spyOn(Date, 'now').mockReturnValue(NOON + days * DAY));
}
function highRolls(): Mock<() => number> {
    const random = spyOn(Math, 'random').mockReturnValue(0.99);
    mocks.push(random);
    return random;
}

// A player at the lair, in a world everyone shares (`store`).
function lair(store = new MemoryWorld(), player = newPlayer({ name: 'Ann', hp: 250, gold: 100 }), steps: (string | (() => string))[] = []) {
    return scriptContext({ worldStore: store, player, steps, fallback: 'enter' });
}

describe('days', () => {
    test('today, and the days between', () => {
        expect(today(new Date(2026, 9, 26, 23, 59).getTime())).toBe('2026-10-26');
        expect(daysBetween('2026-10-26', '2026-10-29')).toBe(3);
        expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    });
});

describe('the Wyrm', () => {
    test('a fight wounds it, for everyone; once a day', async () => {
        at(0);
        highRolls();
        const store = new MemoryWorld();
        const { g } = lair(store);
        await wyrm(g);
        const left = store.get('wyrmHp');
        expect(typeof left === 'number' && left < wyrmMaxHp(1) && left > 0).toBe(true);
        expect(g.flags.wyrmDay).toBe(today());
        // Lost (it's far stronger), but not robbed: thrown out on 1 hitpoint.
        expect([g.hp, g.gold]).toEqual([1, 100]);

        const again = lair(store, { ...newPlayer({ name: 'Ann' }), flags: { ...g.flags } });
        await wyrm(again.g);
        expect(screenText(again.term.screen)).toContain('You have fought it today.');
        expect(store.get('wyrmHp')).toBe(left);
    });

    test('the last blow slays it: a hoard, a place in the hall, and the news', async () => {
        at(0);
        highRolls();
        const store = new MemoryWorld();
        store.set('wyrmHp', 5);
        const news: string[] = [];
        const { g } = scriptContext({ worldStore: store, player: newPlayer({ name: 'Ann', gold: 0, exp: 0 }), news: (text) => news.push(text), fallback: 'enter' });
        await wyrm(g);
        expect(store.get('wyrmHp')).toBe(0);
        expect(store.get('wyrmSlainOn')).toBe(today());
        expect([g.gold, g.exp]).toEqual([5000, 1000]);
        expect(store.get('heroes')).toEqual([`Ann slew the Wyrm (level 1). {gray}(${today()})`]);
        expect(news).toEqual(['{yellow}Ann slew the Wyrm (level 1).']);
        // And she's the Wyrmslayer, for good.
        expect([g.title, g.flags.wyrmslayer]).toEqual([WYRMSLAYER, true]);
    });

    test("if someone else slays it during this one's fight, there's no reward", async () => {
        at(0);
        highRolls();
        const store = new MemoryWorld();
        const { g, term } = lair(store, newPlayer({ name: 'Bob', gold: 0 }), [
            'enter',
            () => {
                // (Ann lands the last blow first.)
                store.set('wyrmHp', 0);
                return 'enter';
            },
        ]);
        await wyrm(g);
        expect(screenText(term.screen)).toContain('someone else has slain it');
        expect(g.gold).toBe(0);
        expect(store.get('wyrmHp')).toBe(0);
    });

    test(`slain, the lair is empty for ${WYRM_RETURNS_AFTER} days; then it's back, stronger`, async () => {
        const store = new MemoryWorld();
        store.set('wyrmHp', 0);
        store.set('wyrmSlainOn', today(NOON));
        at(WYRM_RETURNS_AFTER - 1);
        const early = lair(store);
        await wyrm(early.g);
        expect(screenText(early.term.screen)).toContain('The lair is cold and empty.');

        mocks.splice(0).forEach((m) => {
            m.mockRestore();
        });
        at(WYRM_RETURNS_AFTER);
        const news: string[] = [];
        const { g, term } = scriptContext({ worldStore: store, player: newPlayer(), news: (text) => news.push(text), steps: [...pick(1)] });
        await wyrm(g);
        expect(screenText(term.screen)).toContain(`Level 2, ${wyrmMaxHp(2)} of ${wyrmMaxHp(2)} hitpoints.`);
        expect([store.get('wyrmLevel'), store.get('wyrmSlainOn')]).toEqual([2, '']);
        expect(news).toEqual(['{lightred}The Wyrm has returned to its lair, stronger than before.']);
    });

    test('creeping away fights nothing, and keeps the day', async () => {
        at(0);
        const { g } = scriptContext({ player: newPlayer(), steps: pick(1) });
        await wyrm(g);
        expect(g.flags.wyrmDay).toBe('');
    });
});

describe('the Wyrmslayer', () => {
    test('U heals fully once a day; not without wounds; and only for a Wyrmslayer', () => {
        at(0);
        const { g } = scriptContext({ player: newPlayer({ hp: 10 }, { wyrmslayer: true }) });
        const write = spyOn(g, 'write');
        wyrmslayersGift(g);
        expect(g.hp).toBe(g.maxHp);
        expect(write).toHaveBeenLastCalledWith("{lightmagenta}The Wyrm's blood burns in you, and your wounds close.");
        g.hp = 10;
        wyrmslayersGift(g);
        expect(g.hp).toBe(10);
        expect(write).toHaveBeenLastCalledWith("{gray}The Wyrm's blood is quiet. Its gift comes again tomorrow.");
        at(1);
        wyrmslayersGift(g);
        expect(g.hp).toBe(g.maxHp);
        at(2);
        wyrmslayersGift(g);
        expect(write).toHaveBeenLastCalledWith("{gray}You've no wounds for the Wyrm's blood to heal.");

        const other = scriptContext({ player: newPlayer({ hp: 10 }) });
        const said = spyOn(other.g, 'write');
        wyrmslayersGift(other.g);
        expect([other.g.hp, said.mock.calls.at(-1)?.[0]]).toEqual([10, '{gray}Only one who has slain the Wyrm has that gift.']);
    });

    test('those who slew it before there were titles are found on the hall of heroes', () => {
        const store = new MemoryWorld();
        store.set('heroes', ['Annie slew the Wyrm (level 1).', 'Ann slew the Wyrm (level 2). {gray}(2026-10-01)']);
        const ann = scriptContext({ worldStore: store, player: newPlayer({ name: 'Ann' }) });
        expect(isWyrmslayer(ann.g)).toBe(true);
        expect([ann.g.title, ann.g.flags.wyrmslayer]).toEqual([WYRMSLAYER, true]);
        const bo = scriptContext({ worldStore: store, player: newPlayer({ name: 'An' }) });
        expect(isWyrmslayer(bo.g)).toBe(false);
        expect(bo.g.title).toBe('');
    });
});

describe('the hall of heroes', () => {
    test("bare at first; then the realm's deeds, newest first; the first castle owner is one", async () => {
        at(0);
        const store = new MemoryWorld();
        const bare = scriptContext({ worldStore: store, steps: ['escape'] });
        await hallOfHeroes(bare.g);
        expect(screenText(bare.term.screen)).toContain('The plaque is bare.');

        const buyer = scriptContext({ worldStore: store, player: newPlayer({ name: 'Ann', gold: 10_000 }), steps: [...pick(0), ...pick(0), 'x'] });
        await castle(buyer.g);
        const second = scriptContext({ worldStore: store, player: newPlayer({ name: 'Bob', gold: 10_000 }), steps: [...pick(0), ...pick(0), 'x'] });
        await castle(second.g);
        expect(store.get('heroes')).toEqual([`Ann was the first to buy a share of the castle. {gray}(${today()})`]);

        const hall = scriptContext({
            worldStore: store,
            steps: [
                () => {
                    expect(screenText(hall.term.screen)).toContain('Ann was the first to buy a share of the castle.');
                    return 'escape';
                },
            ],
        });
        await hallOfHeroes(hall.g);
        expect(hall.term.remaining).toBe(0);
    });
});

describe('F: fame', () => {
    test('the hall of heroes, the castle and the Wyrm, on one screen', async () => {
        at(0);
        const store = new MemoryWorld();
        store.set('heroes', ['Ann slew the Wyrm (level 1).', 'Bob was the first to buy a share of the castle.']);
        store.set('castleOwners', ['Bob', 'Ann']);
        store.set('wyrmLevel', 2);
        store.set('wyrmHp', 0);
        store.set('wyrmSlainOn', today(NOON - DAY));
        const { g, term } = scriptContext({
            worldStore: store,
            steps: [
                () => {
                    const lines = screenText(term.screen).split('\n').map((line) => line.trim()).filter(Boolean);
                    const from = lines.indexOf('The hall of heroes');
                    expect(lines.slice(from, from + 7)).toEqual([
                        'The hall of heroes',
                        'Bob was the first to buy a share of the castle.',
                        'Ann slew the Wyrm (level 1).',
                        'The castle',
                        'Owned by Bob, Ann.',
                        'The Wyrm, west of Stone Valley',
                        `Slain. It returns in ${WYRM_RETURNS_AFTER - 1} days.`,
                    ]);
                    return 'escape';
                },
            ],
        });
        await fame(g);
        expect(term.remaining).toBe(0);
    });

    test('before anything has happened', async () => {
        const { g, term } = scriptContext({
            steps: [
                () => {
                    const text = screenText(term.screen);
                    expect(text).toContain('No deeds yet.');
                    expect(text).toContain('For sale.');
                    expect(text).toContain(`Level 1: ${wyrmMaxHp(1)} of ${wyrmMaxHp(1)} hitpoints left.`);
                    return 'escape';
                },
            ],
        });
        await fame(g);
    });

    test('is F, from the map', async () => {
        const { game, term } = makeGame({
            steps: [
                ...pick(4),
                'f',
                () => {
                    expect(screenText(term.screen)).toContain('The hall of heroes');
                    return 'escape';
                },
                'escape',
                'escape',
            ],
        });
        await game.run();
        expect(term.remaining).toBe(0);
    });
});
