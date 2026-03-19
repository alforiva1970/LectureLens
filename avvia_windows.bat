@echo off
echo 🚀 LectureLens - Avvio Rapido per Windows
echo ---------------------------------------

:: Verifica se Node.js è installato
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js non è installato!
    echo 🛠️ Tento l'installazione automatica tramite winget...
    winget --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo 📦 Installazione di Node.js in corso...
        winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
        if %errorlevel% equ 0 (
            echo ✅ Node.js installato con successo!
            echo ⚠️ Per favore, chiudi questa finestra e riavvia 'avvia_windows.bat' per applicare le modifiche.
            pause
            exit /b
        )
    )
    echo ❌ Installazione automatica fallita.
    echo Per favore scarica Node.js manualmente da: https://nodejs.org/
    echo Scegli la versione "LTS" (Long Term Support).
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
