// Town services: berries, banks, travel offices, Master Roshi and the healer.

import type { ItemDef } from '@fq2ts/engine/items';
import { about, type G, type Script } from '../start.ts';
import { jobs } from './jobs.ts';

const CONTINUE = '{lightgreen}<{green}Continue{lightgreen}>';

// "a Stick" or "nothing", in colour.
const gear = (item: ItemDef | null): string => (item ? `a {lightmagenta}${item.name}{green}` : '{lightmagenta}nothing{green}');

// Five at a time, up to 25.
export function berries(g: G): void {
    const have = g.count('wildberries');
    if (have === 0) {
        g.write('{white}You pick some wildberries...');
        g.give('wildberries', 5);
    } else if (have < 25) {
        g.write('{white}You pick some more wildberries...');
        g.give('wildberries', Math.min(5, 25 - have));
    } else {
        g.write("{white}Don't you think you have enough?");
    }
}

// Both banks work the same way; only the greeting differs.
export const bank = (greeting: string): Script =>
    async function (g) {
        const f = g.flags;
        if (!f.hasBankAccount) {
            g.cls();
            g.print("{green}You don't have an account with us yet.  Do you wish to start one?");
            if ((await g.choice(['Yes...', 'No...'])) !== 0) {
                return;
            }
            f.hasBankAccount = true;
        }

        for (;;) {
            g.cls();
            g.print(`{green}${greeting} You have {yellow}$${f.bankGold}{green} in your account.`, `{green}You have {yellow}$${g.gold}{green} on hand.`);
            const choice = await g.choice([
                { text: 'Deposit...', show: g.gold > 0 },
                { text: 'Withdraw...', show: f.bankGold > 0 },
                'Close Account...',
                'Get out of here...',
            ]);

            if (choice === 0) {
                g.cls();
                g.print(
                    `{green}Your account has {yellow}$${f.bankGold}{green}.`,
                    `{green}You have {yellow}$${g.gold}{green}.`,
                    '',
                    '{green}How much do you want to deposit?',
                    '{green}Press 1 to Deposit all your gold on hand.',
                );
                const amount = await g.number({ x: 1, y: 6, length: 15 });
                if (amount === 1) {
                    f.bankGold += g.gold;
                    g.gold = 0;
                } else if (amount > 0 && amount <= g.gold) {
                    g.gold -= amount;
                    f.bankGold += amount;
                }
            } else if (choice === 1) {
                g.cls();
                g.print(
                    `{green}Your account has {yellow}$${f.bankGold}{green}.`,
                    `{green}You have {yellow}$${g.gold}{green}.`,
                    '',
                    '{green}How much do you want to withdraw?',
                    '{green}Press 1 to withdraw all money in bank.',
                );
                const amount = await g.number({ x: 1, y: 6, length: 15 });
                if (amount === 1) {
                    g.gold += f.bankGold;
                    f.bankGold = 0;
                } else if (amount > 0 && amount <= f.bankGold) {
                    g.gold += amount;
                    f.bankGold -= amount;
                }
            } else if (choice === 2) {
                g.cls();
                g.print('{green}Are you sure you want to close your account??');
                if ((await g.choice(['Yes..', 'No..'])) === 0) {
                    g.gold += f.bankGold;
                    f.bankGold = 0;
                    f.hasBankAccount = false;
                    return;
                }
            } else {
                return;
            }
        }
    };

interface TravelOffice {
    name: string;
    destination: string;
    cost: number;
    // [screen, x, y]
    to: readonly [number, number, number];
}

export const travelOffice = ({ name, destination, cost, to }: TravelOffice): Script =>
    about(`travel office: $${cost} to ${destination} (screen ${to[0]} at ${to[1]},${to[2]})`, async function (g) {
        for (;;) {
            g.cls();
            g.print(
                `{center}{green}${name} Travel Office`,
                '{x 27}' + '{lightgreen}-{green}='.repeat(13) + '{lightgreen}-',
                '',
                '{white}"{green}Welcome to the Travel office,{white}" says the woman behind the desk.',
            );
            if ((await g.choice([`Depart to ${destination}...`, 'Leave the Office...'])) !== 0) {
                return;
            }

            g.cls();
            g.print(`{green}It will cost {yellow}$${cost}{green} to goto ${destination}.`, `{green}You have {yellow}$${g.gold}{green}.`);
            if ((await g.choice(['Pay..', "Don't Pay.."])) !== 0) {
                continue;
            }
            if (!(await g.spend(cost))) {
                continue;
            }
            g.goto(...to);
            return;
        }
    });

export async function roshi(g: G): Promise<void> {
    const stats = (): string[] => [
        '{green}You have:',
        '',
        `{white}${g.exp}{green} experience points...`,
        `{lightred}${g.hp}{green} hitpoints...`,
        `{lightcyan}${g.strength}{green} attack points...`,
        `{lightcyan}${g.defense}{green} defense points...`,
        `{green}You have ${gear(g.weapon)} and ${gear(g.armour)}.`,
        '',
    ];

    g.cls();
    const hadPass = g.has('port-city-pass');
    if (!hadPass) {
        g.print('{yellow}A Man Says:', `{green}Psst, hey, ${g.bySex('boy', 'girl')}!! If you beat me, I'll give you a pass to {gray}Port City{green}!`, '', ...stats());
    } else {
        g.print('{yellow}Master Roshi says:', '{green}Welcome back!! Ready for a rematch!!!!', '', ...stats());
    }
    if ((await g.choice(['Challenge Him', 'Leave'])) !== 0) {
        return;
    }

    const result = await g.fight(g.monster('master-roshi'));
    g.cls();
    if (result !== 'won') {
        g.print('{green}Sorry... You loose.. try again later...');
        await g.key();
        return;
    }

    g.maxHp += 25;
    g.healFull();
    g.strength += 10;
    g.defense += 10;
    const rewards = [
        `{green}You get {white}100 {green}more experience points for a total of {white}${g.exp}{green}.`,
        `{green}You get {lightred}25 {green}more hitpoints for a total of {lightred}${g.hp}{green}.`,
        `{green}You get {lightcyan}10 {green}extra attack points for a total of {lightcyan}${g.strength}{green}.`,
        `{green}You get {lightcyan}10 {green}extra defense points for a total of {lightcyan}${g.defense}{green}.`,
        '',
    ];
    if (!hadPass) {
        g.print(
            `{yellow}You are a great ${g.bySex('man', 'woman')}.. YOU HAVE BESTED ME!`,
            '',
            ...rewards,
            '{green}AND, as promised, your {yellow}PASS {green}to Port City.  Good Luck! Come back anytime!',
            'Press any key...',
        );
    } else {
        g.print('{yellow}Hey!! You beat me again!', '', ...rewards, 'Press any key...');
    }
    if (!hadPass) {
        g.give('port-city-pass');
    }
    await g.key();
}

// Healing costs $2 per hitpoint.
export async function healer(g: G): Promise<void> {
    for (;;) {
        g.cls();
        g.print(
            '{green}-{lightgreen}='.repeat(10) + " {lightgreen}Healer's Hut " + '{lightgreen}={green}-'.repeat(11),
            '',
            '{green}You walk into the healers hut and find that the place already quite full.',
            '{green}You take a number, and then a seat.  Finally, you hear your number called.',
            '',
            '{green}The nurse says, "{white}How may we help you?{green}"',
            '',
        );
        const choice = await g.choice(['Ask for a complete heal...', 'Ask for some damage, but not all, to be healed...', jobs.label(g, 'nurse'), 'Leave the hut...']);
        if (choice === 2) {
            await jobs.talk(g, 'nurse');
            continue;
        }

        if (choice === 0) {
            const cost = (g.maxHp - g.hp) * 2;
            g.cls();
            g.print(
                '{green}It costs {yellow}2${green} for every hitpoint healed.',
                '',
                `{green}You have {white}${g.hp} {green}hitpoints.`,
                `{green}It will cost you {yellow}${cost}{yellow} {green}to be completely healed.`,
                '',
                '{green}Continue?',
            );
            if ((await g.choice(['Yes..', 'No..'])) !== 0) {
                continue;
            }
            if (g.hp >= g.maxHp) {
                g.print('', '', '', "{green}You don't need to be healed!!!  You are perfectly ok!!!", CONTINUE);
                await g.key();
                return;
            }
            if (g.gold >= cost) {
                g.gold -= cost;
                g.healFull();
                g.print('', '', '', '{lightcyan}All done!!! {green}You are now completely healed.', CONTINUE);
                await g.key();
                return;
            }
            g.print('', '', '', "{red}Your don't exactly have enough money for this...", '{green}You think to yourself, "Maybe later..."', CONTINUE);
            await g.key();
            continue;
        }

        if (choice === 1) {
            const affordable = Math.min(Math.trunc(g.gold / 2), g.maxHp - g.hp);
            g.cls();
            g.print(
                `{green}You have {white}${g.hp} {green}hitpoint(s).  It costs {yellow}$2{green} For every hitpoint`,
                `{green}we heal.  With your current funds, we could heal up to {white}${affordable} {green}hitpoints.`,
                '',
                '{green}Please input the amount of hitpoints to heal. Enter {lightgreen}({yellow}1{lightgreen}) {green}for all possible.:',
            );
            let amount = await g.number({ x: 1, y: 5, length: 10 });

            if (g.hp >= g.maxHp) {
                g.cls();
                g.print("{green}I'm sorry, but you do not need to be healed! Maybe another time...", '', CONTINUE);
                await g.key();
                continue;
            }
            if (amount > affordable) {
                g.cls();
                g.print("{green}I'm sorry, but you do not have the funds.  Maybe another time...", '', CONTINUE);
                await g.key();
                continue;
            }
            if (amount <= 0) {
                continue;
            }
            if (amount === 1) {
                amount = affordable;
            }
            g.hp += amount;
            g.gold -= amount * 2;
            g.print('', '', '{lightcyan}All Done!!! {green}You are now healed.', CONTINUE);
            await g.key();
            return;
        }

        return;
    }
}
