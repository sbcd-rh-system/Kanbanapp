import { useDrag } from 'react-dnd';
import { Lock, Globe, Calendar, Link2, MoreVertical, MessageSquare, Paperclip, AlertCircle, ArrowUp, ArrowDown, Minus, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { UserAvatar } from './UserAvatar';
import { Task } from '../types';
import { getUserById, getSectorById } from '../data/mockData';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onViewConnections: (task: Task) => void;
}

const priorityConfig = {
  low: { color: '#22c55e', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: ArrowDown, label: 'Baixa' },
  medium: { color: '#eab308', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: Minus, label: 'Média' },
  high: { color: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: ArrowUp, label: 'Alta' },
  critical: { color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertCircle, label: 'Crítica' },
};

export function TaskCard({ task, onEdit, onDelete, onViewConnections }: TaskCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { id: task.id, status: task.status, projectId: task.projectId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const assignedUsers = task.assignedTo.map(id => getUserById(id)).filter(Boolean);
  const sector = getSectorById(task.sectorId);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const priority = task.priority ? priorityConfig[task.priority] : null;
  const PriorityIcon = priority?.icon;

  return (
    <TooltipProvider>
      <div
        ref={(node) => { drag(node); }}
        className={isDragging ? 'opacity-40 scale-95' : 'opacity-100 transition-all duration-300'}
      >
        <Card
          className={`cursor-pointer relative group overflow-hidden bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-white/25 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-black/20 rounded-2xl transition-all ${isOverdue ? 'border-red-500/30' : ''}`}
          id={`task-${task.id}`}
          onClick={() => onEdit(task)}
        >
          {/* Efeito de glow no hover */}
          <div
            className="absolute -top-10 -right-10 w-28 h-28 blur-[60px] opacity-0 group-hover:opacity-30 transition-opacity duration-500"
            style={{ backgroundColor: sector?.color || '#06b6d4' }}
          />

          {/* Barra lateral de cor do setor */}
          <div
            className="absolute top-0 left-0 w-1 h-full opacity-60 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: sector?.color || '#06b6d4' }}
          />

          {/* Badge de prioridade */}
          {priority && (
            <div className={`absolute top-3 right-12 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${priority.bg} ${priority.border} border`}>
              <PriorityIcon className="h-3 w-3" style={{ color: priority.color }} />
              <span style={{ color: priority.color }}>{priority.label}</span>
            </div>
          )}

          {/* Badge de atraso */}
          {isOverdue && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse">
                  <AlertCircle className="h-3 w-3" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Vencida em {new Date(task.dueDate!).toLocaleDateString('pt-BR')}</p>
              </TooltipContent>
            </Tooltip>
          )}

          <CardHeader className="p-4 pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                {/* Linha superior: Privacidade + Título */}
                <div className="flex items-start gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`flex-shrink-0 p-1.5 rounded-lg ${task.isPrivate ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                        {task.isPrivate ? (
                          <Lock className="h-3 w-3 text-amber-500" />
                        ) : (
                          <Globe className="h-3 w-3 text-emerald-500" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{task.isPrivate ? 'Tarefa privada' : 'Tarefa pública'}</p>
                    </TooltipContent>
                  </Tooltip>

                  <h4 className="font-bold text-sm tracking-tight leading-snug group-hover:text-primary transition-colors line-clamp-2 flex-1 pr-6">
                    {task.title}
                  </h4>
                </div>

                {/* Story points */}
                {task.points !== undefined && task.points > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-[10px] font-bold text-muted-foreground">
                        <Trophy className="h-3 w-3 text-amber-400" />
                        <span>{task.points} pts</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{task.points} pontos de história</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all -mt-1 -mr-1">
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

          <CardContent className="p-4 pt-0 space-y-3">
            {/* Descrição */}
            <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2">
              {task.description}
            </p>

            {/* Tags */}
            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 border-white/5 text-muted-foreground/70 group-hover:border-white/10 group-hover:text-muted-foreground transition-colors">
                    {tag.length > 15 ? tag.slice(0, 15) + '...' : tag}
                  </Badge>
                ))}
                {task.tags.length > 3 && (
                  <Badge className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 border-white/5 text-muted-foreground/50">
                    +{task.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Footer com informações */}
            <div className="flex items-center justify-between pt-2 mt-auto border-t border-white/[0.05]">
              {/* Avatares dos assignees */}
              <div className="flex items-center">
                {assignedUsers.length === 0 ? (
                  <span className="text-[10px] text-muted-foreground/40 italic">Não atribuído</span>
                ) : (
                  <div className="flex -space-x-2">
                    {assignedUsers.slice(0, 3).map((user, idx) => user && (
                      <Tooltip key={user.id}>
                        <TooltipTrigger asChild>
                          <div
                            className="ring-2 ring-background rounded-full transition-transform hover:scale-110 hover:z-10 cursor-pointer"
                            style={{ zIndex: assignedUsers.length - idx }}
                          >
                            <UserAvatar name={user.name} avatar={user.avatar} size="xs" showTooltip={false} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{user.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {assignedUsers.length > 3 && (
                      <div className="ring-2 ring-background rounded-full bg-white/10 px-1.5 h-5 flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                        +{assignedUsers.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Métricas */}
              <div className="flex items-center gap-2">
                {/* Comentários */}
                {task.comments && task.comments.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                        <MessageSquare className="h-3 w-3" />
                        <span>{task.comments.length}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{task.comments.length} comentário{task.comments.length > 1 ? 's' : ''}</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Anexos */}
                {task.attachments && task.attachments.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                        <Paperclip className="h-3 w-3" />
                        <span>{task.attachments.length}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{task.attachments.length} anexo{task.attachments.length > 1 ? 's' : ''}</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Conexões */}
                {task.connections.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          backgroundColor: `${sector?.color}15`,
                          color: sector?.color,
                        }}
                      >
                        <Link2 className="h-2.5 w-2.5" />
                        <span>{task.connections.length}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{task.connections.length} conexão{task.connections.length > 1 ? 's' : ''}</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Data de vencimento */}
                {task.dueDate && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${isOverdue ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/[0.03] border-white/5 text-muted-foreground/70'}`}>
                        {isOverdue ? <AlertCircle className="h-2.5 w-2.5" /> : <Calendar className="h-2.5 w-2.5 opacity-60" />}
                        <span>{new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isOverdue ? 'Atrasada: ' : 'Vencimento: '}{new Date(task.dueDate).toLocaleDateString('pt-BR')}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Criador - apenas no hover */}
            <div className="text-[10px] text-muted-foreground/40 italic opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Por: {getUserById(task.createdBy)?.name.split(' ')[0] || 'Sistema'} • {new Date(task.createdAt).toLocaleDateString('pt-BR')}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
