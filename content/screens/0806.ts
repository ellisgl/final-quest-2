// Screen 806: A Moorish House

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { say, door } from './common.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        T: say('{white}The moor looks at you, strangely...'),
        t: say('{lightcyan}The bed feels very comfortable...'),
        D: door(322, 32, 11),
    },
};

export default screen;
