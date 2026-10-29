// Everything that makes this particular game, as opposed to the engine.

import type { Content } from '@fq2ts/engine/game';
import { title, help, credits, worldMapLegend, statusLine, inventory } from './ui.ts';
import { newGame } from './story.ts';
import { screens } from './screens/index.ts';
import { shared, start, upgradeSave, type Flags, type Shared } from './start.ts';
import { events } from './events.ts';
import { fame, wyrmslayersGift } from './scripts/realm.ts';

const content: Content<Flags, Shared> = {
    title,
    help,
    credits,
    worldMapLegend,
    statusLine,
    inventory,
    newGame,
    start,
    // One drink a day at the bar (on a server, the day turns at midnight).
    daily: ['hadDrink'],
    keys: {
        F: { help: 'fame: the hall of heroes, the castle and the Wyrm', run: fame },
        U: { help: "the Wyrm's gift, once a day: the Wyrmslayer heals; the Wyrmsworn curses someone next to them", run: wyrmslayersGift },
    },
    world: shared,
    screens,
    events,
    upgradeSave,
};

export default content;
