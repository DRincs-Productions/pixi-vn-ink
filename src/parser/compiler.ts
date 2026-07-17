import { HashtagCommands } from "@/handlers/hashtag-commands";
import type {
    CompileSharedType,
    DivertOccurrence,
    HashtagCommandOccurrence,
    HashtagKeySchemaIssue,
    InkHashtagCommandInfo,
    IssueType,
    KeyedSchemaValidationIssue,
    LikelyUnknownHashtagCommandSchemaIssue,
    SchemaValidationIssue,
} from "@/parser/types";
import Ajv, { type ErrorObject, type ValidateFunction } from "ajv";
import Ajv2020 from "ajv/dist/2020";
import { Compiler } from "inkjs/compiler/Compiler";
import { ErrorType } from "inkjs/compiler/Parser/ErrorType";

const INK_HASHTAG_COMMAND_PATTERN = /(?:^|<>)\s*#\s*([^\r\n]+)/g;
const INK_LOCAL_LABEL_PATTERN = /^=+[ \t]+(?:function[ \t]+)?(\w+)/gm;
const INK_BUILT_IN_DIVERT_TARGETS = new Set(["DONE", "END"]);
// Maps ink dot notation (myKnot.myStitch) to the pixi-vn label separator used in compiled JSON.
const INK_LABEL_SEPARATOR = "_|_";
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

/**
 * Flattens a `"zod"` validation's serialized schema down to its leaf tuple-shaped array schemas —
 * unwrapping `anyOf`/`oneOf` (from a `z.union([...])`, e.g. the "Load assets/bundle" command) and
 * merging `allOf` members, the same three combinators {@link arrayMatchesSchemaTokens} already
 * unwraps to *decide* a match. Used instead to *score* how close a command that matched none of
 * them still is to each individual branch — see {@link scoreZodArrayBranch}.
 */
function collectZodArrayBranches(schema: unknown): Record<string, unknown>[] {
    if (!schema || typeof schema !== "object") return [];
    const typedSchema = schema as Record<string, unknown>;

    if (Array.isArray(typedSchema.anyOf)) return typedSchema.anyOf.flatMap(collectZodArrayBranches);
    if (Array.isArray(typedSchema.oneOf)) return typedSchema.oneOf.flatMap(collectZodArrayBranches);
    if (Array.isArray(typedSchema.allOf)) {
        const merged: Record<string, unknown> = {};
        for (const member of typedSchema.allOf) {
            if (member && typeof member === "object") Object.assign(merged, member);
        }
        return collectZodArrayBranches(merged);
    }

    if (typedSchema.type === "array" && Array.isArray(typedSchema.prefixItems)) {
        return [typedSchema];
    }
    return [];
}

/**
 * Levenshtein similarity of `a` against `b`, normalized to `[0, 1]` (`1` for an exact match, `0`
 * for two strings sharing nothing). Reuses {@link editDistance} — the same measure already used
 * to suggest a `keySchemas` property typo — to instead score a whole *token* against the literal
 * (`const`/`enum`) a hashtag command's tuple schema expects at that position.
 */
function stringSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    const maxLength = Math.max(a.length, b.length);
    if (maxLength === 0) return 1;
    return Math.max(0, 1 - editDistance(a, b) / maxLength);
}

/**
 * How well a single token matches a single `prefixItems` position schema, as a `{ weight,
 * matched }` pair (`matched / weight` is that position's own contribution to
 * {@link scoreZodArrayBranch}'s overall score). A `const`/`enum` position is a *discriminant* —
 * the part of a command that actually identifies it (`"show"`, `"video"`, ...) — and is weighted
 * higher than a plain, unconstrained position (a free-form alias/argument, trivially satisfied by
 * any token): getting a discriminant right is far stronger evidence of a typo'd match than an
 * argument merely being present.
 */
function scoreHashtagPositionToken(
    token: string | undefined,
    positionSchema: unknown,
): { weight: number; matched: number } {
    if (positionSchema && typeof positionSchema === "object") {
        const typedSchema = positionSchema as Record<string, unknown>;
        if (typeof typedSchema.const === "string") {
            return {
                weight: 2,
                matched: token === undefined ? 0 : 2 * stringSimilarity(token, typedSchema.const),
            };
        }
        if (Array.isArray(typedSchema.enum)) {
            const bestSimilarity =
                token === undefined
                    ? 0
                    : Math.max(
                          0,
                          ...typedSchema.enum
                              .filter((value): value is string => typeof value === "string")
                              .map((value) => stringSimilarity(token, value)),
                      );
            return { weight: 2, matched: 2 * bestSimilarity };
        }
    }
    return { weight: 1, matched: token === undefined ? 0 : 1 };
}

/**
 * Confidence, in `[0, 1]`, that `tokens` was *meant* to match `branchSchema` — one leaf branch of
 * a registered `"zod"` command's schema, already known not to actually match (see
 * {@link InkCompiler.getLikelyUnknownHashtagCommandSchemaIssues}, which only ever scores a command
 * against branches it didn't already match). Only the `prefixItems` positions `tokens` actually
 * has something at are scored (each via {@link scoreHashtagPositionToken}) — a missing trailing
 * argument or an unexpected extra token is a distinct kind of mistake (wrong *shape*, not wrong
 * *word*) from a typo'd literal/enum, and is instead surfaced separately, via the concrete
 * `minItems`/`maxItems` mismatch {@link normalizeZodArrayBranchForValidation} lets Ajv itself
 * report once a candidate has already cleared this score on the tokens that are present. Without
 * this split, a bare `# jump` (missing its required label) would score low on "the label is
 * missing" alone and never even reach that more specific error. `hasDiscriminant` reports whether
 * the compared positions included *any* `const`/`enum` position at all — a branch with none (every
 * compared position a free-form string) would otherwise trivially "match" any tokens, which isn't
 * a typo signal worth reporting on.
 */
function scoreZodArrayBranch(
    tokens: readonly string[],
    branchSchema: Record<string, unknown>,
): { score: number; hasDiscriminant: boolean } {
    const prefixItems = Array.isArray(branchSchema.prefixItems) ? branchSchema.prefixItems : [];
    const comparedLength = Math.min(prefixItems.length, tokens.length);

    let weight = 0;
    let matched = 0;
    let hasDiscriminant = false;
    for (let index = 0; index < comparedLength; index++) {
        const position = scoreHashtagPositionToken(tokens[index], prefixItems[index]);
        weight += position.weight;
        matched += position.matched;
        if (position.weight > 1) hasDiscriminant = true;
    }

    return { score: weight === 0 ? 0 : matched / weight, hasDiscriminant };
}

/**
 * How confident a match must be (see {@link scoreZodArrayBranch}) before
 * {@link InkCompiler.getLikelyUnknownHashtagCommandSchemaIssues} treats an otherwise-unknown
 * command as a probable typo worth reporting, rather than staying silent (as it does for anything
 * that doesn't resemble a registered command at all).
 */
const LIKELY_HASHTAG_MATCH_SCORE_THRESHOLD = 0.8;

const ZOD_ARRAY_VALIDATOR_CACHE = new Map<string, ValidateFunction>();

/**
 * Compiles (and caches, by the schema's own JSON text — mirroring {@link getCachedRegExp}'s cache)
 * a `branchSchema` with `Ajv2020`, not the plain (draft-07) `Ajv` instance
 * {@link InkCompiler.getSchemaValidator} uses elsewhere. A `"zod"` validation's schema is produced
 * by zod's own `toJSONSchema()`, which for a tuple emits the 2020-12 `prefixItems` keyword — a
 * plain draft-07 Ajv instance doesn't recognize it at all and silently ignores it (non-strict
 * mode), which would make *any* token array "valid" against it. Caching matters here specifically
 * because {@link InkCompiler.getLikelyUnknownHashtagCommandSchemaIssues} runs on every diagnostics
 * refresh (effectively every keystroke in an editor).
 */
function getZodArrayValidator(branchSchema: Record<string, unknown>): ValidateFunction {
    const cacheKey = JSON.stringify(branchSchema);
    const cached = ZOD_ARRAY_VALIDATOR_CACHE.get(cacheKey);
    if (cached) return cached;
    const validate = new Ajv2020({ strict: false, allErrors: true }).compile(branchSchema);
    ZOD_ARRAY_VALIDATOR_CACHE.set(cacheKey, validate);
    return validate;
}

/**
 * A `branchSchema` with no `items` key rejects any tokens past `prefixItems` per
 * {@link zodArrayBranchAllowsExtraTokens} — but plain JSON Schema semantics treat a missing
 * `items` as "unconstrained", so Ajv itself wouldn't actually flag a too-long token list without
 * this. Fills in the `minItems`/`maxItems`/`items: false` the schema's own acceptance rule already
 * implies, so Ajv's own errors (not just the boolean score) can point at a wrong token count too.
 * A schema that already has an `items` key (a `.rest(...)`-extended tuple) is returned unchanged.
 */
function normalizeZodArrayBranchForValidation(
    branchSchema: Record<string, unknown>,
): Record<string, unknown> {
    if ("items" in branchSchema) return branchSchema;
    const prefixItemsLength = Array.isArray(branchSchema.prefixItems)
        ? branchSchema.prefixItems.length
        : 0;
    return {
        ...branchSchema,
        minItems: prefixItemsLength,
        maxItems: prefixItemsLength,
        items: false,
    };
}

/**
 * The token `error` is actually about — e.g. the mistyped `"shwo"` itself, not just its position
 * `0` — found by resolving the leading segment of its `instancePath` (an array index) back into
 * `tokens`. Falls back to {@link getInvalidElement}'s own generic handling (the last path segment,
 * or `"(root)"`) for a whole-array error with no single offending token (e.g. `minItems`).
 */
function getLikelyHashtagInvalidElement(error: ErrorObject, tokens: readonly string[]): string {
    const [firstSegment] = splitInstancePath(error.instancePath);
    if (firstSegment !== undefined && /^\d+$/.test(firstSegment)) {
        const index = Number(firstSegment);
        if (index < tokens.length) return tokens[index];
    }
    return getInvalidElement(error);
}

/**
 * Human-readable message for one `error` found while validating a command's tokens against a
 * likely-intended handler's schema. Ajv's own default message is generic and, for the two
 * keywords a tuple's `prefixItems` position actually produces, doesn't name the value it expected
 * (`"must be equal to constant"` / `"must be equal to one of the allowed values"` — the allowed
 * value(s) only live in `error.params`) — this fills that in so the warning is actionable without
 * cross-referencing `params`. Any other keyword (`minItems`/`maxItems`, ...) keeps Ajv's own
 * message as-is.
 */
function formatLikelyHashtagErrorMessage(error: ErrorObject): string {
    if (error.keyword === "const") {
        return `must be "${(error.params as { allowedValue?: unknown }).allowedValue}"`;
    }
    if (error.keyword === "enum") {
        const allowedValues = (error.params as { allowedValues?: unknown[] }).allowedValues ?? [];
        return `must be one of ${allowedValues.map((value) => `"${value}"`).join(", ")}`;
    }
    return error.message ?? "invalid value";
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
            const tokens = HashtagCommands.convertTagTolist(rawCommand, {
                mergeInkVariables: true,
            });
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

/**
 * Name of the invalid field/element an Ajv error is about — e.g. `"x"` when `x` was assigned a
 * string but the schema only accepts a number. For a `required` error this is the *missing*
 * property (from `error.params.missingProperty`), since `instancePath` there points at the
 * parent object, not the absent field. For an `additionalProperties` error this is the actual
 * *unrecognised* key (from `error.params.additionalProperty`), for the same reason —
 * `instancePath` there points at the container object (e.g. `props`), not the extra key itself
 * (e.g. `xAlin`). Falls back to the last segment of `instancePath`, or `"(root)"` for an error on
 * the whole document.
 */
function getInvalidElement(error: ErrorObject): string {
    if (error.keyword === "required" && typeof error.params?.missingProperty === "string") {
        return error.params.missingProperty;
    }
    if (
        error.keyword === "additionalProperties" &&
        typeof error.params?.additionalProperty === "string"
    ) {
        return error.params.additionalProperty;
    }
    return error.instancePath.split("/").pop() || "(root)";
}

/**
 * Levenshtein edit distance between two strings, used to suggest the intended property name for
 * a typo'd one (e.g. `xAlin` → `xAlign`).
 */
function editDistance(a: string, b: string): number {
    const rows = a.length + 1;
    const cols = b.length + 1;
    const distances: number[][] = Array.from({ length: rows }, (_, i) => [
        i,
        ...Array(cols - 1).fill(0),
    ]);
    for (let j = 1; j < cols; j++) distances[0][j] = j;
    for (let i = 1; i < rows; i++) {
        for (let j = 1; j < cols; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            distances[i][j] = Math.min(
                distances[i - 1][j] + 1,
                distances[i][j - 1] + 1,
                distances[i - 1][j - 1] + cost,
            );
        }
    }
    return distances[rows - 1][cols - 1];
}

/**
 * Finds the closest match to `key` among `candidates` (e.g. a mistyped `xAlin` against the real
 * `["xAlign", "yAlign", ...]` prop names), within an edit-distance budget proportional to the
 * key's length. Returns `undefined` when nothing is close enough to be a plausible typo.
 */
function findClosestKey(key: string, candidates: readonly string[]): string | undefined {
    let best: string | undefined;
    let bestDistance = Infinity;
    for (const candidate of candidates) {
        const distance = editDistance(key, candidate);
        if (distance < bestDistance) {
            bestDistance = distance;
            best = candidate;
        }
    }
    const budget = Math.max(1, Math.floor(key.length / 3));
    return bestDistance <= budget ? best : undefined;
}

/**
 * Human-readable message for a schema validation error. Ajv's own `error.message` is generic for
 * `additionalProperties` ("must NOT have additional properties") and doesn't name the offending
 * key — this fills in the actual key (and a "did you mean" suggestion when a known property name
 * is a close typo match) so the warning is actionable without cross-referencing `params`.
 */
function formatErrorMessage(error: ErrorObject, knownProperties?: readonly string[]): string {
    if (
        error.keyword === "additionalProperties" &&
        typeof error.params?.additionalProperty === "string"
    ) {
        const badKey = error.params.additionalProperty;
        const suggestion = knownProperties && findClosestKey(badKey, knownProperties);
        const suggestionSuffix = suggestion ? ` (did you mean "${suggestion}"?)` : "";
        return `has an unrecognised property "${badKey}"${suggestionSuffix}`;
    }
    return error.message ?? "invalid value";
}

/**
 * Splits an Ajv `instancePath` (a JSON Pointer, e.g. `/labels/talk_alice/2/operations/0/value`)
 * into its unescaped segments.
 */
function splitInstancePath(instancePath: string): string[] {
    return instancePath
        .split("/")
        .filter(Boolean)
        .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
}

/**
 * Walks a JSON Pointer (Ajv's `instancePath`, e.g. `/labels/talk_alice/2/operations/0/value`)
 * down from `root`, remembering the `$origin` of the deepest node that has one. Operations
 * converted from a `#` hashtag command carry `$origin` (the raw ink source line) — so a schema
 * error nested inside one (e.g. a bad `value`) still resolves back to the line that produced it,
 * even though the error itself points at a plain field with no `$origin` of its own.
 */
function findNearestOrigin(root: unknown, instancePath: string): string | undefined {
    let node: unknown = root;
    let nearestOrigin: string | undefined;
    const captureOrigin = (candidate: unknown) => {
        if (
            candidate &&
            typeof candidate === "object" &&
            typeof (candidate as Record<string, unknown>).$origin === "string"
        ) {
            nearestOrigin = (candidate as Record<string, unknown>).$origin as string;
        }
    };

    captureOrigin(node);
    for (const segment of splitInstancePath(instancePath)) {
        if (node === null || typeof node !== "object") break;
        node = (node as Record<string, unknown>)[segment];
        captureOrigin(node);
    }
    return nearestOrigin;
}

/**
 * Finds the nearest ancestor of `instancePath` (including itself) that is a plain object with a
 * string `type` field — i.e. looks like a `PixiVNJsonOperation`. Used to scope a fanned-out
 * anyOf failure down to "the one operation this error is actually about" so it can be
 * re-validated narrowly (see {@link findMatchingLeafDefinitionKeys}) instead of reported against
 * every unrelated branch of the wider union.
 */
function findEnclosingOperation(
    root: unknown,
    instancePath: string,
): { path: string; node: Record<string, unknown> } | undefined {
    const segments = splitInstancePath(instancePath);
    for (let length = segments.length; length >= 0; length--) {
        const prefix = segments.slice(0, length);
        let node: unknown = root;
        for (const segment of prefix) {
            if (node === null || typeof node !== "object") {
                node = undefined;
                break;
            }
            node = (node as Record<string, unknown>)[segment];
        }
        if (
            node &&
            typeof node === "object" &&
            !Array.isArray(node) &&
            typeof (node as Record<string, unknown>).type === "string"
        ) {
            const path = `/${prefix.map((segment) => segment.replace(/~/g, "~0").replace(/\//g, "~1")).join("/")}`;
            return { path, node: node as Record<string, unknown> };
        }
    }
    return undefined;
}

/**
 * Resolves a `{ $ref: "#/definitions/Name" }` node to the definition it points at (recursively,
 * in case a definition is itself just a ref to another one). Returns the node unchanged if it
 * isn't a local `#/definitions/...` ref (external/unresolvable refs are treated as opaque).
 */
function resolveDefinitionRef(
    node: unknown,
    definitions: Record<string, unknown>,
    seen: Set<string> = new Set(),
): unknown {
    if (!node || typeof node !== "object") return node;
    const ref = (node as Record<string, unknown>).$ref;
    if (typeof ref !== "string") return node;
    const match = ref.match(/^#\/definitions\/([^/]+)$/);
    if (!match?.[1] || seen.has(match[1]) || !(match[1] in definitions)) return {};
    seen.add(match[1]);
    return resolveDefinitionRef(definitions[match[1]], definitions, seen);
}

/**
 * Flattens a definition (resolving `$ref`/`allOf`) down to its own `properties`/`required`, or
 * `undefined` if it isn't a leaf object shape (e.g. a bare `anyOf`/`oneOf` union container, which
 * isn't itself a candidate operation shape — only its members are).
 */
function collectLeafProperties(
    node: unknown,
    definitions: Record<string, unknown>,
): { properties: Record<string, unknown>; required: string[] } | undefined {
    const resolved = resolveDefinitionRef(node, definitions);
    if (!resolved || typeof resolved !== "object") return undefined;
    const schema = resolved as Record<string, unknown>;
    if (schema.anyOf || schema.oneOf) return undefined;
    if (Array.isArray(schema.allOf)) {
        const merged = { properties: {} as Record<string, unknown>, required: [] as string[] };
        for (const member of schema.allOf) {
            const sub = collectLeafProperties(member, definitions);
            if (!sub) return undefined;
            Object.assign(merged.properties, sub.properties);
            merged.required.push(...sub.required);
        }
        return merged;
    }
    return {
        properties: (schema.properties as Record<string, unknown>) ?? {},
        required: (schema.required as string[]) ?? [],
    };
}

/**
 * Whether a field's schema (a `const`/`enum` discriminant, typically) accepts `value`. A field
 * with no `const`/`enum` constraint is treated as non-disqualifying (it isn't a discriminant).
 */
function discriminantFieldMatches(fieldSchema: unknown, value: unknown): boolean {
    if (!fieldSchema || typeof fieldSchema !== "object") return true;
    const schema = fieldSchema as Record<string, unknown>;
    if ("const" in schema) return schema.const === value;
    if (Array.isArray(schema.enum)) return schema.enum.includes(value);
    return true;
}

/**
 * Finds every named definition in `schema.definitions` that is a leaf operation shape (not a
 * union container) whose `type`/`operationType` discriminant matches `data`'s. This is how a
 * `PixiVNJsonOperation` value gets narrowed down from "one of ~25 union branches" to "the one
 * branch it actually is", so it can be re-validated in isolation without noise from every
 * unrelated branch. Returns an empty/multi-element array (instead of picking one) when the match
 * is ambiguous or nonexistent — callers should only act on a single unique match.
 */
function findMatchingLeafDefinitionKeys(
    schema: Record<string, unknown>,
    data: Record<string, unknown>,
): string[] {
    const definitions = (schema.definitions as Record<string, unknown>) ?? {};
    const matches: string[] = [];
    for (const [key, def] of Object.entries(definitions)) {
        const leaf = collectLeafProperties(def, definitions);
        if (!leaf) continue;
        const typeSchema = leaf.properties.type;
        const hasTypeDiscriminant =
            typeSchema &&
            typeof typeSchema === "object" &&
            ("const" in (typeSchema as Record<string, unknown>) ||
                Array.isArray((typeSchema as Record<string, unknown>).enum));
        if (!hasTypeDiscriminant) continue; // not an operation-shaped leaf
        if (!discriminantFieldMatches(typeSchema, data.type)) continue;
        if (!discriminantFieldMatches(leaf.properties.operationType, data.operationType)) continue;
        matches.push(key);
    }
    return matches;
}

/**
 * Re-validates a single operation value against exactly one candidate definition (found via
 * {@link findMatchingLeafDefinitionKeys}), instead of the whole `PixiVNJsonOperation` union.
 * Compiling a tiny one-off Ajv instance per mismatched operation is fine here — this only runs
 * when the wider validation already failed, i.e. on the rare "something is actually wrong" path,
 * not on every successful build.
 */
function validateAgainstDefinition(
    schema: Record<string, unknown>,
    definitionKey: string,
    node: unknown,
): ErrorObject[] {
    const definitions = (schema.definitions as Record<string, unknown>) ?? {};
    const narrowSchema = { definitions, ...(definitions[definitionKey] as object) };
    const validate = new Ajv({ strict: false, allErrors: true }).compile(narrowSchema);
    if (validate(node)) return [];
    return validate.errors ?? [];
}

/**
 * The known property names of the sub-schema found by walking `instancePath` down from
 * `definitionKey`'s own schema — e.g. for an `additionalProperties` error at `/props`, this
 * returns the real prop names (`xAlign`, `yAlign`, ...) so {@link formatErrorMessage} can suggest
 * the one the typo'd key was probably meant to be.
 */
function getKnownPropertiesAtPath(
    schema: Record<string, unknown>,
    definitionKey: string,
    instancePath: string,
): string[] {
    const definitions = (schema.definitions as Record<string, unknown>) ?? {};
    let node: unknown = resolveDefinitionRef(definitions[definitionKey], definitions);
    for (const segment of splitInstancePath(instancePath)) {
        const leaf = collectLeafProperties(node, definitions);
        const next = leaf?.properties[segment];
        if (next === undefined) return [];
        node = resolveDefinitionRef(next, definitions);
    }
    return Object.keys(collectLeafProperties(node, definitions)?.properties ?? {});
}

/**
 * Ajv's `anyOf`/`oneOf` reports one error per *rejected* branch, plus a summary error for the
 * union itself — for a schema this recursive (a switch's `condition`/`then`/`else` all resolve
 * through the same wide unions, several levels deep), that fans out into dozens of "must have
 * required property X" complaints about branches that were never the intended shape to begin
 * with (e.g. checking a comparison's `rightValue` against the arithmetic-operation branch). None
 * of that is actionable, so it's trimmed down to what the failing *value* is actually missing:
 *
 * 1. Keep only "leaf" errors — drop any error whose `instancePath` is an ancestor of another
 *    error's, since the deeper one is strictly more specific about what's actually wrong.
 * 2. At each remaining path, prefer a concrete reason (`type`, `const`, `enum`, ...) over the
 *    bare "must match a schema in anyOf"/"oneOf" summary, when one is available.
 * 3. Collapse repeats of the same complaint on the same field across sibling branches (e.g. one
 *    per switch case) into a single warning.
 */
function simplifySchemaErrors(errors: ErrorObject[]): ErrorObject[] {
    const instancePaths = errors.map((error) => error.instancePath);
    const isAncestorOfAnother = (path: string) =>
        instancePaths.some((other) => other !== path && other.startsWith(`${path}/`));
    const leaves = errors.filter((error) => !isAncestorOfAnother(error.instancePath));

    const byPath = new Map<string, ErrorObject[]>();
    for (const error of leaves) {
        const group = byPath.get(error.instancePath) ?? [];
        group.push(error);
        byPath.set(error.instancePath, group);
    }

    const specificOverUnionWrapper: ErrorObject[] = [];
    for (const group of byPath.values()) {
        const specific = group.filter(
            (error) => error.keyword !== "anyOf" && error.keyword !== "oneOf",
        );
        specificOverUnionWrapper.push(...(specific.length > 0 ? specific : group));
    }

    const seen = new Set<string>();
    return specificOverUnionWrapper.filter((error) => {
        const key = `${getInvalidElement(error)}|${error.message}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * Builds one {@link SchemaValidationIssue} per error, applying {@link getInvalidElement},
 * {@link formatErrorMessage}, and {@link findNearestOrigin} consistently regardless of which
 * path (narrowed-to-one-operation, or the original fallback) produced the error.
 */
function toIssues(
    errors: ErrorObject[],
    data: unknown,
    knownPropertiesFor?: (error: ErrorObject) => readonly string[] | undefined,
): SchemaValidationIssue[] {
    return errors.map((error) => ({
        instancePath: error.instancePath || "(root)",
        element: getInvalidElement(error),
        message: formatErrorMessage(error, knownPropertiesFor?.(error)),
        origin: findNearestOrigin(data, error.instancePath),
    }));
}

/**
 * Top-level error simplification for a whole-document validation failure. Every leaf error is
 * first attributed to its nearest enclosing operation (see {@link findEnclosingOperation}); when
 * that operation's `type`/`operationType` uniquely identify one schema definition, the operation
 * is re-validated in isolation against just that definition (see
 * {@link validateAgainstDefinition}) instead of reporting the original fanned-out errors — this
 * is what collapses e.g. a single typo'd prop key into one specific warning instead of one per
 * rejected union branch. Errors with no identifiable enclosing operation (or an ambiguous/no
 * match) fall back to the original {@link simplifySchemaErrors} behavior, scoped to their own
 * group so unrelated groups can't suppress each other's messages.
 */
function simplifyErrorsForDocument(
    errors: ErrorObject[],
    data: unknown,
    schema: unknown,
): SchemaValidationIssue[] {
    const instancePaths = errors.map((error) => error.instancePath);
    const isAncestorOfAnother = (path: string) =>
        instancePaths.some((other) => other !== path && other.startsWith(`${path}/`));
    const leaves = errors.filter((error) => !isAncestorOfAnother(error.instancePath));

    const schemaRecord =
        schema && typeof schema === "object" ? (schema as Record<string, unknown>) : undefined;

    const operationGroups = new Map<
        string,
        { node: Record<string, unknown>; errors: ErrorObject[] }
    >();
    const ungrouped: ErrorObject[] = [];

    for (const error of leaves) {
        const enclosing = schemaRecord
            ? findEnclosingOperation(data, error.instancePath)
            : undefined;
        if (!enclosing) {
            ungrouped.push(error);
            continue;
        }
        const group = operationGroups.get(enclosing.path);
        if (group) {
            group.errors.push(error);
        } else {
            operationGroups.set(enclosing.path, { node: enclosing.node, errors: [error] });
        }
    }

    const issues: SchemaValidationIssue[] = toIssues(simplifySchemaErrors(ungrouped), data);

    for (const [operationPath, group] of operationGroups) {
        const matches = schemaRecord
            ? findMatchingLeafDefinitionKeys(schemaRecord, group.node)
            : [];
        const definitionKey = matches.length === 1 ? matches[0] : undefined;
        if (!definitionKey || !schemaRecord) {
            issues.push(...toIssues(simplifySchemaErrors(group.errors), data));
            continue;
        }
        const narrowErrors = simplifySchemaErrors(
            validateAgainstDefinition(schemaRecord, definitionKey, group.node),
        );
        const rebasedErrors = narrowErrors.map((error) => ({
            ...error,
            instancePath: `${operationPath}${error.instancePath}`,
        }));
        issues.push(
            ...toIssues(rebasedErrors, data, (error) =>
                getKnownPropertiesAtPath(
                    schemaRecord,
                    definitionKey,
                    error.instancePath.slice(operationPath.length),
                ),
            ),
        );
    }

    return issues;
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

    /**
     * Among every hashtag command {@link getUnknownHashtagCommands} would flag as unrecognized,
     * finds the ones that are a very likely typo of a registered `"zod"`-validated command instead
     * of something genuinely unknown — a distraction error (`# shwo image bg` for `# show image
     * bg`) rather than a deliberately custom command a project registers on its own dev
     * server/app. Purely additive: it never changes what {@link getUnknownHashtagCommands} itself
     * reports, only adds a second, more specific diagnostic on top for the subset it's confident
     * about.
     *
     * For each unknown occurrence, every registered command's `"zod"` schema is scored (see
     * {@link scoreZodArrayBranch}) against the command's tokens; only once the best-scoring branch
     * clears {@link LIKELY_HASHTAG_MATCH_SCORE_THRESHOLD} is the command actually re-validated
     * against that one schema with `Ajv2020` (see {@link getZodArrayValidator}) to find the
     * concrete mismatch(es) to report — a `"regexp"`/`"literal"` validation has no JSON Schema to
     * validate against and is never a candidate here.
     *
     * @param source   Raw Ink source text to scan.
     * @param commands List of known command descriptors (e.g. obtained from
     *                 `GET /__pixi-vn-ink/hashtag-commands`).
     * @returns Array of {@link LikelyUnknownHashtagCommandSchemaIssue}, one per concrete Ajv
     *          mismatch found on the closest-matching command, empty when nothing scores high
     *          enough to be worth reporting.
     */
    export function getLikelyUnknownHashtagCommandSchemaIssues(
        source: string,
        commands: InkHashtagCommandInfo[],
    ): LikelyUnknownHashtagCommandSchemaIssue[] {
        const zodCommands = commands.filter(
            (
                command,
            ): command is InkHashtagCommandInfo & {
                validation: { type: "zod"; schema: Record<string, unknown> };
            } => command.validation.type === "zod",
        );
        if (zodCommands.length === 0) return [];

        const issues: LikelyUnknownHashtagCommandSchemaIssue[] = [];
        for (const occurrence of extractHashtagCommands(source)) {
            if (
                commands.some(({ validation }) =>
                    matchesHashtagValidation(occurrence.tokens, validation),
                )
            ) {
                continue; // recognized by some registered command — not this function's concern
            }

            let best:
                | {
                      command: (typeof zodCommands)[number];
                      branch: Record<string, unknown>;
                      score: number;
                  }
                | undefined;
            for (const command of zodCommands) {
                for (const branch of collectZodArrayBranches(command.validation.schema)) {
                    const { score, hasDiscriminant } = scoreZodArrayBranch(
                        occurrence.tokens,
                        branch,
                    );
                    if (!hasDiscriminant) continue;
                    if (!best || score > best.score) {
                        best = { command, branch, score };
                    }
                }
            }
            if (!best || best.score < LIKELY_HASHTAG_MATCH_SCORE_THRESHOLD) continue;

            const validate = getZodArrayValidator(
                normalizeZodArrayBranchForValidation(best.branch),
            );
            if (validate(occurrence.tokens)) continue; // no concrete Ajv mismatch to point at after all

            for (const error of simplifySchemaErrors(validate.errors ?? [])) {
                issues.push({
                    line: occurrence.line,
                    command: occurrence.command,
                    handlerName: best.command.name,
                    instancePath: error.instancePath || "(root)",
                    element: getLikelyHashtagInvalidElement(error, occurrence.tokens),
                    message: formatLikelyHashtagErrorMessage(error),
                    score: best.score,
                });
            }
        }
        return issues;
    }

    /**
     * Returns all `-> target` diverts in `source` whose target cannot be resolved
     * locally (knots / stitches defined in the same file) and is not present in
     * `knownLabels` (labels collected from other ink files or from
     * `vite-plugin-pixi-vn`).
     *
     * Built-in ink targets (`DONE`, `END`) are always considered valid.
     *
     * @param source      Raw Ink source text to scan.
     * @param knownLabels Flat list of label ids known at build / dev-server time.
     * @returns           Array of {@link DivertOccurrence} objects, each with the
     *                    1-based `line` and the raw `target` string. Each distinct
     *                    target is reported only once.
     */
    export function getUnknownDivertTargets(
        source: string,
        knownLabels: readonly string[],
    ): DivertOccurrence[] {
        // Collect knots and stitches defined locally in this file.
        const localLabels = new Set<string>();
        for (const match of source.matchAll(INK_LOCAL_LABEL_PATTERN)) {
            if (match[1]) localLabels.add(match[1]);
        }

        const knownLabelsSet = new Set(knownLabels);
        const reported = new Set<string>();
        const lines = source.split(/\r?\n/);
        const unknown: DivertOccurrence[] = [];

        for (let i = 0; i < lines.length; i++) {
            // Strip single-line comments before scanning for diverts.
            const lineText = (lines[i] ?? "").replace(/\/\/.*$/, "");
            for (const match of lineText.matchAll(/->[ \t]+(\w[\w.]*)/g)) {
                const target = match[1];
                if (!target) continue;
                const topLevel = target.split(".")[0] ?? target;
                if (
                    INK_BUILT_IN_DIVERT_TARGETS.has(topLevel) ||
                    localLabels.has(topLevel) ||
                    knownLabelsSet.has(target) ||
                    // ink uses dot notation (myKnot.myStitch); pixi-vn JSON uses "_|_"
                    knownLabelsSet.has(target.replaceAll(".", INK_LABEL_SEPARATOR)) ||
                    knownLabelsSet.has(topLevel)
                ) {
                    continue;
                }
                if (!reported.has(target)) {
                    reported.add(target);
                    unknown.push({ line: i + 1, target });
                }
            }
        }

        return unknown;
    }

    /**
     * Compiles a JSON Schema object into a reusable Ajv validator. Fetching the schema (from a
     * URL, a bundled file, ...) and caching the result across calls is entirely up to the caller
     * (e.g. `vitePluginInk` fetches by the document's own `$schema` URL and caches per URL; a VS
     * Code extension might instead cache to disk or bundle a schema offline) — this function only
     * ever compiles the schema object it's given.
     *
     * @param schema JSON Schema object to compile.
     * @returns A compiled Ajv validator, reusable across many {@link validateAgainstJsonSchema} calls.
     */
    export function getSchemaValidator(schema: object): ValidateFunction {
        const ajv = new Ajv({ strict: false, allErrors: true });
        return ajv.compile(schema);
    }

    /**
     * Validates a document against a JSON Schema, returning any mismatch as a structured
     * {@link SchemaValidationIssue} — never throws on a validation mismatch, so a schema drift
     * never has to block a caller's build/compile step. Mismatches on an exported `PixiVNJson`
     * payload are expected to mostly land inside `operations` (e.g. a custom hashtag-command
     * handler returning a slightly malformed operation), so each issue includes the nearest
     * `$origin` — the original `# ...` ink source line — when one can be traced, to make it
     * findable.
     *
     * Returns plain data rather than logging/warning itself: it's up to the caller (a Vite plugin,
     * a VS Code extension, ...) to decide how each issue is surfaced (console warning, editor
     * diagnostic with a squiggly under `element`, ...).
     *
     * @param data   The document to validate.
     * @param schema Either a JSON Schema object (compiled on the fly via
     *               {@link getSchemaValidator}) or an already-compiled validator — pass a
     *               precompiled one when validating many documents against the same schema to
     *               avoid recompiling every time.
     * @returns Array of {@link SchemaValidationIssue}, empty when the document is valid.
     */
    export function validateAgainstJsonSchema(
        data: unknown,
        schema: object | ValidateFunction,
    ): SchemaValidationIssue[] {
        const validate: ValidateFunction =
            typeof schema === "function"
                ? (schema as ValidateFunction)
                : getSchemaValidator(schema);

        const valid = validate(data);
        if (valid) return [];

        return simplifyErrorsForDocument(validate.errors ?? [], data, validate.schema);
    }

    /**
     * Splits `tokens` into order-independent `<key> <value> [<value2> ...]` sections, one per
     * occurrence of any of `keys`, scanning right to left.
     *
     * The right-most occurrence of any known key starts a section running to the end of the
     * still-unprocessed tail (initially the whole array); the scan then continues to its left for
     * the next key, and so on, until no more keys are found. Tokens before the left-most matched
     * key (e.g. a command's own fixed arguments, like `show imagecontainer sly`) are ignored, as
     * are any tokens between two matched keys that aren't themselves a key (they belong to the
     * section of the key to their left).
     *
     * @example
     * `extractKeyedSections(["show","imagecontainer","sly","props","xAlign","0.2","yAlign","1","movein","direction","right","ease","anticipate"], ["props","movein"])`
     * returns `[{ key: "props", sectionTokens: ["xAlign","0.2","yAlign","1"] }, { key: "movein", sectionTokens: ["direction","right","ease","anticipate"] }]`.
     *
     * @param tokens Full token list to scan (e.g. the output of `convertTagTolist`).
     * @param keys   The keys to look for (typically `Object.keys(keySchemas)`). An element that is
     *               a number, or a string containing only digits (object keys are always strings
     *               at runtime, so `3` and `"3"` are equivalent here), is treated as a *numeric*
     *               key instead of a literal token — see the numeric-key pass below.
     * @returns One entry per matched key, in left-to-right (original) order — numeric-key sections
     *          first (they only ever occur in the prefix left over after every string key has been
     *          matched), then string-key sections. `sectionTokens` is the (possibly empty) slice of
     *          tokens belonging to that key.
     *
     * Numeric keys are resolved by **position**, in a second pass that runs only after every string
     * key has already claimed its section above. Counting starts at `0` for `tokens[0]` (e.g. the
     * command's own leading literal, like `"show"`). Numeric keys are processed largest to
     * smallest, each bounded by `end` — the left edge of whatever the previous match (string or
     * numeric) already claimed, starting from the left-most string-key match (or `tokens.length` if
     * none matched): key `N` claims `tokens.slice(N, end)` as its section, then `end` becomes
     * `N - 1` — dropping `tokens[N - 1]` (e.g. a dynamic alias no literal key could match) along
     * with it, so the next, smaller numeric key resumes scanning to its left. A numeric key outside
     * the current `[0, end)` bound (e.g. it collides with an already-claimed region) is skipped.
     *
     * @example
     * For `["show","spine","flowerTop","x","220","y","20","with","dissolve","duration","2"]` with
     * keys `["with", "dissolve", 3]`: the string-key pass matches `"dissolve"` (section
     * `["duration","2"]`) then `"with"` (empty section), leaving `end = 7`. The numeric pass then
     * matches key `3`: section = `tokens.slice(3, 7)` = `["x","220","y","20"]`, and drops
     * `tokens[2]` (`"flowerTop"`) too.
     */
    export function extractKeyedSections(
        tokens: readonly string[],
        keys: readonly (string | number)[],
    ): { key: string | number; sectionTokens: string[] }[] {
        const stringKeys = new Set<string>();
        const numericKeys: number[] = [];
        for (const key of keys) {
            const numericKey = toNumericKey(key);
            if (numericKey !== undefined) {
                numericKeys.push(numericKey);
            } else {
                stringKeys.add(String(key));
            }
        }
        numericKeys.sort((a, b) => b - a);

        const stringSections: { key: string; sectionTokens: string[] }[] = [];
        let end = tokens.length;
        for (let index = tokens.length - 1; index >= 0; index--) {
            if (stringKeys.has(tokens[index])) {
                stringSections.push({
                    key: tokens[index],
                    sectionTokens: tokens.slice(index + 1, end),
                });
                end = index;
            }
        }
        stringSections.reverse();

        const numericSections: { key: number; sectionTokens: string[] }[] = [];
        for (const key of numericKeys) {
            if (key < 0 || key >= end) continue;
            numericSections.push({ key, sectionTokens: tokens.slice(key, end) });
            end = key - 1;
        }
        numericSections.reverse();

        return [...numericSections, ...stringSections];
    }

    /**
     * Parses `key` as a non-negative-integer position for {@link extractKeyedSections}'s numeric
     * pass — accepting either an actual `number` or a digit-only string (`Object.keys(...)` always
     * yields strings, even for numeric object keys like `{ 3: ... }`). Returns `undefined` for
     * anything else (a literal string key).
     */
    function toNumericKey(key: string | number): number | undefined {
        if (typeof key === "number") {
            return Number.isInteger(key) && key >= 0 ? key : undefined;
        }
        return /^\d+$/.test(key) ? Number(key) : undefined;
    }

    /**
     * Validates the order-independent keyed sections of a command's token list (see
     * {@link extractKeyedSections}) against their JSON Schemas.
     *
     * Each section's tokens are converted to an object with the same `<key> <value>` pairing logic
     * as `HashtagCommands.convertListStringToObj`, then validated with
     * {@link validateAgainstJsonSchema}. A section that can't be paired into `<key> <value>` (an
     * odd number of tokens, or a malformed value) is reported as its own issue instead of throwing.
     *
     * @param tokens     Full token list to scan (e.g. the output of `convertTagTolist`).
     * @param keySchemas JSON Schemas keyed by the token that introduces each section — see
     *                   `HashtagHandlerOptions.keySchemas`.
     * @returns One {@link KeyedSchemaValidationIssue} per mismatch, empty when every section is
     *          valid (including when no key is found at all).
     */
    export function validateKeyedJsonSchemas(
        tokens: readonly string[],
        keySchemas: Record<string | number, object>,
    ): KeyedSchemaValidationIssue[] {
        const sections = extractKeyedSections(tokens, Object.keys(keySchemas));
        const issues: KeyedSchemaValidationIssue[] = [];
        for (const { key, sectionTokens } of sections) {
            let obj: object;
            try {
                obj = HashtagCommands.convertListStringToObj(sectionTokens);
            } catch (error) {
                issues.push({
                    key,
                    instancePath: "(root)",
                    element: String(key),
                    message: `could not parse "${key}" section into key/value pairs: ${
                        error instanceof Error ? error.message : String(error)
                    }`,
                });
                continue;
            }
            const schemaIssues = validateAgainstJsonSchema(obj, keySchemas[key]);
            issues.push(...schemaIssues.map((issue) => ({ ...issue, key })));
        }
        return issues;
    }

    /**
     * Returns every {@link HashtagKeySchemaIssue} found while scanning `source`'s hashtag
     * commands: for each command that matches a registered {@link InkHashtagCommandInfo} with a
     * `keySchemas`, its keyed sections (see {@link extractKeyedSections}) are validated against
     * that command's schemas.
     *
     * Unlike {@link getUnknownHashtagCommands} (which flags a command matching *no* registered
     * validation), this only runs on commands that already matched one — it is purely additive and
     * doesn't affect unknown-command detection. A command with no matching entry, or a matching
     * entry with no `keySchemas`, is simply skipped.
     *
     * @param source   Raw Ink source text to scan.
     * @param commands List of known command descriptors (e.g. obtained from
     *                 `GET /__pixi-vn-ink/hashtag-commands`).
     * @returns Array of {@link HashtagKeySchemaIssue}, empty when every keyed section validates.
     */
    export function getHashtagKeySchemaIssues(
        source: string,
        commands: InkHashtagCommandInfo[],
    ): HashtagKeySchemaIssue[] {
        const issues: HashtagKeySchemaIssue[] = [];
        for (const occurrence of extractHashtagCommands(source)) {
            const matched = commands.find(({ validation }) =>
                matchesHashtagValidation(occurrence.tokens, validation),
            );
            if (!matched?.keySchemas) continue;
            const keyIssues = validateKeyedJsonSchemas(occurrence.tokens, matched.keySchemas);
            issues.push(
                ...keyIssues.map((issue) => ({
                    ...issue,
                    line: occurrence.line,
                    command: occurrence.command,
                })),
            );
        }
        return issues;
    }
}
