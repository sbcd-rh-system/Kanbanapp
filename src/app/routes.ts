import { createBrowserRouter } from 'react-router';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import KanbanView from './pages/KanbanView';
import UserManagement from './pages/UserManagement';
import ChefeDashboard from './pages/ChefeDashboard';
import GerenteDashboard from './pages/GerenteDashboard';
import GerenteView from './pages/GerenteView';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Login,
  },
  {
    path: '/chefe',
    Component: ChefeDashboard,
  },
  {
    path: '/chefe/gerente/:gerenteId',
    Component: GerenteView,
  },
  {
    path: '/gerente',
    Component: GerenteDashboard,
  },
  {
    path: '/dashboard',
    Component: Dashboard,
  },
  {
    path: '/kanban/:sectorId',
    Component: KanbanView,
  },
  {
    path: '/admin/users',
    Component: UserManagement,
  },
]);
