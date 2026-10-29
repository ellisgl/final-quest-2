// The walled town north of Port City, with the Red Dragon Inn. Only the
// inn's doors open; the rest of the town keeps to itself.

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { door, say } from './common.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        I: door(1122, 41, 17),
        T: say('{white}A tall, narrow tower. The door is barred from the inside.'),
        H: say('{white}No one answers. Through the window, a cat stares back at you.'),
        S: say('{white}The infirmary is closed. A sign says: "{yellow}Healer\'s in Hill Valley.{white}"'),
        C: say('{white}The temple doors are shut. You hear chanting inside.'),
        W: say('{white}The watchtower is locked. Someone up top is watching the sea.'),
        M: say("{white}A merchant's tower, closed for the day."),
    },
};

export default screen;
