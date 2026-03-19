@echo off
echo 🚀 LectureLens - Avvio Rapido per Windows
echo ---------------------------------------

:: Verifica se Node.js è installato
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Errore: Node.js non è installato! 
    echo Per favore scaricalo da https://nodejs.org/
    pause
    exit /b
)

:: Verifica se node_modules esiste, altrimenti installa
if not exist "node_modules\" (
    echo 📦 Installazione dipendenze in corso (solo la prima volta)...
    call npm install
)

echo ⚡ Avvio dell'applicazione...
start http://localhost:3000
call npm run dev

pause
