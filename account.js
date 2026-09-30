/* ============================================================
   account.js — Account page logic
   ============================================================ */

const session = JSON.parse(sessionStorage.getItem('cn_session') || 'null');
const ACCOUNTS_KEY = 'cn_accounts';

/* ── Fill profile info ── */
const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
const account  = accounts.find(a => a.username.toLowerCase() === session.username.toLowerCase());

document.getElementById('avatar').textContent      = session.username.charAt(0).toUpperCase();
document.getElementById('accountName').textContent = session.username;
document.getElementById('accountEmail').textContent= session.username;
document.getElementById('accountRole').textContent = session.role === 'admin' ? 'Quản trị viên' : 'Thành viên';

// Member since date
const createdAt = account?.createdAt ? new Date(account.createdAt) : null;
document.getElementById('accountDate').textContent = createdAt
  ? createdAt.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
  : '—';

/* ── Load balance ── */
async function loadBalance() {
  try {
    const bal = await fetchBalance(session.username);
    document.getElementById('accountBalance').textContent = bal.toLocaleString('vi-VN') + 'đ';
  } catch {
    document.getElementById('accountBalance').textContent = 'Không kết nối';
  }
}
loadBalance();

/* ── Password visibility toggles ── */
document.querySelectorAll('.pw-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    const show   = target.type === 'password';
    target.type  = show ? 'text' : 'password';
    btn.style.color = show ? 'var(--gold-bright)' : '';
  });
});

/* ── Password change ── */
document.getElementById('passwordForm').addEventListener('submit', e => {
  e.preventDefault();
  const statusEl = document.getElementById('passwordStatus');
  const current  = document.getElementById('currentPassword').value;
  const next     = document.getElementById('newPassword').value;
  const confirm  = document.getElementById('confirmPassword').value;

  statusEl.className = 'form-status';

  if (!account) {
    statusEl.textContent = 'Không tìm thấy tài khoản trong hệ thống.';
    statusEl.classList.add('err');
    return;
  }
  if (session.username.toUpperCase() === 'ADM') {
    statusEl.textContent = 'Không thể đổi mật khẩu admin từ đây.';
    statusEl.classList.add('err');
    return;
  }
  if (account.password !== current) {
    statusEl.textContent = 'Mật khẩu hiện tại không đúng.';
    statusEl.classList.add('err');
    return;
  }
  if (next.length < 6) {
    statusEl.textContent = 'Mật khẩu mới cần ít nhất 6 ký tự.';
    statusEl.classList.add('err');
    return;
  }
  if (next !== confirm) {
    statusEl.textContent = 'Mật khẩu nhập lại chưa khớp.';
    statusEl.classList.add('err');
    return;
  }

  account.password = next;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  statusEl.textContent = '✓ Đã đổi mật khẩu thành công.';
  statusEl.classList.add('ok');
  e.target.reset();
  showToast('Mật khẩu đã được cập nhật!');
});
