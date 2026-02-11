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
