// The dragon's island

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { say } from './common.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        X: async (g) => {
            g.cls();
            g.print('{red}You depart from the island and head back to the mainland...', '', '{lightgreen}Press a key...');
            await g.key();
            g.goto(166, 46, 6);
        },
        A: say('{white}A sign says "{red}WARNING! {lightgreen}Stay away from the dragon!{white}"'),
    },
};

export default screen;
