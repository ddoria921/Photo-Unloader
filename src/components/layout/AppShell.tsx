import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  sidebarCollapsed: boolean;
  inspectorCollapsed: boolean;
  bottomCollapsed: boolean;
}

export function AppShell({ children, sidebarCollapsed, inspectorCollapsed, bottomCollapsed }: AppShellProps) {
  return (
    <div
      className="app-shell"
      data-sidebar-collapsed={sidebarCollapsed || undefined}
      data-inspector-collapsed={inspectorCollapsed || undefined}
      data-bottom-collapsed={bottomCollapsed || undefined}
    >
      {children}
    </div>
  );
}
