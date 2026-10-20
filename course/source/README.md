# Course page source

`course/index.html` is the deliverable: one self-contained file, no build step needed to use it.
These scripts generate it from structured content (so code samples are escaped mechanically):

```sh
python3 course/source/build.py course/index.html
```

- `week1.py` … `week3.py`: days, concepts (each with exactly one 🟢/🟡/🔴 flag), exercise briefs, drills, mock interview, cheat sheet
- `model.py`: data types and a tiny inline-markdown renderer
- `build.py`: page template, CSS and JS (progress in localStorage, guarded with try/catch)
