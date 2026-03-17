import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { getCurrentUser, logoutUser, sectors } from '../data/mockData';
import { userService } from '../services/userService';
import { taskService } from '../services/taskService';
import { User, Task } from '../types';
import { UserAvatar } from '../components/UserAvatar';
import {
  ArrowLeft,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  CalendarIcon,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

const PRIORITY_LABELS = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Urgente' };
const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
};
const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-emerald-400',
  medium: 'bg-yellow-400',
  high: 'bg-orange-400',
  critical: 'bg-red-500',
};

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

export default function GerenteView() {
  const navigate = useNavigate();
  const { gerenteId } = useParams<{ gerenteId: string }>();
  const currentUser = getCurrentUser();

  const [gerente, setGerente] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'distributed' | 'all'>('pending');
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: 'medium' as Task['priority'], dueDate: undefined as Date | undefined });
  const [editCalOpen, setEditCalOpen] = useState(false);
  const [delegateCalOpen, setDelegateCalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    dueDate: undefined as Date | undefined,
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'chefe') {
      navigate('/');
      return;
    }
    loadData();
  }, [gerenteId]);

  async function loadData() {
    try {
      const [allUsers, allTasks] = await Promise.all([
        userService.listUsers(),
        taskService.listTasks(),
      ]);
      const found = allUsers.find(u => u.id === gerenteId) || null;
      setGerente(found);
      setTasks(allTasks.filter(t => t.delegated_to === gerenteId));
    } catch {
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelegate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const task: Task = {
        id: generateId(),
        title: form.title,
        description: form.description,
        status: 'todo',
        sectorId: 'recruitment',
        assignedTo: [],
        isPrivate: true,
        createdBy: currentUser!.id,
        createdAt: new Date().toISOString(),
        dueDate: form.dueDate ? format(form.dueDate, 'yyyy-MM-dd') : undefined,
        tags: [],
        connections: [],
        priority: form.priority,
        delegated_to: gerenteId,
        delegation_status: 'pending',
      };
      await taskService.saveTask(task);
      toast.success('Tarefa delegada!');
      setModalOpen(false);
      setForm({ title: '', description: '', priority: 'medium', dueDate: '' });
      loadData();
    } catch {
      toast.error('Erro ao delegar tarefa.');
    } finally {
      setSaving(false);
    }
  }

  function openEditTask(task: Task) {
    setEditTask(task);
    setEditForm({
      title: task.title,
      description: task.description,
      priority: task.priority ?? 'medium',
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTask) return;
    setSaving(true);
    try {
      await taskService.saveTask({
        ...editTask,
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        dueDate: editForm.dueDate ? format(editForm.dueDate, 'yyyy-MM-dd') : undefined,
      });
      toast.success('Tarefa atualizada!');
      setEditTask(null);
      loadData();
    } catch {
      toast.error('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (!currentUser) return null;

  const pendingTasks = tasks.filter(t => t.delegation_status === 'pending');
  const distributedTasks = tasks.filter(t => t.delegation_status === 'distributed');

  const visibleTasks =
    activeTab === 'pending' ? pendingTasks :
    activeTab === 'distributed' ? distributedTasks :
    tasks;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="w-9 h-9 rounded-full hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {gerente && (
              <div className="flex items-center gap-3">
                <UserAvatar name={gerente.name} avatar={gerente.avatar} size="sm" />
                <div>
                  <h1 className="text-base font-bold leading-tight">{gerente.name}</h1>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                    {gerente.cargo || 'Gerente'}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { logoutUser(); navigate('/'); }}
              className="w-9 h-9 rounded-full hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">

        {/* Stat strip */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total', value: tasks.length, color: 'from-blue-500 to-indigo-600', icon: ChevronRight },
            { label: 'Aguardando', value: pendingTasks.length, color: 'from-yellow-400 to-orange-500', icon: Clock },
            { label: 'Distribuídas', value: distributedTasks.length, color: 'from-emerald-400 to-teal-500', icon: CheckCircle2 },
          ].map((s, i) => (
            <div key={i} className="glass-card rounded-2xl p-4 border-none relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${s.color}`} />
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">{s.label}</p>
              <p className="text-3xl font-bold tracking-tighter">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs and Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5 w-fit">
            {([
              { key: 'pending', label: 'Aguardando', count: pendingTasks.length },
              { key: 'distributed', label: 'Distribuídas', count: distributedTasks.length },
              { key: 'all', label: 'Todas', count: tasks.length },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.key ? 'bg-white/20' : 'bg-white/5'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <Button
            onClick={() => setModalOpen(true)}
            className="gradient-blue border-none shadow-lg shadow-blue-500/20 h-10 gap-2 px-5 font-bold"
          >
            <Plus className="h-5 w-5" /> Nova Tarefa
          </Button>
        </div>

        {/* Task list */}
        {loading ? (
          <div className="text-muted-foreground text-sm">Carregando...</div>
        ) : visibleTasks.length === 0 ? (
          <button
            onClick={() => setModalOpen(true)}
            className="w-full flex flex-col items-center justify-center py-20 glass-card rounded-2xl border-dashed border-2 border-white/10 hover:border-primary/40 hover:bg-white/5 transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/20 group-hover:border-primary/60 flex items-center justify-center mb-3 transition-colors">
              <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-muted-foreground text-sm font-medium group-hover:text-foreground transition-colors">Nenhuma tarefa aqui. Clique para adicionar.</p>
          </button>
        ) : (
          <div className="space-y-2">
            {visibleTasks.map(task => {
              const sector = sectors.find(s => s.id === task.sectorId);
              const isDistributed = task.delegation_status === 'distributed';
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl glass-card border-none group transition-all duration-200 ${!isDistributed ? 'cursor-pointer hover:translate-y-[-1px] hover:bg-white/5' : ''}`}
                  onClick={() => !isDistributed && openEditTask(task)}
                >
                  {/* Status indicator */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isDistributed ? 'bg-emerald-400' : 'bg-yellow-400 animate-pulse'}`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {isDistributed && sector && (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${sector.color}18`, color: sector.color }}
                        >
                          {sector.name}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          {task.dueDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-2 shrink-0">
                    {task.priority && (
                      <Badge className={`${PRIORITY_COLORS[task.priority]} border text-xs h-5 font-semibold hidden sm:flex`}>
                        {PRIORITY_LABELS[task.priority]}
                      </Badge>
                    )}
                    <Badge className={`border-none text-xs h-5 font-semibold ${isDistributed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {isDistributed ? 'Distribuída' : 'Aguardando'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal editar tarefa pendente */}
      <Dialog open={!!editTask} onOpenChange={open => !open && setEditTask(null)}>
        <DialogContent className="sm:max-w-md bg-background border-white/10">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Editar Tarefa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input
                value={editForm.title}
                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prioridade</Label>
                <Select
                  value={editForm.priority}
                  onValueChange={v => setEditForm(f => ({ ...f, priority: v as any }))}
                >
                  <SelectTrigger className="border-white/10 bg-white/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />Baixa</span></SelectItem>
                    <SelectItem value="medium"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />Média</span></SelectItem>
                    <SelectItem value="high"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />Alta</span></SelectItem>
                    <SelectItem value="critical"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />Urgente</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prazo</Label>
                <Popover open={editCalOpen} onOpenChange={setEditCalOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start border-white/10 bg-white/5 hover:bg-white/10 font-normal text-sm h-10">
                      <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      {editForm.dueDate ? format(editForm.dueDate, "dd 'de' MMMM", { locale: ptBR }) : <span className="text-muted-foreground">Selecionar data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-white/10 bg-background" align="start">
                    <Calendar
                      mode="single"
                      selected={editForm.dueDate}
                      onSelect={d => { setEditForm(f => ({ ...f, dueDate: d })); setEditCalOpen(false); }}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1 border-white/10" onClick={() => setEditTask(null)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 gradient-blue border-none" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal delegar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md bg-background border-white/10">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Nova Tarefa para {gerente?.name.split(' ')[0]}
            </DialogTitle>
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
                <Select
                  value={form.priority}
                  onValueChange={v => setForm(f => ({ ...f, priority: v as any }))}
                >
                  <SelectTrigger className="border-white/10 bg-white/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />Baixa</span></SelectItem>
                    <SelectItem value="medium"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />Média</span></SelectItem>
                    <SelectItem value="high"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />Alta</span></SelectItem>
                    <SelectItem value="critical"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />Urgente</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prazo</Label>
                <Popover open={delegateCalOpen} onOpenChange={setDelegateCalOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start border-white/10 bg-white/5 hover:bg-white/10 font-normal text-sm h-10">
                      <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      {form.dueDate ? format(form.dueDate, "dd 'de' MMMM", { locale: ptBR }) : <span className="text-muted-foreground">Selecionar data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-white/10 bg-background" align="start">
                    <Calendar
                      mode="single"
                      selected={form.dueDate}
                      onSelect={d => { setForm(f => ({ ...f, dueDate: d })); setDelegateCalOpen(false); }}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1 border-white/10" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 gradient-blue border-none" disabled={saving}>
                {saving ? 'Adicionando...' : 'Adicionar Tarefa'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
