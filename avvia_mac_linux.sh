#!/bin/bash

echo "🚀 LectureLens - Avvio Rapido per Mac/Linux"
echo "------------------------------------------"

# Verifica se Node.js è installato
if ! command -v node &> /dev/null
then
    echo "❌ Node.js non è installato!"
    
    # Se siamo su Mac, proviamo con Homebrew
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            echo "🛠️ Tento l'installazione automatica tramite Homebrew..."
            brew install node@20
            if [ $? -eq 0 ]; then
                echo "✅ Node.js installato con successo!"
                echo "⚠️ Riavvia questo script per iniziare."
                exit
            fi
        fi
    fi

    echo "❌ Installazione automatica non riuscita."
    echo "Per favore scarica Node.js manualmente da: https://nodejs.org/"
    echo "Scegli la versione 'LTS' (Long Term Support)."
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
