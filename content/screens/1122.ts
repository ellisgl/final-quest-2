// The Red Dragon Inn: rooms for the night (Z, on the server)

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { door } from './common.ts';

const screen: ScreenScripts<Flags, Shared> = {
    show: (g) => {
        g.overlay('{x 31}{y 9}{yellow}The Red Dragon Inn');
        g.overlay('{x 30}{y 11}{white}Rooms for the night.');
        g.overlay('{x 30}{y 12}{gray}(Z takes one, and no one');
        g.overlay("{x 30}{y 13}{gray}can find you while you're");
        g.overlay('{x 30}{y 14}{gray}away.)');
    },
    triggers: {
        D: door(406, 61, 9),
    },
};

export default screen;
