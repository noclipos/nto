import React from "react";
import { Layers, ArrowRight, ExternalLink, ShieldCheck, Check } from "lucide-react";
import { TranslationDictionary } from "../i18n/translations";
import { AppRoute } from "../types";
import { PLATFORMS_CONFIG } from "../lib/platforms";
import { PlatformIcon } from "./PlatformIcon";

interface PlatformsViewProps {
  t: TranslationDictionary;
  onRouteChange: (route: AppRoute) => void;
}

export const PlatformsView: React.FC<PlatformsViewProps> = ({
  t,
  onRouteChange,
}) => {
  const platformDetails = [
    {
      ...PLATFORMS_CONFIG.youtube,
      resolutions: "360p, 480p, 720p HD, 1080p FHD, 1440p 2K, 2160p 4K",
      audioExtract: "Yes (320kbps MP3)",
      watermark: "Clean (No Watermark)",
      notes: "Full length videos and chapters supported. Audio and video streams automatically merged with AAC.",
    },
    {
      ...PLATFORMS_CONFIG.youtube_shorts,
      resolutions: "720p, 1080p Vertical FHD",
      audioExtract: "Yes (320kbps MP3)",
      watermark: "Clean (No Watermark)",
      notes: "Direct support for youtube.com/shorts URLs with fast processing.",
    },
    {
      ...PLATFORMS_CONFIG.tiktok,
      resolutions: "720p, 1080p HD",
      audioExtract: "Yes (Original sound)",
      watermark: "Watermark-free raw MP4",
      notes: "Extracts original audio and removes TikTok floating watermark when available.",
    },
    {
      ...PLATFORMS_CONFIG.douyin,
      resolutions: "720p, 1080p HD",
      audioExtract: "Yes (Original sound)",
      watermark: "Watermark-free MP4",
      notes: "Supports desktop and short links (v.douyin.com) with automatic stream resolution.",
    },
    {
      ...PLATFORMS_CONFIG.instagram,
      resolutions: "Reels, Posts, Stories (720p, 1080p)",
      audioExtract: "Yes (320kbps MP3)",
      watermark: "Clean (No Watermark)",
      notes: "Public Reels and video posts supported with high download speeds.",
    },
    {
      ...PLATFORMS_CONFIG.twitter,
      resolutions: "720p, 1080p HD",
      audioExtract: "Yes (320kbps MP3)",
      watermark: "Clean (No Watermark)",
      notes: "Supports twitter.com and x.com status links.",
    },
    {
      ...PLATFORMS_CONFIG.facebook,
      resolutions: "SD, HD (720p, 1080p)",
      audioExtract: "Yes (320kbps MP3)",
      watermark: "Clean (No Watermark)",
      notes: "Supports fb.watch and standard public Facebook watch URLs.",
    },
    {
      ...PLATFORMS_CONFIG.snapchat,
      resolutions: "Spotlight, Public Stories",
      audioExtract: "Yes (320kbps MP3)",
      watermark: "Original Feed Stream",
      notes: "Direct public spotlight video extraction.",
    },
  ];

  return (
    <div id="platforms-view" className="w-full max-w-5xl mx-auto space-y-12 py-4 animate-in fade-in">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/10 border border-violet-500/20 text-xs font-semibold text-violet-300">
          <Layers className="w-3.5 h-3.5" />
          <span>Universal Compatibility</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Supported Streaming Platforms
        </h1>
        <p className="text-sm text-white/60 max-w-xl mx-auto">
          VidSnap continuously updates platform extractors to maintain reliable download and transcription compatibility.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platformDetails.map((platform) => (
          <div
            key={platform.id}
            className="p-6 rounded-2xl bg-[#0B0920]/80 border border-white/10 backdrop-blur-md space-y-4 hover:border-violet-500/30 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <PlatformIcon platform={platform.id} className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {platform.name}
                    </h3>
                    <span className="text-[10px] text-white/40">
                      {platform.domains.join(", ")}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                  Online
                </span>
              </div>

              <p className="text-xs text-white/70 leading-relaxed">
                {platform.notes}
              </p>

              <div className="space-y-1.5 pt-2 border-t border-white/5 text-xs">
                <div className="flex items-center justify-between text-white/60">
                  <span>Resolutions:</span>
                  <span className="text-white font-medium">{platform.resolutions}</span>
                </div>
                <div className="flex items-center justify-between text-white/60">
                  <span>Watermarks:</span>
                  <span className="text-emerald-400 font-medium">{platform.watermark}</span>
                </div>
                <div className="flex items-center justify-between text-white/60">
                  <span>Audio Extraction:</span>
                  <span className="text-white font-medium">{platform.audioExtract}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          <div className="text-xs text-white/70">
            All downloads are processed on-demand and securely streamed. No media files are stored permanently.
          </div>
        </div>
        <button
          onClick={() => onRouteChange("home")}
          className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 transition-all shrink-0"
        >
          Try Now
        </button>
      </div>
    </div>
  );
};
