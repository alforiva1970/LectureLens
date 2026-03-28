# Protocollo di Sicurezza Siliceo (Hardening & Resilience)

Questo protocollo definisce le linee guida per la costruzione di applicazioni inattaccabili all'interno della Siliceo Suite.

## 1. Gestione File e Upload (History Study Buddy)
- **Gemini File API**: Abbandonare il chunking manuale in base64. Utilizzare `GoogleAIFileManager` per upload diretti.
- **Validazione Magic Bytes**: Non fidarsi mai del MIME type dichiarato. Utilizzare `file-type` lato server per validare la firma binaria del file.
- **Resilienza**: Implementare snapshotting dello stato in `IndexedDB` per permettere il resume dei caricamenti in caso di caduta connessione.

## 2. Trasporto Dati
- **Retry con Backoff Esponenziale**: Implementare meccanismi di retry per tutte le chiamate API (Gemini, database) per gestire errori 429/5xx.

## 3. Difesa contro Prompt Injection (Siliceo Research)
- **Double-Layer Sanitizer**:
    - Stadio 1: Raccolta dati.
    - Stadio 2: Scansione del contenuto tramite regex per pattern di iniezione (`ignore previous instructions`, `system override`, ecc.).
- **System Container**: Incapsulare le query in un blocco di istruzioni immutabili nel prompt di sistema per ancorare il modello al suo ruolo accademico.

## 4. Error Handling
- **Global Error Boundary**: Implementare `ErrorBoundary` in React per gestire errori in modo elegante e preservare il contesto utente.
