export function getParam(list: any[]): any[] {
    let res: any[] = [];
    for (let i = 0; i < list.length; i++) {
        if (typeof list[i] === "string") {
            if (list[i].startsWith("^")) {
                res.push(list[i].substring(1));
            }
        }
        else {
            res.push(list[i]);
        }
    }
    return res;
}