import { HashtagCommands } from "@/handlers/hashtag-commands";
import type {
    CompileSharedType,
    HashtagCommandOccurrence,
    InkHashtagCommandInfo,
    IssueType,
} from "@/parser/types";
import { Compiler } from "inkjs/compiler/Compiler";
import { ErrorType } from "inkjs/compiler/Parser/ErrorType";

const INK_HASHTAG_COMMAND_PATTERN = /(?:^|<>)\s*#\s*([^\r\n]+)/g;
const HASHTAG_VALIDATION_REGEX_CACHE = new Map<string, RegExp>();

function getCachedRegExp(source: string, flags: string): RegExp {
    const cacheKey = JSON.stringify([flags, source]);
    const cached = HASHTAG_VALIDATION_REGEX_CACHE.get(cacheKey);
    if (cached) {
        return cached;
    }
    const compiled = new RegExp(source, flags);
    HASHTAG_VALIDATION_REGEX_CACHE.set(cacheKey, compiled);
    return compiled;
}

function stringMatchesSchemaToken(token: string, schema: unknown): boolean {
    if (!schema || typeof schema !== "object") {
        return false;
    }
    const typedSchema = schema as Record<string, unknown>;

    const anyOf = typedSchema.anyOf;
    if (Array.isArray(anyOf)) {
        return anyOf.some((entry) => stringMatchesSchemaToken(token, entry));
    }

    const oneOf = typedSchema.oneOf;
    if (Array.isArray(oneOf)) {
        return oneOf.some((entry) => stringMatchesSchemaToken(token, entry));
    }

    const allOf = typedSchema.allOf;
    if (Array.isArray(allOf)) {
        return allOf.every((entry) => stringMatchesSchemaToken(token, entry));
    }

    if (typeof typedSchema.const === "string") {
        return token === typedSchema.const;
    }

    if (Array.isArray(typedSchema.enum)) {
        return typedSchema.enum.some((value) => typeof value === "string" && value === token);
    }

    if (typedSchema.type !== "string") {
        return false;
    }

    if (typeof typedSchema.minLength === "number" && token.length < typedSchema.minLength) {
        return false;
    }
    if (typeof typedSchema.maxLength === "number" && token.length > typedSchema.maxLength) {
        return false;
    }
    if (typeof typedSchema.pattern === "string") {
        try {
            if (!getCachedRegExp(typedSchema.pattern, "").test(token)) {
                return false;
            }
        } catch {
            return false;
        }
    }
    return true;
}

function arrayMatchesSchemaTokens(tokens: string[], schema: unknown): boolean {
    if (!schema || typeof schema !== "object") {
        return false;
    }

    const typedSchema = schema as Record<string, unknown>;
    const anyOf = typedSchema.anyOf;
    if (Array.isArray(anyOf)) {
        return anyOf.some((entry) => arrayMatchesSchemaTokens(tokens, entry));
    }

    const oneOf = typedSchema.oneOf;
    if (Array.isArray(oneOf)) {
        return oneOf.some((entry) => arrayMatchesSchemaTokens(tokens, entry));
    }

    const allOf = typedSchema.allOf;
    if (Array.isArray(allOf)) {
        return allOf.every((entry) => arrayMatchesSchemaTokens(tokens, entry));
    }

    if (typedSchema.type !== "array") {
        return false;
    }

    if (typeof typedSchema.minItems === "number" && tokens.length < typedSchema.minItems) {
        return false;
    }
    if (typeof typedSchema.maxItems === "number" && tokens.length > typedSchema.maxItems) {
        return false;
    }

    const prefixItems = Array.isArray(typedSchema.prefixItems) ? typedSchema.prefixItems : [];
    if (tokens.length < prefixItems.length) {
        return false;
    }

    for (let index = 0; index < prefixItems.length; index++) {
        if (!stringMatchesSchemaToken(tokens[index], prefixItems[index])) {
            return false;
        }
    }

    if (tokens.length === prefixItems.length) {
        return true;
    }

    if (typedSchema.items === false || typeof typedSchema.items === "undefined") {
        return false;
    }
    if (typedSchema.items === true) {
        return true;
    }

    return tokens
        .slice(prefixItems.length)
        .every((token) => stringMatchesSchemaToken(token, typedSchema.items));
}

function matchesHashtagValidation(
    tokens: string[],
    validation: InkHashtagCommandInfo["validation"],
): boolean {
    if (validation.type === "regexp") {
        try {
            const expression = getCachedRegExp(validation.source, validation.flags);
            expression.lastIndex = 0;
            return expression.test(tokens.join(" "));
        } catch {
            return false;
        }
    }
    if (validation.type === "literal") {
        return tokens.join(" ") === validation.value;
    }
    return arrayMatchesSchemaTokens(tokens, validation.schema);
}

function extractHashtagCommands(source: string): HashtagCommandOccurrence[] {
    const lines = source.split(/\r?\n/);
    const commands: HashtagCommandOccurrence[] = [];
    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        for (const match of line.matchAll(INK_HASHTAG_COMMAND_PATTERN)) {
            const rawCommand = (match[1] ?? "").trim();
            if (!rawCommand) {
                continue;
            }
            const tokens = HashtagCommands.convertTagTolist(rawCommand);
            if (tokens.length === 0) {
                continue;
            }
            commands.push({
                line: index + 1,
                command: rawCommand,
                tokens,
            });
        }
    }
    return commands;
}

export namespace InkCompiler {
    export function compile(
        text: string,
        shared: Omit<CompileSharedType, "textSource"> = {
            labelToRemove: [],
            initialVarsToRemove: [],
            functions: [],
            enums: {},
        },
    ) {
        const issues: IssueType[] = [];
        try {
            const compiler = new Compiler(text, {
                errorHandler: (message: string, type: ErrorType) => {
                    const cleanedMsg = message.replace(/^[A-Z]+: line \d+: ?/, "");
                    const lineMatch = message.match(/line (\d+)/);
                    issues.push({
                        message: cleanedMsg,
                        type,
                        line: lineMatch ? Number(lineMatch[1]) : -1,
                    });
                },
                countAllVisits: true,
                fileHandler: {
                    ResolveInkFilename: (filename: string) => filename,
                    LoadInkFileContents: () => {
                        return "";
                    },
                },
                pluginNames: [],
                sourceFilename: null,
            });
            const story = compiler.Compile();
            const json = story.ToJson() || "";
            return { json, issues };
        } catch (_e) {
            let recompile = false;
            const sharedWithText = { ...shared, textSource: text };
            getErrors(
                issues,
                () => {
                    recompile = true;
                },
                sharedWithText,
            );
            if (recompile) {
                return compile(sharedWithText.textSource, shared);
            }
            return { issues };
        }
    }

    export function getErrors(
        issues: IssueType[],
        recompile: () => void,
        shared: CompileSharedType,
    ) {
        const { functions, initialVarsToRemove, labelToRemove } = shared;
        const error = issues.find((em) => em.type === ErrorType.Error);
        if (error) {
            if (error.message.includes("Divert target not found")) {
                const match = error.message.match(/Divert target not found: '-> (\w+)'/);
                if (match?.[1]) {
                    const labelName = match[1];
                    const textToAdd = `\n\n=== ${labelName} ===\n\n-> DONE`;
                    shared.textSource = shared.textSource.concat(textToAdd);
                    labelToRemove.push(labelName);
                    return recompile();
                }
            }
            if (error.message.includes("Unresolved variable")) {
                const match = error.message.match(/Unresolved variable: (\w+)/);
                if (match?.[1]) {
                    const varName = match[1];
                    const textToAdd = `VAR ${varName} = ""\n\n`;
                    shared.textSource = textToAdd.concat(shared.textSource);
                    initialVarsToRemove.push(varName);
                    return recompile();
                }
            }
            if (error.message.includes("Variable could not be found to assign to")) {
                const match = error.message.match(
                    /Variable could not be found to assign to: (\w+)/,
                );
                if (match?.[1]) {
                    const varName = match[1];
                    const textToAdd = `VAR ${varName} = ""\n\n`;
                    shared.textSource = textToAdd.concat(shared.textSource);
                    initialVarsToRemove.push(varName);
                    return recompile();
                }
            }
            // "Variable could not be found to assign to: 'myList'"
            if (error.message.includes("Variable could not be found to assign to")) {
                const match = error.message.match(
                    /Variable could not be found to assign to: '(\w+)'/,
                );
                if (match?.[1]) {
                    const varName = match[1];
                    const textToAdd = `VAR ${varName} = ""\n\n`;
                    shared.textSource = textToAdd.concat(shared.textSource);
                    initialVarsToRemove.push(varName);
                    return recompile();
                }
            }
            if (error.message.includes("Function call target not found")) {
                const match = error.message.match(/Function call target not found: '-> (\w+)'/);
                if (match?.[1]) {
                    const functionName = match[1];
                    const textToAdd = `\n\n=== function ${functionName}() ===\n\n~ return\n\n`;
                    shared.textSource = shared.textSource.concat(textToAdd);
                    functions.push({ name: functionName, args: 0 });
                    labelToRemove.push(functionName);
                    return recompile();
                }
            }
            if (error.message.includes(" arguments, but got ")) {
                // Example: Function call to 'random_event_value' requires 0 arguments, but got 2
                const match = error.message.match(
                    /Function call to '(\w+)' requires (\d+) arguments, but got (\d+)/,
                );
                if (match?.[1]) {
                    const functionName = match[1];
                    const requiredArgs = parseInt(match[3] || "0", 10);
                    // Build a placeholder argument list: arg1, arg2, ...
                    const argsList =
                        requiredArgs > 0
                            ? Array.from({ length: requiredArgs }, (_, i) => `arg${i + 1}`).join(
                                  ", ",
                              )
                            : "";
                    const textToAdd = `\n\n=== function ${functionName}(${argsList}) ===\n\n~ return\n\n`;
                    shared.textSource = shared.textSource.replaceAll(
                        `\n\n=== function ${functionName}() ===\n\n~ return\n\n`,
                        "",
                    ); // Remove previous placeholder if exists
                    shared.textSource = shared.textSource.concat(textToAdd);
                    const fun = functions.find((f) => f.name === functionName);
                    if (fun) {
                        fun.args = requiredArgs;
                    } else {
                        functions.push({ name: functionName, args: requiredArgs });
                        labelToRemove.push(functionName);
                    }
                    return recompile();
                }
            }
            // "Could not find target for read count: -> colori.rosso, or couldn't find list item with the name colori,rosso"
            if (error.message.includes("Could not find target for read count")) {
                const match = error.message.match(
                    /Could not find target for read count: -> (\w+\.\w+)/,
                );
                if (match?.[1]) {
                    const listItem = match[1];
                    const [listName, itemName] = listItem.split(".");
                    const textToAdd = `\n\nLIST ${listName} = ${itemName}\n\n`;
                    shared.textSource = shared.textSource.concat(textToAdd);
                    shared.initialVarsToRemove.push(listName);
                    shared.initialVarsToRemove.push(`${listName}.${itemName}`);
                    return recompile();
                }
            }
            // "variable for increment could not be found: 'lista' after searching: {this.descriptionOfScope}"
            if (error.message.includes("variable for increment could not be found")) {
                const match = error.message.match(
                    /variable for increment could not be found: '(\w+)' after searching:/,
                );
                if (match?.[1]) {
                    const varName = match[1];
                    const textToAdd = `VAR ${varName} = 0\n\n`;
                    shared.textSource = textToAdd.concat(shared.textSource);
                    shared.initialVarsToRemove.push(varName);
                    return recompile();
                }
            }

            issues.forEach((issue) => {
                // Function call to 'test' requires 1 arguments, but got 3
                const match = issue.message.match(
                    /Function call to '(\w+)' requires (\d+) arguments, but got (\d+)/,
                );
                if (match?.[1]) {
                    issue.message = `The function '${match[1]}' have optional arguments, but in ink all arguments must be required. Please make sure to provide all the required arguments for the function call.`;
                }
            });
            return { issues };
        }
        return { issues };
    }

    /**
     * Returns all hashtag commands in `source` that are not matched by any
     * entry in `commands`.
     *
     * A command is considered "unknown" when none of the registered
     * {@link InkHashtagCommandInfo} validations match its token list.
     *
     * @param source   Raw Ink source text to scan.
     * @param commands List of known command descriptors (e.g. obtained from
     *                 `GET /__pixi-vn-ink/hashtag-commands` or registered
     *                 directly in a VS Code extension).
     * @returns        Array of unrecognised {@link HashtagCommandOccurrence}
     *                 objects, each carrying the 1-based `line`, the raw
     *                 `command` string, and the parsed `tokens`.
     */
    export function getUnknownHashtagCommands(
        source: string,
        commands: InkHashtagCommandInfo[],
    ): HashtagCommandOccurrence[] {
        return extractHashtagCommands(source).filter(
            ({ tokens }) =>
                !commands.some(({ validation }) => matchesHashtagValidation(tokens, validation)),
        );
    }
}
