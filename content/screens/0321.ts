// Screen 321.

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { say } from './common.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        M: say('{white}Moorish Village -->'),
        X(g) {
            g.moveTo(75, 12);
            g.write('{lightcyan}What appears to be a warp...');
        },
        x(g) {
            g.moveTo(61, 17);
            g.write('{lightcyan}What appears to be a warp, again...');
        },
    },
};

export default screen;
