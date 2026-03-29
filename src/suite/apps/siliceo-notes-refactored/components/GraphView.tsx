import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { NoteNode, NoteLink } from '../types';

interface GraphViewProps {
  notes: NoteNode[];
  links: NoteLink[];
  activeNoteId: string | null;
  isLinkingMode: boolean;
  linkingSourceId: string | null;
  isDeleteMode: boolean;
  onNodeClick: (d: NoteNode) => void;
  onLinkClick: (d: NoteLink) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({
  notes,
  links,
  activeNoteId,
  isLinkingMode,
  linkingSourceId,
  isDeleteMode,
  onNodeClick,
  onLinkClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<NoteNode, NoteLink> | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation<NoteNode>(notes)
      .force('link', d3.forceLink<NoteNode, NoteLink>(links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        node
          .attr('transform', (d: any) => "translate(" + d.x + "," + d.y + ")");
      });

    simulationRef.current = simulation;

    const link = g.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 2)
      .attr('cursor', isDeleteMode ? 'pointer' : 'default')
      .on('click', (event, d) => onLinkClick(d));

    const node = g.append('g')
      .selectAll('g')
      .data(notes)
      .join('g')
      .attr('cursor', 'pointer')
      .on('click', (event, d) => onNodeClick(d))
      .call(d3.drag<SVGGElement, NoteNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    node.append('circle')
      .attr('r', 10)
      .attr('fill', d => {
        if (d.id === linkingSourceId) return '#f59e0b';
        if (d.id === activeNoteId) return '#10b981';
        return d.color || '#6366f1';
      })
      .attr('stroke', d => d.id === linkingSourceId ? '#fbbf24' : 'none')
      .attr('stroke-width', 3);

    node.append('text')
      .attr('dx', 15)
      .attr('dy', 4)
      .text(d => d.title)
      .attr('font-size', '12px')
      .attr('fill', '#666');

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [notes, links, activeNoteId, isLinkingMode, linkingSourceId, isDeleteMode, onNodeClick, onLinkClick]);

  return (
    <div className="flex-1 relative bg-white dark:bg-zinc-950">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute bottom-6 left-6 flex items-center gap-2">
        <div className="px-3 py-1.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-full text-xs font-bold text-black/40 dark:text-white/40 shadow-sm">
          Visualizzazione Grafo
        </div>
      </div>
    </div>
  );
};
