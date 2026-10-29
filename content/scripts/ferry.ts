// The ferry: boats between the Docks, the Dragon's Island and Port City's
// Boathouse. The island run is free, as it always was; Port City costs a
// fare, and its guards won't let anyone off without a pass.

import { about, type G, type Script } from '../start.ts';

// What a trip to Port City (or back) costs.
export const PORT_CITY_FARE = 40;

type Landing = 'docks' | 'island' | 'port';

const LANDINGS: Record<Landing, { name: string; to: readonly [number, number, number] }> = {
    docks: { name: 'the Docks', to: [166, 46, 6] },
    island: { name: "the Dragon's Island", to: [86, 42, 18] },
    port: { name: 'Port City', to: [486, 49, 5] },
};

const fare = (from: Landing, to: Landing): number => (from === 'port' || to === 'port' ? PORT_CITY_FARE : 0);

// The ferry from `here`, with what the player sees there first.
export const ferry = (here: Landing, ...greeting: string[]): Script =>
    about(`ferry from ${LANDINGS[here].name}`, async function (g: G) {
        const routes = (Object.keys(LANDINGS) as Landing[]).filter((to) => to !== here);
        g.cls();
        g.print(...greeting, ...(greeting.length ? [''] : []), '{white}"{yellow}Where to?{white}" asks the ferryman.', '');
        const picked = routes[await g.choice([
            ...routes.map((to) => `${LANDINGS[to].name.replace(/^./, (c) => c.toUpperCase())}${fare(here, to) ? ` ($${fare(here, to)})` : ' (free)'}...`),
            'Stay here...',
        ])];
        if (!picked) {
            return;
        }

        if (picked === 'port' && !g.has('port-city-pass')) {
            g.print('', '{white}"{yellow}Port City? They won\'t let you off the boat without a pass, friend.{white}"', '', '{lightgreen}Press a key...');
            await g.key();
            return;
        }

        if (!(await g.spend(fare(here, picked)))) {
            return;
        }

        g.cls();
        g.print(`{lightgreen}You board the ferry, and after a while on the water you arrive at {white}${LANDINGS[picked].name}{lightgreen}.`, '', '{lightgreen}Press a key...');
        await g.key();
        g.goto(...LANDINGS[picked].to);
    });
