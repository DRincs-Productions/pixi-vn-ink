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
     */
    validation: InkValidationInfo;
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
