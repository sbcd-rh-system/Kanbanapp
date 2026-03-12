export type UserRole = 'admin' | 'user';

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

export type SectorId = 'recruitment' | 'compensation' | 'dho' | 'dp' | 'data';

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
  points?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
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
