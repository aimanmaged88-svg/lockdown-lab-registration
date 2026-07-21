# Amina's Photos 📸

Drop the photos you want to appear in the birthday card into **this folder**.
They load automatically — you never have to edit any code.

## Two easy ways

### 1. Simplest — number your photos
Name them `1.jpg`, `2.jpg`, `3.jpg`, … in order. The card finds them one
after another (it also accepts `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`).

```
photos/
  1.jpg
  2.jpg
  3.png
  4.jpg
```

> Tip: keep the numbers consecutive with no gaps (1, 2, 3 …). The card stops
> looking after a few missing numbers in a row.

### 2. Any names you like — use a manifest
Create a file called `manifest.json` in this folder listing your file names,
in the order you want them shown:

```json
[
  "beach-day.jpg",
  "first-steps.png",
  "birthday-2020.jpg",
  "us-at-the-park.webp"
]
```

If `manifest.json` exists, the card uses it and shows exactly those photos.

## Notes
- Photos are lazy-loaded, so lots of them is fine.
- For fastest loading, resize very large photos to around 1600px on the long
  edge before adding them.
- That's it — refresh the page and the memories appear. ❤️
