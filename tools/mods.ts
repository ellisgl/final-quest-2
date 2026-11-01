#!/usr/bin/env bun
// Writes built-in-mods.ts, which lists every mod in mods/ so that a
// compiled game (perry compile fq2.ts) has their code built in:
//   bun run mods:list
// Run it after adding or removing a mod folder (a test checks the list is
// up to date). Which mods run is still FQ2_ENABLE_MODS's choice.

import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const ROOT = join(import.meta.dirname, '..');
export const LIST = join(ROOT, 'built-in-mods.ts');

// The mod folders in `dir` (those with a mod.ts or mod.js), sorted.
export function modFolders(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && ['mod.ts', 'mod.js'].some((file) => existsSync(join(dir, entry.name, file))))
        .map((entry) => entry.name)
        .sort();
}

// built-in-mods.ts for the mods in `dir`.
export function builtInModsSource(dir: string): string {
    const lines = modFolders(dir).map((name) => {
        const file = existsSync(join(dir, name, 'mod.ts')) ? 'mod.ts' : 'mod.js';
        return `    '${name}': () => import('./mods/${name}/${file}'),\n`;
    });
    return [
        '// Made by tools/mods.ts (bun run mods:list): every mod in mods/, built into\n',
        '// a compiled game, which can\'t import a mod\'s code at run time.\n',
        '\n',
        'import type { BuiltInMods } from \'@fq2ts/engine/mods\';\n',
        '\n',
        `export const BUILT_IN_MODS: BuiltInMods = {${lines.length ? '\n' + lines.join('') : ''}};\n`,
    ].join('');
}

if (import.meta.main) {
    const source = builtInModsSource(join(ROOT, 'mods'));
    writeFileSync(LIST, source);
    console.log(`Wrote built-in-mods.ts: ${modFolders(join(ROOT, 'mods')).join(', ') || 'no mods'}.`);
}
