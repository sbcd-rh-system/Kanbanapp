import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { KanbanBoard } from '../components/KanbanBoard';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TaskModal } from '../components/TaskModal';
import { ConnectionGraph } from '../components/ConnectionGraph';
import { UserAvatar } from '../components/UserAvatar';
import { getSectorById, getCurrentUser, sectors } from '../data/mockData';
import { Task, SectorId, TaskStatus, User, Project } from '../types';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import { projectService } from '../services/projectService';
import {
  ArrowLeft,
  Plus,
  Filter,
  LogOut,
  LayoutDashboard,
  Link2Off,
  Link2,
  Shield,
  FolderKanban,
  X,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';

export default function KanbanView() {
  const { sectorId } = useParams<{ sectorId: SectorId }>();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const [initialStatus, setInitialStatus] = useState<TaskStatus>('todo');
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [connectionTask, setConnectionTask] = useState<Task | undefined>();
  const [showConnections, setShowConnections] = useState(true);
  const [boardKey, setBoardKey] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all');
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    userService.listUsers().then(setUsers).catch(console.error);
    taskService.listTasks().then(setTasks).catch(console.error);
    if (sectorId) {
      projectService.listProjects(sectorId)
        .then(projs => {
          const sorted = [...projs].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
          setProjects(sorted);
        })
        .catch(console.error);
    }
  }, [boardKey, sectorId]);

  const sector = sectorId ? getSectorById(sectorId) : null;

  if (!sector) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg">Setor não encontrado</p>
          <Button onClick={() => navigate('/dashboard')}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  const handleCreateTask = (status?: TaskStatus) => {
    setSelectedTask(undefined);
    setInitialStatus(status || 'todo');
    setTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setInitialStatus(task.status);
    setTaskModalOpen(true);
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      const taskToSave = {
        ...(selectedTask && selectedTask.id ? selectedTask : {
          id: `task-${Date.now()}`,
          createdBy: currentUser.id,
          createdAt: new Date().toISOString(),
          status: initialStatus,
          assignedTo: [],
          tags: [],
          connections: [],
        }),
        ...taskData,
        sectorId: sectorId as SectorId,
      } as Task;

      await taskService.saveTask(taskToSave);

      if (selectedTask) {
        toast.success('Tarefa atualizada com sucesso!');
      } else {
        toast.success('Tarefa criada com sucesso!');
      }

      setBoardKey(prev => prev + 1);
      setTaskModalOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar tarefa');
    }
  };

  const handleViewConnections = (task: Task) => {
    setConnectionTask(task);
    setConnectionModalOpen(true);
  };

  const handleLogout = () => {
    navigate('/');
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('O nome do projeto é obrigatório');
      return;
    }

    try {
      const newProj = {
        id: `proj-${Date.now()}`,
        name: newProjectName.trim(),
        sectorId: sectorId!,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id,
        color: sector?.color || '#3b82f6'
      };

      await projectService.saveProject(newProj as any);
      toast.success('Projeto criado com sucesso!');
      setNewProjectName('');
      setNewProjectModalOpen(false);
      setBoardKey(prev => prev + 1);
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      toast.error('Erro ao salvar projeto no servidor');
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover o projeto "${name}"? Todas as tarefas deste projeto ficarão como "Avulsas".`)) {
      return;
    }

    try {
      await projectService.deleteProject(id);
      toast.success('Projeto removido com sucesso!');
      if (selectedProjectId === id) setSelectedProjectId('all');
      setBoardKey(prev => prev + 1);
    } catch (error) {
      toast.error('Erro ao remover projeto');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
              >
                <ArrowLeft className="h-5 w-5 group-hover:translate-x-[-2px] transition-transform" />
              </button>

              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                  style={{ backgroundColor: `${sector.color}20`, border: `1px solid ${sector.color}40` }}
                >
                  <div
                    className="h-5 w-5 rounded-md"
                    style={{ backgroundColor: sector.color, boxShadow: `0 0 15px ${sector.color}60` }}
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">{sector.name}</h1>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Fluxo de Trabalho</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={() => handleCreateTask()} className="gradient-blue shadow-lg shadow-blue-500/20 border-none h-10 px-4 rounded-xl gap-2 font-bold transition-all active:scale-95">
                <Plus className="h-4 w-4" />
                Nova Tarefa
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-background/95 backdrop-blur-xl border-white/10 rounded-2xl p-2">
                  <DropdownMenuLabel className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">Visualização</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-connections" className="text-sm font-medium cursor-pointer">
                        Mostrar Conexões
                      </Label>
                      <Switch
                        id="show-connections"
                        checked={showConnections}
                        onCheckedChange={setShowConnections}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="h-6 w-px bg-white/10 mx-1" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 px-2 rounded-xl hover:bg-white/5 transition-colors gap-3">
                    <UserAvatar
                      name={currentUser.name}
                      avatar={currentUser.avatar}
                      size="sm"
                      showTooltip={false}
                    />
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-bold leading-none">{currentUser.name.split(' ')[0]}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-tighter">{currentUser.role === 'admin' ? 'Admin' : 'Membro'}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/10 rounded-2xl p-2 shadow-2xl">
                  <DropdownMenuLabel className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem className="rounded-lg focus:bg-white/5 cursor-pointer">
                    <LayoutDashboard className="h-3.5 w-3.5 mr-2 opacity-60" /> Perfil
                  </DropdownMenuItem>
                  {currentUser.role === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin/users')} className="rounded-lg focus:bg-white/5 cursor-pointer">
                      <Shield className="h-3.5 w-3.5 mr-2 opacity-60" /> Gestão de Equipe
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-lg focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                    <LogOut className="h-3.5 w-3.5 mr-2" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Sector Navigation - Horizontal Pill style */}
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar border-b border-white/5 mb-4">
            {sectors.map(s => (
              <button
                key={s.id}
                onClick={() => navigate(`/kanban/${s.id}`)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border ${s.id === sectorId
                  ? 'bg-primary/10 border-primary/20 text-primary shadow-lg shadow-primary/5'
                  : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/10'
                  }`}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: s.color,
                    boxShadow: s.id === sectorId ? `0 0 10px ${s.color}` : 'none'
                  }}
                />
                {s.name}
              </button>
            ))}
          </div>

          {/* Project Navigation */}
          <div className="flex items-center gap-4 mt-4 bg-white/[0.02] p-2 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 px-3 text-muted-foreground">
              <FolderKanban className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Meus Projetos</span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSelectedProjectId('all')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${selectedProjectId === 'all'
                  ? 'bg-primary/20 border-primary/30 text-primary'
                  : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10'
                  }`}
              >
                Todos os Projetos
              </button>
              {projects.map(p => (
                <div key={p.id} className="relative flex items-center group/proj">
                  <button
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${selectedProjectId === p.id
                      ? 'bg-white/10 border-white/20 text-foreground'
                      : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10'
                      }`}
                  >
                    {p.name}
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-6 w-6 ml-1 flex items-center justify-center rounded-lg hover:bg-white/10 opacity-0 group-hover/proj:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-xl border-white/10 rounded-xl p-1 shadow-2xl">
                      <DropdownMenuItem
                        onClick={() => handleDeleteProject(p.id, p.name)}
                        className="rounded-lg focus:bg-destructive/10 focus:text-destructive cursor-pointer text-xs font-bold flex items-center gap-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir Projeto
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 rounded-xl gap-2 hover:bg-primary/10 hover:text-primary transition-all group"
                onClick={() => setNewProjectModalOpen(true)}
              >
                <Plus className="h-3 w-3 group-hover:rotate-90 transition-transform" />
                <span className="text-[10px] uppercase font-black">Adicionar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Connection Status Banner */}
      {!showConnections && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 backdrop-blur-md">
          <div className="container mx-auto px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yellow-500/80">
              <Link2Off className="h-3.5 w-3.5" />
              <span>Modo focado: Conexões ocultas</span>
            </div>
            <button
              onClick={() => setShowConnections(true)}
              className="text-xs font-bold uppercase tracking-widest text-yellow-500 hover:underline"
            >
              Restaurar conexões
            </button>
          </div>
        </div>
      )}

      {/* Kanban Board Container */}
      <main className="container mx-auto px-6 py-8 space-y-12">
        <DndProvider backend={HTML5Backend}>
          {selectedProjectId === 'all' ? (
            <>
              {projects.length > 0 ? (
                projects.map(p => (
                  <div key={p.id} className="space-y-4">
                    <div className="flex items-center gap-4 px-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color || sector.color }} />
                      <div className="flex flex-col">
                        <h2 className="text-lg font-black uppercase tracking-widest opacity-60 italic">{p.name}</h2>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/40 font-bold uppercase tracking-tighter">
                          <span>Criado por {users.find(u => String(u.id) === String(p.createdBy))?.name || 'Sistema'}</span>
                          <span>•</span>
                          <span>{new Date(p.createdAt).toLocaleDateString('pt-BR')} {new Date(p.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <div className="bg-white/[0.01] border border-white/5 rounded-[2rem] p-6 shadow-3xl">
                      <KanbanBoard
                        key={`${boardKey}-${p.id}`}
                        sectorId={sectorId!}
                        projectId={p.id}
                        onEditTask={handleEditTask}
                        onViewConnections={handleViewConnections}
                        onAddTask={handleCreateTask}
                        userId={currentUser.id}
                        userRole={currentUser.role}
                        showConnections={showConnections}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 opacity-30">
                  <FolderKanban className="h-12 w-12 mx-auto mb-4" />
                  <p className="font-bold uppercase tracking-widest text-sm">Nenhum projeto cadastrado neste setor</p>
                </div>
              )}

              {/* Tarefas sem projeto */}
              <div className="space-y-4 opacity-50">
                <div className="flex items-center gap-4 px-2">
                  <div className="h-3 w-3 rounded-full bg-muted-foreground/30" />
                  <h2 className="text-lg font-black uppercase tracking-widest">Tarefas Avulsas</h2>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="bg-white/[0.01] border border-white/5 rounded-[2rem] p-6 shadow-3xl">
                  <KanbanBoard
                    key={`${boardKey}-no-project`}
                    sectorId={sectorId!}
                    projectId="no-project"
                    onEditTask={handleEditTask}
                    onViewConnections={handleViewConnections}
                    onAddTask={handleCreateTask}
                    userId={currentUser.id}
                    userRole={currentUser.role}
                    showConnections={showConnections}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 shadow-3xl">
              <KanbanBoard
                key={`${boardKey}-${selectedProjectId}`}
                sectorId={sectorId!}
                projectId={selectedProjectId}
                onEditTask={handleEditTask}
                onViewConnections={handleViewConnections}
                onAddTask={handleCreateTask}
                userId={currentUser.id}
                userRole={currentUser.role}
                showConnections={showConnections}
              />
            </div>
          )}
        </DndProvider>
      </main>

      {/* Task Modal */}
      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={selectedTask}
        initialStatus={initialStatus}
        sectorId={sectorId!}
        users={users}
        projects={projects}
      />

      {/* Connection Graph Modal */}
      <Dialog open={connectionModalOpen} onOpenChange={setConnectionModalOpen}>
        <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-2xl border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Grafo de Dependências</DialogTitle>
            <DialogDescription className="text-sm">
              Visualize as conexões e o impacto desta tarefa no ecossistema
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
            {connectionTask && <ConnectionGraph task={connectionTask} allTasks={tasks} />}
          </div>
        </DialogContent>
      </Dialog>
      {/* Create Project Modal */}
      <Dialog open={newProjectModalOpen} onOpenChange={setNewProjectModalOpen}>
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-2xl border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Novo Projeto</DialogTitle>
            <DialogDescription className="text-sm">
              Crie um novo quadro Kanban para organizar suas tarefas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Nome do Projeto
              </Label>
              <input
                id="project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Ex: Contratação Q1"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProject();
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setNewProjectModalOpen(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">
              Cancelar
            </Button>
            <Button onClick={handleCreateProject} className="gradient-blue shadow-lg shadow-blue-500/20 border-none px-6 rounded-xl font-bold uppercase tracking-widest text-[10px]">
              Criar Projeto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
