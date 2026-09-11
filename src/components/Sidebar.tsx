import React from "react";
import {
  Home,
  Upload,
  HelpCircle,
  Layers,
  Mail,
  Sparkles,
  MessageSquare,
  Mic,
  Volume2,
  FileText,
  Clock,
  Trash2,
  Globe,
  Film,
  Music,
  FileCode,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { AppLanguage, AppRoute, RecentDownloadItem } from "../types";
import { TranslationDictionary } from "../i18n/translations";
import { AiToolType } from "./AiToolsModal";

interface SidebarProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  t: TranslationDictionary;
  recentDownloads: RecentDownloadItem[];
  onRemoveRecent: (id: string) => void;
  onClearRecent: () => void;
  onOpenAiTool: (tool: AiToolType) => void;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onRouteChange,
  language,
  onLanguageChange,
  t,
  recentDownloads,
  onRemoveRecent,
  onClearRecent,
  onOpenAiTool,
  isOpenOnMobile = false,
  onCloseMobile,
}) => {
  const navItems: { route: AppRoute; label: string; icon: React.ReactNode }[] = [
    { route: "home", label: t.home, icon: <Home className="w-4 h-4" /> },
    { route: "upload", label: t.uploadFile, icon: <Upload className="w-4 h-4" /> },
    { route: "how-it-works", label: t.howItWorks, icon: <HelpCircle className="w-4 h-4" /> },
    { route: "platforms", label: t.platforms, icon: <Layers className="w-4 h-4" /> },
    { route: "contact", label: t.contact, icon: <Mail className="w-4 h-4" /> },
  ];

  const aiToolsList: {
    type: AiToolType;
    title: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      type: "khaleeji",
      title: t.toolKhaleejiTitle,
      desc: t.toolKhaleejiDesc,
      icon: <MessageSquare className="w-3.5 h-3.5" />,
      color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    },
    {
      type: "faid",
      title: t.toolFaidTitle,
      desc: t.toolFaidDesc,
      icon: <Sparkles className="w-3.5 h-3.5" />,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      type: "stt",
      title: t.toolSttTitle,
      desc: t.toolSttDesc,
      icon: <Mic className="w-3.5 h-3.5" />,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      type: "voice_clone",
      title: t.toolVoiceCloneTitle,
      desc: t.toolVoiceCloneDesc,
      icon: <Volume2 className="w-3.5 h-3.5" />,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      type: "summary",
      title: t.toolSummaryTitle,
      desc: t.toolSummaryDesc,
      icon: <FileText className="w-3.5 h-3.5" />,
      color: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    },
  ];

  const getFormatIcon = (type: string) => {
    switch (type) {
      case "audio":
        return <Music className="w-3 h-3 text-pink-400" />;
      case "transcript":
        return <FileCode className="w-3 h-3 text-emerald-400" />;
      default:
        return <Film className="w-3 h-3 text-violet-400" />;
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenOnMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 z-50 w-[240px] bg-[#09081B]/95 border-r border-white/[0.08] backdrop-blur-xl flex flex-col transition-transform duration-300 ${
          language === "ar"
            ? "right-0 border-r-0 border-l border-white/[0.08]"
            : "left-0"
        } ${
          isOpenOnMobile
            ? "translate-x-0"
            : language === "ar"
            ? "translate-x-full lg:translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo & Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/[0.08] bg-[#0B0920]/60">
          <button
            onClick={() => {
              onRouteChange("home");
              onCloseMobile?.();
            }}
            className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
          >
            {/* Purple Gradient Square Logo */}
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-0.5 shadow-lg shadow-violet-600/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-[10px] bg-[#0B0920]/40 flex items-center justify-center">
                  <span className="font-black text-sm tracking-tighter text-white">
                    VS
                  </span>
                </div>
              </div>
              <div className="absolute -inset-1 bg-violet-600/20 rounded-xl blur-sm -z-10 group-hover:bg-violet-600/40 transition-colors" />
            </div>
            <div>
              <span className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                VidSnap
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  v2.5 Pro
                </span>
              </span>
              <p className="text-[10px] text-white/50 leading-tight">
                {t.tagline}
              </p>
            </div>
          </button>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 lg:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Nav Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          {/* Main Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  id={`nav-${item.route}`}
                  onClick={() => {
                    onRouteChange(item.route);
                    onCloseMobile?.();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-violet-600/25 to-indigo-600/20 text-violet-200 border border-violet-500/40 shadow-sm shadow-violet-600/20"
                      : "text-white/65 hover:text-white hover:bg-white/[0.05] border border-transparent"
                  }`}
                >
                  <span className={isActive ? "text-violet-400" : "text-white/45"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 shadow-sm shadow-violet-400" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* AI Tools Section */}
          <div className="space-y-2 pt-1 border-t border-white/[0.06]">
            <div className="px-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span>{t.aiTools}</span>
              </span>
            </div>

            <div className="space-y-1.5">
              {aiToolsList.map((tool) => (
                <button
                  key={tool.type}
                  id={`tool-${tool.type}`}
                  onClick={() => {
                    onOpenAiTool(tool.type);
                    onCloseMobile?.();
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] hover:border-violet-500/30 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg border text-xs shrink-0 ${tool.color} transition-transform group-hover:scale-110 shadow-xs`}
                    >
                      {tool.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-white/90 group-hover:text-white truncate">
                          {tool.title}
                        </span>
                        {tool.type === "faid" || tool.type === "voice_clone" ? (
                          <span className="text-[8px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded-md shrink-0">
                            Beta
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[10px] text-white/45 truncate leading-tight mt-0.5">
                        {tool.desc}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="space-y-2 pt-1 border-t border-white/[0.06]">
            <div className="px-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/40">
                <Clock className="w-3 h-3" />
                <span>{t.recentDownloads}</span>
              </div>
              {recentDownloads.length > 0 && (
                <button
                  onClick={onClearRecent}
                  className="text-[10px] text-white/40 hover:text-rose-400 transition-colors cursor-pointer"
                  title={t.clearHistory}
                >
                  {t.clearHistory}
                </button>
              )}
            </div>

            {recentDownloads.length === 0 ? (
              <div className="p-3.5 text-center rounded-xl bg-white/[0.015] border border-white/[0.04]">
                <p className="text-[11px] text-white/40">{t.noDownloadsYet}</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-0.5">
                {recentDownloads.map((item) => (
                  <div
                    key={item.id}
                    className="group relative flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-white/10 transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {getFormatIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-white/90 truncate leading-tight">
                        {item.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-white/45 mt-0.5">
                        <span className="capitalize">{item.platform}</span>
                        <span>•</span>
                        <span className="uppercase font-mono">{item.quality || item.type}</span>
                        <span>•</span>
                        {item.status === "completed" ? (
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveRecent(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-rose-400 transition-all cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer with Language Switcher */}
        <div className="p-3 border-t border-white/[0.08] bg-[#070614]/90 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-violet-400" />
              <span>{t.language}</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            {(
              [
                { code: "en", label: "EN" },
                { code: "ar", label: "العربية" },
                { code: "fr", label: "FR" },
              ] as const
            ).map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  id={`lang-${lang.code}`}
                  onClick={() => onLanguageChange(lang.code)}
                  className={`py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
};
