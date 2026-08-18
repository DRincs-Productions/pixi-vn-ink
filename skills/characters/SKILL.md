---
name: pixi-vn-ink-characters
description: Use when attributing ink dialogue to a Character, printing a character's name inline with [characterId], writing character emotions with the id@emotion syntax, or renaming a character from ink with # rename. Part of the pixi-vn-ink skill set — install alongside pixi-vn-ink-getting-started.
---

# Characters in ink

Official docs: [pixi-vn.com/ink/character](https://pixi-vn.com/ink/character). Assumes
[Pixi'VN characters](https://pixi-vn.com/start/character) are already defined via `CharacterBaseModel`
+ `RegisteredCharacters.add(...)` — this skill only covers referencing them from `.ink`.

## When to use this skill

Use whenever an `.ink` line needs to be spoken by a registered character, needs that character's
display name printed inline, needs an emotion-specific character variant, or needs to change a
character's name from inside the story (a naming scene, a nickname reveal, ...).

## Attributing a line to a character

```ink
mc: Hello, I'm Liam.
```

`<character_id>: <text>` — Pixi'VN splits on the **first `": "` (colon, then a space)** in the line and
checks whether the token before it is a known character id. A known id is either one explicitly passed
to `importInkText(text, { characters: [...] })` / `vitePluginInk({ characters: [...] })`, or (the
common case) already present in `RegisteredCharacters` at conversion time. If the token doesn't match a
known character, the whole line is left as plain narrator text — including the colon — so a typo'd
character id silently becomes garbled narration instead of an error. Because the split requires the
literal `": "`, `mc:Hello` (no space) is **not** recognized as dialogue attribution.

```ts title="values/characters.ts"
import { CharacterBaseModel, RegisteredCharacters } from "@drincs/pixi-vn";

export const mc = new CharacterBaseModel("mc", { name: "Liam" });
RegisteredCharacters.add(mc);
```

If characters are registered *after* the ink importing/build step runs (a common ordering issue with
the Vite plugin, since `vitePluginInk`'s JSON export happens independently of when your `content/`
files execute), pass their ids explicitly via `vitePluginInk({ characters: [...] })` or
`importInkText(text, { characters: [...] })` so the split still recognizes them.

## Printing a character's name inline: `[characterId]`

```ink
Hello, [mc].
```

This is **not** native ink's `{variable}` interpolation — it's Pixi'VN's
[text-replacement](../text-replacement/SKILL.md) mechanism (`[key]` in square brackets), applied here to
substitute a character id with that character's current `name`. It needs one text-replace handler
registered, using the built-in `"characterId"` validation mode — every official template ships this by
default:

```ts title="content/ink/text-replaces.ts"
import { TextReplaces } from "@drincs/pixi-vn-ink";
import { RegisteredCharacters } from "@drincs/pixi-vn/characters";

TextReplaces.add((key) => RegisteredCharacters.get(key)?.name, {
  name: "character name",
  validation: "characterId",
  type: "after-translation",
  i18nInterpolation: true,
  description: "Replaces a character ID with the character's name in the game.",
});
```

`validation: "characterId"` means this handler only fires for keys that are currently a registered
character id (checked against `RegisteredCharacters`) — no regex needed. Because the character's
`name` can change at runtime (see rename below), `[mc]` always reflects the *current* name, not the one
at story-write time.

## Character emotions: `id@emotion`

```ink
mc@happy: Hi, I'm Liam. I'm very happy today.
```

`<character_id>@<emotion>: <text>` — the whole `mc@happy` token is checked against
`RegisteredCharacters` exactly like a plain id above; it resolves because Pixi'VN characters can be
registered under a composite `{ id, emotion }` key (internally addressed the same way, `id@emotion`):

```ts title="values/characters.ts"
import { CharacterBaseModel, RegisteredCharacters } from "@drincs/pixi-vn";

export const mc = new CharacterBaseModel("mc", { name: "Liam" });
export const mcHappy = new CharacterBaseModel({ id: "mc", emotion: "happy" }, { name: "Liam happy" });

RegisteredCharacters.add([mc, mcHappy]);
```

An emotion variant is a full second `CharacterBaseModel` registration — typically with its own `name`
override (here identical) plus whatever sprite/portrait data your project's rendering layer keys off of
(see [pixi-vn-ink-canvas](../canvas/SKILL.md) for showing an emotion-specific sprite alongside the line).
Referencing `mc@sad` without registering that variant behaves like any other unknown id: the line falls
back to plain narrator text.

## Renaming a character from ink: `# rename`

```ink
=== start ===
mc: Hello, I'm [mc].
# request input string
mc: My name is:
# rename mc {_input_value_}
mc: My name is [mc]
-> DONE
```

`# rename <characterId> <newName>` is **not** a built-in hashtag command — every official template
registers it itself, because "which field(s) does renaming touch" is project-specific:

```ts title="content/ink/hashtag-commands.ts"
import { characterIdsEnum } from "@/pixi-vn.keys.gen"; // generated by vitePluginPixivn's typeFilePath
import { HashtagCommands } from "@drincs/pixi-vn-ink";
import { RegisteredCharacters } from "@drincs/pixi-vn/characters";
import zod from "zod";

HashtagCommands.add(
  async (script) => {
    const character = RegisteredCharacters.get(script[1]);
    if (character) character.name = script[2];
    return true;
  },
  {
    name: "character rename",
    description: "Renames a character in the game.\n\n```ink\n# rename <characterId> <newName>\n```",
    validation: zod.tuple([zod.literal("rename"), zod.enum(characterIdsEnum), zod.string()]),
  },
);
```

See [pixi-vn-ink-hashtag-commands](../hashtag-commands/SKILL.md) for the `add` vs `addMapper` choice and
why this is registered as a plain `add` handler (it mutates game state directly rather than returning a
`PixiVNJsonOperation`).

## Related

- **pixi-vn-ink-text-replacement** — the general `[key]` mechanism `[characterId]` is built on.
- **pixi-vn-ink-hashtag-commands** — how `# rename` (and any other custom command) is registered.
- **pixi-vn-ink-getting-started** — knots-as-labels, storage mapping, installation.
- [pixi-vn.com/start/character](https://pixi-vn.com/start/character) — defining `CharacterBaseModel`s
  in JS/TS in the first place.
