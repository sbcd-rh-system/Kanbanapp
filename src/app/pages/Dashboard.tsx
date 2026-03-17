import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { sectors, getCurrentUser } from '../data/mockData';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import { Task, User } from '../types';
import { SectorBadge } from '../components/SectorBadge';
import { UserAvatar } from '../components/UserAvatar';
import { GerenteCard } from '../components/GerenteCard';
import { UserRegistrationModal } from '../components/UserRegistrationModal';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
  Plus,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';

const GERENTE_ORDER_KEY = 'kanban_gerente_order';

export default function Dashboard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    async function loadData() {
      try {
        const [loadedTasks, loadedUsers] = await Promise.all([
          taskService.listTasks(),
          userService.listUsers()
        ]);
        setTasks(loadedTasks);
        setUsers(loadedUsers);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddReceptor = async (userData: any) => {
    try {
      // Forçar o role como gerente para receptores adicionados por aqui
      const newUser = { ...userData, role: 'gerente' as const };
      await userService.saveUser(newUser);
      toast.success('Receptor adicionado com sucesso!');
      
      // Recarregar dados
      const [loadedTasks, loadedUsers] = await Promise.all([
        taskService.listTasks(),
        userService.listUsers()
      ]);
      setTasks(loadedTasks);
      setUsers(loadedUsers);
    } catch (error) {
      toast.error('Erro ao adicionar receptor.');
    }
  };

  const isChefe = currentUser?.role === 'chefe';
  const gerentesRaw = users.filter(u => u.role === 'gerente');

  const [gerenteOrder, setGerenteOrder] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(GERENTE_ORDER_KEY) || '[]'); } catch { return []; }
  });

  const gerentes = gerentesRaw.length === 0 ? [] : (() => {
    const ordered = gerenteOrder
      .map(id => gerentesRaw.find(g => g.id === id))
      .filter(Boolean) as User[];
    const rest = gerentesRaw.filter(g => !gerenteOrder.includes(g.id));
    return [...ordered, ...rest];
  })();

  const moveGerente = useCallback((from: number, to: number) => {
    setGerenteOrder(prev => {
      const ids = gerentes.map(g => g.id);
      const next = [...ids];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      localStorage.setItem(GERENTE_ORDER_KEY, JSON.stringify(next));
      return next;
    });
  }, [gerentes]);

  // Hierarquia de roles: 'admin' = global, 'admin-{sectorId}' = admin setorial, outros = viewer
  const isGlobalAdmin = currentUser?.role === 'admin';
  const isSectorAdmin = currentUser?.role?.startsWith('admin-') && currentUser?.role !== 'admin';

  if (!currentUser) return null;
  const isAdmin = isGlobalAdmin; // alias de retrocompatibilidade

  // Setores visíveis por nível
  const userSectorIds: string[] = isSectorAdmin
    ? [currentUser.role.replace('admin-', '')] // 'admin-recruitment' -> ['recruitment']
    : Array.isArray(currentUser.sectors)
      ? currentUser.sectors
      : [];

  const visibleSectors = isGlobalAdmin
    ? sectors
    : sectors.filter(s => userSectorIds.includes(s.id));

  // Tarefas filtradas pelo escopo do usuário
  const visibleTasks = isGlobalAdmin
    ? tasks
    : tasks.filter(t => userSectorIds.includes(t.sectorId));

  const totalTasks = visibleTasks.length;
  const todoTasks = visibleTasks.filter(t => t.status === 'todo').length;
  const inProgressTasks = visibleTasks.filter(t => t.status === 'in-progress').length;
  const reviewTasks = visibleTasks.filter(t => t.status === 'review').length;
  const doneTasks = visibleTasks.filter(t => t.status === 'done').length;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gradient-blue flex items-center justify-center shadow-lg shadow-blue-500/20">
              <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">Central de Controle</h1>
              <p className="hidden xs:block text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Kanban System</p>
            </div>
          </div>

        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Welcome Section */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold tracking-tight mb-2 italic">Bem-vindo, <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{currentUser.name.split(' ')[0]}!</span></h2>
          <p className="text-muted-foreground">Visão geral do sistema e status das tarefas por setor.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-10">
          {[
            { label: 'Total', value: totalTasks, icon: ListTodo, color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
            { label: 'A Fazer', value: todoTasks, icon: AlertCircle, color: 'from-cyan-400 to-blue-500', shadow: 'shadow-cyan-500/20' },
            { label: 'Em Andamento', value: inProgressTasks, icon: Clock, color: 'from-yellow-400 to-orange-500', shadow: 'shadow-yellow-500/20' },
            { label: 'Revisão', value: reviewTasks, icon: AlertCircle, color: 'from-purple-500 to-pink-500', shadow: 'shadow-purple-500/20' },
            { label: 'Concluídas', value: doneTasks, icon: CheckCircle2, color: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-500/20' },
          ].map((stat, i) => (
            <Card key={i} className="glass-card hover:translate-y-[-2px] transition-all duration-300 group overflow-hidden border-none">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color}`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</CardTitle>
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${stat.color} ${stat.shadow} opacity-80 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="h-3.5 w-3.5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tighter">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cards dos Receptores — visível só pro chefe */}
        {isChefe && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full" />
                Delegar Tarefas
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  variant="outline"
                  className="border-white/10 bg-white/5 hover:bg-white/10 h-9 gap-2 text-xs sm:text-sm"
                >
                  <Plus className="h-4 w-4" /> <span className="hidden xs:inline">Adicionar Receptor</span><span className="xs:hidden">Receptor</span>
                </Button>
                <Button
                  onClick={() => navigate('/superintendente')}
                  className="gradient-blue border-none shadow-lg shadow-blue-500/20 h-9 gap-2 text-xs sm:text-sm"
                >
                  <Plus className="h-4 w-4" /> Delegar Tarefa
                </Button>
              </div>
            </div>
            <DndProvider backend={HTML5Backend}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {gerentes.map((gerente, index) => (
                  <GerenteCard
                    key={gerente.id}
                    gerente={gerente}
                    index={index}
                    tasks={tasks}
                    onMove={moveGerente}
                  />
                ))}
              </div>
            </DndProvider>
          </div>
        )}

        {/* Setores Container */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full" />
              {isAdmin ? 'Setores Operacionais' : 'Setores'}
            </h3>
            <Badge variant="outline" className="border-white/10 bg-white/5 text-xs uppercase font-bold tracking-tighter">
              {visibleSectors.length} {visibleSectors.length === 1 ? 'Setor Ativo' : 'Setores Ativos'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleSectors.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 glass-card rounded-2xl border-dashed border-2 border-white/5">
                <p className="text-muted-foreground font-medium">Nenhum setor vinculado ao seu perfil.</p>
                <p className="text-xs text-muted-foreground opacity-60 mt-1">Solicite ao administrador para vincular seus setores.</p>
              </div>
            ) : visibleSectors.map(sector => {
              const sectorTasks = visibleTasks.filter(t => t.sectorId === sector.id);
              const sectorDone = sectorTasks.filter(t => t.status === 'done').length;
              const completion = sectorTasks.length > 0
                ? Math.round((sectorDone / sectorTasks.length) * 100)
                : 0;

              return (
                <div
                  key={sector.id}
                  className="sector-card relative glass-card p-5 rounded-2xl border-none"
                  onClick={() => navigate(`/kanban/${sector.id}`)}
                >
                  {/* Top Glow Bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                    style={{ background: `linear-gradient(to right, ${sector.color}, ${sector.color}dd)` }}
                  />

                  <div className="flex justify-between items-start mb-4">
                    <div className="sector-card-icon w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 transition-colors duration-300">
                      <span className="text-2xl">
                        {sector.id === 'recruitment' ? '👥' :
                          sector.id === 'compensation' ? '💰' :
                            sector.id === 'dho' ? '📋' :
                                sector.id === 'dp' ? '💼' :
                                  sector.id === 'data' ? '💾' :
                                    sector.id === 'edu-assistencial' ? '🎓' :
                                      sector.id === 'ensino-pesquisa' ? '🔬' : '📊'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-muted-foreground uppercase opacity-60">Status</p>
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-none text-xs h-5">
                        Ativo
                      </Badge>
                    </div>
                  </div>

                  <h4 className="sector-card-title font-bold text-lg mb-1 transition-colors duration-300">{sector.name}</h4>
                  <p className="text-sm text-muted-foreground mb-6">
                    {sectorTasks.length} {sectorTasks.length === 1 ? 'tarefa registrada' : 'tarefas registradas'}
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <span>Progresso</span>
                      <span className="text-foreground tracking-normal">{completion}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${completion}%`,
                          backgroundColor: sector.color,
                          boxShadow: `0 0 10px ${sector.color}44`
                        }}
                      />
                    </div>
                  </div>

                  {/* Hover Arrow Overlay */}
                  <div className="sector-card-arrow absolute bottom-4 right-4 opacity-0 transition-opacity duration-300">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <LayoutDashboard className="w-3 h-3 text-primary animate-pulse" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions & Recent Task */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {isAdmin ? (
            <Card className="lg:col-span-4 glass-card border-none">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400 font-bold" />
                  Gestão de Equipe
                </CardTitle>
                <CardDescription className="text-sm">Visualize e gerencie as permissões dos membros.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/admin/users')} className="w-full gradient-blue shadow-lg shadow-blue-500/20 border-none h-11">
                  Acessar Gerenciamento
                </Button>
                <div className="mt-6 pt-6 border-t border-white/5">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-sm font-bold text-muted-foreground">Colaboradores</span>
                    <Badge variant="outline" className="text-xs border-white/10 uppercase">{users.length} Total</Badge>
                  </div>
                  <div className="flex -space-x-3">
                    {users.slice(0, 8).map(user => (
                      <div key={user.id} className="ring-2 ring-background rounded-full transition-transform hover:translate-y-[-4px] cursor-pointer">
                        <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
                      </div>
                    ))}
                    {users.length > 8 && (
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-muted-foreground ring-2 ring-background">
                        +{users.length - 8}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="lg:col-span-4 glass-card border-none">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400 font-bold" />
                  Diretório da Equipe
                </CardTitle>
                <CardDescription className="text-sm">Visualize os membros da organização.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/admin/users')} variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10 h-11">
                  Ver Equipe
                </Button>
                <div className="mt-6 pt-6 border-t border-white/5">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-sm font-bold text-muted-foreground">Colaboradores</span>
                    <Badge variant="outline" className="text-xs border-white/10 uppercase">{users.length} Total</Badge>
                  </div>
                  <div className="flex -space-x-3">
                    {users.slice(0, 8).map(user => (
                      <div key={user.id} className="ring-2 ring-background rounded-full transition-transform hover:translate-y-[-4px] cursor-pointer">
                        <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
                      </div>
                    ))}
                    {users.length > 8 && (
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-muted-foreground ring-2 ring-background">
                        +{users.length - 8}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="lg:col-span-8 glass-card border-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Tarefas Recentes</CardTitle>
                <CardDescription className="text-sm">Acompanhamento em tempo real das últimas mudanças.</CardDescription>
              </div>
              <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-xs h-7 uppercase font-bold tracking-tight">Ver Tudo</Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleTasks.slice(0, 4).map(task => (
                  <div key={task.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                    <div className="w-2 h-10 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate mb-1">{task.title}</p>
                      <div className="flex items-center gap-2">
                        <SectorBadge sectorId={task.sectorId} size="sm" />
                        <Badge variant="outline" className="text-xs border-white/10 px-1.5 h-4 font-bold tracking-tight">
                          {task.status === 'done' ? 'FEITO' :
                            task.status === 'in-progress' ? 'AGORA' :
                              task.status === 'review' ? 'REVIEW' : 'FILA'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <UserRegistrationModal 
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onUserAdded={handleAddReceptor}
      />
    </div>
  );
}