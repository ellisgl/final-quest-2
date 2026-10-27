// Screen 881: The Castle Cellar

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { door } from './common.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        D: door(801, 55, 11),
    },
};

export default screen;
