export interface ResearchResult {
  query: string;
  answer: string;
  sources: { title: string; uri: string }[];
  timestamp: number;
}
