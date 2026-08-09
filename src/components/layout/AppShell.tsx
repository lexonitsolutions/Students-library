import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          <div className="mx-auto w-full max-w-(--spacing-container-max)">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

export default AppShell;
