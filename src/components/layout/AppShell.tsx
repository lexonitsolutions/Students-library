import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  const location = useLocation();
  const isFullBleedPage = location.pathname.startsWith('/messages');

  return (
    <div className="flex min-h-screen flex-col bg-surface lg:h-screen lg:overflow-hidden">
      {/* 1. Full-width continuous top header */}
      <TopBar />

      {/* 2. Body below the dividing line */}
      <div className="relative flex flex-1 min-h-0 w-full overflow-hidden">
        <Sidebar />
        {isFullBleedPage ? (
          <main className="flex-1 min-h-0 h-full overflow-hidden">
            <Outlet />
          </main>
        ) : (
          <main className="flex-1 px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:overflow-y-auto">
            <div className="mx-auto w-full max-w-(--spacing-container-max)">
              <Outlet />
            </div>
          </main>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

export default AppShell;
