import { getCurrentUser, isAdmin, login, logout, registerUser } from "./auth.js";

const nav = document.querySelector(".nav");
const authButtons = document.getElementById("authButtons");
const logoSrc = "assets/img/logo003.png";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function updateNav(user) {
  if (!nav) return;
  nav.querySelectorAll(".nav__admin").forEach(el => el.remove());

  if (isAdmin(user)) {
    const link = document.createElement("a");
    link.href = "admin.html";
    link.textContent = "Quản trị";
    link.classList.add("nav__admin");
    const isActive = slugify(window.location.pathname).includes("admin");
    if (isActive) link.classList.add("nav__active");
    nav.appendChild(link);
  }
}

function closeModal(modal) {
  modal?.classList.remove("is-open");
  setTimeout(() => modal?.remove(), 150);
  document.body.classList.remove("modal-open");
}

function createOverlay(contentHtml) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <button class="modal__close" aria-label="Đóng">×</button>
      <div class="modal__logo"><img src="${logoSrc}" alt="logo" /></div>
      ${contentHtml}
    </div>
  `;

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.classList.contains("modal__close")) {
      closeModal(overlay);
    }
  });

  document.body.appendChild(overlay);
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => overlay.classList.add("is-open"));
  return overlay;
}

function renderLoginModal() {
  const overlay = createOverlay(`
    <h2 class="modal__title">Đăng nhập</h2>
    <form class="modal__form" id="loginForm">
      <label>Tài khoản</label>
      <input name="username" placeholder="Nhập tài khoản" />
      <label>Mật khẩu</label>
      <input type="password" name="password" placeholder="Nhập mật khẩu" />
      <div class="form__error" aria-live="polite"></div>
      <button type="submit" class="btn btn--primary">Đăng nhập</button>
    </form>
  `);

  const form = overlay.querySelector("#loginForm");
  const errorBox = overlay.querySelector(".form__error");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const username = fd.get("username");
    const password = fd.get("password");
    if (!username || !password) {
      errorBox.textContent = "Vui lòng nhập đầy đủ tài khoản và mật khẩu.";
      return;
    }
    const result = login(username, password);
    if (!result.ok) {
      errorBox.textContent = "Tài khoản và mật khẩu không đúng";
      return;
    }
    closeModal(overlay);
    renderAuthArea();
  });
}

function renderRegisterModal() {
  const overlay = createOverlay(`
    <h2 class="modal__title">Đăng ký</h2>
    <form class="modal__form" id="registerForm">
      <label>Tên tài khoản</label>
      <input name="username" placeholder="Ví dụ: user123" />
      <label>Mật khẩu</label>
      <input type="password" name="password" placeholder="Ít nhất 6 ký tự" />
      <label>Tên người dùng</label>
      <input name="displayName" placeholder="Tên hiển thị" />
      <div class="form__error" aria-live="polite"></div>
      <div class="form__success" aria-live="polite"></div>
      <button type="submit" class="btn btn--primary">Tạo tài khoản</button>
    </form>
  `);

  const form = overlay.querySelector("#registerForm");
  const errorBox = overlay.querySelector(".form__error");
  const successBox = overlay.querySelector(".form__success");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {
      username: fd.get("username"),
      password: fd.get("password"),
      displayName: fd.get("displayName")
    };
    const result = registerUser(payload);
    if (!result.ok) {
      errorBox.textContent = result.message || "Không thể đăng ký";
      successBox.textContent = "";
      return;
    }
    errorBox.textContent = "";
    successBox.textContent = `${result.message}. Bạn sẽ được quay lại trang chính.`;
    setTimeout(() => closeModal(overlay), 900);
  });
}

function renderAuthArea() {
  const user = getCurrentUser();
  updateNav(user);
  if (!authButtons) return;

  if (!user) {
    authButtons.innerHTML = `
      <button class="btn btn--ghost" id="btnLogin">Đăng nhập</button>
      <button class="btn btn--primary" id="btnRegister">Đăng ký</button>
    `;
    authButtons.querySelector("#btnLogin")?.addEventListener("click", renderLoginModal);
    authButtons.querySelector("#btnRegister")?.addEventListener("click", renderRegisterModal);
    return;
  }

  authButtons.innerHTML = `
    <div class="auth__user">
      <div class="auth__pill">
        <span class="auth__name">${user.displayName || user.username}</span>
        <span class="auth__role">${user.role}</span>
      </div>
      <button class="btn btn--ghost" id="btnLogout">Đăng xuất</button>
    </div>
  `;

  authButtons.querySelector("#btnLogout")?.addEventListener("click", () => {
    logout();
    renderAuthArea();
  });
}

renderAuthArea();
document.addEventListener("auth:change", renderAuthArea);