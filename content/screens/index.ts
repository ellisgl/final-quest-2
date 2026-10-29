// What happens on each screen: one file per screen, named for its number
// like its map in data/maps.
//
//   show(g)          runs every time the screen is drawn
//   triggers.X(g)    runs when the player walks onto or bumps into a tile
//                    the screen's map marks with X (its "triggers" rows), or
//                    arrives there from another screen
//
// X is one character you can type, other than "." (which marks no trigger).
// A trigger on a walkable tile lets the player step onto it unless the
// script moves them, travels or takes over the screen.

import type { Content } from '@fq2ts/engine/game';
import type { Flags, Shared } from '../start.ts';
import screen2 from './0002.ts';
import screen81 from './0081.ts';
import screen82 from './0082.ts';
import screen86 from './0086.ts';
import screen161 from './0161.ts';
import screen163 from './0163.ts';
import screen166 from './0166.ts';
import screen242 from './0242.ts';
import screen243 from './0243.ts';
import screen321 from './0321.ts';
import screen322 from './0322.ts';
import screen721 from './0721.ts';
import screen722 from './0722.ts';
import screen723 from './0723.ts';
import screen724 from './0724.ts';
import screen725 from './0725.ts';
import screen726 from './0726.ts';
import screen801 from './0801.ts';
import screen802 from './0802.ts';
import screen803 from './0803.ts';
import screen881 from './0881.ts';
import screen804 from './0804.ts';
import screen805 from './0805.ts';
import screen806 from './0806.ts';
import screen406 from './0406.ts';
import screen407 from './0407.ts';
import screen486 from './0486.ts';
import screen1041 from './1041.ts';
import screen1042 from './1042.ts';
import screen1043 from './1043.ts';
import screen1122 from './1122.ts';

export const screens: Content<Flags, Shared>['screens'] = {
    2: screen2,
    81: screen81,
    82: screen82,
    86: screen86,
    161: screen161,
    163: screen163,
    166: screen166,
    242: screen242,
    243: screen243,
    321: screen321,
    322: screen322,
    721: screen721,
    722: screen722,
    723: screen723,
    724: screen724,
    725: screen725,
    726: screen726,
    801: screen801,
    802: screen802,
    803: screen803,
    881: screen881,
    804: screen804,
    805: screen805,
    806: screen806,
    406: screen406,
    407: screen407,
    486: screen486,
    1041: screen1041,
    1042: screen1042,
    1043: screen1043,
    1122: screen1122,
};
