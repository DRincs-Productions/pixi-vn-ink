---
name: pixi-vn-ink-sound
description: Use when an ink script needs to play, pause, resume, edit, or stop a sound/music track or an audio channel via hashtag commands like # play sound, # pause sound, # edit sound, and # stop sound. Part of the pixi-vn-ink skill set — install alongside pixi-vn-ink-getting-started.
---

# Sounds and music from ink

Official docs: [pixi-vn.com/ink/sound](https://pixi-vn.com/ink/sound). Requires
`addBaseHashtagCommands()` to have run (its `sound` section, on by default) — see
**pixi-vn-ink-getting-started**. Assumes [Pixi'VN sound
channels](https://pixi-vn.com/start/sound) are already set up (e.g. a `bgm` and an `sfx` channel via
`sound.addChannel`).

## When to use this skill

Use whenever an `.ink` file needs to start background music or a sound effect, pause/resume/stop it (or
an entire channel, or every sound at once), or tweak a playing sound's properties (volume, loop, ...).

## Play

```ink
# play sound sfx_whoosh delay 0.1
# play sound bgm_cheerful loop true channel bgm
# play sound sfx_whoosh volume 100
```

`# play sound <alias> [<source>] [<key> <value> ...]` — `alias` identifies the sound for every later
command; `source` (optional) is the asset alias/URL to play, defaulting to `alias` itself if omitted.
Parameters are the properties of `PixiVNJsonSoundPlayProps` — `channel` (which registered channel to
play through), `loop`, `volume`, `delay`, and others, all optional.

## Pause / resume

```ink
# pause sound bgm_cheerful
# pause channel bgm
# resume sound bgm_cheerful
# resume channel bgm
```

`# pause <sound|channel> <alias>` / `# resume <sound|channel> <alias>` — `sound` pauses/resumes one
specific playing sound by its alias; `channel` pauses/resumes every sound currently playing through that
channel at once.

To pause or resume literally everything regardless of channel:

```ink
# pause all sounds
# resume all sounds
```

## Edit

```ink
# edit sound bgm_cheerful volume 50
# edit sound bgm_cheerful loop false
```

`# edit sound <alias> [<key> <value> ...]` — properties are `PixiVNJsonSoundEditProps`, applied to the
already-playing sound identified by `alias` (volume, loop, and other runtime-adjustable properties).

## Stop

```ink
# stop sound bgm_cheerful
# stop all sounds
```

`# stop sound <alias>` stops (and discards) one sound; `# stop all sounds` stops every sound at once.
`# remove sound <alias>` is a **deprecated** alias for `# stop sound <alias>` — prefer `stop`.

## Complete example

```ink title="ink/start.ink"
# play sound sfx_whoosh delay 0.1
# play sound bgm_cheerful loop true channel bgm
Hello, I'm a cheerful background music that will loop forever until you stop me.
# pause sound bgm_cheerful
I'm paused, but I can be resumed.
# resume sound bgm_cheerful
I'm back!
```

## Related

- **pixi-vn-ink-assets** — loading/registering the audio files these commands reference by alias.
- **pixi-vn-ink-canvas** — the equivalent command family for the canvas.
- [pixi-vn.com/start/sound](https://pixi-vn.com/start/sound) — the underlying JS/TS `sound` API and
  channel setup these commands wrap.
