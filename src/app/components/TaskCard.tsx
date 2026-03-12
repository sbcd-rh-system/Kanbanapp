import { useDrag } from 'react-dnd';
import { Lock, Globe, Calendar, Link2, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { UserAvatar } from './UserAvatar';
import { SectorBadge } from './SectorBadge';
import { Task } from '../types';
import { getUserById, getSectorById } from '../data/mockData';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onViewConnections: (task: Task) => void;
}

export function TaskCard({ task, onEdit, onDelete, onViewConnections }: TaskCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const assignedUsers = task.assignedTo.map(id => getUserById(id)).filter(Boolean);
  const sector = getSectorById(task.sectorId);

  return (
    <div
      ref={(node) => { drag(node); }}
      className={isDragging ? 'opacity-40 scale-95' : 'opacity-100 transition-all duration-300'}
    >
      <Card
        className="cursor-pointer relative group overflow-hidden bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-2xl hover:shadow-black/20 rounded-2xl transition-all"
        id={`task-${task.id}`}
        onClick={() => onEdit(task)}
      >
        <div
          className="absolute -top-10 -right-10 w-24 h-24 blur-[50px] opacity-20 transition-opacity group-hover:opacity-40"
          style={{ backgroundColor: sector?.color || '#06b6d4' }}
        />
        <div
          className="absolute top-0 left-0 w-1 h-full opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: sector?.color || '#06b6d4' }}
        />

        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  {task.isPrivate ? (
                    <div className="p-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                      <Lock className="h-2.5 w-2.5 text-amber-500" />
                    </div>
                  ) : (
                    <div className="p-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                      <Globe className="h-2.5 w-2.5 text-emerald-500" />
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-base tracking-tight leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {task.title}
                </h4>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-xl border-white/10 rounded-xl p-1 shadow-2xl">
                <DropdownMenuItem onClick={() => onEdit(task)} className="rounded-lg focus:bg-white/5 cursor-pointer text-sm">Editar Tarefa</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewConnections(task)} className="rounded-lg focus:bg-white/5 cursor-pointer text-sm">
                  Ver Conexões
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(task.id)} className="rounded-lg focus:bg-destructive/10 focus:text-destructive cursor-pointer text-sm">
                  Deletar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0 space-y-4">
          <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-3">
            {task.description}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {task.tags.map(tag => (
              <Badge key={tag} className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 border-white/5 text-muted-foreground group-hover:border-white/10">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 mt-auto border-t border-white/[0.05]">
            <div className="flex -space-x-1.5">
              {assignedUsers.map((user, idx) => user && (
                <div
                  key={user.id}
                  className="ring-[3px] ring-background rounded-full transition-transform hover:scale-110 hover:z-10"
                  style={{ zIndex: 5 - idx }}
                >
                  <UserAvatar name={user.name} avatar={user.avatar} size="xs" />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50 italic mr-auto">
                <span>Por: {getUserById(task.createdBy)?.name.split(' ')[0] || 'Sistema'}</span>
                <span>•</span>
                <span>{new Date(task.createdAt).toLocaleDateString('pt-BR')} {new Date(task.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {task.connections.length > 0 && (
                <div
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: `${sector?.color}15`,
                    color: sector?.color,
                    border: `1px solid ${sector?.color}30`
                  }}
                >
                  <Link2 className="h-3 w-3" />
                  <span>{task.connections.length}</span>
                </div>
              )}
              {task.dueDate && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-white/[0.03] px-2 py-0.5 rounded-full border border-white/5">
                  <Calendar className="h-3 w-3 opacity-60" />
                  <span>{new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
