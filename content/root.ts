// The folder the game's data/ (and single-player saves/) are in.
//
// Run with Bun, that's this project's folder. Compiled with Perry, it's the
// folder the binary is in, so the binary can be copied anywhere along with
// data/ (Perry's import.meta.dirname is fixed when it compiles, the folder
// it was built in).
import { dirname, join } from 'node:path';

export const ROOT = process.versions['perry'] !== undefined ? dirname(process.execPath) : join(import.meta.dirname, '..');
