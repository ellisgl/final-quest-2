// North of Stone Valley

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { say, sign } from './common.ts';

const screen: ScreenScripts<Flags, Shared> = {
    show(g) {
        if (g.flags.goldNearBarn) {
            g.overlay('{x 40}{y 19}{yellow}{on green}o');
        }
    },
    triggers: {
        S: sign('←-- Hill Valley    ↓-- Stone Valley'),
        X(g) {
            if (!g.flags.goldNearBarn) {
                return;
            }
            g.write('{white}You find some gold lying around...');
            g.gold += 25;
            g.flags.goldNearBarn = false;
        },
        A: say('{yellow}"A warm and cozy barn..."'),
    },
};

export default screen;
