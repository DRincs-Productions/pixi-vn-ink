import { conditionaAritmeticParser } from "../parser/ConditionaAritmeticParser";

export function getParam(list: any[],
    labelKey: string,
    paramNames: string[],
): any[] {
    let res: any[] = conditionaAritmeticParser(list, labelKey, paramNames);
    return res;
}