import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { SubjectType, SUBJECT_CONFIG } from "../constants/SubjectConfig";
import { retry } from "../lib/utils";

// Centralized initialization for GoogleGenAI.
const getGenAI = (apiKey: string) => {
  return new GoogleGenAI({ 
    apiKey,
    httpOptions: {
      baseUrl: 'https://generativelanguage.googleapis.com:443'
    }
  });
};

export const analyzeShortVideo = async (
  apiKey: string,
  subjectType: SubjectType,
  videoFile: File,
  seed?: number
): Promise<{ transcription: string; notes: string }> => {
  const ai = getGenAI(apiKey);
  const config = SUBJECT_CONFIG[subjectType];

  // Convert file to base64
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(videoFile);
  });

  const response: GenerateContentResponse = await retry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: videoFile.type,
              data: base64Data,
            },
          },
          { text: config.notesPrompt },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcription: { type: Type.STRING },
          notes: { type: Type.STRING },
        },
        required: ["transcription", "notes"],
      },
      seed: seed,
    },
  }));

  try {
    return robustParse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("Errore nell'analisi del video. Riprova.");
  }
};

export const uploadFileToGeminiBrowser = async (
  apiKey: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const mimeType = file.type || "application/octet-stream";
  
  console.log('--- STARTING UPLOAD TO GEMINI (VIA BACKEND PROXY) ---');
  console.log('File:', file.name, 'Size:', file.size, 'Type:', mimeType);
  
  try {
    if (!apiKey || apiKey.length < 10) {
      throw new Error("Chiave API non valida o troppo corta. Verifica la configurazione.");
    }

    if (onProgress) onProgress(10);

    const response = await fetch('/api/gemini/upload', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'x-mime-type': mimeType,
        'x-display-name': file.name,
        'Content-Type': mimeType // Important for express.raw
      },
      body: file // The browser streams the File object automatically
    });

    if (!response.ok) {
      let errorMsg = response.statusText;
      try {
        const errData = await response.json();
        errorMsg = errData.error || errorMsg;
      } catch (e) {
        // Ignore JSON parse error if response is not JSON
      }
      throw new Error(`Upload fallito dal backend: ${errorMsg}`);
    }

    const data = await response.json();
    if (onProgress) onProgress(100);
    
    if (!data.fileUri) {
      throw new Error('Upload riuscito ma URI del file non restituito dal backend.');
    }
    
    console.log('Upload successful, URI:', data.fileUri);
    return data.fileUri;

  } catch (error: any) {
    console.error('--- UPLOAD ERROR DIAGNOSTICS ---');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    
    if (error.message?.includes('API key not valid')) {
      throw new Error("La chiave API non è valida. Se stai usando l'app fuori da AI Studio, assicurati di aver inserito la tua chiave personale nel Setup Wizard (icona ingranaggio).");
    }
    if (error.message?.includes('quota')) {
      throw new Error("Quota API superata. I limiti gratuiti di Google sono stati raggiunti per oggi. Riprova più tardi o usa una chiave differente.");
    }
    if (error.message?.includes('PERMISSION_DENIED')) {
      throw new Error("Accesso negato: verifica che la tua chiave API abbia i permessi per le Generative Language API.");
    }
    
    throw error;
  }
};

/**
 * Polls the Gemini File API until the file is in an ACTIVE state.
 * This is necessary for large files (videos) which need processing time after upload.
 */
export const waitForFileActive = async (apiKey: string, fileUri: string): Promise<void> => {
  const genAI = getGenAI(apiKey);
  const fileName = fileUri.split('/').pop() || fileUri;
  const resourceName = fileName.startsWith('files/') ? fileName : `files/${fileName}`;
  
  console.log(`Waiting for file to become ACTIVE: ${resourceName}`);
  
  let attempts = 0;
  const maxAttempts = 240; // Wait up to 20 minutes (240 * 5s)
  
  while (attempts < maxAttempts) {
    try {
      const fileMetadata = await genAI.files.get({ name: resourceName });
      console.log(`File state: ${fileMetadata.state} (Attempt ${attempts + 1})`);
      
      if (fileMetadata.state === 'ACTIVE') {
        console.log('File is now ACTIVE and ready for processing.');
        return;
      }
      
      if (fileMetadata.state === 'FAILED') {
        console.error('File processing failed on Google servers. Metadata:', fileMetadata);
        throw new Error('File processing failed on Google servers.');
      }
    } catch (error: any) {
      console.error('Detailed error from genAI.files.get (Attempt ' + (attempts + 1) + '):', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      console.warn('Error checking file status (retrying):', error);
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks
  }
  
  throw new Error('Timeout waiting for file to become ACTIVE. Please try again.');
};

/**
 * Helper to parse potentially truncated or malformed JSON from Gemini.
 * If standard JSON.parse fails, it tries to fix common issues like missing closing braces.
 */
const robustParse = (text: string): any => {
  if (!text) return {};
  
  // Clean up potential markdown code blocks
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn("Standard JSON parse failed, attempting robust fix...", e);
    
    // Try to fix truncated JSON by adding missing closing braces/brackets
    let fixed = cleaned;
    
    // If it ends abruptly inside a string (odd number of quotes)
    const quoteCount = (fixed.match(/"/g) || []).length;
    const escapedQuoteCount = (fixed.match(/\\"/g) || []).length;
    if ((quoteCount - escapedQuoteCount) % 2 !== 0) {
      fixed += '"';
    }
    
    // Count opening and closing braces
    const openBraces = (fixed.match(/{/g) || []).length;
    const closeBraces = (fixed.match(/}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/]/g) || []).length;
    
    // If it ends with a comma, remove it
    if (fixed.endsWith(',')) fixed = fixed.slice(0, -1);
    
    // Add missing closers
    if (openBraces > closeBraces) {
      fixed += '}'.repeat(openBraces - closeBraces);
    }
    if (openBrackets > closeBrackets) {
      fixed += ']'.repeat(openBrackets - closeBrackets);
    }
    
    try {
      return JSON.parse(fixed);
    } catch (e2) {
      console.error("Robust parse failed as well. Original text:", text);
      
      // Last resort: regex extraction for specific fields
      const result: any = {};
      
      // More robust regex that handles truncated strings
      const extractField = (fieldName: string, source: string) => {
        const regex = new RegExp(`"${fieldName}"\\s*:\\s*"([\\s\\S]*?)(?:"|$)`);
        const match = source.match(regex);
        if (match) {
          return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }
        return null;
      };
      
      const notes = extractField('notes', text);
      const summary = extractField('summary', text);
      const transcription = extractField('transcription', text);
      
      if (notes) result.notes = notes;
      if (summary) result.summary = summary;
      if (transcription) result.transcription = transcription;
      
      if (Object.keys(result).length > 0) return result;
      
      throw e2;
    }
  }
};

export const analyzeVideoWithFileApi = async (
  apiKey: string,
  subjectType: SubjectType,
  fileUri: string,
  options?: { 
    extractFormulas?: boolean; 
    onStatusUpdate?: (status: string) => void;
    task?: 'notes' | 'summary' | 'transcription' | 'transcription_summary' | 'all';
    model?: string;
  }
): Promise<{ summary: string; transcription: string; notes: string }> => {
  const ai = getGenAI(apiKey);
  const config = SUBJECT_CONFIG[subjectType];

  if (options?.onStatusUpdate) options.onStatusUpdate("Elaborazione video in corso su server Google...");
  
  // CRITICAL: Wait for the file to be ACTIVE before processing
  await waitForFileActive(apiKey, fileUri);
  
  if (options?.onStatusUpdate) options.onStatusUpdate("Analisi della lezione in corso...");

  let promptText = config.notesPrompt;
  const task = options?.task || 'all';
  
  promptText += `\n\nATTENZIONE: DEVI RISPONDERE ESCLUSIVAMENTE NEL FORMATO TOON (Token-Oriented Object Notation). 
NON USARE JSON. NON USARE FORMATTAZIONI EXTRA.
Usa ESATTAMENTE questi delimitatori per separare le sezioni:
[RIASSUNTO]
(scrivi qui il riassunto)
[TRASCRIZIONE]
(scrivi qui la trascrizione)
[APPUNTI]
(scrivi qui gli appunti dettagliati)`;

  // Specializzazione del prompt in base al task richiesto
  if (task === 'notes') {
    promptText += `\n\nIl tuo obiettivo unico è la generazione degli APPUNTI (notes) più esaustivi e dettagliati possibile. 
Non tralasciare nulla: ogni concetto spiegato a voce, ogni schema disegnato alla lavagna e ogni slide mostrata deve essere documentata con rigore accademico. 
Se un argomento viene trattato per diversi minuti, i tuoi appunti devono essere proporzionalmente lunghi e approfonditi. 
Usa elenchi puntati, tabelle e sezioni per organizzare la complessità. 
Lascia vuote le sezioni [RIASSUNTO] e [TRASCRIZIONE].`;
  } else if (task === 'summary') {
    promptText += "\n\nConcentrati ESCLUSIVAMENTE sulla generazione del [RIASSUNTO]. Lascia vuote le altre sezioni.";
  } else if (task === 'transcription') {
    promptText += "\n\nConcentrati ESCLUSIVAMENTE sulla generazione della [TRASCRIZIONE]. Fornisci il testo integrale e fedele. Lascia vuote le altre sezioni.";
  } else if (task === 'transcription_summary') {
    promptText += "\n\nConcentrati ESCLUSIVAMENTE sulla generazione del [RIASSUNTO] e della [TRASCRIZIONE]. Fornisci il testo integrale e fedele della lezione e un riassunto concettuale. Lascia vuota la sezione [APPUNTI].";
  } else {
    promptText += `\n\nCompila TUTTE E TRE le sezioni ([RIASSUNTO], [TRASCRIZIONE], [APPUNTI]) con la massima precisione e dettaglio possibile.`;
  }

  if (options?.extractFormulas) {
    promptText += `\n\nNella sezione [APPUNTI], dedica una sottosezione "## Formule e Teoremi". 
Trascrivi ogni formula matematica, fisica o chimica usando la sintassi LaTeX (es. $$ E = mc^2 $$) e fornisci una spiegazione dettagliata per ciascuna formula o teorema estratto.`;
  }

  const response: GenerateContentResponse = await retry(() => ai.models.generateContent({
    model: options?.model || "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            fileData: {
              mimeType: "video/mp4",
              fileUri: fileUri,
            },
          },
          { text: promptText },
        ],
      },
    ],
    config: {
      temperature: 0.1,
      maxOutputTokens: 16384,
    },
  }), 3, 1000, options?.onStatusUpdate);

  try {
    const text = response.text || "";
    const summaryMatch = text.match(/\[RIASSUNTO\]([\s\S]*?)(?=\[TRASCRIZIONE\]|\[APPUNTI\]|$)/i);
    const transcriptionMatch = text.match(/\[TRASCRIZIONE\]([\s\S]*?)(?=\[RIASSUNTO\]|\[APPUNTI\]|$)/i);
    const notesMatch = text.match(/\[APPUNTI\]([\s\S]*?)(?=\[RIASSUNTO\]|\[TRASCRIZIONE\]|$)/i);

    return {
      summary: summaryMatch ? summaryMatch[1].trim() : "",
      transcription: transcriptionMatch ? transcriptionMatch[1].trim() : "",
      notes: notesMatch ? notesMatch[1].trim() : text.trim() // fallback
    };
  } catch (e) {
    console.error("Failed to parse Gemini TOON response:", response.text);
    throw new Error("Errore nell'analisi del video. Riprova.");
  }
};

export const analyzeVideoThreePass = async (
  apiKey: string,
  subjectType: SubjectType,
  fileUri: string,
  options?: { extractFormulas?: boolean; onStatusUpdate?: (status: string) => void }
): Promise<{ summary: string; transcription: string; notes: string }> => {
  if (options?.onStatusUpdate) options.onStatusUpdate("Avvio analisi ottimizzata (Passaggio 1/2)...");
  
  // CRITICAL: Wait for the file to be ACTIVE ONCE before starting
  await waitForFileActive(apiKey, fileUri);

  // Eseguiamo le analisi in modo SEQUENZIALE per evitare di superare la quota di token al minuto (429)
  if (options?.onStatusUpdate) options.onStatusUpdate("Estrazione Trascrizione e Riassunto (1/2)...");
  const transSumResult = await analyzeVideoWithFileApi(apiKey, subjectType, fileUri, { 
    ...options, 
    task: 'transcription_summary', 
    onStatusUpdate: undefined, 
    model: "gemini-3-flash-preview" 
  });
  
  if (options?.onStatusUpdate) options.onStatusUpdate("Estrazione Appunti Dettagliati (2/2)...");
  const notesResult = await analyzeVideoWithFileApi(apiKey, subjectType, fileUri, { 
    ...options, 
    task: 'notes', 
    onStatusUpdate: undefined, 
    model: "gemini-3-flash-preview" 
  });
  
  if (options?.onStatusUpdate) options.onStatusUpdate("Analisi completata con successo.");

  return {
    summary: transSumResult.summary || notesResult.summary || "",
    transcription: transSumResult.transcription || notesResult.transcription || "",
    notes: notesResult.notes || transSumResult.notes || ""
  };
};

export const analyzeFramesInChunks = async (
  apiKey: string,
  frames: string[],
  onProgress: (msg: string) => void
): Promise<string> => {
  const ai = getGenAI(apiKey);
  const chunkSize = 15; // Process 15 frames at a time
  let visualContext = "";

  for (let i = 0; i < frames.length; i += chunkSize) {
    const chunk = frames.slice(i, i + chunkSize);
    onProgress(`Analisi visiva profonda: ${Math.round((i / frames.length) * 100)}%`);

    const response: GenerateContentResponse = await retry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Descrivi dettagliatamente cosa vedi in questi frame di una lezione universitaria. Concentrati su slide, scritte alla lavagna e diagrammi. Sii molto tecnico e preciso." },
            ...chunk.map(frame => ({
              inlineData: {
                mimeType: "image/jpeg",
                data: frame,
              },
            })),
          ],
        },
      ],
    }));

    visualContext += (response.text || "") + "\n\n";
  }

  return visualContext;
};

export const generateNotesLongVideo = async (
  apiKey: string,
  subjectType: SubjectType,
  visualContext: string,
  audioBase64: string
): Promise<{ transcription: string; notes: string }> => {
  const ai = getGenAI(apiKey);
  const config = SUBJECT_CONFIG[subjectType];

  const response: GenerateContentResponse = await retry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "audio/mp3",
              data: audioBase64,
            },
          },
          { text: `Analizza questa lezione basandoti sul contesto visivo fornito e sull'audio allegato.\n\nCONTESTO VISIVO (descrizione dei frame):\n${visualContext}\n\nISTRUZIONI PER GLI APPUNTI:\n${config.notesPrompt}` },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcription: { type: Type.STRING },
          notes: { type: Type.STRING },
        },
        required: ["transcription", "notes"],
      },
    },
  }));

  try {
    return robustParse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("Errore nella sintesi finale. Riprova.");
  }
};

export const generateQuiz = async (
  apiKey: string,
  subjectType: SubjectType,
  notes: string
): Promise<string> => {
  const ai = getGenAI(apiKey);
  const config = SUBJECT_CONFIG[subjectType];

  const response: GenerateContentResponse = await retry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      { text: `Basandoti su questi appunti:\n\n${notes}\n\nEsegui questo compito: ${config.quizPrompt}` }
    ],
  }));

  return response.text || "Errore nella generazione del quiz.";
};

export const generateExtra = async (
  apiKey: string,
  subjectType: SubjectType,
  notes: string
): Promise<string> => {
  const ai = getGenAI(apiKey);
  const config = SUBJECT_CONFIG[subjectType];

  const response: GenerateContentResponse = await retry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      { text: `Basandoti su questi appunti:\n\n${notes}\n\nEsegui questo compito: ${config.extraPrompt}` }
    ],
  }));

  return response.text || "Errore nella generazione del contenuto extra.";
};

export const extractKeyConcepts = async (
  apiKey: string,
  notes: string
): Promise<string[]> => {
  const ai = getGenAI(apiKey);

  try {
    const response: GenerateContentResponse = await retry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { text: `Basandoti su questi appunti, estrai una lista di massimo 10 concetti chiave (parole o brevi frasi) che rappresentano il nucleo della lezione. Rispondi solo con un array JSON di stringhe.\n\nAppunti:\n\n${notes}` }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        maxOutputTokens: 1024,
      }
    }));

    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to extract key concepts:", e);
    return [];
  }
};

export const extractChineseWords = async (
  apiKey: string,
  imageFile: File
): Promise<{ word: string; pinyin: string; translation: string }[]> => {
  const ai = getGenAI(apiKey);

  // Convert file to base64
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(imageFile);
  });

  const response: GenerateContentResponse = await retry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: imageFile.type,
              data: base64Data,
            },
          },
          { text: "Analizza questa immagine ed estrai tutti i caratteri cinesi o parole cinesi presenti (sia scritti a mano che stampati). Per ogni parola o frase, fornisci il carattere (o i caratteri), il pinyin e la traduzione in italiano. Se non trovi nulla, restituisci un array vuoto." },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            pinyin: { type: Type.STRING },
            translation: { type: Type.STRING },
          },
          required: ["word", "pinyin", "translation"],
        },
      },
    },
  }));

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse Chinese words:", response.text);
    throw new Error("Errore nell'estrazione delle parole cinesi. Riprova.");
  }
};

export const askTutor = async (
  apiKey: string,
  subjectType: SubjectType,
  notes: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  message: string
): Promise<string> => {
  const ai = getGenAI(apiKey);
  const config = SUBJECT_CONFIG[subjectType];

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `${config.tutorPersona}\n\nIl contesto della lezione è il seguente:\n\n${notes}`,
    },
    history: history,
  });

  const response = await retry(() => chat.sendMessage({ message }));
  return response.text || "Il tutor non ha risposto.";
};
