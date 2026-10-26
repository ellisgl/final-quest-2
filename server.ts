#!/usr/bin/env bun
// Final Quest 2's multiplayer server:  bun run server [options]  (-h for them)

import { join } from 'node:path';
import { runServer } from '@fq2ts/server/cli';
import { SettingError } from './content/env.ts';

// The content reads its .env settings as it loads; a wrong one says how to
// fix it, without a stack trace.
const content = await import('./content/index.ts').then(
    (m) => m.default,
    (err: unknown) => {
        if (!(err instanceof SettingError)) {
            throw err;
        }

        console.error(err.message);
        process.exit(1);
    },
);

await runServer({ content, name: 'Final Quest 2', gameData: join(import.meta.dir, 'data'), database: 'fq2.sqlite' });
