import { CharacterBaseModel, PixiVNJson, saveCharacter } from '@drincs/pixi-vn';
import { expect, test } from 'vitest';
import { convertInkText } from '../src/functions';

test('Assign dialogue to a character', async () => {
    let alice = new CharacterBaseModel("alice", {
        name: "Alice"
    })
    saveCharacter(alice)
    let expected: PixiVNJson = {
        labels: {
            start: [
                {
                    dialogue: {
                        character: "alice",
                        text: "Hello, world!",
                    },
                },
                {
                    end: "label_end",
                },
            ],
        }
    }
    let res = convertInkText(`
=== start
alice: Hello, world!
-> DONE
`);
    expect(res).toEqual(expected);
});
