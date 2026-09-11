import React from "react";
import {
  Search,
  Sliders,
  Download,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { TranslationDictionary } from "../i18n/translations";
import { AppRoute } from "../types";

interface HowItWorksViewProps {
  t: TranslationDictionary;
  onRouteChange: (route: AppRoute) => void;
}

export const HowItWorksView: React.FC<HowItWorksViewProps> = ({
  t,
  onRouteChange,
}) => {
  const steps = [
    {
      num: "01",
      title: "Paste URL or Upload Media",
      desc: "Paste any video URL from YouTube, TikTok, Douyin, Instagram, X, Facebook, or Snapchat. Or upload local recordings directly.",
      icon: <Search className="w-5 h-5 text-violet-400" />,
    },
    {
      num: "02",
      title: "Stream & Metadata Analysis",
      desc: "VidSnap inspects the media stream in real-time, querying available resolutions from 360p to 4K UHD and calculating estimated sizes.",
      icon: <Sliders className="w-5 h-5 text-blue-400" />,
    },
    {
      num: "03",
      title: "Select Output Mode",
      desc: "Choose between full merged video, silent video-only track, high-bitrate 320kbps MP3 audio, or full speech transcription.",
      icon: <FileText className="w-5 h-5 text-pink-400" />,
    },
    {
      num: "04",
      title: "Download & Translate",
      desc: "Download directly to your device, or let Gemini AI transcribe and translate spoken dialogue into your chosen target language.",
      icon: <Download className="w-5 h-5 text-emerald-400" />,
    },
  ];

  const faqs = [
    {
      q: "Does VidSnap add watermarks to downloaded videos?",
      a: "No. VidSnap extracts the raw stream directly from the platform. For platforms like TikTok and Douyin, watermark-free streams are provided whenever technically available.",
    },
    {
      q: "What video resolutions and formats can I download?",
      a: "VidSnap supports resolutions ranging from 360p and 720p HD up to 1080p Full HD and 4K UHD in standard MP4, as well as 320kbps MP3 audio.",
    },
    {
      q: "How does the AI transcription pipeline work?",
      a: "VidSnap uses FFmpeg to extract and normalize speech to mono 16kHz MP3, splits long recordings into safe chunks, and passes them to Gemini AI models for multi-lingual speech-to-text and translation.",
    },
    {
      q: "Can I download audio-only files for podcasts and music?",
      a: "Yes! Simply switch to the 'Extract Audio' tab after analyzing any video, and click 'Download Audio' to receive an optimized 320kbps MP3 file.",
    },
  ];

  return (
    <div id="how-it-works-view" className="w-full max-w-4xl mx-auto space-y-12 py-4 animate-in fade-in">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/10 border border-violet-500/20 text-xs font-semibold text-violet-300">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Workflow & Guide</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          How VidSnap Operates
        </h1>
        <p className="text-sm text-white/60 max-w-xl mx-auto">
          High-performance media extraction built on yt-dlp, FFmpeg, and Gemini neural transcription models.
        </p>
      </div>

      {/* 4 Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-[#0B0920]/80 border border-white/10 backdrop-blur-md space-y-3 relative group hover:border-violet-500/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                {step.icon}
              </div>
              <span className="text-2xl font-black text-white/15 font-mono">
                {step.num}
              </span>
            </div>
            <h3 className="text-base font-bold text-white">{step.title}</h3>
            <p className="text-xs text-white/60 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* FAQ Accordion / List */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-bold text-white text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#0B0920]/80 border border-white/10 space-y-2"
            >
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs text-white/60 pl-6 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pt-6">
        <button
          onClick={() => onRouteChange("home")}
          className="px-8 py-3 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-600/30 transition-all"
        >
          {t.startDownloading}
        </button>
      </div>
    </div>
  );
};
