import { getParam, loadComics, escapeHtml, formatViews, latestChapterName, latestUpdatedAt } from "./lib.js";

function renderNotFound(msg) {
  const box = document.getElementById("comicDetail");
  box.innerHTML = `<div class="muted">${escapeHtml(msg)}</div>`;
}

function renderComic(comic) {
  document.title = `${comic.title} | Web Truyện`;

  const genres = (comic.genres ?? []).map(g => `<span class="badge">${escapeHtml(g)}</span>`).join("");

  document.getElementById("comicDetail").innerHTML = `
    <img class="detail__cover" src="${comic.cover}" alt="${escapeHtml(comic.title)}" />
    <div>
      <h1 class="detail__title">${escapeHtml(comic.title)}</h1>

      <div class="detail__row">
        <span>👁 ${formatViews(comic.views)}</span>
        <span>•</span>
        <span>Cập nhật: ${escapeHtml(latestUpdatedAt(comic))}</span>
        <span>•</span>
        <span>Chap mới: ${escapeHtml(latestChapterName(comic))}</span>
      </div>

      <div class="badges" style="margin-top:10px;">
        ${genres}
      </div>

      <p class="muted" style="margin-top:12px; line-height:1.5;">
        ${escapeHtml(comic.description ?? "")}
      </p>
    </div>
  `;
}

function renderChapters(comic) {
  const list = document.getElementById("chapterList");
  const count = document.getElementById("chapterCount");

  const chapters = comic.chapters ?? [];
  count.textContent = `${chapters.length} chương`;

  if (!chapters.length) {
    list.innerHTML = `<div class="muted">Chưa có dữ liệu chương.</div>`;
    return;
  }

  list.innerHTML = chapters.map(ch => {
    const href = `read.html?slug=${encodeURIComponent(comic.slug)}&chapterId=${encodeURIComponent(ch.id)}`;
    return `
      <a class="chapter-item" href="${href}">
        <span class="chapter-item__name">${escapeHtml(ch.name ?? ch.id)}</span>
        <span class="chapter-item__meta">${escapeHtml(ch.updatedAt ?? "—")}</span>
      </a>
    `;
  }).join("");
}

(async function init() {
  try {
    const slug = getParam("slug");
    if (!slug) return renderNotFound("Thiếu ?slug=... (hãy bấm từ trang chủ).");

    const data = await loadComics();
    const comics = data.comics ?? [];
    const comic = comics.find(c => c.slug === slug);
    if (!comic) return renderNotFound("Không tìm thấy truyện: " + slug);

    renderComic(comic);
    renderChapters(comic);
  } catch (e) {
    console.error(e);
    renderNotFound("Lỗi tải dữ liệu. Mở F12 → Console.");
  }
})();
