// The dragon's island

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { say } from './common.ts';
import { ferry } from '../scripts/ferry.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        X: ferry('island', '{lightgreen}The ferry waits at the island\'s shore.'),
        A: say('{white}A sign says "{red}WARNING! {lightgreen}Stay away from the dragon!{white}"'),
    },
};

export default screen;
