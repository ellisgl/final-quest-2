import { describe, expect, test } from 'bun:test';
import { credits, help, inventory, statusLine, title, worldMapLegend } from '../../content/ui.ts';
import { NAME_LENGTH, newGame } from '../../content/story.ts';
import { draw } from '@fq2ts/engine/text';
import { Screen } from '@fq2ts/engine/screen';
import { config, newPlayer, pick, row, screenText, scriptContext, typed } from '../helpers.ts';

function drawn(lines: readonly string[]): string {
    const screen = new Screen();
    for (const line of lines) {
        draw(screen, line);
    }
    return screenText(screen);
}

test('the title screen shows the version', () => {
    const text = drawn(title.art(config));
    expect(text).toContain('Main Menu');
    expect(text).toContain('V0.94 Rev D');
    expect(title.menu.options.map(([label]) => label)).toEqual(['Enter the Realm', 'Save Game', 'Load Game', 'Help', 'Resume Game', 'Leave this place']);
});

test('help', () => {
    const text = drawn(help(config));
    expect(text).toContain('Welcome to Final Quest 2 V0.94 by Akori Software.');
    expect(text).toContain('I = Inventory -- M = Map');
});

describe('credits', () => {
    test.each([1, 2, 3, 4, 5, 6, 7])('in frame colour %i', (frame) => {
        const screen = new Screen();
        for (const line of credits(config, frame)) {
            draw(screen, line);
        }
        expect(screenText(screen)).toContain('Thank you for playing Final Quest 2');
        expect(screen.cell(1, 1).fg).toBe(frame);
    });
});

test('the world map legend', () => {
    expect(drawn(worldMapLegend)).toContain('represents a large town');
});

test('the status line shows the name, or the company for old saves without one', () => {
    expect(statusLine(newPlayer({ hp: 12, gold: 3 }), config)).toBe('Final Quest 2 -- By AkoriSoft -- HP (12/250) -- Gold: 3!');
    expect(statusLine(newPlayer({ name: 'Ellis', hp: 12, gold: 3 }), config)).toBe('Final Quest 2 -- Ellis -- HP (12/250) -- Gold: 3!');
});

test('the status line fits the longest name and big numbers', () => {
    const line = statusLine(newPlayer({ name: 'W'.repeat(NAME_LENGTH), hp: 99999, maxHp: 99999, gold: 9999999 }), config);
    expect(line.length).toBeLessThanOrEqual(76);
});

test('the inventory is headed with the name', async () => {
    const { g, term } = scriptContext({
        player: newPlayer({ name: 'Ellis' }),
        steps: [
            () => {
                expect(row(term.screen, 1).trim()).toBe("Ellis's Inventory");
                return 'escape';
            },
        ],
    });
    await inventory(g);
});

describe('inventory', () => {
    const DONE = 'escape';

    test("lists the player's stats and items", async () => {
        const { g, term } = scriptContext({
            player: newPlayer({ exp: 9, items: { stick: 1, wildberries: 10, 'port-city-pass': 1 }, weapon: 'stick' }),
            steps: [
                () => {
                    const text = screenText(term.screen);
                    expect(text).toContain('Experience 9   Hitpoints 250/250   Gold $50');
                    expect(text).not.toContain('Bank');
                    expect(text).toContain('Weapon Stick   Armour nothing');
                    expect(row(term.screen, 10)).toStartWith('Stick               (in use) A sturdy stick.');
                    expect(row(term.screen, 11)).toStartWith('Wildberries x10     Small, sweet');
                    expect(row(term.screen, 12)).toStartWith('Port City Pass      (quest) Lets you through');
                    expect(row(term.screen, 13)).toBe('Done');
                    return DONE;
                },
            ],
        });
        await inventory(g);
        expect(term.remaining).toBe(0);
    });

    test('shows the bank balance with an account, and says when you carry nothing', async () => {
        const { g, term } = scriptContext({
            player: newPlayer({}, { hasBankAccount: true, bankGold: 40 }),
            steps: [
                () => {
                    expect(screenText(term.screen)).toContain('Bank $40');
                    expect(screenText(term.screen)).toContain("You aren't carrying anything.");
                    return DONE;
                },
            ],
        });
        await inventory(g);
    });

    test('equipping and putting away weapons', async () => {
        const { g, term } = scriptContext({
            player: newPlayer({ items: { stick: 1, shotgun: 1 }, weapon: 'stick' }),
            steps: [
                ...pick(1),
                ...pick(0),
                () => {
                    expect(row(term.screen, 8)).toBe('You ready your Shotgun.');
                    return 'down';
                },
                'enter',
                ...pick(0),
                DONE,
            ],
        });
        await inventory(g);
        expect(g.weapon).toBeNull();
        expect(g.count('shotgun')).toBe(1);
    });

    test('using an item', async () => {
        const { g, term } = scriptContext({
            player: newPlayer({ hp: 100, items: { wildberries: 2 } }),
            steps: [
                ...pick(0),
                ...pick(0),
                () => {
                    expect(row(term.screen, 8)).toBe('You eat some wildberries. Delicious! (+5 hitpoints)');
                    return DONE;
                },
            ],
        });
        await inventory(g);
        expect(g.hp).toBe(105);
        expect(g.count('wildberries')).toBe(1);
    });

    test('dropping an item, and changing your mind', async () => {
        const { g } = scriptContext({ player: newPlayer({ items: { vest: 1 }, armour: 'vest' }), steps: [...pick(0), ...pick(2), ...pick(0), ...pick(1), DONE] });
        await inventory(g);
        expect(g.count('vest')).toBe(0);
        expect(g.armour).toBeNull();
    });

    test("quest items can't be dropped", async () => {
        const { g, term } = scriptContext({
            player: newPlayer({ items: { 'port-city-pass': 1 } }),
            steps: [
                ...pick(0),
                () => {
                    expect(row(term.screen, 4)).toBe('Never mind');
                    return 'enter';
                },
                DONE,
            ],
        });
        await inventory(g);
        expect(g.count('port-city-pass')).toBe(1);
    });
});

describe('a new game', () => {
    test('a player who already has a name (on the server) is only asked their sex', async () => {
        const { g, term } = scriptContext({ player: newPlayer({ name: 'Hero' }) });
        term.feed(
            () => {
                expect(screenText(term.screen)).not.toContain('What is your name');
                expect(row(term.screen, 6)).toBe('And are you...');
                return 'enter';
            },
            'x',
        );
        await newGame(g);
        expect([g.name, g.sex]).toEqual(['Hero', 'male']);
    });

    test('asks for a name and sex, then starts with a stick and a vest', async () => {
        const { g, term } = scriptContext();
        term.feed(
            () => {
                expect(row(term.screen, 3)).toBe('What is your name, adventurer?');
                return 'enter';
            },
            ...typed('  '),
            ...typed(' Ellis '),
            () => {
                expect(row(term.screen, 6)).toBe('And are you...');
                expect(row(term.screen, 8)).toBe('A man');
                expect(row(term.screen, 9)).toBe('A woman');
                return 'down';
            },
            'enter',
            () => {
                expect(row(term.screen, 1)).toBe('Ellis...');
                expect(row(term.screen, 3)).toContain('put on your Vest, and strap your Stick to');
                return 'x';
            },
        );
        await newGame(g);
        expect([g.name, g.sex]).toEqual(['Ellis', 'female']);
        expect(g.weapon?.name).toBe('Stick');
        expect(g.armour?.name).toBe('Vest');
        expect(term.remaining).toBe(0);
    });

    test('names are cut at 20 characters, and Escape means a man', async () => {
        const { g } = scriptContext({ steps: [...typed('A'.repeat(30)), 'escape', 'x'] });
        await newGame(g);
        expect(g.name).toBe('A'.repeat(NAME_LENGTH));
        expect(g.sex).toBe('male');
    });
});

test('names with braces show as they are, in the status line and the inventory', async () => {
    const player = newPlayer({ name: '{blink red}Bob' });
    const screen = new Screen();
    draw(screen, statusLine(player, config));
    expect(row(screen, 1)).toContain('-- {blink red}Bob -- HP');
    const { g, term } = scriptContext({
        player,
        steps: [
            () => {
                expect(row(term.screen, 1).trim()).toBe("{blink red}Bob's Inventory");
                return 'escape';
            },
        ],
    });
    await inventory(g);
});
