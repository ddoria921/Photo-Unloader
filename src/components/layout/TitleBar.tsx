import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauriRuntime } from '@/lib/commands';

interface TitleBarProps {
  isConnected: boolean;
}

function handleTrafficLight(action: 'close' | 'minimize' | 'maximize') {
  if (!isTauriRuntime()) return;
  const win = getCurrentWindow();
  if (action === 'close') void win.close();
  else if (action === 'minimize') void win.minimize();
  else if (action === 'maximize') void win.toggleMaximize();
}

export function TitleBar({ isConnected }: TitleBarProps) {
  return (
    <div className="titlebar" data-tauri-drag-region>
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

      <span className="titlebar-name">Photo Unloader</span>

      <div className="titlebar-right">
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
