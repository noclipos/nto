import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import * as btch from "btch-downloader";
import type { VideoInfoResult, VideoFormatOption } from "./ytdlp";

// Check if a URL points directly to a raw video or audio file
export function isDirectMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();
    const directExtensions = [
      ".mp4",
      ".m4v",
      ".webm",
      ".mov",
      ".mkv",
      ".avi",
      ".flv",
      ".wmv",
      ".mp3",
      ".wav",
      ".m4a",
      ".aac",
      ".ogg",
      ".opus",
    ];
    return directExtensions.some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

// Extract filename from URL safely
function getFilenameFromUrl(url: string, defaultName = "video"): string {
  try {
    const parsed = new URL(url);
    const basename = path.basename(parsed.pathname);
    if (basename && basename.length > 2 && basename.includes(".")) {
      return basename.split("?")[0].replace(/[^a-zA-Z0-9._-]/g, "_");
    }
  } catch {
    // fallback
  }
  return defaultName;
}

// Instant info extraction for direct media URLs
export async function fetchDirectMediaInfo(url: string): Promise<VideoInfoResult> {
  const isAudio = /\.(mp3|wav|m4a|aac|ogg|opus)(\?.*)?$/i.test(url);
  const rawFileName = getFilenameFromUrl(url, isAudio ? "audio_track" : "video_clip");
  const title = rawFileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || "Direct Media Stream";

  let filesize: number | null = null;
  try {
    const headRes = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(6000) });
    const cl = headRes.headers.get("content-length");
    if (cl) filesize = parseInt(cl, 10);
  } catch {
    // Head request might be forbidden, continue
  }

  const formats: VideoFormatOption[] = isAudio
    ? [
        {
          id: `direct:${url}`,
          label: "Original Audio Track",
          quality: "audio",
          type: "audio",
          ext: "mp3",
          filesize,
          needsMerge: false,
          videoOnly: false,
        },
      ]
    : [
        {
          id: `direct:${url}`,
          label: "Direct Full Quality (Original MP4)",
          quality: "1080p",
          type: "video",
          ext: "mp4",
          filesize,
          needsMerge: false,
          videoOnly: false,
          height: 1080,
          width: 1920,
        },
        {
          id: `direct_audio:${url}`,
          label: "Extract Audio (MP3 320kbps)",
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
    thumbnail: "",
    platform: "direct_stream",
    duration: 0,
    formats,
    url,
    description: "Direct high-speed media stream ready for instant download.",
    uploader: "Direct Link",
  };
}

// Check if a URL belongs to a known blocked/offline domain
function isBlockedDomain(targetUrl: string): boolean {
  if (!targetUrl) return true;
  return targetUrl.includes("ymcdn.org") || targetUrl.includes("localhost");
}

// Download directly from an HTTP URL and save to a temporary file
export async function downloadDirectMedia(
  url: string,
  preferredExt = "mp4",
  title = "media_download",
  asAudioOnly = false
): Promise<{ filePath: string; fileName: string; mimeType: string; cleanup: () => void }> {
  if (!url || isBlockedDomain(url)) {
    throw new Error("Stream domain is legally restricted or unavailable (HTTP 451)");
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vidsnap-direct-"));
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
  const rawDownloadedPath = path.join(tmpDir, `raw_${Date.now()}.${preferredExt}`);

  let downloadSucceeded = false;
  let lastStatus = 0;

  // 1. First attempt: Direct fetch with browser headers
  try {
    let referer = "https://www.google.com/";
    try {
      const parsedUrl = new URL(url);
      referer = `${parsedUrl.protocol}//${parsedUrl.host}/`;
    } catch {}

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: referer,
      },
      signal: AbortSignal.timeout(60000), // 1 min timeout
    });

    lastStatus = res.status;
    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      if (arrayBuf.byteLength > 1024) {
        fs.writeFileSync(rawDownloadedPath, Buffer.from(arrayBuf));
        downloadSucceeded = true;
      }
    }
  } catch (fetchErr: any) {
    console.warn("Direct fetch attempt failed:", fetchErr.message);
  }

  // 2. Second attempt: curl fallback for stubborn CDNs or TLS/geo variations
  if (!downloadSucceeded) {
    try {
      await new Promise<void>((resolve, reject) => {
        let referer = "https://www.google.com/";
        try {
          const parsedUrl = new URL(url);
          referer = `${parsedUrl.protocol}//${parsedUrl.host}/`;
        } catch {}

        const curlArgs = [
          "-L",
          "-s",
          "-S",
          "-k",
          "--max-time",
          "60",
          "-A",
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "-e",
          referer,
          "-o",
          rawDownloadedPath,
          url,
        ];
        const proc = spawn("/usr/bin/curl", curlArgs);
        proc.on("close", (code) => {
          if (code === 0 && fs.existsSync(rawDownloadedPath) && fs.statSync(rawDownloadedPath).size > 1024) {
            downloadSucceeded = true;
            resolve();
          } else {
            reject(new Error(`curl exited with code ${code}`));
          }
        });
        proc.on("error", reject);
      });
    } catch (curlErr: any) {
      console.warn("curl direct download fallback failed:", curlErr.message);
    }
  }

  if (!downloadSucceeded || !fs.existsSync(rawDownloadedPath)) {
    cleanupDir(tmpDir);
    throw new Error(`Failed to download stream payload (HTTP ${lastStatus || 451})`);
  }

  // If audio was specifically requested from a video payload
  if (asAudioOnly && preferredExt !== "mp3") {
    const mp3Path = path.join(tmpDir, `${sanitizedTitle}.mp3`);
    try {
      await convertToMp3(rawDownloadedPath, mp3Path);
      return {
        filePath: mp3Path,
        fileName: `${sanitizedTitle}.mp3`,
        mimeType: "audio/mpeg",
        cleanup: () => cleanupDir(tmpDir),
      };
    } catch {
      // If ffmpeg conversion fails, return original file
    }
  }

  const finalExt = asAudioOnly ? "mp3" : preferredExt;
  const finalFileName = `${sanitizedTitle}.${finalExt}`;
  const finalFilePath = path.join(tmpDir, finalFileName);

  if (rawDownloadedPath !== finalFilePath) {
    fs.renameSync(rawDownloadedPath, finalFilePath);
  }

  return {
    filePath: finalFilePath,
    fileName: finalFileName,
    mimeType: asAudioOnly ? "audio/mpeg" : `video/${finalExt === "mp4" ? "mp4" : "webm"}`,
    cleanup: () => cleanupDir(tmpDir),
  };
}

// Convert video file to MP3 using ffmpeg
function convertToMp3(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpegPath = fs.existsSync("/usr/bin/ffmpeg") ? "/usr/bin/ffmpeg" : "ffmpeg";
    const proc = spawn(ffmpegPath, [
      "-y",
      "-i",
      inputPath,
      "-vn",
      "-acodec",
      "libmp3lame",
      "-b:a",
      "320k",
      outputPath,
    ]);

    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exit code: ${code}`));
      }
    });
  });
}

function cleanupDir(dirPath: string) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch {}
}

// Multi-platform resolver using btch-downloader
export async function resolveWithBtch(url: string, platform: string): Promise<VideoInfoResult | null> {
  try {
    // 1. TikTok
    if (platform === "tiktok") {
      const res = await (btch as any).ttdl(url);
      if (res && res.status && res.video && res.video.length > 0) {
        const title = res.title || "TikTok Video";
        const videoUrl = res.video[0];
        const audioUrl = res.audio && res.audio.length > 0 ? res.audio[0] : null;

        const formats: VideoFormatOption[] = [
          {
            id: `btch_video:${videoUrl}`,
            label: "Full HD / No Watermark (MP4)",
            quality: "1080p",
            type: "video",
            ext: "mp4",
            filesize: null,
            needsMerge: false,
            videoOnly: false,
            height: 1080,
            width: 1920,
          },
        ];

        if (audioUrl) {
          formats.push({
            id: `btch_audio:${audioUrl}`,
            label: "Original Audio (MP3)",
            quality: "audio",
            type: "audio",
            ext: "mp3",
            filesize: null,
            needsMerge: false,
            videoOnly: false,
          });
        }

        return {
          title,
          thumbnail: res.thumbnail || "",
          platform: "tiktok",
          duration: 0,
          formats,
          url,
          description: "Watermark-free TikTok video ready for instant download.",
          uploader: "TikTok Creator",
        };
      }
    }

    // 2. Instagram
    if (platform === "instagram") {
      const res = await (btch as any).igdl(url);
      if (res && res.status && res.result && res.result.length > 0) {
        const videoItem = res.result.find((i: any) => i.url && i.url.includes(".mp4")) || res.result[0];
        if (videoItem && videoItem.url) {
          const formats: VideoFormatOption[] = [
            {
              id: `btch_video:${videoItem.url}`,
              label: "High Definition / Original (MP4)",
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
              id: `btch_audio:${videoItem.url}`,
              label: "Audio Track (MP3 320kbps)",
              quality: "audio",
              type: "audio",
              ext: "mp3",
              filesize: null,
              needsMerge: false,
              videoOnly: false,
            },
          ];

          return {
            title: "Instagram Reel / Video",
            thumbnail: videoItem.thumbnail || "",
            platform: "instagram",
            duration: 0,
            formats,
            url,
            description: "Instagram high-definition media ready for instant download.",
            uploader: "Instagram Creator",
          };
        }
      }
    }

    // 3. YouTube
    if (platform === "youtube" || platform === "youtube_shorts") {
      const res = await (btch as any).youtube(url);
      if (res && res.status && (res.mp4 || res.mp3)) {
        const formats: VideoFormatOption[] = [];
        if (res.mp4 && !isBlockedDomain(res.mp4)) {
          formats.push({
            id: `btch_video:${res.mp4}`,
            label: "Full Quality / 1080p (MP4)",
            quality: "1080p",
            type: "video",
            ext: "mp4",
            filesize: null,
            needsMerge: false,
            videoOnly: false,
            height: 1080,
            width: 1920,
          });
          formats.push({
            id: `btch_video_720:${res.mp4}`,
            label: "HD Quality / 720p (MP4)",
            quality: "720p",
            type: "video",
            ext: "mp4",
            filesize: null,
            needsMerge: false,
            videoOnly: false,
            height: 720,
            width: 1280,
          });
        }
        if (res.mp3 && !isBlockedDomain(res.mp3)) {
          formats.push({
            id: `btch_audio:${res.mp3}`,
            label: "High Quality Audio (MP3 320kbps)",
            quality: "audio",
            type: "audio",
            ext: "mp3",
            filesize: null,
            needsMerge: false,
            videoOnly: false,
          });
        }

        if (formats.length > 0) {
          return {
            title: res.title || "YouTube Video",
            thumbnail: res.thumbnail || "",
            platform,
            duration: 0,
            formats,
            url,
            description: `YouTube video by ${res.author || "Creator"}.`,
            uploader: res.author || "YouTube Creator",
          };
        }
      }
    }

    // 4. Facebook
    if (platform === "facebook") {
      const res = await (btch as any).fbdown(url);
      if (res && res.status && (res.HD || res.Normal_video)) {
        const hdUrl = res.HD || res.Normal_video;
        const sdUrl = res.Normal_video || res.HD;

        const formats: VideoFormatOption[] = [
          {
            id: `btch_video:${hdUrl}`,
            label: "Facebook HD Quality (MP4)",
            quality: "1080p",
            type: "video",
            ext: "mp4",
            filesize: null,
            needsMerge: false,
            videoOnly: false,
            height: 1080,
            width: 1920,
          },
        ];

        if (sdUrl && sdUrl !== hdUrl) {
          formats.push({
            id: `btch_video_sd:${sdUrl}`,
            label: "Facebook SD Quality (MP4)",
            quality: "480p",
            type: "video",
            ext: "mp4",
            filesize: null,
            needsMerge: false,
            videoOnly: false,
            height: 480,
            width: 854,
          });
        }

        formats.push({
          id: `btch_audio:${hdUrl}`,
          label: "Extract Audio (MP3 320kbps)",
          quality: "audio",
          type: "audio",
          ext: "mp3",
          filesize: null,
          needsMerge: false,
          videoOnly: false,
        });

        return {
          title: "Facebook Video",
          thumbnail: "",
          platform: "facebook",
          duration: 0,
          formats,
          url,
          description: "Facebook media ready for download.",
          uploader: "Facebook User",
        };
      }
    }

    // 5. Twitter / X
    if (platform === "twitter") {
      const res = await (btch as any).twitter(url);
      if (res && res.status && res.url) {
        const videoUrl = Array.isArray(res.url) ? res.url[0] : res.url;
        const formats: VideoFormatOption[] = [
          {
            id: `btch_video:${videoUrl}`,
            label: "Original Video (MP4)",
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
            id: `btch_audio:${videoUrl}`,
            label: "Extract Audio (MP3)",
            quality: "audio",
            type: "audio",
            ext: "mp3",
            filesize: null,
            needsMerge: false,
            videoOnly: false,
          },
        ];

        return {
          title: res.title || "Twitter / X Video",
          thumbnail: "",
          platform: "twitter",
          duration: 0,
          formats,
          url,
          description: "Twitter / X video ready for download.",
          uploader: "Twitter Creator",
        };
      }
    }

    // 6. Generic All-in-one fallback (btch.aio)
    const aioRes = await (btch as any).aio(url);
    if (aioRes && aioRes.status && aioRes.result) {
      const mediaUrl =
        aioRes.result.url ||
        aioRes.result.video ||
        (Array.isArray(aioRes.result) ? aioRes.result[0]?.url : null);
      if (mediaUrl && !isBlockedDomain(mediaUrl)) {
        return {
          title: aioRes.result.title || "Universal Media Video",
          thumbnail: aioRes.result.thumbnail || "",
          platform: "generic",
          duration: 0,
          formats: [
            {
              id: `btch_video:${mediaUrl}`,
              label: "Universal Video Stream (MP4)",
              quality: "720p",
              type: "video",
              ext: "mp4",
              filesize: null,
              needsMerge: false,
              videoOnly: false,
            },
            {
              id: `btch_audio:${mediaUrl}`,
              label: "Audio Track (MP3)",
              quality: "audio",
              type: "audio",
              ext: "mp3",
              filesize: null,
              needsMerge: false,
              videoOnly: false,
            },
          ],
          url,
          description: "Media extracted via universal stream resolver.",
          uploader: "Media Creator",
        };
      }
    }
  } catch (err: any) {
    console.warn("btchResolver error:", err.message);
  }

  return null;
}
