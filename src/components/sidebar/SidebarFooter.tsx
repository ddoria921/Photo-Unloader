import { isTauriRuntime } from '@/lib/commands';

export function SidebarFooter() {
  const connected = isTauriRuntime();
  return (
    <div className="sidebar-footer">
      <div className={`sidebar-footer-dot ${connected ? 'sidebar-footer-dot-connected' : 'sidebar-footer-dot-offline'}`} />
      v0.1.0 · {connected ? 'NATIVE' : 'BROWSER'}
    </div>
  );
}
