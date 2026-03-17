import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useNavigate } from 'react-router';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { UserAvatar } from './UserAvatar';
import { User, Task } from '../types';
import { GripVertical } from 'lucide-react';

const GERENTE_COLORS: Record<string, { from: string; to: string; shadow: string }> = {
  zo3yaeowf: { from: '#6366f1', to: '#8b5cf6', shadow: '99, 102, 241' },   // Fernanda — índigo/violeta
  cb6e9qh4r: { from: '#ec4899', to: '#f43f5e', shadow: '236, 72, 153' },   // Vanessa — rosa/vermelho
  an3y10n6x: { from: '#10b981', to: '#06b6d4', shadow: '16, 185, 129' },   // Amanda — verde/ciano
  gdmyg9tor: { from: '#f59e0b', to: '#f97316', shadow: '245, 158, 11' },   // Jean — âmbar/laranja
};

const FALLBACK_COLORS = [
  { from: '#6366f1', to: '#8b5cf6', shadow: '99, 102, 241' },
  { from: '#ec4899', to: '#f43f5e', shadow: '236, 72, 153' },
  { from: '#10b981', to: '#06b6d4', shadow: '16, 185, 129' },
  { from: '#f59e0b', to: '#f97316', shadow: '245, 158, 11' },
];

const DRAG_TYPE = 'GERENTE_CARD';

interface Props {
  gerente: User;
  index: number;
  tasks: Task[];
  onMove: (fromIndex: number, toIndex: number) => void;
}

export function GerenteCard({ gerente, index, tasks, onMove }: Props) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  const color = GERENTE_COLORS[gerente.id] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];

  const pendingCount = tasks.filter(
    t => t.delegated_to === gerente.id && t.delegation_status === 'pending'
  ).length;
  const totalCount = tasks.filter(t => t.delegated_to === gerente.id).length;

  const [{ isDragging }, drag, preview] = useDrag({
    type: DRAG_TYPE,
    item: { index },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: DRAG_TYPE,
    hover(item: { index: number }) {
      if (item.index === index) return;
      onMove(item.index, index);
      item.index = index;
    },
    collect: monitor => ({ isOver: monitor.isOver() }),
  });

  drop(preview(ref));

  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.4 : 1 }} className="transition-opacity duration-150">
      <Card
        className="glass-card border-none cursor-pointer select-none transition-all duration-200 relative overflow-hidden"
        style={{
          transform: isOver ? 'scale(1.02)' : undefined,
          boxShadow: isOver ? `0 0 0 2px rgba(${color.shadow}, 0.5)` : undefined,
        }}
        onClick={() => navigate(`/chefe/gerente/${gerente.id}`)}
      >
        {/* Barra de cor no topo */}
        <div
          className="absolute top-0 left-0 w-full h-1 rounded-t-xl"
          style={{ background: `linear-gradient(to right, ${color.from}, ${color.to})` }}
        />

        <CardContent className="pt-5 pb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar com anel colorido */}
              <div
                className="rounded-full p-0.5 shrink-0"
                style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
              >
                <div className="rounded-full bg-background p-0.5">
                  <UserAvatar name={gerente.name} avatar={gerente.avatar} size="md" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight truncate">{gerente.name}</p>
                <p className="text-xs text-muted-foreground truncate">{gerente.cargo || 'Gerente'}</p>
              </div>
            </div>

            {/* Handle de arrastar */}
            <div
              ref={drag as any}
              onClick={e => e.stopPropagation()}
              className="cursor-grab active:cursor-grabbing p-1 rounded opacity-30 hover:opacity-70 transition-opacity shrink-0"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{totalCount} tarefa{totalCount !== 1 ? 's' : ''}</span>
            {pendingCount > 0 && (
              <Badge
                className="border-none text-xs h-5 font-semibold"
                style={{ backgroundColor: `rgba(${color.shadow}, 0.15)`, color: color.from }}
              >
                {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
