// Screen 161.

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { sign } from './common.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        S: sign('↓-- The Ghost town   --→  Hill Valley'),
    },
};

export default screen;
