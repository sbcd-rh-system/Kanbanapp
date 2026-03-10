import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { PermissionToggle } from './PermissionToggle';
import { Task, SectorId, TaskStatus } from '../types';
import { users, tasks as allTasks } from '../data/mockData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { X } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  task?: Task;
  sectorId: SectorId;
}

export function TaskModal({ open, onClose, onSave, task, sectorId }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [isPrivate, setIsPrivate] = useState(task?.isPrivate || false);
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [assignedTo, setAssignedTo] = useState<string[]>(task?.assignedTo || []);
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [selectedConnections, setSelectedConnections] = useState<string[]>(
    task?.connections || []
  );

  const availableTasks = allTasks.filter(
    t => t.id !== task?.id && t.sectorId === sectorId
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
          <DialogDescription>
            {task ? 'Atualize as informações da tarefa' : 'Crie uma nova tarefa no quadro Kanban'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Digite o título da tarefa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descreva os detalhes da tarefa"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={v => setStatus(v as TaskStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">A Fazer</SelectItem>
                    <SelectItem value="in-progress">Em Andamento</SelectItem>
                    <SelectItem value="review">Revisão</SelectItem>
                    <SelectItem value="done">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de vencimento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Privacidade</Label>
              <PermissionToggle isPrivate={isPrivate} onChange={setIsPrivate} />
            </div>

            <div className="space-y-2">
              <Label>Responsáveis</Label>
              <div className="border rounded-md p-3 space-y-2">
                {users.map(user => (
                  <div key={user.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={assignedTo.includes(user.id)}
                      onCheckedChange={() => toggleAssignee(user.id)}
                    />
                    <Label
                      htmlFor={`user-${user.id}`}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      {user.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Adicionar tag"
                />
                <Button type="button" onClick={handleAddTag} variant="secondary">
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Conexões com outras tarefas</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                {availableTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma tarefa disponível para conexão
                  </p>
                ) : (
                  availableTasks.map(t => (
                    <div key={t.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`task-${t.id}`}
                        checked={selectedConnections.includes(t.id)}
                        onCheckedChange={() => toggleConnection(t.id)}
                      />
                      <Label htmlFor={`task-${t.id}`} className="flex-1 cursor-pointer text-sm">
                        {t.title}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            {task ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
