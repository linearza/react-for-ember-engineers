# Course page source

`course/index.html` is the deliverable: one self-contained file, no build step needed to use it.
These modules generate it from structured content (so code samples are escaped mechanically):

```sh
pnpm build:course
```

- `week1.mjs` … `week3.mjs`: days, concepts (each with exactly one 🟢/🟡/🔴 flag), exercise briefs, self-check questions, final review, cheat sheet
- `quiz.mjs`: multiple-choice options for each day's Check yourself quiz (the build checks they match the drill)
- `model.mjs`: content helpers and a tiny inline-markdown renderer
- `build.mjs`: page template, CSS and JS (progress, quiz hi-scores and the reading bar, all in localStorage and guarded with try/catch). Under `pnpm start` it also renders the live test list and, for days with a `src/play/dayNN.tsx`, embeds that day's playground
- `scenery.mjs`: the pixel-art landscape banner at the top of the page (still scenery, moving cast, day/night from the theme)
- `logo.mjs`: the 8-bit wordmark. `pnpm build:logo` regenerates `course/icons/logo.svg`, `favicon.svg` and the README's `banner.svg`
- `STYLE.md`: the writing brief every content edit follows
