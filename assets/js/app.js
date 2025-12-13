console.log("✅ app.js loaded", import.meta.url);

import { loadComics, formatViews, escapeHtml, latestChapterName } from "./lib.js";

const grid = document.getElementById("comicGrid");
const resultCount = document.getElementById("resultCount");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");

let comics = [];

function render(list) {
  grid.innerHTML = list.map(c => `
    <a class="card" href="comic.html?slug=${encodeURIComponent(c.slug)}" title="${escapeHtml(c.title)}">
      <img class="card__cover" src="${c.cover}" alt="${escapeHtml(c.title)}" loading="lazy">
      <div class="card__body">
        <h3 class="card__title">${escapeHtml(c.title)}</h3>
        <div class="card__meta">
          <span>${escapeHtml(latestChapterName(c))}</span>
          <span>👁 ${formatViews(c.views ?? 0)}</span>
        </div>
        <div class="badges">
          ${(c.genres ?? []).slice(0,3).map(g => `<span class="badge">${escapeHtml(g)}</span>`).join("")}
        </div>
      </div>
    </a>
  `).join("");

  resultCount.textContent = `${list.length} truyện`;
}

async function init() {
  try {
    const data = await loadComics();
    comics = data.comics ?? [];
    render(comics);
  } catch (e) {
    console.error(e);
    resultCount.textContent = "Lỗi tải dữ liệu (F12 → Console)";
  }
}

searchForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = (searchInput.value || "").trim().toLowerCase();
  if (!q) return render(comics);

  const filtered = comics.filter(c =>
    (c.title || "").toLowerCase().includes(q) ||
    (c.genres || []).some(g => String(g).toLowerCase().includes(q))
  );
  render(filtered);
});

init();
