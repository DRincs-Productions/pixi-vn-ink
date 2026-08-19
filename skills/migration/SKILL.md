---
name: pixi-vn-ink-migration
description: Use when upgrading an existing @drincs/pixi-vn-ink project to a newer version, or when a hashtag command that used to work silently stops firing after an upgrade. Covers every breaking change between versions with before/after code.
---

# Pixi'VN ink migration guide

Official docs: [pixi-vn.com/faq/migration](https://pixi-vn.com/faq/migration). That page also covers the
separate `@drincs/pixi-vn` and `nqtr` packages (its `## pixi-vn` and `## nqtr` sections) — this skill
only covers the `## pixi-vn-ink` section, since that's what this skill set documents.

## When to use this skill

Use this skill whenever a task is "upgrade this project's `@drincs/pixi-vn-ink` from version X to the
latest", or a developer reports that ink hashtag commands (`# show`, `# play sound`, ...) that used to
work now silently do nothing after a dependency bump. Check the currently installed version first
(`package.json` dependency, or the `version` field returned by the Vite dev-server's
`GET /__pixi-vn-ink/info` endpoint at runtime — see **pixi-vn-ink-getting-started**), then walk forward
through only the version sections below that fall between the installed version and the target — most
of these changes don't apply unless a project is crossing that specific boundary.

## v1.0.x → v1.1.0 — base hashtag commands are no longer automatic

Before this release, importing `@drincs/pixi-vn-ink` registered every built-in
[hashtag command](../hashtag-commands/SKILL.md) (`# show`, `# play sound`, `# load`, `# request input`,
...) as a side effect. As of v1.1.0, **nothing is registered until you call it explicitly**:

```ts title="content/ink/hashtag-commands.ts"
import { addBaseHashtagCommands } from "@drincs/pixi-vn-ink"; // [!code ++]

addBaseHashtagCommands(); // [!code ++]
```

Call it once, near the start of the app, before any ink content is parsed (every official template
already does this). Symptom if this step is missed after upgrading: every built-in `#` command in
existing `.ink` files silently does nothing at runtime, and the Vite dev server logs each one as an
**unknown hashtag command** (see **pixi-vn-ink-getting-started**'s debugging section) — that log output
is the fastest way to confirm this is the cause.

`addBaseHashtagCommands` also gained optional configuration in this same generation (`bundleIds`/
`assetAliasIds` for strict `# load`/`# lazyload` validation, and `sections` to opt out of a whole
built-in group) — see **pixi-vn-ink-hashtag-commands** and **pixi-vn-ink-assets** for current usage;
passing no options at all preserves the pre-v1.1.0 behavior of registering every built-in command.

## Related skills

- **pixi-vn-ink-getting-started** — current installation, the Vite plugin, and the dev-server
  debugging workflow (logs + `GET /__pixi-vn-ink/*` endpoints) referenced above.
- **pixi-vn-ink-hashtag-commands** — current `addBaseHashtagCommands`/`HashtagCommands` API.
- **pixi-vn-ink-assets** — current `bundleIds`/`assetAliasIds` validation option.
