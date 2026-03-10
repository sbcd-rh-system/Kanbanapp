import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { KanbanColumn } from './KanbanColumn';
import { ConnectionLine } from './ConnectionLine';
import { Task, TaskStatus, SectorId } from '../types';
import { tasks as initialTasks } from '../data/mockData';
import { toast } from 'sonner';

interface KanbanBoardProps {
  sectorId: SectorId;
  onEditTask: (task: Task) => void;
  onViewConnections: (task: Task) => void;
  userId?: string;
  userRole?: string;
  showConnections?: boolean;
}

export function KanbanBoard({
  sectorId,
  onEditTask,
  onViewConnections,
  userId,
  userRole,
  showConnections = true,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Filtrar tarefas por setor e permissões
    let filteredTasks = initialTasks.filter(t => t.sectorId === sectorId);
    
    if (userRole !== 'admin' && userId) {
      filteredTasks = filteredTasks.filter(t => 
        !t.isPrivate || t.createdBy === userId || t.assignedTo.includes(userId)
      );
    }
    
    setTasks(filteredTasks);
  }, [sectorId, userId, userRole]);

  const handleDrop = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
    toast.success('Tarefa movida com sucesso!');
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    toast.success('Tarefa deletada com sucesso!');
  };

  const columns: { id: TaskStatus; title: string }[] = [
    { id: 'todo', title: 'A Fazer' },
    { id: 'in-progress', title: 'Em Andamento' },
    { id: 'review', title: 'Revisão' },
    { id: 'done', title: 'Concluído' },
  ];

  // Preparar linhas de conexão visíveis
  const visibleConnections: Array<{ from: string; to: string }> = [];
  if (showConnections) {
    tasks.forEach(task => {
      task.connections.forEach(connId => {
        if (tasks.some(t => t.id === connId)) {
          visibleConnections.push({ from: task.id, to: connId });
        }
      });
    });
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="relative">
        {/* Linhas de conexão */}
        {visibleConnections.map(conn => (
          <ConnectionLine
            key={`${conn.from}-${conn.to}`}
            fromTaskId={conn.from}
            toTaskId={conn.to}
            type="related"
          />
        ))}

        {/* Colunas do Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {columns.map(column => (
            <KanbanColumn
              key={column.id}
              title={column.title}
              status={column.id}
              tasks={tasks.filter(task => task.status === column.id)}
              onDrop={handleDrop}
              onEditTask={onEditTask}
              onDeleteTask={handleDeleteTask}
              onViewConnections={onViewConnections}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
}
