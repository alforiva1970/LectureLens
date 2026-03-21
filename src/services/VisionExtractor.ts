export interface VisionExtractionProgress {
  message: string;
  percentage?: number;
}

export const extractFrames = async (
  videoFile: File, 
  onProgress: (progress: VisionExtractionProgress) => void
): Promise<string[]> => {
  onProgress({ message: "Inizializzazione motore visivo..." });
  
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const frames: string[] = [];

  const videoURL = URL.createObjectURL(videoFile);
  video.src = videoURL;
  video.muted = true;
  video.playsInline = true;

  return new Promise<string[]>((resolve, reject) => {
    video.onloadedmetadata = async () => {
      const duration = video.duration;
      const numFrames = 60; // Sample 60 frames across the video
      const interval = duration / numFrames;

      canvas.width = 1280; // HD resolution for slide readability
      canvas.height = 720;

      for (let i = 0; i < numFrames; i++) {
        const time = i * interval;
        video.currentTime = time;

        await new Promise<void>((r) => {
          video.onseeked = () => {
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              // Progressive JPEG compression (0.8 quality) to balance quality and payload size
              const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
              frames.push(base64);
            }
            r();
          };
        });

        onProgress({ 
          message: `Analisi visiva: ${Math.round(((i + 1) / numFrames) * 100)}%`,
          percentage: ((i + 1) / numFrames) * 100
        });
      }

      URL.revokeObjectURL(videoURL);
      resolve(frames);
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoURL);
      reject(new Error("Errore nel caricamento del video."));
    };
  });
};
