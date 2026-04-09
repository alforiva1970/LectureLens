import React from 'react';
import { Upload } from 'lucide-react';
import { ChineseWord } from '../types';

interface UploadSectionProps {
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
  words: ChineseWord[];
  error?: string | null;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  handleFileUpload,
  loading,
  words,
  error
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-black/5">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5" /> Carica Appunti/Foto
      </h2>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileUpload} 
        className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" 
      />
      {loading && <p className="mt-4 text-red-600">Analisi in corso...</p>}
      {error && <p className="mt-4 text-red-600 font-medium">{error}</p>}
      
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Parole Registrate ({words.length})</h3>
        <ul className="space-y-2">
          {words.map((w, i) => (
            <li key={i} className="text-sm p-2 bg-zinc-100 rounded">
              {w.word} ({w.pinyin}) - {w.translation}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
