# 🚀 LectureLens - Installazione Rapida

Ciao! Questo strumento ti aiuterà a trasformare i video delle tue lezioni in appunti strutturati e trascrizioni audio utilizzando l'intelligenza artificiale di Google Gemini.

## 🛠️ Requisiti Minimi
Assicurati di avere **Node.js** installato sul tuo computer. Puoi scaricarlo da [nodejs.org](https://nodejs.org/).

## ⚡ Avvio in un Click
Non c'è bisogno di scrivere comandi nel terminale:

### Se usi Windows:
1. Fai doppio clic sul file `avvia_windows.bat`.
2. La prima volta installerà automaticamente tutto il necessario.
3. L'app si aprirà nel tuo browser all'indirizzo `http://localhost:3000`.

### Se usi Mac o Linux:
1. Apri il terminale nella cartella del progetto.
2. Digita `chmod +x avvia_mac_linux.sh` (solo la prima volta).
3. Fai doppio clic sul file o digita `./avvia_mac_linux.sh`.

## 🔑 Configurazione API Key
Per far funzionare l'AI, avrai bisogno di una chiave API gratuita di Google Gemini:
1. Ottienila qui: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
2. Crea un file chiamato `.env` nella cartella principale (puoi copiare `.env.example`).
3. Incolla la tua chiave: `GEMINI_API_KEY=tua_chiave_qui`.

---
*Creato con ❤️ per chi studia e lavora.*
