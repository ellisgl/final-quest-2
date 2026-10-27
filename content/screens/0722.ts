// Screen 722: Riply's Armour Shop

import type { ScreenScripts } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import { door } from './common.ts';
import { armourShop } from '../scripts/shops.ts';

const screen: ScreenScripts<Flags, Shared> = {
    triggers: {
        X: armourShop,
        D: door(82, 58, 10),
    },
};

export default screen;
