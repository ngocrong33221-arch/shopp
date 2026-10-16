/* ============================================================
   account.js — Account page logic
   ============================================================ */

const session = JSON.parse(sessionStorage.getItem('cn_session') || 'null');
const API_BASE = window.location.protocol === 'file:' ? 'http://127.0.0.1:5000' : window.location.origin;

document.getElementById('avatar').textContent = session.username.charAt(0).toUpperCase();
document.getElementById('accountName').textContent = session.displayName || session.username;
document.getElementById('accountEmail').textContent = session.username;
document.getElementById('accountRole').textContent = session.role === 'admin' ? 'Quản trị viên' : 'Thành viên';

async function loadProfile() {
  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'same-origin' });
    if (!response.ok) throw new Error('profile unavailable');
    const profile = await response.json();
    const createdAt = profile.createdAt ? new Date(profile.createdAt) : null;
    document.getElementById('accountDate').textContent = createdAt
      ? createdAt.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
      : '—';
    document.getElementById('accountName').textContent = profile.displayName || session.username;
  } catch (error) {
    console.error('Could not load account profile:', error);
    document.getElementById('accountDate').textContent = 'Không tải được';
  }
}

async function loadBalance() {
  try {
    const bal = await fetchBalance(session.username);
    document.getElementById('accountBalance').textContent = bal.toLocaleString('vi-VN') + 'đ';
  } catch {
    document.getElementById('accountBalance').textContent = 'Không kết nối';
  }
}
loadProfile();
loadBalance();

document.querySelectorAll('.pw-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    const show = target.type === 'password';
    target.type = show ? 'text' : 'password';
    btn.style.color = show ? 'var(--gold-bright)' : '';
  });
});

document.getElementById('passwordForm').addEventListener('submit', async event => {
  event.preventDefault();
  const statusEl = document.getElementById('passwordStatus');
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  statusEl.className = 'form-status';

  if (newPassword !== confirmPassword) {
    statusEl.textContent = 'Mật khẩu nhập lại chưa khớp.';
    statusEl.classList.add('err');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const result = await response.json();
    if (!response.ok) {
      statusEl.textContent = result.error === 'current password is incorrect'
        ? 'Mật khẩu hiện tại không đúng.'
        : result.error === 'password changes are not available for this account'
          ? 'Tài khoản này không hỗ trợ đổi mật khẩu tại đây.'
          : 'Không thể đổi mật khẩu. Vui lòng thử lại.';
      statusEl.classList.add('err');
      return;
    }
    statusEl.textContent = '✓ Đã đổi mật khẩu thành công.';
    statusEl.classList.add('ok');
    event.target.reset();
    showToast('Mật khẩu đã được cập nhật!');
  } catch (error) {
    console.error('Password change request failed:', error);
    statusEl.textContent = 'Không kết nối được máy chủ.';
    statusEl.classList.add('err');
  }
});
