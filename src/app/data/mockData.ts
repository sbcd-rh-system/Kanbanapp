import { User, Sector, Task, SectorId, Project } from '../types';

export const sectors: Sector[] = [
  { id: 'recruitment', name: 'Recrutamento e Seleção', color: '#67e8f9', icon: 'users' },
  { id: 'compensation', name: 'Cargos e Salários', color: '#86efac', icon: 'dollar-sign' },
  { id: 'dho', name: 'DHO', color: '#fde047', icon: 'clipboard-list' },
  { id: 'dp', name: 'DP', color: '#f9a8d4', icon: 'briefcase-business' },
  { id: 'data', name: 'Dados', color: '#6366f1', icon: 'database' },
  { id: 'edu-assistencial', name: 'Educação Assistencial', color: '#f87171', icon: 'graduation-cap' },
  { id: 'ensino-pesquisa', name: 'Ensino e Pesquisa', color: '#fbbf24', icon: 'microscope' },
  { id: 'relacionamento-medico', name: 'Relacionamento Médico', color: '#a78bfa', icon: 'stethoscope' },
];

export const users: User[] = [];
export const projects: Project[] = [];
export const tasks: Task[] = [];

// Sessão: usa localStorage para persistência entre refreshes e fechamento de abas
const SESSION_KEY = 'kanban_current_user';

export const getCurrentUser = (): User | null => {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored) as User;
  } catch { }
  return null;
};

export const setCurrentUser = (user: User) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
};

export const logoutUser = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const getSectorById = (id: SectorId) => sectors.find(s => s.id === id);

export const getTasksBySector = (sectorId: SectorId, userId?: string, role?: string) => {
  let filteredTasks = tasks.filter(t => t.sectorId === sectorId);

  // Se não é admin, filtrar tarefas privadas de outros
  if (role !== 'admin' && userId) {
    filteredTasks = filteredTasks.filter(t =>
      !t.isPrivate || t.createdBy === userId || t.assignedTo.includes(userId)
    );
  }

  return filteredTasks;
};

export const getUserById = (id: string) => users.find(u => u.id === id);