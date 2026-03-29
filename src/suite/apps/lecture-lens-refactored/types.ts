import { SubjectType } from '../../../constants/SubjectConfig';

export interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface HistoryItem {
  id: string;
  name: string;
  date: string;
  result: { transcription: string; notes: string };
  chatHistory?: Message[];
  keyConcepts?: string[];
}

export interface ProcessingStep {
  message: string;
  percentage?: number;
}

export interface QueueItem {
  id: string;
  file: File;
  subjectType: SubjectType;
  extractFormulas: boolean;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: string;
  result?: { transcription: string; notes: string };
}
