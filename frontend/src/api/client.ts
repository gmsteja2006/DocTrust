import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

export interface UploadResponse {
  message: string;
  filename: string;
  document_id: string;
  chunk_count: number;
}

export interface RetrievedChunk {
  content: string;
  metadata: {
    document_id?: string;
    chunk_index?: number;
    source?: string;
    [key: string]: unknown;
  };
  distance: number;
}

export interface QueryResponse {
  answer: string;
  context?: RetrievedChunk[];
}

export interface DocumentItem {
  document_id: string;
  source: string;
  chunk_count: number;
}

export interface DocumentsResponse {
  documents: DocumentItem[];
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    if (typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }
  }

  return fallback;
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await api.post<UploadResponse>("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 600000,
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Upload failed"));
  }
}

export async function queryDocument(
  question: string,
  includeContext = true,
  sourceFilter?: string
): Promise<QueryResponse> {
  try {
    const response = await api.post<QueryResponse>("/query", {
      question,
      include_context: includeContext,
      source_filter: sourceFilter || null,
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Query failed"));
  }
}

export async function getDocuments(): Promise<DocumentItem[]> {
  try {
    const response = await api.get<DocumentsResponse>("/documents");
    return response.data.documents ?? [];
  } catch (error) {
    console.error("Failed to load documents", error);
    return [];
  }
}

export async function deleteDocument(documentId: string): Promise<void> {
  try {
    await api.delete(`/documents/${documentId}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Delete failed"));
  }
}

export async function clearAllDocuments(): Promise<void> {
  try {
    await api.delete("/documents");
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to clear documents"));
  }
}

export interface LLMSettings {
  provider: "ollama" | "groq";
  model: string;
  ollama_base_url: string;
  ollama_model: string;
  groq_model: string;
  groq_configured: boolean;
}

export async function getLLMSettings(): Promise<LLMSettings> {
  const response = await api.get<LLMSettings>("/settings");
  return response.data;
}

export async function setLLMProvider(provider: "ollama" | "groq"): Promise<LLMSettings> {
  const response = await api.post<LLMSettings>("/settings/provider", { provider });
  return response.data;
}

