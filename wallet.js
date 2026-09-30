/* ============================================================
   wallet.js — Wallet page logic
   ============================================================ */

const session = JSON.parse(sessionStorage.getItem('cn_session') || 'null');

const balanceEl   = document.getElementById('balance');
const walletUser  = document.getElementById('walletUser');
const statusEl    = document.getElementById('walletStatus');
const transferCard= document.getElementById('transferCard');
const transferAmt = document.getElementById('transferAmount');
const transferCt  = document.getElementById('transferContent');
const bankQr      = document.getElementById('bankQr');
const countdownEl = document.getElementById('transferCountdown');
const refreshBtn  = document.getElementById('refreshBalance');

if (walletUser) walletUser.textContent = session?.username || 'USER';

let expiryTimer = null;
const selected = { amount: 0 };

/* ── Load balance ── */
async function loadBalance(animate = false) {
  if (refreshBtn) { refreshBtn.classList.add('spinning'); }
  let amt;
  try {
    amt = await fetchBalance(session.username);
  } catch {
    balanceEl.textContent = 'Không kết nối';
    if (refreshBtn) refreshBtn.classList.remove('spinning');
    return;
  }
  const formatted = amt.toLocaleString('vi-VN') + 'đ';
  if (animate && balanceEl.textContent !== formatted) {
    balanceEl.style.transition = 'opacity .2s';
    balanceEl.style.opacity = '0';
    setTimeout(() => { balanceEl.textContent = formatted; balanceEl.style.opacity = '1'; }, 200);
  } else {
    balanceEl.textContent = formatted;
  }
  if (refreshBtn) refreshBtn.classList.remove('spinning');
}

refreshBtn?.addEventListener('click', () => loadBalance(true));

/* ── Amount selection ── */
document.querySelectorAll('.amount-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.amount-btn.active')?.classList.remove('active');
    btn.classList.add('active');
    selected.amount = Number(btn.dataset.amount);
  });
});

/* ── Topup button ── */
document.getElementById('topupButton').addEventListener('click', async () => {
  if (!selected.amount) {
    statusEl.textContent = 'Hãy chọn một mệnh giá trước.';
    statusEl.className = 'form-status err';
    return;
  }
  statusEl.textContent = 'Đang tạo đơn nạp tiền...';
  statusEl.className = 'form-status ok';

  const expiresAt = Date.now() + 10 * 60 * 1000;
  let content = `CN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  try {
    const res = await fetch('http://127.0.0.1:5000/api/topups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: session.username, amount: selected.amount })
    });
    if (!res.ok) throw new Error();
    const order = await res.json();
    content = order.content;
    statusEl.textContent = order.telegram_sent ? 'Đã gửi đơn và thông báo admin.' : 'Đơn đã lưu, thông báo admin chưa được gửi.';
  } catch {
    statusEl.textContent = 'Backend chưa chạy — mã QR demo đã tạo.';
    statusEl.className = 'form-status err';
  }

  displayOrder(selected.amount, content, expiresAt);
  localStorage.setItem(`cn_pending_${session.username}`, JSON.stringify({ amount: selected.amount, content, expiresAt, status: 'pending' }));
});

function displayOrder(amount, content, expiresAt) {
  transferAmt.textContent = amount.toLocaleString('vi-VN') + 'đ';
  transferCt.textContent  = content;
  bankQr.src = `https://img.vietqr.io/image/MB-0832510710-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=DO%20THANH%20TRUNG`;
  transferCard.hidden = false;
  transferCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  clearInterval(expiryTimer);
  expiryTimer = setInterval(() => {
    const rem = expiresAt - Date.now();
    if (rem <= 0) {
      clearInterval(expiryTimer);
      countdownEl.textContent = 'HẾT HẠN';
      countdownEl.style.color = 'var(--err)';
      statusEl.textContent = 'Đơn đã hết hạn. Hãy tạo mã QR mới.';
      statusEl.className = 'form-status err';
      return;
    }
    const mm = String(Math.floor(rem / 60000)).padStart(2, '0');
    const ss = String(Math.floor((rem % 60000) / 1000)).padStart(2, '0');
    countdownEl.textContent = `${mm}:${ss}`;
  }, 1000);
}

loadBalance();
