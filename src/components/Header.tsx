import React from "react";
import { Menu, Sparkles, Upload, Zap } from "lucide-react";
import { AppLanguage, AppRoute } from "../types";
import { TranslationDictionary } from "../i18n/translations";

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onRouteChange: (route: AppRoute) => void;
  language: AppLanguage;
  t: TranslationDictionary;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onRouteChange,
  language,
  t,
}) => {
  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 h-16 w-full bg-[#080716]/85 backdrop-blur-xl border-b border-white/[0.07] px-4 lg:px-8 flex items-center justify-between transition-all"
    >
      {/* Mobile hamburger & brand */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
          onClick={() => onRouteChange("home")}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-violet-600/30 group-hover:scale-105 transition-transform">
            VS
          </div>
          <span className="text-sm font-extrabold text-white tracking-tight">
            VidSnap
          </span>
        </button>
      </div>

      {/* Desktop live status pill */}
      <div className="hidden lg:flex items-center gap-3 text-xs">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>{language === "ar" ? "محرك المعالجة السريع: نشط وجاهز" : "Turbo Stream Engine: Active"}</span>
        </div>
        <span className="text-white/20">•</span>
        <div className="flex items-center gap-1.5 text-white/50">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{language === "ar" ? "جاهز لـ 4K و MP3 والتفريغ الذكي" : "Ready for 4K, 320k MP3 & AI Transcripts"}</span>
        </div>
      </div>

      {/* Action shortcuts */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => onRouteChange("upload")}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600/20 to-indigo-600/20 hover:from-violet-600/30 hover:to-indigo-600/30 border border-violet-500/30 text-xs font-semibold text-violet-300 hover:text-white shadow-sm hover:shadow-violet-600/15 active:scale-95 transition-all cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-violet-400" />
          <span className="hidden sm:inline">{t.uploadFile}</span>
        </button>

        <button
          onClick={() => onRouteChange("landing")}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-xs font-medium text-white/80 hover:text-white active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="hidden sm:inline">{t.landing}</span>
        </button>
      </div>
    </header>
  );
};
