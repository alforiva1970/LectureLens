import * as d3 from 'd3';

export interface NoteNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  content: string;
  color?: string;
}

export interface NoteLink extends d3.SimulationLinkDatum<NoteNode> {
  source: string | NoteNode;
  target: string | NoteNode;
}

export interface DaemonInsight {
  type: 'research' | 'note';
  id: string;
  title: string;
  reason: string;
}
