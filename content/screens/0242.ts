// The ghost town

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { say } from './common.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        A: say('{lightgreen}An old and deserted town...'),
        a: say('{white}An old deserted cabin...Locked..  In the window you see a rocking chair.'),
        X(g) {
            if (g.flags.oldManSeen) {
                g.write('{white}The man peers at you through the window.');
            } else {
                g.flags.oldManSeen = true;
                g.write('{white}An old man is in the backyard. When he sees you he runs into his house.');
            }
        },
        T: say('{yellow}The remnants of an old castle.. Nothing but ruins now...'),
        B: say('{white}An old inn that is all borded up...'),
        W: say('{yellow}What looks like an old hospital is locked.. In the window you see nothing..'),
    },
};

export default screen;
