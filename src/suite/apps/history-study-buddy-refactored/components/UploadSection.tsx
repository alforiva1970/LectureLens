import React from 'react';
import { Mic, Square, FileAudio, Camera, Loader2, CheckCircle2, Trash2, AlertCircle, X } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface UploadSectionProps {
  audioBlob: Blob | null;
  audioUrl: string | null;
  isRecording: boolean;
  isProcessing: boolean;
  recordingTime: number;
  sessionImages: string[];
  error: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSessionImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeSessionImage: (index: number) => void;
  processAudio: () => void;
  reset: () => void;
  formatTime: (seconds: number) => string;
}

export function UploadSection({
  audioBlob, audioUrl, isRecording, isProcessing, recordingTime, sessionImages, error,
  startRecording, stopRecording, handleFileUpload, handleSessionImageUpload, removeSessionImage,
  processAudio, reset, formatTime
}: UploadSectionProps) {
  return (
    <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
      <div className="flex flex-col md:flex-row items-center justify-center gap-6">
        {!audioBlob ? (
          <>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                "flex items-center gap-3 px-8 py-4 rounded-full font-bold transition-all duration-300 shadow-lg",
                isRecording 
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              )}
            >
              {isRecording ? (
                <>
                  <Square className="w-5 h-5 fill-current" />
                  Stop Registrazione ({formatTime(recordingTime)})
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Registra Lezione
                </>
              )}
            </button>

            <div className="flex items-center gap-4 text-slate-400">
              <span className="h-px w-8 bg-slate-200"></span>
              <span className="text-xs font-bold uppercase tracking-widest">oppure</span>
              <span className="h-px w-8 bg-slate-200"></span>
            </div>

            <label className="flex items-center gap-3 px-8 py-4 rounded-full font-bold bg-white border-2 border-slate-200 hover:border-amber-600 hover:text-amber-600 cursor-pointer transition-all duration-300">
              <FileAudio className="w-5 h-5" />
              Carica Registrazione
              <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
            </label>

            <label className="flex items-center gap-3 px-8 py-4 rounded-full font-bold bg-white border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 cursor-pointer transition-all duration-300">
              <Camera className="w-5 h-5" />
              Foto Lavagna/Appunti
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleSessionImageUpload} />
            </label>
          </>
        ) : (
          <div className="w-full flex flex-col items-center gap-6">
            <div className="w-full max-w-md bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <audio src={audioUrl!} controls className="w-full" />
            </div>
            
            {sessionImages.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {sessionImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img src={img} alt="Appunto" className="w-16 h-16 object-cover rounded-lg border border-slate-200" referrerPolicy="no-referrer" />
                    <button 
                      onClick={() => removeSessionImage(idx)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-4">
              <button
                onClick={processAudio}
                disabled={isProcessing}
                className="flex items-center gap-2 px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-bold disabled:opacity-50 transition-all shadow-md"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    L'IA sta studiando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Genera Appunti e Infografica
                  </>
                )}
              </button>
              
              <button
                onClick={reset}
                disabled={isProcessing}
                className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                title="Elimina e ricomincia"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </section>
  );
}
