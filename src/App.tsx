import { isTauriRuntime } from '@/lib/commands';
import { useAppState } from '@/hooks/useAppState';
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
    importableCount,
    canStartImport,
    progressPercent,
    selectedFile,
    fileInputRef,
    toasts,
    dismissToast,
    onBrowse,
    onSelectBrowserDirectory,
    onRescan,
    onStartImport,
    onImportAnother,
    onOpenInFinder,
    onJpgDestinationChange,
    onRawDestinationChange,
    onJpgDestinationBlur,
    onRawDestinationBlur,
    onSelectFile,
    onFilterChange
  } = state;

  const queueCount = scanResult
    ? scanResult.jpgCount + scanResult.rawCount + scanResult.videoCount
    : 0;
  const duplicateCount = fileRows.filter((r) => r.status === 'duplicate').length;
  const importedCount = fileRows.filter((r) => r.status === 'copied').length;
  const errorCount = fileRows.filter((r) => r.status === 'error').length;
  const skippedCount = progressState?.skippedCount ?? importSummary?.skippedCount ?? 0;

  return (
    <AppShell>
      <TitleBar isConnected={isTauriRuntime()} />

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
        onFilterChange={onFilterChange}
      />

      <main className="main-area">
        <Toolbar
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          totalCount={fileRows.length}
          filteredCount={filteredRows.length}
          importableCount={importableCount}
          phase={phase}
          importing={importing}
          loading={loading}
          canStartImport={canStartImport}
          onRescan={onRescan}
          onStartImport={onStartImport}
        />
        <FileTable
          rows={filteredRows}
          selectedIndex={
            selectedFileIndex !== null
              ? filteredRows.findIndex((r) => r === fileRows[selectedFileIndex])
              : null
          }
          phase={phase}
          onRowSelect={(filteredIdx) => {
            const row = filteredRows[filteredIdx];
            if (row) {
              const realIdx = fileRows.indexOf(row);
              if (realIdx !== -1) onSelectFile(realIdx);
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
        onOpenInFinder={onOpenInFinder}
        onImportAnother={onImportAnother}
      />

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </AppShell>
  );
}

export default App;
