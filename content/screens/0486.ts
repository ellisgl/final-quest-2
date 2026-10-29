// Port City

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { door } from './common.ts';
import { bank } from '../scripts/town.ts';
import { cityGuards } from '../scripts/places.ts';
import { ferry } from '../scripts/ferry.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        X(g) {
            g.write('{lightcyan}You have warped to {gray}Stone Valley{lightcyan}.');
            g.goto(82, 28, 17);
        },
        x: bank('Welcome to {white}Port City Bank{green}.'),
        C: cityGuards,
        D: door(1041, 39, 17),
        d: door(1042, 41, 18),
        A: door(1043, 41, 18),
        B: ferry('port', '{lightgreen}Boats bob at the pier behind the {yellow}Boathouse{lightgreen}.'),
    },
};

export default screen;
