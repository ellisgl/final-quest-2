// The game's fixed screens: title, help, credits, world map legend, status
// bar and inventory. Text uses the markup described in engine/text.js.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { escapeMarkup } from '@fq2ts/engine/text';
import { pictureMarkup, readXBin } from '@fq2ts/engine/xbin';
import { COLORS } from '@fq2ts/engine/screen';
import { at } from '@fq2ts/engine/assert';
import type { Config, Content } from '@fq2ts/engine/game';
import type { Player } from '@fq2ts/engine/player';
import type { ItemDef } from '@fq2ts/engine/items';
import type { Flags, G, Shared } from './start.ts';

const art = (name: string): string[] => pictureMarkup(readXBin(readFileSync(join(import.meta.dir, '../data/art', name))));
const titleArt = art('title.xb');

export const title: Content<Flags, Shared>['title'] = {
    // The art is drawn in an ANSI editor such as Icy Draw (data/art/title.xb);
    // the version goes over it.
    art: ({ version, revision }) => [...titleArt, `{y 13}{on gray}{white}{center}${version} ${revision}`],
    // [label, x, y]; colours are [foreground, background].
    menu: {
        options: [
            ['Enter the Realm', 33, 17],
            ['Save Game', 36, 18],
            ['Load Game', 36, 19],
            ['Help', 38, 20],
            ['Resume Game', 35, 21],
            ['Leave this place', 33, 22],
        ],
        selectedColor: [11, 1],
        color: [9, 1],
    },
};

export const help = ({ title, version, company }: Config): string[] => [
    `{y 1}{yellow}{center}Welcome to ${title} ${version} by ${company}.`,
    '{y 3}{x 37}{yellow}KEYS:',
    '{y 4}{x 31}{lightgreen}← = Moves you Left',
    '{y 5}{x 31}{lightgreen}→ = Moves you Right',
    '{y 6}{x 31}{lightgreen}↓ = Moves you Down',
    '{y 7}{x 31}{lightgreen}↑ = Moves you Up',
    '{y 8}{lightgreen}{center}I = Inventory -- M = Map',
    '{y 9}{lightgreen}{center}ESC = Quit to Menu',
    "{y 12}{x 3}{lightcyan}So, here we are.  Not much to report on this revision because I haven't done",
    '{y 13}{lightcyan}much with it.  I am attempting to make as many screens as I can, and impliment',
    "{y 14}{lightcyan}as much gameplay into them as possible.  You know, I'm not that creative of a",
    "{y 15}{lightcyan}guy!  I don't know what I am going to do!  Anyway, today is 4/17/01, and this",
    '{y 16}{lightcyan}is Rev 094B02, So I guess I will keep working on it.  The only reason that this',
    "{y 17}{lightcyan}game never made 1.0 is because of that darned gameplay... Hey, I'll get it",
    "{y 18}{lightcyan}eventually.  I've been working on it for two years and eight months now, so",
    "{y 19}{lightcyan}three more years won't be any different.  {yellow}:{darkgray}-{lightgreen})",
    '{y 21}{white}Good Luck Adventurer.',
    '{y 23}{yellow}Press any key...',
];

// `frame` is a colour number (1-7) for the shaded border.
export function credits({ title, company, version, revision }: Config, frame: number): string[] {
    const c = at(COLORS, frame);
    const box = (y: number, inner: string): string => `{y ${y}}{${c}}░░░░▒▒{darkgray}{on gray}${inner}{on black}{${c}}▒▒░░░░`;
    const text = (y: number, s: string): string => box(y, `║{black}${s.padEnd(66)}{darkgray}║`);
    return [
        `{y 1}{${c}}░░░░▒▒▒▓▓▓▓{on ${c}}{sp 58}{on black}▓▓▓▓▒▒▒░░░░`,
        box(2, `╔${'═'.repeat(66)}╗`),
        text(3, ''),
        box(4, `╟${'─'.repeat(28)}┤{yellow}Credits{darkgray}├${'─'.repeat(29)}╢`),
        text(5, '        This game engine was originally brought to you by'),
        text(6, '          Author....... at Akori Software, a division of'),
        text(7, '                      Hollow-Head Software.'),
        text(8, ''),
        text(9, `    The game you just played used the ${title} (tm) engine`),
        text(10, '                               to run.'),
        text(11, ''),
        text(12, ''),
        box(13, `╚${'═'.repeat(66)}╝`),
        `{y 14}{${c}}░░░░▒▒▒▓▓▓▓{on ${c}}{sp 58}{on black}▓▓▓▓▒▒▒░░░░`,
        `{y 3}{black}{on gray}{center}Thank you for playing ${title}`,
        `{y 12}{black}{on gray}{center}This gameplay brought to you by ${company}...`,
        `{y 14}{white}{on ${c}}{center}${version} ${revision}`,
    ];
}

export const worldMapLegend: readonly string[] = [
    '{x 30}{y 3}{white}{on blue}Welcome to {yellow}F{red}inal {yellow}Q{red}uest {yellow}2{white}.',
    '{x 28}{y 5}{white}{on blue}A {on gray} {on blue} represents a large town,',
    '{x 28}{y 6}{white}{on blue}a {gray}{on green}■{on blue}{white} represents a small town,',
    '{x 28}{y 7}{white}{on blue}and a {on green} {on blue} represents land.',
];

// The game's title, then the player's name (or, for old saves without
// one, the company), hitpoints and gold.
export const statusLine = (p: Player<Flags>, { title, companyShort }: Config): string =>
    `${title} -- ${p.name ? escapeMarkup(p.name) : `By ${companyShort}`} -- HP (${p.hp}/${p.maxHp}) -- Gold: ${p.gold}!`;

// The inventory (I): the player's stats and items. Picking an item offers
// what can be done with it.
export async function inventory(g: G): Promise<void> {
    let message = '';
    for (;;) {
        g.cls();
        const bank = g.flags.hasBankAccount ? `   {white}Bank {yellow}$${g.flags.bankGold}` : '';
        g.print(
            `{yellow}{center}${g.name ? `${escapeMarkup(g.name)}'s Inventory` : 'Inventory'}`,
            '',
            `{white}Experience {lightcyan}${g.exp}   {white}Hitpoints {lightred}${g.hp}/${g.maxHp}   {white}Gold {yellow}$${g.gold}${bank}`,
            `{white}Strength {lightcyan}${g.strength}   {white}Defense {lightcyan}${g.defense}`,
            `{white}Weapon {lightmagenta}${g.weapon?.name ?? 'nothing'}   {white}Armour {lightmagenta}${g.armour?.name ?? 'nothing'}`,
            '',
            message ? `{yellow}${message}` : '{green}Pick an item to see what you can do with it.',
            '',
        );
        message = '';
        const entries = g.inventory;
        const labels = entries.map(({ item, count }) => {
            const name = `${item.name}${count > 1 ? ` x${count}` : ''}`.padEnd(20);
            const worn = g.weapon?.id === item.id || g.armour?.id === item.id;
            const note = worn ? '{lightgreen}(in use) ' : item.kind === 'quest' ? '{yellow}(quest) ' : '';
            return `{white}${name}${note}{gray}${item.description}`.slice(0, 110);
        });
        if (!entries.length) {
            g.print("{gray}You aren't carrying anything.", '');
        }
        const picked = entries[await g.choice([...labels, '{white}Done'])];
        if (!picked) {
            return;
        }
        message = await itemActions(g, picked.item);
    }
}

// The things that can be done with an item. Returns what happened.
async function itemActions(g: G, item: ItemDef): Promise<string> {
    const actions: [string, () => string][] = [];
    if (item.kind === 'weapon' || item.kind === 'armour') {
        const slot = item.kind;
        if (g[slot]?.id === item.id) {
            actions.push([
                'Stop using it',
                () => {
                    g.unequip(slot);
                    return `You put away your ${item.name}.`;
                },
            ]);
        } else {
            actions.push([
                'Use it',
                () => {
                    g.equip(item.id);
                    return `You ready your ${item.name}.`;
                },
            ]);
        }
    }
    if (item.kind === 'usable') {
        actions.push(['Use it', () => g.use(item.id)]);
    }
    if (item.kind !== 'quest') {
        actions.push([
            'Drop one',
            () => {
                g.take(item.id);
                return `You drop the ${item.name}.`;
            },
        ]);
    }
    g.cls();
    g.print(`{white}${item.name}`, `{gray}${item.description}`, '');
    const action = actions[await g.choice([...actions.map(([label]) => label), 'Never mind'])];
    return action ? action[1]() : '';
}
