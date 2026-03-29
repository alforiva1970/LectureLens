import React from 'react';
import { ArrowLeft, Languages } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-[#fcfcf9]/80 backdrop-blur-md border-b border-black/5">
      <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white">
              <Languages className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight font-sans">Siliceo Chinese</span>
          </div>
        </div>
      </div>
    </header>
  );
};
