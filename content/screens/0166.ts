// The docks

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { ferry } from '../scripts/ferry.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        X: ferry('docks', '{lightgreen}You see a {yellow}boat {lightgreen}sitting by the docks.'),
    },
};

export default screen;
