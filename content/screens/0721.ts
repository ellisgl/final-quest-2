// Your house in Stone Valley

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { say, door } from './common.ts';
import { oldWoman } from '../scripts/places.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        X(g) {
            if (g.flags.toiletUsed) {
                g.write('{lightred}Yuck!');
            } else {
                g.write('{yellow}Ahh.. Much better!');
                g.flags.toiletUsed = true;
            }
        },
        N: say('{lightcyan}"Nice and Comphy.."'),
        A: say('{yellow}"A bed..."'),
        a: say('{yellow}"Another bed..."'),
        B: say('{yellow}"And another bed..."'),
        F: say('{yellow}"Fancy that... Another bed..."'),
        T: say('{yellow}"Too many beds in this room..."'),
        D: door(82, 11, 18),
        O: oldWoman,
    },
};

export default screen;
