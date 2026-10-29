// An example mod: a wishing well in the middle of Stone Valley (screen 82).
// Toss in a coin and make a wish; every tenth wish brings up a lucky coin.
// It shows a mod's own flags (wishes), a new item (items.json), a show
// script that draws on an existing screen, and a trigger on a free tile.
//
// The folder's name starts with _, so it's switched off: rename it to
// wishing-well to play with it.

import type { Mod } from '@fq2ts/engine/mods';

export default {
    id: 'wishing-well',
    name: 'The Wishing Well',
    version: '1.0.0',
    api: 1,
    description: 'A wishing well in Stone Valley. Toss in a coin and make a wish.',
    flags: { wishes: 0 },
    screens: {
        82: {
            show: (g) => {
                g.overlay('{x 10}{y 10}{lightcyan}○');
            },
            at: {
                '10,10': async (g, mod) => {
                    g.cls();
                    g.print('{lightcyan}An old stone well. Coins glint at the bottom.', '');
                    if ((await g.choice(['Toss in a gold coin and make a wish', 'Walk on'])) !== 0 || !(await g.spend(1))) {
                        return;
                    }

                    mod.flags.wishes++;
                    if (mod.flags.wishes % 10 === 0) {
                        g.give('lucky-coin');
                        g.print('', '{yellow}Something glints back up at you: a lucky coin!');
                    } else if (g.random(3) === 1) {
                        g.healFull();
                        g.print('', '{lightgreen}You feel refreshed.');
                    } else {
                        g.print('', '{gray}Plink. Nothing happens. Maybe next time.');
                    }
                    await g.key();
                },
            },
        },
    },
} satisfies Mod<{ wishes: number }>;
