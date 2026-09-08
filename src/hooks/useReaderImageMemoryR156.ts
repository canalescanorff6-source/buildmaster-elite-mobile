'use client';

import { useEffect, useRef } from 'react';
import { createObjectUrlLeaseR156, type ObjectUrlLeaseR156 } from '@/modules/images/objectUrlLeaseR156';

export const READER_IMAGE_MEMORY_R156_VERSION = '40.80-r156-reader-image-memory-v1' as const;

export function useReaderImageMemoryR156() {
  const previewLeaseRef = useRef<ObjectUrlLeaseR156 | null>(null);
  const enhancedLeaseRef = useRef<ObjectUrlLeaseR156 | null>(null);
  if (!previewLeaseRef.current) previewLeaseRef.current = createObjectUrlLeaseR156();
  if (!enhancedLeaseRef.current) enhancedLeaseRef.current = createObjectUrlLeaseR156();

  useEffect(() => () => {
    previewLeaseRef.current?.release();
    enhancedLeaseRef.current?.release();
  }, []);

  return {
    replacePreview(blob: Blob) {
      return previewLeaseRef.current!.replace(blob);
    },
    replaceEnhanced(blob: Blob) {
      return enhancedLeaseRef.current!.replace(blob);
    },
    releasePreview() {
      previewLeaseRef.current?.release();
    },
    releaseEnhanced() {
      enhancedLeaseRef.current?.release();
    },
    releaseAll() {
      previewLeaseRef.current?.release();
      enhancedLeaseRef.current?.release();
    }
  } as const;
}
