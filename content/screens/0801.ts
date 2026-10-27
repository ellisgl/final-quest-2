// Screen 801: The Castle's West Wing

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { door } from './common.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        D: door(726, 17, 19),
        d: door(881, 53, 15),
    },
};

export default screen;
