export type UserRole =
  | 'chefe'           // nível 1 — cria tarefas, delega para gerentes
  | 'gerente'         // nível 2 — recebe do chefe, distribui para setores
  | 'admin'           // admin global (vê tudo, gerencia usuários)
  | `admin-${string}` // admin de setor específico, ex: 'admin-recruitment'
  | 'user';           // usuário comum de setor

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

export type SectorId = 'recruitment' | 'compensation' | 'dho' | 'dp' | 'data' | 'edu-assistencial' | 'ensino-pesquisa' | 'relacionamento-medico';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  sectors: SectorId[];
  id_oris?: number;
  cpf?: string;
  matricula_esocial?: string;
  cargo?: string;
  dt_admissao?: string;
  lotacao?: string;
  situacao?: string;
  linkedin_url?: string;
  phone?: string;
}

export interface Sector {
  id: SectorId;
  name: string;
  color: string;
  icon: string;
}

export interface TaskConnection {
  fromTaskId: string;
  toTaskId: string;
  type: 'dependency' | 'related' | 'blocks';
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  sectorId: SectorId;
  color?: string;
  createdAt: string;
  createdBy: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  sectorId: SectorId;
  assignedTo: string[];
  isPrivate: boolean;
  createdBy: string;
  createdAt: string;
  dueDate?: string;
  tags: string[];
  connections: string[]; // IDs of connected tasks
  projectId?: string; // ID do projeto ao qual a tarefa pertence
  points?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  delegated_to?: string;         // id do usuário gerente (usado pelo chefe)
  delegation_status?: 'pending' | 'distributed'; // status da delegação
  batchId?: string;              // id do lote quando delegada para múltiplos receptores
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
}

export interface TaskComment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  createdAt: string;
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}
