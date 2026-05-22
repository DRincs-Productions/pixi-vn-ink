/**
 * Dev-server endpoint that exposes and accepts the list of registered
 * {@link HashtagCommands} handlers as {@link InkHashtagCommandInfo} objects.
 *
 * - `GET  /__pixi-vn-ink/hashtag-commands` – returns the stored `InkHashtagCommandInfo[]` as JSON.
 * - `POST /__pixi-vn-ink/hashtag-commands` – replaces the stored list with the JSON body
 *   (`InkHashtagCommandInfo[]`). Called automatically by {@link setupInkHmrListener} on
 *   startup and after each HMR update.
 * - `InkHashtagCommandInfo.validation` serializes the original validation rule:
 *   - `{ type: "regexp", source, flags }`
 *   - `{ type: "zod", schema }` (JSON Schema generated from Zod)
 *   - `{ type: "literal", value }`
 *
 * @example
 * // VS Code extension reading the registered handlers
 * const res = await fetch("http://localhost:5173/__pixi-vn-ink/hashtag-commands");
 * const commands: InkHashtagCommandInfo[] = await res.json();
 */
export const INK_DEV_API_HASHTAG_COMMANDS = "/__pixi-vn-ink/hashtag-commands";

/**
 * Dev-server endpoint that exposes and accepts the list of registered
 * {@link TextReplaces} handlers as {@link InkTextReplaceInfo} objects.
 *
 * - `GET  /__pixi-vn-ink/text-replaces` – returns the stored `InkTextReplaceInfo[]` as JSON.
 * - `POST /__pixi-vn-ink/text-replaces` – replaces the stored list with the JSON body
 *   (`InkTextReplaceInfo[]`). Called automatically by {@link setupInkHmrListener} on
 *   startup and after each HMR update.
 * - `InkTextReplaceInfo.validation` serializes the original validation rule:
 *   - `{ type: "regexp", source, flags }`
 *   - `{ type: "zod", schema }` (JSON Schema generated from Zod)
 *   - `{ type: "literal", value }` for string modes like `"all"` / `"characterId"`
 *
 * @example
 * // VS Code extension reading the registered text-replace handlers
 * const res = await fetch("http://localhost:5173/__pixi-vn-ink/text-replaces");
 * const replaces: InkTextReplaceInfo[] = await res.json();
 */
export const INK_DEV_API_TEXT_REPLACES = "/__pixi-vn-ink/text-replaces";

/**
 * Dev-server endpoint that receives the list of registered characters from the client.
 *
 * - `POST /__pixi-vn-ink/characters` – called by {@link setupInkHmrListener} with the current
 *   `CharacterInterface[]`. When the list differs from the previously stored one, `vitePluginInk`
 *   debounces a re-export of the Ink JSON files so the compiled output reflects the correct
 *   character set.
 */
export const INK_DEV_API_CHARACTERS = "/__pixi-vn-ink/characters";
