// Moorish houses

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { say, door } from './common.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        T: say('{lightcyan}The bed seems to be broken. Darn.'),
        I: say('{lightcyan}"I am a moor.  You are not.  Get out of my house, NOW!"'),
        D: door(322, 25, 14),
    },
};

export default screen;
