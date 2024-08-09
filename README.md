# Pixi'VN + Ink Language

Pixi'VN gives you the ability to write your own narrative using Ink.

## What is ink?

Ink is a scripting language for writing interactive narrative. It is used in games like 80 Days, Heaven's Vault, and Sorcery! to create branching stories.

This language is very simple to learn, you can learn the basics in a few minutes. Go on [ink website](https://www.inklestudios.com/ink/) to learn more about it.

## Start using Ink in Pixi'VN

If you have not created a project yet then it is recommended to use the [template](/start/getting-started.md#project-initialization) and select a template that is based on ink.

Otherwise to add ink to your Pixi'VN project you need to install the `@drincs/pixi-vn-ink` package.

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

Now you can run the `start` knot (or label) with [Pixi'VN functions](/start/labels.md#run-a-label).

```typescript
GameStepManager.callLabel(`start`, {})
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

After that you can import the ink file in your project:

```typescript
// main.ts
import { importInkText } from '@drincs/pixi-vn-ink'
import mainInk from './main-ink.ink'

importInkText([mainInk, ...])
```
