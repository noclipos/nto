import React from "react";
import {
  Youtube,
  Instagram,
  Twitter,
  Facebook,
  Ghost,
  Film,
  Video,
  PlaySquare,
} from "lucide-react";

interface PlatformIconProps {
  platform: string;
  className?: string;
}

export const PlatformIcon: React.FC<PlatformIconProps> = ({ platform, className = "w-4 h-4" }) => {
  const p = platform.toLowerCase();
  if (p.includes("youtube_shorts")) {
    return <PlaySquare className={`${className} text-red-500`} />;
  }
  if (p.includes("youtube")) {
    return <Youtube className={`${className} text-red-500`} />;
  }
  if (p.includes("tiktok")) {
    return <Video className={`${className} text-cyan-400`} />;
  }
  if (p.includes("douyin")) {
    return <Film className={`${className} text-rose-500`} />;
  }
  if (p.includes("instagram")) {
    return <Instagram className={`${className} text-pink-500`} />;
  }
  if (p.includes("twitter") || p === "x") {
    return <Twitter className={`${className} text-sky-400`} />;
  }
  if (p.includes("facebook")) {
    return <Facebook className={`${className} text-blue-500`} />;
  }
  if (p.includes("snapchat")) {
    return <Ghost className={`${className} text-yellow-400`} />;
  }
  return <Film className={`${className} text-violet-400`} />;
};
