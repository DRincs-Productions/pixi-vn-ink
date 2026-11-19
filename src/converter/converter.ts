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
    PixiVNJsonConditionalResultToCombine,
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
    renderedChoices: Set<string>;
    gathers: Map<string, PixiVNJsonLabelStep[]>;
    namedGatherLabels: Set<string>;
    referencedChoices: Set<string>;
    implicitGather?: string;
    choiceDepth?: number;
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

/** Ink identifiers cannot contain `-`, so generated choice names (`c-0`) are spelled `c_0`. */
function inkSegment(name: string): string {
    return /^c-\d+$/.test(name) ? name.replace("-", "_") : name;
}

function inkAddress(label: string, path: string): string {
    return label
        .split("_|_")
        .map((raw) => {
            const name = inkSegment(raw);
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
    const context = {
        lists,
        inkNames,
        choiceBodies,
        divertParameters,
        divertVariables,
        renderedChoices: new Set<string>(),
        gathers: new Map<string, PixiVNJsonLabelStep[]>(),
        namedGatherLabels: new Set<string>(),
        referencedChoices: new Set<string>(),
    };
    visitInkValues(labels, (entry) => {
        const isReference =
            (entry.type === "value" && entry.storageType === "label") ||
            (!("text" in entry) && (entry.type === "jump" || entry.type === "call"));
        if (isReference && typeof entry.label === "string" && isGeneratedChoiceLabel(entry.label)) {
            context.referencedChoices.add(entry.label);
        }
    });
    for (const [label, steps] of Object.entries(labels)) {
        const owner = label.replace(/(?:_\|_c-\d+)+$/, "");
        visitInkValues(steps, (entry) => {
            if (
                entry.type === "value" &&
                entry.storageType === "params" &&
                typeof entry.key === "number"
            ) {
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

    const scopedOwners = new Set<string>();
    visitInkValues(labels, (entry) => {
        const owner = scopedGatherOwner(entry);
        if (owner) scopedOwners.add(owner);
    });
    const knots = new Map<string, { label: string; stitch?: string }[]>();
    for (const label of Object.keys(labels)) {
        if (isGeneratedChoiceLabel(label)) {
            choiceBodies.set(label, labels[label]);
            continue;
        }
        const parent = gatherParent(label);
        const parentSteps = labels[parent];
        const isScopedRootGather =
            scopedOwners.has(parent) &&
            parentSteps?.length === 1 &&
            implicitGatherTarget(parentSteps[0]) === label &&
            !Object.keys(labels).some(
                (child) => gatherParent(child) === label && !isGeneratedChoiceLabel(child),
            );
        if (
            isAnonymousGather(label) ||
            (parent.includes("_|_") && Object.hasOwn(labels, parent)) ||
            isScopedRootGather
        ) {
            context.gathers.set(label, labels[label]);
            if (!isAnonymousGather(label)) context.namedGatherLabels.add(label);
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

    for (const label of context.gathers.keys()) {
        throw new Error(`Unsupported or unreferenced Ink gather at labels.${label}`);
    }

    return blocks.join("\n\n");
}

function convertInitialOperations(
    operations: NonNullable<PixiVNJson["initialOperations"]>,
    context: InkConversionContext,
): string[] {
    const lines: string[] = [];
    const scalarLines = new Set<number>();
    const declared = new Set<string>();
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
            const knownMembers = context.lists.get(name);
            const alias = operations[index + 1];
            if (
                knownMembers &&
                alias?.type === "value" &&
                alias.storageType === "storage" &&
                alias.storageOperationType === "set" &&
                typeof alias.key === "string" &&
                !declared.has(alias.key) &&
                Array.isArray(alias.value) &&
                alias.value.length &&
                operation.value.length === knownMembers.length &&
                operation.value.every((value, offset) => value === knownMembers[offset].value)
            ) {
                const first = index - alias.value.length;
                const selected = alias.value.map((value, offset) => {
                    const at = first + offset;
                    const entry = operations[at];
                    return scalarLines.has(at) && entry?.type === "value" && entry.value === value
                        ? knownMembers.find(
                              (member) => member.key === entry.key && member.value === value,
                          )
                        : undefined;
                });
                if (
                    selected.every((member) => member !== undefined) &&
                    new Set(selected.map((member) => member.key)).size === selected.length
                ) {
                    assertInkName(alias.key, `initialOperations[${index + 1}].key`);
                    lines.splice(-selected.length);
                    for (let at = first; at < index; at++) {
                        scalarLines.delete(at);
                        declared.delete(selected[at - first].key);
                    }
                    const items = selected.map((member) => `${name}.${member.key}`);
                    lines.push(`VAR ${alias.key} = (${items.join(", ")})`);
                    declared.add(alias.key);
                    index++;
                    continue;
                }
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
            declared.add(name);
            lines.push(`LIST ${name} = ${membersInk.join(", ")}`);
            index += members.length;
            continue;
        }

        const key = operation.key;
        const isDeclaration = typeof key === "string" && !declared.has(key);
        lines.push(convertVariableSet(operation, path, isDeclaration, context));
        if (isDeclaration) {
            declared.add(key);
            scalarLines.add(index);
        }
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
        const entryGather =
            index === 0 && steps.length === 1 ? implicitGatherTarget(step) : undefined;
        if (entryGather && gatherParent(entryGather) === path.slice("labels.".length)) {
            const body = context.gathers.get(entryGather);
            if (body) {
                context.gathers.delete(entryGather);
                lines.push(
                    gatherMarker(entryGather, context),
                    ...convertSteps(body, `labels.${entryGather}`, context),
                );
                continue;
            }
        }
        const rendered = convertStep(step, stepPath, context);
        if (
            step.glueEnabled === false &&
            step.goNextStep === true &&
            step.operations?.length === 1 &&
            step.operations[0].type === "operationtoconvert" &&
            step.operations[0].values.length === 1 &&
            step.operations[0].values[0] === "continue" &&
            Object.keys(step).length === 3 &&
            lines.at(-1)?.endsWith("<>")
        ) {
            lines[lines.length - 1] += "# continue";
            continue;
        }
        if (previous?.glueEnabled && previous.goNextStep === false) {
            if (step.dialogue === undefined || rendered.length !== 1) {
                throw new Error(`Unsupported step after leading glue at ${stepPath}`);
            }
            rendered[0] = `<>${rendered[0]}`;
        } else if (
            previous?.glueEnabled &&
            previous.goNextStep &&
            previous.dialogue === undefined &&
            (lines.at(-1) === "<>" || !!previous.operations?.length) &&
            step.dialogue !== undefined &&
            rendered.length === 1
        ) {
            if (lines.at(-1) === "<>") lines.pop();
            rendered[0] = `<>${rendered[0]}`;
        } else if (
            (step.dialogue !== undefined || step.conditionalStep !== undefined) &&
            (previous?.dialogue !== undefined || previous?.conditionalStep !== undefined) &&
            (typeof previous.dialogue !== "string" || typeof step.dialogue !== "string") &&
            previous.glueEnabled &&
            previous.goNextStep &&
            rendered.length === 1 &&
            lines.at(-1)?.endsWith("<>")
        ) {
            lines[lines.length - 1] = lines[lines.length - 1].slice(0, -2) + rendered[0];
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
        if (
            previous?.glueEnabled &&
            previous.goNextStep &&
            typeof step.dialogue === "string" &&
            rendered.length === 1 &&
            lines.at(-1)?.endsWith("<>")
        ) {
            rendered[0] = rendered[0].replace(/^ +/, (spaces) => "\\ ".repeat(spaces.length));
        }
        lines.push(...rendered);
    }
    const last = steps.at(-1);
    if (last?.glueEnabled && last.goNextStep === false) {
        throw new Error(`Missing step after leading glue at ${path}[${steps.length - 1}]`);
    }
    return lines;
}

function isAnonymousGather(label: string): boolean {
    return /_\|_g-\d+$/.test(label);
}

function gatherParent(label: string): string {
    return label.slice(0, Math.max(0, label.lastIndexOf("_|_")));
}

function gatherMarker(label: string, context: InkConversionContext): string {
    const marker = "- ".repeat((context.choiceDepth ?? 0) + 1).trimEnd();
    if (isAnonymousGather(label)) return marker;
    const name = label.slice(label.lastIndexOf("_|_") + 3);
    assertInkName(name, `labels.${label}`);
    return `${marker} (${name})`;
}

function implicitGatherTarget(step: PixiVNJsonLabelStep | undefined): string | undefined {
    const divert = step?.labelToOpen;
    if (
        !step ||
        !divert ||
        !("label" in divert) ||
        divert.type !== "jump" ||
        typeof divert.label !== "string" ||
        divert.params?.length ||
        step.glueEnabled ||
        Object.keys(step).some((key) => key !== "labelToOpen" && key !== "glueEnabled")
    ) {
        return undefined;
    }
    return divert.label;
}

function collectGatherTargets(
    choices: NonNullable<PixiVNJsonLabelStep["choices"]>,
    context: InkConversionContext,
    owner: string,
    targets: Set<string>,
    visited = new Set<string>(),
): void {
    if (!Array.isArray(choices)) return;
    for (const item of choices) {
        const choice =
            "text" in item
                ? item
                : item.type === "ifelse" && "text" in item.then
                  ? item.then
                  : undefined;
        if (!choice || visited.has(choice.label)) continue;
        visited.add(choice.label);
        const last = context.choiceBodies.get(choice.label)?.at(-1);
        const target = implicitGatherTarget(last);
        if (target && gatherParent(target) === owner && context.gathers.has(target)) {
            targets.add(target);
        }
        if (last?.choices) collectGatherTargets(last.choices, context, owner, targets, visited);
    }
}

function convertStep(
    step: PixiVNJsonLabelStep,
    path: string,
    context: InkConversionContext,
): string[] {
    if (step.conditionalStep) {
        const rendered = convertConditionalStep(
            step.conditionalStep as any,
            `${path}.conditionalStep`,
            context,
        );
        if (rendered.length === 1 && step.glueEnabled && step.goNextStep) rendered[0] += "<>";
        return rendered;
    }
    const lines: string[] = [];
    if (step.operations?.length) {
        for (const [index, operation] of step.operations.entries()) {
            if (operation.type === "value" && operation.storageOperationType === "set") {
                lines.push(
                    convertVariableSet(operation, `${path}.operations[${index}]`, false, context),
                );
            } else if ("$origin" in operation && operation.$origin) {
                lines.push(
                    convertTag(
                        escapeInkTagText(operation.$origin),
                        `${path}.operations[${index}].$origin`,
                    ),
                );
            } else if (operation.type === "operationtoconvert") {
                const tagPath = `${path}.operations[${index}].values`;
                const tag =
                    operation.values.length === 1 && typeof operation.values[0] === "string"
                        ? escapeInkTagText(operation.values[0])
                        : operation.values
                              .map((part, index) =>
                                  renderInlineTextPart(part, `${tagPath}[${index}]`, context.lists),
                              )
                              .join("");
                lines.push(convertTag(tag, tagPath));
            } else if (operation.type === "function") {
                const operationPath = `${path}.operations[${index}]`;
                lines.push(`~ ${toInkExpression(operation, operationPath, context.lists)}`);
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
        if (step.glueEnabled && step.goNextStep === true) lines.push(`${dialogue}<>`);
        else lines.push(dialogue);
    }
    if (step.choices !== undefined) {
        if (!Array.isArray(step.choices)) {
            throw new Error(`Unsupported JSON to Ink choices at ${path}.choices`);
        }
        const label = /^labels\.([^[]+)\[/.exec(path)?.[1];
        const owner =
            label && (context.namedGatherLabels.has(label) || isAnonymousGather(label))
                ? gatherParent(label)
                : label;
        const targets = new Set<string>();
        if (owner) collectGatherTargets(step.choices, context, owner, targets);
        const gather = targets.size === 1 ? targets.values().next().value : undefined;
        for (const [index, choice] of step.choices.entries()) {
            const choicePath = `${path}.choices[${index}]`;
            if ("text" in choice) {
                lines.push(...convertChoice(choice, choicePath, context, undefined, gather));
            } else if (choice.type === "ifelse" && !choice.else && "text" in choice.then) {
                const condition = renderChoiceCondition(
                    choice.condition,
                    `${choicePath}.condition`,
                    context,
                );
                lines.push(
                    ...convertChoice(choice.then, `${choicePath}.then`, context, condition, gather),
                );
            } else {
                throw new Error(`Unsupported conditional choice at ${choicePath}`);
            }
        }
        if (gather) {
            const steps = context.gathers.get(gather);
            if (!steps) throw new Error(`Repeated Ink gather at labels.${gather}`);
            context.gathers.delete(gather);
            lines.push(
                gatherMarker(gather, context),
                ...convertSteps(steps, `labels.${gather}`, context),
            );
        }
    }
    if (step.labelToOpen !== undefined && !hasMatchingNarrationTag(step)) {
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

function hasMatchingNarrationTag(step: PixiVNJsonLabelStep): boolean {
    const divert = step.labelToOpen;
    const operation = step.operations?.[0];
    return (
        step.operations?.length === 1 &&
        step.goNextStep === undefined &&
        step.glueEnabled === undefined &&
        !!divert &&
        "label" in divert &&
        typeof divert.label === "string" &&
        (divert.type === "jump" || divert.type === "call") &&
        divert.params === undefined &&
        operation?.type === "operationtoconvert" &&
        operation.values.length === 1 &&
        operation.values[0] === `${divert.type} ${divert.label}`
    );
}

function escapeInkTagText(value: string): string {
    return escapeInkText(value)
        .replace(/#/g, "\\#")
        .replace(/\/\//g, "\\/\\/")
        .replace(/\/\*/g, "\\/*");
}

function convertTag(tag: string, path: string): string {
    if (!tag.trim() || /[\r\n]/.test(tag)) {
        throw new Error(`Invalid Ink tag at ${path}`);
    }
    return `# ${tag}`;
}

function renderInlineTextPart(
    value: unknown,
    path: string,
    lists: InkLists,
    branchId?: string,
): string {
    if (typeof value === "string") return escapeInkTagText(value);
    if (!value || typeof value !== "object") {
        throw new Error(`Unsupported Ink text fragment at ${path}`);
    }
    const part = value as Record<string, unknown>;
    if (part.type === "ifelse") {
        const condition = toInkCondition(part.condition, `${path}.condition`, lists);
        const then = renderInlineTextPart(
            part.then,
            `${path}.then`,
            lists,
            `${branchId ?? ""}then`,
        );
        const otherwise =
            part.else === undefined
                ? ""
                : `|${renderInlineTextPart(part.else, `${path}.else`, lists, `${branchId ?? ""}else`)}`;
        return `{${condition}:${then}${otherwise}}`;
    }
    if (
        part.type === "resulttocombine" &&
        part.combine === "cross" &&
        Array.isArray(part.secondConditionalItem) &&
        part.firstConditionalItem === undefined
    ) {
        return part.secondConditionalItem
            .map((item, index) =>
                renderInlineTextPart(
                    item,
                    `${path}.secondConditionalItem[${index}]`,
                    lists,
                    branchId,
                ),
            )
            .join("");
    }
    if (part.type === "stepswitch" && Array.isArray(part.elements) && part.elements.length > 1) {
        const marker =
            part.choiceType === "loop"
                ? "&"
                : part.choiceType === "random"
                  ? "~"
                  : part.choiceType === "sequential"
                    ? part.end === "lastItem"
                        ? ""
                        : "!"
                    : undefined;
        if (
            marker === undefined ||
            (part.end !== undefined && part.end !== "lastItem") ||
            (part.nestedId !== undefined && part.nestedId !== branchId)
        ) {
            throw new Error(`Unsupported Ink text alternative at ${path}`);
        }
        const alternatives = part.elements.map((item, index) =>
            renderInlineTextPart(item, `${path}.elements[${index}]`, lists, branchId),
        );
        return `{${marker}${alternatives.join("|")}}`;
    }
    return `{${toInkExpression(part, path, lists)}}`;
}

function inlineConditionalBranch(
    branch: unknown,
    path: string,
    context: InkConversionContext,
    branchId = "",
): string | undefined {
    if (!branch || typeof branch !== "object") return undefined;
    const step = branch as PixiVNJsonLabelStep;
    if (
        Object.keys(step).length === 1 &&
        typeof step.dialogue === "string" &&
        !/[\r\n|]/.test(step.dialogue)
    )
        return escapeInkText(step.dialogue);

    if (Object.keys(step).length === 1 && step.conditionalStep?.type === "ifelse") {
        return renderInlineConditional(step.conditionalStep, path, context, branchId);
    }
    if (Object.keys(step).length === 1 && step.conditionalStep?.type === "stepswitch") {
        return renderInlineAlternative(step.conditionalStep, path, context, branchId);
    }
    if (Object.keys(step).length === 1 && (step.labelToOpen || step.end)) {
        const lines = convertStep(step, path, context);
        return lines.length === 1 ? lines[0] : undefined;
    }

    const combination = branch as PixiVNJsonConditionalResultToCombine<PixiVNJsonLabelStep>;
    if (
        combination.type !== "resulttocombine" ||
        combination.combine !== "cross" ||
        ("firstConditionalItem" in combination && combination.firstConditionalItem !== undefined) ||
        !Array.isArray(combination.secondConditionalItem) ||
        combination.secondConditionalItem.length < 2
    ) {
        return undefined;
    }
    const items = combination.secondConditionalItem;
    const rendered = items.map((item, index) => {
        if ("type" in item) return undefined;
        const joinsNext = index < items.length - 1;
        const next = items[index + 1];
        if (
            joinsNext &&
            !("type" in next) &&
            (next.labelToOpen || next.end) &&
            typeof item.dialogue === "string" &&
            ((item.goNextStep === true && Object.keys(item).length === 2) ||
                (next.end && Object.keys(item).length === 1))
        ) {
            return escapeInkText(item.dialogue);
        }
        if (
            !joinsNext &&
            (item.labelToOpen || item.end) &&
            Object.keys(item).every((key) => ["labelToOpen", "end", "glueEnabled"].includes(key))
        ) {
            const lines = convertStep(item, path, context);
            return lines.length === 1 ? lines[0] : undefined;
        }
        if (
            joinsNext &&
            item.conditionalStep?.type === "stepswitch" &&
            Object.keys(item).length === 1 &&
            !("type" in next) &&
            typeof next.dialogue === "string" &&
            /^ +$/.test(next.dialogue) &&
            next.glueEnabled &&
            next.goNextStep
        ) {
            return renderInlineAlternative(item.conditionalStep, path, context, branchId);
        }
        if (joinsNext && (!item.glueEnabled || item.goNextStep !== true)) return undefined;
        if (Object.keys(item).length !== (joinsNext ? 3 : 1)) return undefined;
        const itemPath = `${path}.secondConditionalItem[${index}]`;
        if (item.conditionalStep?.type === "ifelse") {
            return renderInlineConditional(
                item.conditionalStep,
                `${itemPath}.conditionalStep`,
                context,
                branchId,
            );
        }
        if (item.conditionalStep?.type === "stepswitch") {
            return renderInlineAlternative(item.conditionalStep, itemPath, context, branchId);
        }
        if (
            item.dialogue === undefined ||
            (typeof item.dialogue === "string" && /[\r\n|]/.test(item.dialogue))
        )
            return undefined;
        return convertDialog(item.dialogue, `${itemPath}.dialogue`, context.lists);
    });
    return rendered.every((line) => line !== undefined) ? rendered.join("") : undefined;
}

function renderInlineAlternative(
    alternative: { elements: unknown; choiceType: unknown; end?: unknown; nestedId?: unknown },
    path: string,
    context: InkConversionContext,
    branchId: string,
): string | undefined {
    if (!Array.isArray(alternative.elements) || alternative.elements.length < 2) return undefined;
    const expectedId = alternative.choiceType === "sequential" ? branchId || undefined : undefined;
    if (alternative.nestedId !== expectedId) return undefined;
    const end = alternative.end;
    const marker =
        alternative.choiceType === "sequential"
            ? end === "lastItem"
                ? ""
                : "!"
            : alternative.choiceType === "loop"
              ? "&"
              : alternative.choiceType === "random"
                ? "~"
                : undefined;
    if (marker === undefined || (end !== undefined && end !== "lastItem")) return undefined;
    const elements = alternative.elements.map((element, index) =>
        inlineConditionalBranch(element, `${path}.elements[${index}]`, context, branchId),
    );
    return elements.every((element) => element !== undefined)
        ? `{${marker}${elements.join("|")}}`
        : undefined;
}

function renderInlineConditional(
    conditional: { condition: unknown; then: unknown; else?: unknown },
    path: string,
    context: InkConversionContext,
    branchId = "",
): string | undefined {
    const then = inlineConditionalBranch(
        conditional.then,
        `${path}.then`,
        context,
        branchId + "then",
    );
    const otherwise = inlineConditionalBranch(
        conditional.else,
        `${path}.else`,
        context,
        branchId + "else",
    );
    if (then === undefined || (conditional.else !== undefined && otherwise === undefined)) {
        return undefined;
    }
    const condition = toInkCondition(conditional.condition, `${path}.condition`, context.lists);
    return `{${condition}:${then}${otherwise === undefined ? "" : `|${otherwise}`}}`;
}

function convertConditionalBranch(
    branch:
        | PixiVNJsonLabelStep
        | PixiVNJsonConditionalStatements<PixiVNJsonLabelStep>
        | PixiVNJsonConditionalResultToCombine<PixiVNJsonLabelStep>
        | undefined,
    path: string,
    context: InkConversionContext,
): string[] {
    if (branch === undefined) return [];
    if (!("type" in branch)) return convertStep(branch, path, context);
    if (branch.type === "ifelse" || branch.type === "stepswitch") {
        return convertConditionalStep(branch, path, context);
    }
    if (
        branch.type === "resulttocombine" &&
        branch.combine === "cross" &&
        Array.isArray(branch.secondConditionalItem) &&
        !("firstConditionalItem" in branch && branch.firstConditionalItem) &&
        branch.secondConditionalItem.every((step): step is PixiVNJsonLabelStep => !("type" in step))
    ) {
        return convertSteps(branch.secondConditionalItem, `${path}.secondConditionalItem`, context);
    }
    throw new Error(`Unsupported Ink conditional branch at ${path}`);
}

function convertConditionalStep(
    conditional: PixiVNJsonConditionalStatements<PixiVNJsonLabelStep>,
    path: string,
    context: InkConversionContext,
): string[] {
    if (conditional.type === "stepswitch") {
        if ("nestedId" in conditional && conditional.nestedId !== undefined) {
            throw new Error(`Unsupported nested Ink alternative at ${path}.nestedId`);
        }
        const last = "end" in conditional ? conditional.end : undefined;
        if (last !== undefined && last !== "lastItem") {
            throw new Error(`Unsupported Ink alternative ending at ${path}.end`);
        }
        const kind = conditional.choiceType;
        const modes = {
            sequential: last ? ["", "stopping"] : ["!", "once"],
            loop: ["&", "cycle"],
            random: ["~", "shuffle"],
            sequentialrandom: [undefined, last ? "shuffle stopping" : "shuffle once"],
        } as const;
        if (
            !(kind in modes) ||
            !Array.isArray(conditional.elements) ||
            !conditional.elements.length
        ) {
            throw new Error(`Unsupported Ink alternative at ${path}`);
        }
        const [, mode] = modes[kind as keyof typeof modes];
        const inline = renderInlineAlternative(conditional, path, context, "");
        if (inline !== undefined) return [inline];
        const lines = [`{ ${mode}:`];
        for (const [index, element] of conditional.elements.entries()) {
            const elementPath = `${path}.elements[${index}]`;
            let rendered: string[];
            if (!("type" in element)) {
                rendered = convertStep(element, elementPath, context);
            } else if (element.type === "ifelse" || element.type === "stepswitch") {
                rendered = convertConditionalStep(element, elementPath, context);
            } else if (
                element.type === "resulttocombine" &&
                element.combine === "cross" &&
                Array.isArray(element.secondConditionalItem) &&
                !("firstConditionalItem" in element && element.firstConditionalItem) &&
                element.secondConditionalItem.every(
                    (step): step is PixiVNJsonLabelStep => !("type" in step),
                )
            ) {
                rendered = convertSteps(
                    element.secondConditionalItem,
                    `${elementPath}.secondConditionalItem`,
                    context,
                );
            } else {
                throw new Error(`Unsupported Ink alternative branch at ${elementPath}`);
            }
            lines.push("-", ...indent(rendered));
        }
        return [...lines, "}"];
    }
    if (conditional.type !== "ifelse") throw new Error(`Unsupported conditional step at ${path}`);
    const statement = conditional as PixiVNJsonIfElse<PixiVNJsonLabelStep>;
    const isCrossBranch = (branch: unknown): boolean =>
        !!branch &&
        typeof branch === "object" &&
        "type" in branch &&
        branch.type === "resulttocombine";
    if (
        isCrossBranch(statement.then) ||
        isCrossBranch(statement.else) ||
        ("dialogue" in statement.then &&
            typeof statement.then.dialogue === "string" &&
            statement.then.dialogue !== statement.then.dialogue.trim())
    ) {
        const inline = renderInlineConditional(statement, path, context);
        if (inline !== undefined) return [inline];
    }
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
    if (
        !statement.else &&
        typeof thenText === "string" &&
        Object.keys(statement.then).length === 1 &&
        thenText !== thenText.trim() &&
        !/[\r\n|]/.test(thenText)
    ) {
        return [`{ ${condition}:${escapeInkText(thenText)}}`];
    }
    const thenLines = convertConditionalBranch(statement.then, `${path}.then`, context);
    const elseLines = convertConditionalBranch(statement.else, `${path}.else`, context);
    return [
        `{ ${condition}:`,
        ...indent(thenLines),
        ...(elseLines.length ? ["- else:", ...indent(elseLines)] : []),
        "}",
    ];
}

// The mapper encodes a scoped gather visit as a comparison on its owning flow.
function scopedGatherOwner(condition: unknown): string | undefined {
    if (!condition || typeof condition !== "object") return undefined;
    const entry = condition as Record<string, any>;
    if (
        entry.type === "compare" &&
        entry.operator === ">=" &&
        entry.leftValue?.type === "value" &&
        entry.leftValue.storageType === "label" &&
        entry.leftValue.storageOperationType === "get" &&
        typeof entry.leftValue.label === "string" &&
        entry.rightValue?.type === "value" &&
        entry.rightValue.value === 0 &&
        Object.keys(entry.rightValue).length === 2
    )
        return entry.leftValue.label;
    return undefined;
}

function renderChoiceCondition(
    condition: unknown,
    path: string,
    context: InkConversionContext,
): string {
    const owner = scopedGatherOwner(condition);
    if (owner) {
        const candidates = [...context.namedGatherLabels].filter(
            (label) => gatherParent(label) === owner,
        );
        if (candidates.length === 1) return inkAddress(candidates[0], path);
    }
    return toInkCondition(condition, path, context.lists);
}

function convertChoice(
    choice: PixiVNJsonChoice,
    path: string,
    context: InkConversionContext,
    condition?: string,
    gather?: string,
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
    if (
        fallback &&
        choice.text !== "" &&
        !(Array.isArray(choice.text) && choice.text.length === 0)
    ) {
        throw new Error(`Unsupported fallback choice at ${path}`);
    }
    const generated = isGeneratedChoiceLabel(choice.label);
    // The mapper omits oneTime for sticky Ink choices.
    const marker =
        choice.oneTime === false || (generated && choice.oneTime === undefined) ? "+" : "*";
    const ownName = context.referencedChoices.has(choice.label)
        ? ` (${inkSegment(choice.label.slice(choice.label.lastIndexOf("_|_") + 3))})`
        : "";
    const choicePrefix = condition ? `${marker}${ownName} { ${condition} }` : `${marker}${ownName}`;
    if (generated) {
        const originalBody = context.choiceBodies.get(choice.label);
        const nextGather = gather ?? context.implicitGather;
        const joinsGather =
            nextGather !== undefined && implicitGatherTarget(originalBody?.at(-1)) === nextGather;
        const body = joinsGather ? originalBody?.slice(0, -1) : originalBody;
        if (context.renderedChoices.has(choice.label)) {
            throw new Error(`Repeated generated choice at ${path}.label`);
        }
        context.renderedChoices.add(choice.label);
        if (choice.type !== "call")
            throw new Error(`Unsupported generated choice type at ${path}.type`);
        if (!body) {
            const owner = /^labels\.([^[]+)\[/.exec(path)?.[1];
            if (
                !fallback &&
                typeof choice.text === "string" &&
                owner &&
                choice.label.startsWith(`${owner}_|_c-`)
            ) {
                return [`${choicePrefix} [${escapeInkText(choice.text)}]`];
            }
            throw new Error(`Missing generated choice body at ${path}.label`);
        }
        context.choiceBodies.delete(choice.label);

        const [first, second, third] = body;
        const hasInlineDivert =
            second?.goNextStep === true &&
            Object.keys(second).length === 2 &&
            third?.labelToOpen &&
            third.glueEnabled === true &&
            Object.keys(third).length === 2;
        const shared = Array.isArray(choice.text) ? choice.text[0] : choice.text;
        const menuOnly = Array.isArray(choice.text) ? choice.text[1] : "";
        const hasSharedText =
            !fallback &&
            (!Array.isArray(choice.text) || choice.text.length === 2) &&
            typeof shared === "string" &&
            typeof menuOnly === "string" &&
            first?.dialogue === shared &&
            first.glueEnabled === true &&
            first.goNextStep === true &&
            Object.keys(first).length === 3 &&
            typeof second?.dialogue === "string" &&
            (Object.keys(second).length === 1 ||
                hasInlineDivert ||
                (joinsGather &&
                    second.glueEnabled === true &&
                    second.goNextStep === true &&
                    Object.keys(second).length === 3));

        let header: string;
        let consumed = 0;
        if (hasSharedText) {
            header = `${choicePrefix} ${escapeInkText(shared)}[${escapeInkText(menuOnly)}]${escapeInkText(second.dialogue as string)}`;
            consumed = 2;
            if (joinsGather && second.glueEnabled && second.goNextStep) header += "<>";
            if (hasInlineDivert) {
                header += convertStep(third, `labels.${choice.label}[2]`, context).join("");
                consumed = 3;
            }
        } else if (fallback) {
            header = choicePrefix;
        } else if (
            Array.isArray(choice.text) &&
            choice.text.some((part) => typeof part !== "string")
        ) {
            const text = choice.text
                .map((part, index) =>
                    renderInlineTextPart(part, `${path}.text[${index}]`, context.lists),
                )
                .join("");
            header = `${choicePrefix} [${text}]`;
        } else if (typeof choice.text !== "string") {
            throw new Error(`Unsupported composed choice text at ${path}.text`);
        } else {
            const text = escapeInkText(choice.text);
            const echoesChoice =
                first?.dialogue === choice.text &&
                (Object.keys(first).length === 1 ||
                    (Object.keys(first).length === 2 &&
                        first.goNextStep === true &&
                        (second?.labelToOpen !== undefined || second?.end !== undefined)));
            header = `${choicePrefix} ${echoesChoice ? text : `[${text}]`}`;
            consumed = echoesChoice ? 1 : 0;
            if (
                joinsGather &&
                first?.dialogue === choice.text &&
                first.glueEnabled === true &&
                first.goNextStep === true &&
                Object.keys(first).length === 3
            ) {
                header = `${choicePrefix} ${text}<>`;
                consumed = 1;
            }
        }
        const bodyLines = convertSteps(
            body,
            `labels.${choice.label}`,
            { ...context, implicitGather: nextGather, choiceDepth: (context.choiceDepth ?? 0) + 1 },
            consumed,
        ).map((line) =>
            line.replace(
                /^(\s*)([*]+|[+]+)(?= |$)/,
                (_, space: string, markers: string) => space + markers + markers[0],
            ),
        );
        // Ink trims whitespace-only lines, but preserves the space before an inline ending.
        if (
            consumed === 0 &&
            /^[ \t]+$/.test(bodyLines[0] ?? "") &&
            (bodyLines[1] === "-> END" || bodyLines[1] === "-> DONE")
        ) {
            return [header + bodyLines[0] + bodyLines[1], ...indent(bodyLines.slice(2))];
        }
        if (consumed === 0 && /^[ \t]+$/.test(bodyLines[0] ?? "")) {
            return [`${header}${bodyLines[0]}`, ...indent(bodyLines.slice(1))];
        }
        const inlineDivert = bodyLines[0];
        if (fallback && inlineDivert?.startsWith("-> ")) {
            return [`${header} ${inlineDivert}`, ...indent(bodyLines.slice(1))];
        }
        if (consumed === 0 && /^[ \t]+-> /.test(inlineDivert ?? "")) {
            return [header + inlineDivert, ...indent(bodyLines.slice(1))];
        }
        return [fallback ? `${header} ->` : header, ...indent(bodyLines)];
    }
    if (typeof choice.text !== "string")
        throw new Error(`Unsupported composed choice text at ${path}.text`);
    const text = choice.text;
    const labelName = context.inkNames.get(choice.label) ?? choice.label.replaceAll("_|_", ".");
    return [
        fallback
            ? `${choicePrefix} -> ${labelName}`
            : `${choicePrefix} [${escapeInkText(text)}] -> ${labelName}`,
    ];
}

function convertDialog(dialogue: unknown, path: string, lists: InkLists): string {
    if (typeof dialogue === "string") return escapeInkDialogue(dialogue);
    if (dialogue && typeof dialogue === "object" && "character" in dialogue && "text" in dialogue) {
        const { character, text } = dialogue as { character: unknown; text: unknown };
        if (typeof character === "string" && typeof text === "string") {
            return `${assertSpeaker(character, path)}: ${escapeInkDialogue(text)}`;
        }
    }
    return toInkTextExpression(dialogue as PixiVNJsonDialogText, path, lists);
}

function assertSpeaker(value: string, path: string): string {
    assertInkName(value, path);
    return value;
}

function toInkTextExpression(value: PixiVNJsonDialogText, path: string, lists: InkLists): string {
    if (typeof value === "string") return escapeInkDialogue(value);
    if (Array.isArray(value))
        return value
            .map((part) => toInkTextExpression(part as PixiVNJsonDialogText, path, lists))
            .join("");
    if (value && typeof value === "object" && "type" in value) {
        return `{${toInkExpression(value, path, lists)}}`;
    }
    throw new Error(`Unsupported dialogue value at ${path}`);
}

function convertVariableSet(
    operation: PixiVNJsonValueSet | PixiVNJsonOperation,
    path: string,
    initial: boolean,
    context: InkConversionContext,
): string {
    if (
        operation.type !== "value" ||
        (initial && operation.storageType === "params") ||
        operation.storageType === "flagStorage"
    ) {
        throw new Error(`Unsupported variable operation at ${path}`);
    }
    const key =
        operation.storageType === "params"
            ? inkParameter(operation.key, `${path}.key`)
            : operation.key;
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
                    .map((raw) => {
                        const name = inkSegment(raw);
                        assertInkName(name, path);
                        return name;
                    })
                    .join(".");
            }
            if (entry.storageType === "logic") return toInkExpression(entry.operation, path, lists);
        }
        if (entry.type === "stepswitch" && Array.isArray(entry.elements)) {
            const markers = { sequential: "", loop: "&", random: "~" } as const;
            const kind = entry.choiceType as keyof typeof markers;
            if (
                !Object.hasOwn(markers, kind) ||
                entry.elements.length < 2 ||
                entry.end !== undefined ||
                entry.nestedId !== undefined ||
                !entry.elements.every(
                    (part) => typeof part === "string" && !/[\r\n|{}"\\]/.test(part),
                )
            ) {
                throw new Error(`Unsupported Ink string alternative at ${path}`);
            }
            return `"{${markers[kind]}${entry.elements.join("|")}}"`;
        }
        if (entry.type === "function") {
            if (typeof entry.functionName !== "string") {
                throw new Error(`Invalid Ink function name at ${path}.functionName`);
            }
            assertInkName(entry.functionName, `${path}.functionName`);
            const args = Array.isArray(entry.args)
                ? entry.args.map((arg, index) =>
                      toInkExpression(arg, `${path}.args[${index}]`, lists),
                  )
                : [];
            return `${entry.functionName}(${args.join(", ")})`;
        }
        if (entry.type === "arithmetic") {
            const left = toInkExpression(entry.leftValue, `${path}.leftValue`, lists);
            const right = toInkExpression(entry.rightValue, `${path}.rightValue`, lists);
            if (entry.operator === "POW" || entry.operator === "RANDOM") {
                return `${entry.operator}(${left}, ${right})`;
            }
            const operator = entry.operator === "INTERSECTION" ? "^" : String(entry.operator);
            return `(${left} ${operator} ${right})`;
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
            return `(not ${toInkCondition(union.condition, path, lists)})`;
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
    return value
        .replace(/\\/g, "\\\\")
        .replace(/\{/g, "\\{")
        .replace(/\}/g, "\\}")
        .replace(/<>/g, "\\<\\>");
}

function escapeInkDialogue(value: string): string {
    return escapeInkText(value)
        .replace(/\n/g, "\\\\n")
        .replace(/#/g, "\\#")
        .replace(/\|/g, "\\|")
        .replace(/\/\//g, "\\/\\/")
        .replace(/\/\*/g, "\\/*")
        .replace(/->/g, "\\-\\>")
        .replace(/^(\s*)([*+~`=-])/, "$1\\$2");
}
