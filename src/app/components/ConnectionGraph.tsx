import { Task } from '../types';
import { tasks } from '../data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowRight, Link2 } from 'lucide-react';
import { SectorBadge } from './SectorBadge';

interface ConnectionGraphProps {
  task: Task;
}

export function ConnectionGraph({ task }: ConnectionGraphProps) {
  const connectedTasks = task.connections
    .map(id => tasks.find(t => t.id === id))
    .filter(Boolean) as Task[];

  const incomingConnections = tasks.filter(t => t.connections.includes(task.id));

  return (
    <div className="space-y-4">
      <Card className="bg-accent/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Tarefa Atual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-medium">{task.title}</p>
            <SectorBadge sectorId={task.sectorId} />
            <Badge variant="outline">{getStatusLabel(task.status)}</Badge>
          </div>
        </CardContent>
      </Card>

      {incomingConnections.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
            Tarefas que conectam para esta ({incomingConnections.length})
          </h4>
          <div className="space-y-2">
            {incomingConnections.map(t => (
              <Card key={t.id} className="bg-card">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{t.title}</p>
                      <div className="flex items-center gap-2">
                        <SectorBadge sectorId={t.sectorId} size="sm" />
                        <Badge variant="outline" className="text-xs">
                          {getStatusLabel(t.status)}
                        </Badge>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {connectedTasks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">
            Conexões desta tarefa ({connectedTasks.length})
          </h4>
          <div className="space-y-2">
            {connectedTasks.map(t => (
              <Card key={t.id} className="bg-card">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{t.title}</p>
                      <div className="flex items-center gap-2">
                        <SectorBadge sectorId={t.sectorId} size="sm" />
                        <Badge variant="outline" className="text-xs">
                          {getStatusLabel(t.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {connectedTasks.length === 0 && incomingConnections.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Esta tarefa não possui conexões
        </div>
      )}
    </div>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'todo': 'A Fazer',
    'in-progress': 'Em Andamento',
    'review': 'Em Revisão',
    'done': 'Concluído',
  };
  return labels[status] || status;
}
