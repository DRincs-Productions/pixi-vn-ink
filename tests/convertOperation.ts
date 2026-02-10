import { PixiVNJson, PixiVNJsonIfElse, PixiVNJsonOperation } from "@drincs/pixi-vn-json";
import HashtagScript from "../src/managers/HashtagScript";

export async function convertOperation(res?: PixiVNJson) {
    if (res?.labels) {
        for (let label in res.labels) {
            let tempSteps = [];
            for (let step of res.labels[label]) {
                if (step.operations) {
                    let ops: (PixiVNJsonOperation | PixiVNJsonIfElse<PixiVNJsonOperation>)[] = [];
                    for (let operation of step.operations) {
                        if (operation.type === "operationtoconvert") {
                            let v: string = operation.values
                                .map((v) => {
                                    if (typeof v === "string") {
                                        return v;
                                    }
                                    return `"${v.type}"`;
                                })
                                .join("");
                            let resOp = await HashtagScript.run(v, step, {});
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
