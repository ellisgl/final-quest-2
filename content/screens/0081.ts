// Screen 81.

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { sign } from './common.ts';
import { wyrm } from '../scripts/realm.ts';

const screen: ScreenScripts<Flags, Shared> = {
    // The Wyrm's lair, at the foot of the mountains.
    show(g) {
        g.overlay('{x 10}{y 12}{darkgray}∩');
    },
    triggers: {
        S: sign('↑-- Stone Valley   ↓-- Hill Valley'),
        W: wyrm,
    },
};

export default screen;
