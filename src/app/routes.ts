import { createBrowserRouter } from 'react-router';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import KanbanView from './pages/KanbanView';
import UserManagement from './pages/UserManagement';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Login,
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
