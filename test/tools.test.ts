// The map tools on Final Quest 2's own maps and content.

import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderHtml } from '@fq2ts/tools/html';
import { contentTriggers } from '@fq2ts/tools/game';
import { PAGES } from '@fq2ts/tools/editor/picker';
import { main } from '../tools/view.ts';
import content from '../content/index.ts';
import { gameWorld, tempDir } from './helpers.ts';

test('renders the whole game world', () => {
    const html = renderHtml(gameWorld(), { triggers: contentTriggers(content, gameWorld()) });
    expect(html.match(/<figure/g)).toHaveLength(gameWorld().screens().length);
    expect(html).toContain('Screen 82: Stone Valley (town)');
    expect(html).toContain('title="Trigger at 29,17"');
});

test("contentTriggers lists the game's trigger tiles", () => {
    const triggers = contentTriggers(content, gameWorld());
    expect(triggers.get(82)?.has('29,17')).toBe(true);
    expect(triggers.get(1)).toBeUndefined();
});

test('every character in the game\'s maps is on a page', () => {
    const world = gameWorld();
    const onPages = new Set(PAGES.flatMap((p) => p.chars));
    for (const screen of world.screens()) {
        for (let y = 1; y <= 22; y++) {
            for (let x = 1; x <= 79; x++) {
                const { ch } = world.tile(screen, x, y);
                if (ch !== ' ') {
                    expect(onPages.has(ch)).toBe(true);
                }
            }
        }
    }
});

test('bun run view writes a page of its maps, with its triggers', () => {
    const out = join(tempDir(), 'w.html');
    expect(main(['--out', out, '--screens', '82'], () => undefined)).toBe(0);
    expect(readFileSync(out, 'utf8')).toContain('title="Trigger at 29,17"');
});
