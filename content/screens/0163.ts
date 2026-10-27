// Hill Valley

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { say, door } from './common.ts';
import { bank, travelOffice, healer } from '../scripts/town.ts';
import { hotelRunner } from '../scripts/places.ts';

const screen: ScreenScripts<Flags, Shared> = {
    async show(g) {
        if (g.flags.hotelScene === 1) {
            g.flags.hotelScene = 2;
            await hotelRunner(g);
        }
    },
    triggers: {
        H: say('{green}<-- Hill Valley Bank    Hill Valley Travel Office -->'),
        T: travelOffice({ name: 'Hill Valley', destination: 'Stone Valley', cost: 30, to: [82, 65, 18] }),
        h: healer,
        X: bank('Welcome...'),
        D: door(724, 41, 16),
    },
};

export default screen;
