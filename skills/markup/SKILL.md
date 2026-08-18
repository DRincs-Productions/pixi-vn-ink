---
name: pixi-vn-ink-markup
description: Use when ink dialogue text needs bold/italic/links via Markdown, raw HTML, or Tailwind CSS classes, or when a symbol shared between Markdown and ink syntax (#, *, /, ~, -, |) needs escaping. Part of the pixi-vn-ink skill set — install alongside pixi-vn-ink-getting-started.
---

# Markup language and CSS in ink

Official docs: [pixi-vn.com/ink/markup](https://pixi-vn.com/ink/markup). Assumes a
[markup renderer](https://pixi-vn.com/start/markup) is wired up in the project — Pixi'VN itself does not
render any markup; this only covers writing ink text that such a renderer will style correctly.

## When to use this skill

Use whenever dialogue text needs emphasis, links, or custom styling, or whenever an ink line that
should render literal Markdown-looking characters (a `#`, `*`, `-`, ...) is being swallowed/misparsed by
the ink compiler instead.

## Markdown is the recommended choice

Pixi'VN has no built-in markup renderer for `narration.dialogue` — Markdown is the recommended one, and
every official template already renders dialogue this way (React template: `react-markdown` with
`remark-gfm` for GFM tables/strikethrough and `rehype-raw` to also allow raw HTML inside the Markdown
source):

```tsx
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

<Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
  {narration.dialogue?.text}
</Markdown>;
```

Default to Markdown's plain inline styles in ink text:

```ink
Hello, this is some *italic* text and this is some **bold** text.
```

## Escaping symbols ink and Markdown both use

`#`, `*`, `/`, `~`, `-`, `|` all mean something to **ink**'s own parser (tags, choices, comments,
shuffles, gathers/lists, alternatives) *before* the text ever reaches a Markdown renderer. Escape the
Markdown-intended symbol with `\` wherever ink would otherwise misparse it:

```ink
\# Markdown Test
\#\# Bold Text
\**This is bold text.**
\#\# Delete Text
\~~This is deleted text.~~
\#\# List Test
\- Item 1
\* Item 2
```

The escaped source above renders, once the Markdown pass runs, as ordinary `# Markdown Test`,
`## Bold Text`, `**This is bold text.**`, etc. — the backslash is stripped by ink before Markdown ever
sees the line, so from the renderer's point of view the symbols were always plain Markdown syntax.
Plain dialogue with a single inline `*italic*`/`**bold**` (as in the example above) is usually
unambiguous and doesn't need escaping — escape only where the ink parser is actually about to
misinterpret the symbol (e.g. a line that would otherwise look like a choice bullet or a tag).

## New lines

Ink already breaks a line per line of source; to force an explicit line break **inside** one logical
line of dialogue text, use `\n` — doubled to `\n\n` if the Markdown renderer needs a blank line to
actually start a new paragraph rather than a soft break:

```ink
Hello, this is a test. \n\n This is a new line.
```

## Raw HTML and Tailwind CSS

With `rehype-raw` (or an equivalent) enabled, raw HTML works directly in dialogue text, and Tailwind CSS
utility classes can style it:

```ink
<span class="inline-block text-blue-500">some *blue* text</span>.
<span class="inline-block animate-pulse text-violet-400">still</span>.
```

**Any element using a `transform`/animation utility must be `inline-block`, not `inline`** — a plain
`inline` element silently ignores `transform`-based utilities mid-paragraph. Only reach for raw HTML/CSS
when actually asked for something Markdown itself can't express (a specific color, an animation, a
persistent underline) — default to Markdown's own inline syntax otherwise.

## Related

- **pixi-vn-ink-getting-started** — installation and general ink/Pixi'VN vocabulary.
- [pixi-vn.com/start/markup](https://pixi-vn.com/start/markup),
  [markup-markdown](https://pixi-vn.com/start/markup-markdown),
  [markup-tailwindcss](https://pixi-vn.com/start/markup-tailwindcss) — the JS/TS side of wiring up a
  renderer in the first place.
