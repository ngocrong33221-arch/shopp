# Chay backend Telegram

1. Cai Python 3.11+.
2. Mo PowerShell tai thu muc nay.
3. Cai thu vien:

```powershell
py -m pip install -r requirements.txt
```

4. Tao file `.env` tu `.env.example` va dien token Telegram moi sau khi revoke token cu.
5. Chay server:

```powershell
py backend.py
```

Server chay tai `http://127.0.0.1:5000`.

## Tao don thu

Trang `wallet.html` se goi `POST /api/topups`, tao ma noi dung va gui Telegram cho admin.

## Webhook ngan hang

Cau hinh SePay/Casso goi `POST /api/webhooks/bank` voi JSON:

```json
{"amount": 100000, "content": "CN-ABC123", "reference": "bank-ref"}
```

Giao dich dung ma va dung tien se duoc danh dau cho admin duyet. Goi `POST /api/admin/topups/{id}/approve` voi header `X-Admin-Key` de cong tien.
