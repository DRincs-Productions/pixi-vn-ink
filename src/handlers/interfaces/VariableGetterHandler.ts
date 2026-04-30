import { StorageElementType } from "@drincs/pixi-vn";

type VariableGetterHandler = <T = StorageElementType>(
    value: T,
    next: (value: T) => T | undefined,
) => T | undefined;
export default VariableGetterHandler;
