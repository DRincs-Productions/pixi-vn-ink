import type { ErrorType } from "inkjs/engine/Error";

export type CompileSharedType = {
    labelToRemove: string[];
    initialVarsToRemove: string[];
    functions: { name: string; args: number }[];
    enums: { [key: string]: Record<string, number> };
    textSource: string;
};
export type IssueType = { message: string; type: ErrorType; line: number };
export type CompileResultType = {
    json: string;
    issues: IssueType[];
};

/**
 * Serializable representation of a handler `validation` rule used by
 * {@link HashtagCommands} and {@link TextReplaces}.
 */
export type InkValidationInfo =
    | {
          /**
           * Validation based on regular expression.
           */
          type: "regexp";
          /**
           * The regex source pattern.
           */
          source: string;
          /**
           * Regex flags (for example `"i"` or `"gi"`).
           */
          flags: string;
      }
    | {
          /**
           * Validation based on a Zod schema serialized to JSON Schema.
           */
          type: "zod";
          /**
           * JSON Schema representation of the original Zod validation.
           */
          schema: Record<string, unknown>;
      }
    | {
          /**
           * Validation represented by a string literal value
           * (e.g. `"all"` or `"characterId"`).
           */
          type: "literal";
          /**
           * The original literal validation value.
           */
          value: string;
      };

/**
 * Serializable representation of a registered {@link HashtagCommands} handler,
 * as exposed by the pixi-vn-ink Vite dev-server API.
 *
 * @see https://pixi-vn.com/ink#vite-plugin
 */
export interface InkHashtagCommandInfo {
    /**
     * Unique name that identifies the handler.
     */
    name: string;
    /**
     * Human-readable description of what the handler does.
     */
    description?: string;
    /**
     * Serializable form of the validation rule.
     *
     * @example
     * A `RegExp` validation (e.g. `/^jump\b/`) serializes to:
     * ```ts
     * { type: "regexp", source: "^jump\\b", flags: "" }
     * ```
     * @example
     * A Zod validation (e.g. `z.tuple([z.literal("jump"), z.string()])`) serializes to its JSON
     * Schema form:
     * ```ts
     * {
     *   type: "zod",
     *   schema: {
     *     type: "array",
     *     prefixItems: [{ type: "string", const: "jump" }, { type: "string" }],
     *     minItems: 2,
     *     maxItems: 2,
     *   },
     * }
     * ```
     * @example
     * A string-literal validation (e.g. `TextReplaces`' `"all"` / `"characterId"` modes)
     * serializes to:
     * ```ts
     * { type: "literal", value: "all" }
     * ```
     */
    validation: InkValidationInfo;
    /**
     * Whether this handler is deprecated. Matches {@link HashtagHandlerOptions.deprecated}.
     */
    deprecated?: boolean;
    /**
     * JSON Schemas (usable with Ajv), keyed by the token that introduces an order-independent
     * `<key> <value> [<value2> ...]` section of the command's tokens. Matches
     * {@link HashtagHandlerOptions.keySchemas} — already plain JSON Schema objects, so no extra
     * serialization step is needed (unlike {@link validation}).
     *
     * @see {@link InkCompiler.validateKeyedJsonSchemas} for how a token list is split into
     * sections and validated against these schemas.
     *
     * @example
     * For the command `# wait hours 3 days tomorrow` (tokens
     * `["wait", "hours", "3", "days", "tomorrow"]`):
     * ```ts
     * {
     *   name: "wait-with-options",
     *   validation: { type: "regexp", source: "^wait\\b", flags: "" },
     *   keySchemas: {
     *     wait: {
     *       type: "object",
     *       properties: { hours: { type: "number" }, days: { type: "string" } },
     *       additionalProperties: false,
     *     },
     *   },
     * }
     * ```
     * `InkCompiler.getHashtagKeySchemaIssues` matches `"wait"` (the right-most, and only,
     * occurrence) and validates `{ hours: 3, days: "tomorrow" }` against its schema.
     * @example
     * For `# show imagecontainer sly props xAlign 0.2 yAlign 1 movein direction right ease anticipate`,
     * with two independent sections:
     * ```ts
     * keySchemas: {
     *   props: { type: "object", properties: { xAlign: { type: "number" }, yAlign: { type: "number" } } },
     *   movein: { type: "object", properties: { direction: { type: "string" }, ease: { type: "string" } } },
     * }
     * ```
     * A key can also be a (positive integer) number — or a string made only of digits, since
     * object keys are always strings at runtime — instead of a literal token. Numeric keys are
     * resolved by **position** rather than by token identity, and are checked only after every
     * string key has already claimed its section (right to left, exactly as above); counting
     * starts at `0` for the command's own leading literal (e.g. `"show"`). Numeric keys are then
     * processed largest to smallest: key `N` claims `tokens[N .. end)` as its section (`end` being
     * the left edge of the previously-claimed section), is validated against its schema, and the
     * token immediately before it (`tokens[N - 1]`, e.g. a dynamic alias that can't be matched by
     * literal value) is dropped along with it — so the next, smaller numeric key resumes scanning
     * to its left.
     * @example
     * For `# show spine flowerTop x 220 y 20 with dissolve duration 2` (tokens
     * `["show","spine","flowerTop","x","220","y","20","with","dissolve","duration","2"]`) with:
     * ```ts
     * keySchemas: {
     *   with: {},
     *   dissolve: { type: "object", properties: { duration: { type: "number" } } },
     *   3: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } } },
     * }
     * ```
     * String keys are resolved first: `"dissolve"` (right-most) claims `{ duration: 2 }`, then
     * `"with"` claims an empty section — leaving `["show","spine","flowerTop","x","220","y","20"]`
     * (`"show"` is position `0`) for the numeric pass. Key `3` claims `tokens[3..7)` →
     * `{ x: 220, y: 20 }`, and also drops `"flowerTop"` (position `2`, the element's dynamic
     * alias) — nothing is left to check further left.
     */
    keySchemas?: Record<string | number, object>;
}

/**
 * Represents a single JSON Schema mismatch found while validating one of a hashtag command's
 * {@link InkHashtagCommandInfo.keySchemas} sections, as reported by
 * {@link InkCompiler.validateKeyedJsonSchemas}.
 */
export interface KeyedSchemaValidationIssue extends SchemaValidationIssue {
    /**
     * The token that introduced the invalid section (e.g. `"props"` or `"movein"`), or the
     * numeric position key (see {@link InkHashtagCommandInfo.keySchemas}) that introduced it.
     */
    key: string | number;
}

/**
 * A {@link KeyedSchemaValidationIssue} found while scanning a whole Ink source file, as reported
 * by {@link InkCompiler.getHashtagKeySchemaIssues}.
 */
export interface HashtagKeySchemaIssue extends KeyedSchemaValidationIssue {
    /**
     * 1-based line number where the offending hashtag command appears.
     */
    line: number;
    /**
     * The raw command string (without the leading `#`).
     */
    command: string;
}

/**
 * A {@link SchemaValidationIssue} found while checking whether an *unrecognized* `# ...` hashtag
 * command (one no registered {@link InkHashtagCommandInfo} validation matches) is instead a
 * probable typo of one of the registered `"zod"` handlers, as reported by
 * {@link InkCompiler.getLikelyUnknownHashtagCommandSchemaIssues}.
 */
export interface LikelyUnknownHashtagCommandSchemaIssue extends SchemaValidationIssue {
    /**
     * 1-based line number where the offending hashtag command appears.
     */
    line: number;
    /**
     * The raw command string (without the leading `#`), exactly as found in the source.
     */
    command: string;
    /**
     * `name` of the {@link InkHashtagCommandInfo} whose `"zod"` schema this command is a likely
     * (but invalid) match for.
     */
    handlerName: string;
    /**
     * Confidence, in `[0, 1]`, that `command` was meant to match `handlerName`'s schema — see
     * {@link InkCompiler.getLikelyUnknownHashtagCommandSchemaIssues}.
     */
    score: number;
}

/**
 * Represents a single divert occurrence found in an Ink source file whose target
 * could not be resolved locally or against the known external label pool.
 */
export interface DivertOccurrence {
    /**
     * 1-based line number where the divert appears.
     */
    line: number;
    /**
     * The raw divert target as written in the source (e.g. `"myKnot"` or `"myKnot.myStitch"`).
     */
    target: string;
}

/**
 * Represents a single hashtag command occurrence found in an Ink source file.
 */
export interface HashtagCommandOccurrence {
    /**
     * 1-based line number where the command appears.
     */
    line: number;
    /**
     * The raw command string (without the leading `#`).
     */
    command: string;
    /**
     * The token list produced by parsing the command.
     */
    tokens: string[];
}

/**
 * Represents a single JSON Schema mismatch found while validating an exported
 * `PixiVNJson` payload, as reported by {@link InkCompiler.validateAgainstJsonSchema}.
 */
export interface SchemaValidationIssue {
    /**
     * JSON Pointer (Ajv's `instancePath`) to the invalid value, or `"(root)"`
     * when the error applies to the whole document.
     */
    instancePath: string;
    /**
     * Name of the invalid field/element — e.g. `"x"` when `x` was assigned a
     * string but the schema only accepts a number. For a missing required
     * property, this is the name of that property.
     */
    element: string;
    /**
     * Human-readable reason the value doesn't match the schema.
     */
    message: string;
    /**
     * Nearest ink source line (a converted operation's `$origin`) that produced
     * the invalid value, when one could be traced.
     */
    origin?: string;
}
