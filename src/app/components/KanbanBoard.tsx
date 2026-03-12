import { useState, useEffect } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { ConnectionLine } from './ConnectionLine';
import { Task, TaskStatus, SectorId } from '../types';
import { taskService } from '../services/taskService';
import { getSectorById } from '../data/mockData';
import { toast } from 'sonner';

interface KanbanBoardProps {
  sectorId: SectorId;
  projectId?: string | 'no-project'; // Filtro de projeto
  onEditTask: (task: Task) => void;
  onViewConnections: (task: Task) => void;
  onAddTask?: (status: TaskStatus) => void;
  userId?: string;
  userRole?: string;
  showConnections?: boolean;
}

export function KanbanBoard({
  sectorId,
  projectId,
  onEditTask,
  onViewConnections,
  onAddTask,
  userId,
  userRole,
  showConnections = true,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    async function loadTasks() {
      try {
        const allTasks = await taskService.listTasks();
        // Filtrar tarefas por setor e permissões
        let filteredTasks = allTasks.filter(t => t.sectorId === sectorId);

        // Filtrar por projeto se selecionado
        if (projectId === 'no-project') {
          filteredTasks = filteredTasks.filter(t => !t.projectId);
        } else if (projectId) {
          filteredTasks = filteredTasks.filter(t => t.projectId === projectId);
        }

        if (userRole !== 'admin' && userId) {
          filteredTasks = filteredTasks.filter(t =>
            !t.isPrivate || t.createdBy === userId || t.assignedTo.includes(userId)
          );
        }

        setTasks(filteredTasks);
      } catch (error) {
        toast.error('Erro ao carregar tarefas');
      }
    }
    loadTasks();
  }, [sectorId, projectId, userId, userRole, tasks.length]); // Added tasks.length to refresh on local changes if needed, though handleDrop updates state

  const handleDrop = async (taskId: string, newStatus: TaskStatus) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;

    const updatedTask = { ...taskToUpdate, status: newStatus };

    try {
      await taskService.saveTask(updatedTask);
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? updatedTask : task
        )
      );
      toast.success('Tarefa movida com sucesso!');
    } catch (error) {
      toast.error('Erro ao mover tarefa no servidor');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      toast.success('Tarefa deletada com sucesso!');
    } catch (error) {
      toast.error('Erro ao deletar tarefa no servidor');
    }
  };

  const columns: { id: TaskStatus; title: string }[] = [
    { id: 'todo', title: 'A Fazer' },
    { id: 'in-progress', title: 'Em Andamento' },
    { id: 'review', title: 'Revisão' },
    { id: 'done', title: 'Concluído' },
  ];

  // Preparar linhas de conexão visíveis
  const visibleConnections: Array<{ from: string; to: string; color: string }> = [];
  if (showConnections) {
    tasks.forEach(task => {
      const sector = getSectorById(task.sectorId);
      const color = sector?.color || '#06b6d4';
      task.connections.forEach(connId => {
        if (tasks.some(t => t.id === connId)) {
          visibleConnections.push({ from: task.id, to: connId, color });
        }
      });
    });
  }

  return (
    <div className="relative">
      {/* Linhas de conexão estilo neurônio */}
      {visibleConnections.map(conn => (
        <ConnectionLine
          key={`${conn.from}-${conn.to}`}
          fromTaskId={conn.from}
          toTaskId={conn.to}
          color={conn.color}
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
            onAddTask={onAddTask}
          />
        ))}
      </div>
    </div>
  );
}
