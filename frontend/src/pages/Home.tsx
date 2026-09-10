import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "../components/Sidebar";
import { Chat } from "../components/Chat";
import { WelcomeContent } from "../components/WelcomeContent";
import { ShieldCheck, Menu, Database, Wifi, WifiOff, Loader2, HardDrive, Cloud, Sun, Moon } from "lucide-react";
import { getDocuments, getLLMSettings, setLLMProvider, type LLMSettings } from "../api/client";
import { useTheme } from "../hooks/useTheme";

export function Home() {
  const [hasDocuments, setHasDocuments] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [llmSettings, setLlmSettings] = useState<LLMSettings | null>(null);
  const [providerSwitching, setProviderSwitching] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  // Saved or default sidebar width (draggable)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("docutrust_sidebar_width");
    return saved ? parseInt(saved, 10) : 320;
  });

  const checkDocuments = useCallback(async () => {
    try {
      const docs = await getDocuments();
      setHasDocuments(docs.length > 0);
    } catch {
      // ignore
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const settings = await getLLMSettings();
      setLlmSettings(settings);
    } catch {
      // ignore — backend might still be starting
    }
  }, []);

  useEffect(() => {
    checkDocuments();
    fetchSettings();
  }, [checkDocuments, fetchSettings]);

  function handleWidthChange(newWidth: number) {
    setSidebarWidth(newWidth);
    localStorage.setItem("docutrust_sidebar_width", String(newWidth));
  }

  function handleUploadSuccess() {
    checkDocuments();
  }

  async function toggleProvider() {
    if (!llmSettings || providerSwitching) return;
    const next = llmSettings.provider === "ollama" ? "groq" : "ollama";
    setProviderSwitching(true);
    try {
      const updated = await setLLMProvider(next);
      setLlmSettings(updated);
    } catch {
      // optionally show error
    } finally {
      setProviderSwitching(false);
    }
  }

  const isOllama = llmSettings?.provider === "ollama";

  // Theme-aware header styles
  const headerBg = isLight
    ? "bg-white/90 border-slate-200"
    : "bg-[#0e131d]/80 border-slate-800/80";
  const menuBtnClass = isLight
    ? "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
    : "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white";
  const smartSearchBadge = isLight
    ? "border-slate-200 bg-slate-100 text-slate-600"
    : "border-slate-800 bg-slate-900/60 text-slate-300";
  const providerPillBg = isLight
    ? "border-slate-300 bg-slate-100 shadow-inner"
    : "border-slate-700/80 bg-slate-900/80 shadow-inner";
  const modelBadge = isLight
    ? "border-slate-200 bg-slate-100 text-slate-500"
    : "border-slate-800 bg-slate-900/60 text-slate-400";
  const mainBg = isLight ? "bg-slate-50" : "bg-[#0b0f17]";
  const subtitleColor = isLight ? "text-slate-500" : "text-slate-400";
  const titleColor = isLight ? "text-slate-900" : "text-white";

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-200 ${mainBg} ${isLight ? "text-slate-900" : "text-slate-100"}`}>
      {/* Resizable Draggable Sidebar */}
      <Sidebar
        onUploadSuccess={handleUploadSuccess}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        width={sidebarWidth}
        onWidthChange={handleWidthChange}
        onSelectDocument={(source) => setSelectedDocument(source)}
        selectedDocument={selectedDocument}
      />

      {/* Main Content Area */}
      <main className={`flex min-w-0 flex-1 flex-col overflow-hidden transition-colors duration-200 ${mainBg}`}>
        {/* Top Header Navigation */}
        <header className={`flex shrink-0 items-center justify-between border-b px-4 py-3 backdrop-blur md:px-6 transition-colors duration-200 ${headerBg}`}>
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                title="Open Sidebar"
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${menuBtnClass}`}
              >
                <Menu className="h-4 w-4" />
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-md shadow-emerald-500/10">
                <ShieldCheck className="h-5 w-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className={`text-sm font-bold tracking-tight ${titleColor}`}>DocTrust</h1>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    AI Assistant
                  </span>
                </div>
                <p className={`text-[11px] ${subtitleColor}`}>
                  Ask questions and get instant, accurate answers from your documents
                </p>
              </div>
            </div>
          </div>

          {/* Right Header — Theme Toggle + Provider Toggle + Status Badges */}
          <div className="flex items-center gap-2">
            <div className={`hidden sm:flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] ${smartSearchBadge}`}>
              <Database className="h-3 w-3 text-emerald-400" />
              <span>Smart Search</span>
            </div>

            {/* LLM Provider Toggle — Segmented Control */}
            {llmSettings && (
              <div
                className="flex items-center gap-2"
                title={
                  isOllama
                    ? `Local Mode — ${llmSettings.ollama_model} running on your machine. Click API Mode to switch to Groq Cloud.`
                    : `API Mode — ${llmSettings.groq_model} via Groq Cloud. Click Local Mode to switch to local Ollama.`
                }
              >
                {/* Segmented pill */}
                <div className={`relative flex items-center rounded-xl border p-0.5 ${providerPillBg}`}>
                  {/* Sliding active background */}
                  <span
                    className={[
                      "absolute top-0.5 bottom-0.5 rounded-[10px] transition-all duration-300 ease-in-out",
                      isOllama
                        ? "left-0.5 right-[calc(50%+1px)] bg-violet-600/30 border border-violet-500/50 shadow-md shadow-violet-900/20"
                        : "left-[calc(50%+1px)] right-0.5 bg-cyan-600/30 border border-cyan-500/50 shadow-md shadow-cyan-900/20",
                    ].join(" ")}
                  />

                  {/* Local Mode button */}
                  <button
                    id="llm-local-mode-btn"
                    type="button"
                    onClick={() => !isOllama && !providerSwitching && toggleProvider()}
                    disabled={providerSwitching}
                    className={[
                      "relative z-10 flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 focus:outline-none",
                      isOllama
                        ? "text-violet-200"
                        : isLight ? "text-slate-500 hover:text-slate-800 cursor-pointer" : "text-slate-400 hover:text-slate-200 cursor-pointer",
                      providerSwitching ? "cursor-wait" : "",
                    ].join(" ")}
                  >
                    {providerSwitching && isOllama ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <HardDrive className={`h-3 w-3 ${isOllama ? "text-violet-400" : "text-slate-500"}`} />
                    )}
                    <span>Local</span>
                  </button>

                  {/* API Mode button */}
                  <button
                    id="llm-api-mode-btn"
                    type="button"
                    onClick={() => isOllama && !providerSwitching && toggleProvider()}
                    disabled={providerSwitching}
                    className={[
                      "relative z-10 flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 focus:outline-none",
                      !isOllama
                        ? "text-cyan-200"
                        : isLight ? "text-slate-500 hover:text-slate-800 cursor-pointer" : "text-slate-400 hover:text-slate-200 cursor-pointer",
                      providerSwitching ? "cursor-wait" : "",
                    ].join(" ")}
                  >
                    {providerSwitching && !isOllama ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Cloud className={`h-3 w-3 ${!isOllama ? "text-cyan-400" : "text-slate-500"}`} />
                    )}
                    <span>API</span>
                  </button>
                </div>

                {/* Active model name badge */}
                <span className={`hidden md:flex items-center gap-1 rounded-lg border px-2 py-1 font-mono text-[10px] ${modelBadge}`}>
                  {isOllama ? (
                    <WifiOff className="h-2.5 w-2.5 text-violet-400" />
                  ) : (
                    <Wifi className="h-2.5 w-2.5 text-cyan-400" />
                  )}
                  {llmSettings.model}
                </span>
              </div>
            )}

            {/* ── Dark / Light Mode Toggle ── */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
              aria-label={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
              className={`relative flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 ${
                isLight
                  ? "border-slate-200 bg-slate-100 text-amber-500 hover:bg-amber-50 hover:border-amber-300 hover:shadow-sm hover:shadow-amber-200"
                  : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600"
              }`}
            >
              {isLight ? (
                <Moon className="h-4 w-4 transition-transform duration-300" />
              ) : (
                <Sun className="h-4 w-4 transition-transform duration-300" />
              )}
            </button>
          </div>
        </header>

        {/* Center Chat & Conversation Component */}
        <Chat
          isEnabled={hasDocuments}
          selectedDocument={selectedDocument}
          onClearDocumentFilter={() => setSelectedDocument(null)}
        >
          <WelcomeContent
            hasDocuments={hasDocuments}
            onSelectPrompt={() => {
              // trigger
            }}
          />
        </Chat>
      </main>
    </div>
  );
}
