// What everyone in the realm shares: the Wyrm in the mountains west of
// Stone Valley, and the hall of heroes in Stone Valley.
//
// The Wyrm's hitpoints are the world's, so everyone wears it down together:
// each player can fight it once a day, and what they take off it is taken
// off for all. Whoever lands the last blow is rewarded, and remembered in
// the hall; three days later it's back, stronger. (In single-player, the
// world is the player's own, and so is the Wyrm.)

import type { Monster } from '@fq2ts/engine/combat';
import { escapeMarkup } from '@fq2ts/engine/text';
import type { G } from '../start.ts';

const CONTINUE = '{lightgreen}<{green}Continue{lightgreen}>';
// Days before a slain Wyrm returns.
export const WYRM_RETURNS_AFTER = 3;

// The day it is, by this computer's clock: "2026-10-26".
export function today(at = Date.now()): string {
    const d = new Date(at);
    const two = (n: number): string => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
}

// Whole days from one day to another.
export function daysBetween(from: string, to: string): number {
    return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export const wyrmMaxHp = (level: number): number => 3000 * level;

// The Wyrm at a level, with these hitpoints. Its gold and experience are
// nothing: only the one who slays it is rewarded (see wyrm).
export function wyrmMonster(level: number, hp: number): Monster {
    return {
        name: 'The Wyrm',
        says: 'The Wyrm uncoils, and its eyes find you.',
        pronoun: 'it',
        hp,
        defense: 10 * level,
        gold: 0,
        exp: 0,
        attacks: [
            { text: 'breathes fire at you', power: 60 + 20 * level },
            { text: 'lashes you with its tail', power: 40 + 15 * level },
        ],
        kill: '',
        after: {},
    };
}

// A lasting deed, for the hall of heroes (and the news).
export function hero(g: G, deed: string): void {
    g.world.heroes = [...g.world.heroes, `${deed} {gray}(${today()})`];
    g.news(`{yellow}${deed}`);
}

// The lair (screen 81).
export async function wyrm(g: G): Promise<void> {
    const day = today();
    if (g.world.wyrmHp <= 0) {
        if (daysBetween(g.world.wyrmSlainOn, day) < WYRM_RETURNS_AFTER) {
            g.cls();
            g.print('{gray}The lair is cold and empty. Something stirs, far down in the dark.', '', '{gray}It will be back.', '', CONTINUE);
            await g.key();
            return;
        }

        const level = g.world.wyrmLevel + 1;
        g.world.wyrmLevel = level;
        g.world.wyrmHp = wyrmMaxHp(level);
        g.world.wyrmSlainOn = '';
        g.news('{lightred}The Wyrm has returned to its lair, stronger than before.');
    }

    const level = g.world.wyrmLevel;
    g.cls();
    g.print(
        '{lightred}The lair of the Wyrm',
        '',
        `{gray}It sleeps in coils on a bed of bones. {white}Level ${level}, ${g.world.wyrmHp} of ${wyrmMaxHp(level)} hitpoints.`,
        '{gray}Everyone in the realm wears it down together: the last blow wins the day.',
        '',
    );
    if (g.flags.wyrmDay === day) {
        g.print('{yellow}You have fought it today. It will be here tomorrow.', '', CONTINUE);
        await g.key();
        return;
    }

    if ((await g.choice(['Fight it', 'Creep away'])) !== 0) {
        return;
    }

    g.flags.wyrmDay = day;
    const before = g.world.wyrmHp;
    let dealt = 0;
    await g.fight(wyrmMonster(level, before), {
        defeat: (player) => {
            player.hp = 1;
            return 'The Wyrm flings you out of its lair, barely alive.';
        },
        victory: '{lightred}The Wyrm shudders and falls still!',
        left: (hp) => {
            dealt = before - hp;
        },
    });

    // Others may have struck it while this one fought.
    const now = g.world.wyrmHp;
    if (now <= 0) {
        g.write('{yellow}By the time you strike, someone else has slain it.');
        return;
    }

    const after = Math.max(0, now - dealt);
    g.world.wyrmHp = after;
    if (after > 0) {
        g.write(`{white}You wounded the Wyrm for ${dealt}. It has ${after} hitpoints left.`);
        return;
    }

    const gold = 5000 * level;
    const exp = 1000 * level;
    g.world.wyrmSlainOn = day;
    g.gold += gold;
    g.exp += exp;
    hero(g, `${escapeMarkup(g.name)} slew the Wyrm (level ${level}).`);
    const first = !g.flags.wyrmslayer;
    becomeWyrmslayer(g);
    g.cls();
    g.print(
        '{yellow}You have slain the Wyrm!',
        '',
        `{white}Its hoard is yours: {yellow}$${gold}{white}, and {yellow}${exp}{white} experience.`,
        ...(first ? ['', `{white}From now on you are {lightmagenta}${WYRMSLAYER}{white}, and the Wyrm's blood gives you a gift:`, '{white}once a day, press {yellow}U{white} to heal your wounds, wherever you are.'] : []),
        '',
        CONTINUE,
    );
    await g.key();
}

// The title of those who've slain the Wyrm, and their gift: a full heal,
// once a day, anywhere.
export const WYRMSLAYER = 'the Wyrmslayer';

function becomeWyrmslayer(g: G): void {
    g.flags.wyrmslayer = true;
    g.title = WYRMSLAYER;
}

// Whether the player has slain the Wyrm. Those who did before there were
// titles are found on the hall of heroes, and made Wyrmslayers then.
export function isWyrmslayer(g: G): boolean {
    if (!g.flags.wyrmslayer && g.name && g.world.heroes.some((deed) => deed.startsWith(`${escapeMarkup(g.name)} slew the Wyrm (`))) {
        becomeWyrmslayer(g);
    }
    return g.flags.wyrmslayer;
}

// U: the Wyrmslayer's gift.
export function wyrmslayersGift(g: G): void {
    if (!isWyrmslayer(g)) {
        g.write('{gray}Only one who has slain the Wyrm has that gift.');
    } else if (g.flags.giftDay === today()) {
        g.write("{gray}The Wyrm's blood is quiet. Its gift comes again tomorrow.");
    } else if (g.hp >= g.maxHp) {
        g.write("{gray}You've no wounds for the Wyrm's blood to heal.");
    } else {
        g.flags.giftDay = today();
        g.healFull();
        g.write("{lightmagenta}The Wyrm's blood burns in you, and your wounds close.");
    }
}

// F, anywhere: what the realm knows of its heroes and its wonders, the
// hall of heroes, the castle's owners, and how the Wyrm is.
export async function fame(g: G): Promise<void> {
    isWyrmslayer(g);
    const { heroes, castleOwners, wyrmHp, wyrmLevel, wyrmSlainOn } = g.world;
    const wyrmIs = wyrmHp > 0
        ? `{white}Level ${wyrmLevel}: ${wyrmHp} of ${wyrmMaxHp(wyrmLevel)} hitpoints left.`
        : `{gray}Slain. It returns ${returnsIn(wyrmSlainOn)}.`;
    await g.scroll(
        [
            '{yellow}The hall of heroes',
            ...(heroes.length ? [...heroes].reverse().map((deed) => `{white}  ${deed}`) : ['{gray}  No deeds yet.']),
            '',
            '{yellow}The castle',
            castleOwners.length ? `{white}  Owned by ${castleOwners.map(escapeMarkup).join(', ')}.` : '{gray}  For sale.',
            '',
            '{yellow}The Wyrm, west of Stone Valley',
            `  ${wyrmIs}`,
        ],
        'Fame',
    );
}

// When a slain Wyrm returns, in words.
function returnsIn(slainOn: string): string {
    const days = WYRM_RETURNS_AFTER - daysBetween(slainOn, today());
    return days <= 0 ? 'any time now' : days === 1 ? 'tomorrow' : `in ${days} days`;
}

// The hall of heroes (a plaque in Stone Valley): the realm's lasting deeds.
export async function hallOfHeroes(g: G): Promise<void> {
    const deeds = g.world.heroes;
    await g.scroll(deeds.length ? [...deeds].reverse().map((deed) => `{white}${deed}`) : ['{gray}The plaque is bare. Will your name be the first on it?'], 'The hall of heroes');
}
