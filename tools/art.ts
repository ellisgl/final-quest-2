#!/usr/bin/env bun
// Maps in Icy Draw, for Final Quest 2's maps:  bun run art export|import [screens]  (-h for more)

import { main as art } from '@fq2ts/tools/art';
import { fq2 } from './files.ts';

export const main = (args: readonly string[], log: (line: string) => void = console.log): number => art(args, fq2, log);

if (import.meta.main) {
    try {
        process.exit(main(process.argv.slice(2)));
    } catch (err) {
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
    }
}
