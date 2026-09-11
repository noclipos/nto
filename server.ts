import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { fetchVideoInfo, executeDownload, cleanVideoUrl, detectPlatform, getYtDlpPath } from "./server/ytdlp";
import {
  processAudioFile,
  getGeminiClient,
  extractSubtitlesFromVideo,
  cleanGeminiErrorMessage,
  generateTextWithFallback,
} from "./server/gemini";

const app = express();
const PORT = 3000;

// Initialize yt-dlp binary permissions on start
try {
  getYtDlpPath();
} catch {}

// Middleware for parsing JSON and urlencoded data
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Configure Multer for disk storage uploads in temporary directory
const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const tmpUploadDir = path.join(os.tmpdir(), "vidsnap-uploads");
    if (!fs.existsSync(tmpUploadDir)) {
      fs.mkdirSync(tmpUploadDir, { recursive: true });
    }
    cb(null, tmpUploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || ".mp4";
    cb(null, `upload-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    // 500MB max file size
    fileSize: 500 * 1024 * 1024,
  },
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "VidSnap API", time: new Date().toISOString() });
});

// 1. POST /api/video/info
app.post("/api/video/info", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "A valid video URL is required" });
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
      return res.status(400).json({ error: "URL must start with http:// or https://" });
    }

    const info = await fetchVideoInfo(trimmedUrl);
    res.json(info);
  } catch (err: any) {
    console.error("Video info error:", err.message);
    res.status(400).json({
      error: err.message || "Failed to retrieve video details",
      code: err.code || "FETCH_FAILED",
      platform: err.platform || null,
    });
  }
});

// 2. POST & GET /api/video/download
const handleDownloadRequest = async (req: express.Request, res: express.Response) => {
  let downloadResult: { filePath: string; fileName: string; mimeType: string; cleanup: () => void } | null = null;
  try {
    const url = req.method === "POST" ? req.body.url : req.query.url;
    const formatId = req.method === "POST" ? req.body.formatId : req.query.formatId;
    const type = req.method === "POST" ? req.body.type : req.query.type;
    const quality = req.method === "POST" ? req.body.quality : req.query.quality;
    const title = req.method === "POST" ? req.body.title : req.query.title;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }

    downloadResult = await executeDownload({
      url,
      formatId: formatId ? String(formatId) : undefined,
      type: type === "audio" ? "audio" : type === "video-only" ? "video-only" : "video",
      quality: quality ? String(quality) : undefined,
      title: title ? String(title) : undefined,
    });

    const stat = fs.statSync(downloadResult.filePath);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${downloadResult.fileName.replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(downloadResult.fileName)}`
    );
    res.setHeader("Content-Type", downloadResult.mimeType);
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Accept-Ranges", "bytes");

    const fileStream = fs.createReadStream(downloadResult.filePath);
    fileStream.pipe(res);

    fileStream.on("end", () => {
      downloadResult?.cleanup();
    });

    fileStream.on("error", (streamErr) => {
      console.error("File stream error:", streamErr);
      downloadResult?.cleanup();
    });

    res.on("close", () => {
      downloadResult?.cleanup();
    });
  } catch (err: any) {
    console.error("Download error:", err.message);
    if (downloadResult) {
      downloadResult.cleanup();
    }
    if (!res.headersSent) {
      res.status(400).json({
        error: err.message || "Failed to process download",
        code: err.code || "DOWNLOAD_FAILED",
      });
    }
  }
};

app.post("/api/video/download", handleDownloadRequest);
app.get("/api/video/download", handleDownloadRequest);

// 3. POST /api/video/transcript
app.post("/api/video/transcript", async (req, res) => {
  let downloadResult: { filePath: string; fileName: string; mimeType: string; cleanup: () => void } | null = null;
  try {
    const { url, language } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Video URL is required" });
    }

    const targetLang = language || "en";

    // Fast-path: Check for native/auto-generated captions first (very fast, zero quota usage)
    try {
      const directSub = await extractSubtitlesFromVideo(url, targetLang);
      if (directSub && directSub.text && directSub.text.trim().length > 30) {
        return res.json(directSub);
      }
    } catch (subErr) {
      console.warn("Subtitle extraction fast-path skipped, proceeding with audio transcription:", subErr);
    }

    // Step 1: Download speech-optimized audio with high-speed stream resolver
    downloadResult = await executeDownload({
      url,
      type: "audio",
      fastSpeech: true,
    });

    // Step 2: Transcribe and translate with multi-tier Gemini AI models
    const result = await processAudioFile(downloadResult.filePath, targetLang);
    res.json(result);
  } catch (err: any) {
    console.error("Transcript extraction error:", err.message || err);
    const friendlyError = cleanGeminiErrorMessage(err);
    res.status(400).json({
      error: friendlyError,
      code: err.code || "TRANSCRIPT_FAILED",
    });
  } finally {
    if (downloadResult) {
      downloadResult.cleanup();
    }
  }
});

// 4. POST /api/video/upload-transcript
app.post("/api/video/upload-transcript", upload.single("file"), async (req, res) => {
  const file = req.file;
  const language = req.body.language || "en";

  if (!file) {
    return res.status(400).json({ error: "No file was uploaded" });
  }

  const uploadedPath = file.path;

  try {
    const result = await processAudioFile(uploadedPath, language);
    res.json(result);
  } catch (err: any) {
    console.error("Upload transcript error:", err.message || err);
    const friendlyError = cleanGeminiErrorMessage(err);
    res.status(500).json({
      error: friendlyError,
      code: "UPLOAD_TRANSCRIPTION_FAILED",
    });
  } finally {
    // Clean uploaded file
    try {
      if (fs.existsSync(uploadedPath)) {
        fs.unlinkSync(uploadedPath);
      }
    } catch {
      // Ignore
    }
  }
});

// 5. AI Tool: Summarize content with model fallback
app.post("/api/ai/summarize", async (req, res) => {
  try {
    const { text, language } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text content is required" });
    }

    const langName = language === "ar" ? "Arabic" : language === "fr" ? "French" : "English";
    const prompt = `Provide an executive summary and key takeaways of the following transcript. Format with bullet points in ${langName}:\n\n${text.slice(0, 8000)}`;

    const summary = await generateTextWithFallback(prompt);
    res.json({ summary });
  } catch (err: any) {
    console.error("Summarization error:", err.message || err);
    res.status(500).json({ error: cleanGeminiErrorMessage(err) });
  }
});

// 6. AI Tool: Khaleeji dialect adaptation with model fallback
app.post("/api/ai/khaleeji", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text content is required" });
    }

    const prompt = `Convert the following text or dialogue into authentic Gulf Arabic dialect (اللهجة الخليجية البيضاء المعاصرة). Preserve natural conversational tone and meaning:\n\n${text.slice(0, 4000)}`;

    const result = await generateTextWithFallback(prompt);
    res.json({ result });
  } catch (err: any) {
    console.error("Dialect adaptation error:", err.message || err);
    res.status(500).json({ error: cleanGeminiErrorMessage(err) });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VidSnap Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
