const musicScript = document.createElement('script');
musicScript.src = 'web-effects.js';
document.head.append(musicScript);
const session = JSON.parse(sessionStorage.getItem('codenest_current_user') || 'null');
if (!session) window.location.href = 'index.html';
const selectionStyle = document.createElement('style');
selectionStyle.textContent = '*{user-select:none;-webkit-user-select:none}input,textarea{user-select:text;-webkit-user-select:text}';
document.head.append(selectionStyle);
const accountsKey = 'codenest_accounts';
const accounts = JSON.parse(localStorage.getItem(accountsKey) || '[]');
const account = accounts.find((item) => item.username.toLowerCase() === session.username.toLowerCase());
const balanceKey = `codenest_balance_${session.username}`;
document.querySelector('#avatar').textContent = session.username.charAt(0).toUpperCase();
document.querySelector('#accountName').textContent = session.username;
document.querySelector('#accountEmail').textContent = session.username;
document.querySelector('#accountRole').textContent = session.role === 'admin' ? 'Quản trị viên' : 'Thành viên';
async function updateAccountBalance() { try { const response = await fetch(`http://127.0.0.1:5000/api/balances/${encodeURIComponent(session.username)}`); if (!response.ok) throw new Error('Balance request failed'); const data = await response.json(); localStorage.setItem(balanceKey, data.amount); document.querySelector('#accountBalance').textContent = `${Number(data.amount).toLocaleString('vi-VN')}đ`; } catch { document.querySelector('#accountBalance').textContent = `${Number(localStorage.getItem(balanceKey) || 0).toLocaleString('vi-VN')}đ`; } }
updateAccountBalance();
document.querySelector('#passwordForm').addEventListener('submit', (event) => {
	event.preventDefault();
	const status = document.querySelector('#passwordStatus');
	const current = document.querySelector('#currentPassword').value;
	const next = document.querySelector('#newPassword').value;
	const confirm = document.querySelector('#confirmPassword').value;
	if (!account || account.password !== current) { status.textContent = 'Mật khẩu hiện tại không đúng.'; return; }
	if (next.length < 6) { status.textContent = 'Mật khẩu mới cần ít nhất 6 ký tự.'; return; }
	if (next !== confirm) { status.textContent = 'Mật khẩu nhập lại chưa khớp.'; return; }
	account.password = next;
	localStorage.setItem(accountsKey, JSON.stringify(accounts));
	status.textContent = 'Đã đổi mật khẩu thành công.';
	event.target.reset();
});
document.querySelector('#logoutButton').addEventListener('click', () => { sessionStorage.removeItem('codenest_current_user'); window.location.href = 'index.html'; });
