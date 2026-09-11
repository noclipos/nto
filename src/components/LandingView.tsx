import React from "react";
import {
  Download,
  HelpCircle,
  Zap,
  CheckCircle2,
  Sparkles,
  Shield,
  Music,
  Globe,
  ArrowRight,
} from "lucide-react";
import { TranslationDictionary } from "../i18n/translations";
import { AppRoute } from "../types";
import { PLATFORMS_CONFIG } from "../lib/platforms";
import { PlatformIcon } from "./PlatformIcon";

interface LandingViewProps {
  t: TranslationDictionary;
  onRouteChange: (route: AppRoute) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ t, onRouteChange }) => {
  const featureCards = [
    {
      title: t.feature1Title,
      desc: t.feature1Desc,
      icon: <Zap className="w-5 h-5 text-violet-400" />,
      color: "from-violet-500/10 to-indigo-500/10 border-violet-500/20",
    },
    {
      title: t.feature2Title,
      desc: t.feature2Desc,
      icon: <CheckCircle2 className="w-5 h-5 text-blue-400" />,
      color: "from-blue-500/10 to-cyan-500/10 border-blue-500/20",
    },
    {
      title: t.feature3Title,
      desc: t.feature3Desc,
      icon: <Shield className="w-5 h-5 text-emerald-400" />,
      color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20",
    },
    {
      title: t.feature4Title,
      desc: t.feature4Desc,
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      color: "from-purple-500/10 to-pink-500/10 border-purple-500/20",
    },
    {
      title: t.feature5Title,
      desc: t.feature5Desc,
      icon: <Globe className="w-5 h-5 text-pink-400" />,
      color: "from-pink-500/10 to-rose-500/10 border-pink-500/20",
    },
    {
      title: t.feature6Title,
      desc: t.feature6Desc,
      icon: <Music className="w-5 h-5 text-amber-400" />,
      color: "from-amber-500/10 to-orange-500/10 border-amber-500/20",
    },
  ];

  return (
    <div id="landing-view" className="w-full max-w-5xl mx-auto space-y-16 py-6 animate-in fade-in">
      {/* Hero Section */}
      <div className="relative text-center space-y-6 pt-6 pb-12">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Small VidSnap Logo */}
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
            VS
          </div>
          <span className="text-xs font-semibold text-white/90">
            {t.appName} Media Engine
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-3xl mx-auto leading-tight">
          {t.heroHeadline}
        </h1>

        <p className="text-base sm:text-lg text-white/65 max-w-2xl mx-auto leading-relaxed">
          {t.heroSubtitle}
        </p>

        {/* Key Highlights Mentioned in Prompt */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {[
            "7+ Global Platforms",
            "Up to 4K where available",
            "No watermarks where supported",
            "AI speech transcription",
            "No sign-up required",
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-white/80"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => onRouteChange("home")}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-xl shadow-violet-600/30 hover:shadow-violet-600/50 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{t.startDownloading}</span>
          </button>

          <button
            onClick={() => onRouteChange("how-it-works")}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl font-semibold text-sm text-white/80 hover:text-white bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 transition-all flex items-center justify-center gap-2"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{t.howItWorks}</span>
          </button>
        </div>

        {/* Supported Platform Pills */}
        <div className="pt-8 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40 block">
            Supported Streaming & Social Networks
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl mx-auto">
            {Object.values(PLATFORMS_CONFIG).map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-medium text-white/80 hover:text-white transition-colors"
              >
                <PlatformIcon platform={p.id} className="w-4 h-4" />
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Engineered for Pure Media Quality
          </h2>
          <p className="text-xs sm:text-sm text-white/50 max-w-lg mx-auto">
            From social short-form loops to full 4K documentaries, VidSnap provides end-to-end extraction and intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featureCards.map((f, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl bg-gradient-to-b ${f.color} border backdrop-blur-md space-y-3 hover:border-white/20 transition-all group`}
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-base font-bold text-white">{f.title}</h3>
              <p className="text-xs text-white/60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-violet-900/40 via-purple-900/30 to-[#0B0920] border border-violet-500/30 text-center space-y-4 shadow-2xl backdrop-blur-xl">
        <h3 className="text-xl sm:text-2xl font-bold text-white">
          Ready to save high-resolution media?
        </h3>
        <p className="text-xs sm:text-sm text-white/60 max-w-md mx-auto">
          No sign-up, no hidden fees, and no artificial file size caps. Paste your link and begin now.
        </p>
        <button
          onClick={() => onRouteChange("home")}
          className="px-8 py-3.5 rounded-2xl font-bold text-xs text-white bg-violet-600 hover:bg-violet-500 shadow-xl shadow-violet-600/40 transition-all inline-flex items-center gap-2"
        >
          <span>Get Started Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
