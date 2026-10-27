// Screen 725: A Small House

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { say, door } from './common.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        D: door(82, 26, 15),
        T: say('{lightcyan}The bed feels hard and very unconfortable...'),
        X(g) {
            if (g.flags.foundMinigun) {
                g.write('{lightcyan}An empty table.');
                return;
            }
            g.flags.foundMinigun = true;
            // Like the original, the player takes it up at once (their old
            // weapon goes in their pack).
            g.give('minigun');
            g.equip('minigun');
            g.write('{lightcyan}You find a Minigun on the table, and arm yourself with it!');
        },
    },
};

export default screen;
