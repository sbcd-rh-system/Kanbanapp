import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Task, SectorId, TaskStatus, User, Project } from '../types';
import { taskService } from '../services/taskService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { X, Paperclip, MessageSquare, History, UserPlus, Eye, Save, Send, MoreVertical, PlusCircle } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { UserAvatar } from './UserAvatar';
import { getCurrentUser } from '../data/mockData';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  task?: Task;
  sectorId: SectorId;
  users: User[];
  projects?: Project[];
}

export function TaskModal({ open, onClose, onSave, task, sectorId, users, projects = [] }: TaskModalProps) {
  const currentUser = getCurrentUser();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [points, setPoints] = useState(0);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newComment, setNewComment] = useState('');
  const [connectionSearch, setConnectionSearch] = useState('');
  const [connectionSearchOpen, setConnectionSearchOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [projectId, setProjectId] = useState<string | undefined>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormatting = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end);

    let formattedText = '';
    switch (format) {
      case 'bold': formattedText = `**${selectedText}**`; break;
      case 'italic': formattedText = `_${selectedText}_`; break;
      case 'underline': formattedText = `<u>${selectedText}</u>`; break;
      case 'h1': formattedText = `\n# ${selectedText}`; break;
      case 'h2': formattedText = `\n## ${selectedText}`; break;
      default: formattedText = selectedText;
    }

    const newDescription = description.substring(0, start) + formattedText + description.substring(end);
    setDescription(newDescription);

    // Focus back and set selection
    setTimeout(() => {
      textarea.focus();
      const newPos = start + formattedText.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  useEffect(() => {
    if (open) {
      taskService.listTasks().then(setAllTasks).catch(console.error);
    }
  }, [open]);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setIsPrivate(task.isPrivate || false);
      setStatus(task.status || 'todo');
      setAssignedTo(task.assignedTo || []);
      setDueDate(task.dueDate || '');
      setTags(task.tags || []);
      setSelectedConnections(task.connections || []);
      setPoints(task.points || 0);
      setPriority(task.priority || 'medium');
      setProjectId(task.projectId);
    } else {
      setTitle('');
      setDescription('');
      setIsPrivate(false);
      setStatus('todo');
      setAssignedTo([]);
      setDueDate('');
      setTags([]);
      setSelectedConnections([]);
      setPoints(0);
      setPriority('medium');
      setProjectId(undefined);
    }
  }, [task, open]);

  const availableTasks = allTasks.filter(
    t => t.id !== task?.id
  );

  const filteredAvailableTasks = availableTasks.filter(
    t => !selectedConnections.includes(t.id) &&
      (connectionSearch === '' || t.title.toLowerCase().includes(connectionSearch.toLowerCase()))
  );

  const filteredUsers = users.filter(
    u => !assignedTo.includes(u.id) &&
      (userSearch === '' || u.name.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const filteredAvailableUsers = users.filter(
    u => !assignedTo.includes(u.id) &&
      (userSearch === '' || u.name.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const handleSave = () => {
    const taskData: Partial<Task> = {
      title,
      description,
      isPrivate,
      status,
      assignedTo,
      dueDate: dueDate || undefined,
      tags,
      connections: selectedConnections,
      sectorId,
      points,
      priority,
      projectId,
    };

    onSave(taskData);
    onClose();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const toggleAssignee = (userId: string) => {
    setAssignedTo(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleConnection = (taskId: string) => {
    setSelectedConnections(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent hideClose className="max-w-[98vw] w-[98vw] h-[95vh] rounded-[2.5rem] p-0 overflow-hidden bg-background/95 backdrop-blur-3xl border-white/10 shadow-2xl flex flex-col">
        <DialogTitle className="sr-only">Detalhes da Tarefa: {title}</DialogTitle>
        <DialogDescription className="sr-only">Visualize e edite os detalhes, responsáveis e conexões desta tarefa.</DialogDescription>

        {/* Header - Top Section */}
        <div className="flex items-center justify-between px-10 pt-12 pb-8 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-8">
            <span className="text-2xl font-mono text-primary/40 font-bold">#{task?.id ? task.id.split('-')[1] || task.id : 'NOVA'}</span>
            <div className="space-y-1">
              <input
                className="text-3xl font-black bg-transparent border-none outline-none w-[600px] placeholder:text-muted-foreground/20 focus:ring-0 text-foreground"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Título da Tarefa"
              />
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/20 bg-primary/5 text-primary">História de Usuário</Badge>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-40">
                  Criado por {users.find(u => u.id === task?.createdBy)?.name || 'Sistema'} em {task ? `${new Date(task.createdAt).toLocaleDateString()} ${new Date(task.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Hoje'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-12 w-12 text-muted-foreground hover:text-white rounded-2xl hover:bg-white/5 transition-all">
              <MoreVertical className="h-6 w-6" />
            </Button>
            <Button variant="ghost" onClick={onClose} size="icon" className="h-12 w-12 text-muted-foreground hover:text-white rounded-2xl hover:bg-white/5 transition-all">
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Content - Left Side */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-white/5">
            <ScrollArea className="flex-1">
              <div className="px-10 py-8 space-y-10">
                {/* Meta Bar - Above Editor */}
                <div className="flex items-center gap-3 flex-wrap">
                  {tags.map(tag => (
                    <Badge key={tag} className="bg-primary/10 border-primary/20 text-primary py-1.5 px-4 rounded-full text-xs font-bold hover:bg-primary/20 transition-colors">
                      {tag}
                      <X className="h-3 w-3 ml-2 cursor-pointer opacity-50 hover:opacity-100" onClick={() => handleRemoveTag(tag)} />
                    </Badge>
                  ))}
                  <div className="relative">
                    <input
                      className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs outline-none w-32 h-8 focus:border-primary/50 transition-all font-bold placeholder:text-muted-foreground/30"
                      placeholder="adicionar etiqueta+"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                    />
                  </div>
                </div>

                {/* Rich Editor Area Mock */}
                <div className="space-y-4">
                  <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-8 min-h-[400px] shadow-inner relative group">
                    <div className="flex gap-4 mb-6 border-b border-white/5 pb-6 overflow-x-auto no-scrollbar opacity-50 group-hover:opacity-100 transition-opacity">
                      <Button onClick={() => applyFormatting('bold')} variant="ghost" size="sm" className="h-10 px-3 font-bold text-lg hover:bg-white/5">B</Button>
                      <Button onClick={() => applyFormatting('italic')} variant="ghost" size="sm" className="h-10 px-3 italic text-lg hover:bg-white/5">I</Button>
                      <Button onClick={() => applyFormatting('underline')} variant="ghost" size="sm" className="h-10 px-3 underline text-lg hover:bg-white/5">U</Button>
                      <Separator orientation="vertical" className="h-6 bg-white/10 mx-2" />
                      <Button onClick={() => applyFormatting('h1')} variant="ghost" size="sm" className="h-10 px-3 font-bold hover:bg-white/5">H1</Button>
                      <Button onClick={() => applyFormatting('h2')} variant="ghost" size="sm" className="h-10 px-3 font-bold hover:bg-white/5">H2</Button>
                      <Separator orientation="vertical" className="h-6 bg-white/10 mx-2" />
                      <Button variant="ghost" size="sm" className="h-10 px-3 hover:bg-white/5"><PlusCircle className="h-5 w-5" /></Button>
                    </div>
                    <Textarea
                      ref={textareaRef}
                      className="bg-transparent border-none resize-none focus-visible:ring-0 px-0 pt-2 text-lg leading-relaxed placeholder:text-muted-foreground/20 min-h-[250px]"
                      placeholder="Descreva os objetivos, critérios de aceitação e detalhes desta tarefa..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                    <div className="flex justify-end gap-3 pt-8 border-t border-white/5 mt-6">
                      <Button variant="ghost" className="rounded-2xl h-12 px-8 font-bold text-muted-foreground">Cancelar</Button>
                      <Button onClick={handleSave} className="gradient-blue rounded-2xl h-12 px-8 font-bold shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                        <Save className="h-5 w-5 mr-2" /> Salvar Alterações
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Sections: Attachments, Connections, Activities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl transition-all hover:bg-white/[0.04]">
                    <div className="p-5 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-3 text-muted-foreground">
                        <Paperclip className="h-4 w-4 text-primary" /> Anexos (0)
                      </h3>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-white/10 transition-all">
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="px-8 py-12 text-center border-2 border-dashed border-white/5 m-5 rounded-[1.5rem] group cursor-pointer hover:border-primary/20 transition-all">
                      <p className="text-sm text-muted-foreground/40 font-bold group-hover:text-primary/50 transition-colors">Arraste arquivos ou clique para anexar</p>
                    </div>
                  </div>

                  <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl transition-all hover:bg-white/[0.04]">
                    <div className="p-5 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-3 text-muted-foreground">
                        <History className="h-4 w-4 text-primary" /> Conexões ({selectedConnections.length})
                      </h3>
                    </div>
                    <div className="p-5 flex flex-col gap-3">
                      {/* Search to add connections */}
                      <div className="relative">
                        <input
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-primary/40 transition-all placeholder:text-muted-foreground/30"
                          placeholder="Buscar tarefa para vincular..."
                          value={connectionSearch}
                          onChange={e => setConnectionSearch(e.target.value)}
                          onFocus={() => setConnectionSearchOpen(true)}
                          onBlur={() => setTimeout(() => setConnectionSearchOpen(false), 150)}
                        />
                        {connectionSearchOpen && filteredAvailableTasks.length > 0 && (
                          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-zinc-900/95 backdrop-blur border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                            {filteredAvailableTasks.map(t => (
                              <button
                                key={t.id}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/10 transition-all text-xs group"
                                onMouseDown={() => { toggleConnection(t.id); setConnectionSearch(''); }}
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                                <span className="font-bold flex-1 truncate">{t.title}</span>
                                <span className="text-muted-foreground/40 uppercase text-[9px] tracking-widest flex-shrink-0">{t.status.replace('-', ' ')}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Connected tasks list */}
                      <div className="flex flex-col gap-2 min-h-[80px]">
                        {selectedConnections.map(cid => {
                          const ct = allTasks.find(t => t.id === cid);
                          return ct ? (
                            <div key={cid} className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-lg shadow-primary/50 flex-shrink-0" />
                              <span className="text-xs font-bold flex-1 truncate">{ct.title}</span>
                              <span className="text-[9px] text-muted-foreground/40 uppercase tracking-widest flex-shrink-0">{ct.status.replace('-', ' ')}</span>
                              <button
                                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-all"
                                onClick={(e) => { e.stopPropagation(); toggleConnection(cid); }}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : null;
                        })}
                        {selectedConnections.length === 0 && (
                          <div className="flex-1 flex items-center justify-center py-6">
                            <p className="text-center text-xs text-muted-foreground/30 font-bold italic">Nenhuma tarefa vinculada</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="space-y-6 pb-10">
                  <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-3 px-2 text-muted-foreground">
                    <MessageSquare className="h-4 w-4 text-primary" /> Atividades & Comentários
                  </h3>
                  <div className="bg-white/5 border border-white/5 rounded-[2rem] p-8 shadow-inner">
                    <div className="flex gap-6">
                      <div className="bg-gradient-to-br from-primary to-blue-600 p-0.5 rounded-2xl h-fit">
                        <UserAvatar name={currentUser.name} avatar={currentUser.avatar} size="md" className="rounded-2xl" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <Textarea
                          className="bg-white/5 border-white/10 rounded-[1.5rem] focus-visible:ring-primary/20 text-base p-6 min-h-[120px] transition-all"
                          placeholder="Compartilhe uma atualização ou feedback..."
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                        />
                        <div className="flex justify-end">
                          <Button size="lg" className="rounded-2xl gradient-blue h-12 px-8 gap-3 font-bold shadow-2xl shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                            Enviar Comentário <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Fake Activity List */}
                    <div className="mt-10 space-y-8 border-t border-white/5 pt-10">
                      <div className="flex gap-4">
                        <UserAvatar name="João Oliveira" avatar="" size="sm" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">João Oliveira</span>
                            <span className="text-[10px] text-muted-foreground font-bold opacity-40">HÁ 2 HORAS</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">Iniciei a revisão técnica deste item. Os requisitos parecem sólidos.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Sidebar - Right Side */}
          <div className="w-[380px] bg-white/[0.01] overflow-y-auto border-l border-white/5 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-8 space-y-10">
                {/* Status Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status do Fluxo</h4>
                    <Badge className={`uppercase text-[10px] font-black px-3 py-1 rounded-full ${status === 'done' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                      status === 'in-progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' :
                        status === 'review' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' :
                          'bg-white/10 text-muted-foreground border border-white/10'
                      }`}>
                      {status === 'done' ? '• Terminado' : `• ${status.replace('-', ' ')}`}
                    </Badge>
                  </div>
                  <Select value={status} onValueChange={v => setStatus(v as TaskStatus)}>
                    <SelectTrigger className="w-full bg-white/[0.03] border-white/10 rounded-2xl h-14 font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all active:scale-95 shadow-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900/95 backdrop-blur-3xl border-white/10 rounded-2xl shadow-3xl">
                      <SelectItem value="todo" className="py-3 font-bold uppercase text-[10px] focus:bg-white/5">A Fazer</SelectItem>
                      <SelectItem value="in-progress" className="py-3 font-bold uppercase text-[10px] focus:bg-white/5">Em Andamento</SelectItem>
                      <SelectItem value="review" className="py-3 font-bold uppercase text-[10px] focus:bg-white/5">Revisão</SelectItem>
                      <SelectItem value="done" className="py-3 font-bold uppercase text-[10px] focus:bg-white/5">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Points/Metadata Section */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Sizing & Prioridade</h4>
                  <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 space-y-2">
                    {[
                      { label: 'Esforço (Story Points)', value: points, setter: setPoints, type: 'number' },
                      { label: 'Prioridade', value: priority, setter: setPriority, type: 'select' },
                      { label: 'Projeto', value: projectId || 'Nenhum', type: 'project-select' },
                      { label: 'Setor Responsável', value: sectorId, type: 'text' },
                      { label: 'Vencimento', value: dueDate || 'Definir', type: 'date' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-3 group">
                        <span className="text-xs font-bold text-muted-foreground/60 transition-colors group-hover:text-muted-foreground">{item.label}</span>
                        {item.type === 'number' ? (
                          <input
                            type="number"
                            className="bg-transparent text-right text-sm font-black w-16 border-none outline-none focus:ring-0 text-primary"
                            value={item.value as number}
                            onChange={e => setPoints(parseInt(e.target.value) || 0)}
                          />
                        ) : item.type === 'select' ? (
                          <select
                            className="bg-transparent text-right text-xs font-black border-none outline-none focus:ring-0 uppercase tracking-tighter cursor-pointer text-primary"
                            value={priority}
                            onChange={e => setPriority(e.target.value as any)}
                          >
                            <option value="low">Baixa</option>
                            <option value="medium">Média</option>
                            <option value="high">Alta</option>
                            <option value="critical">Crítica</option>
                          </select>
                        ) : item.type === 'date' ? (
                          <input
                            type="date"
                            className="bg-transparent text-right text-[10px] font-black border-none outline-none focus:ring-0 uppercase text-primary dark:[color-scheme:dark]"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                          />
                        ) : item.type === 'project-select' ? (
                          <select
                            className="bg-transparent text-right text-xs font-black border-none outline-none focus:ring-0 uppercase tracking-tighter cursor-pointer text-primary"
                            value={projectId || ''}
                            onChange={e => setProjectId(e.target.value || undefined)}
                          >
                            <option value="">Nenhum</option>
                            {projects.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">{item.value as string}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assigned Section */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Responsáveis</h4>
                  <div className="space-y-4">
                    {/* Search to add assignees */}
                    <div className="relative">
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-primary/40 transition-all placeholder:text-muted-foreground/30"
                        placeholder="Buscar pessoa para atribuir..."
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        onFocus={() => setUserSearchOpen(true)}
                        onBlur={() => setTimeout(() => setUserSearchOpen(false), 150)}
                      />
                      {userSearchOpen && filteredUsers.length > 0 && (
                        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-zinc-900/95 backdrop-blur border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                          {filteredUsers.map(u => (
                            <button
                              key={u.id}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/10 transition-all text-xs group"
                              onMouseDown={() => { toggleAssignee(u.id); setUserSearch(''); }}
                            >
                              <UserAvatar name={u.name} avatar={u.avatar} size="sm" className="rounded-lg" />
                              <span className="font-bold flex-1 truncate">{u.name}</span>
                              <span className="text-muted-foreground/40 uppercase text-[9px] tracking-widest flex-shrink-0">{u.cargo || 'Membro'}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Assigned users list */}
                    <div className="flex flex-col gap-2">
                      {assignedTo.map(uid => {
                        const user = users.find(u => u.id === uid);
                        return user ? (
                          <div key={uid} className="flex items-center gap-4 group p-1 transition-all">
                            <div className="relative">
                              <UserAvatar name={user.name} avatar={user.avatar} size="md" className="rounded-xl ring-2 ring-white/5 transition-all group-hover:ring-primary/40" />
                              <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-background" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-black text-foreground/90 leading-none mb-1">{user.name}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">{user.cargo || 'Membro'}</p>
                            </div>
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-60 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                              onClick={() => toggleAssignee(uid)}
                              title="Remover atribuição"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : null;
                      })}
                      {assignedTo.length === 0 && (
                        <div className="flex-1 flex items-center justify-center py-6">
                          <p className="text-center text-xs text-muted-foreground/30 font-bold italic">Nenhum responsável atribuído</p>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" className="w-full justify-center h-14 rounded-2xl hover:bg-white/10 border-2 border-dashed border-white/5 gap-3 text-xs font-black uppercase tracking-widest text-muted-foreground/60 hover:text-primary hover:border-primary/20 transition-all active:scale-95 shadow-lg shadow-black/20" onClick={() => toggleAssignee(currentUser.id)}>
                      <UserPlus className="h-5 w-5" /> Atribuir a mim
                    </Button>
                  </div>
                </div>

                {/* Observers Section */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Time de Observação</h4>
                  <div className="flex -space-x-3 items-center">
                    {users.slice(0, 4).map((u, i) => (
                      <div key={i} className="ring-4 ring-zinc-950 rounded-2xl overflow-hidden transition-transform hover:-translate-y-1 cursor-help" title={u.name}>
                        <UserAvatar name={u.name} avatar={u.avatar} size="md" className="rounded-2xl" />
                      </div>
                    ))}
                    <div className="h-10 w-10 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-[10px] font-black text-primary shadow-xl z-10 translate-x-2">
                      +12
                    </div>
                  </div>
                  <Button variant="ghost" className="w-full justify-start h-12 rounded-2xl hover:bg-white/5 gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 transition-all">
                    <Eye className="h-5 w-5 opacity-40" /> Gerenciar observadores
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
