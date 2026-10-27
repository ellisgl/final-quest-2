// Screen 802: The Castle's Great Hall

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { door } from './common.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        D: door(726, 41, 18),
        d: door(726, 42, 18),
    },
};

export default screen;
