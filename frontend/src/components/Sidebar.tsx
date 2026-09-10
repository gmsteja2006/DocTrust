import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from "react";
import {
  ChevronLeft,
  Upload,
  FolderOpen,
  ShieldCheck,
  X,
  FileText,
  Trash2,
  Database,
  Layers,
  Sparkles,
  GripVertical,
} from "lucide-react";
import { useUpload } from "../hooks/useUpload";
import { useTheme } from "../hooks/useTheme";

interface SidebarProps {
  onUploadSuccess: () => void;
  open: boolean;
  onClose: () => void;
  width: number;
  onWidthChange: (newWidth: number) => void;
  onSelectDocument?: (source: string | null) => void;
  selectedDocument?: string | null;
}

export function Sidebar({
  onUploadSuccess,
  open,
  onClose,
  width,
  onWidthChange,
  onSelectDocument,
  selectedDocument,
}: SidebarProps) {
  const {
    file,
    status,
    documents,
    isLoadingDocs,
    handleFileChange,
    handleUpload,
    handleDelete,
    handleClearAll,
  } = useUpload(onUploadSuccess);

  const { theme } = useTheme();
  const isLight = theme === "light";

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement | null>(null);

  const isUploading = status.type === "loading";

  // Handle Drag-to-Resize from Left to Right
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isResizing) return;
      const minWidth = 240;
      const maxWidth = 580;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX));
      onWidthChange(newWidth);
    }

    function handleMouseUp() {
      if (isResizing) {
        setIsResizing(false);
        document.body.classList.remove("is-resizing");
      }
    }

    if (isResizing) {
      document.body.classList.add("is-resizing");
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.classList.remove("is-resizing");
    };
  }, [isResizing, onWidthChange]);

  function handleResizeStart(e: React.MouseEvent) {
    e.preventDefault();
    setIsResizing(true);
  }

  function handleResizeReset() {
    onWidthChange(320);
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    if (isUploading) return;
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      const fakeEvent = {
        target: { files: [droppedFile] },
      } as unknown as ChangeEvent<HTMLInputElement>;
      handleFileChange(fakeEvent);
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (!isDraggingOver) setIsDraggingOver(true);
  }

  function handleDragLeave() {
    setIsDraggingOver(false);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    handleUpload();
  }

  const totalChunks = documents.reduce((acc, d) => acc + (d.chunk_count || 0), 0);

  // Theme-aware class sets
  const sidebarBg = isLight ? "bg-white border-slate-200" : "bg-[#0c1017] border-slate-800/80";
  const headerBg = isLight ? "bg-slate-50/80 border-slate-200" : "bg-slate-950/40 border-slate-800/80";
  const statsBg = isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/30 border-slate-800/50";
  const statsText = isLight ? "text-slate-500" : "text-slate-400";
  const statsStrong = isLight ? "text-slate-800" : "text-slate-200";
  const closeBtn = isLight ? "text-slate-500 hover:bg-slate-200 hover:text-slate-800" : "text-slate-400 hover:bg-slate-800 hover:text-white";
  const sectionLabel = isLight ? "text-slate-500" : "text-slate-400";
  const dropzoneIdle = isLight
    ? "border-slate-300 bg-slate-50 hover:border-emerald-500/60 hover:bg-emerald-50"
    : "border-slate-700/80 bg-slate-900/40 hover:border-emerald-500/50 hover:bg-slate-900/70";
  const dropzoneIconBg = isLight ? "bg-slate-200" : "bg-slate-800/80";
  const dropzoneText = isLight ? "text-slate-700" : "text-slate-200";
  const dropzoneSub = isLight ? "text-slate-400" : "text-slate-400";
  const fileSelectedBg = isLight
    ? "border-emerald-500/40 bg-emerald-50 text-emerald-700"
    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  const emptyStateBg = isLight
    ? "border-slate-200 bg-slate-50"
    : "border-slate-800/60 bg-slate-900/20";
  const emptyStateIcon = isLight ? "text-slate-400" : "text-slate-600";
  const emptyStateTitle = isLight ? "text-slate-500" : "text-slate-400";
  const emptyStateSub = isLight ? "text-slate-400" : "text-slate-500";
  const docCard = (isSelected: boolean) =>
    isSelected
      ? "border-emerald-500/50 bg-emerald-500/10 shadow-sm"
      : isLight
      ? "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
      : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/40";
  const docName = isLight ? "text-slate-800" : "text-slate-200";
  const docMeta = isLight ? "text-slate-400" : "text-slate-400";
  const docIconBg = isLight ? "bg-slate-200" : "bg-slate-800";
  const footerBg = isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800/80";
  const footerText = isLight ? "text-slate-500" : "text-slate-400";
  const footerStrong = isLight ? "text-slate-700" : "text-slate-300";
  const clearAllBtn = isLight
    ? "text-slate-400 hover:bg-rose-50 hover:text-rose-500"
    : "text-slate-400 hover:bg-rose-500/20 hover:text-rose-400";

  return (
    <>
      {/* Backdrop overlay — mobile only */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        ref={sidebarRef}
        style={{ width: open ? `${width}px` : 0 }}
        className={`relative fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col overflow-hidden border-r transition-[width] duration-150 ease-out md:static md:z-auto ${sidebarBg} ${
          open ? "opacity-100" : "w-0 opacity-0 pointer-events-none"
        }`}
      >
        {/* Header Branding */}
        <div className={`flex items-center justify-between border-b px-4 py-3.5 backdrop-blur ${headerBg}`}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-md shadow-emerald-500/20">
              <ShieldCheck className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>DocTrust</span>
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                  AI
                </span>
              </div>
              <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>Document Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Collapse Sidebar"
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${closeBtn}`}
          >
            <X className="h-4 w-4 md:hidden" />
            <ChevronLeft className="hidden h-4 w-4 md:block" />
          </button>
        </div>

        {/* Vault Stats Bar */}
        <div className={`flex items-center justify-between border-b px-4 py-2 text-[11px] ${statsBg} ${statsText}`}>
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span>
              <strong className={statsStrong}>{documents.length}</strong>{" "}
              {documents.length === 1 ? "document" : "documents"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>
              <strong className={statsStrong}>{totalChunks}</strong> sections
            </span>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {/* Upload Drop Zone Card */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${sectionLabel}`}>
                Upload Documents
              </span>
              <span className={`text-[10px] ${sectionLabel}`}>PDF • DOCX • TXT</span>
            </div>

            <label
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`group relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition-all ${
                isUploading
                  ? "cursor-not-allowed border-slate-700 opacity-60"
                  : isDraggingOver
                  ? "border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                  : `cursor-pointer ${dropzoneIdle}`
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-emerald-400 transition-transform group-hover:scale-110 ${dropzoneIconBg}`}>
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className={`text-xs font-medium truncate max-w-[200px] ${dropzoneText}`}>
                  {file ? file.name : "Drag & drop document"}
                </p>
                <p className={`text-[11px] ${dropzoneSub}`}>or click to browse</p>
              </div>

              <input
                type="file"
                accept=".pdf,.txt,.text,.docx"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
            </label>

            {file && (
              <div className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-xs ${fileSelectedBg}`}>
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate font-medium">{file.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className="shrink-0 rounded bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isUploading ? "Uploading..." : "Upload File"}
                </button>
              </div>
            )}

            {/* Status notification */}
            {status.type !== "idle" && (
              <div
                className={`rounded-lg p-2.5 text-xs ${
                  status.type === "loading"
                    ? "border border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                    : status.type === "success"
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border border-rose-500/30 bg-rose-500/10 text-rose-400"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {status.type === "loading" && (
                    <span className="h-2 w-2 animate-ping rounded-full bg-cyan-400" />
                  )}
                  <span className="break-words">{status.message}</span>
                </div>
              </div>
            )}
          </div>

          {/* Indexed Documents Section */}
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FolderOpen className={`h-3.5 w-3.5 ${sectionLabel}`} />
                <span className={`text-xs font-semibold uppercase tracking-wider ${sectionLabel}`}>
                  Your Documents ({documents.length})
                </span>
              </div>
              {documents.length > 0 && (
                <button
                  onClick={handleClearAll}
                  title="Clear all documents"
                  className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition ${clearAllBtn}`}
                >
                  <Trash2 className="h-3 w-3" />
                  Clear All
                </button>
              )}
            </div>

            {isLoadingDocs ? (
              <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
                <span className="mt-2 text-xs">Loading documents...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className={`flex flex-col items-center justify-center rounded-xl border p-6 text-center ${emptyStateBg}`}>
                <FileText className={`mb-2 h-7 w-7 ${emptyStateIcon}`} />
                <p className={`text-xs font-medium ${emptyStateTitle}`}>No documents yet</p>
                <p className={`mt-1 text-[11px] ${emptyStateSub}`}>Upload a document above to start asking questions</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {documents.map((doc) => {
                  const isSelected = selectedDocument === doc.source;
                  return (
                    <div
                      key={doc.document_id}
                      onClick={() => onSelectDocument?.(isSelected ? null : doc.source)}
                      className={`group relative flex items-center justify-between rounded-lg border p-2.5 text-xs transition-all cursor-pointer ${docCard(isSelected)}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-emerald-400 ${docIconBg}`}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate font-medium ${docName}`} title={doc.source}>
                            {doc.source}
                          </p>
                          <div className={`flex items-center gap-2 text-[10px] ${docMeta}`}>
                            <span className="text-emerald-400 font-mono">
                              {doc.chunk_count} {doc.chunk_count === 1 ? "section" : "sections"}
                            </span>
                            {isSelected && (
                              <span className="rounded bg-emerald-500/20 px-1 text-emerald-300">
                                Active Filter
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.document_id);
                        }}
                        title={`Delete ${doc.source}`}
                        className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-500 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer System Status */}
        <div className={`border-t p-3 text-[11px] backdrop-blur ${footerBg} ${footerText}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className={`font-medium ${footerStrong}`}>Document Library</span>
            </div>
            <span className={`text-[10px] ${footerText}`}>Ready</span>
          </div>
          <div className={`mt-1 flex items-center justify-between text-[10px] ${footerText}`}>
            <span>AI Assistant</span>
            <span className="flex items-center gap-0.5 text-emerald-400">
              <Sparkles className="h-2.5 w-2.5" /> Online
            </span>
          </div>
        </div>

        {/* Draggable Resizer Handle (Left-to-Right resizing) */}
        <div
          onMouseDown={handleResizeStart}
          onDoubleClick={handleResizeReset}
          title="Drag left/right to resize sidebar (Double-click to reset)"
          className={`absolute top-0 right-0 z-50 flex h-full w-2.5 cursor-col-resize items-center justify-center transition-colors group ${
            isResizing ? "bg-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.8)]" : "hover:bg-emerald-500/30"
          }`}
        >
          <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <GripVertical className="h-4 w-4 text-emerald-300" />
          </div>
        </div>
      </aside>
    </>
  );
}
