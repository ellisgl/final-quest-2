// What happens on each screen.
//
//   show(g)        runs every time the screen is drawn
//   at["x,y"](g)   runs when the player walks onto or bumps into (x, y), or
//                  arrives there from another screen
//
// A trigger on a walkable tile lets the player step onto it unless the
// script moves them, travels or takes over the screen.

import type { Content, Coord } from '@fq2ts/engine/game';
import { strip } from '@fq2ts/engine/text';
import { about, type Flags, type Script, type Shared } from './start.ts';
import { berries, bank, travelOffice, roshi, healer } from './scripts/town.ts';
import { armourShop, weaponShop } from './scripts/shops.ts';
import { oldWoman, hotelRunner, hotelGuard, castle, bar, cityGuards } from './scripts/places.ts';
import { hallOfHeroes, wyrm } from './scripts/realm.ts';

const say = (text: string): Script => about(`says: ${strip(text)}`, (g) => g.write(text));
const door = (screen: number, x: number, y: number): Script => about(`door to screen ${screen} at ${x},${y}`, (g) => g.goto(screen, x, y));

// The same trigger on several tiles.
function tiles(list: readonly Coord[], script: Script): Partial<Record<Coord, Script>> {
    const out: Partial<Record<Coord, Script>> = {};
    for (const xy of list) {
        out[xy] = script;
    }
    return out;
}

const sign = (text: string): Script => about(`sign: ${strip(text)}`, say(`{green}The Sign Reads:  ${text}`));
const nightstand = say('{white}A nightstand.');
const sink = say('{white}A sink.');
const stove = say('{white}A stove.');

export const screens: Content<Flags, Shared>['screens'] = {
    // North of Stone Valley
    2: {
        show(g) {
            if (g.flags.goldNearBarn) {
                g.overlay('{x 40}{y 19}{yellow}{on green}o');
            }
        },
        at: {
            '32,6': sign('←-- Hill Valley    ↓-- Stone Valley'),
            '40,19'(g) {
                if (!g.flags.goldNearBarn) {
                    return;
                }
                g.write('{white}You find some gold lying around...');
                g.gold += 25;
                g.flags.goldNearBarn = false;
            },
            ...tiles(['45,8', '46,8'], say('{yellow}"A warm and cozy barn..."')),
        },
    },

    81: {
        // The Wyrm's lair, at the foot of the mountains.
        show(g) {
            g.overlay('{x 10}{y 12}{darkgray}∩');
        },
        at: {
            '26,11': sign('↑-- Stone Valley   ↓-- Hill Valley'),
            '10,12': wyrm,
        },
    },

    // Stone Valley
    82: {
        // The hall of heroes' plaque.
        show(g) {
            g.overlay('{x 50}{y 18}{yellow}¶');
        },
        at: {
            '50,18': hallOfHeroes,
            '29,17'(g) {
                g.write('{lightcyan}You have warped to {gray}Port City{lightcyan}.');
                g.goto(486, 4, 13);
            },
            '47,22'(g) {
                g.moveTo(79, 22);
                g.write('{lightcyan}A warp, wonder where it leads...');
            },
            '78,22'(g) {
                g.moveTo(47, 21);
                g.write('{lightcyan}Another warp, back to where it came from...');
            },
            '27,20': berries,
            '16,9': roshi,
            '32,7': sign('Village of Stone Valley...'),
            '65,17': travelOffice({ name: 'Stone Valley', destination: 'Hill Valley', cost: 20, to: [163, 47, 11] }),
            '26,14': door(725, 31, 15),
            '58,9': door(722, 39, 16),
            '43,17': door(723, 39, 16),
            '11,17': door(721, 41, 18),
        },
    },

    // The dragon's island
    86: {
        at: {
            ...tiles(['42,19', '43,19'], async (g) => {
                g.cls();
                g.print('{red}You depart from the island and head back to the mainland...', '', '{lightgreen}Press a key...');
                await g.key();
                g.goto(166, 46, 6);
            }),
            '43,10': say('{white}A sign says "{red}WARNING! {lightgreen}Stay away from the dragon!{white}"'),
        },
    },

    161: {
        at: {
            '51,13': sign('↓-- The Ghost town   --→  Hill Valley'),
        },
    },

    // Hill Valley
    163: {
        async show(g) {
            if (g.flags.hotelScene === 1) {
                g.flags.hotelScene = 2;
                await hotelRunner(g);
            }
        },
        at: {
            '44,10': say('{green}<-- Hill Valley Bank    Hill Valley Travel Office -->'),
            '47,10': travelOffice({ name: 'Hill Valley', destination: 'Stone Valley', cost: 30, to: [82, 65, 18] }),
            '50,18': healer,
            '27,10': bank('Welcome...'),
            '32,17': door(724, 41, 16),
        },
    },

    // The docks
    166: {
        at: tiles(['46,5', '47,5'], async (g) => {
            g.cls();
            g.print(
                '{lightgreen}You see a {yellow}boat {lightgreen}sitting by the docks.',
                '',
                '{lightgreen}You decide to get into the boat and head out to the',
                '{lightcyan}island {lightgreen}you can see from shore.',
                '',
                '{lightgreen}After a short trip.. you arive at the island.',
                '',
                '{lightgreen}Press any key...',
            );
            await g.key();
            g.goto(86, 42, 18);
        }),
    },

    // The ghost town
    242: {
        at: {
            '9,15': say('{lightgreen}An old and deserted town...'),
            '5,4': say('{white}An old deserted cabin...Locked..  In the window you see a rocking chair.'),
            '62,6'(g) {
                if (g.flags.oldManSeen) {
                    g.write('{white}The man peers at you through the window.');
                } else {
                    g.flags.oldManSeen = true;
                    g.write('{white}An old man is in the backyard. When he sees you he runs into his house.');
                }
            },
            '33,12': say('{yellow}The remnants of an old castle.. Nothing but ruins now...'),
            '21,19': say('{white}An old inn that is all borded up...'),
            '60,19': say('{yellow}What looks like an old hospital is locked.. In the window you see nothing..'),
        },
    },

    243: {
        at: {
            '36,16': castle,
        },
    },

    321: {
        at: {
            '71,9': say('{white}Moorish Village -->'),
            '60,17'(g) {
                g.moveTo(75, 12);
                g.write('{lightcyan}What appears to be a warp...');
            },
            '74,12'(g) {
                g.moveTo(61, 17);
                g.write('{lightcyan}What appears to be a warp, again...');
            },
        },
    },

    // The Moorish village
    322: {
        at: {
            ...tiles(['33,13', '32,14', '33,14', '32,13'], say('{lightcyan}What a wonderful place for a camp fire.')),
            '43,7': say('{white}The man, although interested at your presence, ignores you.'),
            ...tiles(['42,6', '45,6'], say('{white}Mooooooooooooo!!!')),
            '25,13': door(804, 40, 15),
            '42,12'(g) {
                g.write('{lightcyan}An old deserted hut.');
                g.goto(805, 40, 15);
            },
            '32,10': door(806, 40, 15),
        },
    },

    // Your house in Stone Valley
    721: {
        at: {
            '28,8'(g) {
                if (g.flags.toiletUsed) {
                    g.write('{lightred}Yuck!');
                } else {
                    g.write('{yellow}Ahh.. Much better!');
                    g.flags.toiletUsed = true;
                }
            },
            '32,11': say('{lightcyan}"Nice and Comphy.."'),
            '44,9': say('{yellow}"A bed..."'),
            '46,9': say('{yellow}"Another bed..."'),
            '48,9': say('{yellow}"And another bed..."'),
            '50,9': say('{yellow}"Fancy that... Another bed..."'),
            '52,9': say('{yellow}"Too many beds in this room..."'),
            '41,19': door(82, 11, 18),
            '33,17': oldWoman,
        },
    },

    722: {
        at: {
            '39,9': armourShop,
            '39,17': door(82, 58, 10),
        },
    },

    723: {
        at: {
            '39,9': weaponShop,
            '39,17': door(82, 43, 18),
        },
    },

    // The unfinished hotel in Hill Valley
    724: {
        async show(g) {
            if (g.flags.hotelScene === 0) {
                g.flags.hotelScene = 1;
                await hotelGuard(g);
            }
        },
        at: {
            async '45,14'(g) {
                g.cls();
                g.print(
                    '', '', '', '',
                    '{green}A sign on the table reads:',
                    '',
                    '{green}{center}--------------------------------------------------------------',
                    '',
                    '{yellow}{center}*** ATTENTION ***',
                    '',
                    '{green}{sp 10}To all newcomers:',
                    '',
                    '{green}{sp 10}This is the property of Veronica Construction.  She started',
                    '{green}{sp 10}building it some two hundred years ago, but decided not to',
                    '{green}{sp 10}finish it.',
                    '',
                    '{green}{sp 10}If she ever considers finishing the job, let me know.',
                    '',
                    '{green}{center}--------------------------------------------------------------',
                    '',
                    '{green}Press any key to continue...',
                );
                await g.key();
            },
            '41,17': door(163, 32, 18),
        },
    },

    725: {
        at: {
            '31,16': door(82, 26, 15),
            ...tiles(['23,9', '24,9'], say('{lightcyan}The bed feels hard and very unconfortable...')),
            '33,13'(g) {
                if (g.flags.foundMinigun) {
                    g.write('{lightcyan}An empty table.');
                    return;
                }
                g.flags.foundMinigun = true;
                // Like the original, the player takes it up at once (their old
                // weapon goes in their pack).
                g.give('minigun');
                g.equip('minigun');
                g.write('{lightcyan}You find a Minigun on the table, and arm yourself with it!');
            },
        },
    },

    // Inside the castle
    726: {
        at: {
            '41,22'(g) {
                g.flags.castleExitX = 41;
                g.goto(243, 36, 17);
            },
            '42,22'(g) {
                g.flags.castleExitX = 42;
                g.goto(243, 36, 17);
            },
            '17,18': door(801, 39, 18),
            '41,17': door(802, 41, 19),
            '42,17': door(802, 42, 19),
            '67,18': door(803, 39, 18),
        },
    },
    801: {
        at: {
            '39,19': door(726, 17, 19),
            '55,9': door(881, 53, 15),
        },
    },
    802: {
        at: {
            '41,20': door(726, 41, 18),
            '42,20': door(726, 42, 18),
        },
    },
    803: {
        at: {
            '39,19': door(726, 67, 19),
        },
    },
    881: {
        at: {
            '53,16': door(801, 55, 11),
        },
    },

    // Moorish houses
    804: {
        at: {
            '48,9': say('{lightcyan}The bed seems to be broken. Darn.'),
            '36,12': say('{lightcyan}"I am a moor.  You are not.  Get out of my house, NOW!"'),
            '40,16': door(322, 25, 14),
        },
    },
    805: {
        at: {
            '40,16': door(322, 42, 13),
        },
    },
    806: {
        at: {
            '43,11': say('{white}The moor looks at you, strangely...'),
            '32,9': say('{lightcyan}The bed feels very comfortable...'),
            '40,16': door(322, 32, 11),
        },
    },

    // Port City
    486: {
        at: {
            '3,13'(g) {
                g.write('{lightcyan}You have warped to {gray}Stone Valley{lightcyan}.');
                g.goto(82, 28, 17);
            },
            '15,11': bank('Welcome to {white}Port City Bank{green}.'),
            '3,9': cityGuards,
            '17,5': door(1041, 39, 17),
            '33,11': door(1042, 41, 18),
            '38,15': door(1043, 41, 18),
        },
    },

    // The rich couple's house
    1041: {
        at: {
            '39,18': door(486, 17, 6),
            ...tiles(
                ['38,11', '39,11', '40,11', '41,11', '37,12', '38,12', '39,12', '40,12', '41,12', '42,12',
                    '37,13', '38,13', '39,13', '40,13', '41,13', '42,13', '38,14', '39,14', '40,14', '41,14'],
                say('{white}A ball room floor!'),
            ),
            ...tiles(['30,13', '31,13', '32,13', '33,13', '34,12', '32,11', '33,11', '30,11'], say('{white}You take a chair!')),
            ...tiles(['22,13', '26,13'], nightstand),
            ...tiles(['23,17', '24,17', '25,17'], say('{white}What a wonderful view out this window!')),
            ...tiles(['23,13', '24,13', '25,13', '23,14', '24,14', '25,14'], say('{white}What a huge bed!')),
            '53,11': sink,
            '54,11': stove,
            '51,10': say('{lightgreen}My husband and I are soooo rich!!! oooOOhh!!!'),
            '31,11': say("{lightgreen}Yep, kid... It's all mine!!"),
        },
    },

    // The bar
    1042: {
        at: {
            '28,9': say("{lightcyan}You don't need to use this toilet."),
            '30,9': say('{white}"{yellow}That\'s all I do, is clean Clean CLEAN!  I HATE THIS JOB!{white}"'),
            ...tiles(['32,9', '54,9', '45,17'], sink),
            '51,11': say('{white}"{yellow}Man, I LOVE living in the city!  Have a drink, kid.{white}"'),
            '52,9': say('{white}The bartender says, "{yellow}What\'ll it be?{white}"'),
            '53,11': bar,
            '51,16': say('{white}"{yellow}He doesn\'t pay me enough to cook his food.{white}"'),
            '46,17': stove,
            '43,17': say('{white}A place to hang coats.'),
            ...tiles(['29,17', '32,17'], nightstand),
            ...tiles(['30,17', '31,17'], say('{lightcyan}A nicely sized bed.')),
            ...tiles(['29,11', '30,11'], say('{white}A walk in closet!!!!! Alright!')),
            '41,19': door(486, 33, 12),
        },
    },

    1043: {
        at: {
            '41,19': door(486, 38, 16),
        },
    },
};
