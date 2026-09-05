// ============================================================================
// FALLBACK BOOK DATA
// ============================================================================
// This array is only used when data/config.js has no SHEET_CSV_URL set, or
// when the spreadsheet can't be reached. Once your Google Sheet is live,
// THIS FILE IS NOT WHERE YOU ADD BOOKS ANYMORE - add rows to the sheet
// instead. See README.md for the full setup and the sheet's column layout.
//
// Kept here mainly as: (a) a working local/offline copy, (b) a safety net
// so the site never shows completely empty if the sheet is unreachable,
// (c) a reference for the exact fields/shape each book needs.
//
// Fields:
//   id          - unique slug. Must match an images/<id>/ folder containing
//                 cover.jpg (required) and spine.jpg (optional - see below)
//   title       - book title
//   author      - "Last, First"
//   coverArtist - photographer / illustrator / designer of the cover art,
//                 if credited (check the copyright page). "Uncredited" if not.
//   year        - original publication year
//   genre       - e.g. "Literary Fiction"
//   publisher   - publisher / imprint of YOUR edition - shown as "Edition"
//   heightMm    - measured: top to bottom of the cover
//   widthMm     - measured: left to right of the front cover
//   depthMm     - measured: spine thickness
//   essayTitle  - your essay's own title (not the book's). Leave "" until written.
//   review      - your essay text, paragraphs separated by a blank line. Leave `` until written.
//   reviewDate  - date you wrote the essay, "YYYY-MM-DD". Leave "" until written.
//
// Images: cover.jpg is always read from images/<id>/cover.jpg. spine.jpg is
// tried automatically from images/<id>/spine.jpg - if it doesn't exist yet,
// the shelf falls back to a placeholder spine (a colour sampled from the
// cover, with the title/author printed on it). Add the file later and it
// upgrades itself, no data change needed.

window.BOOKS = [
  {
    id: "a-single-man",
    title: "A Single Man",
    author: "Isherwood, Christopher",
    coverArtist: "Uncredited",
    year: 1964,
    genre: "Literary Fiction",
    publisher: "Vintage",
    heightMm: 158, // placeholder estimate (20% shorter than Call Me By Your Name) - replace once you measure your own copy
    widthMm: 104,
    depthMm: 11, // placeholder estimate - replace once you measure your own copy
    essayTitle: "The Grammar of Grief",
    review: `George wakes up, teaches a class, buys some liquor, has dinner with an old friend, goes for a swim. Nothing "happens" in the way plot usually means it, and that turns out to be exactly the point: Isherwood is interested in what a single day costs a person who is grieving in a world that has no name for what he's lost. The prose is spare almost to the point of clinical, which makes the few moments it lets its guard down hit disproportionately hard.

What stayed with me most is how physical the book is — George's body, its aches and appetites and small vanities, is tracked with the same close attention as his thoughts, so that the mind and the body never quite separate into the usual hierarchy. It's a short book that doesn't feel slight; more that Isherwood trusted the reader to sit in a single consciousness for 150-odd pages without needing anything external to justify the time.`,
    reviewDate: "2026-08-14",
  },
  {
    id: "call-me-by-your-name",
    title: "Call Me By Your Name",
    author: "Aciman, André",
    coverArtist: "Uncredited",
    year: 2007,
    genre: "Literary Fiction, Romance",
    publisher: "Picador",
    heightMm: 198,
    widthMm: 131,
    depthMm: 17, // placeholder estimate - replace once you measure your own copy
    essayTitle: "What We Don't Let Ourselves Have",
    review: `Aciman writes desire as a kind of relentless internal weather — the book is almost entirely interior monologue, Elio circling and re-circling the same handful of facts about Oliver until the circling itself becomes the plot. It's a style that could easily curdle into self-indulgence, but the specificity of the Italian summer (the fruit, the heat, the bicycles, the afternoons that refuse to end) keeps it tethered to something sensory rather than purely cerebral.

The famous final stretch — the father's speech, the phone call years later — earns its reputation; it recontextualizes the whole book as being about permission as much as it's about longing. I came away thinking less about the romance itself and more about Aciman's argument that the feelings you don't let yourself fully have are the ones that cost you the most later.`,
    reviewDate: "2026-08-29",
  },
];
