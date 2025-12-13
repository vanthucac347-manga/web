import { getParam, loadComics, escapeHtml } from "./lib.js";

function gotoChapter(slug, chapterId) {
  const url = new URL(window.location.href);
  url.searchParams.set("slug", slug);
  url.searchParams.set("chapterId", chapterId);
  window.location.href = url.toString();
}

function renderPages(pages) {
  const list = document.getElementById("pageList");
  if (!pages?.length) {
    list.innerHTML = `<div class="muted">Chương này chưa có pages để hiển thị.</div>`;
    return;
  }
  list.innerHTML = pages.map((src, i) => `
    <img class="page" src="${src}" alt="Page ${i + 1}" loading="lazy" />
  `).join("");
}

(async function init() {
  try {
    const slug = getParam("slug");
    const chapterId = getParam("chapterId");
    if (!slug || !chapterId) {
      document.getElementById("readerTitle").textContent = "Thiếu slug/chapterId";
      return;
    }

    const data = await loadComics();
    const comic = (data.comics ?? []).find(c => c.slug === slug);
    if (!comic) throw new Error("Không tìm thấy truyện: " + slug);

    const chapters = comic.chapters ?? [];
    const idx = chapters.findIndex(ch => ch.id === chapterId);
    if (idx < 0) throw new Error("Không tìm thấy chương: " + chapterId);

    const ch = chapters[idx];

    document.title = `${ch.name ?? ch.id} | ${comic.title}`;
    document.getElementById("readerTitle").textContent = `${comic.title} — ${ch.name ?? ch.id}`;
    document.getElementById("readerMeta").textContent = `Cập nhật: ${ch.updatedAt ?? "—"} • ${chapters.length} chương`;
    document.getElementById("backToComic").href = `comic.html?slug=${encodeURIComponent(slug)}`;

    // select
    const select = document.getElementById("chapterSelect");
    select.innerHTML = chapters.map(x => `
      <option value="${escapeHtml(x.id)}">${escapeHtml(x.name ?? x.id)}</option>
    `).join("");
    select.value = chapterId;
    select.addEventListener("change", () => gotoChapter(slug, select.value));

    // prev/next (chapters đang mới -> cũ)
    const prev = chapters[idx + 1];
    const next = chapters[idx - 1];

    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");
    btnPrev.disabled = !prev;
    btnNext.disabled = !next;

    btnPrev.onclick = () => prev && gotoChapter(slug, prev.id);
    btnNext.onclick = () => next && gotoChapter(slug, next.id);

    window.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" && prev) gotoChapter(slug, prev.id);
      if (e.key === "ArrowRight" && next) gotoChapter(slug, next.id);
    });

    renderPages(ch.pages);

  } catch (e) {
    console.error(e);
    document.getElementById("readerTitle").textContent = "Lỗi tải trang đọc";
    document.getElementById("pageList").innerHTML = `<div class="muted">Mở F12 → Console.</div>`;
  }
})();
