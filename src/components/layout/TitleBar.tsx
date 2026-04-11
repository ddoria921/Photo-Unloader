import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauriRuntime } from '@/lib/commands';

interface TitleBarProps {
  isConnected: boolean;
  sidebarOpen: boolean;
  inspectorOpen: boolean;
  bottomOpen: boolean;
  sidebarToggleDisabled?: boolean;
  inspectorToggleDisabled?: boolean;
  onToggleSidebar: () => void;
  onToggleInspector: () => void;
  onToggleBottom: () => void;
}

function handleTrafficLight(action: 'close' | 'minimize' | 'maximize') {
  if (!isTauriRuntime()) return;
  const win = getCurrentWindow();
  if (action === 'close') void win.close();
  else if (action === 'minimize') void win.minimize();
  else if (action === 'maximize') void win.toggleMaximize();
}

export function TitleBar({
  isConnected,
  sidebarOpen,
  inspectorOpen,
  bottomOpen,
  sidebarToggleDisabled,
  inspectorToggleDisabled,
  onToggleSidebar,
  onToggleInspector,
  onToggleBottom,
}: TitleBarProps) {
  const isTauri = isTauriRuntime();
  return (
    <div className="titlebar" data-tauri-drag-region>
      {isTauri && (
        <div className="titlebar-traffic">
          <button
            className="titlebar-tl titlebar-tl-close"
            onClick={() => handleTrafficLight('close')}
            aria-label="Close"
          />
          <button
            className="titlebar-tl titlebar-tl-min"
            onClick={() => handleTrafficLight('minimize')}
            aria-label="Minimize"
          />
          <button
            className="titlebar-tl titlebar-tl-max"
            onClick={() => handleTrafficLight('maximize')}
            aria-label="Maximize"
          />
        </div>
      )}

      <span className="titlebar-name">Photo Unloader</span>

      <div className="titlebar-right">
        <div className="panel-toggle-group" role="group" aria-label="Toggle panels">
          <button
            className={`panel-toggle-btn${sidebarOpen ? ' panel-toggle-btn--active' : ''}`}
            onClick={onToggleSidebar}
            disabled={sidebarToggleDisabled}
            aria-pressed={sidebarOpen}
            title={sidebarToggleDisabled ? 'Window too narrow to show sidebar' : sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            {/* Left sidebar */}
            <svg width="16" height="14" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.6" y="0.6" width="14.8" height="12.8" rx="1.4" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="0.6" y="0.6" width="4.8" height="12.8" rx="1.4" fill="currentColor" fillOpacity="0.35"/>
              <line x1="5.4" y1="0.6" x2="5.4" y2="13.4" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </button>
          <button
            className={`panel-toggle-btn${bottomOpen ? ' panel-toggle-btn--active' : ''}`}
            onClick={onToggleBottom}
            aria-pressed={bottomOpen}
            title={bottomOpen ? 'Hide log panel' : 'Show log panel'}
          >
            {/* Bottom panel */}
            <svg width="16" height="14" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.6" y="0.6" width="14.8" height="12.8" rx="1.4" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="0.6" y="8.6" width="14.8" height="4.8" rx="1.4" fill="currentColor" fillOpacity="0.35"/>
              <line x1="0.6" y1="8.6" x2="15.4" y2="8.6" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </button>
          <button
            className={`panel-toggle-btn${inspectorOpen ? ' panel-toggle-btn--active' : ''}`}
            onClick={onToggleInspector}
            disabled={inspectorToggleDisabled}
            aria-pressed={inspectorOpen}
            title={inspectorToggleDisabled ? 'Window too narrow to show inspector' : inspectorOpen ? 'Hide inspector' : 'Show inspector'}
          >
            {/* Right sidebar */}
            <svg width="16" height="14" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.6" y="0.6" width="14.8" height="12.8" rx="1.4" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="10.6" y="0.6" width="4.8" height="12.8" rx="1.4" fill="currentColor" fillOpacity="0.35"/>
              <line x1="10.6" y1="0.6" x2="10.6" y2="13.4" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </button>
        </div>

        {isConnected ? (
          <div className="status-pill">
            <div className="status-dot" />
            <span>Ready</span>
          </div>
        ) : (
          <div className="status-pill status-pill-idle">
            <div className="status-dot" />
            <span>Browser Mode</span>
          </div>
        )}
      </div>
    </div>
  );
}
