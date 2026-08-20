@echo off
echo 🚀 Agrofield2 - Déploiement automatique vers Cloudflare Pages
echo ================================================================
echo.

echo 1️⃣  Ajout des fichiers modifiés...
git add -A

echo.
echo 2️⃣  Commit des modifications...
git commit -m "feat: Marketplace images + Swipe fluide + Navigation mobile + Corrections UI"

echo.
echo 3️⃣  Push vers GitHub (déclenche le déploiement Cloudflare)...
git push origin main

echo.
echo ✅ Déploiement en cours sur https://agrofield2.pages.dev
echo.
echo ⏱️  Le déploiement prend environ 1-2 minutes.
echo 🔗 Vérifie l'avancement : https://dash.cloudflare.com/?to=/:account/pages/view/project/agrofield2/deployments
echo.
pause
