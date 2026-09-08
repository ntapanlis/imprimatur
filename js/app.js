(function () {
  "use strict";

  // ---- physical-to-pixel scaling for spines ----
  // Spine width, spine height, and cover width all come straight from the
  // book's measured heightMm / widthMm / depthMm.
  const PX_PER_MM = 1.7425;
  const MIN_SPINE_WIDTH_PX = 14;

  const FALLBACK_COLORS = ["#5b4636", "#3d5a4c", "#7a3b3b", "#4a4a63", "#6b5b3e"];

  // ---- blank placeholder spines ----
  // Static, non-interactive spines that fill out the shelf alongside the
  // real scanned books. Sizes come straight from each format's real-world
  // height/depth, using the same PX_PER_MM scale as real books.
  const BLANK_TYPES = [
    { key: "standard-hardcover", heightMm: 216, widthMm: 26 },
    { key: "trade-hardcover", heightMm: 229, widthMm: 33 },
    { key: "mass-market-paperback", heightMm: 174, widthMm: 19 },
    { key: "trade-paperback", heightMm: 216, widthMm: 23 },
  ];
  const blankSrc = (type) => `images/blank/${type.key}.png`;

  const SHELF_GAP_PX = 3;
  const SHELF_OVERFLOW_TARGET_PX = 60;
  const BLANK_SEQUENCE_LENGTH = 80;
  // Fixed seed so the blank arrangement is stable across visits and only
  // ever extended (never reshuffled) as more blanks are needed.
  const BLANK_SEQUENCE_SEED = 20260907;

  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildBlankSequence(length) {
    const rng = makeRng(BLANK_SEQUENCE_SEED);
    const seq = [];
    let lastIndex = -1;
    for (let i = 0; i < length; i++) {
      let idx;
      do {
        idx = Math.floor(rng() * BLANK_TYPES.length);
      } while (idx === lastIndex && BLANK_TYPES.length > 1);
      lastIndex = idx;
      seq.push(idx);
    }
    return seq;
  }

  // Generated once per page load: stable for the whole session, so
  // recalculating the count on resize only ever reveals more of this same
  // sequence (or hides the tail of it) rather than reshuffling.
  const blankSequence = buildBlankSequence(BLANK_SEQUENCE_LENGTH);

  function blankDims(type) {
    return {
      heightPx: Math.round(type.heightMm * PX_PER_MM),
      widthPx: Math.max(MIN_SPINE_WIDTH_PX, Math.round(type.widthMm * PX_PER_MM)),
    };
  }

  // How many blanks are needed so the shelf extends slightly past the
  // visible width (a small horizontal scroll to reach the end), without
  // padding it out further than that. If the real books alone already
  // fill or exceed the width, no blanks are added.
  function computeBlankCount(containerWidthPx, realBooksWidthPx) {
    if (!containerWidthPx || realBooksWidthPx >= containerWidthPx) return 0;
    let total = realBooksWidthPx;
    let count = 0;
    const target = containerWidthPx + SHELF_OVERFLOW_TARGET_PX;
    while (total < target && count < blankSequence.length) {
      const { widthPx } = blankDims(BLANK_TYPES[blankSequence[count]]);
      total += (realBooksWidthPx > 0 || count > 0 ? SHELF_GAP_PX : 0) + widthPx;
      count++;
    }
    return count;
  }

  function renderBlank(type) {
    const { heightPx, widthPx } = blankDims(type);
    const el = document.createElement("div");
    el.className = "blank-book";
    el.setAttribute("aria-hidden", "true");
    el.style.setProperty("--spine-w", widthPx + "px");
    el.style.setProperty("--h", heightPx + "px");
    el.innerHTML = `<img src="${blankSrc(type)}" alt="" loading="lazy">`;
    return el;
  }

  let books = [];
  let selectedId = null;

  const byId = (id) => books.find((b) => b.id === id);
  const coverSrc = (book) => `images/${book.id}/cover.jpg`;
  const spineSrc = (book) => `images/${book.id}/spine.png`;

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));

  function spineDims(book) {
    const heightPx = Math.round(book.heightMm * PX_PER_MM);
    const widthPx = Math.max(MIN_SPINE_WIDTH_PX, Math.round(book.depthMm * PX_PER_MM));
    const coverWidthPx = Math.round(book.widthMm * PX_PER_MM);
    return { heightPx, widthPx, coverWidthPx };
  }

  // Sample the average colour of a vertical sliver near the spine edge of
  // the cover image, so a placeholder spine reads as roughly the colour of
  // its book until a real spine scan is added.
  function sampleSpineColor(imgEl) {
    return new Promise((resolve) => {
      try {
        const w = 12, h = 40;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        const sliceFrac = 0.14; // left 14% of the cover art
        const sw = imgEl.naturalWidth * sliceFrac;
        ctx.drawImage(imgEl, 0, 0, sw, imgEl.naturalHeight, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
        }
        r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
        resolve(`rgb(${r}, ${g}, ${b})`);
      } catch (e) {
        resolve(null);
      }
    });
  }

  function applyPlaceholderSpine(spineFaceEl, book, i) {
    spineFaceEl.classList.remove("has-image");
    spineFaceEl.innerHTML = `
      <span class="spine-text">
        <span class="spine-title">${escapeHtml(book.title)}</span>
        <span class="spine-author">${escapeHtml(book.author)}</span>
      </span>
    `;
    spineFaceEl.style.backgroundColor = FALLBACK_COLORS[i % FALLBACK_COLORS.length];

    const probe = new Image();
    probe.crossOrigin = "anonymous";
    probe.onload = () => {
      sampleSpineColor(probe).then((color) => {
        // The real spine.png may have already loaded and cleared this
        // background while the cover was still being sampled - don't let
        // a late-resolving placeholder colour clobber it.
        if (color && !spineFaceEl.classList.contains("has-image")) {
          spineFaceEl.style.backgroundColor = color;
        }
      });
    };
    probe.src = coverSrc(book);
  }

  function renderShelf() {
    const shelf = document.getElementById("shelf");
    shelf.innerHTML = "";

    if (!books.length) {
      shelf.classList.add("shelf-empty");
      shelf.textContent = "Couldn't load the shelf right now - try refreshing in a moment.";
      return;
    }
    shelf.classList.remove("shelf-empty");

    books.forEach((book, i) => {
      const { heightPx, widthPx, coverWidthPx } = spineDims(book);
      const hasEssay = !!(book.essayTitle && book.review);

      const bookEl = document.createElement("div");
      bookEl.className = "book";
      bookEl.tabIndex = 0;
      bookEl.dataset.id = book.id;
      bookEl.setAttribute("role", "button");
      bookEl.setAttribute(
        "aria-label",
        `${book.title} by ${book.author}` + (hasEssay ? "" : " (essay not yet written)")
      );
      bookEl.style.setProperty("--spine-w", widthPx + "px");
      bookEl.style.setProperty("--cover-w", coverWidthPx + "px");
      bookEl.style.setProperty("--h", heightPx + "px");

      bookEl.innerHTML = `
        <div class="rig">
          <div class="face spine-face"></div>
          <div class="face cover-face">
            <img src="${coverSrc(book)}" alt="Cover of ${escapeHtml(book.title)}" loading="lazy">
          </div>
        </div>
      `;

      const spineFaceEl = bookEl.querySelector(".spine-face");
      applyPlaceholderSpine(spineFaceEl, book, i);

      // Try to upgrade to a real scanned spine at images/<id>/spine.png.
      // If it doesn't exist (yet), the placeholder above just stays put.
      const spineProbe = new Image();
      spineProbe.onload = () => {
        // Use the image's own aspect ratio at the book's physical height,
        // rather than the depth-derived estimate, so the spine renders at
        // its true proportions with no forced cropping.
        const naturalW = spineProbe.naturalWidth;
        const naturalH = spineProbe.naturalHeight;
        if (naturalW && naturalH) {
          const trueWidthPx = Math.max(MIN_SPINE_WIDTH_PX, Math.round(heightPx * (naturalW / naturalH)));
          bookEl.style.setProperty("--spine-w", trueWidthPx + "px");
        }
        spineFaceEl.classList.add("has-image");
        spineFaceEl.style.backgroundColor = "";
        spineFaceEl.innerHTML = `<img src="${spineSrc(book)}" alt="Spine of ${escapeHtml(book.title)}" loading="lazy">`;
      };
      spineProbe.src = spineSrc(book);

      if (hasEssay) {
        bookEl.addEventListener("click", () => toggleSelect(book.id));
        bookEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleSelect(book.id);
          }
        });
      }

      shelf.appendChild(bookEl);
    });

    // ---- fill remaining shelf width with randomized blank placeholders ----
    const containerWidthPx = shelf.parentElement ? shelf.parentElement.clientWidth : 0;
    const realBooksWidthPx = books.reduce((sum, book, i) => {
      const { widthPx } = spineDims(book);
      return sum + widthPx + (i > 0 ? SHELF_GAP_PX : 0);
    }, 0);
    const blankCount = computeBlankCount(containerWidthPx, realBooksWidthPx);
    for (let i = 0; i < blankCount; i++) {
      shelf.appendChild(renderBlank(BLANK_TYPES[blankSequence[i]]));
    }
  }

  function toggleSelect(id) {
    selectedId = selectedId === id ? null : id;
    updateSelection();
  }

  function updateSelection() {
    document.querySelectorAll(".book").forEach((el) => {
      el.classList.toggle("selected", el.dataset.id === selectedId);
    });

    const hint = document.querySelector(".hint");
    if (hint) hint.hidden = !!selectedId;

    const panel = document.getElementById("review-panel");
    if (!selectedId) {
      panel.hidden = true;
      return;
    }
    renderReview(byId(selectedId));
    panel.hidden = false;
  }

  function renderReview(book) {
    const content = document.getElementById("review-content");

    const paragraphs = book.review
      .trim()
      .split(/\n\s*\n/)
      .map((p) => `<p>${p.trim()}</p>`)
      .join("\n");

    const reviewDateFormatted = new Date(book.reviewDate + "T00:00:00").toLocaleDateString(
      undefined,
      { year: "numeric", month: "long", day: "numeric" }
    );

    content.innerHTML = `
      <div class="review-body">
        <h2 class="review-title">${escapeHtml(book.essayTitle)}</h2>
        <dl class="review-meta">
          <div class="meta-col">
            <div class="meta-row"><dt>Title</dt><dd>${escapeHtml(book.title)}</dd></div>
            <div class="meta-row"><dt>Author</dt><dd>${escapeHtml(book.author)}</dd></div>
            <div class="meta-row"><dt>Cover artist</dt><dd>${escapeHtml(book.coverArtist)}</dd></div>
          </div>
          <div class="meta-col">
            <div class="meta-row"><dt>Published</dt><dd>${book.year}</dd></div>
            <div class="meta-row"><dt>Edition</dt><dd>${escapeHtml(book.publisher)}</dd></div>
            <div class="meta-row"><dt>Genre</dt><dd>${escapeHtml(book.genre)}</dd></div>
          </div>
        </dl>
        <p class="review-date">${reviewDateFormatted}</p>
        <div class="review-text">${paragraphs}</div>
      </div>
    `;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    books = await window.loadBooks();
    renderShelf();
    updateSelection();

    // Re-run the blank-count calculation (against the current viewport
    // width) on resize, so the shelf keeps its slight overflow without
    // reshuffling the already-visible blanks.
    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        renderShelf();
        updateSelection();
      }, 200);
    });

    document.getElementById("review-close").addEventListener("click", () => {
      selectedId = null;
      updateSelection();
    });
  });
})();
