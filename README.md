# Ink Language Integration

![pixi-vn-logo-ink](https://github.com/user-attachments/assets/c36250b2-4e3c-4069-8daa-706394febde4)

Pixi’VN gives you the ability to write your own narrative using Ink.

## What is ink?

Ink is a scripting language for writing interactive narrative. It is used in games like 80 Days, Heaven's Vault, and Sorcery! to create branching stories.

This language is very simple to learn, you can learn the basics in a few minutes. Go on [ink website](https://www.inklestudios.com/ink/) to learn more about it.

## Why use Ink integration?

Programming a game narrative in **Javascript/Typescript** has the advantage of having total development freedom, but the disadvantage is that it slows down the writing of a narrative (it makes you write a lot of code).

**Ink** is a language that allows you to write a narrative easily, without having to write a lot of code. Plus, it only takes you about ten minutes to learn the basic functions. Ink is basically designed only for writing narratives, so it doesn't require a canvas or other features outside of narrative.

Launching narrative labels (or knots) from Javascript/Typescript to Ink sharing the same memory and canvas is a double benefit. You can use Ink to write the narration, while using Javascript/Typescript to handle everything that is not possible with Ink.

Furthermore, novice developers can use a template to start writing narratives with Ink. After becoming familiar with Javascript/Typescript they can start to create more laborious features, like minigames or complex animations.

## Start using Ink in Pixi’VN

If you have not created a project yet then it is recommended to use the [template](https://pixi-vn.web.app/start/getting-started.html#project-initialization) and select a template that is based on ink.

Otherwise to add ink to your Pixi’VN project you need to install the `@drincs/pixi-vn-ink` package.

```bash
# npm
npm install @drincs/pixi-vn-ink

# yarn
yarn add @drincs/pixi-vn-ink

# pnpm
pnpm add @drincs/pixi-vn-ink

# bun
bun add @drincs/pixi-vn-ink
```

After installing the package you need to import the `importInkText()` function from the package and use it to import the ink script into your project.

```typescript
// main.ts
import { importInkText } from '@drincs/pixi-vn-ink'

const inkText = `
=== start ===
Hello
-> END
`

importInkText([inkText, ...])
```

Now you can run the `start` knot (or label) with [Pixi’VN functions](https://pixi-vn.web.app/start/labels.html#run-a-label).

```typescript
narration.callLabel(`start`, {})
```

### Import text contained in .ink files

( This method has been tested only on projects generated with vitejs )

To import text contained in .ink files you need create the file `ink.d.ts`:

```typescript
// src/ink.d.ts
declare module '*.ink' {
    const value: string
    export default value
}

```

After that you need to add the `.ink` extension to the `assetsInclude` option in the `vite.config.ts` file:

```typescript
// vite.config.ts
export default defineConfig({
  // ...
  assetsInclude: ['**/*.ink'],
})
```

After that you can import the ink file and add `?raw` at the end of the import to get the text content.

```typescript
// main.ts
import { importInkText } from '@drincs/pixi-vn-ink'
import startLabel from './ink_labels/start.ink?raw'

importInkText([startLabel, ...])
```

## Ink features in development

The following features are in development and will be added in the future:

( Add a like or comment to the issue to show your interest in the feature )

* [Functions and Game Queries](https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#9-game-queries-and-functions) (issue [#11](https://github.com/DRincs-Productions/pixi-vn-ink/issues/11)):
  * [User-created functions](https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#5-functions) (issue [#32](https://github.com/DRincs-Productions/pixi-vn-ink/issues/32))
  * `CHOICE_COUNT()`
  * `TURNS()`
  * `TURNS_SINCE()`
  * `SEED_RANDOM()`
* [`LIST`](https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#1-basic-lists) (issue [#15](https://github.com/DRincs-Productions/pixi-vn-ink/issues/15))
* [`Tunnels`](https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#1-tunnels) (issue [#38](https://github.com/DRincs-Productions/pixi-vn-ink/issues/38))
* [`Threads`](https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#2-threads) (issue [#39](https://github.com/DRincs-Productions/pixi-vn-ink/issues/39))

## Ink syntax that will be ignored by Pixi’VN

The following syntax will be ignored by Pixi’VN (They will not create errors).

### INCLUDE

`INCLUDE` is used by Ink to import other ink files.

In Pixi’VN you can use the `importInkText()` function to import the ink files. So if you use `INCLUDE` it will not be handled, so it does not import the files.

### Narration outside the knots

The narration outside the knots (or labels) will be ignored.
The reason is that as explained by Pixi’VN you can't start a whole ink file, but you have to use this [functions](https://pixi-vn.web.app/start/labels.html#run-a-label) for run a knot (or label).

So for example the following cases will be ignored:

```ink
Hello # ❌ This will be ignored
-> start # ❌ This will be ignored
=== start === # ✅ This will be handled
My name is John # ✅ This will be handled
-> DONE # ✅ This will be handled
```

## Using Pixi’VN Features from Ink

* [Use Character in ink](https://pixi-vn.web.app/ink/ink-character.html)
* [Style Text on Ink + Pixi’VN](https://pixi-vn.web.app/ink/ink-markdown.html)
* [Use PixiJS Canvas in Ink](https://pixi-vn.web.app/ink/ink-canvas.html)
* [Use Sounds and Music in Ink](https://pixi-vn.web.app/ink/ink-sound.html)
* [Use input in Ink](https://pixi-vn.web.app/ink/ink-input.html)
