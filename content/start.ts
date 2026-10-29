// The player at the start of a new game, and the flags the scripts keep
// about what they've done.

import type { Player } from '@fq2ts/engine/player';
import { JOB_FLAGS, type JobFlags } from '@fq2ts/engine/jobs';
import type { Script as EngineScript, ScriptContext } from '@fq2ts/engine/script';
import { wyrmMaxHp } from './scripts/realm.ts';
import { envFlag } from './env.ts';

// (A type alias, not an interface, so that it fits the engine's FlagRecord.)
export type Flags = {
    toiletUsed: boolean;
    goldNearBarn: boolean;
    womanOffersCocoa: boolean;
    hasBankAccount: boolean;
    bankGold: number;
    // 0: not seen, 1: the guard scene has played, 2: the man has run off.
    hotelScene: number;
    ownsCastle: boolean;
    // Which of the castle's two doors the player last left by.
    castleExitX: number;
    oldManSeen: boolean;
    hadDrink: boolean;
    foundMinigun: boolean;
    // The day this player last fought the Wyrm (once a day).
    wyrmDay: string;
    // (And the player's delivery job, if they have one: scripts/jobs.ts.)
} & JobFlags;

// What belongs to the world, not one player: on a server, everyone shares
// it. (In single-player it's saved with the game.)
export type Shared = {
    // Everyone who has bought the castle (anyone can).
    castleOwners: readonly string[];
    // The Wyrm, in the mountains west of Stone Valley: its hitpoints (0
    // once slain), its level (it returns stronger), and the day it was
    // slain ("" while it lives).
    wyrmHp: number;
    wyrmLevel: number;
    wyrmSlainOn: string;
    // The hall of heroes: lasting deeds, oldest first.
    heroes: readonly string[];
};

export const shared: Shared = { castleOwners: [], wyrmHp: wyrmMaxHp(1), wyrmLevel: 1, wyrmSlainOn: '', heroes: [] };

// What scripts get, and what they are.
export type G = ScriptContext<Flags, Shared>;
export type Script = EngineScript<Flags, Shared>;

// A script with a few words on what it does, which the level editor shows
// on its tile.
export const about = (text: string, script: Script): Script => Object.assign(script, { about: text });

// Whether monsters attack at random on wild ground: FQ2_MONSTERS in .env (or
// the environment), for the game and the server alike. Off unless it's set.
export function monstersSetting(value = process.env['FQ2_MONSTERS']): boolean {
    return envFlag('FQ2_MONSTERS', { on: 'monsters attack at random on wild ground', off: 'no random monsters' }, value);
}

export const start: Player<Flags> = {
    name: '',
    sex: 'male',
    screen: 721,
    x: 33,
    y: 11,
    mapScreen: 82,
    hp: 250,
    maxHp: 250,
    gold: 50,
    strength: 10,
    defense: 10,
    exp: 0,
    items: {},
    weapon: null,
    armour: null,
    monsters: monstersSetting(),
    superhuman: false,
    flags: {
        toiletUsed: false,
        goldNearBarn: true,
        womanOffersCocoa: true,
        hasBankAccount: false,
        bankGold: 0,
        hotelScene: 0,
        ownsCastle: false,
        castleExitX: 41,
        oldManSeen: false,
        hadDrink: false,
        foundMinigun: false,
        wyrmDay: '',
        ...JOB_FLAGS,
    },
};

// Saves from before the item catalogue kept wildberries and the Port City
// pass as flags; they're items now. And every save follows FQ2_MONSTERS, not
// what it was saved with.
export function upgradeSave(saved: unknown, player: Player<Flags>): void {
    player.monsters = start.monsters;

    if (typeof saved !== 'object' || saved === null || !('flags' in saved)) {
        return;
    }

    const flags = saved.flags;
    if (typeof flags !== 'object' || flags === null) {
        return;
    }

    const berries = 'berries' in flags ? flags.berries : undefined;
    if (typeof berries === 'number' && berries > 0 && player.items['wildberries'] === undefined) {
        player.items['wildberries'] = Math.min(25, Math.trunc(berries));
    }

    if ('hasPortCityPass' in flags && flags.hasPortCityPass === true) {
        player.items['port-city-pass'] = 1;
    }
}
