// The bar

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { say, door, nightstand, sink, stove } from './common.ts';
import { bar } from '../scripts/places.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        Y: say("{lightcyan}You don't need to use this toilet."),
        T: say('{white}"{yellow}That\'s all I do, is clean Clean CLEAN!  I HATE THIS JOB!{white}"'),
        A: sink,
        M: say('{white}"{yellow}Man, I LOVE living in the city!  Have a drink, kid.{white}"'),
        t: say('{white}The bartender says, "{yellow}What\'ll it be?{white}"'),
        B: bar,
        H: say('{white}"{yellow}He doesn\'t pay me enough to cook his food.{white}"'),
        a: stove,
        C: say('{white}A place to hang coats.'),
        D: nightstand,
        E: say('{lightcyan}A nicely sized bed.'),
        F: say('{white}A walk in closet!!!!! Alright!'),
        d: door(486, 33, 12),
    },
};

export default screen;
