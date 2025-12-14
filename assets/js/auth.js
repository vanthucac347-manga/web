const DEFAULT_USERS = [
  { username: "adminvanthucac", password: "k1mkvanthucac283..", role: "admin", displayName: "Admin" },
];

const STORAGE_KEY = "vtc_current_user";
const STORAGE_USER_LIST = "vtc_custom_users";

function loadCustomUsers() {
  const raw = localStorage.getItem(STORAGE_USER_LIST);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(u => ({ ...u, role: u.role || "viewer" }));
  } catch (e) {
    console.warn("Không parse được danh sách user", e);
    return [];
  }
}

function saveCustomUsers(list) {
  localStorage.setItem(STORAGE_USER_LIST, JSON.stringify(list));
}

function getAllUsers() {
  return [...DEFAULT_USERS, ...loadCustomUsers()];
}

function persistUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    username: user.username,
    role: user.role,
    displayName: user.displayName
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
  const cleanUser = (username || "").trim();
  const cleanPass = (password || "").trim();
  const user = getAllUsers().find(u => u.username === cleanUser && u.password === cleanPass);  if (!user) {
    return { ok: false, message: "Sai tài khoản hoặc mật khẩu" };
  }
  const normalized = { username: user.username, role: user.role, displayName: user.displayName || user.username };
  persistUser(normalized);  
  notifyAuthChange();
  return { ok: true, user: normalized };
}

export function registerUser({ username, password, displayName }) {
  const cleanUser = (username || "").trim();
  const cleanPass = (password || "").trim();
  const cleanName = (displayName || "").trim();

  if (!cleanUser || !cleanPass || !cleanName) {
    return { ok: false, message: "Vui lòng nhập đầy đủ thông tin" };
  }

  if (getAllUsers().some(u => u.username.toLowerCase() === cleanUser.toLowerCase())) {
    return { ok: false, message: "Tài khoản đã tồn tại" };
  }

  const customUsers = loadCustomUsers();
  customUsers.push({ username: cleanUser, password: cleanPass, displayName: cleanName, role: "viewer" });
  saveCustomUsers(customUsers);
  return { ok: true, message: "Đăng ký thành công" };}

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