import { useState } from 'react';
import { isTauriRuntime } from '@/lib/commands';
import { useAppState } from '@/hooks/useAppState';

const IS_TAURI = isTauriRuntime();
import { AppShell } from '@/components/layout/AppShell';
import { TitleBar } from '@/components/layout/TitleBar';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { FileTable } from '@/components/filetable/FileTable';
import { InspectorPanel } from '@/components/inspector/InspectorPanel';
import { LogPanel } from '@/components/logpanel/LogPanel';
import { ProgressPanel } from '@/components/progress/ProgressPanel';
import { Toaster } from '@/components/ui/toaster';

function App() {
  const state = useAppState();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [bottomOpen, setBottomOpen] = useState(true);

  const {
    phase,
    sourcePath,
    scanResult,
    loading,
    importing,
    jpgDestination,
    rawDestination,
    progressState,
    importSummary,
    importLog,
    selectedFileIndex,
    activeFilter,
    filteredRows,
    fileRows,
    duplicateCount,
    importedCount,
    errorCount,
    importableCount,
    selectedCount,
    canStartImport,
    progressPercent,
    selectedFile,
    fileInputRef,
    toasts,
    dismissToast,
    onBrowse,
    onDropSourcePath,
    onSelectBrowserDirectory,
    onRescan,
    onStartImport,
    onCancelImport,
    onImportAnother,
    onOpenInFinder,
    onJpgDestinationChange,
    onRawDestinationChange,
    onJpgDestinationBlur,
    onRawDestinationBlur,
    onBrowseJpgDestination,
    onBrowseRawDestination,
    onSelectFile,
    onFilterChange,
    onSortChange,
    onToggleFileExclusion,
    onToggleAllFiles,
    sortKey,
    sortDir,
    excludedFiles
  } = state;

  const queueCount = scanResult
    ? scanResult.jpgCount + scanResult.rawCount + scanResult.videoCount
    : 0;
  const skippedCount = progressState?.skippedCount ?? importSummary?.skippedCount ?? 0;

  return (
    <AppShell
      sidebarCollapsed={!sidebarOpen}
      inspectorCollapsed={!inspectorOpen}
      bottomCollapsed={!bottomOpen}
    >
      <TitleBar
        isConnected={IS_TAURI}
        sidebarOpen={sidebarOpen}
        inspectorOpen={inspectorOpen}
        bottomOpen={bottomOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onToggleInspector={() => setInspectorOpen((v) => !v)}
        onToggleBottom={() => setBottomOpen((v) => !v)}
      />

      <Sidebar
        phase={phase}
        sourcePath={sourcePath}
        scanResult={scanResult}
        loading={loading}
        importing={importing}
        jpgDestination={jpgDestination}
        rawDestination={rawDestination}
        activeFilter={activeFilter}
        queueCount={queueCount}
        duplicateCount={duplicateCount}
        importedCount={importedCount}
        errorCount={errorCount}
        fileInputRef={fileInputRef}
        onBrowse={onBrowse}
        onSelectBrowserDirectory={onSelectBrowserDirectory}
        onJpgChange={onJpgDestinationChange}
        onRawChange={onRawDestinationChange}
        onJpgBlur={onJpgDestinationBlur}
        onRawBlur={onRawDestinationBlur}
        onJpgBrowse={onBrowseJpgDestination}
        onRawBrowse={onBrowseRawDestination}
        onFilterChange={onFilterChange}
        sessions={state.sessions}
      />

      <main className="main-area">
        <Toolbar
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          totalCount={fileRows.length}
          filteredCount={filteredRows.length}
          importableCount={importableCount}
          selectedCount={selectedCount}
          phase={phase}
          importing={importing}
          loading={loading}
          canStartImport={canStartImport}
          onRescan={onRescan}
          onStartImport={onStartImport}
          onCancelImport={onCancelImport}
        />
        <FileTable
          rows={filteredRows}
          selectedIndex={
            selectedFileIndex !== null
              ? filteredRows.findIndex((r) => r === fileRows[selectedFileIndex])
              : null
          }
          phase={phase}
          sortKey={sortKey}
          sortDir={sortDir}
          excludedFiles={excludedFiles}
          onBrowse={onBrowse}
          onDropPath={onDropSourcePath}
          onSortChange={onSortChange}
          onToggleFileExclusion={onToggleFileExclusion}
          onToggleAllFiles={onToggleAllFiles}
          onRowSelect={(filteredIdx) => {
            const row = filteredRows[filteredIdx];
            if (row) {
              const realIdx = fileRows.indexOf(row);
              if (realIdx !== -1) {
                onSelectFile(realIdx);
                setInspectorOpen(true);
              }
            }
          }}
        />
      </main>

      <InspectorPanel
        selectedFile={selectedFile}
        jpgDestination={jpgDestination}
        rawDestination={rawDestination}
      />

      <LogPanel
        entries={importLog}
        errorCount={errorCount}
        skippedCount={skippedCount}
      />

      <ProgressPanel
        phase={phase}
        progressState={progressState}
        importSummary={importSummary}
        scanResult={scanResult}
        progressPercent={progressPercent}
        importableCount={importableCount}
        estimatedSecondsRemaining={state.estimatedSecondsRemaining}
        onOpenInFinder={onOpenInFinder}
        onImportAnother={onImportAnother}
      />

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </AppShell>
  );
}

export default App;
