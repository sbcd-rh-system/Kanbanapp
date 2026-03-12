import { useEffect, useState } from 'react';
import { getSectorById } from '../data/mockData';
import { tasks } from '../data/mockData';

interface ConnectionLineProps {
  fromTaskId: string;
  toTaskId: string;
  type?: 'dependency' | 'related' | 'blocks';
}

interface Position {
  x: number;
  y: number;
}

export function ConnectionLine({ fromTaskId, toTaskId, type = 'related' }: ConnectionLineProps) {
  const [fromPos, setFromPos] = useState<Position | null>(null);
  const [toPos, setToPos] = useState<Position | null>(null);

  useEffect(() => {
    const updatePositions = () => {
      const fromEl = document.getElementById(`task-${fromTaskId}`);
      const toEl = document.getElementById(`task-${toTaskId}`);

      if (fromEl && toEl) {
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        setFromPos({
          x: fromRect.right + scrollX,
          y: fromRect.top + fromRect.height / 2 + scrollY,
        });

        setToPos({
          x: toRect.left + scrollX,
          y: toRect.top + toRect.height / 2 + scrollY,
        });
      }
    };

    updatePositions();
    
    // Atualizar quando houver scroll ou resize
    window.addEventListener('scroll', updatePositions, true);
    window.addEventListener('resize', updatePositions);
    
    // Usar MutationObserver para detectar mudanças no DOM
    const observer = new MutationObserver(updatePositions);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    // Atualizar periodicamente para garantir
    const interval = setInterval(updatePositions, 100);

    return () => {
      window.removeEventListener('scroll', updatePositions, true);
      window.removeEventListener('resize', updatePositions);
      observer.disconnect();
      clearInterval(interval);
    };
  }, [fromTaskId, toTaskId]);

  if (!fromPos || !toPos) return null;

  // Obter cor do setor da tarefa de origem
  const fromTask = tasks.find(t => t.id === fromTaskId);
  const sector = fromTask ? getSectorById(fromTask.sectorId) : null;
  const color = sector?.color || '#06b6d4';

  // Calcular o caminho da linha com curva mais orgânica (estilo neurônio)
  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Controle de curva mais natural
  const curvature = 0.4;
  const cp1x = fromPos.x + distance * curvature;
  const cp1y = fromPos.y + dy * 0.2;
  const cp2x = toPos.x - distance * curvature;
  const cp2y = toPos.y - dy * 0.2;

  const path = `M ${fromPos.x},${fromPos.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${toPos.x},${toPos.y}`;
  
  // ID único para cada conexão
  const gradientId = `gradient-${fromTaskId}-${toTaskId}`;
  const glowId = `glow-${fromTaskId}-${toTaskId}`;

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        position: 'fixed',
        zIndex: 1,
      }}
    >
      <defs>
        {/* Gradiente para a linha */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.8" />
        </linearGradient>

        {/* Filtro de brilho/glow */}
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feFlood floodColor={color} floodOpacity="0.5" />
          <feComposite in2="blur" operator="in" result="softGlow" />
          <feMerge>
            <feMergeNode in="softGlow" />
            <feMergeNode in="softGlow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Marker para a seta */}
        <marker
          id={`arrowhead-${fromTaskId}-${toTaskId}`}
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M 0 0 L 8 4 L 0 8 z"
            fill={color}
            opacity="0.9"
          />
        </marker>
      </defs>

      {/* Linha de fundo (mais grossa) para o glow */}
      <path
        d={path}
        stroke={color}
        strokeWidth="4"
        fill="none"
        opacity="0.2"
        filter={`url(#${glowId})`}
      />

      {/* Linha principal */}
      <path
        d={path}
        stroke={`url(#${gradientId})`}
        strokeWidth="2.5"
        fill="none"
        opacity="0.9"
        markerEnd={`url(#arrowhead-${fromTaskId}-${toTaskId})`}
        strokeLinecap="round"
      >
        {/* Animação de pulso */}
        <animate
          attributeName="opacity"
          values="0.7;1;0.7"
          dur="2s"
          repeatCount="indefinite"
        />
      </path>

      {/* Nodos/círculos nas extremidades (estilo neurônio) */}
      <circle
        cx={fromPos.x}
        cy={fromPos.y}
        r="4"
        fill={color}
        opacity="0.9"
        filter={`url(#${glowId})`}
      >
        <animate
          attributeName="r"
          values="4;5;4"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>

      <circle
        cx={toPos.x}
        cy={toPos.y}
        r="4"
        fill={color}
        opacity="0.9"
        filter={`url(#${glowId})`}
      >
        <animate
          attributeName="r"
          values="4;5;4"
          dur="2s"
          repeatCount="indefinite"
          begin="1s"
        />
      </circle>

      {/* Partículas que viajam pela linha (efeito neural) */}
      <circle r="2" fill={color} opacity="0.8">
        <animateMotion
          dur="3s"
          repeatCount="indefinite"
          path={path}
        />
        <animate
          attributeName="opacity"
          values="0;1;0"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}