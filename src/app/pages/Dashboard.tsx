import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { sectors, tasks, users, getCurrentUser } from '../data/mockData';
import { SectorBadge } from '../components/SectorBadge';
import { UserAvatar } from '../components/UserAvatar';
import {
  LayoutDashboard,
  Users,
  LogOut,
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';

export default function Dashboard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const totalTasks = tasks.length;
  const todoTasks = tasks.filter(t => t.status === 'todo').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const reviewTasks = tasks.filter(t => t.status === 'review').length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
          </div>
          <div className="flex items-center gap-3">
            <UserAvatar name={currentUser.name} avatar={currentUser.avatar} size="md" />
            <div className="hidden sm:block">
              <p className="text-sm font-medium">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">{currentUser.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="border-2" style={{ borderColor: '#06b6d4' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
              <ListTodo className="h-4 w-4" style={{ color: '#06b6d4' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#06b6d4' }}>{totalTasks}</div>
            </CardContent>
          </Card>

          <Card className="border-2" style={{ borderColor: '#06b6d4' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Fazer</CardTitle>
              <AlertCircle className="h-4 w-4" style={{ color: '#06b6d4' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#06b6d4' }}>{todoTasks}</div>
            </CardContent>
          </Card>

          <Card className="border-2" style={{ borderColor: '#eab308' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <Clock className="h-4 w-4" style={{ color: '#eab308' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#eab308' }}>{inProgressTasks}</div>
            </CardContent>
          </Card>

          <Card className="border-2" style={{ borderColor: '#a855f7' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Revisão</CardTitle>
              <AlertCircle className="h-4 w-4" style={{ color: '#a855f7' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#a855f7' }}>{reviewTasks}</div>
            </CardContent>
          </Card>

          <Card className="border-2" style={{ borderColor: '#22c55e' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle2 className="h-4 w-4" style={{ color: '#22c55e' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{doneTasks}</div>
            </CardContent>
          </Card>
        </div>

        {/* Setores */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Setores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sectors.map(sector => {
              const sectorTasks = tasks.filter(t => t.sectorId === sector.id);
              const sectorDone = sectorTasks.filter(t => t.status === 'done').length;
              const completion = sectorTasks.length > 0 
                ? Math.round((sectorDone / sectorTasks.length) * 100) 
                : 0;

              return (
                <Card 
                  key={sector.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 relative"
                  style={{ borderColor: sector.color }}
                  onClick={() => navigate(`/kanban/${sector.id}`)}
                >
                  {/* Borda superior colorida */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-md"
                    style={{ backgroundColor: sector.color }}
                  />
                  
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{sector.name}</CardTitle>
                      <div 
                        className="h-10 w-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${sector.color}20` }}
                      >
                        <div className="h-5 w-5" style={{ color: sector.color }}>
                          {/* Icon placeholder */}
                          <div 
                            className="h-full w-full rounded-full" 
                            style={{ backgroundColor: sector.color }}
                          />
                        </div>
                      </div>
                    </div>
                    <CardDescription>
                      {sectorTasks.length} {sectorTasks.length === 1 ? 'tarefa' : 'tarefas'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium" style={{ color: sector.color }}>{completion}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${completion}%`,
                            backgroundColor: sector.color,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Equipe
              </CardTitle>
              <CardDescription>Gerenciar usuários e permissões</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/admin/users')} className="w-full">
                Gerenciar Usuários
              </Button>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {users.length} {users.length === 1 ? 'usuário' : 'usuários'} no sistema
                </p>
                <div className="flex -space-x-2">
                  {users.slice(0, 5).map(user => (
                    <UserAvatar key={user.id} name={user.name} avatar={user.avatar} size="sm" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tarefas Recentes</CardTitle>
              <CardDescription>Últimas atualizações do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.slice(0, 4).map(task => (
                  <div key={task.id} className="flex items-start gap-2 text-sm">
                    <div className="flex-1 space-y-1">
                      <p className="font-medium line-clamp-1">{task.title}</p>
                      <div className="flex items-center gap-2">
                        <SectorBadge sectorId={task.sectorId} size="sm" />
                        <Badge variant="outline" className="text-xs">
                          {task.status === 'done' ? 'Concluído' : 
                           task.status === 'in-progress' ? 'Em Andamento' :
                           task.status === 'review' ? 'Revisão' : 'A Fazer'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}