// Screen 723: The Weapon Store

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { door } from './common.ts';
import { weaponShop } from '../scripts/shops.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        X: weaponShop,
        D: door(82, 43, 18),
    },
};

export default screen;
