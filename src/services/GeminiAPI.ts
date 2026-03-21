import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SubjectType, SUBJECT_CONFIG } from "../constants/SubjectConfig";

export const analyzeShortVideo = async (
  apiKey: string,
  subjectType: SubjectType,
  videoFile: File
): Promise<{ transcription: string; notes: string }> => {
  const ai = new GoogleGenAI({ apiKey });
  const config = SUBJECT_CONFIG[subjectType];

  // Convert file to base64
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(videoFile);
  });

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        parts: [
          { text: config.notesPrompt },
          {
            inlineData: {
              mimeType: videoFile.type,
              data: base64Data,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          transcription: { type: "string" },
          notes: { type: "string" },
        },
        required: ["transcription", "notes"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("Errore nell'analisi del video. Riprova.");
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

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
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
    });

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

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        parts: [
          { text: `Basandoti su questo contesto visivo:\n\n${visualContext}\n\nE su questo audio della lezione:\n\n${config.notesPrompt}` },
          {
            inlineData: {
              mimeType: "audio/mp3",
              data: audioBase64,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          transcription: { type: "string" },
          notes: { type: "string" },
        },
        required: ["transcription", "notes"],
      },
    },
  });

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

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      { text: `Basandoti su questi appunti:\n\n${notes}\n\nEsegui questo compito: ${config.quizPrompt}` }
    ],
  });

  return response.text || "Errore nella generazione del quiz.";
};

export const generateExtra = async (
  apiKey: string,
  subjectType: SubjectType,
  notes: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  const config = SUBJECT_CONFIG[subjectType];

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      { text: `Basandoti su questi appunti:\n\n${notes}\n\nEsegui questo compito: ${config.extraPrompt}` }
    ],
  });

  return response.text || "Errore nella generazione del contenuto extra.";
};

export const extractKeyConcepts = async (
  apiKey: string,
  notes: string
): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey });

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      { text: `Basandoti su questi appunti, estrai una lista di massimo 10 concetti chiave (parole o brevi frasi) che rappresentano il nucleo della lezione. Rispondi solo con un array JSON di stringhe.\n\nAppunti:\n\n${notes}` }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "array",
        items: { type: "string" }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse key concepts:", response.text);
    return [];
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
    model: "gemini-2.0-flash",
    config: {
      systemInstruction: `${config.tutorPersona}\n\nIl contesto della lezione è il seguente:\n\n${notes}`,
    },
    history: history,
  });

  const response = await chat.sendMessage({ message });
  return response.text || "Il tutor non ha risposto.";
};
