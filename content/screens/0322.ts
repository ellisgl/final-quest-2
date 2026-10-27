// The Moorish village

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { say, door } from './common.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        W: say('{lightcyan}What a wonderful place for a camp fire.'),
        T: say('{white}The man, although interested at your presence, ignores you.'),
        M: say('{white}Mooooooooooooo!!!'),
        D: door(804, 40, 15),
        X(g) {
            g.write('{lightcyan}An old deserted hut.');
            g.goto(805, 40, 15);
        },
        d: door(806, 40, 15),
    },
};

export default screen;
