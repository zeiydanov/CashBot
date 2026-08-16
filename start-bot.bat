@echo off
cd /d "C:\Users\zeyda\Documents\CashBot"

:START
echo CashBot baslatiliyor...
node index.js

echo.
echo CashBot kapandi. 10 saniye sonra tekrar baslatilacak...
timeout /t 10 /nobreak >nul

goto START