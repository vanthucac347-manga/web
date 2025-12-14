import { renderAuthWidget, requireAdmin } from "./auth.js";

const authBox = document.getElementById("authBox");
renderAuthWidget(authBox);

const adminContent = document.getElementById("adminContent");

function renderLocked(message) {
  adminContent.innerHTML = `
    <div class="alert alert--error">${message}</div>
    <p class="muted">Đăng nhập bằng tài khoản admin (admin/admin123) để truy cập khu vực này.</p>
  `;
}

function renderTools(user) {
  adminContent.innerHTML = `
    <div class="panel">
      <h2>Xin chào ${user.username}!</h2>
      <p class="muted">Bạn đang đăng nhập với quyền <strong>${user.role}</strong>. Chỉ admin mới được phép upload và chỉnh sửa nội dung.</p>

      <div class="panel__grid">
        <div class="panel__block">
          <h3>Upload truyện mới</h3>
          <p class="muted">Chọn file dữ liệu (.json) để tải lên máy chủ.</p>
          <form class="panel__form">
            <input type="file" accept="application/json" aria-label="Upload comics" />
            <button type="button" class="btn" disabled title="Demo chỉ minh họa">Tải lên (demo)</button>
          </form>
        </div>

        <div class="panel__block">
          <h3>Chỉnh sửa thông tin</h3>
          <p class="muted">Thay đổi meta trang web, banner hoặc nội dung mô tả.</p>
          <form class="panel__form">
            <label class="panel__label">Tiêu đề trang</label>
            <input type="text" placeholder="VẠN THƯ CÁC" />
            <label class="panel__label">Thông báo</label>
            <textarea rows="3" placeholder="Nội dung thông báo..." ></textarea>
            <button type="button" class="btn" disabled title="Demo chỉ minh họa">Lưu (demo)</button>
          </form>
        </div>
      </div>

      <div class="alert alert--info">
        Đây là phiên bản minh họa cho luồng phân quyền: mọi hành động tải lên/chỉnh sửa sẽ bị khóa đối với người không có vai trò admin.
      </div>
    </div>
  `;
}

function evaluateAccess() {
  const result = requireAdmin();
  if (!result.ok) return renderLocked(result.message);
  renderTools(result.user);
}

evaluateAccess();
document.addEventListener("auth:change", evaluateAccess);