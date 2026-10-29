// Jobs (as LORD II's deliveries): four townspeople give them, and take
// them. The old woman in your house, the nurse at Hill Valley's healer's
// hut, the man by the fire in the Moorish village, and Port City's
// bartender each hand out things to take to one of the others.

import { JobBoard, type JobGiver } from '@fq2ts/engine/jobs';
import type { Flags, Shared } from '../start.ts';

// "the healer" at the start of a sentence: "The healer".
const capital = (text: string): string => text.replace(/^./, (c) => c.toUpperCase());
const says = (text: string): string => `{white}"{yellow}${text}{white}"`;

const GIVERS: readonly JobGiver[] = [
    {
        id: 'woman',
        name: 'the old woman',
        town: 'Stone Valley',
        lines: {
            offer: ({ to, item, pay }) => `{white}The old woman squints at you. ${says(`You! Take this ${item} to ${to.name} in ${to.town}. I'll give you $${pay}. Or was it rats? Go on!`)}`,
            declined: says('Then get out of my home!!!'),
            none: says("I gave you something already, didn't I? Go away!"),
            thanks: ({ item }) => `{white}The old woman snatches the ${item}. ${says('Mine! Mine!  ...What is it?')}`,
            waiting: ({ to, item }) => says(`Why is my ${item} still here?!  ${capital(to.name)} in ${to.town}!  GO!`),
        },
    },
    {
        id: 'nurse',
        name: "the nurse at the healer's hut",
        town: 'Hill Valley',
        lines: {
            offer: ({ to, item, pay }) => `{white}The nurse lowers her voice. ${says(`This ${item} has to get to ${to.name} in ${to.town}. We can pay $${pay} when it's there.`)}`,
            declined: says('Never mind. Take a number.'),
            none: says("Nothing more today, I'm afraid. Come back tomorrow."),
            thanks: ({ item }) => `{white}The nurse takes the ${item}. ${says("Just what we needed. You've done us a kindness.")}`,
            waiting: ({ to, item }) => says(`Is the ${item} still with you? ${capital(to.name)} in ${to.town} needs it!`),
        },
    },
    {
        id: 'moor',
        name: 'the man by the fire',
        town: 'the Moorish Village',
        lines: {
            offer: ({ to, item, pay }) => `{white}The man looks up at last. ${says(`You. Outsider. Take this ${item} to ${to.name} in ${to.town}. $${pay}, when it is done.`)}`,
            declined: '{white}The man goes back to ignoring you.',
            none: '{white}The man ignores you. Perhaps tomorrow.',
            thanks: ({ item }) => `{white}The man takes the ${item}, and nods. For him, that's a lot.`,
            waiting: ({ to, item }) => says(`${capital(to.name)} in ${to.town} still has no ${item}. Why are you here?`),
        },
    },
    {
        id: 'bartender',
        name: 'the bartender',
        town: 'Port City',
        lines: {
            offer: ({ to, item, pay }) => `{white}The bartender leans over. ${says(`Got ${/^[aeiou]/.test(item) ? 'an' : 'a'} ${item} for ${to.name} in ${to.town}. $${pay} if it gets there in one piece.`)}`,
            declined: says('Your loss, kid. Have a drink.'),
            none: says("I've got nothing else for you today."),
            thanks: ({ item }) => `{white}The bartender tucks the ${item} under the bar. ${says('Good work, kid.')}`,
            waiting: ({ to, item }) => says(`That ${item} won't walk to ${to.town} on its own, kid.`),
        },
    },
];

export const jobs = new JobBoard<Flags, Shared>({ givers: GIVERS });
