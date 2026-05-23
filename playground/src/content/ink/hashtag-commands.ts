import { HashtagCommands } from "@drincs/pixi-vn-ink";

HashtagCommands.add(  (_command, _props, _convertListStringToObj) => {
    return false;
}, {
    name: "custom-command",
    validation: /^custom-command\s+(\w+)$/,
},);