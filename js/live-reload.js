// Dev convenience: while you're adding books, this polls data/books.js and
// reloads the page automatically as soon as you save a change - no manual
// refresh needed. Only does anything when the site is served over http(s)
// (it's a no-op on file://, and harmless if left in when you deploy).
(function () {
  "use strict";
  if (location.protocol !== "http:" && location.protocol !== "https:") return;

  const POLL_MS = 2000;
  let lastContent = null;

  async function poll() {
    try {
      const res = await fetch("data/books.js?_=" + Date.now(), { cache: "no-store" });
      const text = await res.text();
      if (lastContent === null) {
        lastContent = text;
      } else if (text !== lastContent) {
        location.reload();
        return;
      }
    } catch (e) {
      // server not reachable right now - just try again next tick
    }
    setTimeout(poll, POLL_MS);
  }

  poll();
})();
