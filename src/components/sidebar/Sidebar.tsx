import type { ChangeEvent } from 'react';
import type { DashboardPhase, FileFilter, ScanResult, SessionRecord } from '@/types';
import { DeviceCard } from './DeviceCard';
import { DestinationSection } from './DestinationSection';
import { SidebarNav } from './SidebarNav';
import { SessionHistory } from './SessionHistory';
import { SidebarFooter } from './SidebarFooter';

interface SidebarProps {
  phase: DashboardPhase;
  sourcePath: string;
  scanResult: ScanResult | null;
  loading: boolean;
  importing: boolean;
  jpgDestination: string;
  rawDestination: string;
  activeFilter: FileFilter;
  queueCount: number;
  duplicateCount: number;
  importedCount: number;
  errorCount: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onBrowse: () => void;
  onSelectBrowserDirectory: (event: ChangeEvent<HTMLInputElement>) => void;
  onJpgChange: (value: string) => void;
  onRawChange: (value: string) => void;
  onJpgBlur: () => void;
  onRawBlur: () => void;
  onJpgBrowse: () => void;
  onRawBrowse: () => void;
  onFilterChange: (filter: FileFilter) => void;
  sessions: SessionRecord[];
}

export function Sidebar({
  phase,
  sourcePath,
  scanResult,
  loading,
  importing,
  jpgDestination,
  rawDestination,
  activeFilter,
  queueCount,
  duplicateCount,
  importedCount,
  errorCount,
  fileInputRef,
  onBrowse,
  onSelectBrowserDirectory,
  onJpgChange,
  onRawChange,
  onJpgBlur,
  onRawBlur,
  onJpgBrowse,
  onRawBrowse,
  onFilterChange,
  sessions
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <DeviceCard
        sourcePath={sourcePath}
        scanResult={scanResult}
        phase={phase}
        loading={loading}
        fileInputRef={fileInputRef}
        onBrowse={onBrowse}
        onSelectBrowserDirectory={onSelectBrowserDirectory}
      />

      <SidebarNav
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        queueCount={queueCount}
        duplicateCount={duplicateCount}
        importedCount={importedCount}
        errorCount={errorCount}
      />

      <DestinationSection
        jpgDestination={jpgDestination}
        rawDestination={rawDestination}
        disabled={importing}
        onJpgChange={onJpgChange}
        onRawChange={onRawChange}
        onJpgBlur={onJpgBlur}
        onRawBlur={onRawBlur}
        onJpgBrowse={onJpgBrowse}
        onRawBrowse={onRawBrowse}
      />

      <SessionHistory sessions={sessions} />

      <div className="sidebar-spacer" />

      <SidebarFooter />
    </aside>
  );
}
