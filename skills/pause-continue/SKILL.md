---
name: pixi-vn-ink-pause-continue
description: Use when an ink script needs to hold on a canvas/sound change without printing dialogue (# pause), or needs to show a line of dialogue and its choice menu together in a single step (<># continue). Part of the pixi-vn-ink skill set — install alongside pixi-vn-ink-getting-started.
---

# Pause and continue

Official docs: [pixi-vn.com/ink/other-narrative-features](https://pixi-vn.com/ink/other-narrative-features).
Requires `addBaseHashtagCommands()` to have run (its `narration` section, on by default) — see
**pixi-vn-ink-getting-started**.

## When to use this skill

Use whenever a step needs to change something on screen (show an image, play a sound, edit a canvas
element) **without** immediately also advancing to dialogue text on the very next player input, or
whenever a line of dialogue and the choice menu that follows it should appear as a single beat instead
of two.

## `# pause`

After any `#` hashtag command runs, the engine performs a
[`continue`](https://pixi-vn.com/start/labels-flow#continue) into the next step automatically. That's
usually what you want — but it means a step that *only* changes the canvas/sound state, with no
dialogue of its own, immediately falls through into whatever the next step shows:

```ink title="ink/start.ink"
=== start ===
# show image alien eggHead
Hello, world!     // shown immediately — no chance to look at the image alone first
-> DONE
```

`# pause` stops that automatic advance: it clears the current dialogue and waits for the player to
continue before moving on, so a scene-setting step reads as its own beat:

```ink title="ink/start.ink"
=== start ===
# show image alien eggHead
# pause
Hello, world!
-> DONE
```

Internally, `# pause` returns a `dialogue`/`clean` operation and clears the step's own `dialogue` /
`goNextStep` fields — it's a hashtag command like any other, registered by
`addBaseHashtagCommands()`'s `narration` section (see **pixi-vn-ink-hashtag-commands**), not special
ink syntax.

## `<># continue`

By default, a line of dialogue followed by a choice menu takes **two** steps: the first shows only the
dialogue, the second shows the dialogue *plus* the choices.

```ink title="ink/start.ink"
=== start ===
Who are we going to rescue: the kitten or the wizard?
* [the kitten] -> DONE
* [the wizard] -> DONE
```

Appending `<># continue` to the dialogue line collapses that into a single step — the dialogue and its
choice menu appear together, skipping the extra "just the text" beat:

```ink title="ink/start.ink"
=== start ===
Who are we going to rescue: the kitten or the wizard?<># continue
* [the kitten] -> DONE
* [the wizard] -> DONE
```

`<>` is plain ink glue (no line break before what follows); `# continue` is the hashtag command that
forces the story to advance to the next step automatically (it sets `goNextStep = true` and disables
glue) — the combination is what produces "dialogue and choices in one step" rather than two separate
mechanisms.

## Related

- **pixi-vn-ink-hashtag-commands** — `# pause`/`# continue` are ordinary hashtag commands, not special
  syntax; this is where to look to register a similar one-off flow-control command of your own.
- **pixi-vn-ink-getting-started** — "Diverting in the same step", the closely related native-ink
  glue/timing rule for diverts specifically.
- [pixi-vn.com/start/labels-flow](https://pixi-vn.com/start/labels-flow) — the underlying
  `narration.continue`/`canContinue` mechanics these commands manipulate.
