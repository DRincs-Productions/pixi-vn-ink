# Ink Language Integration

![pixi-vn-cover-ink](https://github.com/user-attachments/assets/cc96d260-d909-4fa4-834e-85e4405b6dd1)

Pixi’VN gives you the ability to write your own narrative using ***ink***, a scripting language for writing interactive narrative.

The ***ink* + Pixi’VN integration**, exploits the [inkjs](https://github.com/inkle/inkjs) and [PixiVNJson](https://pixi-vn.web.app/advanced/pixi-vn-json) libraries, to parse ***ink* code** and generate a Json that can be interpreted by Pixi’VN. So Javascript/Typescript and ***ink*** share the same storage and canvas, and it is also possible to launch ***ink*** labels (or knots) from Javascript/Typescript and vice versa. This allows you to use the best of both languages. You can use ***ink*** to write the narration, while using Javascript/Typescript to create minigames or complex animations.

**What is *ink*?**

***ink*** is a scripting language for writing interactive narrative. It is used in games like 80 Days, Heaven's Vault, and Sorcery! to create branching stories.

This language is very simple to learn. Go on [*ink* website](https://www.inklestudios.com/ink/) to learn more about it.

## Why use *ink* integration?

Programming a game narrative in **Javascript/Typescript** has the advantage of having total development freedom, but the disadvantage is that it slows down the writing of a narrative (it makes you write a lot of code).

The novice developers can use a [*ink* template](https://pixi-vn.web.app/start/getting-started.html#project-initialization) to start developing just with ***ink***, and then gradually learn Javascript/Typescript to create more complex features.

## Start using *ink* in Pixi’VN

If you have not created a project yet then it is recommended to use the [template](https://pixi-vn.web.app/start/getting-started.html#project-initialization) to start your project with ***ink***.

Otherwise to add ***ink*** to your Pixi’VN project you need to install the `@drincs/pixi-vn-ink` package.

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

After installing the package you need to use the `importInkText()` function to import the ***ink* script** into your project.

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

Now you can run the ***ink* knot** (or label) with [Pixi’VN functions](https://pixi-vn.web.app/start/labels.html#run-a-label).

```typescript
import { narration } from '@drincs/pixi-vn'

narration.callLabel(`start`, {})
```

### Import text contained in .ink files

For this guide we will use the [Vite](https://vitejs.dev/) project, but you can use the same logic in other projects.

To import text contained in `.ink` files you need create the file `ink.d.ts` to declare the module `*.ink`.

```typescript
// src/ink.d.ts
declare module '*.ink' {
    const value: string
    export default value
}
```

After that you need to add the `.ink` extension to the `assetsInclude` option in the `vite.config.ts` file.

```typescript
// vite.config.ts
export default defineConfig({
  // ...
  assetsInclude: ['**/*.ink'],
})
```

After that you can import the *ink* file and add `?raw` at the end of the import to get the text content.

```typescript
// main.ts
import { importInkText } from '@drincs/pixi-vn-ink'
import startLabel from './ink_labels/start.ink?raw'

importInkText([startLabel, ...])
```

## *ink* features in development

The following features are in development and will be added in the future:

( Add a like or comment to the issue to show your interest )

* [Functions and Game Queries](https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#9-game-queries-and-functions) (issue [#11](https://github.com/DRincs-Productions/pixi-vn-ink/issues/11)):
  * [User-created functions](https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#5-functions) (issue [#32](https://github.com/DRincs-Productions/pixi-vn-ink/issues/32))
  * `CHOICE_COUNT()`
  * `TURNS()`
  * `TURNS_SINCE()`
  * `SEED_RANDOM()`
* [`LIST`](https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#1-basic-lists) (issue [#15](https://github.com/DRincs-Productions/pixi-vn-ink/issues/15))
* [`Tunnels`](https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md#1-tunnels) (issue [#38](https://github.com/DRincs-Productions/pixi-vn-ink/issues/38))

## *ink* syntax that will be ignored by Pixi’VN

The following syntax will be ignored by Pixi’VN. You can use them in your ***ink* script** ( For example if you want test your script with **Inky editor** ), but they will be ignored by Pixi’VN.

### INCLUDE

`INCLUDE` is used by ***ink*** to import other ***ink* files**.

In Pixi’VN you can use the `importInkText()` function to import the ***ink* files**. So if you use `INCLUDE` it will not be handled, so it does not import the files.

### Narration outside the knots

The narration outside the knots (or labels) will be ignored, except for variables. The reason is that you must run the first knot (or label) with the [Pixi’VN functions](https://pixi-vn.web.app/start/labels.html#run-a-label).

So for example the following cases will be ignored:

```ink
VAR my_var = false // ✅ This will be handled (because it is a variable)
Hello // ❌ This will be ignored
-> start // ❌ This will be ignored
=== start === // ✅ This will be handled
My name is John // ✅ This will be handled
-> DONE // ✅ This will be handled
```

## Differences between native *ink* and Pixi’VN *ink*

* in this case:

    ```ink
    { shuffle:
      -  2 of Diamonds.
        'You lose this time!' crowed the croupier.
    }
    ```

    **In native *ink***, you will see 2 different dialogues, the first one will be `2 of Diamonds.` and the second one will be `'You lose this time!' crowed the croupier.`.

    **In Pixi’VN *ink***, you will not see 2 different dialogues, but the following dialogue: `2 of Diamonds.\n\n'You lose this time!' crowed the croupier.`. In [Markdown](/ink/ink-markdown.md) it will be displayed as:

    ```txt
    2 of Diamonds.
    'You lose this time!' crowed the croupier.
    ```

* if a `weave` (In following example `shove`) is attached to a one time choice, and it is opened with `-> shove` it will not invalidate the one time choice. To invalidate it you will have to select the choice as usual.

    Here is an example:

    ```ink
    -> start
    === start ===
    * [1] -> shove
    * (shove) [2] 2
    * {shove} [3] -> END
    -  -> start
    -> DONE
    ```

    In case you take choice 1, the second time it will be opened `start`:
  * if you use **native *ink***, you will only be able to choose choice `3`. The choice `2` is hidden because being "one time" **native *ink*** will know that you have already made this decision with `-> shove`.
  * if you use **Pixi’VN *ink***, you will be able to choose choice `2` or `3`. The choice `2` is not hidden because **Pixi’VN *ink*** doesn't know that `shove` is paired with a choice.

  To get the same logic as `start` both in **native *ink*** and **Pixi’VN *ink*** you will have to write the following code:

  ```ink
  -> start
  === start ===
  * [1] -> shove
  * (shove) {!shove} [2] 2
  * {shove} [3] -> END
  -  -> start
  -> DONE
  ```

## Using Pixi’VN Features from *ink*

* [Use Character in *ink*](https://pixi-vn.web.app/ink/ink-character)
* [*ink* knot (or label)](https://pixi-vn.web.app/ink/ink-label)
* [*ink* variables](https://pixi-vn.web.app/ink/ink-variables)
* [*ink* text style](https://pixi-vn.web.app/ink/ink-markdown)
* [Use canvas in *ink*](https://pixi-vn.web.app/ink/ink-canvas)
* [Using sounds and music in *ink*](https://pixi-vn.web.app/ink/ink-sound)
* [Using pause in *ink*](https://pixi-vn.web.app/ink/ink-pause)
* [Use input in *ink*](https://pixi-vn.web.app/ink/ink-input)
* [How translate *ink* text](https://pixi-vn.web.app/ink/ink-translate)
* [Custome Hashtag Script](https://pixi-vn.web.app/ink/ink-hashtag)
