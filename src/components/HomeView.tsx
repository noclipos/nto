import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  Search,
  X,
  Play,
  Film,
  Music,
  FileText,
  Copy,
  FileDown,
  RotateCcw,
  Clock,
  Sparkles,
  AlertTriangle,
  Check,
  Loader2,
  ExternalLink,
  Zap,
  Clipboard,
  CheckCircle2,
  Layers,
  ArrowRight,
} from "lucide-react";
import {
  VideoInfo,
  ActionTab,
  TranscriptLanguage,
  RecentDownloadItem,
  ToastMessage,
  AppLanguage,
} from "../types";
import { TranslationDictionary } from "../i18n/translations";
import { detectPlatformFromUrl, PLATFORMS_CONFIG } from "../lib/platforms";
import { PlatformIcon } from "./PlatformIcon";

interface HomeViewProps {
  t: TranslationDictionary;
  language: AppLanguage;
  onAddRecent: (item: Omit<RecentDownloadItem, "id" | "timestamp">) => void;
  onAddToast: (toast: Omit<ToastMessage, "id">) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  t,
  language,
  onAddRecent,
  onAddToast,
}) => {
  const [url, setUrl] = useState("");
  const [detectedPlatform, setDetectedPlatform] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isPlayingEmbed, setIsPlayingEmbed] = useState(false);
  const [activeTab, setActiveTab] = useState<ActionTab>("download");
  const [error, setError] = useState<{
    message: string;
    platform?: string;
    code?: string;
  } | null>(null);

  const lastAnalyzedUrlRef = useRef<string>("");

  // Download states
  const [selectedQuality, setSelectedQuality] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadProgressMsg, setDownloadProgressMsg] = useState("");

  // Transcript states
  const [transcriptLang, setTranscriptLang] = useState<TranscriptLanguage>("auto");
  const [transcriptText, setTranscriptText] = useState<string>("");
  const [transcribing, setTranscribing] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [summarizing, setSummarizing] = useState(false);
  const [transcribePhase, setTranscribePhase] = useState<string>("");

  // Native clipboard paste handler
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const trimmed = text.trim();
        setUrl(trimmed);
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
          onAddToast({
            title: language === "ar" ? "تم لصق الرابط" : "Link Pasted",
            description: trimmed.slice(0, 45) + (trimmed.length > 45 ? "..." : ""),
            type: "info",
          });
          handleAnalyze(trimmed);
        }
      }
    } catch {
      // Browser permissions fallback
    }
  };

  // Detect platform as user types
  useEffect(() => {
    if (url.trim()) {
      const platform = detectPlatformFromUrl(url);
      setDetectedPlatform(platform);
    } else {
      setDetectedPlatform(null);
    }
  }, [url]);

  // Set default quality when videoInfo loads
  useEffect(() => {
    if (videoInfo && videoInfo.formats.length > 0) {
      setSelectedQuality(videoInfo.formats[0].id);
    }
  }, [videoInfo]);

  // Handle URL analysis
  const handleAnalyze = async (overrideUrl?: string) => {
    const targetUrl = typeof overrideUrl === "string" ? overrideUrl : url;
    const trimmed = targetUrl.trim();
    if (!trimmed) {
      setError({ message: t.invalidUrlError });
      return;
    }

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setError({ message: t.invalidUrlError });
      return;
    }

    lastAnalyzedUrlRef.current = trimmed;
    setAnalyzing(true);
    setError(null);
    setVideoInfo(null);
    setTranscriptText("");

    try {
      const res = await fetch("/api/video/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw {
          message: data.error || t.genericError,
          platform: data.platform,
          code: data.code,
        };
      }

      setVideoInfo(data);
      onAddToast({
        title: "Video Analyzed",
        description: data.title,
        type: "success",
      });
    } catch (err: any) {
      console.error("Analyze error:", err);
      setError({
        message: err.message || t.genericError,
        platform: err.platform,
        code: err.code,
      });
      onAddToast({
        title: "Analysis Failed",
        description: err.message || t.genericError,
        type: "error",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Auto-analyze URL when pasted or completed (instant find without delay)
  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return;
    if (trimmed.length < 15) return;
    if (trimmed === lastAnalyzedUrlRef.current) return;
    if (analyzing) return;

    const timer = setTimeout(() => {
      handleAnalyze(trimmed);
    }, 450);
    return () => clearTimeout(timer);
  }, [url, analyzing]);

  const handleLoadDemo = (autoRun = true) => {
    const demoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    setUrl(demoUrl);
    setError(null);
    if (autoRun) {
      handleAnalyze(demoUrl);
    }
  };

  // Generate direct link for instant browser downloading
  const getDirectDownloadUrl = (type: "video" | "video-only" | "audio") => {
    if (!videoInfo) return "#";
    const queryParams = new URLSearchParams({
      url: videoInfo.url,
      type,
      formatId: selectedQuality || "best",
      title: videoInfo.title || "video",
    });
    return `/api/video/download?${queryParams.toString()}`;
  };

  // Trigger video or audio download with accelerated feedback
  const handleDownload = async (type: "video" | "video-only" | "audio") => {
    if (!videoInfo) return;
    setDownloading(true);
    setDownloadProgress(10);
    setDownloadProgressMsg(
      language === "ar"
        ? "⚡ جاري الاتصال بالتدفق فائق السرعة..."
        : "⚡ Connecting to high-speed stream..."
    );

    // Fast simulated progress while server compiles media
    const progressInterval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev === null) return 15;
        if (prev < 65) return prev + Math.floor(Math.random() * 8) + 5;
        if (prev < 88) return prev + 2;
        return prev;
      });
    }, 200);

    try {
      onAddToast({
        title: language === "ar" ? "بدء المعالجة السريعة" : "Download Initiated",
        description:
          language === "ar"
            ? "يتم الآن تجميع الوسائط عبر محرك التحميل فائق السرعة..."
            : "Your file is being compiled and downloaded...",
        type: "info",
      });

      const queryParams = new URLSearchParams({
        url: videoInfo.url,
        type,
        formatId: selectedQuality || "best",
        title: videoInfo.title || "video",
      });

      const res = await fetch(`/api/video/download?${queryParams.toString()}`);
      clearInterval(progressInterval);

      if (!res.ok) {
        let errJson: any = null;
        try {
          errJson = await res.json();
        } catch {}

        throw new Error(
          errJson?.error ||
            (language === "ar"
              ? "فشل التحميل. يرجى التحقق من الرابط أو المحاولة لاحقاً."
              : "Download failed. Please check your network or try another video.")
        );
      }

      // Stream download chunks to track real transfer progress
      const total = Number(res.headers.get("Content-Length")) || 0;
      const reader = res.body?.getReader();
      let blob: Blob;

      if (reader) {
        const chunks: Uint8Array[] = [];
        let received = 0;
        setDownloadProgress(80);
        setDownloadProgressMsg(
          language === "ar" ? "⚡ استلام أجزاء الملف..." : "⚡ Receiving media chunks..."
        );

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.length;
            if (total > 0) {
              const pct = Math.min(99, Math.max(80, Math.round((received / total) * 100)));
              setDownloadProgress(pct);
            }
          }
        }
        setDownloadProgress(100);
        setDownloadProgressMsg(
          language === "ar" ? "✨ جاري حفظ الملف..." : "✨ Saving file..."
        );
        const contentType =
          res.headers.get("Content-Type") ||
          (type === "audio" ? "audio/mpeg" : "video/mp4");
        blob = new Blob(chunks, { type: contentType });
      } else {
        blob = await res.blob();
        setDownloadProgress(100);
      }

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const disposition = res.headers.get("Content-Disposition");
      let filename = `${videoInfo.title.replace(/[/\\?%*:|"<>]/g, "_") || "video"}.${type === "audio" ? "mp3" : "mp4"}`;
      if (disposition && disposition.includes("filename=")) {
        const matches = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
        if (matches && matches[1]) {
          try {
            filename = decodeURIComponent(matches[1]);
          } catch {
            filename = matches[1];
          }
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);

      onAddToast({
        title: language === "ar" ? "تم التحميل بنجاح" : "Download Completed",
        description: `${filename}`,
        type: "success",
      });

      // Record to recent activity
      const chosenFormat = videoInfo.formats.find((f) => f.id === selectedQuality);
      onAddRecent({
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
        platform: videoInfo.platform,
        type,
        quality: type === "audio" ? "MP3 320k" : chosenFormat?.quality || "HD",
        url: videoInfo.url,
        status: "completed",
      });
    } catch (err: any) {
      clearInterval(progressInterval);
      onAddToast({
        title: language === "ar" ? "تعذر التحميل" : "Download Failed",
        description: err.message || "Failed to trigger download",
        type: "error",
      });
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setDownloading(false);
        setDownloadProgress(null);
        setDownloadProgressMsg("");
      }, 350);
    }
  };

  // Handle Transcript generation with ultra-speed pipeline
  const handleGenerateTranscript = async () => {
    if (!videoInfo) return;
    setTranscribing(true);
    setTranscriptText("");
    setAiSummary("");
    setTranscribePhase(language === "ar" ? "فحص الترجمة الفورية والمسار الصوتي السريع..." : "Checking instant captions & fast speech stream...");

    try {
      onAddToast({
        title: language === "ar" ? "بدء الاستخراج فائق السرعة" : "Ultra-Fast Extraction Started",
        description: language === "ar" ? "جارٍ استخراج وتفريغ الصوت بنظام Turbo AI..." : "Extracting and transcribing speech with Turbo AI...",
        type: "info",
      });

      // Quick visual phase update
      setTimeout(() => {
        setTranscribePhase(language === "ar" ? "معالجة عصبية مباشرة بالذكاء الاصطناعي..." : "Processing neural AI transcription...");
      }, 700);

      const res = await fetch("/api/video/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: videoInfo.url,
          language: transcriptLang,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to extract transcript");
      }

      setTranscriptText(data.text);
      onAddRecent({
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
        platform: videoInfo.platform,
        type: "transcript",
        quality: `Turbo AI (${transcriptLang.toUpperCase()})`,
        url: videoInfo.url,
        status: "completed",
        language: transcriptLang,
      });

      onAddToast({
        title: language === "ar" ? "اكتمل الاستخراج بسرعة فائقة" : "Turbo Extraction Completed",
        description: language === "ar" ? "تم استخراج وترجمة النص بالذكاء الاصطناعي بنجاح." : "AI speech recognition & translation completed successfully.",
        type: "success",
      });
    } catch (err: any) {
      onAddToast({
        title: language === "ar" ? "تعذر الاستخراج" : "Transcription Notice",
        description: err.message || "Could not transcribe audio",
        type: "error",
      });
    } finally {
      setTranscribing(false);
      setTranscribePhase("");
    }
  };

  const handleCopyTranscript = () => {
    if (transcriptText) {
      navigator.clipboard.writeText(transcriptText);
      setCopiedTranscript(true);
      onAddToast({
        title: t.copied,
        type: "success",
      });
      setTimeout(() => setCopiedTranscript(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    if (!transcriptText || !videoInfo) return;
    const element = document.createElement("a");
    const file = new Blob([transcriptText], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${videoInfo.title.slice(0, 50)}_transcript.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadSrt = () => {
    if (!transcriptText || !videoInfo) return;
    const lines = transcriptText.split(/\n+/).filter(Boolean);
    let srtContent = "";
    let currentTime = 0;
    const intervalSec = 4;

    lines.forEach((line, index) => {
      const startSec = currentTime;
      const endSec = currentTime + intervalSec;
      currentTime = endSec;

      const formatTime = (totalSec: number) => {
        const hrs = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = Math.floor(totalSec % 60);
        return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")},000`;
      };

      srtContent += `${index + 1}\n${formatTime(startSec)} --> ${formatTime(endSec)}\n${line.trim()}\n\n`;
    });

    const element = document.createElement("a");
    const file = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${videoInfo.title.slice(0, 50)}_subtitles.srt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleInstantSummarize = async () => {
    if (!transcriptText) return;
    setSummarizing(true);
    try {
      const targetLang = transcriptLang === "auto" ? (language === "ar" ? "ar" : "en") : transcriptLang;
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: transcriptText,
          language: targetLang,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate summary");
      setAiSummary(data.summary);
      onAddToast({
        title: language === "ar" ? "تم التلخيص الفوري بنجاح" : "Instant Summary Ready",
        type: "success",
      });
    } catch (err: any) {
      onAddToast({
        title: language === "ar" ? "فشل التلخيص" : "Summary Notice",
        description: err.message,
        type: "error",
      });
    } finally {
      setSummarizing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return null;
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div id="home-view" className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in">
      {/* Hero Headline Section */}
      <div className="text-center pt-6 pb-2 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-600/15 border border-violet-500/30 text-xs font-bold text-violet-300 shadow-sm shadow-violet-600/20">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>{language === "ar" ? "محرك الوسائط الشامل • الإصدار الفائق 2.5" : "VidSnap Ultimate Media Suite v2.5"}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
          {t.heroHeadline}
        </h1>

        <p className="text-sm sm:text-base text-white/65 max-w-2xl mx-auto leading-relaxed">
          {t.heroSubtitle}
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {[
            t.supportedPlatformsCount,
            t.featuresUpTo4K,
            t.noWatermarks,
            t.aiTranscription,
            t.noSignUp,
          ].map((pill, idx) => (
            <span
              key={idx}
              className="px-3.5 py-1 rounded-full text-xs font-semibold bg-white/[0.03] border border-white/[0.08] text-white/75 backdrop-blur-md shadow-2xs hover:border-violet-500/30 transition-colors"
            >
              {pill}
            </span>
          ))}
        </div>
      </div>

      {/* Main URL Input Card with Glassmorphism */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/40 via-purple-600/30 to-indigo-600/40 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition duration-700 pointer-events-none" />

        <div className="relative rounded-2xl sm:rounded-3xl bg-[#0D0B22]/95 border border-white/[0.12] p-3 sm:p-4 backdrop-blur-2xl shadow-2xl">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Input Wrapper */}
            <div className="relative flex-1 flex items-center">
              <div className="absolute start-4 text-white/40 flex items-center gap-2 pointer-events-none z-10">
                {detectedPlatform ? (
                  <PlatformIcon platform={detectedPlatform.id} className="w-5 h-5" />
                ) : (
                  <Search className="w-5 h-5 text-white/40" />
                )}
              </div>

              <input
                id="video-url-input"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData?.getData("text")?.trim();
                  if (pasted && (pasted.startsWith("http://") || pasted.startsWith("https://"))) {
                    e.preventDefault();
                    setUrl(pasted);
                    setError(null);
                    handleAnalyze(pasted);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAnalyze();
                }}
                placeholder={t.urlPlaceholder}
                className="w-full h-14 ps-12 pe-28 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] focus:bg-[#070614] border border-white/10 focus:border-violet-500/70 text-white placeholder-white/35 text-sm focus:outline-none transition-all shadow-inner"
              />

              {/* Detected Platform Badge inside input */}
              {detectedPlatform && (
                <div className="absolute end-12 flex items-center">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-violet-600/25 text-violet-300 border border-violet-500/40 shadow-xs">
                    {detectedPlatform.name}
                  </span>
                </div>
              )}

              {/* Paste button when empty / Clear button when filled */}
              {url ? (
                <button
                  onClick={() => {
                    setUrl("");
                    setDetectedPlatform(null);
                    setVideoInfo(null);
                    setError(null);
                  }}
                  className="absolute end-3.5 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title={t.clear}
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handlePasteClipboard}
                  type="button"
                  className="absolute end-3 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-violet-600/20 text-white/60 hover:text-violet-300 border border-white/10 hover:border-violet-500/30 text-[11px] font-semibold transition-all cursor-pointer"
                  title="Paste from clipboard"
                >
                  <Clipboard className="w-3.5 h-3.5 text-violet-400" />
                  <span className="hidden xs:inline">{language === "ar" ? "لصق" : "Paste"}</span>
                </button>
              )}
            </div>

            {/* Analyze Button */}
            <button
              id="btn-analyze-video"
              onClick={() => handleAnalyze()}
              disabled={analyzing || !url.trim()}
              className="h-14 px-8 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-violet-600/35 hover:shadow-violet-600/55 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-200 shrink-0 cursor-pointer"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>{t.analyzing}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t.analyze}</span>
                </>
              )}
            </button>
          </div>

          {/* Instant Turbo-Scan Visual Indicator */}
          {analyzing && (
            <div className="mt-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-indigo-600/20 border border-violet-500/40 flex items-center justify-between text-violet-200 text-xs shadow-lg shadow-violet-950/40 animate-pulse">
              <div className="flex items-center gap-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-amber-300 shrink-0" />
                <span className="font-semibold">
                  {language === "ar"
                    ? "⚡ جارٍ العثور على الفيديو واستخراج روابط الجودات بأقصى سرعة..."
                    : "⚡ Locating video and extracting streaming formats at maximum speed..."}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-full shrink-0">
                Turbo Speed ⚡
              </span>
            </div>
          )}

          {/* Quick Platform Badges Row */}
          <div className="flex items-center gap-2 mt-3.5 px-1 overflow-x-auto scrollbar-none text-xs text-white/50">
            <span className="text-[11px] font-semibold text-white/40 shrink-0">
              {language === "ar" ? "المنصات:" : "Supported:"}
            </span>
            <button
              onClick={() => handleLoadDemo(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all shrink-0 text-[11px] font-bold shadow-xs cursor-pointer"
              title="Test with 100% verified working demo video"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>★ {language === "ar" ? "فيديو تجريبي مؤكد" : "Verified Demo"}</span>
            </button>
            {Object.values(PLATFORMS_CONFIG).map((p) => (
              <button
                key={p.id}
                onClick={() => setUrl(p.sampleUrl)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/[0.06] hover:border-white/15 transition-all shrink-0 text-[11px] font-medium cursor-pointer"
                title={`Try sample ${p.name} format`}
              >
                <PlatformIcon platform={p.id} className="w-3.5 h-3.5" />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Specific Error Alert */}
      {error && (
        <div
          id="error-alert"
          className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-sm space-y-3 backdrop-blur-xl animate-in fade-in shadow-xl"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-rose-200 text-sm">
                {language === "ar" ? "تنبيه استخراج الرابط" : "Extraction Notice"}
              </h4>
              <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">
                {error.message}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-rose-500/20">
            <button
              onClick={() => handleLoadDemo(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] text-white/90 hover:text-white border border-white/15 transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === "ar" ? "جرّب الفيديو التجريبي المؤكد (Rick Astley 4K)" : "Try Verified Demo (Rick Astley 4K)"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Skeleton Loader while analyzing */}
      {analyzing && (
        <div className="p-6 rounded-3xl bg-[#0D0B22]/90 border border-white/10 space-y-6 animate-pulse backdrop-blur-2xl shadow-2xl">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-72 aspect-video rounded-2xl bg-white/5 border border-white/5" />
            <div className="flex-1 space-y-3 py-2">
              <div className="h-6 w-3/4 bg-white/10 rounded-xl" />
              <div className="h-4 w-1/3 bg-white/5 rounded-lg" />
              <div className="h-12 w-full bg-white/5 rounded-xl mt-4" />
            </div>
          </div>
        </div>
      )}

      {/* Video Preview & Action Modes Card */}
      {videoInfo && !analyzing && (
        <div
          id="video-result-card"
          className="rounded-2xl sm:rounded-3xl bg-[#0D0B22]/95 border border-white/[0.12] overflow-hidden backdrop-blur-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        >
          {/* Top Video Header */}
          <div className="p-4 sm:p-6 border-b border-white/[0.08] flex flex-col md:flex-row gap-5 items-start">
            {/* Thumbnail or Interactive Embed Player */}
            <div className="relative w-full md:w-80 aspect-video rounded-2xl overflow-hidden bg-black/60 border border-white/10 shrink-0 group shadow-lg">
              {isPlayingEmbed && videoInfo.embedUrl ? (
                <div className="relative w-full h-full">
                  <iframe
                    src={`${videoInfo.embedUrl}?autoplay=1`}
                    title={videoInfo.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                  <button
                    onClick={() => setIsPlayingEmbed(false)}
                    className="absolute top-2.5 end-2.5 p-1.5 rounded-xl bg-black/80 hover:bg-black text-white text-xs z-10 border border-white/20 transition-colors cursor-pointer"
                    title="Close preview player"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  {videoInfo.thumbnail ? (
                    <img
                      src={videoInfo.thumbnail}
                      alt={videoInfo.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30">
                      <Film className="w-10 h-10" />
                    </div>
                  )}

                  {videoInfo.embedUrl && (
                    <button
                      onClick={() => setIsPlayingEmbed(true)}
                      className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-violet-600/90 hover:bg-violet-500 text-white flex items-center justify-center shadow-xl shadow-violet-900/60 backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/20"
                      title="Play Preview Video"
                    >
                      <Play className="w-6 h-6 fill-white ms-0.5" />
                    </button>
                  )}

                  {videoInfo.duration > 0 && (
                    <div className="absolute bottom-2.5 end-2.5 px-2.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[11px] font-mono text-white flex items-center gap-1.5 border border-white/10">
                      <Clock className="w-3 h-3 text-white/70" />
                      <span>{formatDuration(videoInfo.duration)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Video Meta info */}
            <div className="flex-1 min-w-0 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-600/20 text-violet-300 border border-violet-500/35 shadow-xs">
                  <PlatformIcon platform={videoInfo.platform} className="w-3.5 h-3.5" />
                  <span className="capitalize">{videoInfo.platform.replace("_", " ")}</span>
                </span>
                {videoInfo.uploader && (
                  <span className="text-xs text-white/55 font-medium truncate">
                    {language === "ar" ? "بواسطة" : "by"} {videoInfo.uploader}
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white leading-snug line-clamp-2">
                {videoInfo.title}
              </h2>

              {videoInfo.description && (
                <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                  {videoInfo.description}
                </p>
              )}

              <div className="pt-2 flex items-center gap-3 text-xs text-white/45">
                <span className="inline-flex items-center gap-1 text-emerald-400/90 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  {language === "ar" ? "تم فحص البث المباشر بنجاح" : "Direct stream analysis verified"}
                </span>
                <span>•</span>
                <a
                  href={videoInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-violet-400 flex items-center gap-1 transition-colors"
                >
                  <span>{language === "ar" ? "فتح المصدر الأصلي" : "Open original"}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Action Tabs Bar */}
          <div className="px-4 sm:px-6 pt-3 pb-3 border-b border-white/[0.08] flex gap-2 overflow-x-auto scrollbar-none bg-black/20">
            {[
              { id: "download", label: t.tabDownloadVideo, icon: <Film className="w-4 h-4" /> },
              { id: "video-only", label: t.tabVideoOnly, icon: <Play className="w-4 h-4" /> },
              { id: "audio", label: t.tabExtractAudio, icon: <Music className="w-4 h-4" /> },
              { id: "transcript", label: t.tabTranscript, icon: <FileText className="w-4 h-4" /> },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as ActionTab)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/35 border border-violet-400/30"
                      : "text-white/65 hover:text-white hover:bg-white/[0.06] border border-transparent"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panel */}
          <div className="p-4 sm:p-6">
            {/* Mode 1: Download Video */}
            {activeTab === "download" && (
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-white/80 uppercase tracking-wider">
                      {t.selectQuality}
                    </label>
                    <span className="text-[11px] text-white/40 font-medium">
                      {videoInfo.formats.length} {language === "ar" ? "جودات متوفرة" : "qualities available"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {videoInfo.formats.map((fmt) => {
                      const isSelected = selectedQuality === fmt.id;
                      const size = formatFileSize(fmt.filesize);
                      return (
                        <button
                          key={fmt.id}
                          onClick={() => setSelectedQuality(fmt.id)}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                            isSelected
                              ? "bg-violet-600/25 border-violet-500/80 text-white shadow-lg shadow-violet-600/20 ring-1 ring-violet-500/50"
                              : "bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/20 text-white/85"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                isSelected ? "border-violet-400 bg-violet-500" : "border-white/30"
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white tracking-wide">{fmt.label}</div>
                              <div className="text-[10px] text-white/45 uppercase font-medium mt-0.5">
                                {fmt.ext} {fmt.needsMerge ? "• Audio Merged" : ""}
                              </div>
                            </div>
                          </div>
                          {size && (
                            <span className="text-xs font-mono font-medium text-white/60 bg-white/5 px-2 py-0.5 rounded-md">
                              {size}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic High-Speed Progress Bar */}
                {downloading && (
                  <div className="p-4 rounded-2xl bg-violet-950/50 border border-violet-500/40 space-y-2.5 animate-in fade-in duration-200 shadow-xl">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-violet-200 font-bold">
                        <Zap className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                        <span>{downloadProgressMsg || t.downloading}</span>
                      </span>
                      <span className="font-mono font-bold text-violet-300">
                        {downloadProgress !== null ? `${downloadProgress}%` : "⚡"}
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden relative p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 via-purple-400 to-emerald-400 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${downloadProgress !== null ? downloadProgress : 70}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      {language === "ar" ? "تسريع فائق 10x" : language === "fr" ? "Ultra Rapide 10x" : "10x Turbo Speed"}
                    </span>
                    <span className="hidden sm:inline text-[11px] text-white/50">
                      {language === "ar" ? "تجميع فوري وتدفق عالي السرعة" : "Highest bitrate stream with instant remuxing."}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Direct Browser Download Link (Zero wait, native browser engine) */}
                    <a
                      id="btn-direct-download"
                      href={getDirectDownloadUrl("video")}
                      download
                      onClick={() => {
                        onAddToast({
                          title: language === "ar" ? "بدء التحميل المباشر" : "Direct Download Started",
                          description:
                            language === "ar"
                              ? "يتولى المتصفح الآن تحميل الملف مباشرة بأقصى سرعة"
                              : "Your browser is downloading the media file directly.",
                          type: "success",
                        });
                      }}
                      className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 transition-all cursor-pointer shadow-sm"
                      title={language === "ar" ? "تحميل فوري عبر المتصفح بدون انتظار" : "Instant direct browser download"}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>{language === "ar" ? "تحميل فوري للمتصفح" : language === "fr" ? "Téléchargement Direct" : "Direct Browser Save"}</span>
                    </a>

                    <button
                      id="btn-trigger-download"
                      onClick={() => handleDownload("video")}
                      disabled={downloading}
                      className="flex items-center gap-2 px-7 py-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 shadow-lg shadow-violet-600/35 hover:shadow-violet-600/50 transition-all cursor-pointer active:scale-95"
                    >
                      {downloading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                          <span>{downloadProgress !== null ? `${downloadProgress}%` : downloadProgressMsg || t.downloading}</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>{t.download}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Video Only */}
            {activeTab === "video-only" && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3.5 text-xs text-amber-300 backdrop-blur-md">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="leading-relaxed pt-0.5">{t.videoOnlyWarning}</div>
                </div>

                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-white/80 uppercase tracking-wider">
                    {t.selectQuality}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {videoInfo.formats.map((fmt) => {
                      const isSelected = selectedQuality === fmt.id;
                      return (
                        <button
                          key={fmt.id}
                          onClick={() => setSelectedQuality(fmt.id)}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                            isSelected
                              ? "bg-violet-600/25 border-violet-500 text-white shadow-lg shadow-violet-600/20 ring-1 ring-violet-500/50"
                              : "bg-white/[0.03] border-white/10 hover:bg-white/[0.07] text-white/80"
                          }`}
                        >
                          <div className="text-xs font-bold text-white tracking-wide">{fmt.label}</div>
                          <span className="text-[10px] text-white/45 font-mono px-2 py-0.5 rounded-md bg-white/5">Silent MP4</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Progress bar for video-only */}
                {downloading && (
                  <div className="p-4 rounded-2xl bg-violet-950/50 border border-violet-500/40 space-y-2.5 animate-in fade-in duration-200 shadow-xl">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-violet-200 font-bold">
                        <Zap className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                        <span>{downloadProgressMsg || t.preparingDownload}</span>
                      </span>
                      <span className="font-mono font-bold text-violet-300">
                        {downloadProgress !== null ? `${downloadProgress}%` : "⚡"}
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden relative p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 via-purple-400 to-emerald-400 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${downloadProgress !== null ? downloadProgress : 70}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                  <a
                    href={getDirectDownloadUrl("video-only")}
                    download
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 transition-all cursor-pointer shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === "ar" ? "تحميل فوري للمتصفح" : "Direct Browser Save"}</span>
                  </a>
                  <button
                    onClick={() => handleDownload("video-only")}
                    disabled={downloading}
                    className="flex items-center gap-2 px-7 py-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 shadow-lg shadow-violet-600/35 transition-all cursor-pointer active:scale-95"
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                        <span>{downloadProgress !== null ? `${downloadProgress}%` : t.preparingDownload}</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>{language === "ar" ? "تحميل الفيديو بدون صوت" : "Download Video Only"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Mode 3: Extract Audio */}
            {activeTab === "audio" && (
              <div className="space-y-6">
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-xl">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-pink-500/25 to-purple-600/25 text-pink-400 border border-pink-500/35 shadow-md shadow-pink-500/20">
                      <Music className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{t.audioFormatMp3}</span>
                        <div className="flex items-center gap-0.5 h-3">
                          <span className="w-1 h-3 bg-pink-400 rounded-full animate-pulse" />
                          <span className="w-1 h-2 bg-pink-400/80 rounded-full animate-pulse delay-75" />
                          <span className="w-1 h-4 bg-pink-400 rounded-full animate-pulse delay-150" />
                        </div>
                      </h4>
                      <p className="text-xs text-white/55 mt-0.5">{t.audioBitrate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      {language === "ar" ? "تحويل فوري" : "Fast MP3"}
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-pink-500/15 text-pink-300 border border-pink-500/30 text-xs font-bold">
                      Full 320kbps
                    </span>
                  </div>
                </div>

                {/* Progress bar for audio */}
                {downloading && (
                  <div className="p-4 rounded-2xl bg-pink-950/50 border border-pink-500/40 space-y-2.5 animate-in fade-in duration-200 shadow-xl">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-pink-200 font-bold">
                        <Zap className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                        <span>{downloadProgressMsg || t.extractingAudio}</span>
                      </span>
                      <span className="font-mono font-bold text-pink-300">
                        {downloadProgress !== null ? `${downloadProgress}%` : "⚡"}
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden relative p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${downloadProgress !== null ? downloadProgress : 70}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                  <a
                    id="btn-direct-audio"
                    href={getDirectDownloadUrl("audio")}
                    download
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 transition-all cursor-pointer shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === "ar" ? "تحميل صوتي فوري" : "Direct Audio Save"}</span>
                  </a>
                  <button
                    id="btn-extract-audio"
                    onClick={() => handleDownload("audio")}
                    disabled={downloading}
                    className="flex items-center gap-2 px-7 py-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 disabled:opacity-50 shadow-lg shadow-pink-600/35 transition-all cursor-pointer active:scale-95"
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                        <span>{downloadProgress !== null ? `${downloadProgress}%` : t.extractingAudio}</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>{t.downloadAudio}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Mode 4: Transcript */}
            {activeTab === "transcript" && (
              <div className="space-y-6">
                {/* Turbo AI Speed Indicator Banner */}
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-indigo-500/10 border border-amber-500/20 text-xs">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{t.turboAiTitle}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30">
                        Active
                      </span>
                    </div>
                    <div className="text-[11px] text-white/60 truncate">
                      {t.turboAiDesc}
                    </div>
                  </div>
                </div>

                {/* Language Selector */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
                  <div>
                    <label className="text-xs font-bold text-white block">
                      {t.targetLanguage}
                    </label>
                    <span className="text-[11px] text-white/50 leading-relaxed block mt-0.5">
                      {language === "ar"
                        ? "يتم التعرف على الحوار المنطوق واستخراجه وترجمته في خطوة عصبية فائقة السرعة."
                        : "Speech is extracted, transcribed, and translated in a single-pass ultra-fast neural pipeline."}
                    </span>
                  </div>

                  <select
                    value={transcriptLang}
                    onChange={(e) => setTranscriptLang(e.target.value as TranscriptLanguage)}
                    className="px-4 py-2.5 rounded-xl bg-[#080716] border border-white/20 text-xs font-semibold text-white focus:outline-none focus:border-violet-500 transition-colors shadow-inner shrink-0 cursor-pointer"
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

                {!transcriptText && (
                  <div className="flex flex-col items-center justify-center py-6 gap-3">
                    <button
                      id="btn-extract-transcript"
                      onClick={handleGenerateTranscript}
                      disabled={transcribing}
                      className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 shadow-lg shadow-violet-600/35 transition-all cursor-pointer active:scale-95"
                    >
                      {transcribing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                          <span>{t.transcribing}</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-amber-300" />
                          <span>{t.transcribe}</span>
                        </>
                      )}
                    </button>
                    {transcribePhase && (
                      <p className="text-[11px] text-amber-300/80 animate-pulse font-medium">
                        {transcribePhase}
                      </p>
                    )}
                  </div>
                )}

                {/* Transcript Output Viewer */}
                {transcriptText && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                        <Check className="w-4 h-4" />
                        <span>{language === "ar" ? "جاهزية النص المفرّغ بسرعة فائقة" : "Turbo Transcription Ready"}</span>
                      </div>
                      <div className="flex items-center flex-wrap gap-2">
                        <button
                          onClick={handleInstantSummarize}
                          disabled={summarizing}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-xs font-semibold text-amber-300 hover:text-white border border-amber-500/30 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {summarizing ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                              <span>...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>{t.fastAiSummarize}</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={handleCopyTranscript}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white/80 hover:text-white border border-white/10 transition-colors cursor-pointer"
                        >
                          {copiedTranscript ? (
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
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white/80 hover:text-white border border-white/10 transition-colors cursor-pointer"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>{t.downloadTxt}</span>
                        </button>

                        <button
                          onClick={handleDownloadSrt}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white/80 hover:text-white border border-white/10 transition-colors cursor-pointer"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>{t.downloadSrt}</span>
                        </button>

                        <button
                          onClick={() => {
                            setTranscriptText("");
                            setAiSummary("");
                          }}
                          className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs text-white/50 hover:text-white border border-white/10 transition-colors cursor-pointer"
                          title={t.clearResult}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Instant AI Summary Card (if generated) */}
                    {aiSummary && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-transparent border border-amber-500/20 text-xs text-white/90 space-y-2">
                        <div className="flex items-center justify-between font-bold text-amber-300">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            {language === "ar" ? "الملخص السريع بالذكاء الاصطناعي" : "Instant AI Summary"}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(aiSummary);
                              onAddToast({ title: t.copied, type: "success" });
                            }}
                            className="text-[11px] text-white/60 hover:text-white cursor-pointer"
                          >
                            {t.copyTranscript}
                          </button>
                        </div>
                        <div className="leading-relaxed whitespace-pre-wrap text-white/80">
                          {aiSummary}
                        </div>
                      </div>
                    )}

                    <div className="p-5 rounded-2xl bg-[#070614] border border-white/10 text-xs text-white/90 font-sans leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 shadow-inner">
                      {transcriptText}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
