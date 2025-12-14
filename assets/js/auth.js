const USERS = [
  { username: "adminvanthucac", password: "k1mkvanthucac283..", role: "admin" },
  { username: "viewer", password: "viewer123", role: "viewer" }
];

const STORAGE_KEY = "vtc_current_user";

function persistUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    username: user.username,
    role: user.role
  }));
}

export function getCurrentUser() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Không parse được current user từ localStorage", e);
    return null;
  }
}

export function isAdmin(user = getCurrentUser()) {
  return (user?.role || "").toLowerCase() === "admin";
}

export function login(username, password) {
  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) {
    return { ok: false, message: "Sai tài khoản hoặc mật khẩu" };
  }
  persistUser(user);
  notifyAuthChange();
  return { ok: true, user: { username: user.username, role: user.role } };
}

export function logout() {
  persistUser(null);
  notifyAuthChange();
}

export function requireAdmin() {
  const user = getCurrentUser();
  if (!isAdmin(user)) {
    return { ok: false, message: "Trang này yêu cầu quyền quản trị (admin)." };
  }
  return { ok: true, user };
}

function notifyAuthChange() {
  document.dispatchEvent(new CustomEvent("auth:change", { detail: getCurrentUser() }));
}

export function renderAuthWidget(container) {
  if (!container) return;

  function render() {
    const user = getCurrentUser();
    if (!user) {
      container.innerHTML = `
        <form class="auth__form" id="authForm">
          <input aria-label="Tài khoản" name="username" placeholder="Tài khoản" required />
          <input aria-label="Mật khẩu" name="password" type="password" placeholder="Mật khẩu" required />
          <button type="submit" class="btn">Đăng nhập</button>
        </form>
        <div class="muted auth__hint">Demo: admin/admin123</div>
      `;

      const form = container.querySelector("#authForm");
      form?.addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const result = login(fd.get("username"), fd.get("password"));
        if (!result.ok) {
          container.querySelector(".auth__hint").textContent = result.message;
        } else {
          render();
        }
      });
      return;
    }

    container.innerHTML = `
      <div class="auth__user">
        <div class="auth__pill">
          <span class="auth__name">${user.username}</span>
          <span class="auth__role">${user.role}</span>
        </div>
        <button class="btn" id="btnLogout">Đăng xuất</button>
      </div>
    `;

    container.querySelector("#btnLogout")?.addEventListener("click", () => {
      logout();
      render();
    });
  }

  render();
  document.addEventListener("auth:change", render);
}