@echo off
setlocal
cd /d "%~dp0"

echo [CodeNest] Dang kiem tra Python...
where py >nul 2>nul
if %errorlevel%==0 set "PYTHON=py"&goto python_found
where python >nul 2>nul
if %errorlevel%==0 set "PYTHON=python"&goto python_found

echo Khong tim thay Python 3.
echo Cai Python tu https://www.python.org/downloads/ va chon "Add python.exe to PATH".
pause
exit /b 1

:python_found
echo [CodeNest] Cai/kiem tra thu vien...
%PYTHON% -m pip install -r requirements.txt
if %errorlevel% neq 0 (
  echo Khong cai duoc thu vien. Kiem tra ket noi mang.
  pause
  exit /b 1
)

if not exist .env (
  echo Chua co file .env. Hay copy .env.example thanh .env va dien token Telegram moi.
  start "" notepad .env.example
  pause
  exit /b 1
)

echo [CodeNest] Khoi dong backend tai http://127.0.0.1:5000 ...
start "CodeNest Backend" /min %PYTHON% backend.py
 timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:5000/"
echo Website da mo. Khong dong cua so backend neu dang su dung bot.
exit /b 0
