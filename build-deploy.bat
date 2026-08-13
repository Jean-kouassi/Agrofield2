@echo off
REM === Script de build + deploiement AgroField2 ===
REM Usage: double-clic ou execute depuis le terminal

cd /d C:\Users\Kouassi\Desktop\Agrofield2

echo ========================================
echo   AgroField2 - Build + Deploy
echo ========================================
echo.

echo [1/2] Build...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo *** BUILD ECHEC ***
    pause
    exit /b 1
)
echo.
echo [2/2] Deploiement Cloudflare Pages...
call npx wrangler pages deploy dist --project-name=agrofield2 --commit-dirty=true
echo.
echo ========================================
echo   Termine! Copie l'URL ci-dessus.
echo ========================================
pause