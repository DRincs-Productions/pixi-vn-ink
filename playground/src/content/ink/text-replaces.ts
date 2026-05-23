import { TextReplaces } from "@drincs/pixi-vn-ink";

TextReplaces.add((text) => {
    return text.replace(/Hello/g, "Hi");
}, {
    name: "hello-to-hi",
    validation: /Hello/,
},);