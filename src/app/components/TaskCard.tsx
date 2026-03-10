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
    <Card
      ref={drag}
      className={`cursor-move transition-all hover:shadow-lg relative ${
        isDragging ? 'opacity-50' : 'opacity-100'
      } bg-card border-2`}
      style={{ borderColor: sector?.color || '#06b6d4' }}
      id={`task-${task.id}`}
    >
      {/* Borda superior colorida */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 rounded-t-md"
        style={{ backgroundColor: sector?.color || '#06b6d4' }}
      />
      
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              {task.isPrivate ? (
                <Lock className="h-3 w-3 text-amber-500 flex-shrink-0" />
              ) : (
                <Globe className="h-3 w-3 text-green-500 flex-shrink-0" />
              )}
              <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewConnections(task)}>
                Ver Conexões
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        
        <div className="flex flex-wrap gap-1">
          {task.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>

        <SectorBadge sectorId={task.sectorId} size="sm" />

        <div className="flex items-center justify-between pt-1">
          <div className="flex -space-x-2">
            {assignedUsers.map(user => user && (
              <UserAvatar key={user.id} name={user.name} avatar={user.avatar} size="sm" />
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {task.connections.length > 0 && (
              <div 
                className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                style={{ 
                  backgroundColor: `${sector?.color}20`,
                  color: sector?.color
                }}
              >
                <Link2 className="h-3 w-3" />
                <span>{task.connections.length}</span>
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}