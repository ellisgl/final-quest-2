// The game's fixed screens: title, help, credits, world map legend, status
// bar and inventory. Text uses the markup described in engine/text.js.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { escapeMarkup } from '@fq2ts/engine/text';
import { flatten, layerBox, pictureMarkup, readIcy, tagMarkup, type Icy } from '@fq2ts/engine/icy';
import type { Config, Content } from '@fq2ts/engine/game';
import type { Player } from '@fq2ts/engine/player';
import type { ItemDef } from '@fq2ts/engine/items';
import type { Flags, G, Shared } from './start.ts';

// Screens drawn in Icy Draw (data/art/*.icy). Their tags say where text
// from config.json goes: each @TITLE@, @VERSION@, @REVISION@ and @COMPANY@
// in a tag's replacement is filled in (data/art/final-quest-2.toml lists
// them for Icy Draw).
const art = (name: string): Icy => readIcy(readFileSync(join(import.meta.dir, '../data/art', name)));
const titleArt = art('title.icy');
const helpArt = art('help.icy');
const creditsArt = art('credits.icy');

const draw = (icy: Icy, { title, version, revision, company }: Config): string[] => [
    ...pictureMarkup(flatten(icy)),
    ...tagMarkup(icy, { TITLE: title, VERSION: version, REVISION: revision, COMPANY: company }),
];

// The title's Menu layer is the inside of the menu box.
const menuBox = layerBox(titleArt, 'Menu');
if (!menuBox) {
    throw new Error('data/art/title.icy has no Menu layer for the menu box');
}

export const title: Content<Flags, Shared>['title'] = {
    art: (config) => draw(titleArt, config),
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
        box: menuBox,
    },
};

export const help = (config: Config): string[] => draw(helpArt, config);

// The credits' Frame layer is shown in `frame`, a colour number (1-7), in
// place of any colour but black.
export function credits(config: Config, frame: number): string[] {
    const shade = (color: number | null): number | null => (color === null || color === 0 ? color : frame);
    const layers = creditsArt.layers.map((l) =>
        l.title === 'Frame' ? { ...l, cells: l.cells.map((c) => c && { ...c, fg: shade(c.fg), bg: shade(c.bg) }) } : l,
    );
    return draw({ ...creditsArt, layers }, config);
}

// Drawn over the world map: data/art/legend.icy, a layer with nothing but
// the legend in it.
export const worldMapLegend: readonly string[] = pictureMarkup(flatten(art('legend.icy')));

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
