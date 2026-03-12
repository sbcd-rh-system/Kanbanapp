export type UserRole = 'admin' | 'user';

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

export type SectorId = 'recruitment' | 'compensation' | 'dho' | 'training' | 'benefits';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  sectors: SectorId[];
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
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}
