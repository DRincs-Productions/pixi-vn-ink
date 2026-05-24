# Ink Language Integration

![pixi-vn-cover-ink](https://github.com/user-attachments/assets/cc96d260-d909-4fa4-834e-85e4405b6dd1)

<p align="center">
  <a href="https://www.npmjs.com/package/@drincs/pixi-vn-ink" rel="noopener noreferrer nofollow"><img src="https://img.shields.io/npm/v/@drincs/pixi-vn-ink?label=version" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@drincs/pixi-vn-ink" rel="noopener noreferrer nofollow"><img src="https://img.shields.io/npm/dm/@drincs/pixi-vn-ink" alt="npm downloads per month"></a>
  <a target="_blank" href="https://www.jsdelivr.com/package/npm/@drincs/pixi-vn-ink" rel="noopener noreferrer nofollow"><img alt="jsDelivr hits (npm)" src="https://img.shields.io/jsdelivr/npm/hm/@drincs/pixi-vn-ink?logo=jsdeliver"></a>
  <a href="https://www.npmjs.com/package/@drincs/pixi-vn-ink" rel="noopener noreferrer nofollow"><img alt="NPM License" src="https://img.shields.io/npm/l/@drincs/pixi-vn-ink"></a>
  <a target="_blank" href="https://discord.gg/E95FZWakzp" rel="noopener noreferrer nofollow"><img alt="Discord" src="https://img.shields.io/discord/1263071210011496501?color=7289da&label=discord"></a>
</p>

Pixi’VN gives you the ability to write your own narrative using **_ink_**, a scripting language for writing interactive narrative.

The **_ink_ + Pixi’VN integration**, exploits the [inkjs](https://github.com/inkle/inkjs) and [PixiVNJson](https://github.com/DRincs-Productions/pixi-vn-json) libraries, to parse **_ink_ code** and generate a Json that can be interpreted by Pixi’VN. So Javascript/Typescript and **_ink_** share the same storage and canvas, and it is also possible to launch **_ink_** labels (or knots) from Javascript/Typescript and vice versa. This allows you to use the best of both languages. You can use **_ink_** to write the narration, while using Javascript/Typescript to create minigames or complex animations.

**What is _ink_?**

**_ink_** is a scripting language for writing interactive narrative. It is used in games like 80 Days, Heaven's Vault, and Sorcery! to create branching stories.

This language is very simple to learn. Go on [_ink_ website](https://www.inklestudios.com/ink/) to learn more about it.

## Why use _ink_ integration?

Programming a game narrative in **Javascript/Typescript** has the advantage of having total development freedom, but the disadvantage is that it slows down the writing of a narrative (it makes you write a lot of code).

## Installation

To install the package, run the following command in your project:

```npm
npm install @drincs/pixi-vn-ink
```

## Start using _ink_ in Pixi’VN

If you have not created a project yet then it is recommended to use the [template](https://pixi-vn.web.app/start/getting-started.html#project-initialization) to start your project with **_ink_**.

After installing the package you need to use the `importInkText()` function to import the **_ink_ script** into your project.

```ts title="main.ts"
import { narration } from "@drincs/pixi-vn";
import { importInkText } from '@drincs/pixi-vn-ink'

importInkText([inkText, ...])
narration.callLabel(`start`, {});
```

```ink title="ink/story.ink"
=== start ===
Hello, world!
-> END
```

```ts tab="ink.d.ts"
declare module "*.ink" {
  const value: string;
  export default value;
}
```
