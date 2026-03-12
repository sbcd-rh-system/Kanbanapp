import { User, Sector, Task, SectorId } from '../types';

export const sectors: Sector[] = [
  { id: 'recruitment', name: 'Recrutamento e Seleção', color: '#67e8f9', icon: 'users' },
  { id: 'compensation', name: 'Cargos e Salários', color: '#86efac', icon: 'dollar-sign' },
  { id: 'dho', name: 'DHO', color: '#fde047', icon: 'clipboard-list' },
  { id: 'dp', name: 'DP', color: '#f9a8d4', icon: 'briefcase-business' },
  { id: 'data', name: 'Dados', color: '#6366f1', icon: 'database' },
];

export const users: User[] = [
  {
    id: '1',
    name: 'Admin Amanda',
    email: 'admin@empresa.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    role: 'admin',
    sectors: ['recruitment', 'compensation', 'dho', 'dp', 'data'],
  },
  {
    id: '2',
    name: 'Josué',
    email: 'maria@empresa.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    role: 'admin',
    sectors: ['recruitment'],
  },
  {
    id: '3',
    name: 'João Oliveira',
    email: 'joao@empresa.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Joao',
    role: 'user',
    sectors: ['compensation', 'dho', 'data'],
  },
  {
    id: '4',
    name: 'Ana Costa',
    email: 'ana@empresa.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
    role: 'user',
    sectors: ['dp'],
  },
];

export const tasks: Task[] = [
  {
    id: 'task-1',
    title: 'Definir perfil da vaga Desenvolvedor Senior',
    description: 'Criar documento com requisitos técnicos e comportamentais',
    status: 'todo',
    sectorId: 'recruitment',
    assignedTo: ['2'],
    isPrivate: false,
    createdBy: '1',
    createdAt: '2026-03-08',
    dueDate: '2026-03-15',
    tags: ['vaga', 'tech'],
    connections: ['task-2', 'task-5'],
  },
  {
    id: 'task-2',
    title: 'Publicar vaga em plataformas',
    description: 'LinkedIn, Indeed, Catho',
    status: 'todo',
    sectorId: 'recruitment',
    assignedTo: ['2'],
    isPrivate: false,
    createdBy: '2',
    createdAt: '2026-03-09',
    dueDate: '2026-03-16',
    tags: ['divulgação'],
    connections: ['task-1'],
  },
  {
    id: 'task-3',
    title: 'Revisar tabela salarial 2026',
    description: 'Atualizar valores conforme mercado',
    status: 'in-progress',
    sectorId: 'compensation',
    assignedTo: ['3'],
    isPrivate: true,
    createdBy: '1',
    createdAt: '2026-03-05',
    dueDate: '2026-03-20',
    tags: ['salário', 'confidencial'],
    connections: ['task-7'],
  },
  {
    id: 'task-4',
    title: 'Mapear competências por cargo',
    description: 'Criar matriz de competências técnicas e comportamentais',
    status: 'in-progress',
    sectorId: 'compensation',
    assignedTo: ['3', '1'],
    isPrivate: false,
    createdBy: '3',
    createdAt: '2026-03-07',
    tags: ['competências'],
    connections: [],
  },
  {
    id: 'task-5',
    title: 'Preparar onboarding digital',
    description: 'Criar fluxo de integração online para novos colaboradores',
    status: 'review',
    sectorId: 'dho',
    assignedTo: ['4'],
    isPrivate: false,
    createdBy: '4',
    createdAt: '2026-03-01',
    dueDate: '2026-03-12',
    tags: ['onboarding', 'digital'],
    connections: ['task-1'],
  },
  {
    id: 'task-6',
    title: 'Atualizar manual do colaborador',
    description: 'Incluir novas políticas de trabalho híbrido',
    status: 'review',
    sectorId: 'dho',
    assignedTo: ['3'],
    isPrivate: false,
    createdBy: '1',
    createdAt: '2026-02-28',
    tags: ['política', 'manual'],
    connections: ['task-8'],
  },
  {
    id: 'task-7',
    title: 'Análise de equidade salarial',
    description: 'Verificar gaps salariais por gênero e etnia',
    status: 'done',
    sectorId: 'compensation',
    assignedTo: ['1'],
    isPrivate: true,
    createdBy: '1',
    createdAt: '2026-02-20',
    tags: ['diversidade', 'confidencial'],
    connections: ['task-3'],
  },
  {
    id: 'task-8',
    title: 'Implementar novo plano de saúde',
    description: 'Negociação com operadoras e comunicação aos colaboradores',
    status: 'done',
    sectorId: 'dp',
    assignedTo: ['4', '1'],
    isPrivate: false,
    createdBy: '1',
    createdAt: '2026-02-15',
    tags: ['saúde', 'benefício'],
    connections: ['task-6'],
  },
  {
    id: 'task-9',
    title: 'Triagem de currículos',
    description: 'Analisar 150 candidaturas recebidas',
    status: 'in-progress',
    sectorId: 'recruitment',
    assignedTo: ['2'],
    isPrivate: false,
    createdBy: '2',
    createdAt: '2026-03-10',
    tags: ['triagem'],
    connections: [],
  },
  {
    id: 'task-10',
    title: 'Workshop de liderança',
    description: 'Organizar treinamento para gestores',
    status: 'todo',
    sectorId: 'dho',
    assignedTo: ['4'],
    isPrivate: false,
    createdBy: '4',
    createdAt: '2026-03-09',
    dueDate: '2026-03-25',
    tags: ['liderança', 'gestão'],
    connections: [],
  },
  {
    id: 'task-11',
    title: 'Integração API Oris',
    description: 'Finalizar os endpoints de sincronização de funcionários',
    status: 'in-progress',
    sectorId: 'data',
    assignedTo: ['1'],
    isPrivate: false,
    createdBy: '1',
    createdAt: '2026-03-10',
    dueDate: '2026-03-20',
    tags: ['api', 'sincronização'],
    connections: [],
  },
  {
    id: 'task-12',
    title: 'Modelagem Banco de Dados',
    description: 'Otimizar queries para o dashboard de gestão',
    status: 'todo',
    sectorId: 'data',
    assignedTo: ['1', '3'],
    isPrivate: false,
    createdBy: '1',
    createdAt: '2026-03-11',
    tags: ['db', 'performance'],
    connections: ['task-11'],
  },
];

// Sessão por aba: usa sessionStorage para que cada aba tenha seu próprio usuário logado
const SESSION_KEY = 'kanban_current_user';

export const getCurrentUser = (): User => {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored) as User;
  } catch { }
  // Fallback: primeiro admin da lista
  return users[0];
};

export const setCurrentUser = (user: User) => {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
};

export const logoutUser = () => {
  sessionStorage.removeItem(SESSION_KEY);
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