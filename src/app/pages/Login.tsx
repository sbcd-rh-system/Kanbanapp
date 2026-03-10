import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { loginUser } from '../data/mockData';
import { toast } from 'sonner';
import { Briefcase } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = loginUser(email, password);
    
    if (user) {
      toast.success(`Bem-vindo(a), ${user.name}!`);
      navigate(user.role === 'admin' ? '/dashboard' : '/kanban/recruitment');
    } else {
      toast.error('Email ou senha inválidos');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center">
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
                <Label htmlFor="email">Email</Label>
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
                <Label htmlFor="password">Senha</Label>
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
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted rounded-md space-y-2 text-sm">
              <p className="font-medium">Credenciais de teste:</p>
              <div className="space-y-1 text-muted-foreground">
                <p>Admin: admin@empresa.com</p>
                <p>Usuário: maria@empresa.com</p>
                <p className="mt-2">Senha para todos: <span className="font-mono">demo123</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}