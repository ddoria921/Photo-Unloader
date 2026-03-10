import type { MediaFile } from '@/types';
import { PhotoPreview } from './PhotoPreview';
import { ExifGrid } from './ExifGrid';

interface InspectorPanelProps {
  selectedFile: MediaFile | null;
  jpgDestination: string;
  rawDestination: string;
}

export function InspectorPanel({ selectedFile, jpgDestination, rawDestination }: InspectorPanelProps) {
  return (
    <aside className="inspector">
      <div className="inspector-header">File Inspector</div>

      {selectedFile ? (
        <>
          <PhotoPreview file={selectedFile} />
          <ExifGrid
            file={selectedFile}
            jpgDestination={jpgDestination}
            rawDestination={rawDestination}
          />
        </>
      ) : (
        <>
          <div className="inspector-preview">
            <div className="inspector-preview-placeholder">
              <span className="inspector-preview-icon">⬡</span>
              <span className="inspector-preview-label">No file selected</span>
            </div>
          </div>
          <div className="inspector-empty">
            <span className="inspector-empty-icon">↖</span>
            <span className="inspector-empty-label">Select a file to inspect</span>
          </div>
        </>
      )}
    </aside>
  );
}
