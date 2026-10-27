// Inside the castle

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { door } from './common.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        X(g) {
            g.flags.castleExitX = 41;
            g.goto(243, 36, 17);
        },
        x(g) {
            g.flags.castleExitX = 42;
            g.goto(243, 36, 17);
        },
        D: door(801, 39, 18),
        d: door(802, 41, 19),
        A: door(802, 42, 19),
        B: door(803, 39, 18),
    },
};

export default screen;
