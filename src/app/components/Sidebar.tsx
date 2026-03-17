import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { getCurrentUser, logoutUser, sectors } from '../data/mockData';
import { UserAvatar } from './UserAvatar';
import {
  LayoutDashboard,
  Users,
  ListTodo,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  ClipboardList,
  LayoutGrid,
  Network,
} from 'lucide-react';

const SIDEBAR_KEY = 'kanban_sidebar_collapsed';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  exact?: boolean;
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_KEY) === 'true'
  );
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getCurrentUser();

  if (!currentUser) return null;

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(SIDEBAR_KEY, String(next));
  };

  const role = currentUser.role;
  const navItems: NavItem[] = [];

  if (role === 'chefe') {
    navItems.push({ icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', exact: true });
    navItems.push({ icon: ClipboardList, label: 'Tarefas Delegadas', path: '/superintendente' });
    navItems.push({ icon: Users, label: 'Minha Equipe', path: '/admin/users' });
    navItems.push({ icon: Network, label: 'Árvore de Distribuição', path: '/orgchart' });
  } else if (role === 'gerente') {
    navItems.push({ icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', exact: true });
    navItems.push({ icon: ListTodo, label: 'Minhas Tarefas', path: '/admintasks' });
    navItems.push({ icon: Users, label: 'Minha Equipe', path: '/admin/users' });
  } else if (role === 'admin') {
    navItems.push({ icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', exact: true });
    navItems.push({ icon: Users, label: 'Minha Equipe', path: '/admin/users' });
  } else if (role.startsWith('admin-')) {
    navItems.push({ icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', exact: true });
    navItems.push({ icon: Users, label: 'Minha Equipe', path: '/admin/users' });
  } else if (role.startsWith('user-')) {
    const sectorId = role.replace('user-', '');
    const sector = sectors.find(s => s.id === sectorId);
    navItems.push({ icon: LayoutGrid, label: sector?.name || 'Kanban', path: `/kanban/${sectorId}` });
  }

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className={`relative flex flex-col h-screen sticky top-0 border-r border-white/5 bg-background/95 transition-all duration-300 shrink-0 z-40 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* User info */}
      <button
        onClick={() => navigate('/profile')}
        className={`flex items-center gap-3 px-3 py-5 border-b border-white/5 hover:bg-white/5 transition-colors w-full text-left ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <div className="shrink-0">
          <UserAvatar name={currentUser.name} avatar={currentUser.avatar} size="sm" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{currentUser.name.split(' ')[0]}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser.cargo || ''}</p>
          </div>
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active = isActive(item.path, item.exact);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-white/5 space-y-1">
        <button
          onClick={() => navigate('/profile')}
          title={collapsed ? 'Meu Perfil' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            isActive('/profile')
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
          } ${collapsed ? 'justify-center' : ''}`}
        >
          <UserCircle className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Meu Perfil</span>}
        </button>

        <button
          onClick={() => { logoutUser(); navigate('/'); }}
          title={collapsed ? 'Sair' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>

        {/* Toggle */}
        <button
          onClick={toggle}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground/40 hover:text-muted-foreground transition-all ${
            collapsed ? 'justify-center' : 'justify-end'
          }`}
        >
          {collapsed
            ? <ChevronRight className="h-3.5 w-3.5" />
            : <><span>Recolher</span><ChevronLeft className="h-3.5 w-3.5" /></>
          }
        </button>
      </div>
    </div>
  );
}
