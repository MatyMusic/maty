"use client";
import { useCallback } from "react";

export function useDropZone({
  rootRef,
  onFiles,
  setDragOver,
}: {
  rootRef: React.RefObject<HTMLElement>;
  onFiles: (files: File[]) => void | Promise<void>;
  setDragOver: (v: boolean) => void;
}) {
  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(true);
    },
    [setDragOver],
  );

  const onDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
    },
    [setDragOver],
  );

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files || []);
      if (files.length) await onFiles(files);
    },
    [onFiles, setDragOver],
  );

  return { onDragOver, onDragLeave, onDrop, dragOver: false };
}
