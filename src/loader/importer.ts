import { HashtagCommands } from "@/handlers";
import { convertInkToJson } from "@/loader/ink-to-pixivn";
import type { CharacterIdSource, LoaderSharedType } from "@/loader/type";
import { init, type PixiVNJson } from "@drincs/pixi-vn-json";
import { importPixiVNJson } from "@drincs/pixi-vn-json/interpreter";

/**
 * This function imports string or array of strings written in ink language into the Pixi’VN engine.
 * @example
 * ```ts title="main.ts"
 * import { importInkText } from 'pixi-vn'
 * importInkText(`
 * === back_in_london ===
 * Hello, World!
 * `).then(() => {
 *     GameStepManager.callLabel("back_in_london", {})
 * })
 * ```
 * @param texts string or array of strings written in ink language
 * @param options.characters characters recognised when splitting `characterId: text` speakers, in
 * addition to `RegisteredCharacters` (pass when importing before characters are registered)
 * @returns
 */
export async function importInkText(
    texts: string | string[],
    options: { characters?: readonly CharacterIdSource[] } = {},
): Promise<string[]> {
    if (!Array.isArray(texts)) {
        texts = [texts];
    }
    init();
    const shared: LoaderSharedType = {
        functions: [],
        enums: {},
        characters: options.characters,
    };
    const promises = texts.map(async (text) => {
        const data = convertInkToJson(text, shared);
        if (data) {
            await importPixiVNJson(data, {
                operationStringConvert: HashtagCommands.run,
                skipEmptyDialogs: true,
            });
        }
        return text;
    });
    return await Promise.all(promises);
}

/**
 * This function imports data in PixiVNJson format into the Pixi’VN engine.
 * @param data data in PixiVNJson format
 * @returns the same data passed as parameter
 */
export async function importJson(data: PixiVNJson | PixiVNJson[]) {
    init();
    return await importPixiVNJson(data, {
        operationStringConvert: HashtagCommands.run,
        skipEmptyDialogs: true,
    });
}
