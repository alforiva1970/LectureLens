import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Send, 
  Loader2, 
  MessageCircle, 
  Bot, 
  User,
  Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { askTutor } from '../services/GeminiAPI';
import { SubjectType } from '../constants/SubjectConfig';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface TutorChatProps {
  notes: string;
  subjectType: SubjectType;
  apiKey: string;
  initialMessages?: Message[];
  onMessagesChange?: (messages: Message[]) => void;
  onClose: () => void;
  academicContext?: string;
}

const TutorChat: React.FC<TutorChatProps> = ({ 
  notes, 
  subjectType, 
  apiKey, 
  initialMessages = [], 
  onMessagesChange, 
  onClose,
  academicContext = ""
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', parts: [{ text: input }] };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const fullContextNotes = academicContext 
        ? `${notes}\n\n[CONTESTO ACCADEMICO PRECEDENTE: L'utente ha già familiarità con i seguenti concetti: ${academicContext}]`
        : notes;
      const response = await askTutor(apiKey, subjectType, fullContextNotes, messages, input);
      const modelMessage: Message = { role: 'model', parts: [{ text: response }] };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Errore chat:", error);
      const errorMessage: Message = { role: 'model', parts: [{ text: "Spiacente, si è verificato un errore nella comunicazione con il tutor. Riprova." }] };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 no-print">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 w-full max-w-4xl h-[80vh] rounded-3xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-emerald-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg dark:text-white leading-tight">Tutor Accademico AI</h3>
              <p className="text-xs text-black/40 dark:text-white/40 font-medium">Chiedi chiarimenti sulla lezione</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors dark:text-white/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-zinc-50/50 dark:bg-zinc-900/50">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                <MessageCircle className="w-8 h-8" />
              </div>
              <p className="max-w-xs text-sm font-medium">Ciao! Sono il tuo tutor dedicato per questa lezione. Come posso aiutarti a comprendere meglio i concetti?</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === 'user' ? 'bg-emerald-500 text-white' : 'bg-purple-500 text-white'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-emerald-500 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-zinc-800 dark:text-white rounded-tl-none border border-black/5 dark:border-white/5'
                }`}>
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed">
                    <ReactMarkdown 
                      remarkPlugins={[remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {msg.parts[0].text}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5 rounded-tl-none shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900">
          <div className="relative flex items-center gap-3">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Fai una domanda sulla lezione..."
              className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-purple-500 transition-all dark:text-white"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-4 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-2xl transition-all shadow-lg shadow-purple-500/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-black/30 dark:text-white/30 font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            Powered by LectureLens AI
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TutorChat;
