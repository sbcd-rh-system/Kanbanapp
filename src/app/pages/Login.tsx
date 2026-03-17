import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { setCurrentUser } from '../data/mockData';
import { toast } from 'sonner';
import { Briefcase, Lock, Mail } from 'lucide-react';
import { getCurrentUser } from '../data/mockData';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Busca usuários do banco SQLite via API
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Falha ao conectar com o servidor');
      const users: any[] = await res.json();

      // Encontra o usuário pelo email (case-insensitive)
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (user && password === 'demo123') {
        // Reconstrói o objeto de usuário no formato esperado pelo app
        const userObj = {
          ...user,
          sectors: Array.isArray(user.sectors)
            ? user.sectors
            : JSON.parse(user.sectors || '[]'),
        };
        setCurrentUser(userObj);
        toast.success(`Bem-vindo(a), ${user.name}!`);
        const role = userObj.role as string;
        if (role.startsWith('user-')) {
          const sectorId = role.replace('user-', '');
          navigate(`/kanban/${sectorId}`);
        } else {
          navigate('/dashboard');
        }
      } else if (!user) {
        toast.error('Email não encontrado. Verifique se seu cadastro foi realizado.');
      } else {
        toast.error('Senha incorreta.');
      }
    } catch (err) {
      toast.error('Erro ao conectar com o servidor. Verifique se ele está rodando.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
              <Briefcase className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Kanban RH</h1>
          <p className="text-muted-foreground">
            Sistema de Gerenciamento de Tarefas
          </p>
        </div>

        <Card className="border-2 relative" style={{ borderColor: '#06b6d4' }}>
          {/* Borda superior colorida */}
          <div
            className="absolute top-0 left-0 right-0 h-1 rounded-t-md"
            style={{ backgroundColor: '#06b6d4' }}
          />

          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verificando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground text-center">
              Senha padrão: <span className="font-mono font-bold text-foreground">demo123</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}