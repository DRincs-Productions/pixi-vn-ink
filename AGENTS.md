# AGENTS.md

Guidance for AI agents (and humans) working on `@drincs/pixi-vn-ink`.

## Purpose

This library lets [Pixi’VN](https://pixi-vn.com) games be written in [ink](https://github.com/inkle/ink), inkle's narrative scripting language. It:

1. compiles/parses ink with [`inkjs`](https://github.com/y-lohse/inkjs) (`src/parser`, `src/loader`),
2. converts between Ink source and Pixi’VN JSON (`src/converter`, `src/mapper`); Pixi’VN JSON is executed by [`@drincs/pixi-vn-json`](https://github.com/DRincs-Productions/pixi-vn-json),
3. adds Pixi’VN-specific features on top of ink (hashtag commands, text replacement, markup, input, etc. — see `src/handlers`), and ships a Vite plugin (`src/vite`).

The goal is to handle ink correctly and completely, and to expose Pixi’VN features through ink in a way that stays idiomatic.

## Language

English is the primary language of this project: write code, comments, documentation (`README.md`, `skills/`), commit messages, and PR descriptions in English, even if the conversation with the user happens in another language.

## Ink references

Always consult the official ink documentation when touching parsing, conversion or runtime behaviour:

- Language syntax: https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md
- Architecture and dev overview: https://github.com/inkle/ink/blob/master/Documentation/ArchitectureAndDevOverview.md
- Running ink from a game: https://github.com/inkle/ink/blob/master/Documentation/RunningYourInk.md
- JSON runtime format (what the converter reads): https://github.com/inkle/ink/blob/master/Documentation/ink_JSON_runtime_format.md

## Differences from standard ink

- **Animated sprites (v1.4.0)** use `show/edit/remove/pause/resume/goto asprite` and require
  `@drincs/pixi-vn` >=1.9.9 and `@drincs/pixi-vn-json` >=1.16.0. Ink only parses and maps the
  syntax (it never calls `animatedSpriteOperation` or PixiJS). Keep their source properties
  separate from display options. See `skills/canvas`.
- **Built-in canvas hashtag commands** (`image`, `video`, `asprite`, …) must be registered with
  `HashtagCommands.addMapper` and converted at compile time into static `PixiVNJsonOperation`s;
  executing them belongs to `@drincs/pixi-vn-json`. Mappers throw on invalid input so the command
  is deferred and fails at runtime like other mappers. Only use runtime `HashtagCommands.add`
  handlers for behaviour that cannot be represented as a JSON operation.

Standard ink is the baseline; anything that deviates from it must be documented. When you add or change such behaviour, update this list **and** the relevant skill.

- **Hashtag commands**: tags starting with `#` can run Pixi’VN operations (`# show image …`, `# shake …`, `# play sound …`, `# jump`, …) with optional transitions (`with dissolve|fade|…`) and effects. Custom ones are registered through `HashtagCommands`. See `skills/hashtag-commands` and `skills/canvas`.
- **Output is Pixi’VN JSON**, not a live inkjs `Story`: ink is converted to labels/steps and run by `@drincs/pixi-vn-json`, so the game state (variables, history, save/load) is managed by Pixi’VN, not by inkjs.
- **Knots/stitches become Pixi’VN labels**; diverts, tunnels, threads, and `-> END`/`-> DONE` are mapped to label opening/closing semantics.
- **JSON to Ink stitches**: sibling stitch labels are emitted under one knot header. Nested label paths are currently rejected. See `skills/getting-started`.
- **JSON to Ink choices**: generated choice bodies are emitted inline under their owning choice. A generated body must be referenced once. Shared text and menu-only text can be reconstructed from matching branch dialogue. Fallback choices can carry their own branch content. Menu-only choices can omit a body when Ink omits the generated label. Menu-only choice text can also contain inline alternatives. See `skills/getting-started`.
- **JSON to Ink generated choice labels**: choices referenced by conditions or diverts (`c-N`) are emitted with an Ink label `(c_N)`, which the mapper turns back into `c-N`. Whitespace-only choice body lines are kept inline after the choice header. The constant condition `1` that the mapper adds to choices diverting to a stitch is not emitted again. Knot-level named gathers (`- (opts)`) are recognised when their choices join a sibling anonymous gather, and addresses skip them. Diverts to generated choices are emitted as plain diverts. A named gather nested in a choice body (`- - (name)`) is reconstructed, and addresses skip unlabelled choices. Named root gathers joined by sibling named gathers, gathers closing a gather body and inline alternatives containing diverts are reconstructed too. A bare label read count (`{label: a|b}`) and a glued `text {cond: a|b} text` line are emitted inline. A nested weave's gather drops its closing jump to the enclosing weave's gather. A mapper-made constant switch (`x == 1` then else-ifs on bare constants) is emitted as an Ink switch, and tunnel targets end with `->->`. Temp variables are declared once per knot, a tag after dialogue ending in a space stays on the dialogue line, and a plain dialogue step whose trailing space Ink would trim throws a path-specific error. See `skills/getting-started`.
- **JSON to Ink hashtag commands**: with `convertJsonToInk(json, { inferHashtagCommands: true })`, operations without `$origin` are written as the command the registered mappers convert back into the same operation (convention-based candidates plus the optional `reverse` mapper option, each verified). `$origin` always wins. Otherwise it throws a path-specific error. `HashtagCommands.convertObjToInkProps` writes props. See `skills/hashtag-commands`.
- **JSON to Ink gathers**: anonymous gathers shared by choices can reconstruct the weave separator. Named gathers emit their name when the owning flow can be inferred from the JSON. See `skills/getting-started`.
- **JSON to Ink tags and glue**: static deferred tags and tag origins preserve their source text, including JSON object arguments. Narration tags can recreate the divert they generated. Dynamic tags can reconstruct interpolations and inline branches. Adjacent dialogue and divert steps can reconstruct leading glue and inline diverts. Literal glue markers are escaped. See `skills/getting-started`.
- **JSON to Ink markup**: dialogue escapes Ink syntax used as literal markup and preserves explicit line breaks. See `skills/markup`.
- **JSON to Ink divert parameters**: numeric parameter references reconstruct Ink signatures. A parameter used as a divert target receives Ink’s `->` type marker. See `skills/getting-started`.
- **JSON to Ink lists**: a numeric list declaration is reconstructed from its array and qualified member operations. A global initialized from that list can also be reconstructed. See `skills/getting-started`.
- **JSON to Ink assignments**: repeated global assignments and writes to knot parameters can be reconstructed, including simple alternatives inside quoted strings. See `skills/getting-started`.
- **JSON to Ink function calls**: standalone function operations emit as Ink logic lines. See `skills/getting-started`.
- **JSON to Ink alternatives**: step switches can emit inline or multiline Ink alternatives according to their mode and branch content. See `skills/getting-started`.
- **JSON to Ink conditional branches**: branches containing dialogue, operations and choices can emit as multiline Ink conditionals. Glued dialogue branches can also preserve nested inline conditionals and whitespace. Inline alternatives retain their generated IDs when rendered in the matching branch. See `skills/getting-started`.
- **Variables** are stored in Pixi’VN storage; functions and externals follow Pixi’VN rules (see `skills/getting-started` and `skills/migration`).
- **Characters, text replacement (`{...}`/`[...]` replacements), markup, input requests, sound and pause/continue** are Pixi’VN extensions (see the matching skill under `skills/`).
- Some ink features may be unsupported or behave differently; check `tests/` and `skills/migration` before assuming parity.

## Working rules

- **Tests**: for every change (feature, fix, new command), add or update a test in `tests/` (vitest, `npx vitest run`). Prefer a small focused test near the existing ones for that area.
- **JSON to Ink round-trip tests**: whenever a test defines an expected PixiVN JSON result for Ink conversion, also pass that JSON through `convertJsonToInk`, compile the generated Ink with `convertInkToJson`, and assert that the result equals the input JSON. Keep unsupported JSON constructs explicit in dedicated tests; do not silently omit them from generated Ink.
- **JSON to Ink scope**: `convertJsonToInk` must either preserve a JSON construct through the Ink compiler and mapper or throw a path-specific error. Never silently drop unsupported operations, conditionals, dynamic content, or Pixi’VN-only metadata.
- **Skills**: `skills/` is user-facing documentation for agents and must always be kept up to date. Any change to behaviour, syntax, commands, options or supported ink features must be reflected in the relevant `skills/*/SKILL.md` (and `README.md` if relevant).
- **`inkjs` version**: it is very important to use the latest `inkjs` release (currently pinned in `devDependencies` and used by the compiler). When bumping, check the changelog for ink language/runtime changes and make sure the converter handles new JSON runtime constructs.
- **Pixi’VN dependencies**: keep `@drincs/pixi-vn` and `@drincs/pixi-vn-json` on their latest versions, avoid deprecated APIs, and support new transitions/effects added upstream.
- **Before finishing**: run `npx tsc --noEmit`, `npx biome format --write <files>` and `npx vitest run`.
