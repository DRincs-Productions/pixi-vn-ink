import { PixiVNJson } from "@drincs/pixi-vn-json";
import { expect, test } from "vitest";
import { convertInkText } from "../src/functions";

test("Tunnel 1", async () => {
    let expected: PixiVNJson = {
        labels: {
  "città_|_c-0": [
    {
      dialogue: "Torni a girare per la città.",
    },
  ],
  "città": [
    {
      dialogue: "Sei in città.",
    },
    {
      choices: [
        {
          text: "Parla con il mercante",
          label: "città_|_c-0",
          props: {
          },
          type: "call",
          oneTime: true,
        },
      ],
    },
  ],
  "dialogo_mercante_|_c-0": [
    {
      dialogue: "\"Mostrami la merce\"",
    },
    {
      dialogue: "\"Ecco qui!\"",
    },
  ],
  "dialogo_mercante_|_c-1": [
    {
      dialogue: "\"Arrivederci\"",
    },
    {
      dialogue: "\"A presto!\"",
    },
  ],
  dialogo_mercante: [
    {
      dialogue: "Il mercante sorride.",
    },
    {
      choices: [
        {
          text: "\"Mostrami la merce\"",
          label: "dialogo_mercante_|_c-0",
          props: {
          },
          type: "call",
          oneTime: true,
        },
        {
          text: "\"Arrivederci\"",
          label: "dialogo_mercante_|_c-1",
          props: {
          },
          type: "call",
          oneTime: true,
        },
      ],
    },
  ],
}
    };
    let res = convertInkText(`
=== città ===
Sei in città.
* [Parla con il mercante]
    -> dialogo_mercante ->
    Torni a girare per la città.

=== dialogo_mercante ===
Il mercante sorride.
* "Mostrami la merce"
    "Ecco qui!"
* "Arrivederci"
    "A presto!"
->->
`);
    expect(res).toEqual(expected);
});
