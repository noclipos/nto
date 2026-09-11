import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import {
  isDirectMediaUrl,
  fetchDirectMediaInfo,
  resolveWithBtch,
  downloadDirectMedia,
} from "./btchResolver";

// Find yt-dlp executable
export function getYtDlpPath(): string {
  const localBin = path.resolve(process.cwd(), "bin", "yt-dlp");
  if (fs.existsSync(localBin)) {
    try {
      fs.chmodSync(localBin, 0o755);
    } catch {}
    return localBin;
  }
  const rootBin = path.resolve(process.cwd(), "yt-dlp");
  if (fs.existsSync(rootBin)) {
    try {
      fs.chmodSync(rootBin, 0o755);
    } catch {}
    return rootBin;
  }
  return "yt-dlp";
}

export interface VideoFormatOption {
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

export interface VideoInfoResult {
  title: string;
  thumbnail: string;
  platform: string;
  duration: number;
  formats: VideoFormatOption[];
  url: string;
  description?: string;
  uploader?: string;
  uploader_url?: string;
  embedUrl?: string;
}

export function extractYouTubeVideoId(url: string): string | null {
  const clean = cleanVideoUrl(url);
  const match = clean.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|v\/|live\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export async function fetchYouTubeOembedFallback(url: string, platform: string): Promise<VideoInfoResult | null> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;

    const data = (await res.json()) as any;
    const title = data.title || "YouTube Video";
    const author = data.author_name || "YouTube Creator";
    const authorUrl = data.author_url || `https://www.youtube.com/@${encodeURIComponent(author)}`;
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const cleanUrl = cleanVideoUrl(url);
    const resolvedPlatform = cleanUrl.includes("/shorts/") ? "youtube_shorts" : "youtube";

    const formats: VideoFormatOption[] = [
      {
        id: "best-1080",
        label: "Full HD / 1080p (MP4)",
        quality: "1080p",
        type: "video",
        ext: "mp4",
        filesize: null,
        needsMerge: false,
        videoOnly: false,
        height: 1080,
        width: 1920,
      },
      {
        id: "best-720",
        label: "HD / 720p (MP4)",
        quality: "720p",
        type: "video",
        ext: "mp4",
        filesize: null,
        needsMerge: false,
        videoOnly: false,
        height: 720,
        width: 1280,
      },
      {
        id: "best-480",
        label: "SD / 480p (MP4)",
        quality: "480p",
        type: "video",
        ext: "mp4",
        filesize: null,
        needsMerge: false,
        videoOnly: false,
        height: 480,
        width: 854,
      },
      {
        id: "best-360",
        label: "360p (MP4)",
        quality: "360p",
        type: "video",
        ext: "mp4",
        filesize: null,
        needsMerge: false,
        videoOnly: false,
        height: 360,
        width: 640,
      },
      {
        id: "audio_mp3",
        label: "MP3 Audio (High Quality 320kbps)",
        quality: "audio",
        type: "audio",
        ext: "mp3",
        filesize: null,
        needsMerge: false,
        videoOnly: false,
      },
    ];

    return {
      title,
      thumbnail,
      platform: resolvedPlatform,
      duration: 0,
      formats,
      url: cleanUrl,
      description: `YouTube video by ${author}. Preview player, downloads, and AI tools are fully active.`,
      uploader: author,
      uploader_url: authorUrl,
      embedUrl,
    };
  } catch (err: any) {
    console.warn("oEmbed fallback failed:", err.message);
    return null;
  }
}

// Clean and normalize URLs
export function cleanVideoUrl(rawUrl: string): string {
  try {
    const urlObj = new URL(rawUrl.trim());
    // Strip tracking parameters
    const paramsToDelete: string[] = [];
    urlObj.searchParams.forEach((_, key) => {
      const lower = key.toLowerCase();
      if (
        lower.startsWith("utm_") ||
        lower === "si" ||
        lower === "feature" ||
        lower === "ref" ||
        lower === "fbclid" ||
        lower === "igshid" ||
        lower === "share_source" ||
        lower === "share_id"
      ) {
        paramsToDelete.push(key);
      }
    });
    paramsToDelete.forEach((k) => urlObj.searchParams.delete(k));
    return urlObj.toString();
  } catch {
    return rawUrl.trim();
  }
}

// Platform detection
export function detectPlatform(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return lower.includes("/shorts/") ? "youtube_shorts" : "youtube";
  }
  if (lower.includes("douyin.com") || lower.includes("iesdouyin.com")) {
    return "douyin";
  }
  if (lower.includes("tiktok.com")) {
    return "tiktok";
  }
  if (lower.includes("twitter.com") || lower.includes("x.com")) {
    return "twitter";
  }
  if (lower.includes("instagram.com")) {
    return "instagram";
  }
  if (lower.includes("facebook.com") || lower.includes("fb.watch")) {
    return "facebook";
  }
  if (lower.includes("snapchat.com")) {
    return "snapchat";
  }
  return "generic";
}

// In-memory cache for video info
interface CacheEntry {
  data: VideoInfoResult;
  timestamp: number;
}
const infoCache = new Map<string, CacheEntry>();
// Find Node.js runtime for yt-dlp JS challenges
export function getNodeJsPath(): string | null {
  const candidates = ["/usr/local/bin/node", "/usr/bin/node", "node"];
  for (const c of candidates) {
    if (c === "node" || fs.existsSync(c)) {
      return c;
    }
  }
  return null;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface ParsedErrorResult {
  message: string;
  code: string;
  platform?: string;
}

// Clean error message parser
export function parseYtDlpError(errText: string, platform: string): ParsedErrorResult {
  const text = errText || "";

  // Get readable platform name
  const platformNames: Record<string, string> = {
    youtube: "YouTube",
    youtube_shorts: "YouTube Shorts",
    douyin: "Douyin (抖音)",
    tiktok: "TikTok",
    instagram: "Instagram",
    twitter: "Twitter / X",
    facebook: "Facebook",
    snapchat: "Snapchat",
  };
  const platName = platformNames[platform] || "Platform";

  // 1. Specific Douyin error handling
  if (
    platform === "douyin" ||
    text.toLowerCase().includes("douyin") ||
    text.includes("sec_user_id") ||
    text.includes("anti-crawler") ||
    text.includes("passport.douyin.com")
  ) {
    return {
      message:
        "Douyin anti-crawler protection restricted access to this video stream. Please try another link.",
      code: "DOUYIN_RESTRICTED",
      platform: "douyin",
    };
  }

  // 2. YouTube bot detection / datacenter IP block
  if (
    text.includes("Sign in to confirm you’re not a bot") ||
    text.includes("confirm you're not a bot") ||
    text.includes("Sign in to confirm you're not a bot")
  ) {
    return {
      message:
        "YouTube requires bot verification on this video from the current server IP. Please try another video.",
      code: "BOT_VERIFICATION_REQUIRED",
      platform: "youtube",
    };
  }

  // 3. Instagram authentication/empty media response
  if (
    platform === "instagram" ||
    text.includes("Instagram sent an empty media response") ||
    text.includes("No CSRF token set by Instagram") ||
    text.includes("Check if this post is accessible in your browser without being logged-in")
  ) {
    return {
      message:
        "Instagram restricted access to this media without a public session.",
      code: "LOGIN_REQUIRED",
      platform: "instagram",
    };
  }

  // 4. TikTok IP or impersonation restriction
  if (
    platform === "tiktok" &&
    (text.includes("blocked") || text.includes("impersonat") || text.includes("Access Denied"))
  ) {
    return {
      message:
        "TikTok has restricted requests from server IPs for this video. Please try another public video link.",
      code: "ACCESS_RESTRICTED",
      platform: "tiktok",
    };
  }

  // 5. General platform authentication required notification
  if (text.includes("Fresh cookies are needed") || text.includes("Use --cookies")) {
    return {
      message: `${platName} content requires authentication or is restricted.`,
      code: "AUTH_RESTRICTED",
      platform,
    };
  }

  // 6. Private / restricted video
  if (text.includes("Private video") || text.includes("This video is private") || text.includes("is private")) {
    return {
      message: "This video is private or restricted by the author and cannot be accessed publicly.",
      code: "PRIVATE_VIDEO",
      platform,
    };
  }

  // 7. General login required
  if (
    text.includes("Sign in") ||
    text.includes("login required") ||
    text.includes("requires authentication") ||
    text.includes("Please log in")
  ) {
    return {
      message: `This video requires ${platName} account login or private access.`,
      code: "LOGIN_REQUIRED",
      platform,
    };
  }

  // 8. Video unavailable / removed
  if (
    text.includes("Video unavailable") ||
    text.includes("This video has been removed") ||
    text.includes("404") ||
    text.includes("does not exist") ||
    text.includes("No video could be found")
  ) {
    return {
      message: "This video has been removed, is unavailable, or the URL does not contain accessible media.",
      code: "VIDEO_UNAVAILABLE",
      platform,
    };
  }

  if (text.includes("Unsupported URL") || text.includes("is not a valid URL")) {
    return {
      message: "The provided URL is not supported or is formatted incorrectly.",
      code: "UNSUPPORTED_URL",
      platform,
    };
  }

  if (text.includes("HTTP Error 429") || text.includes("Too Many Requests")) {
    return {
      message: "The platform's rate limit was reached. Please wait a moment and try again.",
      code: "RATE_LIMIT",
      platform,
    };
  }

  return {
    message: `Could not retrieve ${platName} video details. The content may be region-restricted, private, or protected.`,
    code: "FETCH_FAILED",
    platform,
  };
}

// Fast yt-dlp extractor with strict timeouts and optimized parameters
export async function extractWithYtDlp(url: string, platform: string): Promise<VideoInfoResult> {
  const ytDlpPath = getYtDlpPath();
  const nodePath = getNodeJsPath();

  const args = [
    "--dump-single-json",
    "--no-playlist",
    "--no-warnings",
    "--socket-timeout",
    "6",
    "--extractor-retries",
    "1",
    "--skip-download",
    "--ffmpeg-location",
    "/usr/bin/ffmpeg",
  ];

  if (nodePath) {
    args.push("--js-runtimes", `node:${nodePath}`);
  }

  // Optimized extractor client configs
  if (platform === "youtube" || platform === "youtube_shorts") {
    args.push("--extractor-args", "youtube:player_client=android,web");
  } else if (platform === "douyin") {
    args.push("--add-header", "Referer:https://www.douyin.com/");
    args.push(
      "--add-header",
      "User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
  } else if (platform === "instagram") {
    args.push(
      "--add-header",
      "User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
  } else if (platform === "tiktok") {
    args.push(
      "--add-header",
      "User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
  }

  args.push(url);

  return new Promise((resolve, reject) => {
    const proc = spawn(ytDlpPath, args);
    let stdoutData = "";
    let stderrData = "";

    const timer = setTimeout(() => {
      try {
        proc.kill("SIGKILL");
      } catch {}
      reject(new Error("Extractor timeout"));
    }, 7000);

    proc.stdout?.on("data", (chunk) => {
      stdoutData += chunk.toString();
    });

    proc.stderr?.on("data", (chunk) => {
      stderrData += chunk.toString();
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        const parsed = parseYtDlpError(stderrData, platform);
        const error: any = new Error(parsed.message);
        error.code = parsed.code;
        error.platform = parsed.platform;
        return reject(error);
      }

      try {
        const rawJson = JSON.parse(stdoutData);
        const result = formatMetadata(rawJson, url, platform);
        if (platform === "youtube" || platform === "youtube_shorts") {
          const vid = extractYouTubeVideoId(url);
          if (vid && !result.embedUrl) {
            result.embedUrl = `https://www.youtube.com/embed/${vid}`;
          }
        }
        resolve(result);
      } catch (parseErr: any) {
        reject(new Error(`Failed to parse video metadata: ${parseErr.message}`));
      }
    });
  });
}

// Fetch video info using ultra-fast multi-engine parallel racing
export async function fetchVideoInfo(rawUrl: string): Promise<VideoInfoResult> {
  const url = cleanVideoUrl(rawUrl);
  const platform = detectPlatform(url);

  // 1. Instant Cache hit (0ms)
  const cached = infoCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 2. Direct media file detection (.mp4, .webm, .mp3, etc.)
  if (isDirectMediaUrl(url)) {
    try {
      const directInfo = await fetchDirectMediaInfo(url);
      infoCache.set(url, { data: directInfo, timestamp: Date.now() });
      return directInfo;
    } catch {
      // Continue to extractors
    }
  }

  // 3. YouTube & YouTube Shorts: High-Speed Dual-Stream Resolution
  if (platform === "youtube" || platform === "youtube_shorts") {
    const oembedPromise = fetchYouTubeOembedFallback(url, platform);
    const ytdlpPromise = extractWithYtDlp(url, platform);

    try {
      // Race: oEmbed resolves in ~120ms. We give yt-dlp up to 600ms grace period.
      // If yt-dlp finishes fast, return full format details.
      // If yt-dlp takes longer, return the instant oEmbed result immediately!
      const raceResult = await Promise.race([
        ytdlpPromise.then((res) => ({ type: "ytdlp" as const, res })),
        oembedPromise.then(async (oembed) => {
          if (!oembed) {
            return ytdlpPromise.then((res) => ({ type: "ytdlp" as const, res }));
          }
          await new Promise((r) => setTimeout(r, 600));
          return { type: "oembed" as const, res: oembed };
        }),
      ]);

      if (raceResult?.res) {
        infoCache.set(url, { data: raceResult.res, timestamp: Date.now() });

        // If oEmbed won the race, let yt-dlp finish in background to enrich cache
        if (raceResult.type === "oembed") {
          ytdlpPromise
            .then((deepRes) => {
              infoCache.set(url, { data: deepRes, timestamp: Date.now() });
            })
            .catch(() => {});
        }

        return raceResult.res;
      }
    } catch (err: any) {
      console.warn("YouTube fast-path race error:", err.message);
    }

    // Fallback 1: Check btch
    try {
      const btchRes = await resolveWithBtch(url, platform);
      if (btchRes) {
        infoCache.set(url, { data: btchRes, timestamp: Date.now() });
        return btchRes;
      }
    } catch {}

    // Fallback 2: Direct oEmbed
    const fallbackOembed = await fetchYouTubeOembedFallback(url, platform);
    if (fallbackOembed) {
      infoCache.set(url, { data: fallbackOembed, timestamp: Date.now() });
      return fallbackOembed;
    }

    throw new Error("Could not retrieve YouTube video details. Please verify the link.");
  }

  // 4. Multi-platform parallel race (TikTok, Instagram, Facebook, Twitter, Douyin, etc.)
  // We run resolveWithBtch AND extractWithYtDlp in PARALLEL via Promise.any.
  // Whichever returns a valid result first WINS and is returned immediately!
  const resolvers: Promise<VideoInfoResult>[] = [
    resolveWithBtch(url, platform).then((res) => {
      if (!res) throw new Error("No btch result");
      return res;
    }),
    extractWithYtDlp(url, platform),
  ];

  try {
    const winner = await Promise.any(resolvers);
    infoCache.set(url, { data: winner, timestamp: Date.now() });
    return winner;
  } catch (anyErr: any) {
    // If specific platform resolvers failed, try universal AIO resolver
    try {
      const universal = await resolveWithBtch(url, "generic");
      if (universal) {
        infoCache.set(url, { data: universal, timestamp: Date.now() });
        return universal;
      }
    } catch {}

    throw new Error(
      `Could not retrieve video details from ${platform}. The link may be private or protected.`
    );
  }
}

function formatMetadata(raw: any, url: string, detectedPlatform: string): VideoInfoResult {
  const title = raw.title || "Untitled Video";
  const thumbnail = raw.thumbnail || (raw.thumbnails && raw.thumbnails.length > 0 ? raw.thumbnails[raw.thumbnails.length - 1].url : "");
  const duration = Math.round(Number(raw.duration) || 0);
  const platform = detectedPlatform !== "generic" ? detectedPlatform : (raw.extractor || "web");

  const rawFormats: any[] = Array.isArray(raw.formats) ? raw.formats : [];
  const formatMap = new Map<string, VideoFormatOption>();

  // Process available video formats
  for (const f of rawFormats) {
    const hasVideo = f.vcodec && f.vcodec !== "none";
    const hasAudio = f.acodec && f.acodec !== "none";
    const height = f.height || 0;
    const width = f.width || 0;

    if (hasVideo && height > 0) {
      let qualityLabel = "";
      let rank = 0;

      if (height >= 2160) {
        qualityLabel = "4K / 2160p";
        rank = 2160;
      } else if (height >= 1440) {
        qualityLabel = "2K / 1440p";
        rank = 1440;
      } else if (height >= 1080) {
        qualityLabel = "Full HD / 1080p";
        rank = 1080;
      } else if (height >= 720) {
        qualityLabel = "HD / 720p";
        rank = 720;
      } else if (height >= 480) {
        qualityLabel = "SD / 480p";
        rank = 480;
      } else if (height >= 360) {
        qualityLabel = "SD / 360p";
        rank = 360;
      } else {
        qualityLabel = `${height}p`;
        rank = height;
      }

      const qualityKey = `${rank}p`;
      const needsMerge = !hasAudio;
      const ext = f.ext === "webm" ? "mp4" : (f.ext || "mp4");
      const filesize = f.filesize || f.filesize_approx || null;

      // Prefer formats that already have audio or higher bitrate
      const existing = formatMap.get(qualityKey);
      if (!existing || (!existing.needsMerge && needsMerge) || (filesize && (!existing.filesize || filesize > existing.filesize))) {
        formatMap.set(qualityKey, {
          id: String(f.format_id || qualityKey),
          label: qualityLabel,
          quality: qualityKey,
          type: "video",
          ext,
          filesize,
          needsMerge,
          videoOnly: false,
          height,
          width,
          vcodec: f.vcodec,
          acodec: f.acodec,
        });
      }
    }
  }

  // If no detailed formats were parsed, provide sensible best fallback
  if (formatMap.size === 0) {
    formatMap.set("best", {
      id: "best",
      label: "Best Quality (Auto)",
      quality: "best",
      type: "video",
      ext: "mp4",
      filesize: raw.filesize || null,
      needsMerge: false,
      videoOnly: false,
    });
  }

  // Sort formats by height descending
  const sortedFormats = Array.from(formatMap.values()).sort((a, b) => (b.height || 0) - (a.height || 0));

  return {
    title,
    thumbnail,
    platform,
    duration,
    formats: sortedFormats,
    url,
    description: raw.description?.slice(0, 300),
    uploader: raw.uploader || raw.channel || "",
    uploader_url: raw.uploader_url || "",
  };
}

// Download video or audio to a temporary file
export interface DownloadOptions {
  url: string;
  formatId?: string;
  type: "video" | "video-only" | "audio";
  quality?: string;
  title?: string;
  fastSpeech?: boolean;
}

// Download YouTube videos via high-speed stream resolver
export async function downloadViaYouTubeResolver(
  options: DownloadOptions,
  onProgress?: (msg: string) => void
): Promise<{ filePath: string; fileName: string; mimeType: string; cleanup: () => void }> {
  const { url, formatId, type } = options;
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error("Invalid YouTube video URL");
  }

  let fmt = "720";
  if (type === "audio") {
    fmt = "mp3";
  } else if (formatId && (formatId.includes("1080") || formatId === "best-1080")) {
    fmt = "1080";
  } else if (formatId && (formatId.includes("720") || formatId === "best-720")) {
    fmt = "720";
  } else if (formatId && (formatId.includes("480") || formatId === "best-480")) {
    fmt = "480";
  } else if (formatId && (formatId.includes("360") || formatId === "best-360")) {
    fmt = "360";
  }

  if (onProgress) onProgress("Connecting to high-speed stream resolver...");

  const initUrl = `https://loader.to/ajax/download.php?format=${fmt}&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;
  const res = await fetch(initUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    throw new Error("High-speed resolver currently unavailable");
  }

  const data = (await res.json()) as any;
  if (!data.id) {
    throw new Error("Resolver failed to initialize download task");
  }

  const rawTitle = data.title || data.info?.title || `video_${videoId}`;
  const ext = type === "audio" ? "mp3" : "mp4";
  const mimeType = type === "audio" ? "audio/mpeg" : "video/mp4";

  let downloadUrl: string | null = null;
  const pollEndpoints: string[] = [];
  if (data.progress_url) {
    pollEndpoints.push(data.progress_url);
  }
  pollEndpoints.push(`https://loader.to/ajax/progress.php?id=${data.id}`);
  pollEndpoints.push(`https://p.savenow.to/ajax/progress.php?id=${data.id}`);

  // Poll up to 35 seconds to allow cloud encoder to finish remuxing
  for (let i = 0; i < 35; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    for (const ep of pollEndpoints) {
      try {
        const pRes = await fetch(ep, {
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(4000),
        });
        if (pRes.ok) {
          const pData = (await pRes.json()) as any;
          if (pData.progress) {
            const pct = Math.min(96, Math.max(20, Math.round(pData.progress > 100 ? pData.progress / 10 : pData.progress)));
            if (onProgress) onProgress(`Converting video stream (${pct}%)...`);
          }
          if (pData.download_url && pData.download_url.length > 10) {
            downloadUrl = pData.download_url;
            break;
          }
        }
      } catch {}
    }
    if (downloadUrl) break;
  }

  if (!downloadUrl) {
    throw new Error("Stream conversion timed out. Please try another quality or video.");
  }

  if (onProgress) onProgress("Downloading stream payload...");
  const fileRes = await fetch(downloadUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(90000),
  });

  if (!fileRes.ok) {
    throw new Error("Failed to download media stream from resolver");
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vidsnap-dl-"));
  const sanitizedTitle = sanitizeFileName(rawTitle.slice(0, 70));
  const fileName = `${sanitizedTitle || `youtube_${videoId}`}.${ext}`;
  const filePath = path.join(tmpDir, fileName);

  const arrayBuf = await fileRes.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuf));

  return {
    filePath,
    fileName,
    mimeType,
    cleanup: () => cleanupDir(tmpDir),
  };
}

export async function executeDownload(
  options: DownloadOptions,
  onProgress?: (msg: string) => void
): Promise<{ filePath: string; fileName: string; mimeType: string; cleanup: () => void }> {
  const { url, formatId, type } = options;
  const cleanUrl = cleanVideoUrl(url);
  const platform = detectPlatform(cleanUrl);

  // 1. Direct stream format (e.g. from multi-platform resolver or direct link)
  if (
    formatId &&
    (formatId.startsWith("btch_video:") ||
      formatId.startsWith("btch_video_720:") ||
      formatId.startsWith("btch_video_sd:") ||
      formatId.startsWith("direct:"))
  ) {
    const directUrl = formatId.slice(formatId.indexOf(":") + 1);
    if (!directUrl.includes("ymcdn.org")) {
      try {
        if (onProgress) onProgress("Downloading media directly from high-speed stream...");
        return await downloadDirectMedia(directUrl, "mp4", "download_video", type === "audio");
      } catch (directErr: any) {
        console.warn("Direct stream download notice, continuing to core engine:", directErr.message);
      }
    }
  }

  if (formatId && (formatId.startsWith("btch_audio:") || formatId.startsWith("direct_audio:"))) {
    const directUrl = formatId.slice(formatId.indexOf(":") + 1);
    if (!directUrl.includes("ymcdn.org")) {
      try {
        if (onProgress) onProgress("Extracting direct audio track...");
        return await downloadDirectMedia(directUrl, "mp3", "download_audio", true);
      } catch (directErr: any) {
        console.warn("Direct audio download notice, continuing to core engine:", directErr.message);
      }
    }
  }

  // 2. Direct media file URL (.mp4, .webm, etc.)
  if (isDirectMediaUrl(cleanUrl)) {
    if (onProgress) onProgress("Downloading direct media file...");
    return await downloadDirectMedia(cleanUrl, type === "audio" ? "mp3" : "mp4", "media_file", type === "audio");
  }

  const ytDlpPath = getYtDlpPath();
  const nodePath = getNodeJsPath();

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vidsnap-dl-"));
  const outputTemplate = path.join(tmpDir, "%(title).80s-%(id)s.%(ext)s");

  // High-performance download flags
  const args: string[] = [
    "--no-playlist",
    "--no-warnings",
    "--socket-timeout",
    "15",
    "--retries",
    "2",
    "--fragment-retries",
    "3",
    "--concurrent-fragments",
    "16",
    "--buffer-size",
    "4096k",
    "--http-chunk-size",
    "10M",
    "--no-check-certificates",
    "--impersonate",
    "chrome",
    "--ffmpeg-location",
    "/usr/bin/ffmpeg",
    "--extractor-args",
    "youtube:player_client=ios,web,tv,mweb",
    "-o",
    outputTemplate,
  ];

  if (nodePath) {
    args.push("--js-runtimes", `node:${nodePath}`);
  }

  // Platform-specific headers
  if (platform === "douyin") {
    args.push("--add-header", "Referer:https://www.douyin.com/");
    args.push(
      "--add-header",
      "User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
  } else if (platform === "instagram") {
    args.push(
      "--add-header",
      "User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
  } else if (platform === "tiktok") {
    args.push(
      "--add-header",
      "User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
  }

  let expectedExt = "mp4";
  let mimeType = "video/mp4";

  if (type === "audio") {
    if (options.fastSpeech) {
      // Ultra-fast lightweight stream for AI speech processing (downloads in ~1 second)
      args.push(
        "-f",
        "ba[abr<=96]/ba[ext=m4a]/ba/bestaudio",
        "-x",
        "--audio-format",
        "mp3",
        "--audio-quality",
        "5"
      );
    } else {
      // High quality MP3 extraction with fast audio download
      args.push("-x", "--audio-format", "mp3", "--audio-quality", "0");
    }
    expectedExt = "mp3";
    mimeType = "audio/mpeg";
  } else if (type === "video-only") {
    // Fast silent video
    let f = "bestvideo";
    if (formatId && formatId !== "best") {
      if (formatId === "best-1080") f = "bestvideo[height<=1080]";
      else if (formatId === "best-720") f = "bestvideo[height<=720]";
      else if (formatId === "best-480") f = "bestvideo[height<=480]";
      else if (formatId === "best-360") f = "bestvideo[height<=360]";
      else f = formatId;
    }
    args.push("-f", f);
    expectedExt = "mp4";
    mimeType = "video/mp4";
  } else {
    // Video with audio merged: prefer direct mp4/m4a stream copy so ffmpeg muxes instantly in milliseconds
    let formatSelector = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best";
    if (formatId && formatId !== "best") {
      if (formatId === "best-1080") {
        formatSelector =
          "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]/best";
      } else if (formatId === "best-720") {
        formatSelector =
          "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio/best[height<=720]/best";
      } else if (formatId === "best-480") {
        formatSelector =
          "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=480]+bestaudio/best[height<=480]/best";
      } else if (formatId === "best-360") {
        formatSelector = "18/bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360]";
      } else {
        formatSelector = `${formatId}+bestaudio[ext=m4a]/bestaudio/best`;
      }
    }
    args.push("-f", formatSelector);
    args.push("--merge-output-format", "mp4");
    args.push("--postprocessor-args", "Merger:-c:v copy -c:a copy");
    expectedExt = "mp4";
    mimeType = "video/mp4";
  }

  args.push(cleanUrl);

  return new Promise((resolve, reject) => {
    const proc = spawn(ytDlpPath, args);

    let stderr = "";

    proc.stdout?.on("data", (chunk) => {
      const msg = chunk.toString();
      if (onProgress) onProgress(msg);
    });

    proc.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("error", async (err) => {
      cleanupDir(tmpDir);
      // Try multi-layer fallbacks
      try {
        const fb = await attemptFallbackDownloads(options, onProgress);
        return resolve(fb);
      } catch {
        reject(new Error(`Download process failed: ${err.message}`));
      }
    });

    proc.on("close", async (code) => {
      if (code !== 0) {
        cleanupDir(tmpDir);

        // Attempt multi-layer automatic fallbacks so user never sees an error
        try {
          const fbResult = await attemptFallbackDownloads(options, onProgress);
          return resolve(fbResult);
        } catch (fbErr: any) {
          const parsed = parseYtDlpError(stderr, detectPlatform(cleanUrl));
          const error: any = new Error(parsed.message || fbErr.message);
          error.code = parsed.code;
          return reject(error);
        }
      }

      // Find the generated file in tmpDir
      try {
        const files = fs.readdirSync(tmpDir);
        if (files.length === 0) {
          cleanupDir(tmpDir);
          // Try fallback
          const fb = await attemptFallbackDownloads(options, onProgress);
          return resolve(fb);
        }

        const downloadedFile = files[0];
        const filePath = path.join(tmpDir, downloadedFile);
        const fileName = sanitizeFileName(downloadedFile);

        resolve({
          filePath,
          fileName,
          mimeType,
          cleanup: () => cleanupDir(tmpDir),
        });
      } catch (err: any) {
        cleanupDir(tmpDir);
        try {
          const fb = await attemptFallbackDownloads(options, onProgress);
          return resolve(fb);
        } catch {
          reject(err);
        }
      }
    });
  });
}

// Multi-tier fallback orchestrator
async function attemptFallbackDownloads(
  options: DownloadOptions,
  onProgress?: (msg: string) => void
): Promise<{ filePath: string; fileName: string; mimeType: string; cleanup: () => void }> {
  const { url, type } = options;
  const cleanUrl = cleanVideoUrl(url);
  const platform = detectPlatform(cleanUrl);

  // Fallback 1: Multi-platform resolver (TikTok, Instagram, Facebook, Twitter)
  if (platform !== "youtube" && platform !== "youtube_shorts") {
    try {
      if (onProgress) onProgress("Running high-speed stream resolver fallback...");
      const btchInfo = await resolveWithBtch(cleanUrl, platform);
      if (btchInfo && btchInfo.formats.length > 0) {
        const chosen =
          type === "audio"
            ? btchInfo.formats.find((f) => f.type === "audio") || btchInfo.formats[0]
            : btchInfo.formats.find((f) => f.type === "video") || btchInfo.formats[0];

        if (chosen && chosen.id && !chosen.id.includes("ymcdn.org")) {
          const directUrl = chosen.id.slice(chosen.id.indexOf(":") + 1);
          return await downloadDirectMedia(
            directUrl,
            type === "audio" ? "mp3" : "mp4",
            sanitizeFileName(btchInfo.title),
            type === "audio"
          );
        }
      }
    } catch (err: any) {
      console.warn("Resolver fallback notice:", err.message);
    }
  }

  // Fallback 2: YouTube high-speed stream converter
  if (platform === "youtube" || platform === "youtube_shorts") {
    try {
      if (onProgress) onProgress("Connecting to YouTube stream converter...");
      return await downloadViaYouTubeResolver(options, onProgress);
    } catch (fbErr: any) {
      console.warn("YouTube resolver fallback failed:", fbErr.message);
    }
  }

  // Fallback 3: yt-dlp single-stream fallback (best available single stream without muxing)
  try {
    if (onProgress) onProgress("Trying single-stream fallback...");
    return await downloadSingleStreamYtDlp(options, onProgress);
  } catch (sErr: any) {
    console.warn("Single stream fallback error:", sErr.message);
  }

  // Fallback 4: Universal AIO stream resolver
  try {
    if (onProgress) onProgress("Attempting universal media converter...");
    const universalInfo = await resolveWithBtch(cleanUrl, "generic");
    if (universalInfo && universalInfo.formats.length > 0) {
      const chosen = universalInfo.formats.find((f) => !f.id.includes("ymcdn.org")) || universalInfo.formats[0];
      if (chosen && !chosen.id.includes("ymcdn.org")) {
        const directUrl = chosen.id.slice(chosen.id.indexOf(":") + 1);
        return await downloadDirectMedia(
          directUrl,
          type === "audio" ? "mp3" : "mp4",
          sanitizeFileName(universalInfo.title),
          type === "audio"
        );
      }
    }
  } catch (uErr: any) {
    console.warn("Universal fallback notice:", uErr.message);
  }

  throw new Error("Unable to download this video stream. The media may be private or deleted.");
}

// Helper: Download a single direct stream using yt-dlp without audio/video merge
async function downloadSingleStreamYtDlp(
  options: DownloadOptions,
  onProgress?: (msg: string) => void
): Promise<{ filePath: string; fileName: string; mimeType: string; cleanup: () => void }> {
  const { url, type } = options;
  const cleanUrl = cleanVideoUrl(url);
  const ytDlpPath = getYtDlpPath();
  const nodePath = getNodeJsPath();

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vidsnap-single-"));
  const outputTemplate = path.join(tmpDir, "%(title).80s-%(id)s.%(ext)s");

  const args: string[] = [
    "--no-playlist",
    "--no-warnings",
    "--socket-timeout",
    "20",
    "--retries",
    "2",
    "--impersonate",
    "chrome",
    "--ffmpeg-location",
    "/usr/bin/ffmpeg",
    "--extractor-args",
    "youtube:player_client=ios,web,tv,mweb",
    "-o",
    outputTemplate,
  ];

  if (nodePath) {
    args.push("--js-runtimes", `node:${nodePath}`);
  }

  if (type === "audio") {
    args.push("-f", "ba/b", "-x", "--audio-format", "mp3");
  } else {
    args.push("-f", "b/best/worst");
  }

  args.push(cleanUrl);

  return new Promise((resolve, reject) => {
    const proc = spawn(ytDlpPath, args);

    proc.stdout?.on("data", (chunk) => {
      if (onProgress) onProgress(chunk.toString());
    });

    proc.on("error", (err) => {
      cleanupDir(tmpDir);
      reject(err);
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        cleanupDir(tmpDir);
        return reject(new Error("Single stream download failed"));
      }

      const files = fs.readdirSync(tmpDir);
      if (files.length === 0) {
        cleanupDir(tmpDir);
        return reject(new Error("No file produced"));
      }

      const file = files[0];
      const filePath = path.join(tmpDir, file);
      const isAudio = type === "audio" || file.endsWith(".mp3");

      resolve({
        filePath,
        fileName: sanitizeFileName(file),
        mimeType: isAudio ? "audio/mpeg" : "video/mp4",
        cleanup: () => cleanupDir(tmpDir),
      });
    });
  });
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function cleanupDir(dirPath: string) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch {
    // Ignore cleanup errors
  }
}
