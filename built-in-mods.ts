// Made by tools/mods.ts (bun run mods:list): every mod in mods/, built into
// a compiled game, which can't import a mod's code at run time.

import type { BuiltInMods } from '@fq2ts/engine/mods';

export const BUILT_IN_MODS: BuiltInMods = {
    'wishing-well': () => import('./mods/wishing-well/mod.ts'),
};
