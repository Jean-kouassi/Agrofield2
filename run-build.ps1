Set-Location C:\Users\Kouassi\Desktop\Agrofield2
npm run build 2>&1 | Tee-Object build-result.txt
Write-Output "BUILD_DONE"