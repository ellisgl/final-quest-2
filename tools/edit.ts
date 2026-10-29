#!/usr/bin/env bun
// The level editor, for Final Quest 2's maps:  bun run edit [options]  (-h for them)

import { Terminal } from '@fq2ts/engine/terminal';
import { main as edit } from '@fq2ts/tools/edit';
import { fq2, screen } from './files.ts';

export const main = (args: readonly string[], term: Terminal = new Terminal({ size: screen }), log: (line: string) => void = console.log): Promise<number> => edit(args, fq2, term, log);

if (import.meta.main) {
    const term = new Terminal({ name: 'The level editor', size: screen });
    term.onInterrupt = () => {
        term.stop();
        process.exit(130);
    };
    try {
        process.exit(await main(process.argv.slice(2), term));
    } catch (err) {
        term.stop();
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
    }
}
