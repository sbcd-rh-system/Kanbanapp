import { Outlet } from 'react-router';
import { Sidebar } from '../components/Sidebar';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
