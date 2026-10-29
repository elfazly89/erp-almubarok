@echo off
title ERP Al Mubarok - Local Launcher
echo ========================================================
echo   Menjalankan ERP Al Mubarok (Backend + Frontend)
echo ========================================================
echo.

REM Deteksi lokasi Backend API
if exist "%~dp0erp-almubarok-api\package.json" (
    set "API_DIR=%~dp0erp-almubarok-api"
) else if exist "%~dp0..\erp-almubarok-api\package.json" (
    set "API_DIR=%~dp0..\erp-almubarok-api"
) else (
    echo [ERROR] Folder erp-almubarok-api tidak ditemukan!
    pause
    exit /b 1
)

REM Deteksi lokasi Frontend Next.js
if exist "%~dp0src\app\layout.tsx" (
    set "FRONTEND_DIR=%~dp0"
) else if exist "%~dp0erp-almubarok-nextjs\src\app\layout.tsx" (
    set "FRONTEND_DIR=%~dp0erp-almubarok-nextjs"
) else (
    echo [ERROR] Folder frontend Next.js tidak ditemukan!
    pause
    exit /b 1
)

REM Cek dan install node_modules Backend API jika belum ada
if not exist "%API_DIR%\node_modules" (
    echo [INFO] Menyiapkan dependensi Backend API [npm install]...
    pushd "%API_DIR%"
    call npm install
    popd
)

REM Cek dan install node_modules Frontend jika belum ada
if not exist "%FRONTEND_DIR%\node_modules" (
    echo [INFO] Menyiapkan dependensi Frontend Next.js [npm install]...
    pushd "%FRONTEND_DIR%"
    call npm install
    popd
)

echo [1/2] Menjalankan Backend Hono API (Port 3001)...
start "ERP API - Port 3001" /d "%API_DIR%" cmd /k "npm run dev"

echo Menunggu 2 detik...
ping 127.0.0.1 -n 3 > nul

echo [2/2] Menjalankan Frontend Next.js (Port 3000)...
start "ERP Frontend - Port 3000" /d "%FRONTEND_DIR%" cmd /k "npm run dev"

echo.
echo ========================================================
echo  Aplikasi sedang berjalan!
echo  - Frontend Web: http://localhost:3000
echo  - Backend API:  http://localhost:3001/api/status
echo ========================================================
echo Jendela Backend dan Frontend telah dibuka di jendela terpisah.
echo.
pause
