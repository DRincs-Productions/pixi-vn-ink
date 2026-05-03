import type { ErrorType } from "inkjs/engine/Error";

export type CompileSharedType = {
    labelToRemove: string[];
    initialVarsToRemove: string[];
    functions: { name: string; args: number }[];
    textSource: string;
};
export type IssueType = { message: string; type: ErrorType; line: number };
export type CompileResultType = {
    json: string;
    issues: IssueType[];
};
