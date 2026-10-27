// The docks

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        X: async (g) => {
            g.cls();
            g.print(
                '{lightgreen}You see a {yellow}boat {lightgreen}sitting by the docks.',
                '',
                '{lightgreen}You decide to get into the boat and head out to the',
                '{lightcyan}island {lightgreen}you can see from shore.',
                '',
                '{lightgreen}After a short trip.. you arive at the island.',
                '',
                '{lightgreen}Press any key...',
            );
            await g.key();
            g.goto(86, 42, 18);
        },
    },
};

export default screen;
