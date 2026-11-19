import { HashtagCommands } from "@/handlers/hashtag-commands";
import type { PixiVNJsonOperation } from "@drincs/pixi-vn-json";

type Operation = Record<string, unknown>;
type Tokens = string[];

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalize(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(normalize);
    if (isPlainObject(value)) {
        return Object.fromEntries(
            Object.entries(value)
                .filter(([key, item]) => item !== undefined && key !== "$origin")
                .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
                .map(([key, item]) => [key, normalize(item)]),
        );
    }
    return value;
}

function sameOperation(a: unknown, b: unknown): boolean {
    return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

/** A single token for a positional value (an alias, a url, a text). */
function word(value: unknown): string[] {
    if (typeof value !== "string") return [];
    const escaped = value.replaceAll('"', '\\"');
    return /^[^\s"'`{}[\]]+$/.test(value) ? [value, `"${escaped}"`] : [`"${escaped}"`];
}

function props(value: unknown): Tokens {
    return isPlainObject(value) ? HashtagCommands.convertObjToListString(value) : [];
}

function transition(value: unknown): Tokens {
    if (!isPlainObject(value) || typeof value.type !== "string") return [];
    return ["with", value.type, ...props(value.props)];
}

/** The `<spritesheet> frames [ … ] <key> <value>` part of an animated sprite command. */
function animatedSpriteSource(source: unknown, positional: boolean): Tokens {
    if (!isPlainObject(source)) return [];
    const { spritesheet, frames, ...rest } = source;
    const tokens: Tokens = [];
    if (typeof spritesheet === "string") {
        if (positional) tokens.push(...word(spritesheet).slice(0, 1));
        else tokens.push(...props({ spritesheet }));
    }
    if (Array.isArray(frames)) {
        tokens.push(
            "frames",
            "[",
            ...frames.map((frame) =>
                typeof frame === "string" ? word(frame)[0] : JSON.stringify(frame),
            ),
            "]",
        );
    }
    tokens.push(...props(rest));
    return tokens;
}

/** Candidate Hashtag-Command texts for an operation, following the built-in conventions. */
function candidates(operation: Operation): Tokens[] {
    const { type, operationType, alias } = operation;
    const result: Tokens[] = [];
    const aliasWords = word(alias);
    const unique = (...parts: Tokens[]) => result.push(parts.flat());

    if (type === "canvas" && operationType === "clear") return [["clear", "canvas"]];
    if (type === "dialogue" && operationType === "clean") return [["pause"]];
    if (type === "input" && operationType === "request") {
        const extra: Record<string, unknown> = {};
        if (operation.valueType !== undefined) extra.type = operation.valueType;
        if (operation.defaultValue !== undefined) extra.default = operation.defaultValue;
        return [["request", "input", ...props(extra)]];
    }
    if (type === "all" && typeof operationType === "string") {
        return [[operationType, "all", "sounds"]];
    }
    if (
        (type === "assets" || type === "bundle") &&
        typeof operationType === "string" &&
        Array.isArray(operation.aliases)
    ) {
        return [[operationType, type, ...operation.aliases.map((item) => word(item)[0])]];
    }
    if (typeof type !== "string" || typeof alias !== "string") return result;

    // `# <effect> <alias> [<key> <value> …]` and `# animate <alias> <keyframes> options <options>`
    if (operationType === undefined) {
        if (type === "animate") {
            const options = props(operation.options);
            unique(
                ["animate"],
                aliasWords.slice(0, 1),
                props(operation.keyframes),
                options.length ? ["options", ...options] : [],
            );
        } else {
            unique([type], aliasWords.slice(0, 1), props(operation.props));
        }
        return result;
    }
    if (typeof operationType !== "string") return result;

    const head = (word0: string) => [operationType, word0];
    for (const aliasWord of aliasWords) {
        const base = [...head(type), aliasWord];
        if (operationType === "show" && type === "text") {
            const text = operation.text === alias ? [] : word(operation.text).slice(-1);
            unique(base, text, props(operation.props), transition(operation.transition));
        } else if (operationType === "show" && type === "imagecontainer") {
            const urls = Array.isArray(operation.urls) ? operation.urls : [];
            unique(
                base,
                ["[", ...urls.map((url) => word(url).slice(-1)[0] ?? ""), "]"],
                props(operation.props),
                transition(operation.transition),
            );
        } else if (operationType === "show" && type === "asprite") {
            unique(
                base,
                animatedSpriteSource(operation.source, true),
                props(operation.props),
                transition(operation.transition),
            );
        } else if (
            operationType === "edit" &&
            type === "asprite" &&
            isPlainObject(operation.props)
        ) {
            const { source, ...rest } = operation.props;
            unique(base, animatedSpriteSource(source, false), props(rest));
        } else if (operationType === "goto" && typeof operation.frame === "number") {
            unique(base, [String(operation.frame)]);
        } else {
            const source =
                typeof operation.url === "string" && operation.url !== alias
                    ? ["source", ...word(operation.url).slice(-1)]
                    : [];
            unique(base, source, props(operation.props), transition(operation.transition));
        }
    }
    return result;
}

function reproduces(text: string, operation: unknown): boolean {
    try {
        const list = HashtagCommands.convertTagTolist(text);
        const back = HashtagCommands.convertOperation(list, {}, { silent: true });
        return back !== undefined && sameOperation(back, operation);
    } catch {
        return false;
    }
}

/**
 * Finds the Hashtag-Command (without the leading `#`) that the registered mappers convert back
 * into `operation`, or `undefined` when there is none.
 *
 * It first asks the {@link HashtagHandlerOptions.reverse} functions of the registered mappers,
 * then tries the built-in `<verb> <type> <alias> [<key> <value> …]` conventions (canvas, video,
 * text, image containers, animated sprites, effects, sounds, assets, `pause`, `request input`).
 * Every candidate is converted again with the registered mappers and is returned only if it gives
 * exactly the same operation, so a wrong command is never produced.
 *
 * `$origin` is ignored here: callers should use it first when the operation has one.
 */
export function inferHashtagCommand(operation: PixiVNJsonOperation): string | undefined {
    for (const options of HashtagCommands.info()) {
        if (!options.reverse) continue;
        let text: string | undefined;
        try {
            text = options.reverse(operation);
        } catch {
            continue;
        }
        if (text !== undefined && reproduces(text, operation)) return text;
    }
    let found: string | undefined;
    try {
        found = candidates(operation as unknown as Operation)
            .map((tokens) => tokens.join(" "))
            .find((text) => reproduces(text, operation));
    } catch {
        return undefined;
    }
    return found;
}
