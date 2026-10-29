// Screen 243: The Castle Gates

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { castle } from '../scripts/places.ts';
import { arena } from '../scripts/arena.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        C: castle,
        A: arena,
    },
};

export default screen;
