---
name: pixi-vn-ink-canvas
description: Use when an ink script needs to show, edit, remove, pause/resume, animate, shake, or clear canvas elements — images, image containers, video, or text — via hashtag commands like # show, # edit, # remove, # animate, # shake, and # clear canvas. Part of the pixi-vn-ink skill set — install alongside pixi-vn-ink-getting-started.
---

# Canvas from ink

Official docs: [pixi-vn.com/ink/canvas](https://pixi-vn.com/ink/canvas). Requires
`addBaseHashtagCommands()` to have run (its `canvas` section, on by default) — see
**pixi-vn-ink-getting-started**. Assumes [Pixi'VN canvas
components](https://pixi-vn.com/start/canvas-components) as a concept — this covers driving them from
ink, not the underlying JS/TS canvas API.

## When to use this skill

Use whenever an `.ink` file needs to put something on screen (a background, a character sprite, a
video, on-canvas text), change one of those elements' properties, remove it (with or without a
transition), run a `motion`-driven animation on it, trigger a shake/bounce effect, or clear the whole
canvas.

## Component types

Every command below targets one of: `image`, `imagecontainer` (a composite sprite built from several
layered textures — e.g. body + eyes + mouth), `video`, `text`, or (edit/remove only) the generic
`canvaselement`. All commands share the same shape:

```
# <verb> <component type> <alias> [<source>] [<key> <value> ...]
```

- **`alias`** identifies the element for every later command that touches it — wrap it in double
  quotes if it contains spaces (`"eggHead 2"`).
- **`source`** (show only, optional) — the asset alias or URL to use as the texture; defaults to
  `alias` itself if omitted, so `# show image eggHead` looks up an asset registered under the alias
  `eggHead`.
- Bare parameters are `key value` pairs, space-separated. A string value containing spaces needs double
  quotes; an object value needs valid, escaped JSON — escape both curly braces (`\{ ... \}`), since a
  bare `{`/`}` is ink's own interpolation syntax.

## Show

```ink
# show image eggHead x 20 y 20
# show image "eggHead 2" eggHead xAlign 1 yAlign 1
# show imagecontainer james [m01-body m01-eyes m01-mouth] xAlign 0.5 yAlign 1
# show video my_video xAlign 1 yAlign 0
# show text hello "Hello, this is a text" xAlign 0.5 yAlign 0.5 style \{ "fill": "red", "fontSize": 30 \}
```

`imagecontainer`'s `source` is a bracketed list of texture aliases/URLs (`[tex1 tex2 tex3]`), not a
single value. Parameters are the properties of `PixiVNJsonCanvasImageVideoShowProps` (image/video),
`PixiVNJsonCanvasImageContainerShowProps` (image container), or `PixiVNJsonCanvasTextShowProps` (text) —
all optional.

### With a transition

Append `with <transition type> [<transition parameters>]` to animate the element in:

```ink
# show eggHead with dissolve duration 3
temp durationVar = 3
# show eggHead eggHead2 with fade duration {durationVar}
# show flowerTop x 20 y 30 with movein direction left
# show helmlok x 20 y 30 with zoomin
# show skully x 20 y 30 with pushin
```

Transition types: `dissolve`, `fade`, `movein`, `zoomin`, `pushin` (their parameters correspond to
`ShowWithDissolveTransitionProps`, `ShowWithFadeTransitionProps`, `MoveInOutProps`, `ZoomInOutProps`,
`PushInOutProps` respectively — all optional). Transition parameter values can reference ink variables
with `{...}`, as in the `fade duration {durationVar}` example above.

## Edit

```ink
# edit image bg position \{ "x": 20, "y": 30 \} visible true cursor "pointer" alpha 0.5
# edit imagecontainer james alpha 0.8
# edit canvaselement bg alpha 0.5
# edit video my_video volume 0.5
# edit text hello text "New text"
```

`# edit <component type> <alias> [<key> <value> ...]` — property keys correspond to that component's
own memory-shape interface (`ImageSpriteMemory`, `ImageContainerMemory`, `VideoSpriteMemory`,
`TextMemory` — `canvaselement` uses a generic version of the same properties). No transition support
here; use `# animate` for a properties change that should tween smoothly instead of jump instantly.

## Remove

```ink
# remove image bg
# remove image "bg 2"
# remove imagecontainer james
# remove video my_video
# remove text hello
```

`# remove <component type> <alias>`. Add a transition the same way `show` does:

```ink
# remove image bg with dissolve duration 3
temp durationVar = 3
# remove image bg with fade duration {durationVar}
# remove image bg with moveout
# remove image bg with zoomout
# remove image bg with pushout
```

Transition types here: `dissolve`, `fade`, `moveout`, `zoomout`, `pushout` — same parameter interfaces
as `show`'s transitions, "in" swapped for "out".

## Clear the whole canvas

```ink
# clear canvas
```

Removes every element currently on the canvas in one command — no alias, no transition. Useful at a
scene boundary instead of individually removing every element that scene put up.

## Pause / resume (video)

```ink title="ink/start.ink"
=== start ===
# show video my_video
Video started
# pause video my_video
Video
Video paused
# resume video my_video
Video resumed
-> DONE
```

`# pause video <alias>` / `# resume video <alias>` — video playback only; this is distinct from
[`# pause`](../pause-continue/SKILL.md) (no alias, stops the *story* from auto-advancing) and from
[pausing a sound/channel](../sound/SKILL.md).

## Animate

```ink
# animate alien angle 360 options duration 1
# animate alien xAlign 1 yAlign 0 options ease "easeOut"
```

`# animate <alias> <keyframes> options <parameters>` — built on
[`canvas.animate`](https://pixi-vn.com/jsdoc/pixi-vn/index/interfaces/CanvasManagerInterface#animate).
**`keyframes`** (before the `options` keyword) is the *target* state to reach — properties from the same
memory-shape interfaces as `edit` (`ImageSpriteMemory`, `VideoSpriteMemory`, `ImageContainerMemory`,
`TextMemory`). **`options`** (after the `options` keyword) is *how* to get there — any
[`motion` animate option](https://motion.dev/docs/animate#options) (`duration`, `ease`, `type`,
`repeat`, `repeatDelay`, ...) plus the extras in `PixiVNJsonAnimateBaseOptions`.

```ink title="ink/start.ink"
=== start ===
# show alien
# animate alien angle 360 options duration 1 type "spring" repeat Infinity repeatDelay 0.2
# pause
-> DONE
```

Common patterns: move (`xAlign`/`yAlign` keyframes), rotate (`angle`), fade (`alpha`), zoom
(`scaleX`/`scaleY` toward `0`), mirror (`scaleX` toward `-1` then back to `1`).

## Shake (and other articulated animations)

```ink
# shake bg
# shake "bg 2" strength 20
```

`# shake <alias> [<key> <value> ...]` triggers the built-in
[`shakeEffect`](https://pixi-vn.com/jsdoc/pixi-vn/index/functions/shakeEffect) — a ready-made multi-step
`canvas.animate` sequence. Parameters are the properties of `ShakeEffectProps`, all optional. This is
the one built-in "articulated animation" hashtag command; a project can register more of its own the
same way (see **pixi-vn-ink-hashtag-commands**) if it has its own reusable multi-step effects.

## Related

- **pixi-vn-ink-assets** — loading the image/video/font assets these commands reference by alias,
  before showing them.
- **pixi-vn-ink-sound** — the equivalent command family for audio.
- **pixi-vn-ink-hashtag-commands** — registering a custom canvas-adjacent command of your own (e.g. a
  reusable multi-step effect like `# shake`).
- [pixi-vn.com/start/canvas-image](https://pixi-vn.com/start/canvas-image),
  [canvas-transition](https://pixi-vn.com/start/canvas-transition),
  [canvas-motion](https://pixi-vn.com/start/canvas-motion) — the JS/TS APIs these commands wrap.
