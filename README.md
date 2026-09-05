# Imprimatur

A personal virtual bookshelf. Spines are sized to scale from your own
measurements; click one to read the essay you wrote about it.

This file covers three things, in order: previewing locally, publishing to
the web, and adding a book once it's live. Do them in that order the first
time - after that you'll only ever need the last section.

---

## 1. Preview locally

From this folder:

```bash
python3 serve-nocache.py
```

Then open http://localhost:4173 in a browser. Leave the site open while you
edit `data/books.js` - it reloads itself automatically a couple of seconds
after you save (see `js/live-reload.js`; it's a no-op once published, so
there's nothing to remove later).

---

## 2. Publish it

### 2a. Put the code on GitHub

```bash
git config user.name "Your Name"
git config user.email "ntapanlis@gmail.com"
git add -A
git commit -m "Initial commit"
```

Then on github.com: click **New repository**, name it (e.g. `imprimatur`),
leave it empty (no README/license), and create it. GitHub will show you a
remote URL - use it here:

```bash
git remote add origin https://github.com/<your-username>/imprimatur.git
git branch -M main
git push -u origin main
```

### 2b. Turn on GitHub Pages

On the repo's GitHub page: **Settings → Pages → Build and deployment → Source:
Deploy from a branch → Branch: main, folder: / (root) → Save**.

GitHub gives you a URL like `https://<your-username>.github.io/imprimatur/`
- it takes a minute or two to go live the first time, and updates
automatically every time you push a change (including a plain file upload
through the website, covered below).

### 2c. Set up the Google Sheet

1. Open **[books-template.csv](books-template.csv)** (in this folder) and
   import it into a new Google Sheet: Sheets → File → Import → Upload →
   select the file → "Replace spreadsheet" → Import data. This gives you a
   sheet with the right columns, pre-filled with the two books already on
   the site.
2. **File → Share → Publish to web.** Under "Link", choose the sheet tab and
   **CSV** as the format, then click **Publish**. Copy the URL it gives you.
3. Paste that URL into `data/config.js`:

   ```js
   window.SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/.../pub?output=csv";
   ```
4. Commit and push that one-line change:

   ```bash
   git add data/config.js
   git commit -m "Connect the book spreadsheet"
   git push
   ```

From now on, **editing the sheet updates the live site** - no push needed for
that part. Reloading the page always fetches the current sheet.

---

## 3. Adding a book (the ongoing, no-code workflow)

**1. Measure your copy**, in millimetres, with a ruler:
   - `heightMm` - top to bottom of the cover
   - `widthMm` - left to right of the *front* cover
   - `depthMm` - thickness of the spine
   (No metric ruler? multiply inches × 25.4.)

**2. Add its photos on GitHub's website** (no terminal needed):
   - Go to your repo → `images` folder → **Add file → Create new file**.
   - Type `<slug>/cover.jpg` as the filename (e.g. `the-idiot/cover.jpg`) -
     GitHub creates the folder for you - then drag your cover photo into the
     upload area that appears instead of typing content, and commit.
   - Repeat for `<slug>/spine.jpg` once you have a spine scan. Until then,
     the site shows a placeholder spine automatically (a colour sampled from
     the cover, with the title printed on it) - no extra step needed, and it
     upgrades itself the moment you add the real scan later.
   - `<slug>` must exactly match the `id` you use in the sheet in the next
     step (lowercase, hyphens, no spaces - e.g. `the-idiot`).

**3. Add a row to the Google Sheet** with that same `id` and the rest of the
   book's details. Row order = shelf order, left to right.

**4. Leave `essayTitle` / `review` / `reviewDate` blank** until you've
   written about it - the spine still appears on the shelf, it just isn't
   clickable yet. Fill those three cells in whenever the essay's ready.

That's it - no git, no code, no redeploy. The next time anyone loads the
site, the new spine is there.

### Sheet columns reference

| Column | Meaning |
|---|---|
| `id` | slug, must match `images/<id>/` folder name |
| `title` | book title |
| `author` | "Last, First" |
| `coverArtist` | photographer/illustrator/designer of the cover art, or "Uncredited" |
| `year` | original publication year |
| `genre` | e.g. "Literary Fiction" |
| `publisher` | publisher/imprint of *your* edition - shown as "Edition" |
| `heightMm` / `widthMm` / `depthMm` | measured dimensions of your copy |
| `essayTitle` | your essay's own title (not the book's) |
| `review` | essay text - use Alt+Enter (Option+Return on Mac) inside a cell for paragraph breaks |
| `reviewDate` | date you wrote it, `YYYY-MM-DD` |
