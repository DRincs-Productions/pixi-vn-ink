---
name: pixi-vn-ink-assets
description: Use when an ink script needs to load or lazy-load images, audio, video, or an asset bundle before/while a knot runs, via # load and # lazyload. Part of the pixi-vn-ink skill set — install alongside pixi-vn-ink-getting-started.
---

# Assets from ink

Official docs: [pixi-vn.com/ink/assets](https://pixi-vn.com/ink/assets). Requires
`addBaseHashtagCommands()` to have run (its `assets` section, on by default) — see
**pixi-vn-ink-getting-started**. Assumes the [asset
manifest](https://pixi-vn.com/start/assets-management#initialize-the-asset-matrix-at-project-start) is
already initialized in JS/TS — this only covers triggering a load from ink.

## When to use this skill

Use whenever a knot needs to guarantee an image/video/audio asset (or a whole bundle) is loaded before
showing it, or wants to start loading something in the background without blocking the current step
(e.g. pre-warming the next scene's assets while the current one plays).

## Load (blocking)

```ink
# load assets eggHead flowerTop
# load bundle main_menu
```

`# load <assets|bundle> <alias...>` — awaited before the label continues to its next step.
`assets` loads with `Assets.load`; `bundle` loads with `Assets.loadBundle`. The alias list is
space-separated; each entry is either an asset alias/URL (`assets`) or a bundle name (`bundle`), from
the manifest initialized in JS/TS.

## Lazyload (background)

```ink
# lazyload bundle main_menu
# lazyload assets my_video
```

Same syntax, but `assets`/`bundle` load in the background (`Assets.backgroundLoad` /
`Assets.backgroundLoadBundle`) — the current step does **not** wait for it. Use this to start loading
what a *later* scene will need while the player is still reading the current one.

## Restricting to known ids

`addBaseHashtagCommands({ bundleIds, assetAliasIds })` — passing `bundleIds`/`assetAliasIds` (typically
the arrays [`vitePluginPixivn`'s `typeFilePath` generates](https://pixi-vn.com/start#the-vite-plugin-drincspixi-vnvite))
makes `# load`/`# lazyload` validate the alias against that known list at parse time instead of
accepting any string — a typo'd alias then surfaces as an "unknown hashtag command" warning in the Vite
dev-server log (see **pixi-vn-ink-getting-started**) instead of failing silently or only at runtime.

```ts title="content/ink/hashtag-commands.ts"
import { assetAliasIds, bundleIds } from "@/pixi-vn.keys.gen";
import { addBaseHashtagCommands } from "@drincs/pixi-vn-ink";

addBaseHashtagCommands({ bundleIds, assetAliasIds });
```

## Escaping URLs

`//` starts a comment in ink, so a literal `https://` inside a hashtag command must be escaped as
`https:\/\/` — otherwise everything after `//` on that line is silently dropped:

```ink
# load assets https:\/\/raw.githubusercontent.com\/example\/repo\/refs\/heads\/main\/bg.png
```

Prefer registering the asset under an alias in the manifest and referencing that alias from ink instead
of inlining a raw URL — it sidesteps the escaping entirely and matches every official template.

## Complete example

```ink title="ink/start.ink"
=== start ===
# lazyload bundle main_menu start
# load assets eggHead flowerTop my_video
# show image eggHead
# show image flowerTop
# show video my_video
# pause
-> start
```

```ts title="src/assets/index.ts"
import generatedManifestJson from "@/assets/manifest.gen.json";
import type { AssetsManifest } from "@drincs/pixi-vn";

export const manifest: AssetsManifest = {
  bundles: [
    ...generatedManifestJson.bundles,
    { name: "main_menu", assets: [{ alias: "background_main_menu", src: "..." }] },
    { name: "start", assets: [{ alias: "bg01-hallway", src: "..." }] },
    {
      name: "images",
      assets: [
        { alias: "eggHead", src: "..." },
        { alias: "flowerTop", src: "..." },
      ],
    },
  ],
};
```

## Related

- **pixi-vn-ink-canvas** and **pixi-vn-ink-sound** — showing/playing the assets loaded here.
- [pixi-vn.com/start/assets-management](https://pixi-vn.com/start/assets-management) — initializing the
  manifest in JS/TS, bundles vs. individual assets, and the full loading-strategy discussion.
