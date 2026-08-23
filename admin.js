const webEffectsScript = document.createElement('script');
webEffectsScript.src = 'web-effects.js';
document.head.append(webEffectsScript);

const session = JSON.parse(sessionStorage.getItem('codenest_current_user') || 'null');
if (!session || session.role !== 'admin') window.location.href = 'store.html';
document.querySelector('.admin-heading .eyebrow').textContent = 'KHU VỰC NGƯỜI BÁN';
document.querySelector('.admin-heading p:last-child').textContent = 'Đăng bán template, UI kit và hiệu ứng code để kiếm tiền từ sản phẩm bạn tạo ra.';
const accountLink = document.createElement('a');
accountLink.href = 'account.html';
accountLink.textContent = 'Tài khoản';
document.querySelector('.topbar nav').append(accountLink);
function installNavLight() { const nav = document.querySelector('.topbar nav'); if (!nav) return; const style = document.createElement('style'); style.textContent = '.topbar nav{position:relative}.nav-light{position:absolute;bottom:-29px;left:0;width:30px;height:5px;overflow:visible;pointer-events:none;transition:transform .45s cubic-bezier(.2,.8,.2,1),width .45s}.nav-light rect{fill:#b9f36b;filter:drop-shadow(0 0 5px #6ee7ff)}.topbar nav a{position:relative;transition:color .3s}'; document.head.append(style); const light = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); light.classList.add('nav-light'); light.innerHTML = '<rect id="core" x="0" y="2" width="30" height="2" rx="1"></rect>'; nav.append(light); const active = nav.querySelector('a.active'); if (active) { light.style.width = `${active.offsetWidth}px`; light.style.transform = `translateX(${active.offsetLeft}px)`; } }
installNavLight();
const form = document.querySelector('#productForm');
const fileInput = document.querySelector('#productFile');
const fileLabel = document.querySelector('#fileLabel');
const fileDrop = document.querySelector('.file-drop');
const status = document.querySelector('#formStatus');
const previewName = document.querySelector('#previewName');
const previewDescription = document.querySelector('#previewDescription');
const previewPrice = document.querySelector('#previewPrice');
const nameInput = document.querySelector('#productName');
const descriptionInput = document.querySelector('#productDescription');
const priceInput = document.querySelector('#productPrice');
const codeDatabase = 'codenest_code_files';
const allowedCodeExtensions = ['.zip', '.jar', '.html', '.css', '.js', '.json'];
fileInput.accept = '.zip,application/zip,application/x-zip-compressed,.jar,application/java-archive,.html,.css,.js,.json';
fileDrop.querySelector('small').textContent = 'ZIP, JAR, HTML, CSS, JS · không giới hạn dung lượng';
fileInput.style.display = 'none';
fileDrop.addEventListener('click', (event) => { event.preventDefault(); fileInput.click(); });
fileDrop.addEventListener('dragover', (event) => { event.preventDefault(); fileDrop.style.borderColor = '#b9f36b'; fileDrop.style.background = 'rgba(185,243,107,.08)'; });
fileDrop.addEventListener('dragleave', () => { fileDrop.style.borderColor = ''; fileDrop.style.background = ''; });
fileDrop.addEventListener('drop', (event) => { event.preventDefault(); fileDrop.style.borderColor = ''; fileDrop.style.background = ''; fileInput.files = event.dataTransfer.files; fileInput.dispatchEvent(new Event('change')); });
function saveCodeFile(id, file) {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(codeDatabase, 1);
		request.onupgradeneeded = () => request.result.createObjectStore('files');
		request.onsuccess = () => { const transaction = request.result.transaction('files', 'readwrite'); transaction.objectStore('files').put(file, id); transaction.oncomplete = resolve; transaction.onerror = () => reject(transaction.error); };
		request.onerror = () => reject(request.error);
	});
}
const inventory = document.createElement('section');
inventory.className = 'inventory-panel';
inventory.innerHTML = '<div class="inventory-heading"><div><p class="card-top">02 / YOUR PRODUCTS</p><h2>Sản phẩm đã đăng</h2></div><span id="productCount">0 sản phẩm</span></div><div class="product-inventory" id="productInventory"></div>';
document.querySelector('.admin-shell').append(inventory);
const productInventory = inventory.querySelector('#productInventory');
const productCount = inventory.querySelector('#productCount');

function renderInventory() {
	const products = JSON.parse(localStorage.getItem('codenest_products') || '[]');
	productCount.textContent = `${products.length} sản phẩm`;
	productInventory.innerHTML = products.length ? '' : '<div class="empty-inventory"><span>&lt;/&gt;</span><strong>Chưa có sản phẩm nào</strong><p>Sản phẩm bạn đăng sẽ xuất hiện ở đây.</p></div>';
	products.forEach((product, index) => {
		const item = document.createElement('article');
		item.className = 'inventory-item';
		item.innerHTML = `<div><span class="inventory-category">${product.category || 'web'} · ${product.fileName || 'CODE FILE'}</span><h3></h3><p></p></div><div class="inventory-actions"><strong>${Number(product.price).toLocaleString('vi-VN')}đ</strong><button type="button" aria-label="Xóa sản phẩm">Xóa</button></div>`;
		item.querySelector('h3').textContent = product.name;
		item.querySelector('p').textContent = product.description;
		item.querySelector('button').addEventListener('click', () => {
			if (!window.confirm(`Xóa sản phẩm "${product.name}"?`)) return;
			products.splice(index, 1);
			localStorage.setItem('codenest_products', JSON.stringify(products));
			renderInventory();
		});
		productInventory.append(item);
	});
}

fileInput.addEventListener('change', () => { const file = fileInput.files[0]; if (!file) { fileLabel.textContent = 'Chọn file code để tải lên'; return; } fileLabel.textContent = `${file.name} · đã nhận`; });
nameInput.addEventListener('input', () => { previewName.textContent = nameInput.value || 'Tên sản phẩm của bạn'; });
descriptionInput.addEventListener('input', () => { previewDescription.textContent = descriptionInput.value || 'Mô tả ngắn sẽ xuất hiện ở đây.'; });
priceInput.addEventListener('input', () => { previewPrice.textContent = `${Number(priceInput.value || 0).toLocaleString('vi-VN')}đ`; });
form.addEventListener('submit', async (event) => { event.preventDefault(); const file = fileInput.files[0]; const extension = file ? `.${file.name.split('.').pop().toLowerCase()}` : ''; if (!file) { status.textContent = 'Hãy chọn file code, có thể dùng file ZIP hoặc JAR.'; return; } if (!allowedCodeExtensions.includes(extension)) { status.textContent = 'Chỉ nhận file ZIP, JAR, HTML, CSS, JS hoặc JSON.'; return; } const product = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name: nameInput.value.trim(), description: descriptionInput.value.trim(), price: Number(priceInput.value), category: document.querySelector('#productCategory').value, fileName: file.name, createdAt: new Date().toISOString() }; const products = JSON.parse(localStorage.getItem('codenest_products') || '[]'); status.textContent = 'Đang nhận và lưu file code...'; try { await saveCodeFile(product.id, file); products.push(product); localStorage.setItem('codenest_products', JSON.stringify(products)); status.textContent = extension === '.zip' ? 'Đã nhận file ZIP và đăng sản phẩm thành công.' : extension === '.jar' ? 'Đã nhận file JAR và đăng sản phẩm thành công.' : 'Đã đăng sản phẩm và sẵn sàng cho người mua tải xuống.'; form.reset(); fileLabel.textContent = 'Chọn file code để tải lên'; renderInventory(); } catch { status.textContent = 'Không thể lưu file. Kiểm tra dung lượng trống của trình duyệt.'; } });
document.querySelector('#logoutButton').addEventListener('click', () => { sessionStorage.removeItem('codenest_current_user'); window.location.href = 'index.html'; });
renderInventory();
