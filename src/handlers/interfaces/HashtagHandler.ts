import type { StepLabelPropsType } from "@drincs/pixi-vn";
import type { PixiVNJsonLabelStep, PixiVNJsonOperation } from "@drincs/pixi-vn-json/schema";
import type { ZodType } from "zod";

/**
 * A handler function invoked for each Hashtag-Command that passes the {@link HashtagHandlerOptions.validation} check.
 *
 * @param command The Hashtag-Command split into tokens. Corresponds to a line starting with `#`.
 *   For example `# navigate scene_name "Hello World"` becomes `["navigate", "scene_name", "Hello World"]`.
 *   Use `""` to embed a literal space inside a single token.
 * @param props The properties of the current step.
 * @param convertListStringToObj Utility function that converts an alternating key/value list into
 *   a plain object. For example `["name", "John", "age", "20"]` → `{ name: "John", age: 20 }`.
 * @returns
 *   - `true` – the command was handled; stop processing further handlers and skip the default interpreter.
 *   - A `string` – treat the returned value as a new Hashtag-Command and re-interpret it.
 *   - `false` / `Promise<false>` – not handled; pass to the next registered handler.
 */
export type HashtagHandler = (
    /**
     * A Hashtag-Command to run. It corresponds to a line of code that starts with `#`.
     * This is an array of strings, it is the Hashtag-Command that was split by spaces. For add a space in a string, you need to use `""`.
     * For example, the Hashtag-Command `# command "Hello World"` will be split into `["command", "Hello World"]`.
     */
    command: string[],
    /**
     * The properties of the step. It is an object that contains the properties of the step.
     */
    props: StepLabelPropsType,
    /**
     * It is often useful after writing a basic Hashtag-Command to add parameters with the following logic: "field name" "value".
     * Furthermore, these parameters can be written in a different order, to simplify writing.
     * This function is used to convert an array that has the following logic into a json. Here is an example:
     * This is the array: `["name", "John", "age", "20", "position", "{ x: 2, y 3 }"]` and this is the json: `{name: "John", age: 20, position: { x: 2, y: 3 }}`.
     */
    convertListStringToObj: (listParm: string[]) => object,
) => boolean | string | Promise<boolean | string>;

export type MapperHandler = (
    list: string[],
    step: PixiVNJsonLabelStep,
) => PixiVNJsonOperation | undefined;

/**
 * Configuration options for a Hashtag-Command handler registered via {@link HashtagCommands.add}.
 */
export interface HashtagHandlerOptions {
    /**
     * A unique name that identifies this handler.
     * Used for documentation and debugging purposes.
     */
    name: string;
    /**
     * An optional human-readable description of what this handler does.
     * Used for documentation purposes.
     */
    description?: string;
    /**
     * Determines whether this handler should be invoked for a given command.
     *
     * - `"all"` – the handler is always invoked, regardless of the command content.
     * - `RegExp` – the command tokens are joined with a space (`script.join(" ")`) and tested
     *   against the regular expression. The handler is invoked only if the regex matches.
     * - `ZodType<string[]>` – the command token array is validated with
     *   `schema.safeParse(script)`. The handler is invoked only if validation succeeds.
     *
     * @example
     * ```ts
     * // RegExp: only handle commands that start with "navigate"
     * validation: /^navigate\b/
     *
     * // Zod: only handle commands whose first element is "navigate" and second is a non-empty string
     * import { z } from "zod"
     * validation: z.tuple([z.literal("navigate"), z.string().min(1)]).rest(z.string())
     * ```
     */
    validation: RegExp | "all" | ZodType<string[]>;
}
