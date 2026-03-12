import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { UserAvatar } from '../components/UserAvatar';
import { SectorBadge } from '../components/SectorBadge';
import { ArrowLeft, Plus, Search, Shield, User, Users, Edit, Trash2, Loader2, RefreshCw, Linkedin, GitBranch, LogOut, UserPlus, Clock, Copy } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { UserRegistrationModal } from '../components/UserRegistrationModal';
import { userService } from '../services/userService';
import { cleanOrisId } from '../services/orisService';
import { toast } from 'sonner';
import { getCurrentUser, sectors } from '../data/mockData';

// Helper: extrai o sectorId de um role do tipo 'admin-xxx' ou 'user-xxx'
function getSectorFromRole(role: string): string | null {
  if (role.startsWith('admin-') && role !== 'admin') return role.replace('admin-', '');
  if (role.startsWith('user-') && role !== 'user') return role.replace('user-', '');
  return null;
}

// Helper: resolve o label legível do role
function getRoleLabel(role: string): string {
  if (role === 'admin') return 'Administrador';
  if (role === 'user') return 'Gestor de Setor';
  if (role.startsWith('admin-')) {
    const sectorId = role.replace('admin-', '');
    const sector = sectors.find(s => s.id === sectorId);
    return sector ? `Admin. ${sector.name}` : role;
  }
  if (role.startsWith('user-')) {
    const sectorId = role.replace('user-', '');
    const sector = sectors.find(s => s.id === sectorId);
    return sector ? sector.name : role;
  }
  return role;
}

// Helper: retorna a cor do badge pelo role
function getRoleBadgeClass(role: string): string {
  if (role === 'admin') return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
  if (role.startsWith('admin-')) return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
  if (role === 'user') return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
}

// Helper: ícone do role
function RoleIcon({ role }: { role: string }) {
  if (role === 'admin') return <Shield className="w-3 h-3 text-purple-400" />;
  if (role.startsWith('admin-')) return <Shield className="w-3 h-3 text-orange-400" />;
  if (role === 'user') return <GitBranch className="w-3 h-3 text-amber-400" />;
  return <User className="w-3 h-3 text-blue-400" />;
}

// Helper: calcula tempo de empresa
function calculateTenure(admissionDate: string): string {
  if (!admissionDate) return 'Não informada';

  // Trata formatos DD/MM/YYYY ou YYYY-MM-DD
  let [year, month, day] = [0, 0, 0];
  if (admissionDate.includes('/')) {
    const parts = admissionDate.split('/');
    day = parseInt(parts[0]);
    month = parseInt(parts[1]) - 1;
    year = parseInt(parts[2]);
  } else {
    const parts = admissionDate.split('-');
    year = parseInt(parts[0]);
    month = parseInt(parts[1]) - 1;
    day = parseInt(parts[2]);
  }

  const start = new Date(year, month, day);
  const now = new Date();

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();

  if (months < 0 || (months === 0 && now.getDate() < start.getDate())) {
    years--;
    months += 12;
  }

  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'mês' : 'meses'}`);

  if (parts.length === 0) return 'Recém chegado';
  return parts.join(' e ');
}

// Helper: Copia texto para o clipboard
const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copiado!`);
};

// ── User Card Component ────────────────────────────────────────────────────────
function UserCard({ user, onEdit, onDelete, currentUserId, isAdmin }: {
  user: any;
  onEdit: (u: any) => void;
  onDelete: (id: string) => void;
  currentUserId: string;
  isAdmin: boolean;
}) {
  return (
    <div
      onClick={() => isAdmin && onEdit(user)}
      className={`group relative glass-card p-6 rounded-2xl border-none transition-all duration-300 overflow-hidden ${isAdmin ? 'hover:translate-y-[-4px] cursor-pointer' : 'cursor-default'}`}
    >
      {/* Decoration */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${user.role === 'admin' ? 'from-purple-500/10 to-transparent' : 'from-blue-500/10 to-transparent'} rounded-bl-full pointer-events-none`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative group-hover:scale-105 transition-transform">
            <UserAvatar name={user.name} avatar={user.avatar} size="lg" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border border-white/10 flex items-center justify-center shadow-lg">
              <RoleIcon role={user.role} />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight truncate max-w-[160px]">{user.name}</h3>
            <div className="flex items-center gap-1 group/email">
              <p className="text-sm text-muted-foreground truncate max-w-[140px] font-medium">{user.email}</p>
              <button
                onClick={(e) => { e.stopPropagation(); copyToClipboard(user.email, 'E-mail'); }}
                className="opacity-0 group-hover/email:opacity-100 p-1 hover:bg-white/10 rounded transition-all text-muted-foreground hover:text-primary"
                title="Copiar e-mail"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons — only for admins */}
        {isAdmin && (
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
            <Button
              variant="ghost" size="icon"
              onClick={() => onEdit(user)}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-primary/20 hover:text-primary transition-colors"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" size="icon"
              onClick={() => onDelete(user.id)}
              disabled={user.id === currentUserId}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-destructive/20 hover:text-destructive transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest opacity-60">Cargo</p>
          <p className="text-sm font-bold line-clamp-1 text-foreground/90">{user.cargo || 'Não definido'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest opacity-60">Status</p>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${user.situacao?.includes('ATIVO') ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'}`} />
            <span className={`text-xs font-bold ${user.situacao?.includes('ATIVO') ? 'text-emerald-400' : 'text-orange-400'}`}>
              {user.situacao || 'OFFLINE'}
            </span>
          </div>
        </div>
        <div className="space-y-1 col-span-2 mt-2 pt-3 border-t border-white/5">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60 flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Tempo de Empresa
          </p>
          <p className="text-sm font-bold text-amber-400/90">{calculateTenure(user.dt_admissao)}</p>
        </div>
      </div>

      {/* Sectors + Footer */}
      <div className="space-y-4 relative z-10">
        <div className="flex flex-wrap gap-1.5">
          {user.sectors.map((sectorId: string) => (
            <SectorBadge key={sectorId} sectorId={sectorId as any} size="sm" />
          ))}
          {user.sectors.length === 0 && <span className="text-xs italic text-muted-foreground">Sem setores</span>}
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <Badge variant="outline" className={`text-xs h-5 uppercase tracking-tighter font-bold ${getRoleBadgeClass(user.role)}`}>
            {getRoleLabel(user.role)}
          </Badge>
          <div className="flex items-center gap-2">
            {user.id_oris && (
              <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-blue-500/5 border border-blue-500/10">
                <RefreshCw className="w-2.5 h-2.5 text-blue-400/70" />
                <span className="text-xs font-bold text-blue-400/70">Oris: {cleanOrisId(user.id_oris)}</span>
              </div>
            )}
            {user.linkedin_url && (
              <a
                href={user.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-[#0A66C2]/10 border border-[#0A66C2]/20 hover:bg-[#0A66C2]/20 transition-colors"
              >
                <Linkedin className="w-2.5 h-2.5 text-[#0A66C2]" />
                <span className="text-xs font-bold text-[#0A66C2]">LinkedIn</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub User Row (compact, para org-chart) ────────────────────────────────────
function SubUserRow({ user, onEdit, onDelete, currentUserId, canEdit }: {
  user: any;
  onEdit: (u: any) => void;
  onDelete: (id: string) => void;
  currentUserId: string;
  canEdit: boolean;
}) {
  return (
    <div
      onClick={() => canEdit && onEdit(user)}
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-all ${canEdit ? 'cursor-pointer' : 'cursor-default'
        }`}
    >
      <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{user.name}</p>
        <div className="flex items-center gap-2 group/subemail">
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          <button
            onClick={(e) => { e.stopPropagation(); copyToClipboard(user.email, 'E-mail'); }}
            className="opacity-0 group-hover/subemail:opacity-100 p-0.5 hover:bg-white/10 rounded transition-all text-muted-foreground hover:text-amber-400"
          >
            <Copy className="w-2.5 h-2.5" />
          </button>
          <span className="text-[10px] text-amber-500/60 font-medium whitespace-nowrap flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> {calculateTenure(user.dt_admissao)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {user.cargo && (
          <span className="text-xs text-muted-foreground hidden md:block truncate max-w-[120px]">{user.cargo}</span>
        )}
        <Badge variant="outline" className={`text-xs h-5 uppercase tracking-tighter font-bold shrink-0 ${getRoleBadgeClass(user.role)}`}>
          {getRoleLabel(user.role)}
        </Badge>
        {canEdit && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="icon" onClick={() => onEdit(user)}
              className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 hover:bg-primary/20 hover:text-primary transition-colors">
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(user.id)}
              disabled={user.id === currentUserId}
              className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 hover:bg-destructive/20 hover:text-destructive transition-colors">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Manager Group (org-chart) ──────────────────────────────────────────────────
function ManagerGroup({ manager, subUsers, onEdit, onDelete, onAddSubUser, currentUserId }: {
  manager: any;
  subUsers: any[];
  onEdit: (u: any) => void;
  onDelete: (id: string) => void;
  onAddSubUser: (sectors: string[]) => void;
  currentUserId: string;
}) {
  const managerSectors: string[] = Array.isArray(manager.sectors) ? manager.sectors : [];
  return (
    <div className="flex flex-col">
      {/* Manager card */}
      <UserCard
        user={manager}
        onEdit={onEdit}
        onDelete={onDelete}
        currentUserId={currentUserId}
        isAdmin={true}
      />
      {/* Sub-users tree */}
      {subUsers.length > 0 && (
        <div className="ml-6 mt-2 flex flex-col gap-1.5 relative">
          {/* Vertical connector line */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/40 via-amber-500/20 to-transparent" />
          {subUsers.map(su => (
            <div key={su.id} className="flex items-stretch pl-4 relative">
              {/* Horizontal connector */}
              <div className="absolute left-0 top-1/2 w-4 h-px bg-amber-500/30" />
              <div className="flex-1">
                <SubUserRow
                  user={su}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  currentUserId={currentUserId}
                  canEdit={true}
                />
              </div>
            </div>
          ))}
          {/* Add Sub-user Button row */}
          <div className="flex items-stretch pl-4 relative">
            <div className="absolute left-0 top-1/2 w-4 h-px bg-amber-500/30" />
            <button
              onClick={() => onAddSubUser(managerSectors)}
              className="group/add flex items-center gap-2 px-3 py-2 rounded-xl bg-white/2 border border-dashed border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all w-full text-left"
            >
              <div className="p-1 rounded-lg bg-white/5 group-hover/add:bg-amber-500/20 transition-colors">
                <UserPlus className="w-3 h-3 text-muted-foreground group-hover/add:text-amber-400" />
              </div>
              <span className="text-xs font-bold text-muted-foreground group-hover/add:text-amber-400">Adicionar Colaborador para {manager.name.split(' ')[0]}</span>
            </button>
          </div>
        </div>
      )}
      {subUsers.length === 0 && (
        <div className="ml-10 mt-2">
          <button
            onClick={() => onAddSubUser(managerSectors)}
            className="group/add flex items-center gap-2 px-3 py-2 rounded-xl bg-white/2 border border-dashed border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left"
          >
            <UserPlus className="w-3 h-3 text-muted-foreground group-hover/add:text-amber-400" />
            <span className="text-xs font-bold text-muted-foreground group-hover/add:text-amber-400">Adicionar Primeiro Colaborador</span>
          </button>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon, label, count, color }: {
  icon: ReactNode;
  label: string;
  count: number;
  color: 'purple' | 'blue';
}) {
  const styles = {
    purple: {
      wrap: 'bg-purple-500/10 border-purple-500/20',
      text: 'text-purple-400',
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      line: 'bg-purple-500/10',
    },
    blue: {
      wrap: 'bg-blue-500/10 border-blue-500/20',
      text: 'text-blue-400',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      line: 'bg-blue-500/10',
    },
  }[color];

  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`p-1.5 rounded-lg border ${styles.wrap}`}>{icon}</div>
      <h2 className={`text-sm font-bold uppercase tracking-widest ${styles.text}`}>{label}</h2>
      <span className={`text-xs border rounded-full px-2 py-0.5 font-bold ${styles.badge}`}>{count}</span>
      <div className={`flex-1 h-px ${styles.line}`} />
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function UserManagement() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [activeRestriction, setActiveRestriction] = useState<string[] | undefined>(undefined);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const data = await userService.listUsers();
      setUsers(data);
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (userData: any) => {
    try {
      await userService.saveUser(userData);
      await loadUsers();
      toast.success(editingUser ? 'Usuário atualizado!' : 'Usuário cadastrado!');
      setEditingUser(null);
    } catch {
      toast.error(editingUser ? 'Erro ao atualizar usuário' : 'Erro ao cadastrar usuário');
    }
  };

  const handleSyncOris = async () => {
    setIsSyncing(true);
    try {
      await userService.syncOris();
      await loadUsers();
      toast.success('Sincronização com Oris concluída!');
    } catch {
      toast.error('Erro ao sincronizar com Oris');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await userService.deleteUser(userId);
      await loadUsers();
      toast.success('Usuário removido!');
    } catch {
      toast.error('Erro ao remover usuário');
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setActiveRestriction(undefined);
    setIsModalOpen(true);
  };

  const handleAddSubUser = (targetSectors: string[]) => {
    setEditingUser(null);
    setActiveRestriction(targetSectors);
    setIsModalOpen(true);
  };

  const isGlobalAdmin = currentUser.role === 'admin';
  const isSectorAdmin = currentUser.role.startsWith('admin-') && currentUser.role !== 'admin';
  // Para retrocompatibilidade, 'isAdmin' significa poder gerenciar usuários globalmente
  const isAdmin = isGlobalAdmin;
  const canManageUsers = isGlobalAdmin || isSectorAdmin;

  // Setores do usuário logado
  const userSectorIds: string[] = isSectorAdmin
    ? [currentUser.role.replace('admin-', '')] // extrai do role: 'admin-recruitment' -> ['recruitment']
    : Array.isArray(currentUser.sectors)
      ? currentUser.sectors
      : [];

  const filteredUsers = users
    .filter(u => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      // Não-global-admin: mostrar admins globais (referência) + usuários do seu setor
      if (!isGlobalAdmin) {
        if (u.role === 'admin') return true; // sempre mostra admins globais
        const uSectors: string[] = Array.isArray(u.sectors)
          ? u.sectors
          : (typeof u.sectors === 'string' ? JSON.parse(u.sectors || '[]') : []);
        return uSectors.some(s => userSectorIds.includes(s));
      }
      return true;
    })
    .sort((a, b) => {
      const roleOrder = (r: string) =>
        r === 'admin' ? 0 : r.startsWith('admin-') ? 1 : r === 'user' ? 2 : 3;
      const diff = roleOrder(a.role) - roleOrder(b.role);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name, 'pt-BR');
    });

  const admins = filteredUsers.filter(u => u.role === 'admin');
  const collaborators = filteredUsers.filter(u => u.role !== 'admin');

  // Org-chart: admin-{sectorId} são os "managers" do organograma
  const managers = filteredUsers.filter(u => u.role.startsWith('admin-') && u.role !== 'admin');
  const subUsers = filteredUsers.filter(u => u.role.startsWith('user-') && u.role !== 'user');

  // Agrupar sub-usuários por admin setorial (manager gerencia o setor do sub)
  const orgGroups = managers.map(manager => {
    const managerSectorId = manager.role.replace('admin-', '');
    const managed = subUsers.filter(su => su.role === `user-${managerSectorId}`);
    return { manager, subUsers: managed };
  });

  // Usuários com role 'user' (gestores antigos ou usuários sem vínculo hierárquico explícito)
  const otherUsers = filteredUsers.filter(u => u.role === 'user');

  // Sub-usuários sem admin setorial correspondente na lista filtrada
  const attachedIds = new Set(orgGroups.flatMap(g => g.subUsers.map((su: any) => su.id)));
  const orphanSubUsers = subUsers.filter(su => !attachedIds.has(su.id));

  // Determina se o usuário logado pode editar um card
  const canEditUser = (u: any) => {
    if (isGlobalAdmin) return true;
    // Admin setorial pode editar sub-usuários do seu setor (mas não admins globais)
    if (u.role === 'admin') return false;
    const uSectors: string[] = Array.isArray(u.sectors)
      ? u.sectors
      : (typeof u.sectors === 'string' ? JSON.parse(u.sectors || '[]') : []);
    return uSectors.some(s => userSectorIds.includes(s));
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
            >
              <ArrowLeft className="h-5 w-5 group-hover:translate-x-[-2px] transition-transform" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {isGlobalAdmin ? 'Gestão de Equipe' : isSectorAdmin ? `Minha Área` : 'Diretório'}
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1">
                {isGlobalAdmin
                  ? <><Shield className="w-3 h-3 text-purple-400" /> Painel de Administração</>
                  : isSectorAdmin
                    ? <><Shield className="w-3 h-3 text-orange-400" /> {getRoleLabel(currentUser.role)}</>
                    : <><Users className="w-3 h-3 text-muted-foreground" /> Colaborador</>
                }
              </p>
            </div>
          </div>

          {/* Admin global: sync + novo usuário completo */}
          {isGlobalAdmin && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleSyncOris}
                disabled={isSyncing}
                className="border-white/10 bg-white/5 hover:bg-white/10 text-sm font-bold gap-2 h-10 px-4 rounded-xl shadow-lg transition-all active:scale-95"
              >
                {isSyncing
                  ? <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                  : <RefreshCw className="h-4 w-4 text-blue-400" />}
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Oris'}
              </Button>
              <Button
                onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                className="gradient-blue shadow-lg shadow-blue-500/20 border-none h-10 px-4 rounded-xl gap-2 font-bold transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Novo Usuário
              </Button>
            </div>
          )}

          {/* Admin setorial (admin-recruitment etc): adiciona colaborador ao seu setor */}
          {isSectorAdmin && (
            <Button
              onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
              className="bg-orange-500/90 hover:bg-orange-500 shadow-lg shadow-orange-500/20 border-none h-10 px-4 rounded-xl gap-2 font-bold transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Adicionar Colaborador
            </Button>
          )}

          {/* Usuário logado + botão sair */}
          <div className="flex items-center gap-3 pl-3 border-l border-white/10">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <UserAvatar name={currentUser.name} avatar={currentUser.avatar} size="sm" />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold leading-none truncate max-w-[120px]">{currentUser.name.split(' ')[0]}</p>
                <p className="text-xs mt-0.5 font-semibold" style={{
                  color: isGlobalAdmin ? '#a78bfa' : isSectorAdmin ? '#fb923c' : '#60a5fa'
                }}>
                  {getRoleLabel(currentUser.role)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              title="Sair"
              className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Total de Usuários', value: users.length, icon: User, color: 'from-blue-500 to-indigo-600' },
            { label: 'Administradores', value: users.filter(u => u.role === 'admin').length, icon: Shield, color: 'from-purple-500 to-pink-600' },
            { label: 'Operacionais', value: users.filter(u => u.role.startsWith('admin-')).length, icon: Users, color: 'from-emerald-400 to-teal-600' },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-5 rounded-2xl border-none relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.color}`} />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-bold tracking-tighter">{stat.value}</h3>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                  <stat.icon className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-6">
          {/* Search */}
          <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center border-none shadow-2xl">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Pesquisar por nome ou email..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none rounded-xl text-sm transition-all text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto px-2">
              <span className="text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">Resultados</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">
                {filteredUsers.length}
              </Badge>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-muted-foreground">Carregando diretório...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 glass-card rounded-3xl border-dashed border-2 border-white/5">
              <Search className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
              <h4 className="text-lg font-bold text-muted-foreground">Nenhum resultado encontrado</h4>
              <p className="text-sm text-muted-foreground opacity-60">Tente ajustar seus termos de pesquisa.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-10">

              {/* Admins */}
              {admins.length > 0 && (
                <div>
                  <SectionHeader
                    icon={<Shield className="w-4 h-4 text-purple-400" />}
                    label="Administradores"
                    count={admins.length}
                    color="purple"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {admins.map(user => (
                      <UserCard
                        key={user.id}
                        user={user}
                        onEdit={handleEditUser}
                        onDelete={handleDeleteUser}
                        currentUserId={currentUser.id}
                        isAdmin={isAdmin}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Collaborators — Org Chart (admin) or flat list (user) */}
              {isAdmin ? (
                <>
                  {/* Gestores de Setor com seus sub-usuários */}
                  {(orgGroups.length > 0 || orphanSubUsers.length > 0) && (
                    <div className="space-y-6">
                      <SectionHeader
                        icon={<GitBranch className="w-4 h-4 text-amber-400" />}
                        label="Estrutura Hierárquica"
                        count={managers.length + subUsers.length}
                        color="blue"
                      />

                      {orgGroups.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {orgGroups.map(({ manager, subUsers: subs }) => (
                            <ManagerGroup
                              key={manager.id}
                              manager={manager}
                              subUsers={subs}
                              onEdit={handleEditUser}
                              onDelete={handleDeleteUser}
                              onAddSubUser={handleAddSubUser}
                              currentUserId={currentUser.id}
                            />
                          ))}
                        </div>
                      )}

                      {/* Sub-usuários sem gestor */}
                      {orphanSubUsers.length > 0 && (
                        <div className="mt-6">
                          <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-widest">Sem gestor vinculado</p>
                          <div className="flex flex-col gap-2">
                            {orphanSubUsers.map(su => (
                              <SubUserRow
                                key={su.id}
                                user={su}
                                onEdit={handleEditUser}
                                onDelete={handleDeleteUser}
                                currentUserId={currentUser.id}
                                canEdit={true}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Outros Colaboradores (Operacional) */}
                  {otherUsers.length > 0 && (
                    <div className="mt-10">
                      <SectionHeader
                        icon={<Users className="w-4 h-4 text-blue-400" />}
                        label="Colaboradores (Operacional)"
                        count={otherUsers.length}
                        color="blue"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {otherUsers.map(user => (
                          <UserCard
                            key={user.id}
                            user={user}
                            onEdit={handleEditUser}
                            onDelete={handleDeleteUser}
                            currentUserId={currentUser.id}
                            isAdmin={isAdmin}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Vista do gestor de setor: lista flat dos seus colaboradores
                collaborators.length > 0 && (
                  <div>
                    <SectionHeader
                      icon={<Users className="w-4 h-4 text-blue-400" />}
                      label="Minha Equipe"
                      count={collaborators.length}
                      color="blue"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {collaborators.map(user => (
                        <UserCard
                          key={user.id}
                          user={user}
                          onEdit={handleEditUser}
                          onDelete={handleDeleteUser}
                          currentUserId={currentUser.id}
                          isAdmin={canEditUser(user)}
                        />
                      ))}
                    </div>
                  </div>
                )
              )}

            </div>
          )}
        </div>
      </main >

      <UserRegistrationModal
        isOpen={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setEditingUser(null);
            setActiveRestriction(undefined);
          }
        }}
        onUserAdded={handleSaveUser}
        editingUser={editingUser}
        restrictedToSectors={activeRestriction || (isSectorAdmin ? userSectorIds : undefined)}
      />
    </div >
  );
}
