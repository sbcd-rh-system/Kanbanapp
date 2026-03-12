import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { KanbanBoard } from '../components/KanbanBoard';
import { TaskModal } from '../components/TaskModal';
import { ConnectionGraph } from '../components/ConnectionGraph';
import { UserAvatar } from '../components/UserAvatar';
import { getSectorById, getCurrentUser, sectors } from '../data/mockData';
import { Task, SectorId } from '../types';
import {
  ArrowLeft,
  Plus,
  Filter,
  LogOut,
  LayoutDashboard,
  Link2Off,
  Link2,
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
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [connectionTask, setConnectionTask] = useState<Task | undefined>();
  const [showConnections, setShowConnections] = useState(true);

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

  const handleCreateTask = () => {
    setSelectedTask(undefined);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (selectedTask) {
      toast.success('Tarefa atualizada com sucesso!');
    } else {
      toast.success('Tarefa criada com sucesso!');
    }
    setTaskModalOpen(false);
  };

  const handleViewConnections = (task: Task) => {
    setConnectionTask(task);
    setConnectionModalOpen(true);
  };

  const handleLogout = () => {
    navigate('/');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${sector.color}20` }}
                >
                  <div
                    className="h-5 w-5 rounded"
                    style={{ backgroundColor: sector.color }}
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{sector.name}</h1>
                  <p className="text-sm text-muted-foreground">Quadro Kanban</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleCreateTask} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Tarefa
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Opções de Visualização</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-connections" className="text-sm cursor-pointer">
                        Mostrar Conexões
                      </Label>
                      <Switch
                        id="show-connections"
                        checked={showConnections}
                        onCheckedChange={setShowConnections}
                      />
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {currentUser.role === 'admin' && (
                <Button variant="outline" size="icon" onClick={handleGoToDashboard}>
                  <LayoutDashboard className="h-4 w-4" />
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <UserAvatar
                      name={currentUser.name}
                      avatar={currentUser.avatar}
                      size="sm"
                      showTooltip={false}
                    />
                    <span className="hidden sm:inline">{currentUser.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Perfil</DropdownMenuItem>
                  <DropdownMenuItem>Configurações</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {currentUser.role === 'admin' && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/admin/users')}>
                        Gerenciar Usuários
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Sector Navigation */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {sectors.map(s => (
              <Button
                key={s.id}
                variant={s.id === sectorId ? 'default' : 'outline'}
                size="sm"
                onClick={() => navigate(`/kanban/${s.id}`)}
                className="whitespace-nowrap"
                style={
                  s.id === sectorId
                    ? { backgroundColor: s.color, color: 'white' }
                    : undefined
                }
              >
                {s.name}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Connection Status Banner */}
      {!showConnections && (
        <div className="bg-muted border-b">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link2Off className="h-4 w-4" />
              <span>Conexões ocultas</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConnections(true)}
              className="gap-2"
            >
              <Link2 className="h-4 w-4" />
              Mostrar Conexões
            </Button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="container mx-auto px-4 py-6">
        <KanbanBoard
          sectorId={sectorId!}
          onEditTask={handleEditTask}
          onViewConnections={handleViewConnections}
          userId={currentUser.id}
          userRole={currentUser.role}
          showConnections={showConnections}
        />
      </div>

      {/* Task Modal */}
      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={selectedTask}
        sectorId={sectorId!}
      />

      {/* Connection Graph Modal */}
      <Dialog open={connectionModalOpen} onOpenChange={setConnectionModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conexões da Tarefa</DialogTitle>
            <DialogDescription>
              Visualize as conexões e dependências desta tarefa
            </DialogDescription>
          </DialogHeader>
          {connectionTask && <ConnectionGraph task={connectionTask} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
