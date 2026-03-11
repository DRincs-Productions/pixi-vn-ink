import { StorageElementType } from "@drincs/pixi-vn";
import VariableGetterHandler from "./interfaces/VariableGetterHandler";

class Storage {
    static handlers: Array<VariableGetterHandler> = [];
}

namespace VariableGetter {
    export function add(handler: VariableGetterHandler) {
        Storage.handlers.push(handler);
    }

    export function clear() {
        Storage.handlers = [];
    }

    export function getLogichValue<T = StorageElementType>(
        value: T,
        next: (value: T) => T | undefined,
        index = 0,
    ): T | undefined {
        if (index >= Storage.handlers.length) {
            return next(value);
        }
        const handler = Storage.handlers[index];
        return handler(value, (newValue) => {
            return getLogichValue(value, next, index + 1);
        });
    }
}
export default VariableGetter;
