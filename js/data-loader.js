// Loads book data from your published Google Sheet (see README.md). The
// sheet is the only source of book data - there is no local fallback copy,
// so if it's unreachable the shelf will come up empty (see app.js).
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
    if (!url) {
      console.warn("No SHEET_CSV_URL set in data/config.js - the shelf will be empty.");
      return [];
    }
    try {
      const sep = url.includes("?") ? "&" : "?";
      const res = await fetch(url + sep + "_=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const text = await res.text();
      return parseCSV(text).map(csvRowToBook).filter((b) => b.id);
    } catch (err) {
      console.warn("Could not load the spreadsheet - the shelf will be empty.", err);
      return [];
    }
  }

  window.loadBooks = loadBooks;
  window.parseCSV = parseCSV; // exposed for testing
})();
