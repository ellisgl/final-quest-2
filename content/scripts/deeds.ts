// Good and evil (as LORD II): the player's alignment, from -10 to 10, moves
// with what they do, and some people treat them by it. A deed counts once
// a day, so no one gets good (or bad) by doing the same thing over and over.
// The deeds: tipping or mocking the bar's cleaner, the rich couple's purse,
// helping the old woman or going through her cupboard, and the Moorish
// village's cow. (On the server, attacking a sleeping player is a bad deed
// too: the server sees to that.)

import type { G } from '../start.ts';
import { today } from './realm.ts';

const CONTINUE = '{lightgreen}<{green}Continue{lightgreen}>';

// From here down, people take the player for evil: the nurse charges them
// double, and the Wyrm will take them (EVIL); the bartender won't serve
// them his best (UNWELCOME); Port City's guards won't let them in (WANTED).
export const UNWELCOME = -3;
export const EVIL = -5;
export const WANTED = -8;

// Whether the player has done this deed today; if not, it's done now, and
// their alignment moves by `change`.
export function deed(g: G, id: string, change: number): boolean {
    const day = today();
    const done = g.flags.deedsDay === day ? g.flags.deeds.split(',').filter(Boolean) : [];
    if (done.includes(id)) {
        return false;
    }

    g.flags.deedsDay = day;
    g.flags.deeds = [...done, id].join(',');
    g.alignment += change;
    return true;
}

// The player's alignment in words, for the inventory.
export function alignmentText(alignment: number): string {
    const n = alignment > 0 ? `+${alignment}` : String(alignment);
    const word = alignment >= 8 ? 'a saint' : alignment >= 3 ? 'good' : alignment > UNWELCOME ? 'neither good nor evil' : alignment > WANTED ? 'evil' : 'wicked';
    return `${alignment < 0 ? '{lightred}' : alignment > 0 ? '{lightgreen}' : '{white}'}${n} {gray}(${word})`;
}

// The cleaner in Port City's bar, who hates his job.
export async function cleaner(g: G): Promise<void> {
    g.cls();
    g.print('{white}"{yellow}That\'s all I do, is clean Clean CLEAN!  I HATE THIS JOB!{white}"', '');
    const choice = await g.choice(['Tip him $5...', 'Laugh at him...', 'Leave him to it...']);
    if (choice === 0) {
        if (g.gold < 5) {
            g.print('', "{green}You haven't $5 to give.", '', CONTINUE);
        } else {
            g.gold -= 5;
            g.print('', '{white}"{yellow}For me? Well... thanks, kid. Maybe today\'s not so bad.{white}"', '', CONTINUE);
            deed(g, 'tip-cleaner', 1);
        }
        await g.key();
    } else if (choice === 1) {
        g.print('', '{green}You laugh at him. He scrubs harder, and doesn\'t look up.', '', CONTINUE);
        deed(g, 'mock-cleaner', -1);
        await g.key();
    }
}

// The rich couple's nightstand, with a purse on it.
export async function richNightstand(g: G): Promise<void> {
    if (g.flags.deedsDay === today() && g.flags.deeds.split(',').includes('rich-purse')) {
        g.write('{white}A nightstand. The purse is gone.');
        return;
    }

    g.cls();
    g.print('{white}A nightstand, and on it a fat little purse. No one is looking.', '');
    if ((await g.choice(['Take the purse...', 'Leave it...'])) === 0) {
        deed(g, 'rich-purse', -1);
        g.gold += 30;
        g.print('', '{green}You pocket the purse: {yellow}$30{green}. They won\'t miss it... will they?', '', CONTINUE);
        await g.key();
    }
}

// The old woman's chores, or her cupboard: what else there is to do in
// her house, once she's offered her cocoa.
export async function womanDeeds(g: G, choice: 'help' | 'rifle'): Promise<void> {
    g.cls();
    if (choice === 'help') {
        if (deed(g, 'help-woman', 1)) {
            g.print('{green}You sweep the floor and wash the cups. The old woman watches you, puzzled.', '', '{white}"{yellow}...Are you the rat? You\'re a good rat.{white}"', '', CONTINUE);
        } else {
            g.print("{green}You've done her chores today. The floor's still clean.", '', CONTINUE);
        }
    } else if (deed(g, 'rifle-woman', -1)) {
        g.gold += 10;
        g.print("{green}While she isn't looking, you go through her cupboard: {yellow}$10{green}, under a jar of wood.", '', CONTINUE);
    } else {
        g.print('{green}The cupboard is empty. You took what there was today.', '', CONTINUE);
    }
    await g.key();
}

// The cow in the Moorish village.
export async function cow(g: G): Promise<void> {
    g.cls();
    g.print('{white}"{yellow}Mooooooooooooo!!!{white}"', '');
    const choice = await g.choice([g.has('wildberries') ? 'Feed it some berries...' : { text: 'Feed it some berries...', show: false }, 'Kick it...', 'Leave it be...']);
    if (choice === 0 && g.take('wildberries')) {
        deed(g, 'feed-cow', 1);
        g.print('', '{green}The cow munches the berries happily, and nuzzles you.', '', CONTINUE);
        await g.key();
    } else if (choice === 1) {
        deed(g, 'kick-cow', -1);
        g.print('', '{green}You kick the cow. It looks at you, hurt. So do the villagers.', '', CONTINUE);
        await g.key();
    }
}
