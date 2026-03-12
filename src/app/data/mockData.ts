import { User, Sector, Task, SectorId } from '../types';

export const sectors: Sector[] = [
  { id: 'recruitment', name: 'Recrutamento e Seleção', color: '#06b6d4', icon: 'users' },
  { id: 'compensation', name: 'Cargos e Salários', color: '#22c55e', icon: 'dollar-sign' },
  { id: 'dho', name: 'DHO', color: '#eab308', icon: 'clipboard-list' },
  { id: 'training', name: 'Treinamento', color: '#a855f7', icon: 'graduation-cap' },
  { id: 'benefits', name: 'Benefícios', color: '#ec4899', icon: 'gift' },
];

export const users: User[] = [
  {
    id: '1',
    name: 'Admin Silva',
    email: 'admin@empresa.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    role: 'admin',
    sectors: ['recruitment', 'compensation', 'dho', 'training', 'benefits'],
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@empresa.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    role: 'user',
    sectors: ['recruitment'],
  },
  {
    id: '3',
    name: 'João Oliveira',
    email: 'joao@empresa.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Joao',
    role: 'user',
    sectors: ['compensation', 'dho'],
  },
  {
    id: '4',
    name: 'Ana Costa',
    email: 'ana@empresa.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
    role: 'user',
    sectors: ['training', 'benefits'],
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
    sectorId: 'training',
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
    sectorId: 'benefits',
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
    sectorId: 'training',
    assignedTo: ['4'],
    isPrivate: false,
    createdBy: '4',
    createdAt: '2026-03-09',
    dueDate: '2026-03-25',
    tags: ['liderança', 'gestão'],
    connections: [],
  },
];

// Mock login - em produção seria feito via Supabase
let currentUser: User = users[0]; // Default admin

export const getCurrentUser = () => currentUser;

export const setCurrentUser = (user: User) => {
  currentUser = user;
};

export const loginUser = (email: string, password: string): User | null => {
  const user = users.find(u => u.email === email);
  // Simulação simples - em produção usaria Supabase Auth
  if (user && password === 'demo123') {
    setCurrentUser(user);
    return user;
  }
  return null;
};

export const logoutUser = () => {
  setCurrentUser(users[0]);
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