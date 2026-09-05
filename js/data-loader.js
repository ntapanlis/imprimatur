// Loads book data from your published Google Sheet (see README.md), falling
// back to the local BOOKS array in data/books.js if the sheet isn't
// configured yet, or can't be reached (offline, sheet not published, etc.).
//
// The sheet needs one row per book and a header row with exactly these
// column names (any order): id, title, author, coverArtist, year, genre,
// publisher, heightMm, widthMm, depthMm, essayTitle, review, reviewDate.
// Leave essayTitle/review/reviewDate blank until you've written the essay.
//
// Cover and spine images are NOT columns in the sheet - they're always
// read from images/<id>/cover.jpg and images/<id>/spine.jpg, matching the
// id column. That keeps the sheet simple and means dropping in a spine
// scan later needs no sheet edit at all.

(function () {
  "use strict";

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    const pushField = () => { row.push(field); field = ""; };
    const pushRow = () => { rows.push(row); row = []; };

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
        } else {
          field += c;
        }
        continue;
      }
      if (c === '"') { inQuotes = true; continue; }
      if (c === ",") { pushField(); continue; }
      if (c === "\r") { continue; }
      if (c === "\n") { pushField(); pushRow(); continue; }
      field += c;
    }
    if (field !== "" || row.length) { pushField(); pushRow(); }
    if (!rows.length) return [];

    const headers = rows[0].map((h) => h.trim());
    return rows
      .slice(1)
      .filter((r) => r.some((cell) => cell.trim() !== ""))
      .map((r) => {
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = (r[idx] || "").trim(); });
        return obj;
      });
  }

  function num(v) {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  function csvRowToBook(row) {
    return {
      id: row.id || "",
      title: row.title || "",
      author: row.author || "",
      coverArtist: row.coverArtist || "Uncredited",
      year: num(row.year),
      genre: row.genre || "",
      publisher: row.publisher || "",
      heightMm: num(row.heightMm),
      widthMm: num(row.widthMm),
      depthMm: num(row.depthMm),
      essayTitle: row.essayTitle || "",
      review: row.review || "",
      reviewDate: row.reviewDate || "",
    };
  }

  async function loadBooks() {
    const url = window.SHEET_CSV_URL;
    if (url) {
      try {
        const sep = url.includes("?") ? "&" : "?";
        const res = await fetch(url + sep + "_=" + Date.now(), { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const text = await res.text();
        const books = parseCSV(text).map(csvRowToBook).filter((b) => b.id);
        if (books.length) return books;
        console.warn("Sheet returned no rows with an id - showing local fallback data instead.");
      } catch (err) {
        console.warn("Could not load the spreadsheet, showing local fallback data instead.", err);
      }
    }
    return window.BOOKS || [];
  }

  window.loadBooks = loadBooks;
  window.parseCSV = parseCSV; // exposed for testing
})();
