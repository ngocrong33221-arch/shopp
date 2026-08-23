const webEffectsScript = document.createElement('script');
webEffectsScript.src = 'web-effects.js';
document.head.append(webEffectsScript);

const session = JSON.parse(sessionStorage.getItem('codenest_current_user') || 'null');
if (!session) window.location.href = 'index.html';
const balanceKey = `codenest_balance_${session?.username || 'guest'}`;
const balanceElement = document.querySelector('#balance');
const status = document.querySelector('#walletStatus');
const transferCard = document.querySelector('#transferCard');
const transferAmount = document.querySelector('#transferAmount');
const transferContent = document.querySelector('#transferContent');
const bankQr = document.querySelector('#bankQr');
const transferDetails = document.querySelector('.transfer-details');
const countdown = document.createElement('span');
countdown.innerHTML = 'Hiệu lực <b id="transferCountdown">10:00</b>';
transferDetails.append(countdown);
const countdownElement = countdown.querySelector('#transferCountdown');
const selected = { amount: 0 };
const orderDuration = 10 * 60 * 1000;
let expiryTimer;
document.querySelector('#walletUser').textContent = session?.username || 'USER';
const adminLink = document.querySelector('#adminLink');
if (session?.role === 'admin') adminLink.hidden = false;
const accountLink = document.createElement('a');
accountLink.href = 'account.html';
accountLink.textContent = 'Tài khoản';
document.querySelector('.topbar nav').append(accountLink);
function installNavLight() { const nav = document.querySelector('.topbar nav'); if (!nav) return; const style = document.createElement('style'); style.textContent = '.topbar nav{position:relative}.nav-light{position:absolute;bottom:-29px;left:0;width:30px;height:5px;overflow:visible;pointer-events:none;transition:transform .45s cubic-bezier(.2,.8,.2,1),width .45s}.nav-light rect{fill:#b9f36b;filter:drop-shadow(0 0 5px #6ee7ff)}.topbar nav a{position:relative;transition:color .3s}'; document.head.append(style); const light = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); light.classList.add('nav-light'); light.innerHTML = '<rect id="core" x="0" y="2" width="30" height="2" rx="1"></rect>'; nav.append(light); const active = nav.querySelector('a.active'); if (active) { light.style.width = `${active.offsetWidth}px`; light.style.transform = `translateX(${active.offsetLeft}px)`; } }
installNavLight();
async function updateBalance() { try { const response = await fetch(`http://127.0.0.1:5000/api/balances/${encodeURIComponent(session.username)}`); if (!response.ok) throw new Error('Balance request failed'); const data = await response.json(); localStorage.setItem(balanceKey, data.amount); balanceElement.textContent = `${Number(data.amount).toLocaleString('vi-VN')}đ`; } catch { balanceElement.textContent = `${Number(localStorage.getItem(balanceKey) || 0).toLocaleString('vi-VN')}đ`; } }
document.querySelectorAll('.amount-grid button').forEach((button) => { button.addEventListener('click', () => { document.querySelector('.amount-grid button.active')?.classList.remove('active'); button.classList.add('active'); selected.amount = Number(button.dataset.amount); }); });
function displayOrder(amount, content, expiresAt) { transferAmount.textContent = `${amount.toLocaleString('vi-VN')}đ`; transferContent.textContent = content; bankQr.src = `https://img.vietqr.io/image/MB-0832510710-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=DO%20THANH%20TRUNG`; transferCard.hidden = false; clearInterval(expiryTimer); expiryTimer = setInterval(() => { const remaining = expiresAt - Date.now(); if (remaining <= 0) { clearInterval(expiryTimer); countdownElement.textContent = 'HẾT HẠN'; status.textContent = 'Đơn đã hết hạn. Hãy tạo mã QR mới.'; bankQr.removeAttribute('src'); return; } countdownElement.textContent = `${String(Math.floor(remaining / 60000)).padStart(2, '0')}:${String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')}`; }, 1000); }
document.querySelector('#topupButton').addEventListener('click', async () => { if (!selected.amount) { status.textContent = 'Hãy chọn một mệnh giá.'; return; } status.textContent = 'Đang tạo đơn...'; const expiresAt = Date.now() + orderDuration; let content = `CN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; try { const response = await fetch('http://127.0.0.1:5000/api/topups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: session.username, amount: selected.amount }) }); if (!response.ok) throw new Error('Backend rejected order'); const order = await response.json(); content = order.content; status.textContent = order.telegram_sent ? 'Đã gửi đơn và thông báo Telegram cho admin.' : 'Đơn đã lưu nhưng Telegram chưa gửi được. Kiểm tra log backend.'; } catch { status.textContent = 'Backend chưa chạy; QR demo đã tạo, bot chưa nhận được đơn.'; } displayOrder(selected.amount, content, expiresAt); localStorage.setItem(`codenest_pending_topup_${session.username}`, JSON.stringify({ amount: selected.amount, content, createdAt: new Date().toISOString(), expiresAt, status: 'pending' })); });
document.querySelector('#logoutButton').addEventListener('click', () => { sessionStorage.removeItem('codenest_current_user'); window.location.href = 'index.html'; });
updateBalance();
