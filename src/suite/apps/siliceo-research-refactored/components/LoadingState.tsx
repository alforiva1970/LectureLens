import React from 'react';
import { motion } from 'motion/react';
import { Globe } from 'lucide-react';

export const LoadingState: React.FC = () => {
  return (
    <motion.div 
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="py-20 text-center"
    >
      <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 font-bold text-sm mb-4 font-sans">
        <Globe className="w-4 h-4 animate-pulse" />
        Consultazione fonti globali...
      </div>
      <div className="space-y-4 max-w-md mx-auto">
        <div className="h-2 bg-black/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 10, ease: "linear" }}
            className="h-full bg-indigo-500"
          />
        </div>
        <p className="text-sm text-black/40 italic">Silex sta elaborando una sintesi accurata per te.</p>
      </div>
    </motion.div>
  );
};
