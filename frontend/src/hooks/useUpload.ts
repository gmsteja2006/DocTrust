import { useState, useEffect, useCallback, type ChangeEvent } from "react";
import {
  uploadDocument,
  getDocuments,
  deleteDocument,
  clearAllDocuments,
  type DocumentItem,
} from "../api/client";

export interface UploadStatus {
  type: "idle" | "loading" | "success" | "error";
  message: string;
}

export function useUpload(onUploadSuccess?: () => void) {
  const [file, setFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [status, setStatus] = useState<UploadStatus>({
    type: "idle",
    message: "",
  });

  const refreshDocuments = useCallback(async () => {
    setIsLoadingDocs(true);
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch {
      // ignore
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setStatus({ type: "idle", message: "" });
  }

  async function handleUpload() {
    if (!file) {
      setStatus({ type: "error", message: "Please select a file first." });
      return;
    }

    setStatus({ type: "loading", message: `Processing & indexing "${file.name}"...` });

    try {
      const result = await uploadDocument(file);
      setStatus({
        type: "success",
        message: `Indexed "${result.filename}" into ${result.chunk_count} semantic chunks.`,
      });
      setFile(null);
      await refreshDocuments();
      onUploadSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      setStatus({ type: "error", message });
    }
  }

  async function handleDelete(documentId: string) {
    try {
      await deleteDocument(documentId);
      await refreshDocuments();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed.";
      setStatus({ type: "error", message });
    }
  }

  async function handleClearAll() {
    try {
      await clearAllDocuments();
      await refreshDocuments();
      setStatus({ type: "success", message: "All documents cleared from vault." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Clear failed.";
      setStatus({ type: "error", message });
    }
  }

  return {
    file,
    status,
    documents,
    isLoadingDocs,
    handleFileChange,
    handleUpload,
    handleDelete,
    handleClearAll,
    refreshDocuments,
  };
}
