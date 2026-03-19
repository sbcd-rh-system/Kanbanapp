import { useState, useEffect, useRef } from 'react';
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
import { getCurrentUser } from '../data/mockData';
import { userService } from '../services/userService';
import { taskService } from '../services/taskService';
import { User, Task, TaskAttachment } from '../types';
import { UserAvatar } from '../components/UserAvatar';
import { Plus, Clock, CheckCircle2, AlertCircle, LayoutDashboard, Paperclip, X, FileText, Image, File, Pencil, Trash2, Mic, MicOff } from 'lucide-react';
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
  const [detailTask, setDetailTask] = useState<{ tasks: Task[]; recipients: User[] } | null>(null);
  const [editingBatch, setEditingBatch] = useState<Task[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Task[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'person'>('date');

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    dueDate: '',
    delegated_to: [] as string[],
    attachments: [] as TaskAttachment[],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recordingField, setRecordingField] = useState<'title' | 'description' | null>(null);
  const recognitionRef = useRef<any>(null);

  function startRecording(field: 'title' | 'description') {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Seu browser não suporta reconhecimento de voz.');
      return;
    }
    if (recordingField) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;
    setRecordingField(field);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setForm(f => ({ ...f, [field]: f[field] ? f[field] + ' ' + transcript : transcript }));
    };
    recognition.onerror = () => toast.error('Erro no reconhecimento de voz.');
    recognition.onend = () => setRecordingField(null);
    recognition.start();
  }

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'chefe') {
      navigate('/');
      return;
    }
    loadData();
  }, [currentUser]);

  if (!currentUser) return null;

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
    setEditingBatch(null);
    setForm({ title: '', description: '', priority: 'medium', dueDate: '', delegated_to: gerenteId ? [gerenteId] : [], attachments: [] });
    setModalOpen(true);
  }

  function openEditModal(batch: Task[]) {
    const task = batch[0];
    setEditingBatch(batch);
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority || 'medium',
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      delegated_to: batch.map(t => t.delegated_to!).filter(Boolean),
      attachments: task.attachments || [],
    });
    setDetailTask(null);
    setModalOpen(true);
  }

  async function handleDeleteBatch(batch: Task[]) {
    setDeleting(true);
    try {
      await Promise.all(batch.map(t => taskService.deleteTask(t.id)));
      toast.success('Tarefa excluída.');
      setConfirmDelete(null);
      setDetailTask(null);
      await loadData();
    } catch {
      toast.error('Erro ao excluir tarefa.');
    } finally {
      setDeleting(false);
    }
  }

  function toggleGerente(id: string) {
    setForm(f => ({
      ...f,
      delegated_to: f.delegated_to.includes(id)
        ? f.delegated_to.filter(x => x !== id)
        : [...f.delegated_to, id],
    }));
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const attachment: TaskAttachment = {
          id: Math.random().toString(36).slice(2, 11),
          name: file.name,
          url: reader.result as string,
          type: file.type,
          createdAt: new Date().toISOString(),
        };
        setForm(f => ({ ...f, attachments: [...f.attachments, attachment] }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  function removeAttachment(id: string) {
    setForm(f => ({ ...f, attachments: f.attachments.filter(a => a.id !== id) }));
  }

  function getFileIcon(type: string) {
    if (type.startsWith('image/')) return Image;
    if (type === 'application/pdf' || type.includes('text')) return FileText;
    return File;
  }

  async function handleDelegate(e: React.FormEvent) {
    e.preventDefault();
    if (form.delegated_to.length === 0) { toast.error('Selecione ao menos um receptor.'); return; }
    setSaving(true);
    try {
      if (editingBatch) {
        await Promise.all(editingBatch.map(t => taskService.deleteTask(t.id)));
      }
      const batchId = editingBatch?.[0]?.batchId || generateId();
      const createdAt = editingBatch?.[0]?.createdAt || new Date().toISOString();
      await Promise.all(
        form.delegated_to.map(gerenteId =>
          taskService.saveTask({
            id: generateId(),
            title: form.title,
            description: form.description,
            status: 'todo',
            sectorId: 'recruitment',
            assignedTo: [],
            isPrivate: true,
            createdBy: currentUser!.id,
            createdAt,
            dueDate: form.dueDate || undefined,
            tags: [],
            connections: [],
            priority: form.priority,
            delegated_to: gerenteId,
            delegation_status: 'pending',
            attachments: form.attachments,
            batchId,
          } as Task)
        )
      );
      const count = form.delegated_to.length;
      toast.success(editingBatch ? 'Tarefa atualizada!' : count > 1 ? `Tarefa delegada para ${count} receptores!` : 'Tarefa delegada com sucesso!');
      setEditingBatch(null);
      setModalOpen(false);
      await loadData();
    } catch {
      toast.error('Erro ao delegar tarefa.');
    } finally {
      setSaving(false);
    }
  }

  if (!currentUser) return null;

  // Group tasks by batchId (or by individual id if no batchId)
  const groupedTasks: { tasks: Task[]; recipients: User[] }[] = [];
  const seen = new Set<string>();
  for (const task of delegatedTasks) {
    const key = task.batchId || task.id;
    if (seen.has(key)) continue;
    seen.add(key);
    const batch = task.batchId
      ? delegatedTasks.filter(t => t.batchId === task.batchId)
      : [task];
    const recipients = batch.map(t => gerentes.find(g => g.id === t.delegated_to)).filter(Boolean) as User[];
    groupedTasks.push({ tasks: batch, recipients });
  }

  const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedTasks = [...groupedTasks].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.tasks[0].createdAt).getTime() - new Date(a.tasks[0].createdAt).getTime();
    }
    if (sortBy === 'priority') {
      const pa = PRIORITY_ORDER[a.tasks[0].priority || 'low'] ?? 3;
      const pb = PRIORITY_ORDER[b.tasks[0].priority || 'low'] ?? 3;
      return pa - pb;
    }
    if (sortBy === 'person') {
      const nameA = a.recipients[0]?.name || '';
      const nameB = b.recipients[0]?.name || '';
      return nameA.localeCompare(nameB, 'pt-BR');
    }
    return 0;
  });

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
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-1 italic">
            Olá, <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{currentUser.name.split(' ')[0]}!</span>
          </h2>
          <p className="text-muted-foreground">Delegue tarefas para os receptores e acompanhe o status.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-10">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full" />
              Delegar Tarefas
            </h3>
            <Button onClick={() => openModal()} className="gradient-blue border-none shadow-lg shadow-blue-500/20 h-9 gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Nova Delegação
            </Button>
          </div>

          {loading ? (
            <div className="text-muted-foreground text-sm">Carregando...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
                          <p className="text-xs text-muted-foreground truncate">{gerente.cargo || 'Receptor'}</p>
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
                        <Plus className="h-3 w-3" /> Adicionar tarefa
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
              {sortedTasks.map(({ tasks: batch, recipients }) => {
                const task = batch[0];
                const allDistributed = batch.every(t => t.delegation_status === 'distributed');
                const attachCount = (task.attachments || []).length;
                return (
                  <div key={task.id} className="flex items-center gap-4 p-4 rounded-xl glass-card border-none">
                    <div className={`w-1 h-10 rounded-full ${task.delegation_status === 'distributed' ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                    </div>
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(task.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {task.priority && (
                      <Badge className={`${PRIORITY_COLORS[task.priority]} border-none text-xs shrink-0 hidden sm:flex`}>
                        {PRIORITY_LABELS[task.priority]}
                      </Badge>
                    )}
                    <Badge className={`border-none text-xs shrink-0 ${allDistributed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {allDistributed ? 'Distribuída' : 'Aguardando'}
                    </Badge>
                    <div className="flex items-center shrink-0">
                      {recipients.map((r, i) => (
                        <div key={r.id} style={{ marginLeft: i > 0 ? '-6px' : 0 }}>
                          <UserAvatar name={r.name} avatar={r.avatar} size="xs" />
                        </div>
                      ))}
                      {recipients.length > 1 && (
                        <span className="ml-2 text-xs text-muted-foreground">{recipients.length}</span>
                      )}
                    </div>
                    {attachCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Paperclip className="h-3 w-3" />{attachCount}
                      </div>
                    )}
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => openEditModal(batch)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Excluir"
                        onClick={() => setConfirmDelete(batch)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
            <DialogTitle className="text-lg font-bold">{editingBatch ? 'Editar Tarefa' : 'Delegar Tarefa'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDelegate} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <div className="relative">
                <Input
                  placeholder="O que precisa ser feito?"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => startRecording('title')}
                  title="Falar título"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
                    recordingField === 'title'
                      ? 'text-red-400 animate-pulse'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {recordingField === 'title' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <div className="relative">
                <Textarea
                  placeholder="Detalhe a tarefa..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => startRecording('description')}
                  title="Falar descrição"
                  className={`absolute right-2 top-2 p-1 rounded-md transition-colors ${
                    recordingField === 'description'
                      ? 'text-red-400 animate-pulse'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {recordingField === 'description' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prioridade</Label>
                <select
                  className="w-full h-10 rounded-md border border-white/10 bg-[#0f0f14] px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  style={{ colorScheme: 'dark' }}
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
              <Label>
                Receptores responsáveis
                {form.delegated_to.length > 0 && (
                  <span className="ml-2 text-xs text-primary font-normal">{form.delegated_to.length} selecionado{form.delegated_to.length > 1 ? 's' : ''}</span>
                )}
              </Label>
              <div className="rounded-md border border-white/10 bg-[#0f0f14] divide-y divide-white/5 overflow-hidden">
                {gerentes.map(g => {
                  const checked = form.delegated_to.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGerente(g.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5 ${checked ? 'bg-primary/10' : ''}`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-primary border-primary' : 'border-white/20'}`}>
                        {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <UserAvatar name={g.name} avatar={g.avatar} size="xs" />
                      <span className="text-sm text-foreground truncate">{g.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Anexos</Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-md border border-dashed border-white/20 bg-white/5 hover:bg-white/10 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Paperclip className="h-4 w-4" />
                Clique para anexar arquivos
              </button>
              {form.attachments.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {form.attachments.map(att => {
                    const Icon = getFileIcon(att.type);
                    return (
                      <div key={att.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-xs text-foreground flex-1 truncate">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="p-0.5 rounded hover:bg-white/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1 border-white/10" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 gradient-blue border-none" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes */}
      <Dialog open={!!detailTask} onOpenChange={open => !open && setDetailTask(null)}>
        <DialogContent className="sm:max-w-lg bg-background border-white/10 max-h-[90vh] overflow-y-auto">
          {detailTask && (() => {
            const task = detailTask.tasks[0];
            const allDistributed = detailTask.tasks.every(t => t.delegation_status === 'distributed');
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold pr-6">{task.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 mt-1">
                  {/* Status + Prioridade */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`border-none text-xs ${allDistributed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {allDistributed ? 'Distribuída' : 'Aguardando'}
                    </Badge>
                    {task.priority && (
                      <Badge className={`${PRIORITY_COLORS[task.priority]} border-none text-xs`}>
                        {PRIORITY_LABELS[task.priority]}
                      </Badge>
                    )}
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground">Prazo: {new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>

                  {/* Descrição */}
                  {task.description && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Descrição</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{task.description}</p>
                    </div>
                  )}

                  {/* Receptores */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">
                      Receptor{detailTask.recipients.length > 1 ? 'es' : ''}
                    </p>
                    <div className="space-y-2">
                      {detailTask.tasks.map(t => {
                        const r = detailTask.recipients.find(x => x.id === t.delegated_to);
                        if (!r) return null;
                        return (
                          <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5">
                            <UserAvatar name={r.name} avatar={r.avatar} size="xs" />
                            <span className="text-sm flex-1">{r.name}</span>
                            <Badge className={`border-none text-xs ${t.delegation_status === 'distributed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                              {t.delegation_status === 'distributed' ? 'Distribuída' : 'Aguardando'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Anexos */}
                  {(task.attachments || []).length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">
                        Anexos ({task.attachments!.length})
                      </p>
                      <div className="space-y-2">
                        {task.attachments!.map(att => {
                          const isImage = att.type.startsWith('image/');
                          return (
                            <div key={att.id} className="rounded-lg border border-white/10 overflow-hidden">
                              {isImage ? (
                                <img src={att.url} alt={att.name} className="w-full max-h-48 object-contain bg-black/30" />
                              ) : null}
                              <div className="flex items-center gap-2 px-3 py-2 bg-white/5">
                                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="text-xs text-foreground flex-1 truncate">{att.name}</span>
                                <a
                                  href={att.url}
                                  download={att.name}
                                  className="text-xs text-primary hover:underline shrink-0"
                                  onClick={e => e.stopPropagation()}
                                >
                                  Baixar
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Ações */}
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <Button
                      variant="outline"
                      className="flex-1 border-white/10 gap-2"
                      onClick={() => openEditModal(detailTask.tasks)}
                    >
                      <Pencil className="h-4 w-4" /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400 gap-2"
                      onClick={() => { setConfirmDelete(detailTask.tasks); setDetailTask(null); }}
                    >
                      <Trash2 className="h-4 w-4" /> Excluir
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <Dialog open={!!confirmDelete} onOpenChange={open => !open && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm bg-background border-white/10">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Excluir tarefa?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmDelete && confirmDelete.length > 1
              ? `Isso vai excluir a tarefa para ${confirmDelete.length} receptores. Essa ação não pode ser desfeita.`
              : 'Essa ação não pode ser desfeita.'}
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1 border-white/10" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border-none"
              disabled={deleting}
              onClick={() => confirmDelete && handleDeleteBatch(confirmDelete)}
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
