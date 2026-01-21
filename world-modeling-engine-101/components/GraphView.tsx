import React, { useLayoutEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Entity, Relationship } from '../types';

interface GraphViewProps {
  entities: Entity[];
  relationships: Relationship[];
  onSelectEntity: (entityId: string | null) => void;
  selectedEntityId: string | null;
}

const GraphView: React.FC<GraphViewProps> = ({ entities, relationships, onSelectEntity, selectedEntityId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!svgRef.current || !containerRef.current || entities.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    if (width === 0 || height === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Arrows
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 32)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 4)
      .attr('markerHeight', 4)
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#475569');

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (e) => g.attr('transform', e.transform));
    svg.call(zoom);

    const nodes = entities.map(d => ({ ...d, id: d.entity_id }));
    const links = relationships.map(d => ({ 
      source: d.from_entity_id, 
      target: d.to_entity_id,
      type: d.relationship_type,
      id: d.relationship_id
    })).filter(l => 
      nodes.find(n => n.id === l.source) && nodes.find(n => n.id === l.target)
    );

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(220))
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(100));

    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', (d: any) => d.type.includes('Temporal') ? '4,4' : '0')
      .attr('marker-end', 'url(#arrow)');

    const linkLabel = g.append('g')
      .selectAll('text')
      .data(links)
      .join('text')
      .attr('font-size', '7px')
      .attr('fill', '#475569')
      .attr('text-anchor', 'middle')
      .attr('class', 'font-mono uppercase font-bold tracking-[0.1em]')
      .text((d: any) => d.type.replace(/_/g, ' '));

    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'cursor-pointer')
      .call(d3.drag<any, any>()
        .on('start', (e, d) => {
          if (!e.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (e, d) => {
          d.fx = e.x; d.fy = e.y;
        })
        .on('end', (e, d) => {
          if (!e.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        })
      )
      .on('click', (e, d: any) => onSelectEntity(d.id));

    node.append('circle')
      .attr('r', 20)
      .attr('fill', (d: any) => {
        const types: any = { Person: '#3b82f6', Organization: '#10b981', Location: '#f59e0b', Asset: '#8b5cf6', System: '#ec4899', Product: '#06b6d4' };
        return types[d.entity_type] || '#475569';
      })
      .attr('fill-opacity', 0.15)
      .attr('stroke', (d: any) => {
        const types: any = { Person: '#3b82f6', Organization: '#10b981', Location: '#f59e0b', Asset: '#8b5cf6', System: '#ec4899', Product: '#06b6d4' };
        return d.id === selectedEntityId ? '#fff' : types[d.entity_type] || '#475569';
      })
      .attr('stroke-width', (d: any) => d.id === selectedEntityId ? 2 : 1.5);

    // Inner circle
    node.append('circle')
      .attr('r', 4)
      .attr('fill', (d: any) => {
        const types: any = { Person: '#3b82f6', Organization: '#10b981', Location: '#f59e0b', Asset: '#8b5cf6', System: '#ec4899', Product: '#06b6d4' };
        return types[d.entity_type] || '#475569';
      });

    node.append('text')
      .attr('y', 36)
      .attr('text-anchor', 'middle')
      .attr('fill', (d: any) => d.id === selectedEntityId ? '#fff' : '#94a3b8')
      .attr('font-size', '9px')
      .attr('class', 'font-sans font-black uppercase tracking-tighter')
      .text((d: any) => d.names[0]);

    node.append('text')
      .attr('y', 46)
      .attr('text-anchor', 'middle')
      .attr('fill', '#475569')
      .attr('font-size', '7px')
      .attr('class', 'font-mono uppercase tracking-widest')
      .text((d: any) => d.entity_type);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabel
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 8);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [entities, relationships, onSelectEntity, selectedEntityId]);

  return (
    <div ref={containerRef} className="w-full h-full bg-[#050507] rounded-3xl border border-white/[0.03] overflow-hidden relative shadow-2xl">
      <svg ref={svgRef} className="w-full h-full" />
      
      {/* HUD Elements */}
      <div className="absolute top-6 left-6 flex flex-col gap-1 pointer-events-none">
        <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 border border-white/5 rounded-lg text-[9px] font-mono tracking-[0.2em] text-indigo-400 uppercase font-black">
          Topology_Stream // Operational
        </div>
        <div className="text-[8px] font-mono text-slate-700 pl-1 uppercase">D3 Force Layout Enabled</div>
      </div>

      <div className="absolute bottom-6 left-6 grid gap-2 pointer-events-none">
        {[
          { color: 'bg-blue-500', label: 'Person' },
          { color: 'bg-emerald-500', label: 'Org' },
          { color: 'bg-amber-500', label: 'Loc' },
          { color: 'bg-purple-500', label: 'Asset' }
        ].map(legend => (
          <div key={legend.label} className="flex items-center gap-3">
             <div className={`w-1.5 h-1.5 rounded-full ${legend.color}`}></div>
             <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest">{legend.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GraphView;
