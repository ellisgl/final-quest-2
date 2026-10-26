import { describe, expect, test } from 'bun:test';
import { monstersSetting, start, upgradeSave } from '../../content/start.ts';
import { newPlayer } from '../helpers.ts';

describe('upgradeSave', () => {
    test('turns old berry and pass flags into items', () => {
        const player = newPlayer();
        upgradeSave({ flags: { berries: 40, hasPortCityPass: true } }, player);
        expect(player.items).toEqual({ wildberries: 25, 'port-city-pass': 1 });
    });

    test('leaves newer saves alone', () => {
        const player = newPlayer({ items: { wildberries: 3 } });
        upgradeSave({ flags: { berries: 10, hasPortCityPass: false } }, player);
        expect(player.items).toEqual({ wildberries: 3 });
    });

    test.each([[null], [5], [{}], [{ flags: null }], [{ flags: { berries: 'lots' } }], [{ flags: { berries: 0 } }]])('ignores %p', (saved: unknown) => {
        const player = newPlayer();
        upgradeSave(saved, player);
        expect(player.items).toEqual({});
    });
});

describe('monstersSetting', () => {
    test.each([[''], ['0'], ['false'], ['No']])('%p is off', (value: string) => {
        expect(monstersSetting(value)).toBe(false);
    });

    test.each([['1'], ['true'], ['YES']])('%p is on', (value: string) => {
        expect(monstersSetting(value)).toBe(true);
    });

    test('names the settings it does have', () => {
        expect(() => monstersSetting('sometimes')).toThrow(
            [
                'FQ2_MONSTERS is "sometimes", which isn\'t one of its settings. In .env, use one of:',
                '  FQ2_MONSTERS=true   (or 1, yes, in any case): monsters attack at random on wild ground',
                '  FQ2_MONSTERS=false  (or 0, no, empty, or leave it out): no random monsters',
            ].join('\n'),
        );
    });
});

test('saves follow the setting, not what they were saved with', () => {
    const player = newPlayer({ monsters: !start.monsters });
    upgradeSave({ monsters: player.monsters, flags: {} }, player);
    expect(player.monsters).toBe(start.monsters);
});
