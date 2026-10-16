# Chay backend CodeNest

1. Cai Python 3.11+.
2. Mo PowerShell tai thu muc nay.
3. Cai thu vien:

```powershell
py -m pip install -r requirements.txt
```

4. Tao file `.env` tu `.env.example` neu chua co. Neu `.env` da ton tai, giu nguyen cac gia tri hien co va chi them cac khoa con thieu. Dien `FLASK_SECRET_KEY` bang chuoi ngau nhien (co the tao bang lenh `py -c "import secrets; print(secrets.token_hex(32))"`), dat `ADMIN_USERNAME` va `ADMIN_PASSWORD` bang tai khoan admin va mat khau manh rieng. Dien cac thong tin Google/GitHub OAuth neu muon bat dang nhap bang mang xa hoi.
5. Chay server:

```powershell
py backend.py
```

Server chay tai `http://127.0.0.1:5000`. Mo website bang dia chi nay, khong mo truc tiep `index.html`, vi luong OAuth can backend xu ly.

Tai khoan cu chi luu trong localStorage cua trinh duyet khong tu dong chuyen duoc sang co so du lieu; thanh vien can dang ky lai. Mat khau tai khoan moi chi duoc luu dang bam va khong the xem lai trong trang quan tri.

## Dang nhap Google va GitHub

- Google: tao OAuth Client ID loai Web application trong Google Cloud Console. Them Authorized redirect URI `http://127.0.0.1:5000/api/auth/google/callback`, sau do dien `GOOGLE_CLIENT_ID` va `GOOGLE_CLIENT_SECRET` vao `.env`.
- GitHub: tao OAuth App trong GitHub Developer settings. Dat Authorization callback URL la `http://127.0.0.1:5000/api/auth/github/callback`, sau do dien `GITHUB_CLIENT_ID` va `GITHUB_CLIENT_SECRET` vao `.env`.
- Neu chay tren domain khac, cap nhat redirect URI trong ca trang cai dat cua nha cung cap va `.env` (`GOOGLE_REDIRECT_URI`, `GITHUB_REDIRECT_URI`) cho khop chinh xac.
- Khi deploy HTTPS, dat `SESSION_COOKIE_SECURE=true` va su dung redirect URI HTTPS.
- Khong commit file `.env` hoac chia se Client Secret.

## Playlist SoundCloud

Mo player nhac o goc duoi trang, bam nut danh sach, tim mot bai tren SoundCloud va dan link bai cong khai de luu. Link da luu vao `codenest.sqlite3` va se hien cho cac khach truy cap website; cac bai co link se duoc chon ngau nhien khi vao trang. Ten bai goi y hien co chua phat duoc cho den khi co link SoundCloud tuong ung.

## Tao don thu

Trang `wallet.html` se goi `POST /api/topups`, tao ma noi dung va gui Telegram cho admin.

## Webhook ngan hang

Cau hinh SePay/Casso goi `POST /api/webhooks/bank` voi JSON:

```json
{"amount": 100000, "content": "CN-ABC123", "reference": "bank-ref"}
```

Giao dich dung ma va dung tien se duoc danh dau cho admin duyet. Goi `POST /api/admin/topups/{id}/approve` voi header `X-Admin-Key` de cong tien.
