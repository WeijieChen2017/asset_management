import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div
            className="app-shell-container"
            style={{
              paddingTop: 'var(--space-6)',
              paddingBottom: 'var(--space-6)',
            }}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
