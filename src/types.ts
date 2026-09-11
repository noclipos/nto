export interface VideoFormat {
  id: string;
  label: string;
  quality: string;
  type: "video" | "audio";
  ext: string;
  filesize: number | null;
  needsMerge: boolean;
  videoOnly: boolean;
  height?: number;
  width?: number;
  vcodec?: string;
  acodec?: string;
}

export interface VideoInfo {
  title: string;
  thumbnail: string;
  platform: string;
  duration: number;
  formats: VideoFormat[];
  url: string;
  description?: string;
  uploader?: string;
  uploader_url?: string;
  embedUrl?: string;
}

export type ActionTab = "download" | "video-only" | "audio" | "transcript";

export type SupportedPlatformId =
  | "youtube"
  | "youtube_shorts"
  | "tiktok"
  | "douyin"
  | "twitter"
  | "instagram"
  | "facebook"
  | "snapchat"
  | "generic";

export interface PlatformInfo {
  id: SupportedPlatformId;
  name: string;
  badge: string;
  color: string;
  icon: string;
  supportedFormats: string[];
}

export type AppLanguage = "en" | "ar" | "fr";

export type TranscriptLanguage =
  | "auto"
  | "en"
  | "ar"
  | "fr"
  | "es"
  | "de"
  | "zh"
  | "ja";

export interface RecentDownloadItem {
  id: string;
  title: string;
  thumbnail?: string;
  platform: string;
  type: "video" | "audio" | "transcript" | "video-only";
  quality?: string;
  url: string;
  timestamp: number;
  status: "completed" | "failed" | "processing";
  language?: string;
}

export type AppRoute =
  | "home"
  | "landing"
  | "upload"
  | "how-it-works"
  | "platforms"
  | "contact";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: "success" | "error" | "info";
}
