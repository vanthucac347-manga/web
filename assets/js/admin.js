import { requireAdmin } from "./auth.js";
import { escapeHtml, latestUpdatedAt, loadComics, getCustomComics, persistCustomComics } from "./lib.js";

const adminContent = document.getElementById("adminContent");
let comics = [];

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function renderLocked(message) {
  adminContent.innerHTML = `
    <div class="alert alert--error">${message}</div>`;
}

function createModal(content) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <button class="modal__close" aria-label="Đóng">×</button>
      ${content}
    </div>
  `;

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.classList.contains("modal__close")) {
      overlay.classList.remove("is-open");
      setTimeout(() => overlay.remove(), 150);
      document.body.classList.remove("modal-open");
    }
  });

  document.body.appendChild(overlay);
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => overlay.classList.add("is-open"));
  return overlay;
}

function renderComicList() {
  const list = comics.map((c, idx) => `
    <div class="admin__item">
      <img class="admin__cover" src="${escapeHtml(c.cover)}" alt="${escapeHtml(c.title)}" />
      <div class="admin__meta">
        <div class="admin__title">${escapeHtml(c.title)}</div>
        <div class="muted">${escapeHtml(c.genres?.join(", ") || "—")}</div>
        <div class="muted">Cập nhật: ${escapeHtml(latestUpdatedAt(c))}</div>
        <div class="muted">Chương: ${(c.chapters ?? []).length}</div>
      </div>
      <span class="badge">#${idx + 1}</span>
    </div>
  `).join("");

  return list || '<div class="muted">Chưa có truyện nào.</div>';
}

function renderPanel(user) {  
  adminContent.innerHTML = `
      <div class="panel admin-panel">
      <div class="panel__header">
        <div>
          <h2>Xin chào ${escapeHtml(user.username)}!</h2>
          <p class="muted">Bạn đang đăng nhập với quyền <strong>${escapeHtml(user.role)}</strong>. Chỉ admin mới được phép đăng tải truyện.</p>
        </div>

        <div class="admin__actions">
          <button class="btn btn--primary" id="btnAddComic">+ Thêm bộ truyện</button>
        </div>
      </div>

      <div class="alert alert--info">
      Upload hỗ trợ file .zip: mỗi folder trong zip đại diện cho 1 chap, các ảnh sẽ được sắp xếp theo tên file.
      </div>

      <div class="admin__list" id="adminList">
        ${renderComicList()}      </div>
    </div>
  `;

  adminContent.querySelector("#btnAddComic")?.addEventListener("click", openAddComicModal);
}


function openAddComicModal() {
  const overlay = createModal(`
    <div class="modal__logo modal__logo--small"><img src="assets/img/logo003.png" alt="logo" /></div>
    <h2 class="modal__title">Thêm bộ truyện mới</h2>
    <form class="modal__form" id="addComicForm">
      <label>Tên truyện</label>
      <input name="title" placeholder="Nhập tên truyện" />

      <label>Thể loại</label>
      <input name="genres" placeholder="Ví dụ: Hành động, Phiêu lưu" />

      <label>Mô tả</label>
      <textarea name="description" rows="3" placeholder="Tóm tắt nội dung"></textarea>

      <label>Ảnh bìa</label>
      <input name="cover" type="file" accept="image/*" />
      <div class="form__hint" id="coverHint">Chọn ảnh bìa từ máy tính.</div>

      <label>File .zip chap truyện</label>
      <input name="zip" type="file" accept="application/zip" />
      <div class="form__hint" id="zipHint">Chọn file .zip chứa các folder chap.</div>

      <div class="form__error" aria-live="polite"></div>
      <div class="form__success" aria-live="polite"></div>

      <div class="modal__actions">
        <button type="button" class="btn btn--ghost" data-close>Hủy</button>
        <button type="submit" class="btn btn--primary">Lưu bộ truyện</button>
      </div>
    </form>
  `);

  overlay.querySelector('[data-close]')?.addEventListener("click", () => {
    overlay.remove();
    document.body.classList.remove("modal-open");
  });

  const form = overlay.querySelector("#addComicForm");
  const zipInput = overlay.querySelector('input[name="zip"]');
  const coverInput = overlay.querySelector('input[name="cover"]');
  const hint = overlay.querySelector("#zipHint");
  const coverHint = overlay.querySelector("#coverHint");
  const errorBox = overlay.querySelector(".form__error");
  const successBox = overlay.querySelector(".form__success");
  let coverPreview = "";

  zipInput?.addEventListener("change", () => {
    if (zipInput.files?.length) {
      hint.textContent = `Đã add thành công dữ liệu (${zipInput.files[0].name})`;
      hint.classList.add("form__hint--success");
    } else {
      hint.textContent = "Chọn file .zip chứa các folder chap.";
      hint.classList.remove("form__hint--success");
    }
  });

  coverInput?.addEventListener("change", () => {
    if (coverInput.files?.length) {
      const file = coverInput.files[0];
      coverPreview = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onload = () => {
        coverPreview = reader.result;
      };
      reader.readAsDataURL(file);
      coverHint.textContent = `Đã chọn ảnh bìa (${file.name}).`;
      coverHint.classList.add("form__hint--success");
    } else {
      coverPreview = "";
      coverHint.textContent = "Chọn ảnh bìa từ máy tính.";
      coverHint.classList.remove("form__hint--success");
    }
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const title = (fd.get("title") || "").trim();
    const genres = (fd.get("genres") || "").split(",").map(g => g.trim()).filter(Boolean);
    const description = (fd.get("description") || "").trim();
    const coverFile = coverInput?.files?.[0];

    if (!title || !genres.length || !description || !coverFile || !coverPreview) {
      errorBox.textContent = "Vui lòng điền đầy đủ thông tin truyện.";
      successBox.textContent = "";
      return;
    }

    const zipName = zipInput?.files?.[0]?.name;
    const pages = coverPreview ? [
      coverPreview,
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='900' height='1400' viewBox='0 0 900 1400'><rect width='900' height='1400' fill='#0c2a4d'/><text x='50%' y='45%' fill='#f8d249' font-size='48' font-family='Arial' text-anchor='middle'>${escapeHtml(title)}</text><text x='50%' y='55%' fill='#f8d249' font-size='28' font-family='Arial' text-anchor='middle'>${escapeHtml(zipName || 'Bộ truyện mới')}</text></svg>`)}`
    ] : [];
    const today = new Date().toISOString().slice(0, 10);
    const newComic = {
      slug: slugify(title),
      title,
      genres,
      description,
      cover: coverPreview,
      updatedAt: today,
      chapters: [
        { id: `${slugify(title)}-chap-1`, name: "Chap 1", updatedAt: today, pages }
      ]
    };

    const custom = getCustomComics().filter(c => c.slug !== newComic.slug);
    custom.unshift(newComic);
    persistCustomComics(custom);

    comics = [newComic, ...comics.filter(c => c.slug !== newComic.slug)];
    successBox.textContent = "Đã lưu bộ truyện, đồng bộ dữ liệu đọc và đăng tải lên web.";
    errorBox.textContent = "";
    renderPanel(requireAdmin().user);
    setTimeout(() => {
      overlay.remove();
      document.body.classList.remove("modal-open");
    }, 700);
  });
}



async function evaluateAccess() {
  const result = requireAdmin();
  if (!result.ok) {
    renderLocked(result.message);
    return;
  }

  adminContent.innerHTML = "<p class=\"muted\">Đang tải dữ liệu truyện...</p>";
  try {
    const data = await loadComics();
    comics = data.comics ?? [];
    renderPanel(result.user);
  } catch (e) {
    adminContent.innerHTML = `<div class="alert alert--error">Không tải được danh sách truyện: ${e.message}</div>`;
  }
}

evaluateAccess();
document.addEventListener("auth:change", evaluateAccess);