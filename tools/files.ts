// Final Quest 2's files, for the map tools.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readBestiary } from '@fq2ts/engine/combat';
import { World, mapSize } from '@fq2ts/engine/world';
import { readConfig } from '@fq2ts/engine/game';
import { contentTriggers, type GameFiles } from '@fq2ts/tools/game';
import content from '../content/index.ts';

const DATA = join(import.meta.dir, '..', 'data');
// The game's screen (config.json's size), for the editor's terminal.
export const { screen } = readConfig(JSON.parse(readFileSync(join(DATA, 'config.json'), 'utf8')));

export const fq2: GameFiles = {
    maps: join(DATA, 'maps'),
    screen,
    triggers: contentTriggers(content, World.load(join(DATA, 'maps'), mapSize(screen))),
    encounterTables: readBestiary(JSON.parse(readFileSync(join(DATA, 'monsters.json'), 'utf8'))).tableNames(),
};
