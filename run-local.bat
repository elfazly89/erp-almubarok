@echo off
title ERP Al Mubarok - Local Launcher
echo ========================================================
echo   Menjalankan ERP Al Mubarok (Backend + Frontend)
echo ========================================================
echo.

:: Deteksi lokasi Backend API
if exist "%~dp0erp-almubarok-api\package.json" (
    set "API_DIR=%~dp0erp-almubarok-api"
) else if exist "%~dp0..\erp-almubarok-api\package.json" (
    set "API_DIR=%~dp0..\erp-almubarok-api"
) else (
    echo [ERROR] Folder erp-almubarok-api tidak ditemukan!
    pause
    exit /b 1
)

:: Deteksi lokasi Frontend Next.js
if exist "%~dp0src\app\layout.tsx" (
    set "FRONTEND_DIR=%~dp0"
) else if exist "%~dp0erp-almubarok-nextjs\src\app\layout.tsx" (
    set "FRONTEND_DIR=%~dp0erp-almubarok-nextjs"
) else (
    echo [ERROR] Folder frontend Next.js tidak ditemukan!
    pause
    exit /b 1
)

echo [1/2] Menjalankan Backend Hono API (Port 3001)...
start "ERP API - Port 3001" cmd /k "cd /d %API_DIR% && npm run dev"

echo Menunggu 2 detik...
timeout /t 2 /nobreak > nul

echo [2/2] Menjalankan Frontend Next.js (Port 3000)...
start "ERP Frontend - Port 3000" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo ========================================================
echo  Aplikasi sedang berjalan!
echo  - Frontend Web: http://localhost:3000
echo  - Backend API:  http://localhost:3001/api/status
echo ========================================================
echo Jangan tutup jendela terminal Backend dan Frontend yang baru terbuka.
echo.
