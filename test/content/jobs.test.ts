import { afterEach, describe, expect, spyOn, test, type Mock } from 'bun:test';
import { bar, oldWoman } from '../../content/scripts/places.ts';
import { healer } from '../../content/scripts/town.ts';
import { jobs } from '../../content/scripts/jobs.ts';
import { inventory } from '../../content/ui.ts';
import moorishVillage from '../../content/screens/0322.ts';
import { newPlayer, pick, screenText, scriptContext } from '../helpers.ts';

// What's on the screen, as one line (long lines wrap).
const flat = (term: { screen: Parameters<typeof screenText>[0] }): string => screenText(term.screen).replace(/\s+/g, ' ');

let random: Mock<() => number> | null = null;
afterEach(() => {
    random?.mockRestore();
    random = null;
});

describe('jobs', () => {
    test('the bartender gives a delivery to the old woman, who takes it; the inventory says so meanwhile', async () => {
        // (The first of the others, the lowest pay, the first thing to carry.)
        random = spyOn(Math, 'random').mockReturnValue(0);
        const { g, term } = scriptContext({
            player: newPlayer({ gold: 0 }, { womanOffersCocoa: false }),
            steps: [
                ...pick(2),
                () => {
                    expect(flat(term)).toContain('Got a sack for the old woman in Stone Valley. $40 if it gets there in one piece.');
                    return 'enter';
                },
                'x',
                () => {
                    expect(screenText(term.screen)).toContain('About that sack...');
                    return 'down';
                },
                'down',
                'down',
                'enter',
                () => {
                    expect(flat(term)).toContain('Jobs done 0 Taking a sack to the old woman in Stone Valley');
                    return 'escape';
                },
                'x',
            ],
        });
        await bar(g);
        await inventory(g);
        expect(jobs.job(g)).toMatchObject({ to: { id: 'woman' }, from: { id: 'bartender' }, pay: 40 });

        // The old woman goes straight to taking it.
        await oldWoman(g);
        expect(term.remaining).toBe(0);
        expect(screenText(term.screen)).toContain('The old woman snatches the sack.');
        expect(g.flags.jobsDone).toBe(1);
        expect(g.gold).toBeGreaterThanOrEqual(40);
    });

    test("the healer's nurse asks about work in the hut; the man by the fire has some too", async () => {
        const hut = scriptContext({
            steps: [
                ...pick(2),
                () => {
                    expect(screenText(hut.term.screen)).toContain('The nurse lowers her voice.');
                    return 'escape';
                },
                'x',
                ...pick(3),
            ],
        });
        await healer(hut.g);
        expect(hut.term.remaining).toBe(0);
        expect(hut.g.flags.jobFor).toBe('');

        const fire = scriptContext({
            steps: [
                () => {
                    const text = screenText(fire.term.screen);
                    expect(text).toContain('The man, although interested at your presence, ignores you.');
                    expect(text).toContain('Ask about work...');
                    return 'enter';
                },
                () => {
                    expect(screenText(fire.term.screen)).toContain('The man looks up at last.');
                    return 'enter';
                },
                'x',
            ],
        });
        await moorishVillage.triggers?.['T']?.(fire.g);
        expect(fire.term.remaining).toBe(0);
        expect(fire.g.flags.jobFrom).toBe('moor');
    });
});
