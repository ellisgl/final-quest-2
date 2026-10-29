// The arena by the castle (as LORD II's): pay to fight a gladiator, and get
// double back if you win. A gladiator is made from the player's own
// strength, gear and hitpoints, give or take, so every fight is a near
// thing whatever their level. Win, and you can go again; lose (or run),
// and the crowd won't have you back until tomorrow. A long run of wins
// makes the news.

import type { Monster } from '@fq2ts/engine/combat';
import { at } from '@fq2ts/engine/assert';
import { escapeMarkup } from '@fq2ts/engine/text';
import type { G } from '../start.ts';
import { today } from './realm.ts';

// What a fight costs; a win pays double.
export const ARENA_STAKE = 50;
// Wins in a row that make the news.
export const ARENA_NEWS_RUN = 3;
// The hitpoints a beaten player is left with.
const BEATEN_HP = 5;

const CONTINUE = '{lightgreen}<{green}Continue{lightgreen}>';

const GLADIATORS: readonly { name: string; pronoun: 'he' | 'she'; weapon: string }[] = [
    { name: 'Brutus', pronoun: 'he', weapon: 'net and trident' },
    { name: 'Big Marla', pronoun: 'she', weapon: 'spiked club' },
    { name: 'the Iron Bull', pronoun: 'he', weapon: 'horned helmet' },
    { name: 'Grimtooth', pronoun: 'he', weapon: 'rusty axe' },
    { name: 'Old Scar', pronoun: 'he', weapon: 'two short swords' },
    { name: 'Vex the Quick', pronoun: 'she', weapon: 'whip' },
];

// How much stronger (or weaker) than the player a gladiator hits, and
// takes blows, and how many more (or fewer) hitpoints it has.
const ATTACK = [0.7, 0.9, 1, 1.1, 1.3];
const DEFENSE = [0.8, 1, 1.2];
const HITPOINTS = [0.9, 1, 1.1];

// A gladiator for this player: their own stats, give or take.
export function gladiator(g: G): Monster {
    const pick = <T>(list: readonly T[]): T => at(list, g.random(list.length) - 1);
    const { name, pronoun, weapon } = pick(GLADIATORS);
    const power = Math.max(1, Math.round((g.strength + (g.weapon?.power ?? 0)) * pick(ATTACK)));
    return {
        name,
        says: `${name} raises ${pronoun === 'she' ? 'her' : 'his'} ${weapon} to the crowd.`,
        pronoun,
        hp: Math.max(1, Math.round(g.maxHp * pick(HITPOINTS))),
        defense: Math.round((g.defense + (g.armour?.power ?? 0)) * pick(DEFENSE)),
        gold: ARENA_STAKE * 2,
        exp: 5,
        attacks: [{ text: `swings ${pronoun === 'she' ? 'her' : 'his'} ${weapon} at you`, power }],
        kill: '',
        after: {},
    };
}

export async function arena(g: G): Promise<void> {
    let wins = 0;
    const end = (): void => {
        if (wins >= ARENA_NEWS_RUN) {
            g.news(`{yellow}${escapeMarkup(g.name)} won ${wins} fights in a row at the arena.`);
        }
    };

    for (;;) {
        g.cls();
        g.print(
            '{lightred}The Arena',
            '',
            '{green}Behind the castle walls, a crowd of nobles and peasants cheers on two fighters',
            '{green}in the sand. A man in a red cloak, who seems to run the place, looks you over.',
            '',
            `{white}"{yellow}${wins ? 'Back for more? The crowd loves you!' : 'You look like a fighter. Care to try your luck?'}{white}"`,
            '',
        );
        const choice = await g.choice(['Ask about the rules...', `Fight ($${ARENA_STAKE})...`, 'Leave...']);
        g.cls();
        if (choice === 0) {
            g.print(
                `{white}"{yellow}Simple. You pay $${ARENA_STAKE} and fight one of my gladiators. Win, and you get`,
                `{yellow}$${ARENA_STAKE * 2} back, and you can go again. Lose, or run, and the crowd won't want`,
                '{yellow}to see you again until tomorrow.{white}"',
                '',
                CONTINUE,
            );
            await g.key();
            continue;
        }

        if (choice !== 1) {
            end();
            return;
        }

        if (g.flags.arenaLostDay === today()) {
            g.print('{white}"{yellow}You\'ve been beaten here once today. The crowd wants winners. Come back tomorrow.{white}"', '', CONTINUE);
            await g.key();
            continue;
        }

        if (g.gold < ARENA_STAKE) {
            g.print(`{white}"{yellow}No $${ARENA_STAKE}? Then you're no gladiator. Hah!{white}"`, '', CONTINUE);
            await g.key();
            continue;
        }

        g.gold -= ARENA_STAKE;
        const opponent = gladiator(g);
        g.print(`{green}You step out onto the sand. The man in the red cloak calls out: {white}"{yellow}${opponent.name}!{white}"`, '');
        const result = await g.fight(opponent, {
            defeat: (player) => {
                player.hp = Math.min(player.hp, BEATEN_HP);
                return `${opponent.name} stands over you, and the crowd boos. Better luck tomorrow...`;
            },
            victory: `{green}The crowd roars as you beat {lightred}${opponent.name}{green}!  You're paid {yellow}$${ARENA_STAKE * 2}{green}.`,
        });

        if (result === 'won') {
            wins++;
            continue;
        }

        g.flags.arenaLostDay = today();
        if (result === 'fled') {
            g.cls();
            g.print('{green}You turn and run, and scramble over the arena wall.', '', '{white}"{yellow}Coward! Coward!{white}" the crowd chants.', '', CONTINUE);
            await g.key();
        }
        end();
        return;
    }
}
