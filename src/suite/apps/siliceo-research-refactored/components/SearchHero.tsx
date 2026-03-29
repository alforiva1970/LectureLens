import React from 'react';
import { motion } from 'motion/react';

export const SearchHero: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-12"
    >
      <h1 className="text-6xl font-light mb-6 leading-tight">
        Naviga il <span className="italic">sapere</span> universale.
      </h1>
      <p className="text-lg text-black/60 max-w-xl mx-auto mb-12 font-sans">
        Ricerca accademica potenziata dall'intelligenza artificiale e dai dati in tempo reale di Google Search.
      </p>
    </motion.div>
  );
};
