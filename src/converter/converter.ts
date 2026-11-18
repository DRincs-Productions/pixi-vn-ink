import type { CharacterIdSource, LoaderSharedType } from "@/converter/type";
import type InkStoryType from "@/interfaces/InkStoryType";
import { InkMapper } from "@/mapper";
import { InkCompiler } from "@/parser";
import type { CompileSharedType } from "@/parser/types";
import { logger } from "@/utils/log-utility";
import type { PixiVNJson } from "@drincs/pixi-vn-json";
import type {
    PixiVNJsonChoice,
    PixiVNJsonComparation,
    PixiVNJsonConditions,
    PixiVNJsonConditionalStatements,
    PixiVNJsonDialogText,
    PixiVNJsonIfElse,
    PixiVNJsonLabelStep,
    PixiVNJsonOperation,
    PixiVNJsonUnionCondition,
    PixiVNJsonValueGet,
    PixiVNJsonValueSet,
} from "@drincs/pixi-vn-json/schema";
import { HashtagCommands } from "@/handlers/hashtag-commands";
import { ErrorType } from "inkjs/compiler/Parser/ErrorType";
import JSON5 from "json5";

/** Normalises character sources (ids or `{ id }` objects) into a set of ids, or `undefined` if empty. */
export function normalizeCharacterIds(
    characters?: readonly CharacterIdSource[],
): ReadonlySet<string> | undefined {
    if (!characters || characters.length === 0) {
        return undefined;
    }
    const ids = new Set<string>();
    for (const character of characters) {
        const id = typeof character === "string" ? character : character?.id;
        if (typeof id === "string" && id.length > 0) {
            ids.add(id);
        }
    }
    return ids.size > 0 ? ids : undefined;
}

/** Converts Ink source into PixiVN JSON. */
export function convertInkToJson(
    text: string,
    options: Partial<LoaderSharedType> = {},
): PixiVNJson | undefined {
    const shared: CompileSharedType = {
        labelToRemove: [],
        initialVarsToRemove: [],
        functions: options.functions || [],
        enums: options.enums || {},
        textSource: text,
    };
    const { json, issues } = InkCompiler.compile(text, shared);
    issues.forEach(({ message, type }) => {
        if (type === ErrorType.Error) {
            logger.error(`Ink compilation error: ${message}`);
        } else if (type === ErrorType.Warning) {
            logger.warn(`Ink compilation warning: ${message}`);
        } else {
            logger.info(`Ink compilation info: ${message}`);
        }
    });
    if (!json) {
        logger.error("No JSON generated from ink file");
        return;
    }
    let obj: InkStoryType;
    try {
        obj = JSON5.parse(json);
    } catch (_e) {
        logger.error("Error parsing ink file");
        return;
    }
    shared.enums = obj.listDefs || {};
    return InkMapper.inkToJson(obj, {
        ...shared,
        characterIds: normalizeCharacterIds(options.characters),
    });
}

type InkConversionContext = {
    inkNames: Map<string, string>;
    choiceBodies: Map<string, PixiVNJsonLabelStep[]>;
};

function isGeneratedChoiceLabel(label: string): boolean {
    return /_\|_c-\d+$/.test(label);
}

/** Converts the representable subset of PixiVN JSON into an Ink script. */
export function convertJsonToInk(data: PixiVNJson): string {
    const labels = data.labels ?? {};
    const blocks: string[] = [];
    const inkNames = new Map<string, string>();
    const choiceBodies = new Map<string, PixiVNJsonLabelStep[]>();
    const context = { inkNames, choiceBodies };
    for (const label of Object.keys(labels)) {
        if (!label.includes("_|_")) continue;
        const inkName = label.replaceAll("_|_", ".");
        inkNames.set(label, inkName);
    }

    const knots = new Map<string, { label: string; stitch?: string }[]>();
    for (const label of Object.keys(labels)) {
        if (isGeneratedChoiceLabel(label)) {
            choiceBodies.set(label, labels[label]);
            continue;
        }
        const [knot, stitch, nested] = label.split("_|_");
        if (nested !== undefined) {
            throw new Error(`Unsupported nested label at labels.${label}`);
        }
        assertInkName(knot, `labels.${label}`);
        if (stitch !== undefined) assertInkName(stitch, `labels.${label}`);
        const entries = knots.get(knot) ?? [];
        if (stitch === undefined) entries.unshift({ label });
        else entries.push({ label, stitch });
        knots.set(knot, entries);
    }

    for (const [knot, entries] of knots) {
        const lines = [`=== ${knot} ===`];
        for (const { label, stitch } of entries) {
            if (stitch !== undefined) lines.push(`= ${stitch}`);
            for (const [stepIndex, step] of labels[label].entries()) {
                lines.push(...convertStep(step, `labels.${label}[${stepIndex}]`, context));
            }
        }
        blocks.push(lines.join("\n"));
    }

    for (const label of choiceBodies.keys()) {
        throw new Error(`Unreferenced generated choice body at labels.${label}`);
    }

    if (data.initialOperations?.length) {
        const declarations = data.initialOperations.map((operation, index) => {
            if ("type" in operation && operation.type === "value") {
                return convertVariableSet(operation, `initialOperations[${index}]`, true);
            }
            throw new Error(`Unsupported JSON to Ink value at initialOperations[${index}]`);
        });
        blocks.unshift(declarations.join("\n"));
    }
    return blocks.join("\n\n");
}

function convertStep(
    step: PixiVNJsonLabelStep,
    path: string,
    context: InkConversionContext,
): string[] {
    if (step.conditionalStep) {
        return convertConditionalStep(
            step.conditionalStep as any,
            `${path}.conditionalStep`,
            context,
        );
    }
    const lines: string[] = [];
    if (step.operations?.length) {
        for (const [index, operation] of step.operations.entries()) {
            if (operation.type === "value" && operation.storageOperationType === "set") {
                lines.push(convertVariableSet(operation, `${path}.operations[${index}]`, false));
            } else if ("$origin" in operation && operation.$origin) {
                const tokens = HashtagCommands.convertTagTolist(operation.$origin, {
                    mergeInkVariables: false,
                });
                if (tokens.length === 0)
                    throw new Error(`Invalid hashtag origin at ${path}.operations[${index}]`);
                lines.push(`# ${tokens.join(" ")}`);
            } else {
                throw new Error(`Unsupported operation at ${path}.operations[${index}]`);
            }
        }
    }
    if (step.dialogue !== undefined) {
        const dialogue = convertDialog(step.dialogue, `${path}.dialogue`);
        if (step.glueEnabled && step.goNextStep === false) lines.push("<>");
        else if (step.glueEnabled && step.goNextStep === true) lines.push(`${dialogue} <>`);
        else lines.push(dialogue);
    }
    if (step.choices !== undefined) {
        if (!Array.isArray(step.choices)) {
            throw new Error(`Unsupported JSON to Ink choices at ${path}.choices`);
        }
        for (const [index, choice] of step.choices.entries()) {
            const choicePath = `${path}.choices[${index}]`;
            if ("text" in choice) {
                lines.push(...convertChoice(choice, choicePath, context));
            } else if (choice.type === "ifelse" && !choice.else && "text" in choice.then) {
                const condition = toInkCondition(choice.condition, `${choicePath}.condition`);
                lines.push(...convertChoice(choice.then, `${choicePath}.then`, context, condition));
            } else {
                throw new Error(`Unsupported conditional choice at ${choicePath}`);
            }
        }
    }
    if (step.labelToOpen !== undefined) {
        if (Array.isArray(step.labelToOpen) || !("label" in step.labelToOpen)) {
            throw new Error(`Unsupported conditional divert at ${path}.labelToOpen`);
        }
        if (typeof step.labelToOpen.label !== "string") {
            throw new Error(`Dynamic divert label at ${path}.labelToOpen.label is not supported`);
        }
        if (step.labelToOpen.type !== "jump" && step.labelToOpen.type !== "call") {
            throw new Error(`Unsupported divert type at ${path}.labelToOpen.type`);
        }
        const label = step.labelToOpen.label;
        if (isGeneratedChoiceLabel(label)) {
            throw new Error(`Unsupported divert to generated choice at ${path}.labelToOpen.label`);
        }
        lines.push(`-> ${context.inkNames.get(label) ?? label.replaceAll("_|_", ".")}`);
    }
    if (step.end === "game_end") lines.push("-> END");
    else if (step.end === "label_end") lines.push("-> DONE");
    else if (step.end !== undefined)
        throw new Error(`Conditional end at ${path}.end is not supported`);

    // goNextStep is reflected by adjacent Ink content, where the mapper sets it again.
    return lines;
}

function convertConditionalStep(
    conditional: PixiVNJsonConditionalStatements<PixiVNJsonLabelStep>,
    path: string,
    context: InkConversionContext,
): string[] {
    if (conditional.type !== "ifelse") throw new Error(`Unsupported conditional step at ${path}`);
    const statement = conditional as PixiVNJsonIfElse<PixiVNJsonLabelStep>;
    const condition = toInkCondition(statement.condition, `${path}.condition`);
    const thenLines = convertStep(statement.then as PixiVNJsonLabelStep, `${path}.then`, context);
    const elseLines = statement.else
        ? convertStep(statement.else as PixiVNJsonLabelStep, `${path}.else`, context)
        : [];
    return [
        `{ ${condition}:`,
        ...indent(thenLines),
        ...(elseLines.length ? ["- else:", ...indent(elseLines)] : []),
        "}",
    ];
}

function convertChoice(
    choice: PixiVNJsonChoice,
    path: string,
    context: InkConversionContext,
    condition?: string,
): string[] {
    if (choice.type !== "call" && choice.type !== "jump") {
        throw new Error(`Unsupported choice type at ${path}.type`);
    }
    const fallback = choice.autoSelect || choice.onlyHaveNoChoice;
    if (fallback && (!choice.autoSelect || !choice.onlyHaveNoChoice)) {
        throw new Error(`Unsupported fallback choice at ${path}`);
    }
    if (Object.keys(choice.props).length > 0) {
        throw new Error(`Choice props at ${path}.props are not supported`);
    }
    const text = asInkText(choice.text, `${path}.text`);
    if (fallback && text !== "") throw new Error(`Unsupported fallback choice at ${path}`);
    const generated = isGeneratedChoiceLabel(choice.label);
    // The mapper omits oneTime for sticky Ink choices.
    const marker =
        choice.oneTime === false || (generated && choice.oneTime === undefined) ? "+" : "*";
    const choicePrefix = condition ? `${marker} { ${condition} }` : marker;
    if (generated) {
        const body = context.choiceBodies.get(choice.label);
        if (!body) throw new Error(`Missing or repeated generated choice body at ${path}.label`);
        if (choice.type !== "call")
            throw new Error(`Unsupported generated choice type at ${path}.type`);
        context.choiceBodies.delete(choice.label);

        const first = body[0];
        const echoesChoice =
            !fallback && first?.dialogue === text && Object.keys(first).length === 1;
        const header = fallback
            ? choicePrefix
            : `${choicePrefix} ${echoesChoice ? escapeInkText(text) : `[${escapeInkText(text)}]`}`;
        const bodyLines = body.flatMap((step, index) => {
            if (echoesChoice && index === 0) return [];
            const stepPath = `labels.${choice.label}[${index}]`;
            const lines = convertStep(step, stepPath, context);
            return lines.map((line) =>
                line.replace(
                    /^(\s*)([*]+|[+]+)(?= |$)/,
                    (_, space: string, markers: string) => space + markers + markers[0],
                ),
            );
        });
        return [header, ...indent(bodyLines)];
    }
    const labelName = context.inkNames.get(choice.label) ?? choice.label.replaceAll("_|_", ".");
    return [
        fallback
            ? `${choicePrefix} -> ${labelName}`
            : `${choicePrefix} [${escapeInkText(text)}] -> ${labelName}`,
    ];
}

function convertDialog(dialogue: unknown, path: string): string {
    if (typeof dialogue === "string") return escapeInkText(dialogue);
    if (dialogue && typeof dialogue === "object" && "character" in dialogue && "text" in dialogue) {
        const { character, text } = dialogue as { character: unknown; text: unknown };
        if (typeof character === "string" && typeof text === "string") {
            return `${assertSpeaker(character, path)}: ${escapeInkText(text)}`;
        }
    }
    return toInkTextExpression(dialogue as PixiVNJsonDialogText, path);
}

function assertSpeaker(value: string, path: string): string {
    assertInkName(value, path);
    return value;
}

function toInkTextExpression(value: PixiVNJsonDialogText, path: string): string {
    if (typeof value === "string") return escapeInkText(value);
    if (Array.isArray(value))
        return value
            .map((part) => toInkTextExpression(part as PixiVNJsonDialogText, path))
            .join("");
    if (value && typeof value === "object" && "type" in value) {
        return `{${toInkExpression(value, path)}}`;
    }
    throw new Error(`Unsupported dialogue value at ${path}`);
}

function asInkText(text: PixiVNJsonDialogText, path: string): string {
    if (typeof text === "string") return text;
    if (Array.isArray(text) && text.every((part) => typeof part === "string")) {
        return text.join("");
    }
    throw new Error(`Dynamic text at ${path} is not supported`);
}

function convertVariableSet(
    operation: PixiVNJsonValueSet | PixiVNJsonOperation,
    path: string,
    initial: boolean,
): string {
    if (
        operation.type !== "value" ||
        operation.storageType === "params" ||
        operation.storageType === "flagStorage"
    ) {
        throw new Error(`Unsupported variable operation at ${path}`);
    }
    const key = operation.key;
    assertInkName(key, path);
    const value = toInkExpression(operation.value, `${path}.value`);
    return `${initial ? "VAR" : "~"} ${key} = ${value}`;
}

function toInkExpression(value: unknown, path: string): string {
    if (value === null || typeof value === "boolean" || typeof value === "number")
        return JSON.stringify(value);
    if (typeof value === "string") return JSON.stringify(value);
    if (value && typeof value === "object") {
        const entry = value as Record<string, any>;
        if (entry.type === "value" && entry.storageOperationType === "get") {
            if (entry.storageType === "storage" || entry.storageType === "tempstorage") {
                return String(entry.key);
            }
            if (entry.storageType === "label" && typeof entry.label === "string") {
                return entry.label
                    .split("_|_")
                    .map((name) => {
                        assertInkName(name, path);
                        return name;
                    })
                    .join(".");
            }
            if (entry.storageType === "logic") return toInkExpression(entry.operation, path);
        }
        if (entry.type === "function") {
            const args = Array.isArray(entry.args)
                ? entry.args.map((arg) => toInkExpression(arg, path))
                : [];
            return `${String(entry.functionName)}(${args.join(", ")})`;
        }
        if (entry.type === "arithmetic") {
            const operator = entry.operator === "POW" ? "^" : String(entry.operator);
            return `(${toInkExpression(entry.leftValue, path)} ${operator} ${toInkExpression(entry.rightValue, path)})`;
        }
        if (entry.type === "arithmeticsingle")
            return `${String(entry.operator)}(${toInkExpression(entry.leftValue, path)})`;
        if (entry.type === "compare" || entry.type === "union")
            return toInkCondition(entry as PixiVNJsonConditions, path);
    }
    throw new Error(`Unsupported Ink expression at ${path}`);
}

function toInkCondition(condition: PixiVNJsonConditions | unknown, path: string): string {
    if (condition === null || typeof condition !== "object")
        return toInkExpression(condition, path);
    const value = condition as Record<string, unknown>;
    if (value.type === "compare") {
        const comparison = value as unknown as PixiVNJsonComparation;
        return `(${toInkExpression(comparison.leftValue, path)} ${comparison.operator === "CONTAINS" ? "?" : comparison.operator} ${toInkExpression(comparison.rightValue, path)})`;
    }
    if (value.type === "union") {
        const union = value as unknown as PixiVNJsonUnionCondition;
        if (union.unionType === "not") return `not (${toInkCondition(union.condition, path)})`;
        return `(${union.conditions.map((item) => toInkCondition(item, path)).join(union.unionType === "and" ? " and " : " or ")})`;
    }
    return toInkExpression(condition, path);
}

function indent(lines: string[]): string[] {
    return lines.map((line) => `    ${line}`);
}

function assertInkName(value: string, path: string): void {
    if (!/^[A-Za-z_]\w*$/.test(value)) {
        throw new Error(`Name "${value}" at ${path} cannot be represented as an Ink identifier`);
    }
}

function escapeInkText(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}");
}
