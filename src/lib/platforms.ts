import { SupportedPlatformId } from "../types";

export interface PlatformConfig {
  id: SupportedPlatformId;
  name: string;
  badge: string;
  color: string;
  gradient: string;
  sampleUrl: string;
  exampleFormat: string;
  requiresCookiesInfo?: string;
  domains: string[];
}

export const PLATFORMS_CONFIG: Record<string, PlatformConfig> = {
  youtube: {
    id: "youtube",
    name: "YouTube",
    badge: "YouTube",
    color: "#FF0000",
    gradient: "from-red-600 to-rose-600",
    sampleUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    exampleFormat: "https://www.youtube.com/watch?v=...",
    domains: ["youtube.com", "youtu.be"],
  },
  youtube_shorts: {
    id: "youtube_shorts",
    name: "YouTube Shorts",
    badge: "Shorts",
    color: "#FF0000",
    gradient: "from-red-600 to-amber-600",
    sampleUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    exampleFormat: "https://www.youtube.com/shorts/...",
    domains: ["youtube.com/shorts"],
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    badge: "TikTok",
    color: "#00F2FE",
    gradient: "from-cyan-400 to-pink-500",
    sampleUrl: "https://www.tiktok.com/@tiktok/video/7106594312292453678",
    exampleFormat: "https://www.tiktok.com/@username/video/...",
    requiresCookiesInfo: "Cloud IPs may require cookies for specific regional videos",
    domains: ["tiktok.com"],
  },
  douyin: {
    id: "douyin",
    name: "Douyin (抖音)",
    badge: "Douyin",
    color: "#FE2C55",
    gradient: "from-rose-500 to-purple-600",
    sampleUrl: "https://v.douyin.com/i8ABCD/",
    exampleFormat: "https://v.douyin.com/... or https://www.douyin.com/video/...",
    requiresCookiesInfo: "Requires Netscape cookies.txt due to Douyin anti-crawler protection",
    domains: ["douyin.com", "iesdouyin.com", "v.douyin.com"],
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    badge: "Instagram",
    color: "#E1306C",
    gradient: "from-amber-500 via-pink-600 to-purple-700",
    sampleUrl: "https://www.instagram.com/reel/C21_example/",
    exampleFormat: "https://www.instagram.com/reel/... or /p/...",
    requiresCookiesInfo: "Requires cookies for private posts and feed reels",
    domains: ["instagram.com"],
  },
  twitter: {
    id: "twitter",
    name: "Twitter / X",
    badge: "Twitter / X",
    color: "#1DA1F2",
    gradient: "from-sky-400 to-blue-600",
    sampleUrl: "https://x.com/username/status/1234567890",
    exampleFormat: "https://x.com/username/status/...",
    domains: ["twitter.com", "x.com"],
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    badge: "Facebook",
    color: "#1877F2",
    gradient: "from-blue-600 to-indigo-700",
    sampleUrl: "https://www.facebook.com/watch/?v=123456789",
    exampleFormat: "https://www.facebook.com/watch/?v=... or /reel/...",
    domains: ["facebook.com", "fb.watch"],
  },
  snapchat: {
    id: "snapchat",
    name: "Snapchat",
    badge: "Snapchat",
    color: "#FFFC00",
    gradient: "from-yellow-400 to-amber-500",
    sampleUrl: "https://story.snapchat.com/p/123456",
    exampleFormat: "https://story.snapchat.com/p/...",
    domains: ["snapchat.com"],
  },
};

export function detectPlatformFromUrl(url: string): PlatformConfig | null {
  if (!url || typeof url !== "string") return null;
  const lower = url.toLowerCase().trim();

  if (lower.includes("youtube.com/shorts/")) {
    return PLATFORMS_CONFIG.youtube_shorts;
  }
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return PLATFORMS_CONFIG.youtube;
  }
  if (lower.includes("douyin.com") || lower.includes("iesdouyin.com") || lower.includes("v.douyin.com")) {
    return PLATFORMS_CONFIG.douyin;
  }
  if (lower.includes("tiktok.com")) {
    return PLATFORMS_CONFIG.tiktok;
  }
  if (lower.includes("instagram.com")) {
    return PLATFORMS_CONFIG.instagram;
  }
  if (lower.includes("twitter.com") || lower.includes("x.com")) {
    return PLATFORMS_CONFIG.twitter;
  }
  if (lower.includes("facebook.com") || lower.includes("fb.watch")) {
    return PLATFORMS_CONFIG.facebook;
  }
  if (lower.includes("snapchat.com")) {
    return PLATFORMS_CONFIG.snapchat;
  }

  return null;
}
