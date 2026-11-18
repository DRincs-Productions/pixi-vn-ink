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

type InkLists = Map<string, { key: string; value: number }[]>;

type InkConversionContext = {
    lists: InkLists;
    inkNames: Map<string, string>;
    choiceBodies: Map<string, PixiVNJsonLabelStep[]>;
    divertParameters: Map<string, Set<number>>;
    divertVariables: Set<string>;
};

function isGeneratedChoiceLabel(label: string): boolean {
    return /_\|_c-\d+$/.test(label);
}

function visitInkValues(value: unknown, visit: (entry: Record<string, unknown>) => void): void {
    if (Array.isArray(value)) {
        for (const item of value) visitInkValues(item, visit);
    } else if (value && typeof value === "object") {
        const entry = value as Record<string, unknown>;
        visit(entry);
        for (const item of Object.values(entry)) visitInkValues(item, visit);
    }
}

function isValueGet(value: unknown, storageType: string): value is { key: unknown } {
    if (!value || typeof value !== "object") return false;
    const entry = value as Record<string, unknown>;
    return (
        entry.type === "value" &&
        entry.storageOperationType === "get" &&
        entry.storageType === storageType &&
        "key" in entry
    );
}

function inkParameter(index: unknown, path: string): string {
    if (typeof index !== "number" || !Number.isSafeInteger(index) || index < 0) {
        throw new Error(`Invalid Ink parameter index at ${path}`);
    }
    return `ink_param_${index}`;
}

function inkAddress(label: string, path: string): string {
    return label
        .split("_|_")
        .map((name) => {
            assertInkName(name, path);
            return name;
        })
        .join(".");
}

/** Converts the representable subset of PixiVN JSON into an Ink script. */
export function convertJsonToInk(data: PixiVNJson): string {
    const labels = data.labels ?? {};
    const blocks: string[] = [];
    const inkNames = new Map<string, string>();
    const choiceBodies = new Map<string, PixiVNJsonLabelStep[]>();
    const divertParameters = new Map<string, Set<number>>();
    const divertVariables = new Set<string>();
    const arities = new Map<string, number>();
    const lists: InkLists = new Map();
    const context = { lists, inkNames, choiceBodies, divertParameters, divertVariables };
    for (const [label, steps] of Object.entries(labels)) {
        const owner = label.replace(/(?:_\|_c-\d+)+$/, "");
        visitInkValues(steps, (entry) => {
            if (isValueGet(entry, "params") && typeof entry.key === "number") {
                arities.set(owner, Math.max(arities.get(owner) ?? 0, entry.key + 1));
            }
            if (typeof entry.label === "string" && Array.isArray(entry.params)) {
                arities.set(
                    entry.label,
                    Math.max(arities.get(entry.label) ?? 0, entry.params.length),
                );
            }
            const target = entry.label;
            if (
                (entry.type === "jump" || entry.type === "call") &&
                isValueGet(target, "params") &&
                typeof target.key === "number"
            ) {
                const parameters = divertParameters.get(owner) ?? new Set<number>();
                parameters.add(target.key);
                divertParameters.set(owner, parameters);
            }
            if (
                (entry.type === "jump" || entry.type === "call") &&
                isValueGet(target, "storage") &&
                typeof target.key === "string"
            ) {
                divertVariables.add(target.key);
            }
        });
    }
    const signature = (label: string) => {
        const count = arities.get(label) ?? 0;
        if (!count) return "";
        const parameters = Array.from({ length: count }, (_, index) => {
            const name = inkParameter(index, `labels.${label}`);
            return divertParameters.get(label)?.has(index) ? `-> ${name}` : name;
        });
        return `(${parameters.join(", ")})`;
    };
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

    if (data.initialOperations?.length) {
        blocks.push(convertInitialOperations(data.initialOperations, context).join("\n"));
    }

    for (const [knot, entries] of knots) {
        const lines = [`=== ${knot}${signature(knot)} ===`];
        for (const { label, stitch } of entries) {
            if (stitch !== undefined) lines.push(`= ${stitch}${signature(label)}`);
            lines.push(...convertSteps(labels[label], `labels.${label}`, context));
        }
        blocks.push(lines.join("\n"));
    }

    for (const label of choiceBodies.keys()) {
        throw new Error(`Unreferenced generated choice body at labels.${label}`);
    }

    return blocks.join("\n\n");
}

function convertInitialOperations(
    operations: NonNullable<PixiVNJson["initialOperations"]>,
    context: InkConversionContext,
): string[] {
    const lines: string[] = [];
    const scalarLines = new Set<number>();
    for (let index = 0; index < operations.length; index++) {
        const operation = operations[index];
        const path = `initialOperations[${index}]`;
        if (operation.type !== "value") throw new Error(`Unsupported JSON to Ink value at ${path}`);

        if (
            typeof operation.key === "string" &&
            Array.isArray(operation.value) &&
            operation.value.length
        ) {
            const name = operation.key;
            assertInkName(name, `${path}.key`);
            if (operation.storageType !== "storage" || operation.storageOperationType !== "set") {
                throw new Error(`Unsupported Ink list declaration at ${path}`);
            }
            const members = operation.value.map((value, offset) => {
                const memberIndex = index + offset + 1;
                const memberPath = `initialOperations[${memberIndex}]`;
                const member = operations[memberIndex];
                if (
                    member?.type !== "value" ||
                    member.storageType !== "storage" ||
                    member.storageOperationType !== "set" ||
                    typeof member.key !== "string" ||
                    !member.key.startsWith(`${name}.`) ||
                    member.value !== value ||
                    typeof value !== "number" ||
                    !Number.isSafeInteger(value)
                ) {
                    throw new Error(`Missing or invalid Ink list member at ${memberPath}`);
                }
                const key = member.key.slice(name.length + 1);
                assertInkName(key, `${memberPath}.key`);
                return { key, value };
            });
            if (new Set(members.map(({ key }) => key)).size !== members.length) {
                throw new Error(`Duplicate Ink list member at ${path}`);
            }

            const selected = new Set<string>();
            for (let previous = index - 1; scalarLines.has(previous); previous--) {
                const candidate = operations[previous];
                const member = members.find(
                    ({ key, value }) =>
                        candidate.type === "value" &&
                        candidate.storageType === "storage" &&
                        candidate.storageOperationType === "set" &&
                        candidate.key === key &&
                        candidate.value === value &&
                        !context.divertVariables.has(key),
                );
                if (!member || selected.has(member.key)) break;
                selected.add(member.key);
                lines.pop();
                scalarLines.delete(previous);
            }
            const membersInk = members.map(({ key, value }) =>
                selected.has(key) ? `(${key} = ${value})` : `${key} = ${value}`,
            );
            context.lists.set(name, members);
            lines.push(`LIST ${name} = ${membersInk.join(", ")}`);
            index += members.length;
            continue;
        }

        lines.push(convertVariableSet(operation, path, true, context));
        scalarLines.add(index);
    }
    return lines;
}

function convertSteps(
    steps: PixiVNJsonLabelStep[],
    path: string,
    context: InkConversionContext,
    start = 0,
): string[] {
    const lines: string[] = [];
    for (let index = start; index < steps.length; index++) {
        const step = steps[index];
        const previous = steps[index - 1];
        const stepPath = `${path}[${index}]`;
        const rendered = convertStep(step, stepPath, context);
        if (previous?.glueEnabled && previous.goNextStep === false) {
            if (step.dialogue === undefined || rendered.length !== 1) {
                throw new Error(`Unsupported step after leading glue at ${stepPath}`);
            }
            rendered[0] = `<>${rendered[0]}`;
        } else if (
            step.dialogue !== undefined &&
            previous?.dialogue !== undefined &&
            (typeof previous.dialogue !== "string" || typeof step.dialogue !== "string") &&
            previous.glueEnabled &&
            previous.goNextStep &&
            rendered.length === 1 &&
            lines.at(-1)?.endsWith(" <>")
        ) {
            lines[lines.length - 1] = lines[lines.length - 1].slice(0, -3) + rendered[0];
            continue;
        } else if (
            step.labelToOpen &&
            step.glueEnabled &&
            rendered.length === 1 &&
            previous?.dialogue !== undefined &&
            previous.goNextStep &&
            lines.length
        ) {
            lines[lines.length - 1] += rendered[0];
            continue;
        }
        lines.push(...rendered);
    }
    const last = steps.at(-1);
    if (last?.glueEnabled && last.goNextStep === false) {
        throw new Error(`Missing step after leading glue at ${path}[${steps.length - 1}]`);
    }
    return lines;
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
                lines.push(
                    convertVariableSet(operation, `${path}.operations[${index}]`, false, context),
                );
            } else if ("$origin" in operation && operation.$origin) {
                lines.push(convertTag(operation.$origin, `${path}.operations[${index}].$origin`));
            } else if (operation.type === "operationtoconvert") {
                const [tag] = operation.values;
                const tagPath = `${path}.operations[${index}].values`;
                if (operation.values.length !== 1 || typeof tag !== "string") {
                    throw new Error(`Unsupported dynamic Ink tag at ${tagPath}`);
                }
                lines.push(convertTag(tag, tagPath));
            } else {
                throw new Error(`Unsupported operation at ${path}.operations[${index}]`);
            }
        }
    }
    if (
        step.dialogue === undefined &&
        step.glueEnabled &&
        step.goNextStep &&
        !step.operations?.length
    ) {
        lines.push("<>");
    }
    if (step.dialogue !== undefined) {
        const dialogue = convertDialog(step.dialogue, `${path}.dialogue`, context.lists);
        if (step.glueEnabled && step.goNextStep === true) lines.push(`${dialogue} <>`);
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
                const condition = toInkCondition(
                    choice.condition,
                    `${choicePath}.condition`,
                    context.lists,
                );
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
        if (step.labelToOpen.type !== "jump" && step.labelToOpen.type !== "call") {
            throw new Error(`Unsupported divert type at ${path}.labelToOpen.type`);
        }
        const label = step.labelToOpen.label;
        const targetPath = `${path}.labelToOpen.label`;
        let target: string;
        if (typeof label === "string") {
            target = inkAddress(label, targetPath);
        } else if (isValueGet(label, "params")) {
            target = inkParameter(label.key, targetPath);
        } else if (
            (isValueGet(label, "storage") || isValueGet(label, "tempstorage")) &&
            typeof label.key === "string"
        ) {
            assertInkName(label.key, targetPath);
            target = label.key;
        } else {
            throw new Error(`Unsupported dynamic divert at ${targetPath}`);
        }
        const params = step.labelToOpen.params?.map((param, index) => {
            const paramPath = `${path}.labelToOpen.params[${index}]`;
            if (
                typeof label === "string" &&
                context.divertParameters.get(label)?.has(index) &&
                typeof param === "string"
            )
                return `-> ${inkAddress(param, paramPath)}`;
            return toInkExpression(param, paramPath, context.lists);
        });
        const args = params?.length ? `(${params.join(", ")})` : "";
        lines.push(`-> ${target}${args}${step.labelToOpen.type === "call" ? " ->" : ""}`);
    }
    if (step.end === "game_end") lines.push("-> END");
    else if (step.end === "label_end") lines.push("-> DONE");
    else if (step.end !== undefined)
        throw new Error(`Conditional end at ${path}.end is not supported`);

    // goNextStep is reflected by adjacent Ink content, where the mapper sets it again.
    return lines;
}

function convertTag(tag: string, path: string): string {
    if (!tag.trim() || /[\r\n]/.test(tag)) {
        throw new Error(`Invalid Ink tag at ${path}`);
    }
    return `# ${tag}`;
}

function convertConditionalStep(
    conditional: PixiVNJsonConditionalStatements<PixiVNJsonLabelStep>,
    path: string,
    context: InkConversionContext,
): string[] {
    if (conditional.type !== "ifelse") throw new Error(`Unsupported conditional step at ${path}`);
    const statement = conditional as PixiVNJsonIfElse<PixiVNJsonLabelStep>;
    const condition = toInkCondition(statement.condition, `${path}.condition`, context.lists);
    const thenText = "dialogue" in statement.then ? statement.then.dialogue : undefined;
    const elseText =
        statement.else && "dialogue" in statement.else ? statement.else.dialogue : undefined;
    if (
        typeof thenText === "string" &&
        typeof elseText === "string" &&
        Object.keys(statement.then).length === 1 &&
        Object.keys(statement.else ?? {}).length === 1 &&
        (thenText !== thenText.trim() || elseText !== elseText.trim()) &&
        !/[\r\n|]/.test(thenText) &&
        !/[\r\n|]/.test(elseText)
    ) {
        return [`{ ${condition}:${escapeInkText(thenText)}|${escapeInkText(elseText)}}`];
    }
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
        const bodyLines = convertSteps(
            body,
            `labels.${choice.label}`,
            context,
            echoesChoice ? 1 : 0,
        ).map((line) =>
            line.replace(
                /^(\s*)([*]+|[+]+)(?= |$)/,
                (_, space: string, markers: string) => space + markers + markers[0],
            ),
        );
        const inlineDivert = bodyLines[0];
        if (fallback && inlineDivert?.startsWith("-> ")) {
            return [`${header} ${inlineDivert}`, ...indent(bodyLines.slice(1))];
        }
        if (!echoesChoice && /^[ \t]+-> /.test(inlineDivert ?? "")) {
            return [header + inlineDivert, ...indent(bodyLines.slice(1))];
        }
        return [header, ...indent(bodyLines)];
    }
    const labelName = context.inkNames.get(choice.label) ?? choice.label.replaceAll("_|_", ".");
    return [
        fallback
            ? `${choicePrefix} -> ${labelName}`
            : `${choicePrefix} [${escapeInkText(text)}] -> ${labelName}`,
    ];
}

function convertDialog(dialogue: unknown, path: string, lists: InkLists): string {
    if (typeof dialogue === "string") return escapeInkText(dialogue);
    if (dialogue && typeof dialogue === "object" && "character" in dialogue && "text" in dialogue) {
        const { character, text } = dialogue as { character: unknown; text: unknown };
        if (typeof character === "string" && typeof text === "string") {
            return `${assertSpeaker(character, path)}: ${escapeInkText(text)}`;
        }
    }
    return toInkTextExpression(dialogue as PixiVNJsonDialogText, path, lists);
}

function assertSpeaker(value: string, path: string): string {
    assertInkName(value, path);
    return value;
}

function toInkTextExpression(value: PixiVNJsonDialogText, path: string, lists: InkLists): string {
    if (typeof value === "string") return escapeInkText(value);
    if (Array.isArray(value))
        return value
            .map((part) => toInkTextExpression(part as PixiVNJsonDialogText, path, lists))
            .join("");
    if (value && typeof value === "object" && "type" in value) {
        return `{${toInkExpression(value, path, lists)}}`;
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
    context: InkConversionContext,
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
    const expression = operation.value;
    if (
        !initial &&
        expression &&
        typeof expression === "object" &&
        "type" in expression &&
        expression.type === "arithmetic" &&
        (expression.operator === "+" || expression.operator === "-") &&
        isValueGet(expression.leftValue, "storage") &&
        expression.leftValue.key === key
    ) {
        return `~ ${key} ${expression.operator}= ${toInkExpression(expression.rightValue, `${path}.value.rightValue`, context.lists)}`;
    }
    const valuePath = `${path}.value`;
    const value =
        context.divertVariables.has(key) && typeof operation.value === "string"
            ? `-> ${inkAddress(operation.value, valuePath)}`
            : toInkExpression(operation.value, valuePath, context.lists);
    return `${initial ? "VAR" : operation.storageType === "tempstorage" ? "~ temp" : "~"} ${key} = ${value}`;
}

function toInkExpression(value: unknown, path: string, lists: InkLists): string {
    if (value === null || typeof value === "boolean" || typeof value === "number")
        return JSON.stringify(value);
    if (typeof value === "string") return JSON.stringify(value);
    if (Array.isArray(value)) {
        if (value.length === 0) return "()";
        for (const [name, members] of lists) {
            const keys = value.map((item) => members.find((member) => member.value === item)?.key);
            if (keys.every((key) => key !== undefined) && new Set(keys).size === keys.length) {
                return `(${keys.map((key) => `${name}.${key}`).join(", ")})`;
            }
        }
        throw new Error(`No matching Ink list for literal at ${path}`);
    }
    if (value && typeof value === "object") {
        const entry = value as Record<string, any>;
        if (entry.type === "value" && entry.storageOperationType === "get") {
            if (entry.storageType === "params") return inkParameter(entry.key, path);
            if (entry.storageType === "storage" || entry.storageType === "tempstorage") {
                if (typeof entry.key !== "string")
                    throw new Error(`Invalid variable name at ${path}`);
                return entry.key
                    .split(".")
                    .map((part) => {
                        assertInkName(part, path);
                        return part;
                    })
                    .join(".");
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
            if (entry.storageType === "logic") return toInkExpression(entry.operation, path, lists);
        }
        if (entry.type === "function") {
            const args = Array.isArray(entry.args)
                ? entry.args.map((arg) => toInkExpression(arg, path, lists))
                : [];
            return `${String(entry.functionName)}(${args.join(", ")})`;
        }
        if (entry.type === "arithmetic") {
            const operator =
                entry.operator === "POW" || entry.operator === "INTERSECTION"
                    ? "^"
                    : String(entry.operator);
            return `(${toInkExpression(entry.leftValue, path, lists)} ${operator} ${toInkExpression(entry.rightValue, path, lists)})`;
        }
        if (entry.type === "arithmeticsingle")
            return `${String(entry.operator)}(${toInkExpression(entry.leftValue, path, lists)})`;
        if (entry.type === "compare" || entry.type === "union")
            return toInkCondition(entry as PixiVNJsonConditions, path, lists);
    }
    throw new Error(`Unsupported Ink expression at ${path}`);
}

function toInkCondition(
    condition: PixiVNJsonConditions | unknown,
    path: string,
    lists: InkLists,
): string {
    if (condition === null || typeof condition !== "object")
        return toInkExpression(condition, path, lists);
    const value = condition as Record<string, unknown>;
    if (value.type === "compare") {
        const comparison = value as unknown as PixiVNJsonComparation;
        return `(${toInkExpression(comparison.leftValue, path, lists)} ${comparison.operator === "CONTAINS" ? "?" : comparison.operator} ${toInkExpression(comparison.rightValue, path, lists)})`;
    }
    if (value.type === "union") {
        const union = value as unknown as PixiVNJsonUnionCondition;
        if (union.unionType === "not")
            return `not (${toInkCondition(union.condition, path, lists)})`;
        return `(${union.conditions.map((item) => toInkCondition(item, path, lists)).join(union.unionType === "and" ? " and " : " or ")})`;
    }
    return toInkExpression(condition, path, lists);
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
