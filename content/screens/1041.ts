// The rich couple's house

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { say, door, nightstand, sink, stove } from './common.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        D: door(486, 17, 6),
        A: say('{white}A ball room floor!'),
        Y: say('{white}You take a chair!'),
        a: nightstand,
        W: say('{white}What a wonderful view out this window!'),
        w: say('{white}What a huge bed!'),
        B: sink,
        C: stove,
        M: say('{lightgreen}My husband and I are soooo rich!!! oooOOhh!!!'),
        y: say("{lightgreen}Yep, kid... It's all mine!!"),
    },
};

export default screen;
