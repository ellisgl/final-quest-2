// The east of the walled town north of Port City.

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { say } from './common.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        H: say('{white}A house with its shutters closed. No one comes to the door.'),
        L: say('{white}The door is locked. A note on it says: "{yellow}Back soon.{white}"'),
    },
};

export default screen;
