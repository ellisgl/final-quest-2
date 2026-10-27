// Screen 1043: A Port City House

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { door } from './common.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        D: door(486, 38, 16),
    },
};

export default screen;
