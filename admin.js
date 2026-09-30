/* ============================================================
   admin.js — Admin page logic
   ============================================================ */

const session = JSON.parse(sessionStorage.getItem('cn_session') || 'null');
if (!session || session.role !== 'admin') navigate('store.html');

const form        = document.getElementById('productForm');
const fileInput   = document.getElementById('productFile');
const fileDrop    = document.getElementById('fileDrop');
const fileLabel   = document.getElementById('fileLabel');
const statusEl    = document.getElementById('formStatus');
const previewName = document.getElementById('previewName');
const previewDesc = document.getElementById('previewDescription');
const previewPrc  = document.getElementById('previewPrice');
const nameInput   = document.getElementById('productName');
const descInput   = document.getElementById('productDescription');
const priceInput  = document.getElementById('productPrice');

const API_BASE = window.location.protocol === 'file:' ? 'http://127.0.0.1:5000' : window.location.origin;

/* ── File drop zone ── */
fileDrop.addEventListener('dragover',  e => { e.preventDefault(); fileDrop.classList.add('dragover'); });
fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('dragover'));
fileDrop.addEventListener('drop', e => {
  e.preventDefault();
  fileDrop.classList.remove('dragover');
  fileInput.files = e.dataTransfer.files;
  fileInput.dispatchEvent(new Event('change'));
});
fileInput.addEventListener('change', () => {
  const f = fileInput.files[0];
  fileLabel.textContent = f ? `${f.name} · đã nhận` : 'Chọn hoặc kéo thả file code vào đây';
});

/* ── Live preview ── */
nameInput.addEventListener('input',  () => { previewName.textContent = nameInput.value  || 'Tên sản phẩm của bạn'; });
descInput.addEventListener('input',  () => { previewDesc.textContent = descInput.value  || 'Mô tả ngắn sẽ xuất hiện ở đây.'; });
priceInput.addEventListener('input', () => { previewPrc.textContent  = `${Number(priceInput.value || 0).toLocaleString('vi-VN')}đ`; });

/* ── Submit ── */
form.addEventListener('submit', async e => {
  e.preventDefault();
  const file = fileInput.files[0];
  if (!file) { statusEl.textContent = 'Hãy chọn file muốn đăng.'; statusEl.className = 'form-status err'; return; }

  const product = {
    id:          `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name:        nameInput.value.trim(),
    description: descInput.value.trim(),
    price:       Number(priceInput.value),
    category:    document.getElementById('productCategory').value,
    fileName:    file.name,
    createdAt:   new Date().toISOString()
  };

  const btn = document.getElementById('uploadBtn');
  btn.disabled = true;
  statusEl.textContent = 'Đang tải file lên máy chủ...';
  statusEl.className = 'form-status ok';

  try {
    const body = new FormData();
    body.append('name', product.name);
    body.append('description', product.description);
    body.append('price', String(product.price));
    body.append('category', product.category);
    body.append('file', file, file.name);
    const response = await fetch(`${API_BASE}/api/products`, { method: 'POST', body });
    if (!response.ok) throw new Error('upload failed');
    statusEl.textContent = '✓ Đã đăng sản phẩm thành công!';
    statusEl.className = 'form-status ok';
    form.reset();
    fileLabel.textContent = 'Chọn hoặc kéo thả file code vào đây';
    previewName.textContent = 'Tên sản phẩm của bạn';
    previewDesc.textContent = 'Mô tả ngắn sẽ xuất hiện ở đây.';
    previewPrc.textContent  = '0đ';
    showToast('Sản phẩm đã được đăng thành công!');
    renderInventory();
  } catch {
    statusEl.textContent = 'Không thể lưu file. Kiểm tra dung lượng trình duyệt.';
    statusEl.className = 'form-status err';
  } finally {
    btn.disabled = false;
  }
});

/* ── Render inventory ── */
async function renderInventory() {
  let products = [];
  try {
    const response = await fetch(`${API_BASE}/api/products`);
    if (!response.ok) throw new Error('products failed');
    products = await response.json();
  } catch {
    statusEl.textContent = 'Không kết nối được máy chủ. Hãy chạy backend trước.';
    statusEl.className = 'form-status err';
  }
  const inv   = document.getElementById('productInventory');
  const count = document.getElementById('productCount');
  count.textContent = `${products.length} sản phẩm`;
  inv.innerHTML = '';

  if (!products.length) {
    inv.innerHTML = `
      <div class="empty-inventory">
        <span>&lt;/&gt;</span>
        <strong>Chưa có sản phẩm nào</strong>
        <p>Sản phẩm bạn đăng sẽ xuất hiện ở đây.</p>
      </div>`;
    return;
  }

  products.forEach((p, i) => {
    const item = document.createElement('article');
    item.className = 'inventory-item';
    item.style.animationDelay = (i * .06) + 's';
    item.innerHTML = `
      <div class="inv-item-info">
        <span class="inv-cat">${p.category || 'web'} · ${p.fileName || 'CODE'}</span>
        <h3 class="inv-name"></h3>
        <p class="inv-desc"></p>
      </div>
      <div class="inv-actions">
        <span class="inv-price">${Number(p.price).toLocaleString('vi-VN')}đ</span>
        <button class="delete-btn" type="button">Xóa</button>
      </div>`;
    item.querySelector('.inv-name').textContent = p.name;
    item.querySelector('.inv-desc').textContent = p.description;
    item.querySelector('.delete-btn').addEventListener('click', () => {
      if (!confirm(`Xóa sản phẩm "${p.name}"?`)) return;
      fetch(`${API_BASE}/api/products/${encodeURIComponent(p.id)}`, { method: 'DELETE' })
        .then(response => {
          if (!response.ok) throw new Error('delete failed');
          showToast(`Đã xóa "${p.name}"`);
          renderInventory();
        })
        .catch(() => {
          statusEl.textContent = 'Không thể xóa sản phẩm trên máy chủ.';
          statusEl.className = 'form-status err';
        });
    });
    inv.append(item);
  });
  window.refreshHoverTargets?.();
}

renderInventory();
