import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { getCurrentUser, logoutUser, sectors } from '../data/mockData';
import { userService } from '../services/userService';
import { taskService } from '../services/taskService';
import { Task, User } from '../types';
import { UserAvatar } from '../components/UserAvatar';
import { LogOut, Inbox, CheckCircle2, Clock, LayoutDashboard, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const PRIORITY_LABELS = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Urgente' };
const PRIORITY_COLORS = {
  low: 'bg-emerald-500/10 text-emerald-400',
  medium: 'bg-yellow-500/10 text-yellow-400',
  high: 'bg-orange-500/10 text-orange-400',
  critical: 'bg-red-500/10 text-red-400',
};

export default function GerenteDashboard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [distributeModal, setDistributeModal] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'gerente') {
      navigate('/');
      return;
    }
    loadData();
  }, []);

  async function loadData() {
    try {
      const [allTasks, users] = await Promise.all([
        taskService.listTasks(),
        userService.listUsers(),
      ]);
      setMyTasks(allTasks.filter(t => t.delegated_to === currentUser!.id));
      setAllUsers(users);
    } catch {
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }

  function openDistribute(task: Task) {
    setSelectedSector('');
    setSelectedUser('');
    setDistributeModal({ open: true, task });
  }

  const usersInSelectedSector = selectedSector
    ? allUsers.filter(u => {
        const role = u.role as string;
        return (
          role === `admin-${selectedSector}` ||
          role === `user-${selectedSector}` ||
          (Array.isArray(u.sectors) && u.sectors.includes(selectedSector as any))
        );
      })
    : [];

  async function handleDistribute(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSector || !distributeModal.task) { toast.error('Selecione um setor.'); return; }
    setSaving(true);
    try {
      const updated: Task = {
        ...distributeModal.task,
        sectorId: selectedSector as any,
        assignedTo: selectedUser ? [selectedUser] : distributeModal.task.assignedTo,
        isPrivate: false,
        delegation_status: 'distributed',
      };
      await taskService.saveTask(updated);
      toast.success('Tarefa distribuída para o setor!');
      setDistributeModal({ open: false, task: null });
      loadData();
    } catch {
      toast.error('Erro ao distribuir tarefa.');
    } finally {
      setSaving(false);
    }
  }

  if (!currentUser) return null;

  const pendingTasks = myTasks.filter(t => t.delegation_status === 'pending');
  const distributedTasks = myTasks.filter(t => t.delegation_status === 'distributed');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-blue flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Inbox className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Painel da Gerente</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Fila de Distribuição</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <UserAvatar name={currentUser.name} avatar={currentUser.avatar} size="xs" />
              <span className="hidden md:block text-sm font-bold">{currentUser.name.split(' ')[0]}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { logoutUser(); navigate('/'); }}
              className="w-8 h-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-1 italic">
            Olá, <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{currentUser.name.split(' ')[0]}!</span>
          </h2>
          <p className="text-muted-foreground">Distribua as tarefas recebidas para os setores responsáveis.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Total Recebidas', value: myTasks.length, icon: LayoutDashboard, color: 'from-blue-500 to-indigo-600' },
            { label: 'Para Distribuir', value: pendingTasks.length, icon: Clock, color: 'from-yellow-400 to-orange-500' },
            { label: 'Distribuídas', value: distributedTasks.length, icon: CheckCircle2, color: 'from-emerald-400 to-teal-500' },
          ].map((stat, i) => (
            <Card key={i} className="glass-card border-none overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color}`} />
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold tracking-tighter">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} opacity-80`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Fila pendente */}
        <div className="mb-10">
          <h3 className="text-xl font-bold flex items-center gap-2 mb-5">
            <span className="w-1.5 h-6 bg-yellow-400 rounded-full" />
            Para Distribuir
            {pendingTasks.length > 0 && (
              <Badge className="bg-yellow-500/10 text-yellow-400 border-none">{pendingTasks.length}</Badge>
            )}
          </h3>

          {loading ? (
            <div className="text-muted-foreground text-sm">Carregando...</div>
          ) : pendingTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 glass-card rounded-2xl border-dashed border-2 border-white/5">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-3 opacity-60" />
              <p className="text-muted-foreground font-medium">Nenhuma tarefa aguardando distribuição.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map(task => (
                <div key={task.id} className="flex items-center gap-4 p-4 rounded-xl glass-card border-none">
                  <div className="w-1 h-10 rounded-full bg-yellow-400" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                    )}
                    {task.dueDate && (
                      <p className="text-xs text-muted-foreground mt-0.5">Prazo: {task.dueDate}</p>
                    )}
                  </div>
                  {task.priority && (
                    <Badge className={`${PRIORITY_COLORS[task.priority]} border-none text-xs shrink-0`}>
                      {PRIORITY_LABELS[task.priority]}
                    </Badge>
                  )}
                  <Button
                    onClick={() => openDistribute(task)}
                    className="gradient-blue border-none shadow-lg shadow-blue-500/20 h-8 gap-1 text-xs shrink-0"
                  >
                    Distribuir <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Já distribuídas */}
        {distributedTasks.length > 0 && (
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2 mb-5">
              <span className="w-1.5 h-6 bg-emerald-400 rounded-full" />
              Já Distribuídas
            </h3>
            <div className="space-y-3">
              {distributedTasks.map(task => {
                const sector = sectors.find(s => s.id === task.sectorId);
                return (
                  <div key={task.id} className="flex items-center gap-4 p-4 rounded-xl glass-card border-none opacity-70">
                    <div className="w-1 h-10 rounded-full bg-emerald-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{task.title}</p>
                      {sector && <p className="text-xs text-muted-foreground">{sector.name}</p>}
                    </div>
                    {task.priority && (
                      <Badge className={`${PRIORITY_COLORS[task.priority]} border-none text-xs shrink-0`}>
                        {PRIORITY_LABELS[task.priority]}
                      </Badge>
                    )}
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-xs shrink-0">
                      Distribuída
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modal de Distribuição */}
      <Dialog open={distributeModal.open} onOpenChange={open => setDistributeModal(d => ({ ...d, open }))}>
        <DialogContent className="sm:max-w-md bg-background border-white/10">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Distribuir Tarefa</DialogTitle>
          </DialogHeader>
          {distributeModal.task && (
            <form onSubmit={handleDistribute} className="space-y-4">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="font-bold text-sm">{distributeModal.task.title}</p>
                {distributeModal.task.description && (
                  <p className="text-xs text-muted-foreground mt-1">{distributeModal.task.description}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Setor destino</Label>
                <select
                  className="w-full h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  value={selectedSector}
                  onChange={e => { setSelectedSector(e.target.value); setSelectedUser(''); }}
                  required
                >
                  <option value="">Selecione um setor...</option>
                  {sectors.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              {usersInSelectedSector.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Atribuir para (opcional)</Label>
                  <select
                    className="w-full h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    value={selectedUser}
                    onChange={e => setSelectedUser(e.target.value)}
                  >
                    <option value="">Sem atribuição específica</option>
                    {usersInSelectedSector.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-white/10"
                  onClick={() => setDistributeModal({ open: false, task: null })}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 gradient-blue border-none" disabled={saving}>
                  {saving ? 'Distribuindo...' : 'Distribuir'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
