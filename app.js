const form = document.querySelector('#loginForm');
const musicScript = document.createElement('script');
musicScript.src = 'web-effects.js';
document.head.append(musicScript);
const loginEffectStyle = document.createElement('style');
loginEffectStyle.textContent = '.page-shell{position:relative;z-index:1}.page-shell::before{position:fixed;inset:0;z-index:-1;content:"";pointer-events:none;background:linear-gradient(180deg,transparent 0%,rgba(0,255,195,.045) 49%,transparent 51%);background-size:100% 190px;animation:loginScan 10s linear infinite}@keyframes loginScan{to{background-position:0 190px}}.login-card,.code-panel{animation-delay:.12s}.submit-button{animation:loginPulse 3s ease-in-out infinite}@keyframes loginPulse{50%{box-shadow:0 0 24px rgba(0,255,195,.22)}}@media(prefers-reduced-motion:reduce){.submit-button,.page-shell::before{animation:none}}';
document.head.append(loginEffectStyle);
const cursor = document.querySelector('.cursor');
const stars = document.querySelector('#stars');
const canvas = document.querySelector('#particles');
if (cursor) document.addEventListener('mousemove', (event) => { cursor.style.left = `${event.clientX}px`; cursor.style.top = `${event.clientY}px`; });
document.querySelectorAll('button').forEach((button) => {
	button.addEventListener('mouseenter', () => { if (cursor) { cursor.style.width = '54px'; cursor.style.height = '54px'; } });
	button.addEventListener('mouseleave', () => { if (cursor) { cursor.style.width = '24px'; cursor.style.height = '24px'; } });
});
if (stars) for (let index = 0; index < 100; index += 1) { const star = document.createElement('div'); star.className = 'star'; const size = Math.random() * 2 + 1; star.style.left = `${Math.random() * 100}%`; star.style.top = `${Math.random() * 100}%`; star.style.width = `${size}px`; star.style.height = `${size}px`; star.style.animationDelay = `${Math.random() * 4}s`; stars.append(star); }
if (canvas) {
	const context = canvas.getContext('2d');
	let particles = [];
	const resizeCanvas = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
	const createParticle = () => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 1.8 + .3, speedX: (Math.random() - .5) * .3, speedY: (Math.random() - .5) * .3, alpha: Math.random() });
	const animateParticles = () => { context.clearRect(0, 0, canvas.width, canvas.height); particles.forEach((particle) => { particle.x = (particle.x + particle.speedX + canvas.width) % canvas.width; particle.y = (particle.y + particle.speedY + canvas.height) % canvas.height; context.beginPath(); context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); context.fillStyle = `rgba(0,255,195,${particle.alpha})`; context.shadowBlur = 10; context.shadowColor = '#00ffc3'; context.fill(); }); requestAnimationFrame(animateParticles); };
	resizeCanvas(); window.addEventListener('resize', resizeCanvas); particles = Array.from({ length: 110 }, createParticle); animateParticles();
}
const email = document.querySelector('#email');
const password = document.querySelector('#password');
const emailError = document.querySelector('#emailError');
const passwordError = document.querySelector('#passwordError');
const status = document.querySelector('#formStatus');
const toggle = document.querySelector('.toggle-password');
const cardKicker = document.querySelector('#cardKicker');
const cardTitle = document.querySelector('#cardTitle');
const cardSubtitle = document.querySelector('#cardSubtitle');
const emailLabel = document.querySelector('#emailLabel');
const signupPrompt = document.querySelector('#signupPrompt');
const accountsKey = 'codenest_accounts';
const adminAccount = { username: 'ADM', password: '0339171213a', role: 'admin' };
let signupMode = false;

function getAccounts() {
	let accounts = [];
	try {
		accounts = JSON.parse(localStorage.getItem(accountsKey)) || [];
	} catch {
		accounts = [];
	}
	if (!accounts.some((account) => account.username.toLowerCase() === adminAccount.username.toLowerCase())) {
		accounts.unshift(adminAccount);
		saveAccounts(accounts);
	}
	return accounts;
}

function saveAccounts(accounts) {
	localStorage.setItem(accountsKey, JSON.stringify(accounts));
}

function setSignupMode(enabled) {
	signupMode = enabled;
	email.value = '';
	password.value = '';
	cardKicker.textContent = enabled ? 'JOIN CODENEST' : 'WELCOME BACK';
	cardTitle.innerHTML = enabled ? 'Tạo tài khoản<span class="accent">.</span>' : 'Đăng nhập<span class="accent">.</span>';
	cardSubtitle.textContent = enabled ? 'Bắt đầu hành trình của bạn.' : 'Tiếp tục hành trình của bạn.';
	emailLabel.textContent = enabled ? 'Email' : 'Email hoặc tên đăng nhập';
	email.type = enabled ? 'email' : 'text';
	email.placeholder = enabled ? 'you@example.com' : 'you@example.com';
	signupPrompt.innerHTML = enabled ? 'Đã có tài khoản? <a href="#login">Đăng nhập →</a>' : 'Chưa có tài khoản? <a href="#signup">Tạo tài khoản →</a>';
}

signupPrompt.addEventListener('click', (event) => {
	if (event.target.tagName === 'A') {
		event.preventDefault();
		setSignupMode(!signupMode);
		clearMessages();
	}
});

function clearMessages() {
	emailError.textContent = '';
	passwordError.textContent = '';
	status.textContent = '';
}

toggle.addEventListener('click', () => {
	const show = password.type === 'password';
	password.type = show ? 'text' : 'password';
	toggle.textContent = show ? 'hide' : 'show';
});

form.addEventListener('submit', (event) => {
	event.preventDefault();
	clearMessages();
	let valid = true;
	if (signupMode ? !email.validity.valid : !email.value.trim()) { emailError.textContent = signupMode ? 'Vui lòng nhập email hợp lệ.' : 'Vui lòng nhập tài khoản.'; valid = false; }
	if (password.value.length < 6) { passwordError.textContent = 'Mật khẩu cần ít nhất 6 ký tự.'; valid = false; }
	if (!valid) return;

	const accounts = getAccounts();
	if (signupMode) {
		if (accounts.some((account) => account.username.toLowerCase() === email.value.trim().toLowerCase())) {
			emailError.textContent = 'Tài khoản này đã tồn tại.';
			return;
		}
		accounts.push({ username: email.value.trim(), password: password.value, role: 'user', createdAt: new Date().toISOString() });
		saveAccounts(accounts);
		sessionStorage.setItem('codenest_current_user', JSON.stringify({ username: email.value.trim(), role: 'user' }));
		window.location.href = 'store.html';
		return;
	}

	const username = email.value.trim();
	const account = username.toLowerCase() === adminAccount.username.toLowerCase() && password.value === adminAccount.password
		? adminAccount
		: accounts.find((item) => item.username.toLowerCase() === username.toLowerCase() && item.password === password.value);
	if (account) {
		sessionStorage.setItem('codenest_current_user', JSON.stringify({ username: account.username, role: account.role }));
		window.location.href = 'store.html';
	} else {
		status.textContent = 'Tài khoản hoặc mật khẩu không đúng.';
	}
});

[email, password].forEach((input) => input.addEventListener('input', clearMessages));