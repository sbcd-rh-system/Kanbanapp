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

  const statusColors: Record<TaskStatus, string> = {
    'todo': 'border-blue-500/50',
    'in-progress': 'border-amber-500/50',
    'review': 'border-purple-500/50',
    'done': 'border-green-500/50',
  };

  return (
    <div className="flex flex-col h-full min-w-[300px] w-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-sm text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>
      
      <Card
        ref={drop}
        className={`flex-1 p-3 space-y-3 overflow-y-auto border-2 transition-colors ${
          isOver ? statusColors[status] + ' bg-accent/50' : 'border-border'
        }`}
      >
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            Nenhuma tarefa
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
      </Card>
    </div>
  );
}
