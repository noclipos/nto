import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileAudio,
  FileVideo,
  FileText,
  Copy,
  FileDown,
  RotateCcw,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
} from "lucide-react";
import { TranslationDictionary } from "../i18n/translations";
import { TranscriptLanguage, ToastMessage, RecentDownloadItem } from "../types";

interface UploadViewProps {
  t: TranslationDictionary;
  onAddRecent: (item: Omit<RecentDownloadItem, "id" | "timestamp">) => void;
  onAddToast: (toast: Omit<ToastMessage, "id">) => void;
}

type StepState =
  | "idle"
  | "uploading"
  | "extracting"
  | "splitting"
  | "transcribing"
  | "translating"
  | "combining"
  | "completed"
  | "failed";

export const UploadView: React.FC<UploadViewProps> = ({
  t,
  onAddRecent,
  onAddToast,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState<TranscriptLanguage>("auto");
  const [stepState, setStepState] = useState<StepState>("idle");
  const [progressPercent, setProgressPercent] = useState(0);
  const [transcriptResult, setTranscriptResult] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);
    setTranscriptResult("");
    setStepState("idle");
    setProgressPercent(0);
  };

  const handleProcessUpload = async () => {
    if (!selectedFile) return;

    setStepState("uploading");
    setProgressPercent(15);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("language", targetLang);

    // Simulate animated step progression for accurate user feedback
    const progressTimer1 = setTimeout(() => {
      setStepState("extracting");
      setProgressPercent(35);
    }, 1200);

    const progressTimer2 = setTimeout(() => {
      setStepState("splitting");
      setProgressPercent(50);
    }, 2400);

    const progressTimer3 = setTimeout(() => {
      setStepState("transcribing");
      setProgressPercent(70);
    }, 3800);

    const progressTimer4 = setTimeout(() => {
      if (targetLang !== "auto") {
        setStepState("translating");
        setProgressPercent(85);
      }
    }, 6000);

    try {
      const res = await fetch("/api/video/upload-transcript", {
        method: "POST",
        body: formData,
      });

      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);
      clearTimeout(progressTimer4);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process media file");
      }

      setStepState("combining");
      setProgressPercent(95);

      setTimeout(() => {
        setStepState("completed");
        setProgressPercent(100);
        setTranscriptResult(data.text);

        onAddRecent({
          title: selectedFile.name,
          platform: "Local Upload",
          type: "transcript",
          quality: `${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB`,
          url: "local://" + selectedFile.name,
          status: "completed",
          language: targetLang,
        });

        onAddToast({
          title: "Transcription Complete",
          description: selectedFile.name,
          type: "success",
        });
      }, 600);
    } catch (err: any) {
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      clearTimeout(progressTimer3);
      clearTimeout(progressTimer4);

      setStepState("failed");
      setErrorMsg(err.message || "Failed to process media file");
      onAddToast({
        title: "Upload Failed",
        description: err.message || "Error during transcription",
        type: "error",
      });
    }
  };

  const handleCopy = () => {
    if (transcriptResult) {
      navigator.clipboard.writeText(transcriptResult);
      setCopied(true);
      onAddToast({
        title: t.copied,
        type: "success",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    if (!transcriptResult || !selectedFile) return;
    const element = document.createElement("a");
    const file = new Blob([transcriptResult], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedFile.name.replace(/\.[^/.]+$/, "")}_transcript.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getStepLabel = () => {
    switch (stepState) {
      case "uploading":
        return t.stepUploading;
      case "extracting":
        return t.stepExtracting;
      case "splitting":
        return t.stepSplitting;
      case "transcribing":
        return t.stepTranscribing;
      case "translating":
        return t.stepTranslating;
      case "combining":
        return t.stepCombining;
      case "completed":
        return t.stepCompleted;
      case "failed":
        return "Process Failed";
      default:
        return "";
    }
  };

  return (
    <div id="upload-view" className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in">
      {/* Title & Explanations */}
      <div className="text-center space-y-2 pt-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          {t.uploadMediaTitle}
        </h1>
        <p className="text-sm text-white/60 max-w-2xl mx-auto leading-relaxed">
          {t.uploadMediaSubtitle}
        </p>
      </div>

      {/* Target Language Bar */}
      <div className="p-4 rounded-2xl bg-[#0B0920]/90 border border-white/10 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <div>
            <span className="text-xs font-semibold text-white/90">
              {t.targetLanguage}
            </span>
            <p className="text-[10px] text-white/40">
              AI transcribes in the spoken tongue first, then translates into this target.
            </p>
          </div>
        </div>

        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value as TranscriptLanguage)}
          className="px-3 py-2 rounded-xl bg-[#080716] border border-white/20 text-xs font-medium text-white focus:outline-none focus:border-violet-500 transition-colors"
        >
          <option value="auto">Auto-detect / Original Language</option>
          <option value="en">English Output</option>
          <option value="ar">Arabic Output (العربية)</option>
          <option value="fr">French Output (Français)</option>
          <option value="es">Spanish Output (Español)</option>
          <option value="de">German Output (Deutsch)</option>
          <option value="zh">Chinese Output (中文)</option>
          <option value="ja">Japanese Output (日本語)</option>
        </select>
      </div>

      {/* Drag & Drop Zone */}
      <div
        id="drop-zone"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer ${
          dragActive
            ? "border-violet-500 bg-violet-600/10 scale-[1.01]"
            : "border-white/10 hover:border-violet-500/40 bg-[#0B0920]/60 hover:bg-[#0B0920]/80"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,audio/*,.mp4,.mp3,.wav,.mov,.avi,.m4a,.webm"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-center mx-auto text-violet-400">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">
              {selectedFile ? selectedFile.name : t.dragDropText}
            </h3>
            <p className="text-xs text-white/50 mt-1">
              {selectedFile
                ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to transcribe`
                : t.supportedFormatsList}
            </p>
          </div>

          <button
            type="button"
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-all inline-flex items-center gap-2"
          >
            {selectedFile ? "Choose Different File" : t.browseFiles}
          </button>
        </div>
      </div>

      {/* Action and Progress Card */}
      {selectedFile && (
        <div className="p-6 rounded-2xl bg-[#0B0920]/90 border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                {selectedFile.type.startsWith("video") ? (
                  <FileVideo className="w-6 h-6" />
                ) : (
                  <FileAudio className="w-6 h-6" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white truncate max-w-sm sm:max-w-md">
                  {selectedFile.name}
                </h4>
                <p className="text-xs text-white/40">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Output: {targetLang.toUpperCase()}
                </p>
              </div>
            </div>

            <button
              id="btn-start-upload-transcribe"
              onClick={handleProcessUpload}
              disabled={stepState !== "idle" && stepState !== "completed" && stepState !== "failed"}
              className="px-6 py-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 shadow-lg shadow-violet-600/30 transition-all cursor-pointer shrink-0 flex items-center gap-2"
            >
              {stepState !== "idle" && stepState !== "completed" && stepState !== "failed" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Transcription</span>
                </>
              )}
            </button>
          </div>

          {/* Progress Bar & Status */}
          {stepState !== "idle" && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-violet-300 flex items-center gap-2">
                  {stepState !== "completed" && stepState !== "failed" && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {getStepLabel()}
                </span>
                <span className="font-mono text-white/50">{progressPercent}%</span>
              </div>

              <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Transcript Results Viewer */}
      {transcriptResult && (
        <div className="p-6 rounded-2xl bg-[#0B0920]/90 border border-white/10 space-y-4 animate-in slide-in-from-bottom-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Check className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                Extracted & Translated Transcript
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/80 hover:text-white border border-white/10 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">{t.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.copyTranscript}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadTxt}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/80 hover:text-white border border-white/10 transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>{t.downloadTxt}</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#080716] border border-white/10 text-xs text-white/90 leading-relaxed font-sans whitespace-pre-wrap max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {transcriptResult}
          </div>
        </div>
      )}
    </div>
  );
};
