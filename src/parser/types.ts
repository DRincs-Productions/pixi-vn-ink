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
