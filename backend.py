import os
import secrets
import sqlite3
import ssl
import uuid
from datetime import datetime, timezone
from urllib.parse import urlencode
import threading
import json
import time
from urllib.request import Request, urlopen

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_file, send_from_directory
from werkzeug.utils import secure_filename

load_dotenv()
app = Flask(__name__)
WEB_ROOT = os.path.dirname(os.path.abspath(__file__))
UPLOADS_ROOT = os.path.join(WEB_ROOT, 'uploads')
DATABASE_PATH = os.getenv('DATABASE_PATH', 'codenest.sqlite3')
TELEGRAM_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_ADMIN_CHAT_ID', '8592672929')
ADMIN_APPROVAL_KEY = os.getenv('ADMIN_APPROVAL_KEY')
TELEGRAM_CA_BUNDLE = os.getenv('TELEGRAM_CA_BUNDLE')
TELEGRAM_ALLOW_INSECURE_TLS = os.getenv('TELEGRAM_ALLOW_INSECURE_TLS', '').lower() == 'true'


@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Admin-Key'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    return response


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def db():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    os.makedirs(UPLOADS_ROOT, exist_ok=True)
    with db() as connection:
        connection.execute('''
            CREATE TABLE IF NOT EXISTS topups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                amount INTEGER NOT NULL,
                content TEXT UNIQUE NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                bank_reference TEXT,
                created_at TEXT NOT NULL,
                approved_at TEXT
            )
        ''')
        connection.execute('''
            CREATE TABLE IF NOT EXISTS balances (
                username TEXT PRIMARY KEY,
                amount INTEGER NOT NULL DEFAULT 0
            )


        ''')
        connection.execute('''
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                price INTEGER NOT NULL,
                category TEXT NOT NULL,
                file_name TEXT NOT NULL,
                stored_name TEXT NOT NULL UNIQUE,
                content_type TEXT,
                file_size INTEGER NOT NULL,
                created_at TEXT NOT NULL
            )
        ''')


def telegram_ssl_context():
    if TELEGRAM_CA_BUNDLE:
        return ssl.create_default_context(cafile=TELEGRAM_CA_BUNDLE)
    if TELEGRAM_ALLOW_INSECURE_TLS:
        app.logger.warning('Telegram TLS verification is disabled; configure TELEGRAM_CA_BUNDLE when possible.')
        return ssl._create_unverified_context()
    return ssl.create_default_context()


def telegram_message(text):
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        app.logger.warning('Telegram is not configured; message was not sent.')
        return False


    payload = urlencode({'chat_id': TELEGRAM_CHAT_ID, 'text': text}).encode()
    url = f'https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage'
    try:
        request_object = Request(url, data=payload, method='POST')
        with urlopen(request_object, timeout=10, context=telegram_ssl_context()) as response:
            return response.status == 200
    except ssl.SSLCertVerificationError:
        app.logger.error('Telegram TLS certificate verification failed. Configure TELEGRAM_CA_BUNDLE with a trusted CA certificate or fix the network proxy certificate.')
        return False
    except Exception:
        app.logger.exception('Telegram notification failed')
        return False


def telegram_api(method, params=None, timeout=10):
    if not TELEGRAM_TOKEN:
        return None
    request_object = Request(
        f'https://api.telegram.org/bot{TELEGRAM_TOKEN}/{method}',
        data=urlencode(params or {}).encode(),
        method='POST',
    )
    with urlopen(request_object, timeout=timeout, context=telegram_ssl_context()) as response:
        return json.loads(response.read().decode('utf-8'))


def approve_topup_by_content(content):
    with db() as connection:
        topup = connection.execute('SELECT * FROM topups WHERE content = ?', (content.upper(),)).fetchone()
        if not topup:
            return None, 'not_found'
        if topup['status'] == 'approved':
            return topup, 'already_approved'
        connection.execute(
            'UPDATE topups SET status = ?, approved_at = ? WHERE id = ?',
            ('approved', utc_now(), topup['id']),
        )
        connection.execute(
            'INSERT INTO balances(username, amount) VALUES (?, ?) '
            'ON CONFLICT(username) DO UPDATE SET amount = amount + excluded.amount',
            (topup['username'], topup['amount']),
        )
        return topup, 'approved'


def telegram_polling_loop():
    offset = None
    while True:
        try:
            params = {'timeout': 25}
            if offset is not None:
                params['offset'] = offset
            response = telegram_api('getUpdates', params, timeout=35) or {}
            for update in response.get('result', []):
                offset = update['update_id'] + 1
                telegram_handle_update(update)
        except Exception:
            app.logger.exception('Telegram polling failed')
            time.sleep(5)


def telegram_handle_update(update):
    message = update.get('message') or {}
    chat = message.get('chat') or {}
    if str(chat.get('id')) != str(TELEGRAM_CHAT_ID):
        return
    text = str(message.get('text', '')).strip()
    parts = text.split(maxsplit=1)
    command = parts[0].split('@', 1)[0].lower() if parts else ''
    if command in ('/start', '/trogiup', '/help'):
        telegram_message('Lệnh quản trị CodeNest:\n/duyet CN-XXXXXX - duyệt đơn theo mã\n/trogiup - xem hướng dẫn')
    elif command == '/duyet':
        if len(parts) != 2:
            telegram_message('Cú pháp đúng: /duyet CN-XXXXXX')
            return
        content = parts[1].strip().split()[0].upper()
        topup, result = approve_topup_by_content(content)
        if result == 'not_found':
            telegram_message(f'Không tìm thấy đơn có mã {content}.')
        elif result == 'already_approved':
            telegram_message(f'Đơn {content} đã được duyệt trước đó.')
        else:
            telegram_message(
                f'Đã duyệt đơn {content}.\nKhách hàng: {topup["username"]}\n'
                f'Số tiền: {topup["amount"]:,} VNĐ\nSố dư đã được cộng.'
            )


def make_content():
    return f'CN-{secrets.token_hex(3).upper()}'


@app.get('/')
def home():
    return send_from_directory(WEB_ROOT, 'index.html')




@app.get('/<path:filename>')
def frontend_file(filename):
    if filename.startswith('api/'):
        return jsonify({'error': 'not found'}), 404
    return send_from_directory(WEB_ROOT, filename)


@app.get('/api/health')
def health():
    return jsonify({'ok': True, 'telegram_configured': bool(TELEGRAM_TOKEN)})


@app.get('/api/products')
def list_products():
    with db() as connection:
        rows = connection.execute(
            'SELECT id, name, description, price, category, file_name AS fileName, '
            'file_size AS fileSize, created_at AS createdAt FROM products ORDER BY created_at DESC'
        ).fetchall()
    return jsonify([dict(row) for row in rows])


@app.post('/api/products')
def create_product():
    uploaded = request.files.get('file')
    if not uploaded or not uploaded.filename:
        return jsonify({'error': 'file is required'}), 400

    name = str(request.form.get('name', '')).strip()
    description = str(request.form.get('description', '')).strip()
    category = str(request.form.get('category', 'web')).strip() or 'web'
    try:
        price = int(request.form.get('price', '0'))
    except (TypeError, ValueError):
        price = 0
    if not name or not description or price < 1000:
        return jsonify({'error': 'name, description and price >= 1000 are required'}), 400

    original_name = uploaded.filename
    safe_name = secure_filename(original_name) or 'download'
    product_id = str(uuid.uuid4())
    stored_name = f'{product_id}-{safe_name}'
    stored_path = os.path.join(UPLOADS_ROOT, stored_name)
    uploaded.save(stored_path)
    file_size = os.path.getsize(stored_path)

    try:
        with db() as connection:
            connection.execute(
                'INSERT INTO products '
                '(id, name, description, price, category, file_name, stored_name, content_type, file_size, created_at) '
                'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                (product_id, name, description, price, category, original_name, stored_name,
                 uploaded.mimetype, file_size, utc_now()),
            )
    except Exception:
        if os.path.exists(stored_path):
            os.remove(stored_path)
        raise

    return jsonify({
        'id': product_id,
        'name': name,
        'description': description,
        'price': price,
        'category': category,
        'fileName': original_name,
        'fileSize': file_size,
    }), 201


@app.get('/api/products/<product_id>/download')
def download_product(product_id):
    with db() as connection:
        product = connection.execute(
            'SELECT stored_name, file_name, content_type FROM products WHERE id = ?',
            (product_id,),
        ).fetchone()
    if not product:
        return jsonify({'error': 'product not found'}), 404
    file_path = os.path.join(UPLOADS_ROOT, product['stored_name'])
    if not os.path.isfile(file_path):
        return jsonify({'error': 'file not found'}), 404
    return send_file(
        file_path,
        as_attachment=True,
        download_name=product['file_name'],
        mimetype=product['content_type'] or 'application/octet-stream',
    )


@app.post('/api/products/<product_id>/purchase')
def purchase_product(product_id):
    data = request.get_json(silent=True) or {}
    username = str(data.get('username', '')).strip()
    if not username:
        return jsonify({'error': 'username is required'}), 400

    with db() as connection:
        product = connection.execute(
            'SELECT id, name, price FROM products WHERE id = ?', (product_id,)
        ).fetchone()
        if not product:
            return jsonify({'error': 'product not found'}), 404

        result = connection.execute(
            'UPDATE balances SET amount = amount - ? '
            'WHERE username = ? AND amount >= ?',
            (product['price'], username, product['price']),
        )
        if result.rowcount != 1:
            balance = connection.execute(
                'SELECT amount FROM balances WHERE username = ?', (username,)
            ).fetchone()
            return jsonify({
                'error': 'insufficient_balance',
                'balance': balance['amount'] if balance else 0,
                'price': product['price'],
            }), 402

    return jsonify({
        'purchased': True,
        'productId': product['id'],
        'productName': product['name'],
        'price': product['price'],
    })


@app.delete('/api/products/<product_id>')
def delete_product(product_id):
    with db() as connection:
        product = connection.execute(
            'SELECT stored_name FROM products WHERE id = ?', (product_id,)
        ).fetchone()
        if not product:
            return jsonify({'error': 'product not found'}), 404
        connection.execute('DELETE FROM products WHERE id = ?', (product_id,))
    file_path = os.path.join(UPLOADS_ROOT, product['stored_name'])
    if os.path.isfile(file_path):
        os.remove(file_path)
    return jsonify({'deleted': True})


@app.get('/api/balances/<path:username>')
def get_balance(username):
    with db() as connection:
        row = connection.execute('SELECT amount FROM balances WHERE username = ?', (username,)).fetchone()
    return jsonify({'username': username, 'amount': row['amount'] if row else 0})


@app.post('/api/topups')
def create_topup():
    data = request.get_json(silent=True) or {}


    username = str(data.get('username', '')).strip()
    amount = data.get('amount')
    if not username or not isinstance(amount, int) or amount < 1000:
        return jsonify({'error': 'username and amount >= 1000 are required'}), 400

    content = make_content()
    created_at = utc_now()
    with db() as connection:
        connection.execute(
            'INSERT INTO topups(username, amount, content, created_at) VALUES (?, ?, ?, ?)',
            (username, amount, content, created_at),
        )
        topup_id = connection.execute('SELECT last_insert_rowid()').fetchone()[0]

    sent = telegram_message(
        f'ĐƠN NẠP TIỀN MỚI\n'
        f'Mã đơn: {content}\n'
        f'Khách hàng: {username}\n'
        f'Số tiền: {amount:,} VNĐ\n'
        f'Trạng thái: CHỜ DUYỆT\n\n'
        f'Duyệt đơn bằng lệnh:\n/duyet {content}'
    )
    return jsonify({'id': topup_id, 'amount': amount, 'content': content, 'status': 'pending', 'telegram_sent': sent}), 201


@app.post('/api/webhooks/bank')
def bank_webhook():
    data = request.get_json(silent=True) or {}
    content = str(data.get('content', '')).strip().upper()
    amount = data.get('amount')
    reference = str(data.get('reference', '')).strip()
    if not content or not isinstance(amount, int):
        return jsonify({'error': 'content and integer amount are required'}), 400

    with db() as connection:
        topup = connection.execute('SELECT * FROM topups WHERE content = ?', (content,)).fetchone()
        if not topup:
            telegram_message(f'GIAO DỊCH KHÔNG KHỚP\nSố tiền: {amount:,} VNĐ\nNội dung: {content}')
            return jsonify({'matched': False}), 404
        if topup['amount'] != amount:
            telegram_message(f'SAI SỐ TIỀN\nMã đơn: {topup["content"]}\nCần nhận: {topup["amount"]:,} VNĐ\nĐã nhận: {amount:,} VNĐ')
            return jsonify({'matched': True, 'status': 'amount_mismatch'}), 409
        connection.execute('UPDATE topups SET bank_reference = ? WHERE id = ?', (reference, topup['id']))

    telegram_message(f'ĐÃ NHẬN THANH TOÁN\nMã đơn: {topup["content"]}\nKhách hàng: {topup["username"]}\nSố tiền: {amount:,} VNĐ\nTrạng thái: CHỜ ADMIN DUYỆT\n\nDuyệt: /duyet {topup["content"]}')
    return jsonify({'matched': True, 'status': 'waiting_admin_approval'}), 200


@app.get('/api/admin/topups')
def list_topups():
    if request.headers.get('X-Admin-Key') != ADMIN_APPROVAL_KEY:
        return jsonify({'error': 'unauthorized'}), 401
    with db() as connection:
        rows = connection.execute('SELECT * FROM topups ORDER BY id DESC').fetchall()
    return jsonify([dict(row) for row in rows])


@app.post('/api/admin/topups/<int:topup_id>/approve')
def approve_topup(topup_id):
    if request.headers.get('X-Admin-Key') != ADMIN_APPROVAL_KEY:
        return jsonify({'error': 'unauthorized'}), 401
    with db() as connection:
        topup = connection.execute('SELECT content FROM topups WHERE id = ?', (topup_id,)).fetchone()
    if not topup:
        return jsonify({'error': 'topup not found'}), 404
    topup, result = approve_topup_by_content(topup['content'])
    if result == 'already_approved':
        return jsonify({'error': 'already approved'}), 409
    telegram_message(f'ĐÃ DUYỆT ĐƠN\nMã đơn: {topup["content"]}\nKhách hàng: {topup["username"]}\nSố tiền: {topup["amount"]:,} VNĐ')
    return jsonify({'approved': True, 'username': topup['username'], 'amount': topup['amount']})


init_db()

if TELEGRAM_TOKEN and TELEGRAM_CHAT_ID:
    threading.Thread(target=telegram_polling_loop, name='telegram-polling', daemon=True).start()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
