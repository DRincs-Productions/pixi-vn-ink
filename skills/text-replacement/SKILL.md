---
name: pixi-vn-ink-text-replacement
description: Use when ink text needs to inject the result of a JS/TS function or lookup inline with [key], via TextReplaces.add — for anything a plain {variable} interpolation can't express. Part of the pixi-vn-ink skill set — install alongside pixi-vn-ink-getting-started.
---

# Text replacement: `[key]` substitution

Official docs: [pixi-vn.com/ink/replacement](https://pixi-vn.com/ink/replacement).

## When to use this skill

Use whenever ink text needs to show a value that isn't a plain ink variable — the result of a lookup
function, a translation-aware substitution, or anything computed in JS/TS. Use **pixi-vn-ink-characters**
instead if the specific need is "show a character's name" — that's this same mechanism, pre-wired with
`validation: "characterId"`.

## Why `[key]` exists

Native ink can inject a *variable's* value with `{name}`, but has no syntax to inject the result of an
arbitrary JS/TS function or lookup — `{name}` only ever reads an ink `VAR`/`temp`. Pixi'VN adds `[key]`
(square brackets) for exactly that:

```ink
What do you want, [alice]?
* Talk to \[bob\]
```

`\[bob\]` escapes a literal `[bob]` that should print as-is rather than being treated as a replacement
key — needed whenever a line legitimately contains square brackets unrelated to this mechanism (or,
inside a choice, unrelated to the native-ink [choice-bracket
syntax](https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#suppressing-choice-text),
which uses the same `[`/`]` characters for a different purpose).

## Registering a handler

```ts title="content/ink/text-replaces.ts"
import { TextReplaces } from "@drincs/pixi-vn-ink";

TextReplaces.add(() => "Alice", {
  name: "Replace Alice",
  validation: /alice/,
  type: "after-translation",
  i18nInterpolation: true,
  description: "Replaces 'alice' with the character's name.",
});
```

`TextReplaces.add(handler, options)`:

- **`handler: (key: string) => string | undefined`** — receives the text found inside `[...]` (no
  brackets); return the replacement, or `undefined` to leave that occurrence untouched (e.g. because
  this handler doesn't actually recognize the key despite `validation` matching it).
- **`validation`** decides which keys this handler is even invoked for — one of:
  - `"all"` — always invoked, for every `[key]` found.
  - `"characterId"` — only when the key is currently a registered character id in
    `RegisteredCharacters` (see **pixi-vn-ink-characters** for the canonical use of this mode).
  - a `RegExp` — invoked when the key matches.
  - a `ZodType<string>` — invoked when `schema.safeParse(key)` succeeds.
- **`type`** — `"before-translation"` (runs before `onInkTranslate`; useful to rewrite a key into an
  i18next-style `{{key}}` token first) or `"after-translation"` (default — runs after translation,
  useful when the replacement depends on the already-translated text). See
  **pixi-vn-ink-getting-started** for how translation itself is wired up.
- **`i18nInterpolation`** — when `true`, the handler's replacement is applied on the *second* occurrence
  of a matched key onward; the first occurrence instead becomes `{{key}}` once, so an i18next
  interpolation slot exists in the translated string for that key. Pair this with a
  `missingInterpolationHandler` in the i18n config that returns the raw value instead of an empty
  string for keys with no translation entry. Defaults to `false` (every occurrence is replaced
  directly).
- Handlers run in registration order, each on the current (possibly already-modified) text, so a later
  handler can see replacements a previous one already made.

## A second example

```ts title="content/ink/text-replaces.ts"
TextReplaces.add(() => "Stephanie", {
  name: "steph_fullname",
  validation: /steph_fullname/,
  type: "after-translation",
  i18nInterpolation: true,
  description: "Replaces 'steph_fullname' with the full name of the character Stephanie.",
});
```

```ink
Everyone just calls her Steph, but her full name is [steph_fullname].
```

## Related

- **pixi-vn-ink-characters** — `[characterId]` is the most common concrete use of this mechanism.
- **pixi-vn-ink-getting-started** — translation wiring (`onInkTranslate`), and how to inspect every
  currently-registered `TextReplaces` handler via the Vite dev-server API
  (`GET /__pixi-vn-ink/text-replaces`) while debugging.
