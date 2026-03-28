import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { SubjectType, SUBJECT_CONFIG } from "../constants/SubjectConfig";
import { retry } from "../lib/utils";

export const analyzeShortVideo = async (
  apiKey: string,
  subjectType: SubjectType,
  videoFile: File,
  seed?: number
): Promise<{ transcription: string; notes: string }> => {
  const ai = new GoogleGenAI({ apiKey });
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
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("Errore nell'analisi del video. Riprova.");
  }
};

export const analyzeVideoWithFileApi = async (
  apiKey: string,
  subjectType: SubjectType,
  fileUri: string
): Promise<{ transcription: string; notes: string }> => {
  const ai = new GoogleGenAI({ apiKey });
  const config = SUBJECT_CONFIG[subjectType];

  const response: GenerateContentResponse = await retry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            fileData: {
              mimeType: "video/mp4",
              fileUri: fileUri,
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
    },
  }));

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("Errore nell'analisi del video. Riprova.");
  }
};

export const analyzeVideoThreePass = async (
  apiKey: string,
  subjectType: SubjectType,
  videoFile: File
): Promise<{ transcription: string; notes: string }> => {
  const results = await Promise.all([
    analyzeShortVideo(apiKey, subjectType, videoFile, 1),
    analyzeShortVideo(apiKey, subjectType, videoFile, 2),
    analyzeShortVideo(apiKey, subjectType, videoFile, 3),
  ]);

  // Merge results (simple concatenation for now, could be improved)
  const transcription = results.map(r => r.transcription).join('\n\n---\n\n');
  const notes = results.map(r => r.notes).join('\n\n---\n\n');

  // Final synthesis to merge and clean up
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      { text: `Hai analizzato la stessa lezione 3 volte. Ecco i risultati parziali:\n\n${notes}\n\nPer favore, unisci questi appunti in un unico documento coerente, eliminando le ripetizioni e includendo tutti i dettagli trovati in ciascuna analisi. Rispondi in formato JSON con la stessa struttura.` }
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
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini synthesis:", response.text);
    throw new Error("Errore nella sintesi finale. Riprova.");
  }
};

export const analyzeFramesInChunks = async (
  apiKey: string,
  frames: string[],
  onProgress: (msg: string) => void
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
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
  const ai = new GoogleGenAI({ apiKey });
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
    return JSON.parse(response.text || "{}");
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
  const ai = new GoogleGenAI({ apiKey });
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
  const ai = new GoogleGenAI({ apiKey });
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
  const ai = new GoogleGenAI({ apiKey });

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
      }
    }
  }));

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse key concepts:", response.text);
    return [];
  }
};

export const extractChineseWords = async (
  apiKey: string,
  imageFile: File
): Promise<{ word: string; pinyin: string; translation: string }[]> => {
  const ai = new GoogleGenAI({ apiKey });

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
          { text: "Analizza questa immagine e estrai tutti i caratteri cinesi o parole cinesi presenti. Per ogni parola, fornisci il carattere (o i caratteri), il pinyin e la traduzione in italiano. Rispondi solo in formato JSON con un array di oggetti {word: string, pinyin: string, translation: string}." },
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
  const ai = new GoogleGenAI({ apiKey });
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
