#!/bin/bash

echo "🚀 LectureLens - Avvio Rapido per Mac/Linux"
echo "------------------------------------------"

# Verifica se Node.js è installato
if ! command -v node &> /dev/null
then
    echo "❌ Errore: Node.js non è installato!"
    echo "Per favore scaricalo da https://nodejs.org/"
    exit
fi

# Verifica se node_modules esiste, altrimenti installa
if [ ! -d "node_modules" ]; then
    echo "📦 Installazione dipendenze in corso (solo la prima volta)..."
    npm install
fi

echo "⚡ Avvio dell'applicazione..."
# Tenta di aprire il browser (funziona su Mac e molti Linux)
(sleep 3 && open http://localhost:3000 || xdg-open http://localhost:3000) &

npm run dev
