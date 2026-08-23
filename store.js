const webEffectsScript = document.createElement('script');
webEffectsScript.src = 'web-effects.js';
document.head.append(webEffectsScript);

const currentUser = JSON.parse(sessionStorage.getItem('codenest_current_user') || 'null');
const userBadge = document.querySelector('#userBadge');
const logoutButton = document.querySelector('#logoutButton');
const toast = document.querySelector('#toast');
const adminLink = document.querySelector('#adminLink');

if (!currentUser) {
  window.location.href = 'index.html';
} else {
  userBadge.textContent = currentUser.username;
  adminLink.hidden = currentUser.role !== 'admin';
}

function installNavLight() {
  const nav = document.querySelector('.topbar nav');
  if (!nav) return;
  const style = document.createElement('style');
  style.textContent = '.topbar nav{position:relative}.nav-light{position:absolute;bottom:-9px;left:0;z-index:2;width:30px;height:5px;overflow:visible;pointer-events:none;transition:transform .45s cubic-bezier(.2,.8,.2,1),width .45s}.nav-light rect{fill:#b9f36b;filter:drop-shadow(0 0 5px #6ee7ff)}.topbar nav a{position:relative;transition:color .3s}.topbar nav a.active{text-shadow:0 0 12px rgba(110,231,255,.55)}';
  document.head.append(style);
  const light = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  light.classList.add('nav-light');
  light.innerHTML = '<rect id="core" x="0" y="2" width="30" height="2" rx="1"></rect>';
  nav.append(light);
  const active = nav.querySelector('a.active');
  if (active) {
    light.style.width = `${active.offsetWidth}px`;
    light.style.transform = `translateX(${active.offsetLeft}px)`;
  }
}
installNavLight();

logoutButton.addEventListener('click', () => {
  sessionStorage.removeItem('codenest_current_user');
  window.location.href = 'index.html';
});

document.querySelectorAll('.filter').forEach((filterButton) => {
  filterButton.addEventListener('click', () => {
    document.querySelector('.filter.active').classList.remove('active');
    filterButton.classList.add('active');
    const category = filterButton.dataset.filter;
    document.querySelectorAll('.product-card').forEach((card) => {
      card.hidden = category !== 'all' && card.dataset.category !== category;
    });
  });
});

document.querySelectorAll('.buy-button').forEach((button) => {
  button.addEventListener('click', () => {
    toast.textContent = `${button.dataset.name} đã được thêm vào giỏ hàng.`;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 2600);
  });
});

const customProducts = JSON.parse(localStorage.getItem('codenest_products') || '[]');
function downloadCodeFile(product) {
  if (!product.id) { toast.textContent = 'File này chưa được lưu để tải xuống.'; toast.classList.add('show'); window.setTimeout(() => toast.classList.remove('show'), 2600); return; }
  const request = indexedDB.open('codenest_code_files', 1);
  request.onsuccess = () => { const transaction = request.result.transaction('files', 'readonly'); const fileRequest = transaction.objectStore('files').get(product.id); fileRequest.onsuccess = () => { if (!fileRequest.result) { toast.textContent = 'Không tìm thấy file code.'; toast.classList.add('show'); return; } const url = URL.createObjectURL(fileRequest.result); const link = document.createElement('a'); link.href = url; link.download = product.fileName || 'code-file'; link.click(); URL.revokeObjectURL(url); }; };
}
document.querySelector('.result-label b').textContent = String(customProducts.length).padStart(2, '0');
document.querySelector('.hero-stat strong').textContent = String(customProducts.length).padStart(2, '0');
if (!customProducts.length) {
  document.querySelector('#productGrid').innerHTML = '<div class="empty-store"><span>&lt;/&gt;</span><h2>Chưa có sản phẩm</h2><p>Admin đang chuẩn bị những bộ code đầu tiên.</p></div>';
}
customProducts.forEach((product) => {
  const card = document.createElement('article');
  card.className = 'product-card';
  card.dataset.category = product.category || 'web';
  card.innerHTML = `<div class="product-art custom-art"><span class="custom-file">&lt;/&gt;</span></div><div class="product-meta"><span class="tag">${product.fileName || 'CODE FILE'}</span><h2>${product.name}</h2><p>${product.description}</p><div class="product-bottom"><strong>${Number(product.price).toLocaleString('vi-VN')}đ</strong><button class="buy-button" type="button" data-name="${product.name}">Xem code <span>↗</span></button></div></div>`;
  document.querySelector('#productGrid').append(card);
  card.querySelector('.buy-button').textContent = 'Tải code ↘';
  card.querySelector('.buy-button').addEventListener('click', () => downloadCodeFile(product));
});
