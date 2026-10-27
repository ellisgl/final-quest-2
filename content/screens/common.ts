// Triggers used on many screens.

import { strip } from '@fq2ts/engine/text';
import { about, type Script } from '../start.ts';

export const say = (text: string): Script => about(`says: ${strip(text)}`, (g) => g.write(text));
export const door = (screen: number, x: number, y: number): Script => about(`door to screen ${screen} at ${x},${y}`, (g) => g.goto(screen, x, y));

export const sign = (text: string): Script => about(`sign: ${strip(text)}`, say(`{green}The Sign Reads:  ${text}`));
export const nightstand = say('{white}A nightstand.');
export const sink = say('{white}A sink.');
export const stove = say('{white}A stove.');
