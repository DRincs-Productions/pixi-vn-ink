---
name: pixi-vn-ink-input
description: Use when an ink script needs to prompt the player for text, numeric, or HTML input with # request input, or read the entered value back into the narration. Part of the pixi-vn-ink skill set — install alongside pixi-vn-ink-getting-started.
---

# Input prompts in ink

Official docs: [pixi-vn.com/ink/input](https://pixi-vn.com/ink/input). Requires
`addBaseHashtagCommands()` to have run (its `narration` section, on by default) — see
**pixi-vn-ink-getting-started**.

## When to use this skill

Use whenever a scene needs the player to type or pick a value — a character's name, an age, a longer
free-text answer — and have the story react to it afterward.

## Requesting input

```ink
# request input
# request input type string
# request input type number default 18
# request input type "html textarea"
```

`# request input [<key> <value> ...]` — with no parameters, requests plain text input with no
constraints. Recognized parameters (both optional):

- `type` — `string` (default), `number`, or `"html textarea"` (quote it — it contains a space).
- `default` — a default value pre-filled/returned if the player submits nothing.

This blocks `narration.canContinue` — the UI must resolve the prompt (via whatever input component your
project renders) before the story advances to the next step; there is no timeout or fallback built in.

## Reading the value back

The submitted value is written into storage under the system key `_input_value_`, so ink can read it
with the ordinary `{...}` interpolation syntax in the very next step:

```ink title="ink/start.ink"
=== start ===
Hello,
# request input type string
<>what is your name?
My name is { _input_value_ }
# request input type number default 18
How old are you?
I am { _input_value_ } years old
# request input type "html textarea"
Describe who you are:
{ _input_value_ }
-> DONE
```

`_input_value_` is overwritten by each new `# request input` — read it (or copy it into a `VAR` you
control) before the next prompt overwrites it if the value needs to survive longer than one step.

## Related

- **pixi-vn-ink-getting-started** — the hashtag-command mechanism this is built on, and the storage
  model `_input_value_` lives in.
- **pixi-vn-ink-characters** — combine with `# rename mc {_input_value_}` to let the player name a
  character.
- [pixi-vn.com/start/input](https://pixi-vn.com/start/input) — the underlying JS/TS
  `narration.requestInput` API and how a UI component resolves a pending prompt.
