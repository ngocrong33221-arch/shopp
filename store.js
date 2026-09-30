/* ============================================================
   store.js — Product marketplace logic
   ============================================================ */

let customProducts = [];
const grid = document.getElementById('productGrid');
const statCount  = document.getElementById('statCount');
const resultCount= document.getElementById('resultCount');
const paymentModal = document.getElementById('paymentModal');
const paymentFile = document.getElementById('paymentFile');
const paymentPrice = document.getElementById('paymentPrice');
const paymentBalance = document.getElementById('paymentBalance');
const paymentAfter = document.getElementById('paymentAfter');
const paymentStatus = document.getElementById('paymentStatus');
const confirmPayment = document.getElementById('confirmPayment');
let selectedProduct = null;

const API_BASE = window.location.protocol === 'file:' ? 'http://127.0.0.1:5000' : window.location.origin;

/* Art color themes */
const artThemes = ['art-lime', 'art-blue', 'art-purple', 'art-orange'];
const artIcons  = ['&lt;/&gt;', '{ }', '( )', '#[]'];

function renderProducts(list) {
  grid.innerHTML = '';
  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-store">
        <div class="empty-icon">&lt;/&gt;</div>
        <h2>Chưa có sản phẩm</h2>
        <p>Admin đang chuẩn bị những bộ code đầu tiên.</p>
      </div>`;
    return;
  }
  list.forEach((product, i) => {
    const theme = artThemes[i % artThemes.length];
    const icon  = artIcons[i % artIcons.length];
    const card  = document.createElement('article');
    card.className = 'product-card';
    card.dataset.category = product.category || 'web';
    card.style.animationDelay = (i * 0.07) + 's';
    card.innerHTML = `
      <div class="product-art ${theme}">
        <div class="art-pattern"></div>
        <span class="art-code">${icon}</span>
      </div>
      <div class="product-meta">
        <span class="product-tag">${product.category || 'web'} · ${product.fileName || 'CODE FILE'}</span>
        <h2 class="product-name"></h2>
        <p class="product-desc"></p>
        <div class="product-bottom">
          <span class="product-price">${Number(product.price).toLocaleString('vi-VN')}đ</span>
          <button class="buy-btn" type="button" data-id="${product.id}">
            Mua
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
          </button>
        </div>
      </div>`;
    card.querySelector('.product-name').textContent = product.name;
    card.querySelector('.product-desc').textContent = product.description;
    card.querySelector('.buy-btn').addEventListener('click', () => openPayment(product));
    grid.append(card);
  });
  window.refreshHoverTargets?.();
}

/* Filter tabs */
document.querySelectorAll('.filter-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.filter-tab.active').classList.remove('active');
    btn.classList.add('active');
    const cat = btn.dataset.filter;
    const filtered = cat === 'all' ? customProducts : customProducts.filter(p => p.category === cat);
    resultCount.textContent = String(filtered.length).padStart(2, '0');
    renderProducts(filtered);
  });
});

function money(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

async function openPayment(product) {
  const session = JSON.parse(sessionStorage.getItem('cn_session') || 'null');
  if (!session?.username) { showToast('Vui lòng đăng nhập để mua file.'); return; }
  selectedProduct = product;
  paymentFile.textContent = `${product.name} · ${product.fileName || 'file sản phẩm'}`;
  paymentPrice.textContent = money(product.price);
  paymentBalance.textContent = 'Đang kiểm tra...';
  paymentAfter.textContent = '--';
  paymentStatus.textContent = '';
  paymentStatus.className = 'payment-status';
  confirmPayment.disabled = true;
  paymentModal.classList.add('show');
  paymentModal.setAttribute('aria-hidden', 'false');

  try {
    const response = await fetch(`${API_BASE}/api/balances/${encodeURIComponent(session.username)}`);
    if (!response.ok) throw new Error('balance failed');
    const data = await response.json();
    const balance = Number(data.amount || 0);
    paymentBalance.textContent = money(balance);
    paymentAfter.textContent = balance >= product.price ? money(balance - product.price) : 'Không đủ số dư';
    confirmPayment.disabled = balance < product.price;
    if (balance < product.price) {
      paymentStatus.textContent = `Bạn cần nạp thêm ${money(product.price - balance)} để mua file này.`;
      paymentStatus.classList.add('err');
    }
  } catch {
    paymentBalance.textContent = 'Không kiểm tra được';
    paymentStatus.textContent = 'Không thể kiểm tra số dư. Hãy thử lại.';
    paymentStatus.classList.add('err');
  }
}

function closePayment() {
  paymentModal.classList.remove('show');
  paymentModal.setAttribute('aria-hidden', 'true');
  selectedProduct = null;
}

async function confirmSelectedPurchase() {
  const product = selectedProduct;
  const session = JSON.parse(sessionStorage.getItem('cn_session') || 'null');
  if (!product || !session?.username) return;
  confirmPayment.disabled = true;
  paymentStatus.textContent = 'Đang xác nhận thanh toán...';
  paymentStatus.className = 'payment-status';
  const response = await fetch(`${API_BASE}/api/products/${encodeURIComponent(product.id)}/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: session.username }),
  });
  const data = await response.json();
  if (!response.ok) {
    paymentStatus.textContent = response.status === 402
      ? `Số dư không đủ. Hãy nạp thêm ${money(Number(data.price) - Number(data.balance))}.`
      : 'Không thể hoàn tất thanh toán.';
    paymentStatus.classList.add('err');
    confirmPayment.disabled = false;
    return;
  }
  closePayment();
  const link = document.createElement('a');
  link.href = `${API_BASE}/api/products/${encodeURIComponent(product.id)}/download`;
  link.download = product.fileName || 'code-file';
  document.body.append(link);
  link.click();
  link.remove();
  showToast(`✓ Đã mua và đang tải "${product.name}"...`);
}

document.getElementById('confirmPayment').addEventListener('click', () => {
  confirmSelectedPurchase().catch(() => {
    paymentStatus.textContent = 'Không thể kết nối máy chủ thanh toán.';
    paymentStatus.classList.add('err');
    confirmPayment.disabled = false;
  });
});
document.getElementById('closePayment').addEventListener('click', closePayment);
document.querySelector('[data-close-payment]').addEventListener('click', closePayment);
document.addEventListener('keydown', event => { if (event.key === 'Escape') closePayment(); });

async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE}/api/products`);
    if (!response.ok) throw new Error('products failed');
    customProducts = await response.json();
  } catch {
    customProducts = [];
    showToast('Không kết nối được máy chủ sản phẩm.');
  }
  const countStr = String(customProducts.length).padStart(2, '0');
  statCount.textContent = countStr;
  resultCount.textContent = countStr;
  renderProducts(customProducts);
}

loadProducts();
