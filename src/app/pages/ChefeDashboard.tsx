import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { getCurrentUser, logoutUser } from '../data/mockData';
import { userService } from '../services/userService';
import { taskService } from '../services/taskService';
import { User, Task } from '../types';
import { UserAvatar } from '../components/UserAvatar';
import { LogOut, Plus, Clock, CheckCircle2, AlertCircle, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';

const PRIORITY_LABELS = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Urgente' };
const PRIORITY_COLORS = {
  low: 'bg-emerald-500/10 text-emerald-400',
  medium: 'bg-yellow-500/10 text-yellow-400',
  high: 'bg-orange-500/10 text-orange-400',
  critical: 'bg-red-500/10 text-red-400',
};

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

export default function ChefeDashboard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [gerentes, setGerentes] = useState<User[]>([]);
  const [delegatedTasks, setDelegatedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    dueDate: '',
    delegated_to: '',
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'chefe') {
      navigate('/');
      return;
    }
    loadData();
  }, []);

  async function loadData() {
    try {
      const [allUsers, allTasks] = await Promise.all([
        userService.listUsers(),
        taskService.listTasks(),
      ]);
      setGerentes(allUsers.filter(u => u.role === 'gerente'));
      setDelegatedTasks(allTasks.filter(t => t.createdBy === currentUser!.id && t.delegation_status));
    } catch {
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }

  function openModal(gerenteId?: string) {
    setForm({ title: '', description: '', priority: 'medium', dueDate: '', delegated_to: gerenteId || '' });
    setModalOpen(true);
  }

  async function handleDelegate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.delegated_to) { toast.error('Selecione uma gerente.'); return; }
    setSaving(true);
    try {
      const task: Task = {
        id: generateId(),
        title: form.title,
        description: form.description,
        status: 'todo',
        sectorId: 'recruitment', // placeholder, gerente vai escolher
        assignedTo: [],
        isPrivate: true,
        createdBy: currentUser!.id,
        createdAt: new Date().toISOString(),
        dueDate: form.dueDate || undefined,
        tags: [],
        connections: [],
        priority: form.priority,
        delegated_to: form.delegated_to,
        delegation_status: 'pending',
      };
      await taskService.saveTask(task);
      toast.success('Tarefa delegada com sucesso!');
      setModalOpen(false);
      loadData();
    } catch {
      toast.error('Erro ao delegar tarefa.');
    } finally {
      setSaving(false);
    }
  }

  if (!currentUser) return null;

  const pendingCount = delegatedTasks.filter(t => t.delegation_status === 'pending').length;
  const distributedCount = delegatedTasks.filter(t => t.delegation_status === 'distributed').length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-blue flex items-center justify-center shadow-lg shadow-blue-500/20">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Painel do Chefe</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Delegação de Tarefas</p>
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
          <p className="text-muted-foreground">Delegue tarefas para as gerentes e acompanhe o status.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Total Delegadas', value: delegatedTasks.length, icon: LayoutDashboard, color: 'from-blue-500 to-indigo-600' },
            { label: 'Aguardando', value: pendingCount, icon: Clock, color: 'from-yellow-400 to-orange-500' },
            { label: 'Distribuídas', value: distributedCount, icon: CheckCircle2, color: 'from-emerald-400 to-teal-500' },
          ].map((stat, i) => (
            <Card key={i} className="glass-card border-none overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color}`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</CardTitle>
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${stat.color} opacity-80`}>
                  <stat.icon className="h-3.5 w-3.5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tighter">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gerentes */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full" />
              Gerentes
            </h3>
            <Button onClick={() => openModal()} className="gradient-blue border-none shadow-lg shadow-blue-500/20 h-9 gap-2">
              <Plus className="h-4 w-4" /> Nova Delegação
            </Button>
          </div>

          {loading ? (
            <div className="text-muted-foreground text-sm">Carregando...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {gerentes.map(gerente => {
                const gerenteTasks = delegatedTasks.filter(t => t.delegated_to === gerente.id);
                const pending = gerenteTasks.filter(t => t.delegation_status === 'pending').length;
                return (
                  <Card key={gerente.id} className="glass-card border-none">
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-3 mb-4">
                        <UserAvatar name={gerente.name} avatar={gerente.avatar} size="md" />
                        <div className="min-w-0">
                          <p className="font-bold text-sm leading-tight truncate">{gerente.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{gerente.cargo || 'Gerente'}</p>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-4">
                        <span>{gerenteTasks.length} tarefas</span>
                        {pending > 0 && (
                          <Badge className="bg-yellow-500/10 text-yellow-400 border-none text-xs h-5">
                            {pending} pendente{pending > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <Button
                        onClick={() => openModal(gerente.id)}
                        variant="outline"
                        className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-xs h-8 gap-1"
                      >
                        <Plus className="h-3 w-3" /> Delegar para ela
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Tarefas Delegadas */}
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 mb-5">
            <span className="w-1.5 h-6 bg-primary rounded-full" />
            Tarefas Delegadas
          </h3>

          {delegatedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 glass-card rounded-2xl border-dashed border-2 border-white/5">
              <AlertCircle className="h-8 w-8 text-muted-foreground mb-3 opacity-40" />
              <p className="text-muted-foreground font-medium">Nenhuma tarefa delegada ainda.</p>
              <p className="text-xs text-muted-foreground opacity-60 mt-1">Use o botão "Nova Delegação" para começar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {delegatedTasks.map(task => {
                const gerente = gerentes.find(g => g.id === task.delegated_to);
                return (
                  <div key={task.id} className="flex items-center gap-4 p-4 rounded-xl glass-card border-none">
                    <div className={`w-1 h-10 rounded-full ${task.delegation_status === 'distributed' ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                    </div>
                    {task.priority && (
                      <Badge className={`${PRIORITY_COLORS[task.priority]} border-none text-xs shrink-0`}>
                        {PRIORITY_LABELS[task.priority]}
                      </Badge>
                    )}
                    {gerente && (
                      <div className="flex items-center gap-2 shrink-0">
                        <UserAvatar name={gerente.name} avatar={gerente.avatar} size="xs" />
                        <span className="text-xs text-muted-foreground hidden sm:block">{gerente.name.split(' ')[0]}</span>
                      </div>
                    )}
                    <Badge className={`border-none text-xs shrink-0 ${task.delegation_status === 'distributed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {task.delegation_status === 'distributed' ? 'Distribuída' : 'Aguardando'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Delegação */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md bg-background border-white/10">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Delegar Tarefa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDelegate} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input
                placeholder="O que precisa ser feito?"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Detalhe a tarefa..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prioridade</Label>
                <select
                  className="w-full h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value as any }))}
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="critical">Urgente</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Prazo</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Gerente responsável</Label>
              <select
                className="w-full h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.delegated_to}
                onChange={e => setForm(f => ({ ...f, delegated_to: e.target.value }))}
                required
              >
                <option value="">Selecione uma gerente...</option>
                {gerentes.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1 border-white/10" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 gradient-blue border-none" disabled={saving}>
                {saving ? 'Delegando...' : 'Delegar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
