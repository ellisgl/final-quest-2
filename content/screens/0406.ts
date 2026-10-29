// The town north of Port City, with the Red Dragon Inn

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { door } from './common.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        I: door(1122, 41, 17),
    },
};

export default screen;
