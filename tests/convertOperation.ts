import type { PixiVNJson, PixiVNJsonIfElse, PixiVNJsonOperation } from "@drincs/pixi-vn-json";
import HashtagCommands from "../src/handlers/hashtag-commands";

export async function convertOperation(res?: PixiVNJson) {
    if (res?.labels) {
        for (const label in res.labels) {
            const tempSteps = [];
            for (const step of res.labels[label]) {
                if (step.operations) {
                    const ops: (PixiVNJsonOperation | PixiVNJsonIfElse<PixiVNJsonOperation>)[] = [];
                    for (const operation of step.operations) {
                        if (operation.type === "operationtoconvert") {
                            const v: string = operation.values
                                .map((v) => {
                                    if (typeof v === "string") {
                                        return v;
                                    }
                                    return `"${v.type}"`;
                                })
                                .join("");
                            const resOp = await HashtagCommands.run(v, step, {});
                            if (resOp) {
                                ops.push(resOp);
                            }
                        } else {
                            ops.push(operation);
                        }
                    }
                    step.operations = ops;
                }
                tempSteps.push(step);
            }
            res.labels[label] = tempSteps;
        }
    }
}
