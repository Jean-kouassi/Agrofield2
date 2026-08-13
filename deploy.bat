@echo off
cd /d C:\Users\Kouassi\Desktop\Agrofield2

echo ============================================
echo  AgroField2 - Build & Deploy
echo ============================================
echo.

echo [1/2] Build en cours...
call npm run build > deploy_output.txt 2>&1
if %errorlevel% neq 0 (
    echo BUILD ECHEC - Voir deploy_output.txt
    type deploy_output.txt
    pause
    exit /b 1
)
echo Build OK!
echo.

echo [2/2] Deploiement Cloudflare Pages...
call npx wrangler pages deploy dist --project-name=agrofield2 --commit-dirty=true >> deploy_output.txt 2>&1
if %errorlevel% neq 0 (
    echo DEPLOIEMENT ECHEC - Voir deploy_output.txt
    type deploy_output.txt
    pause
    exit /b 1
)

echo.
echo ============================================
echo  DEPLOIEMENT REUSSI!
echo ============================================
echo.
echo Voir deploy_output.txt pour l'URL
echo.
type deploy_output.txt | findstr "Deployment complete"
echo.
pause