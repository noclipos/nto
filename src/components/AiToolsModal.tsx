import React, { useState } from "react";
import { X, Sparkles, MessageSquare, Mic, Volume2, FileText, Send, Check, Loader2 } from "lucide-react";
import { TranslationDictionary } from "../i18n/translations";
import { AppLanguage } from "../types";

export type AiToolType = "khaleeji" | "faid" | "stt" | "voice_clone" | "summary";

interface AiToolsModalProps {
  tool: AiToolType | null;
  onClose: () => void;
  t: TranslationDictionary;
  language: AppLanguage;
  initialText?: string;
}

export const AiToolsModal: React.FC<AiToolsModalProps> = ({
  tool,
  onClose,
  t,
  language,
  initialText = "",
}) => {
  const [inputText, setInputText] = useState(initialText);
  const [resultText, setResultText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!tool) return null;

  const isComingSoon = tool === "faid" || tool === "voice_clone";

  const getToolMetadata = () => {
    switch (tool) {
      case "khaleeji":
        return {
          title: t.toolKhaleejiTitle,
          description: t.toolKhaleejiDesc,
          icon: <MessageSquare className="w-5 h-5 text-violet-400" />,
          placeholder: language === "ar" ? "أدخل نصاً فصيحاً أو عامياً لتحويله للهجة الخليجية..." : "Enter text to adapt into contemporary Gulf Arabic dialect...",
          btnLabel: language === "ar" ? "تحويل للهجة الخليجية" : "Adapt to Khaleeji",
        };
      case "summary":
        return {
          title: t.toolSummaryTitle,
          description: t.toolSummaryDesc,
          icon: <FileText className="w-5 h-5 text-pink-400" />,
          placeholder: language === "ar" ? "الصق نص التفريغ أو المحتوى لتلخيصه واستخراج أهم الأفكار..." : "Paste transcript or media notes to generate structured key takeaways...",
          btnLabel: language === "ar" ? "توليد الملخص الذكي" : "Generate AI Summary",
        };
      case "stt":
        return {
          title: t.toolSttTitle,
          description: t.toolSttDesc,
          icon: <Mic className="w-5 h-5 text-blue-400" />,
          placeholder: "Supported across all video downloads and audio extractions in VidSnap.",
          btnLabel: "Explore Speech-to-Text",
        };
      case "faid":
        return {
          title: t.toolFaidTitle,
          description: t.toolFaidDesc,
          icon: <Sparkles className="w-5 h-5 text-amber-400" />,
          placeholder: "",
          btnLabel: "",
        };
      case "voice_clone":
        return {
          title: t.toolVoiceCloneTitle,
          description: t.toolVoiceCloneDesc,
          icon: <Volume2 className="w-5 h-5 text-emerald-400" />,
          placeholder: "",
          btnLabel: "",
        };
    }
  };

  const meta = getToolMetadata();

  const handleExecute = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (tool === "summary") {
        const res = await fetch("/api/ai/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: inputText, language }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to summarize");
        setResultText(data.summary);
      } else if (tool === "khaleeji") {
        const res = await fetch("/api/ai/khaleeji", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: inputText }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to adapt dialect");
        setResultText(data.result);
      }
    } catch (err: any) {
      setError(err.message || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (resultText) {
      navigator.clipboard.writeText(resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      id="ai-tool-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in"
    >
      <div
        id="ai-tool-modal-content"
        className="relative w-full max-w-2xl rounded-2xl bg-[#0B0920] border border-white/10 shadow-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-600/20 border border-violet-500/20">
              {meta.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">
                  {meta.title}
                </h3>
                {isComingSoon && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {t.comingSoon}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50">{meta.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isComingSoon ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600/20 to-pink-600/20 border border-white/10 flex items-center justify-center mx-auto text-violet-400">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-medium text-white">
                {meta.title} — {t.comingSoon}
              </h4>
              <p className="text-xs text-white/60 max-w-md mx-auto mt-2 leading-relaxed">
                This specialized neural workflow is currently undergoing safety calibration. It will soon be available alongside VidSnap’s core video and transcript pipelines.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-medium text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              Close
            </button>
          </div>
        ) : tool === "stt" ? (
          <div className="py-6 space-y-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-white/80 leading-relaxed">
              VidSnap integrates speech-to-text directly into your workflow:
              <ul className="list-disc list-inside mt-2 space-y-1 text-white/60">
                <li>Paste any public video link in the Home tab and select <strong>Transcript</strong>.</li>
                <li>Or open <strong>Upload File</strong> to transcribe your local MP4, MP3, WAV, or MOV recordings.</li>
                <li>Automatically transcribes spoken dialogue and translates it into your chosen target language.</li>
              </ul>
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 transition-all"
              >
                Go to Transcription
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs text-white/60 mb-1.5 font-medium">
                Input Content
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={meta.placeholder}
                rows={4}
                className="w-full rounded-xl bg-[#080716] border border-white/10 p-3 text-xs text-white placeholder-white/25 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/40">
                Powered by Gemini AI Engine
              </span>
              <button
                onClick={handleExecute}
                disabled={loading || !inputText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-600/20 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{meta.btnLabel}</span>
                  </>
                )}
              </button>
            </div>

            {resultText && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-violet-300">
                    Generated Result
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-[#080716] border border-white/10 text-xs text-white/90 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed font-sans">
                  {resultText}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
