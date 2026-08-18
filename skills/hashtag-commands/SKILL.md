---
name: pixi-vn-ink-hashtag-commands
description: Use when a Pixi'VN ink project needs custom logic that native ink can't express — write it as a HashtagCommands.add/addMapper handler, not an ink function (ink function definitions are silently ignored by Pixi'VN). Covers add vs addMapper, validation (regex/zod), and addBaseHashtagCommands' built-in sections. Part of the pixi-vn-ink skill set — install alongside pixi-vn-ink-getting-started.
---

# Custom hashtag commands

Official docs: [pixi-vn.com/ink/hashtag](https://pixi-vn.com/ink/hashtag).

## When to use this skill

Use whenever an ink script needs custom, project-specific behavior that isn't one of the built-in
commands documented in **pixi-vn-ink-canvas**/**-sound**/**-assets**/**-input**/**-pause-continue** —
navigation, a custom achievement/flag check, anything wired to your own app code. **Always prefer this
over defining an ink `function`** — see why below.

## These are not plain ink tags

Native ink's `#` is a generic tagging system: a `# colour it blue` comment-like annotation the *game*
is free to read off and interpret however it likes, or ignore entirely — ink itself attaches no meaning
to it. **Pixi'VN ink is not "reading off tags"** — it's running a real command→operation dispatch
system. Every `#` line in a Pixi'VN `.ink` file is tokenized into a string array (`["show", "image",
"bg", ...]`), matched against every registered handler's `validation` rule, and — if none matches — the
Vite dev server logs it as an **unknown hashtag command** (see **pixi-vn-ink-getting-started**'s
debugging section). A `#` line is either a recognized command that does something specific and
type-checked, or a mistake to be reported — never a value-neutral annotation the engine shrugs off.

## Why not an ink `function`?

`=== function name(...) === / ~ return ...` is **valid, compiler-clean native ink** — and **silently
ignored** by Pixi'VN. Calling one does nothing and returns nothing; there is no warning. Custom logic
belongs in JS/TS instead, and specifically as a hashtag command rather than a plain function exposed
through `StepLabelProps`, because:

- A function called from ink (`~ myFunc(...)`) **cannot have optional parameters** — every parameter
  must be passed on every call. A hashtag command's `validation` schema can express optional/variant
  argument shapes directly.
- Hashtag commands are introspectable: `HashtagCommands.info()` — and therefore the Vite dev-server's
  `GET /__pixi-vn-ink/hashtag-commands` endpoint — lists every registered command with its name,
  description, and validation rule, so `# navigate /game` can be checked against a real schema instead
  of trusted by convention.
- They integrate with the dev-time linter: an unrecognized `#` line, or one whose object-shaped
  argument (e.g. `edit`'s properties) doesn't match its own schema, is warned at save-time with
  `file:line` — a plain JS function gets no such check.

## `HashtagCommands.add` — general-purpose interception

```ts title="content/ink/hashtag-commands.ts"
import { HashtagCommands } from "@drincs/pixi-vn-ink";
import zod from "zod";

HashtagCommands.add(
  async (script, { navigate }) => {
    // script: ["navigate", "/game"]
    await navigate({ to: script[1] });
    return true;
  },
  {
    name: "navigate",
    description: `Navigates to a specified route within the game.\n\n\`\`\`ink\n# navigate <route>\n\`\`\``,
    validation: zod.tuple([zod.literal("navigate"), zod.string()]),
  },
);
```

```ink title="ink/start.ink"
=== start ===
# navigate /game
-> DONE
```

`add(handler, options)` registers a middleware run **before** the step: the handler receives the
tokenized command (`script: string[]`), the current step's `StepLabelProps` (so it can call whatever
your app exposed there — `navigate`, `toast`, ...), and a `convertListStringToObj` helper for parsing
`key value` trailing arguments. Return `true` to mark the command fully handled (nothing further runs
for this line), a `string` to have that string re-interpreted as a *new* hashtag command (chaining), or
a falsy value to let the next-registered handler (or the built-in command table) try instead. Handlers
you add run **before** the built-ins, in reverse registration order (last `add` call checked first).

`validation` gates which commands a handler even sees — a `RegExp` tested against the joined tokens, or
a Zod schema (`zod.tuple([...])` validating the parsed token array; `zod.literal` pins an exact token,
typically the command name, `zod.string`/`zod.enum` accept a parameter). Install `zod` — it's a peer
dependency, not bundled.

## `HashtagCommands.addMapper` — declarative, and what the built-ins use

```ts title="content/ink/hashtag-commands.ts"
import { HashtagCommands } from "@drincs/pixi-vn-ink";
import { z } from "zod";

// # navigate scene_name
HashtagCommands.addMapper(
  (list, step) => {
    step.labelToOpen = { label: list[1], type: "jump" };
    step.goNextStep = undefined;
    return undefined;
  },
  {
    name: "navigate-command",
    validation: z.tuple([z.literal("navigate"), z.string()]),
  },
);
```

`addMapper(handler, options)` is the cleaner alternative when a command's job is "turn these tokens
into a `PixiVNJsonOperation`" (or a direct mutation of the current `step`) rather than running arbitrary
side-effecting code — it's what **every built-in command** (`# show`, `# play sound`, `# load`, ...) is
implemented with. Mappers run in registration order **before** the built-in switch table, so a project
can override or extend a built-in command's behavior by registering its own mapper with an overlapping
`validation`. Prefer `addMapper` over `add` by default; reach for `add` specifically when the command
needs to intercept/short-circuit the pipeline, chain into another command, or run arbitrary
`StepLabelProps`-dependent side effects that don't reduce to a single operation object.

## `addBaseHashtagCommands` — the built-in command library

Every command documented in **pixi-vn-ink-canvas**, **-sound**, **-assets**, and **-pause-continue** (plus
**-input**'s `# request input`) is itself registered via `addMapper`, grouped into four toggleable
sections:

```ts title="content/ink/hashtag-commands.ts"
import { assetAliasIds, bundleIds } from "@/pixi-vn.keys.gen";
import { addBaseHashtagCommands } from "@drincs/pixi-vn-ink";

addBaseHashtagCommands({
  bundleIds, // enables strict validation for `# load bundle <alias>`
  assetAliasIds, // enables strict validation for `# load assets <alias>`
  sections: {
    canvas: true, // default
    sound: true, // default
    narration: true, // # call/jump (deprecated), # pause, # continue, # request input
    assets: true, // default
  },
});
```

Call it once, near the start of the app, **before** any ink content is parsed — this is not a side
effect of importing `@drincs/pixi-vn-ink` (deliberately: nothing runs until you opt in). Set a section
to `false` only when a project registers its own replacement for that whole group (e.g. custom canvas
commands via `addMapper` that would otherwise collide with the built-ins) or genuinely never needs it
and would rather a typo there be reported as a fully unknown command. `# call`/`# jump` are
**deprecated** — use native ink `->`/`-> ->` instead (see **pixi-vn-ink-getting-started**).

## Inspecting what's registered

`HashtagCommands.info()` returns every registered handler's `{ name, description, validation, ... }` —
this is exactly what the Vite dev server's `GET /__pixi-vn-ink/hashtag-commands` endpoint serves (see
**pixi-vn-ink-getting-started**'s debugging section). Query it instead of guessing whether a command
exists or what shape it expects.

## Related

- **pixi-vn-ink-getting-started** — why ink `function` is ignored, the dev-server debugging workflow,
  and installation.
- **pixi-vn-ink-canvas** / **-sound** / **-assets** / **-input** / **-pause-continue** — every built-in
  command this mechanism ships.
- **pixi-vn-ink-characters** — `# rename` as a real-world custom `add` handler.
