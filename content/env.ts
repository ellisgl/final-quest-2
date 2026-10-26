// Settings the game reads from .env (or the environment), for the game and
// the server alike.

const ON = ['true', '1', 'yes'];
const OFF = ['false', '0', 'no'];

// An on/off setting. `on` and `off` say what each does, for the error that
// lists them when the setting is something else.
export function envFlag(name: string, { on, off }: { on: string; off: string }, value = process.env[name]): boolean {
    const v = (value ?? '').trim().toLowerCase();
    if (v === '' || OFF.includes(v)) {
        return false;
    }

    if (ON.includes(v)) {
        return true;
    }

    const line = (values: string[], also: string): string => `${name}=${values[0]}`.padEnd(name.length + 8) + `(or ${[...values.slice(1), also].join(', ')}): `;
    throw new SettingError(
        [
            `${name} is "${value}", which isn't one of its settings. In .env, use one of:`,
            `  ${line(ON, 'in any case')}${on}`,
            `  ${line(OFF, 'empty, or leave it out')}${off}`,
        ].join('\n'),
    );
}

// A setting that's wrong: the message says how to fix it, so it's shown
// without a stack trace.
export class SettingError extends Error {
    public override name = 'SettingError';
}
