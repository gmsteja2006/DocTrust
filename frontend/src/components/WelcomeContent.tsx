import {
  ShieldCheck,
  Search,
  Cpu,
  FileCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";

interface WelcomeContentProps {
  hasDocuments?: boolean;
  onSelectPrompt?: (prompt: string) => void;
}

const CAPABILITIES = [
  {
    icon: Search,
    title: "Smart Search",
    description: "Instantly searches through your entire document to find exact answers, facts, and figures.",
    accent: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    icon: Cpu,
    title: "Deep Understanding",
    description: "Understands questions asked in plain English, even if the document uses different wording.",
    accent: "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30",
  },
  {
    icon: ShieldCheck,
    title: "Verified Answers",
    description: "Every answer quotes the exact section from your document so you can easily verify the facts.",
    accent: "from-indigo-500/20 to-violet-500/20 text-indigo-400 border-indigo-500/30",
  },
];

const SAMPLE_QUESTIONS = [
  "What is the overall summary of this document?",
  "What are the most important takeaways?",
  "Are there any requirements, dates, or key conditions mentioned?",
  "What are the main conclusions or recommendations?",
];

export function WelcomeContent({
  hasDocuments = false,
  onSelectPrompt,
}: WelcomeContentProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const headingColor = isLight ? "text-slate-900" : "text-white";
  const subText = isLight ? "text-slate-600" : "text-slate-400";
  const cardBg = isLight ? "border-slate-300 bg-slate-100" : "border-slate-800/60 bg-slate-900/40";
  const cardHover = isLight ? "hover:border-slate-400 hover:bg-slate-200" : "hover:border-slate-700 hover:bg-slate-800/60";
  const cardTitle = isLight ? "text-slate-800" : "text-slate-200";
  const cardDesc = isLight ? "text-slate-600" : "text-slate-400";
  const questionBg = isLight
    ? "border-slate-300 bg-white text-slate-700 hover:border-emerald-600 hover:bg-emerald-100 hover:text-slate-900"
    : "border-slate-700 bg-slate-800/60 text-slate-300 hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-white";
  const sectionBg = isLight ? "border-slate-300 bg-slate-100" : "border-slate-800/60 bg-slate-900/40";
  const noDocBg = isLight
    ? "border-emerald-600/30 bg-emerald-100"
    : "border-emerald-500/20 bg-emerald-500/5";
  const noDocTitle = isLight ? "text-slate-800" : "text-slate-200";
  const noDocSub = isLight ? "text-slate-600" : "text-slate-400";
  const iconBg = isLight ? "bg-white" : "bg-[#0e131d]";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
      {/* Brand Hero Shield */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-xl shadow-emerald-500/20 animate-glow">
          <div className={`flex h-full w-full items-center justify-center rounded-[14px] ${iconBg}`}>
            <ShieldCheck className="h-8 w-8 text-emerald-600" />
          </div>
        </div>

        <div>
          <h2 className={`text-2xl font-extrabold tracking-tight sm:text-3xl ${headingColor}`}>
            Welcome to{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              DocTrust
            </span>
          </h2>
          <p className={`mt-2 max-w-md text-sm ${subText}`}>
            Upload your documents and ask any question in plain English to get accurate, instant answers.
          </p>
        </div>
      </div>

      {/* Suggested Questions if documents are indexed */}
      {hasDocuments ? (
        <div className={`w-full flex flex-col gap-2.5 rounded-2xl border p-5 text-left backdrop-blur ${sectionBg}`}>
          <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${subText}`}>
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            <span>Click any question to ask immediately</span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => onSelectPrompt?.(q)}
                className={`group flex items-start justify-between rounded-xl border p-3 text-left text-xs transition ${questionBg}`}
              >
                <span>{q}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={`w-full rounded-2xl border border-dashed p-5 text-center ${noDocBg}`}>
          <FileCheck className={`mx-auto h-8 w-8 mb-2 ${isLight ? "text-emerald-700" : "text-emerald-500"}`} />
          <p className={`text-sm font-semibold ${noDocTitle}`}>No documents uploaded yet</p>
          <p className={`mt-1 text-xs ${noDocSub}`}>
            Drag and drop a PDF, Word (DOCX), or text file into the left sidebar to begin.
          </p>
        </div>
      )}

      {/* Feature Pillar Cards */}
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        {CAPABILITIES.map((cap) => (
          <div
            key={cap.title}
            className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${cardBg} ${cardHover}`}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg border bg-gradient-to-br ${cap.accent}`}>
              <cap.icon className="h-5 w-5" />
            </div>
            <h3 className={`text-xs font-bold ${cardTitle}`}>{cap.title}</h3>
            <p className={`text-[11px] leading-relaxed ${cardDesc}`}>{cap.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
