import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  sidebarCollapsed: boolean;
  inspectorCollapsed: boolean;
  bottomCollapsed: boolean;
  onRevealSidebar: () => void;
  onRevealInspector: () => void;
}

export function AppShell({
  children,
  sidebarCollapsed,
  inspectorCollapsed,
  bottomCollapsed,
  onRevealSidebar,
  onRevealInspector,
}: AppShellProps) {
  return (
    <div
      className="app-shell"
      data-sidebar-collapsed={sidebarCollapsed || undefined}
      data-inspector-collapsed={inspectorCollapsed || undefined}
      data-bottom-collapsed={bottomCollapsed || undefined}
    >
      {children}
      {sidebarCollapsed && (
        <button
          className="reveal-handle reveal-handle-left"
          onClick={onRevealSidebar}
          title="Show sidebar"
          aria-label="Show sidebar"
        />
      )}
      {inspectorCollapsed && (
        <button
          className="reveal-handle reveal-handle-right"
          onClick={onRevealInspector}
          title="Show inspector"
          aria-label="Show inspector"
        />
      )}
    </div>
  );
}
