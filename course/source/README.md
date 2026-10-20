# Course page source

`course/index.html` is the deliverable: one self-contained file, no build step needed to use it.
These modules generate it from structured content (so code samples are escaped mechanically):

```sh
pnpm build:course
```

- `week1.mjs` … `week3.mjs`: days, concepts (each with exactly one 🟢/🟡/🔴 flag), exercise briefs, self-check questions, final review, cheat sheet
- `model.mjs`: content helpers and a tiny inline-markdown renderer
- `build.mjs`: page template, CSS and JS (progress in localStorage, guarded with try/catch)
