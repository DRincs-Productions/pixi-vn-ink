---
name: pixi-vn-ink-getting-started
description: Use when installing/configuring @drincs/pixi-vn-ink, wiring vitePluginInk and setupInkHmrListener, debugging ink via the Vite dev-server logs/API or the exported JSON, generating ink translation files, or writing/reading core ink syntax (knots, diverts, choices, weave, variables, lists) as it applies to a Pixi'VN project. Entry point for every other pixi-vn-ink-* skill — install it together with the rest of this skill set, not alone.
---

# Pixi'VN + ink: getting started

Official docs: [pixi-vn.com/ink](https://pixi-vn.com/ink). Full native-ink language spec (Inkle):
bundled at `reference/writing-with-ink.md` in this skill, annotated inline wherever Pixi'VN behaves
differently — read this file first, reach for that one only for exhaustive syntax detail or a long
worked example (Tower of Hanoi, the crime-scene mystery, ...).

## When to use this skill

Use this skill whenever the task touches an `.ink` file or the `@drincs/pixi-vn-ink` package: setting
up the Vite plugin, debugging why an `.ink` edit isn't showing up or a hashtag command isn't firing,
generating translation files, or writing/reviewing plain ink narrative structure (knots, diverts,
choices, weave, variables, lists) — the parts of ink that aren't owned by a more specific skill in this
set.

This skill set is split into modules the same way `@drincs/pixi-vn`'s is, but **unlike that skill
set, install every `pixi-vn-ink-*` module together** — they all teach one coherent "how to write ink
for Pixi'VN" skill, and several depend on the vocabulary/setup this module establishes (knots-as-labels,
the storage mapping, the hashtag-command mechanism). Installing with
`npx skills add DRincs-Productions/pixi-vn-ink --all` is the supported path; don't cherry-pick a subset.

- **pixi-vn-ink-characters** — dialogue attribution, name substitution, emotions.
- **pixi-vn-ink-input** — `# request input` prompts.
- **pixi-vn-ink-pause-continue** — `# pause` and `<># continue`.
- **pixi-vn-ink-markup** — Markdown/HTML/CSS inside dialogue text.
- **pixi-vn-ink-canvas** — every canvas hashtag command.
- **pixi-vn-ink-sound** — every sound hashtag command.
- **pixi-vn-ink-assets** — `# load`/`# lazyload`.
- **pixi-vn-ink-text-replacement** — `[key]` substitution.
- **pixi-vn-ink-hashtag-commands** — how to author your own hashtag command instead of an ink function.
- **pixi-vn-ink-migration** — upgrading an existing project to the current version.

## Installation

```npm
npm install @drincs/pixi-vn @drincs/pixi-vn-ink
```

Peer dependencies: `@drincs/pixi-vn` (>=1.8.0) and `zod` (>=4.4.0, used by `HashtagCommands`/
`TextReplaces` validation). `vite` is an optional peer — only needed for the Vite plugin below, which
is the recommended setup for every real project.

### (Recommended) the Vite plugin: `@drincs/pixi-vn-ink/vite`

```ts title="vite.config.ts"
import { defineConfig } from "vite";
import { vitePluginInk } from "@drincs/pixi-vn-ink/vite";

export default defineConfig({
  plugins: [
    // other plugins (vitePluginPixivn, react(), ...)
    vitePluginInk({
      inkGlob: "./ink/**/*.ink",
      inkJsonOutputPattern: "./public/ink-json/[path][name].gen.json",
      inkJsonManifestPath: "./src/assets/ink-manifest.gen.json",
    }),
  ],
});
```

This is the exact configuration the official `pixi-vn-react-template` ships. What each option does:

- **`inkGlob`** — which `.ink` files to track (glob, resolved from Vite `root`). The plugin **imports
  them itself**: it generates a virtual module, `virtual:pixi-vn-ink`, exporting the raw text of every
  matched file as `string[]` — no hand-written `import.meta.glob` helper needed.
- **`inkJsonOutputPattern`** — when set, every matched `.ink` file is compiled with `convertInkToJson`
  and written to disk at the rendered path (placeholders: `[name]`, `[ext]`, `[extname]`, `[file]`,
  `[path]`, `[dir]`). **This is the actual game optimization**: ink source is parsed once, at build/dev
  time, into `PixiVNJson`; the shipped game loads pre-compiled JSON instead of running the ink compiler
  in the player's browser on every load. It also makes the virtual module additionally export
  `inkJsons` (the compiled `PixiVNJson[]`, used below).
- **`inkJsonManifestPath`** — where the generated `manifest.json` (listing every exported JSON file's
  URL, for bulk loading) is written; defaults to `manifest.json` inside the output directory if
  omitted.

Wire it up once in the app entry point — with this configuration, **no manual `importInkText` call is
needed**: initial load and every future hot-reload are both handled by the listener.

```ts title="main.ts"
import { setupInkHmrListener } from "@drincs/pixi-vn-ink/vite-listener";

await setupInkHmrListener();
```

`setupInkHmrListener()` imports the initial compiled JSON from the virtual module on startup, and
(only while the Vite dev server is attached) subscribes to an `ink-updated` HMR event so editing any
tracked `.ink` file live-reloads its compiled content without a full page reload. This is also the
path a production build takes (`import.meta.hot` is simply absent there, so only the one-time initial
import runs) — the same call works unmodified in dev and in a built game.

The lower-level primitives this wraps still exist and are occasionally useful directly:
`importInkText(text | text[])` (from `@drincs/pixi-vn-ink`) parses raw ink source strings and registers
their knots; `importJson(pixiVNJson | pixiVNJson[])` imports already-compiled `PixiVNJson`. Reach for
them only outside the Vite-plugin flow (e.g. a headless script, or loading ink fetched from a remote
source at runtime) — a normal app just calls `setupInkHmrListener()` and is done.

### VS Code

Install the [ink extension](https://marketplace.visualstudio.com/items?itemName=drincs-productions.pixi-vn-ink-vscode)
(syntax highlighting, a `pixi-vn` engine mode that suppresses warnings for Pixi'VN-only syntax, live
preview). Recommended `settings.json`, matching the official template:

```json title=".vscode/settings.json"
{
  "ink.mainFile": "start.ink",
  "ink.rootFolder": "ink",
  "ink.markup": "Markdown",
  "ink.engine": "pixi-vn"
}
```

## Debugging: check the Vite dev-server logs and API, and the exported JSON

**Whenever `vite`/`npm run dev` is running, use it as a source of truth before guessing.** Most
ink-authoring mistakes in a Pixi'VN project surface here immediately — don't rely on story-runtime
behavior alone to tell whether a `.ink` edit is correct.

### Terminal logs

On every `.ink` save (and on `vite build`), `vitePluginInk` logs, prefixed `(pixi-vn-ink)`:

- **Ink compile errors/warnings** — from the ink compiler itself (`InkCompiler.compile`), with
  `file:line`.
- **Unknown hashtag commands** — `# some_typo ...` that matched no registered handler. This is the
  single most common authoring mistake; if a `#` line silently does nothing in-game, check here first.
- **Hashtag key-schema issues** — a recognized command whose object-shaped argument (e.g. `edit`'s
  properties, `animate`'s `options`) doesn't match that command's own schema.
- **Unknown divert targets** — `-> some_label` where `some_label` matches no known ink knot **or**
  JS/TS label (see below).
- A summary line per export: `N file(s) exported: M label(s), K hashtag-command(s), J text-replace(s)`.

### The dev-server API

While the dev server is up, three read-only-or-more endpoints are queryable directly (e.g. `curl`,
`fetch`) — useful for checking exactly what's registered instead of trusting memory or a stale doc:

```bash
curl http://localhost:5173/__pixi-vn-ink/hashtag-commands   # every registered hashtag command: name, description, validation rule
curl http://localhost:5173/__pixi-vn-ink/text-replaces        # every registered [key] text-replace handler, same shape
curl http://localhost:5173/__pixi-vn-ink/info                 # { version, schemaUrl } for the running @drincs/pixi-vn-ink
```

Each `validation` is serialized as `{ type: "regexp", source, flags }`, `{ type: "zod", schema }` (a
JSON Schema), or `{ type: "literal", value }` — enough to reconstruct exactly which `# ...` shapes a
handler accepts without reading its source file.

### The exported JSON

With `inkJsonOutputPattern` set, **open the generated `.json` file(s)** after editing `.ink` — that file
*is* what the game will actually run, already validated against the `PixiVNJson` schema (a schema
mismatch — most often a custom hashtag command returning a malformed operation — is warned in the
terminal with the offending ink source line attached). Reading the compiled JSON next to the `.ink`
source is the fastest way to confirm "does what I wrote behave the way I intended", especially for a
custom hashtag command or text replace whose output isn't otherwise directly visible.

## Generating the translation file

[Translation](https://pixi-vn.com/start/translate) wiring for ink goes through `onInkTranslate`:

```ts title="lib/hooks/ink-hooks.tsx"
import { onInkTranslate } from "@drincs/pixi-vn-ink";
import { useTranslation } from "react-i18next";

export default function useInkInitialization() {
  const { t } = useTranslation(["narration"]);
  useEffect(() => onInkTranslate(t), [t]);
  return null;
}
```

To generate the translation-file skeleton (every key ink narration text needs an entry for), use
`generateJsonInkTranslation(pixivnJson, targetObject, options?)` against each compiled ink JSON — this
is what every official template's settings-screen "download translations" button does:

```ts title="lib/i18n.ts"
import { generateJsonInkTranslation } from "@drincs/pixi-vn-ink";

async function generateResourceToTranslate(lng: string) {
  const res = { ...(await getLocalesResource(lng)) };
  res.narration ??= {};
  const manifest = await import("@/assets/ink-manifest.gen.json"); // written by inkJsonManifestPath
  for (const path of manifest.default) {
    const element = await fetch(path).then((r) => r.json());
    element && (await generateJsonInkTranslation(element, res.narration));
  }
  return res;
}

export async function downloadResourceToTranslate() {
  const lng = i18n.options.fallbackLng?.toString() || "en";
  const data = await generateResourceToTranslate(lng);
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `strings_${lng}.json`;
  a.click();
}
```

`generateJsonInkTranslation` walks the JSON's labels/steps, collecting every dialogue string (running
each through `HashtagCommands.run` first, so operation-only lines don't pollute the translation file)
and adds a `defaultValue` entry (`"copy_key"` by default, or `"empty_string"`) for any key not already
present in the target object — safe to call repeatedly as new ink content is written.

## Writing core ink for Pixi'VN

Everything Pixi'VN doesn't give its own dedicated module — content, comments, choices, knots, diverts,
glue, weave, gathers, variable text, `VAR`/`CONST`/`temp`, `LIST`, functions, tunnels — is plain,
standard ink. The full syntax reference is `reference/writing-with-ink.md`; this section covers only
what's specific to writing it *for Pixi'VN*.

### Knots are Pixi'VN labels — in both directions

Creating a `knot` with ink registers a `label` internally, addressed exactly like a TS-authored one:

- `-> knot` (divert) is [`jump`](https://pixi-vn.com/start/labels#jump-to-a-label).
- `-> knot ->` (tunnel) is [`call`](https://pixi-vn.com/start/labels#call-to-a-label); `->->` and
  `-> DONE` are equivalent ways to close it.

Because both live in the same registry, **a divert can target a label defined in JS/TS**, and JS/TS can
call into a knot — this is the intended way to mix the two:

```ink title="ink/start.ink"
=== start ===
The story continues in code.
-> minigame_result
```

```ts title="content/labels/minigame-result.label.ts"
import { newLabel } from "@drincs/pixi-vn";

export const minigameResult = newLabel("minigame_result", [
  () => {
    /* ... */
  },
]);
```

```ts title="some ink label's JS counterpart"
import { narration } from "@drincs/pixi-vn";
await narration.call("start", {}); // "start" is the ink knot above
```

### Diverting in the same step

By default a divert runs in the *next* step, so the diverted content only appears once the flow
continues. Put the divert directly after the text with no line break, and it runs in the **same** step,
so both are shown together — the same glue-adjacent rule as native ink:

```ink
=== start ===
It is, first and foremost...
-> add2       // next step: "...a story about the twelve labors of Hercules." shown separately

=== start ===
It is, first and foremost...-> add2   // same step: shown as one continuous block
```

### Threads work differently in Pixi'VN ink

Native ink Threads (fork the story, merge multiple sources' choice lists into one) have **no Pixi'VN
equivalent**. `<-` is simply repurposed to mean the same thing as a tunnel, `-> knot ->` — it calls the
target and returns. Don't expect combined choice lists or "shared but not forked" globals when porting
a script that used `<-` for real threading.

### Variables live in Pixi'VN storage

`VAR`/`CONST` are [regular storage](https://pixi-vn.com/start/storage); `temp` is
[temporary storage](https://pixi-vn.com/start/storage#temporary-storage) — same underlying mechanism,
just scoped to the current knot/stitch. The variable name **is** the storage key, so
`storage.get("myVariable")`/`storage.set(...)` from JS/TS reads and writes the exact same value an ink
`~ myVariable = ...` line does. `LIST name = a, b, c` stores both a list definition and each entry under
its **qualified key**, `name.entryName` — see [LIST entries need their qualified
name](#list-entries-need-their-qualified-name) below; this is the single most common porting bug.

### Functions: define in JS/TS (prefer a hashtag command), not ink

`=== function name(...) === / ~ return ...` is parsed but **silently ignored** at runtime. See
**pixi-vn-ink-hashtag-commands** — a hashtag command is the preferred way to add custom logic; a plain
JS function exposed via `StepLabelProps` and called from ink with `~ myFunc(...)` also works but is
more limited (no optional parameters) and doesn't integrate with the dev-server introspection above.

### Not yet supported in Pixi'VN ink

Standard, documented parts of native ink that the Pixi'VN runtime does not implement yet — they parse
without error but won't behave as native ink/Inky would:

- `CHOICE_COUNT()`, `TURNS()`, `TURNS_SINCE()`, `SEED_RANDOM()`
- `LIST_RANDOM()`, `LIST_COUNT()`, `LIST_INVERT()`, `LIST_ALL()`, `LIST_RANGE()`, `LIST_MIN()`,
  `LIST_MAX()`, `LIST_VALUE()`

`RANDOM(min, max)`, `POW`, `INT`/`FLOOR`/`FLOAT`, and basic `LIST` set/get/`has`/`?`/`==`/`++`/`--`
operations *are* implemented and safe to use. Check [pixi-vn.com/ink](https://pixi-vn.com/ink)'s
"Upcoming features" section before assuming this list has changed.

### LIST entries need their qualified name

**Native ink** treats a list entry's short name (`sword`) and its qualified name (`items.sword`) as
interchangeable. **Pixi'VN does not** — always use the qualified form. A bare `sword` silently resolves
to an unrelated plain storage key named `"sword"`, not the list member, with no warning:

```ink
LIST items = sword, key, potion
~ myItem = items.sword   // ✅ correct
~ myItem = sword          // ❌ silently wrong — reads/writes a plain "sword" storage flag instead
```

### Syntax Pixi'VN ignores entirely

- **`INCLUDE other.ink`** — use multiple `.ink` files matched by `inkGlob` (or, manually,
  `importInkText([sourceA, sourceB, ...])`) instead.
- **`=== function ... ===`** — see above.
- **Narration outside any knot** — every top-level line that isn't a `VAR`/`CONST` declaration is
  ignored, including a top-level `-> start` divert; a knot only ever runs when JS/TS explicitly starts
  it (`narration.call`/`jump`, an ink divert/call from another knot, or a choice).

### Differences from native ink — quick cheat-sheet

| Native ink (Inky) | Pixi'VN ink |
| --- | --- |
| `sword` and `items.sword` are equivalent list-entry references | Only `items.sword` (qualified) works |
| `<-` forks a Thread, merging choice lists from multiple sources | `<-` just **calls** a knot, like `-> knot ->` |
| `{ shuffle: - A - B }` shows exactly one line as its own paragraph | Multiple shuffled lines are joined into **one** dialogue block |
| A one-time choice attached to a weave is invalidated by *reaching* it via divert | Invalidated only by actually **selecting** the choice (see below) |
| `INCLUDE file.ink` | Ignored — use `inkGlob` / `importInkText([...])` |
| `=== function ... ===` runs in-language | Ignored — use a hashtag command or `StepLabelProps` |
| `CHOICE_COUNT`, `TURNS`, `TURNS_SINCE`, `SEED_RANDOM`, most `LIST_*()` | Not implemented yet |

The one-time-choice/weave interaction, worked through: given

```ink
-> start
=== start ===
* [1] -> shove
* (shove) [2] 2
* {shove} [3] -> END
- -> start
-> DONE
```

after choosing `1` once, revisiting `start`: **native ink** hides choice `2` (it treats reaching `shove`
via divert as equivalent to choosing it); **Pixi'VN ink** still offers both `2` and `3`. To get
native-ink parity, invalidate the choice explicitly: `* (shove) {!shove} [2] 2`.

## Related

- Every other `pixi-vn-ink-*` skill in this set (install together — see above).
- The `@drincs/pixi-vn` Agent Skills (`npx skills add DRincs-Productions/pixi-vn`) — `Game.init`, plain
  TS narration, canvas, sound, storage, characters, saves, UI. Ink content calls into the exact same
  APIs those skills document.
- [pixi-vn.com/ink](https://pixi-vn.com/ink) — the rendered version of this integration's docs.
- [inkle/ink](https://github.com/inkle/ink) and [inkjs](https://github.com/inkle/inkjs) — the language
  and the JS runtime this integration is built on.
