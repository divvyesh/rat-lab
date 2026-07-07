import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { NetworkNode, Persona, PersonalSociety, TargetSociety } from '../types';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, AlertCircle } from 'lucide-react';

interface NetworkVisualizationProps {
  society: PersonalSociety | TargetSociety | null;
  personas: Persona[];
  onPersonaClick?: (personaId: string) => void;
}

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({
  society,
  personas,
  onPersonaClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!society || !society.network || society.network.length === 0) {
      return;
    }

    const svg = d3.select(svgRef.current);
    if (!svg.node()) return;

    // Clear previous render
    svg.selectAll('*').remove();

    // Error handling: Validate network data
    try {

    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    // Set up simulation
    const simulation = d3.forceSimulation(society.network as any)
      .force('link', d3.forceLink()
        .id((d: any) => d.id)
        .distance((d: any) => {
          // Distance based on connection strength
          return 100;
        })
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => (d.size || 20) + 5));

    // Create links based on mutual connections
    const links: Array<{ source: string; target: string; value: number }> = [];
    society.network.forEach(node => {
      node.connections?.forEach(connectedId => {
        links.push({
          source: node.id,
          target: connectedId,
          value: 1
        });
      });
    });

    // Create link elements
    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#6366f1')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 1);

    // Create node elements
    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(society.network)
      .enter()
      .append('circle')
      .attr('r', (d: any) => Math.max(5, Math.min(d.size || 20, 30)))
      .attr('fill', (d: any) => d.color || '#6366f1')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d: any) => {
        if (onPersonaClick) {
          onPersonaClick(d.personaId);
        }
      })
      .call(d3.drag<SVGCircleElement, NetworkNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any
      );

    // Add labels
    const labels = svg.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(society.network)
      .enter()
      .append('text')
      .text((d: any) => {
        const persona = personas.find(p => p.id === d.personaId);
        return persona?.name || `Node ${d.id}`;
      })
      .attr('font-size', 10)
      .attr('fill', '#fff')
      .attr('text-anchor', 'middle')
      .attr('dy', (d: any) => Math.max((d.size || 20) + 15, 25));

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      labels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
    } catch (error) {
      console.error('Error rendering network visualization:', error);
      // Show error message in SVG
      svg.append('text')
        .attr('x', '50%')
        .attr('y', '50%')
        .attr('text-anchor', 'middle')
        .attr('fill', '#ef4444')
        .text('Error rendering network');
    }
  }, [society, personas, onPersonaClick]);

  if (!society || !society.network || society.network.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-8 min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">No network data available</p>
          <p className="text-zinc-500 text-sm mt-2">
            Connect a social media account to visualize your network
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`bg-zinc-900/50 border border-white/5 rounded-xl relative ${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-[600px]'}`}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
          className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all"
          title="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
          className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all"
          title="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all"
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* Network Stats */}
      <div className="absolute top-4 left-4 z-10 bg-zinc-900/90 border border-white/10 rounded-lg p-3">
        <div className="text-xs text-zinc-400 space-y-1">
          <div>Nodes: {society.network.length}</div>
          <div>Connections: {society.network.reduce((sum, n) => sum + (n.connections?.length || 0), 0) / 2}</div>
          {society.personaIds && (
            <div>Personas: {society.personaIds.length}</div>
          )}
        </div>
      </div>

      {/* SVG Container */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ minHeight: '600px' }}
        className="bg-zinc-950 rounded-xl"
      />
    </div>
  );
};

export default NetworkVisualization;
