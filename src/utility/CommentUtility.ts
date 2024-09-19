import { PixiVNJsonOperation } from "@drincs/pixi-vn";
import PixiVNJsonMediaTransiotions from "@drincs/pixi-vn/dist/interface/PixiVNJsonMediaTransiotions";

const SPACE_SEPARATOR = "§SPACE§";
const IMAGES_TYPES = ["show", "edit", "remove", "move"]

export function getOperationFromComment(comment: string): PixiVNJsonOperation | undefined {
    try {
        let list = comment.split("\"")
        list.forEach((item, index) => {
            // if index is shots
            if (index % 2 === 1) {
                list[index] = item.replace(" ", SPACE_SEPARATOR);
            }
        })
        comment = list.join("");
        list = comment.split(" ").filter((item) => item !== "");
        list = list.map((item) => item.replace(SPACE_SEPARATOR, " "));
        if (list[1] === "image") {
            return getImageOperationFromComment(list, "image");
        }
        else if (list[1] === "video") {
            if (IMAGES_TYPES.includes(list[0])) {
                return getImageOperationFromComment(list, "video");
            }
        }
    }
    catch (e) { }
    return undefined;
}

function getImageOperationFromComment(list: string[], typeCanvasElement: "image" | "video"): PixiVNJsonOperation | undefined {
    let type = list[0];
    if (!IMAGES_TYPES.includes(type)) {
        return undefined;
    }
    let imageId = list[2];
    if (type === "show") {
        let op: PixiVNJsonOperation = {
            type: typeCanvasElement,
            operationType: "show",
            alias: imageId,
            url: list[3],
        }
        if (list.length > 4) {
            let transition = getTransition(list.slice(4));
            if (transition !== undefined) {
                op.transition = transition;
            }
        }
        return op;
    }
    else if (type === "edit") {
        let op: PixiVNJsonOperation = {
            type: typeCanvasElement,
            operationType: "edit",
            alias: imageId,
            props: convertListStringToObj(list.slice(3)) as any
        }
        return op;
    }
    else if (type === "remove") {
        let op: PixiVNJsonOperation = {
            type: typeCanvasElement,
            operationType: "remove",
            alias: imageId,
        }
        if (list.length > 3) {
            let transition = getTransition(list.slice(3));
            if (transition !== undefined) {
                op.transition = transition;
            }
        }
        return op;
    }
    return undefined;
}

function getTransition(list: string[]): PixiVNJsonMediaTransiotions | undefined {
    let transitionTypes = ["dissolve", "fade", "movein", "moveout", "zoomin", "zoomout"];
    if (!transitionTypes.includes(list[0])) {
        return undefined;
    }
    let transition: PixiVNJsonMediaTransiotions = {
        type: list[0] as any
    }
    if (list.length > 1) {
        try {
            let props = convertListStringToObj(list.slice(1));
            transition.props = props;
        }
        catch (_) { }
    }
    return transition;
}

/**
 * For example: 
 * Into Ink text:
 * duration 3 name "C J" surname Smith position "{ x: 2, y 3 }"
 * into string list:
 * ["duration", "3", "x", "2", "y", "3", "name", "C J", "surname", "Smith", "position", "{ x: 2, y 3 }"]
 * into object:
 * { duration: 3, x: 2, y: 3, name: "C J", surname: "Smith", position: { x: 2, y 3 } }
 */
function convertListStringToObj(list: string[]): object {
    let objJson: string = "{"
    list.forEach((item, index) => {
        if (index % 2 === 0) {
            objJson += `"${item}": `
        } else {
            // if is string that contains only numbers, example: 0 or 999
            if (/^\d+$/.test(item)) {
                objJson += item;
            }
            // if the string is a json object
            else if (item.startsWith("{") && item.endsWith("}")) {
                objJson += item;
            }
            else {
                objJson += "\"" + item + "\"";
            }
            if (index < list.length - 1) {
                objJson += ", ";
            }
        }
    })
    objJson += "}"
    return JSON.parse(objJson);
}
