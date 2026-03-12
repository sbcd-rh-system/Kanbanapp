import { useDrop } from 'react-dnd';
import { TaskCard } from './TaskCard';
import { Task, TaskStatus } from '../types';
import { Card } from './ui/card';

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onDrop: (taskId: string, newStatus: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onViewConnections: (task: Task) => void;
}

export function KanbanColumn({
  title,
  status,
  tasks,
  onDrop,
  onEditTask,
  onDeleteTask,
  onViewConnections,
}: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop({
    accept: 'TASK',
    drop: (item: { id: string; status: TaskStatus }) => {
      if (item.status !== status) {
        onDrop(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const statusStyles: Record<TaskStatus, { border: string; bg: string; text: string; dot: string }> = {
    'todo': {
      border: 'border-blue-500/20',
      bg: 'bg-blue-500/5',
      text: 'text-blue-500',
      dot: 'bg-blue-500'
    },
    'in-progress': {
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/5',
      text: 'text-amber-500',
      dot: 'bg-amber-500'
    },
    'review': {
      border: 'border-purple-500/20',
      bg: 'bg-purple-500/5',
      text: 'text-purple-500',
      dot: 'bg-purple-500'
    },
    'done': {
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/5',
      text: 'text-emerald-500',
      dot: 'bg-emerald-500'
    },
  };

  const style = statusStyles[status];

  return (
    <div className="flex flex-col h-full min-w-[320px] max-w-[320px] w-full">
      <div className="mb-4 px-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${style.dot} shadow-[0_0_8px_rgba(0,0,0,0.5)] shadow-current`} />
          <h3 className="font-bold text-base uppercase tracking-widest">{title}</h3>
        </div>
        <div className="flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-muted-foreground bg-white/5 rounded-full border border-white/10">
          {tasks.length}
        </div>
      </div>

      <div
        ref={drop}
        className={`flex-1 p-3 space-y-4 overflow-y-auto rounded-3xl border transition-all duration-300 no-scrollbar ${isOver
          ? `${style.border} ${style.bg} backdrop-blur-md shadow-2xl`
          : 'border-transparent bg-white/[0.01]'
          }`}
      >
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 group">
            <div className={`w-12 h-12 rounded-2xl ${style.bg} border-2 border-dashed ${style.border} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <div className={`w-2 h-2 rounded-full ${style.dot} opacity-20`} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40">Vazio</p>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onViewConnections={onViewConnections}
            />
          ))
        )}
      </div>
    </div>
  );
}
