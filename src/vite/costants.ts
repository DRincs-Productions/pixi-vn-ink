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
 * ```ts
 * // VS Code extension reading the registered handlers
 * const res = await fetch("http://localhost:5173/__pixi-vn-ink/hashtag-commands");
 * const commands: InkHashtagCommandInfo[] = await res.json();
 * ```
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
 * ```ts
 * // VS Code extension reading the registered text-replace handlers
 * const res = await fetch("http://localhost:5173/__pixi-vn-ink/text-replaces");
 * const replaces: InkTextReplaceInfo[] = await res.json();
 * ```
 */
export const INK_DEV_API_TEXT_REPLACES = "/__pixi-vn-ink/text-replaces";

/**
 * Dev-server endpoint that exposes static information about this library instance, as an
 * {@link InkLibraryInfo} object.
 *
 * - `GET /__pixi-vn-ink/info` – returns `{ version, schemaUrl }`, where `version` is this
 *   `@drincs/pixi-vn-ink` package's own version and `schemaUrl` is the `PIXIVNJSON_SCHEMA_URL`
 *   (from `@drincs/pixi-vn-json/constants`) embedded as `$schema` in every exported `PixiVNJson`
 *   document.
 * - Read-only: unlike {@link INK_DEV_API_HASHTAG_COMMANDS} / {@link INK_DEV_API_TEXT_REPLACES},
 *   there is no `POST` — both values are static per plugin instance and don't depend on
 *   SSR-loading the user's content, so there's nothing for {@link setupInkHmrListener} to push.
 *
 * @example
 * ```ts
 * // VS Code extension reading the library version / schema URL
 * const res = await fetch("http://localhost:5173/__pixi-vn-ink/info");
 * const { version, schemaUrl }: InkLibraryInfo = await res.json();
 * ```
 */
export const INK_DEV_API_INFO = "/__pixi-vn-ink/info";
