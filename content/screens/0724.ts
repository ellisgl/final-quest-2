// The unfinished hotel in Hill Valley

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { door } from './common.ts';
import { hotelGuard } from '../scripts/places.ts';

const screen: ScreenScripts<Flags, Shared> = {
    async show(g) {
        if (g.flags.hotelScene === 0) {
            g.flags.hotelScene = 1;
            await hotelGuard(g);
        }
    },
    triggers: {
        async X(g) {
            g.cls();
            g.print(
                '', '', '', '',
                '{green}A sign on the table reads:',
                '',
                '{green}{center}--------------------------------------------------------------',
                '',
                '{yellow}{center}*** ATTENTION ***',
                '',
                '{green}{sp 10}To all newcomers:',
                '',
                '{green}{sp 10}This is the property of Veronica Construction.  She started',
                '{green}{sp 10}building it some two hundred years ago, but decided not to',
                '{green}{sp 10}finish it.',
                '',
                '{green}{sp 10}If she ever considers finishing the job, let me know.',
                '',
                '{green}{center}--------------------------------------------------------------',
                '',
                '{green}Press any key to continue...',
            );
            await g.key();
        },
        D: door(163, 32, 18),
    },
};

export default screen;
