import { GoogleGenAI } from "@google/genai";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { getYtDlpPath } from "./ytdlp";

// Lazy initialization of Gemini client
let genAIInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!genAIInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    genAIInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIInstance;
}

// Convert any input video or audio file to mono 16kHz MP3 using FFmpeg
export async function convertAudioWithFfmpeg(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpegArgs = [
      "-y",
      "-threads",
      "0",
      "-i",
      inputPath,
      "-vn", // disable video
      "-ac",
      "1", // mono
      "-ar",
      "16000", // 16kHz speech standard
      "-b:a",
      "48k", // 48kbps compact speech mp3
      "-preset",
      "ultrafast",
      outputPath,
    ];

    const proc = spawn("ffmpeg", ffmpegArgs);
    let stderr = "";

    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      reject(new Error(`FFmpeg error: ${err.message}`));
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`FFmpeg conversion failed: ${stderr.slice(-300)}`));
      }
      resolve();
    });
  });
}

// Split audio into chunks if larger than maxBytes (e.g. 15MB)
export async function splitAudioIntoChunks(audioPath: string, chunkDurationSec: number = 900): Promise<string[]> {
  const stats = fs.statSync(audioPath);
  const CHUNK_SIZE_THRESHOLD = 18 * 1024 * 1024; // 18MB

  if (stats.size <= CHUNK_SIZE_THRESHOLD) {
    return [audioPath];
  }

  const dir = path.dirname(audioPath);
  const baseName = path.basename(audioPath, path.extname(audioPath));
  const pattern = path.join(dir, `${baseName}_chunk_%03d.mp3`);

  return new Promise((resolve, reject) => {
    const args = [
      "-y",
      "-i",
      audioPath,
      "-f",
      "segment",
      "-segment_time",
      String(chunkDurationSec),
      "-c",
      "copy",
      pattern,
    ];

    const proc = spawn("ffmpeg", args);
    let stderr = "";

    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Audio splitting failed: ${stderr.slice(-300)}`));
      }

      // Collect produced chunk files
      const allFiles = fs.readdirSync(dir);
      const chunkFiles = allFiles
        .filter((f) => f.startsWith(`${baseName}_chunk_`) && f.endsWith(".mp3"))
        .sort()
        .map((f) => path.join(dir, f));

      if (chunkFiles.length === 0) {
        resolve([audioPath]);
      } else {
        resolve(chunkFiles);
      }
    });
  });
}

// Helper: Sleep utility for exponential backoff
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Detect transient Gemini errors (such as 503 high demand/UNAVAILABLE, 429 rate limit, network timeouts)
export function isTransientGeminiError(err: any): boolean {
  if (!err) return false;
  const msg = typeof err === "string" ? err : err.message || JSON.stringify(err);
  return (
    msg.includes("503") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("high demand") ||
    msg.includes("temporary") ||
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("quota") ||
    msg.includes("timeout") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("ECONNRESET") ||
    msg.includes("FetchError")
  );
}

// Sanitize Gemini error messages into clear, user-friendly text
export function cleanGeminiErrorMessage(err: any): string {
  if (!err) return "Transcript extraction could not be completed.";
  const rawMsg = typeof err === "string" ? err : err.message || String(err);

  // Try parsing JSON error if returned as stringified object
  try {
    const parsed = JSON.parse(rawMsg);
    if (parsed.error?.code === 503 || parsed.error?.status === "UNAVAILABLE") {
      return "The AI transcription service is experiencing high demand. Please try again shortly.";
    }
    if (parsed.error?.code === 429) {
      return "Transcription rate limit reached. Please wait a moment and try again.";
    }
    if (parsed.error?.message) {
      return parsed.error.message;
    }
  } catch {
    // Not JSON
  }

  if (rawMsg.includes("503") || rawMsg.includes("UNAVAILABLE") || rawMsg.includes("high demand")) {
    return "The AI transcription service is experiencing high demand. Please try again shortly.";
  }
  if (rawMsg.includes("429") || rawMsg.includes("RESOURCE_EXHAUSTED")) {
    return "Transcription rate limit reached. Please wait a moment and try again.";
  }
  if (rawMsg.includes("GEMINI_API_KEY")) {
    return "Gemini API key is missing or invalid. Please check your configuration.";
  }

  return rawMsg.replace(/^Error:\s*/, "");
}

// Clean and format VTT/SRT subtitles into human-readable paragraphs
export function parseVttToCleanText(vtt: string): string {
  const lines = vtt.split(/\r?\n/);
  const seen = new Set<string>();
  const sentences: string[] = [];

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (
      !line ||
      line.startsWith("WEBVTT") ||
      line.startsWith("Kind:") ||
      line.startsWith("Language:") ||
      line.includes("-->") ||
      /^\d+$/.test(line)
    ) {
      continue;
    }

    // Strip inline formatting or timing tags (e.g. <00:00:19.039><c> or </c>)
    line = line.replace(/<[^>]+>/g, "").trim();
    if (!line) continue;

    // Filter duplicate lines commonly present in auto-generated captions
    if (!seen.has(line)) {
      seen.add(line);
      sentences.push(line);
    }
  }

  if (sentences.length === 0) return "";

  // Group into readable paragraphs
  const paragraphs: string[] = [];
  let currentPara: string[] = [];

  for (const s of sentences) {
    currentPara.push(s);
    const endsWithTerminal = s.endsWith(".") || s.endsWith("!") || s.endsWith("?");
    if (currentPara.length >= 4 && endsWithTerminal) {
      paragraphs.push(currentPara.join(" "));
      currentPara = [];
    } else if (currentPara.length >= 8) {
      paragraphs.push(currentPara.join(" "));
      currentPara = [];
    }
  }

  if (currentPara.length > 0) {
    paragraphs.push(currentPara.join(" "));
  }

  return paragraphs.join("\n\n");
}

// Fast direct subtitle extractor for YouTube and supported video platforms
export async function extractSubtitlesFromVideo(
  url: string,
  targetLanguage: string = "en"
): Promise<{ text: string; language: string; sourceLanguage: string } | null> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vidsnap-sub-"));
  try {
    const ytDlpPath = getYtDlpPath();
    const outTemplate = path.join(tmpDir, "sub");
    const langPattern =
      targetLanguage && targetLanguage !== "auto" && targetLanguage !== "original"
        ? `${targetLanguage},${targetLanguage}-orig,en,en-orig,en-US`
        : "en,en-orig,en-US,all";

    const args = [
      "--skip-download",
      "--no-playlist",
      "--socket-timeout",
      "5",
      "--extractor-retries",
      "1",
      "--write-auto-sub",
      "--write-sub",
      "--sub-lang",
      langPattern,
      "--sub-format",
      "vtt/srt/best",
      "--no-warnings",
      "--no-check-certificates",
      "--extractor-args",
      "youtube:player_client=android,web",
      "-o",
      outTemplate,
      url,
    ];

    await new Promise<void>((resolve) => {
      const proc = spawn(ytDlpPath, args, { timeout: 8000 });
      proc.on("close", () => resolve());
      proc.on("error", () => resolve());
    });

    const files = fs.readdirSync(tmpDir).filter((f) => f.endsWith(".vtt") || f.endsWith(".srt"));
    if (files.length === 0) {
      return null;
    }

    // Pick best matching subtitle file
    const matchedFile =
      files.find((f) => f.includes(`.${targetLanguage}.`)) ||
      files.find((f) => f.includes(".en.")) ||
      files[0];

    const content = fs.readFileSync(path.join(tmpDir, matchedFile), "utf-8");
    const rawCleanText = parseVttToCleanText(content);

    if (!rawCleanText || rawCleanText.length < 30) {
      return null;
    }

    let finalText = rawCleanText;
    const isTargetLangMatched = matchedFile.includes(`.${targetLanguage}.`);

    if (!isTargetLangMatched && targetLanguage && targetLanguage !== "auto" && targetLanguage !== "original") {
      finalText = await translateTranscript(rawCleanText, targetLanguage);
    }

    return {
      text: finalText,
      language: targetLanguage,
      sourceLanguage: "captions",
    };
  } catch (err) {
    console.warn("Fast subtitle extraction error, falling back to audio:", err);
    return null;
  } finally {
    try {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch {}
  }
}

// Transcribe a single audio file chunk using multi-tier models and exponential backoff
export async function transcribeAudioChunk(
  chunkPath: string,
  targetLanguage: string = "auto"
): Promise<{ text: string; detectedLanguage?: string }> {
  const ai = getGeminiClient();
  const fileBuffer = fs.readFileSync(chunkPath);
  const base64Audio = fileBuffer.toString("base64");

  // Multi-tier model cascade for speech transcription:
  // Prioritize gemini-3.5-flash-lite for instant ~1s response times
  const models = [
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-3.5-transcribe",
  ];

  const languageMap: Record<string, string> = {
    en: "English",
    ar: "Arabic (الفصحى)",
    fr: "French (Français)",
    es: "Spanish (Español)",
    de: "German (Deutsch)",
    zh: "Simplified Chinese (中文)",
    ja: "Japanese (日本語)",
    it: "Italian (Italiano)",
    pt: "Portuguese (Português)",
    ru: "Russian (Русский)",
    tr: "Turkish (Türkçe)",
    hi: "Hindi (हिन्दी)",
    ur: "Urdu (اردو)",
    ko: "Korean (한국어)",
  };

  const isTranslating = targetLanguage && targetLanguage !== "auto" && targetLanguage !== "original";
  const targetLangName = isTranslating ? languageMap[targetLanguage] || targetLanguage : "";

  // Single-pass optimization: Transcribe & translate simultaneously in 1 model call
  const promptText = isTranslating
    ? `Transcribe and translate the speech in this audio directly into ${targetLangName}. Preserve natural paragraph breaks and timestamps if identifiable. Return only the translated transcription text without any additional commentary or intro.`
    : `Please transcribe the speech in this audio accurately. Transcribe in the original spoken language. Preserve natural paragraph breaks and timestamps if identifiable. Return only the transcription text.`;

  let lastError: any = null;

  for (let mIdx = 0; mIdx < models.length; mIdx++) {
    const model = models[mIdx];
    const maxRetries = 1;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                mimeType: "audio/mp3",
                data: base64Audio,
              },
            },
            {
              text: promptText,
            },
          ],
        });

        const text = response.text?.trim() || "";
        if (text) {
          return { text };
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = typeof err === "string" ? err : err?.message || JSON.stringify(err);
        const isHighDemand =
          errMsg.includes("503") ||
          errMsg.includes("high demand") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("temporary");

        console.warn(
          `[Gemini Transcription] Model ${model} encountered notice:`,
          err?.message || err
        );

        // If this model is experiencing high demand (503/UNAVAILABLE), immediately failover to next model
        if (isHighDemand) {
          break;
        }

        if (isTransientGeminiError(err) && attempt < maxRetries) {
          await sleep(600);
          continue;
        }

        // Move to the next model in cascade
        break;
      }
    }
  }

  // If all models failed, throw clean user-friendly error
  const sanitizedMessage = cleanGeminiErrorMessage(lastError);
  throw new Error(sanitizedMessage);
}

// Translate transcript text into target language using multi-tier models
export async function translateTranscript(
  text: string,
  targetLanguage: string
): Promise<string> {
  if (!text || !text.trim()) return "";
  if (targetLanguage === "auto" || targetLanguage === "original") {
    return text;
  }

  const ai = getGeminiClient();

  const languageMap: Record<string, string> = {
    en: "English",
    ar: "Arabic (Modern Standard / الفصحى)",
    fr: "French",
    es: "Spanish",
    de: "German",
    zh: "Simplified Chinese",
    ja: "Japanese",
    it: "Italian",
    pt: "Portuguese",
    ru: "Russian",
    tr: "Turkish",
    hi: "Hindi",
    ur: "Urdu",
    ko: "Korean",
  };

  const targetLangName = languageMap[targetLanguage] || targetLanguage;

  // Split into chunks if text is long (> 3000 characters)
  const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 0);
  const textChunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    if (currentChunk.length + para.length > 3000) {
      textChunks.push(currentChunk);
      currentChunk = para;
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
    }
  }
  if (currentChunk) {
    textChunks.push(currentChunk);
  }

  const translationModels = [
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
  ];
  const translatedChunks: string[] = [];

  for (const chunk of textChunks) {
    const prompt = `Translate the transcript into the requested target language (${targetLangName}). Preserve meaning, names, numbers, formatting, paragraph order, and timestamps if available. Return only the translation without commentary or intro.\n\nTranscript:\n${chunk}`;

    let chunkTranslated = "";

    for (let mIdx = 0; mIdx < translationModels.length; mIdx++) {
      const model = translationModels[mIdx];
      const maxRetries = 1;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
          });

          const translated = response.text?.trim();
          if (translated) {
            chunkTranslated = translated;
            break;
          }
        } catch (err: any) {
          const errMsg = typeof err === "string" ? err : err?.message || JSON.stringify(err);
          const isHighDemand =
            errMsg.includes("503") ||
            errMsg.includes("high demand") ||
            errMsg.includes("UNAVAILABLE");

          console.warn(`[Gemini Translation] Model ${model} notice:`, err?.message || err);
          if (isHighDemand) {
            break; // Failover immediately to next model
          }

          if (isTransientGeminiError(err) && attempt < maxRetries) {
            await sleep(600);
            continue;
          }
          break;
        }
      }

      if (chunkTranslated) {
        break;
      }
    }

    translatedChunks.push(chunkTranslated || chunk);
  }

  return translatedChunks.join("\n\n");
}

// Full audio transcription & translation pipeline with extreme speedup
export async function processAudioFile(
  inputFilePath: string,
  targetLanguage: string,
  onProgress?: (step: string) => void
): Promise<{ text: string; language: string; sourceLanguage: string }> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vidsnap-ai-"));
  const convertedMp3 = path.join(tmpDir, "converted_audio.mp3");

  try {
    const ext = path.extname(inputFilePath).toLowerCase();
    const stats = fs.statSync(inputFilePath);
    let readyAudioPath = convertedMp3;

    // Fast-path: If the file is already a compact MP3 (<= 18MB), use it directly without re-encoding!
    if (ext === ".mp3" && stats.size <= 18 * 1024 * 1024) {
      readyAudioPath = inputFilePath;
    } else {
      if (onProgress) onProgress("Extracting speech audio");
      await convertAudioWithFfmpeg(inputFilePath, convertedMp3);
    }

    const chunks = await splitAudioIntoChunks(readyAudioPath, 900); // 15-minute segments

    if (onProgress) {
      onProgress(chunks.length > 1 ? `Transcribing ${chunks.length} parts in parallel with Turbo AI...` : "Transcribing speech with Turbo AI...");
    }

    // Parallel transcription across chunks with single-pass translation
    const chunkResults = await Promise.all(
      chunks.map((chunkPath, idx) =>
        transcribeAudioChunk(chunkPath, targetLanguage)
          .then((res) => ({ idx, text: res.text }))
          .catch((err) => {
            console.warn(`Parallel chunk ${idx + 1} issue:`, err.message);
            return { idx, text: "" };
          })
      )
    );

    chunkResults.sort((a, b) => a.idx - b.idx);
    const fullText = chunkResults.map((c) => c.text).filter(Boolean).join("\n\n");

    if (!fullText.trim()) {
      return {
        text: "No clear speech detected in this audio file.",
        language: targetLanguage,
        sourceLanguage: "unknown",
      };
    }

    if (onProgress) onProgress("Completed");
    return {
      text: fullText,
      language: targetLanguage,
      sourceLanguage: "auto",
    };
  } finally {
    // Delete all temporary files in finally block
    try {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore
    }
  }
}

// Generate general AI text with multi-tier model fallback (prioritizing instant lite models)
export async function generateTextWithFallback(
  prompt: string,
  candidateModels: string[] = [
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
  ]
): Promise<string> {
  const ai = getGeminiClient();
  let lastErr: any = null;

  for (let mIdx = 0; mIdx < candidateModels.length; mIdx++) {
    const model = candidateModels[mIdx];
    const maxRetries = 1;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        const text = response.text?.trim();
        if (text) {
          return text;
        }
      } catch (err: any) {
        lastErr = err;
        const errMsg = typeof err === "string" ? err : err?.message || JSON.stringify(err);
        const isHighDemand =
          errMsg.includes("503") ||
          errMsg.includes("high demand") ||
          errMsg.includes("UNAVAILABLE");

        console.warn(`[Gemini Text] Model ${model} notice:`, err?.message || err);
        if (isHighDemand) {
          break; // Failover immediately to next model
        }

        if (isTransientGeminiError(err) && attempt < maxRetries) {
          await sleep(600);
          continue;
        }
        break;
      }
    }
  }

  throw new Error(cleanGeminiErrorMessage(lastErr));
}

