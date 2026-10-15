# AGENTS.md

Guidance for AI agents (and humans) working on `@drincs/pixi-vn-ink`.

## Purpose

This library lets [Pixi’VN](https://pixi-vn.com) games be written in [ink](https://github.com/inkle/ink), inkle's narrative scripting language. It:

1. compiles/parses ink with [`inkjs`](https://github.com/y-lohse/inkjs) (`src/parser`, `src/loader`),
2. converts the ink runtime JSON into Pixi’VN JSON (`src/converter`, `src/mapper`), which is executed by [`@drincs/pixi-vn-json`](https://github.com/DRincs-Productions/pixi-vn-json),
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

Standard ink is the baseline; anything that deviates from it must be documented. When you add or change such behaviour, update this list **and** the relevant skill.

- **Hashtag commands**: tags starting with `#` can run Pixi’VN operations (`# show image …`, `# shake …`, `# play sound …`, `# jump`, …) with optional transitions (`with dissolve|fade|…`) and effects. Custom ones are registered through `HashtagCommands`. See `skills/hashtag-commands` and `skills/canvas`.
- **Output is Pixi’VN JSON**, not a live inkjs `Story`: ink is converted to labels/steps and run by `@drincs/pixi-vn-json`, so the game state (variables, history, save/load) is managed by Pixi’VN, not by inkjs.
- **Knots/stitches become Pixi’VN labels**; diverts, tunnels, threads, and `-> END`/`-> DONE` are mapped to label opening/closing semantics.
- **Variables** are stored in Pixi’VN storage; functions and externals follow Pixi’VN rules (see `skills/getting-started` and `skills/migration`).
- **Characters, text replacement (`{...}`/`[...]` replacements), markup, input requests, sound and pause/continue** are Pixi’VN extensions (see the matching skill under `skills/`).
- Some ink features may be unsupported or behave differently; check `tests/` and `skills/migration` before assuming parity.

## Working rules

- **Tests**: for every change (feature, fix, new command), add or update a test in `tests/` (vitest, `npx vitest run`). Prefer a small focused test near the existing ones for that area.
- **Skills**: `skills/` is user-facing documentation for agents and must always be kept up to date. Any change to behaviour, syntax, commands, options or supported ink features must be reflected in the relevant `skills/*/SKILL.md` (and `README.md` if relevant).
- **`inkjs` version**: it is very important to use the latest `inkjs` release (currently pinned in `devDependencies` and used by the compiler). When bumping, check the changelog for ink language/runtime changes and make sure the converter handles new JSON runtime constructs.
- **Pixi’VN dependencies**: keep `@drincs/pixi-vn` and `@drincs/pixi-vn-json` on their latest versions, avoid deprecated APIs, and support new transitions/effects added upstream.
- **Before finishing**: run `npx tsc --noEmit`, `npx biome format --write <files>` and `npx vitest run`.
