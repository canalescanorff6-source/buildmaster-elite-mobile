import { activeAccountNamespace } from './accountStorage';

export interface ReaderContextSnapshotR549 {
  selectedFile: File | null;
  fileName: string | null;
}

export function captureReaderContextAuthorityR549(ref: {current: ReaderContextSnapshotR549}) {
  const snapshot = ref.current, namespace = activeAccountNamespace();
  return () => namespace === activeAccountNamespace()
    && snapshot.selectedFile === ref.current.selectedFile
    && snapshot.fileName === ref.current.fileName;
}
