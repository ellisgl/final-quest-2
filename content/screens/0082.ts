// Stone Valley

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { door, sign } from './common.ts';
import { berries, travelOffice, roshi } from '../scripts/town.ts';
import { hallOfHeroes } from '../scripts/realm.ts';

const screen: ScreenScripts<Flags, Shared> = {
    // The hall of heroes' plaque.
    show(g) {
        g.overlay('{x 50}{y 18}{yellow}¶');
    },
    triggers: {
        H: hallOfHeroes,
        X(g) {
            g.write('{lightcyan}You have warped to {gray}Port City{lightcyan}.');
            g.goto(486, 4, 13);
        },
        x(g) {
            g.moveTo(79, 22);
            g.write('{lightcyan}A warp, wonder where it leads...');
        },
        A(g) {
            g.moveTo(47, 21);
            g.write('{lightcyan}Another warp, back to where it came from...');
        },
        B: berries,
        R: roshi,
        S: sign('Village of Stone Valley...'),
        T: travelOffice({ name: 'Stone Valley', destination: 'Hill Valley', cost: 20, to: [163, 47, 11] }),
        D: door(725, 31, 15),
        d: door(722, 39, 16),
        C: door(723, 39, 16),
        E: door(721, 41, 18),
    },
};

export default screen;
