import { useState, useRef, useEffect, useCallback } from 'react';
import { Task } from '../types';
import { getSectorById } from '../data/mockData';

interface ConnectionGraphProps {
  task: Task;
  allTasks: Task[];
}

interface GraphNode {
  id: string;
  task: Task;
  x: number;
  y: number;
  color: string;
  isCenter: boolean;
  direction: 'outgoing' | 'incoming' | 'center';
}

interface GraphEdge {
  from: GraphNode;
  to: GraphNode;
  color: string;
  isIncoming: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  'todo': 'A Fazer',
  'in-progress': 'Em Andamento',
  'review': 'Em Revisão',
  'done': 'Concluído',
};

export function ConnectionGraph({ task, allTasks }: ConnectionGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const W = 680;
  const H = 400;
  const CX = W / 2;
  const CY = H / 2;

  const outgoingTasks = task.connections
    .map(id => allTasks.find(t => t.id === id))
    .filter(Boolean) as Task[];

  const incomingTasks = allTasks.filter(
    t => t.connections.includes(task.id) && !task.connections.includes(t.id)
  );

  const centerSector = getSectorById(task.sectorId);
  const centerColor = centerSector?.color || '#06b6d4';

  const buildNodes = (): GraphNode[] => {
    const centerNode: GraphNode = {
      id: task.id,
      task,
      x: CX,
      y: CY,
      color: centerColor,
      isCenter: true,
      direction: 'center',
    };

    const nodes: GraphNode[] = [centerNode];
    const allConnected = [
      ...outgoingTasks.map(t => ({ task: t, direction: 'outgoing' as const })),
      ...incomingTasks.map(t => ({ task: t, direction: 'incoming' as const })),
    ];

    const total = allConnected.length;
    if (total === 0) return nodes;

    const radius = Math.min(170, Math.max(110, total * 25));

    allConnected.forEach(({ task: t, direction }, i) => {
      const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
      const sector = getSectorById(t.sectorId);
      nodes.push({
        id: t.id,
        task: t,
        x: CX + radius * Math.cos(angle),
        y: CY + radius * Math.sin(angle),
        color: sector?.color || '#06b6d4',
        isCenter: false,
        direction,
      });
    });

    return nodes;
  };

  const nodes = buildNodes();
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  const buildEdges = (): GraphEdge[] => {
    const edges: GraphEdge[] = [];

    outgoingTasks.forEach(t => {
      const from = nodeMap.get(task.id);
      const to = nodeMap.get(t.id);
      if (from && to) edges.push({ from, to, color: centerColor, isIncoming: false });
    });

    incomingTasks.forEach(t => {
      const from = nodeMap.get(t.id);
      const to = nodeMap.get(task.id);
      if (from && to) edges.push({ from, to, color: from.color, isIncoming: true });
    });

    return edges;
  };

  const edges = buildEdges();

  const makePath = (from: GraphNode, to: GraphNode) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const cp1x = from.x + dx * 0.3 + dy * 0.15;
    const cp1y = from.y + dy * 0.3 - dx * 0.15;
    const cp2x = to.x - dx * 0.3 + dy * 0.15;
    const cp2y = to.y - dy * 0.3 - dx * 0.15;
    return `M ${from.x},${from.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${to.x},${to.y}`;
  };

  const truncate = (text: string, max = 20) =>
    text.length > max ? text.substring(0, max) + '…' : text;

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    });
  }, [isDragging]);

  const onMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const hasConnections = outgoingTasks.length > 0 || incomingTasks.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative rounded-2xl overflow-hidden border border-white/5"
        style={{ height: H, background: 'radial-gradient(ellipse at center, #0f1020 0%, #080808 100%)' }}
      >
        <svg
          width="100%"
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          onMouseDown={onMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
        >
          <defs>
            <pattern id="cg-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="14" cy="14" r="0.7" fill="white" opacity="0.05" />
            </pattern>
            {edges.map((_, i) => (
              <filter key={i} id={`cg-eglow-${i}`} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
                <feFlood floodColor={edges[i].color} floodOpacity="0.5" />
                <feComposite in2="blur" operator="in" result="g" />
                <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            ))}
            {nodes.map(n => (
              <filter key={n.id} id={`cg-nglow-${n.id}`} x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur in="SourceGraphic" stdDeviation={n.isCenter ? 10 : 6} result="blur" />
                <feFlood floodColor={n.color} floodOpacity="0.7" />
                <feComposite in2="blur" operator="in" result="g" />
                <feMerge><feMergeNode in="g" /><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            ))}
            {edges.map((e, i) => (
              <marker key={i} id={`cg-arr-${i}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 z" fill={e.color} opacity="0.85" />
              </marker>
            ))}
          </defs>

          <rect width={W} height={H} fill="url(#cg-grid)" />

          <g transform={`translate(${pan.x},${pan.y})`}>
            {edges.map((edge, i) => {
              const path = makePath(edge.from, edge.to);
              const isH = hoveredNode === edge.from.id || hoveredNode === edge.to.id;
              return (
                <g key={i}>
                  <path d={path} stroke={edge.color} strokeWidth="6" fill="none" opacity={isH ? 0.3 : 0.08} filter={`url(#cg-eglow-${i})`} />
                  <path
                    d={path}
                    stroke={edge.color}
                    strokeWidth={isH ? 2.5 : 1.5}
                    fill="none"
                    opacity={isH ? 1 : 0.45}
                    markerEnd={`url(#cg-arr-${i})`}
                    strokeLinecap="round"
                    strokeDasharray={edge.isIncoming ? '5,4' : undefined}
                  >
                    <animate attributeName="opacity" values={isH ? '0.9;1;0.9' : '0.35;0.55;0.35'} dur="3s" repeatCount="indefinite" />
                  </path>
                  <circle r="2.5" fill={edge.color} opacity="0.8">
                    <animateMotion dur={`${2.5 + i * 0.5}s`} repeatCount="indefinite" path={path} />
                    <animate attributeName="opacity" values="0;1;0" dur={`${2.5 + i * 0.5}s`} repeatCount="indefinite" />
                  </circle>
                </g>
              );
            })}

            {nodes.map(node => {
              const r = node.isCenter ? 26 : 17;
              const isH = hoveredNode === node.id;
              const dimmed = hoveredNode !== null && !isH ? 0.35 : 1;
              return (
                <g key={node.id} onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)} style={{ cursor: 'default' }}>
                  <circle cx={node.x} cy={node.y} r={r + 12} fill="none" stroke={node.color} strokeWidth="1" opacity="0">
                    <animate attributeName="r" values={`${r+6};${r+18};${r+6}`} dur="3.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.25;0;0.25" dur="3.5s" repeatCount="indefinite" />
                  </circle>
                  <circle
                    cx={node.x} cy={node.y}
                    r={isH ? r + 3 : r}
                    fill={node.color} fillOpacity={node.isCenter ? 0.22 : 0.15}
                    stroke={node.color} strokeWidth={node.isCenter ? 2.5 : 1.5}
                    strokeOpacity={isH ? 1 : 0.75}
                    filter={`url(#cg-nglow-${node.id})`}
                    opacity={dimmed}
                  />
                  <circle cx={node.x} cy={node.y} r={node.isCenter ? 5 : 3.5} fill={node.color} opacity={dimmed}>
                    <animate attributeName="r" values={node.isCenter ? '4;6;4' : '3;4.5;3'} dur="2.5s" repeatCount="indefinite" />
                  </circle>
                  {!node.isCenter && (
                    <text x={node.x} y={node.y - r - 5} textAnchor="middle" fontSize="8" fill={node.color} opacity={isH ? 0.9 : 0.4}>
                      {node.direction === 'outgoing' ? '→' : '←'}
                    </text>
                  )}
                  <text x={node.x} y={node.y + r + 15} textAnchor="middle" fontSize={node.isCenter ? 11 : 10} fontWeight={node.isCenter ? 'bold' : 'normal'} fill="white" opacity={isH ? 1 : dimmed * 0.75}>
                    {truncate(node.task.title, node.isCenter ? 24 : 18)}
                  </text>
                  {isH && (
                    <text x={node.x} y={node.y + r + 28} textAnchor="middle" fontSize="8" fill={node.color} opacity="0.9">
                      {STATUS_LABELS[node.task.status] || node.task.status}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          <g transform={`translate(10,${H - 50})`}>
            <rect width="148" height="46" rx="8" fill="black" fillOpacity="0.55" />
            <line x1="10" y1="14" x2="30" y2="14" stroke="#06b6d4" strokeWidth="1.5" />
            <circle r="2" cx="10" cy="14" fill="#06b6d4" />
            <circle r="2" cx="30" cy="14" fill="#06b6d4" />
            <text x="36" y="18" fontSize="9" fill="white" opacity="0.55">Saída (esta → outra)</text>
            <line x1="10" y1="32" x2="30" y2="32" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="5,3" />
            <circle r="2" cx="10" cy="32" fill="#a78bfa" />
            <circle r="2" cx="30" cy="32" fill="#a78bfa" />
            <text x="36" y="36" fontSize="9" fill="white" opacity="0.55">Entrada (outra → esta)</text>
          </g>
        </svg>

        {!hasConnections && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" opacity="0.2">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <p className="text-sm text-white opacity-30 font-medium">Nenhuma conexão definida</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-5 px-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary inline-block" />
          <strong className="text-foreground">{outgoingTasks.length}</strong>&nbsp;saída{outgoingTasks.length !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
          <strong className="text-foreground">{incomingTasks.length}</strong>&nbsp;entrada{incomingTasks.length !== 1 ? 's' : ''}
        </span>
        <span className="ml-auto opacity-30 italic">Arraste para navegar</span>
      </div>
    </div>
  );
}
