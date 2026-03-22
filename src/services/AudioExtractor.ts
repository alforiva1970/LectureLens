import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export interface AudioExtractionProgress {
  message: string;
  percentage?: number;
}

export const extractAudio = async (
  videoFile: File, 
  onProgress: (progress: AudioExtractionProgress) => void
): Promise<string> => {
  onProgress({ message: "Inizializzazione motore audio (FFmpeg)..." });
  
  const ffmpeg = new FFmpeg();
  
  ffmpeg.on('log', ({ message }) => {
    console.log('FFmpeg log:', message);
  });

  ffmpeg.on('progress', ({ progress }) => {
    onProgress({ 
      message: `Compressione audio: ${Math.round(progress * 100)}%`,
      percentage: progress * 100
    });
  });

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  
  try {
    const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
    const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
    
    await ffmpeg.load({
      coreURL,
      wasmURL,
    });
  } catch (e) {
    console.error("Errore durante il caricamento di FFmpeg:", e);
    throw new Error("Impossibile caricare il motore audio. Riprova o usa un browser diverso.");
  }

  onProgress({ message: "Preparazione traccia audio..." });
  await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));

  onProgress({ message: "Estrazione e compressione audio in corso..." });
  // -vn: no video
  // -c:a libmp3lame: encode to mp3
  // -b:a 16k: 16kbps bitrate (very low, good for speech, saves payload size)
  // -ar 16000: 16kHz sample rate
  // -ac 1: mono
  await ffmpeg.exec([
    '-i', 'input.mp4',
    '-vn',
    '-c:a', 'libmp3lame',
    '-b:a', '16k',
    '-ar', '16000',
    '-ac', '1',
    'output.mp3'
  ]);

  onProgress({ message: "Lettura audio compresso..." });
  const data = await ffmpeg.readFile('output.mp3');
  
  // Cleanup
  await ffmpeg.deleteFile('input.mp4');
  await ffmpeg.deleteFile('output.mp3');

  // Convert Uint8Array to Base64 using Blob and FileReader for large arrays
  const blob = new Blob([data], { type: 'audio/mp3' });
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Errore nella conversione dell'audio."));
    reader.readAsDataURL(blob);
  });
};
