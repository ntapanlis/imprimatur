(function () {
  "use strict";

  // ---- physical-to-pixel scaling for spines ----
  // Spine width, spine height, and cover width all come straight from the
  // book's measured heightMm / widthMm / depthMm.
  const PX_PER_MM = 2.05;
  const MIN_SPINE_WIDTH_PX = 16;

  const FALLBACK_COLORS = ["#5b4636", "#3d5a4c", "#7a3b3b", "#4a4a63", "#6b5b3e"];

  let books = [];
  let selectedId = null;

  const byId = (id) => books.find((b) => b.id === id);
  const coverSrc = (book) => `images/${book.id}/cover.jpg`;
  const spineSrc = (book) => `images/${book.id}/spine.jpg`;

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
        if (color) spineFaceEl.style.backgroundColor = color;
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

      // Try to upgrade to a real scanned spine at images/<id>/spine.jpg.
      // If it doesn't exist (yet), the placeholder above just stays put.
      const spineProbe = new Image();
      spineProbe.onload = () => {
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
  }

  function toggleSelect(id) {
    selectedId = selectedId === id ? null : id;
    updateSelection();
  }

  function updateSelection() {
    document.querySelectorAll(".book").forEach((el) => {
      el.classList.toggle("selected", el.dataset.id === selectedId);
    });

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
    document.getElementById("review-close").addEventListener("click", () => {
      selectedId = null;
      updateSelection();
    });
  });
})();
