export interface TimelineItem {
  date: string;
  event: string;
}

export interface KeyFigure {
  name: string;
  role: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface InfographicData {
  title: string;
  timeline: TimelineItem[];
  key_figures: KeyFigure[];
  causes_consequences: {
    causes: string[];
    consequences: string[];
  };
  key_terms: { term: string; definition: string }[];
  quiz: QuizQuestion[];
  primary_figure: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
