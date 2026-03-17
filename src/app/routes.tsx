import { createBrowserRouter } from 'react-router';
import Login from './pages/Login';
import AppLayout from './pages/AppLayout';
import Dashboard from './pages/Dashboard';
import KanbanView from './pages/KanbanView';
import UserManagement from './pages/UserManagement';
import ChefeDashboard from './pages/ChefeDashboard';
import GerenteDashboard from './pages/GerenteDashboard';
import GerenteView from './pages/GerenteView';
import Profile from './pages/Profile';
import OrgChart from './pages/OrgChart';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Login,
  },
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard', Component: Dashboard },
      { path: '/superintendente', Component: ChefeDashboard },
      { path: '/superintendente/usuarios/:gerenteId', Component: GerenteView },
      { path: '/admintasks', Component: GerenteDashboard },
      { path: '/kanban/:sectorId', Component: KanbanView },
      { path: '/admin/users', Component: UserManagement },
      { path: '/profile', Component: Profile },
      { path: '/orgchart', Component: OrgChart },
    ],
  },
]);
