import { AppLanguage } from "../types";

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  heroHeadline: string;
  heroSubtitle: string;
  startDownloading: string;
  howItWorks: string;
  uploadFile: string;
  platforms: string;
  contact: string;
  home: string;
  landing: string;
  aiTools: string;
  recentDownloads: string;
  noDownloadsYet: string;
  clearHistory: string;
  language: string;

  // Home input
  urlPlaceholder: string;
  analyze: string;
  analyzing: string;
  clear: string;
  supportedPlatformsCount: string;
  featuresUpTo4K: string;
  noWatermarks: string;
  aiTranscription: string;
  noSignUp: string;

  // Tabs
  tabDownloadVideo: string;
  tabVideoOnly: string;
  tabExtractAudio: string;
  tabTranscript: string;

  // Actions
  download: string;
  downloading: string;
  preparingDownload: string;
  downloadAudio: string;
  extractingAudio: string;
  copyTranscript: string;
  copied: string;
  downloadTxt: string;
  downloadSrt: string;
  clearResult: string;
  transcribe: string;
  transcribing: string;
  translating: string;
  turboAiTitle: string;
  turboAiDesc: string;
  fastAiSummarize: string;

  // Quality & formats
  selectQuality: string;
  quality: string;
  format: string;
  fileSize: string;
  duration: string;
  videoOnlyWarning: string;
  audioFormatMp3: string;
  audioBitrate: string;
  targetLanguage: string;

  // Upload page
  uploadMediaTitle: string;
  uploadMediaSubtitle: string;
  dragDropText: string;
  browseFiles: string;
  supportedFormatsList: string;
  stepUploading: string;
  stepExtracting: string;
  stepSplitting: string;
  stepTranscribing: string;
  stepTranslating: string;
  stepCombining: string;
  stepCompleted: string;

  // Errors & Alerts
  invalidUrlError: string;
  privateVideoError: string;
  loginRequiredError: string;
  videoUnavailableError: string;
  genericError: string;

  // AI Tools
  toolKhaleejiTitle: string;
  toolKhaleejiDesc: string;
  toolFaidTitle: string;
  toolFaidDesc: string;
  toolSttTitle: string;
  toolSttDesc: string;
  toolVoiceCloneTitle: string;
  toolVoiceCloneDesc: string;
  toolSummaryTitle: string;
  toolSummaryDesc: string;
  comingSoon: string;
  tryNow: string;

  // Features list
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  feature4Title: string;
  feature4Desc: string;
  feature5Title: string;
  feature5Desc: string;
  feature6Title: string;
  feature6Desc: string;
}

export const translations: Record<AppLanguage, TranslationDictionary> = {
  en: {
    appName: "VidSnap",
    tagline: "Any video. Full quality. Yours.",
    heroHeadline: "Download Any Video. Full Quality. Yours.",
    heroSubtitle: "Download videos, extract audio, transcribe speech, and translate content from your favorite platforms.",
    startDownloading: "Start Downloading",
    howItWorks: "How It Works",
    uploadFile: "Upload File",
    platforms: "Platforms",
    contact: "Contact",
    home: "Home",
    landing: "Overview",
    aiTools: "AI Tools",
    recentDownloads: "Recent Activity",
    noDownloadsYet: "No downloads yet",
    clearHistory: "Clear all",
    language: "Language",

    urlPlaceholder: "Paste video link from YouTube, TikTok, Instagram, Douyin...",
    analyze: "Analyze",
    analyzing: "Analyzing...",
    clear: "Clear",
    supportedPlatformsCount: "8+ Platforms",
    featuresUpTo4K: "Up to 4K UHD",
    noWatermarks: "No Watermarks",
    aiTranscription: "AI Transcription",
    noSignUp: "No Sign-up Required",

    tabDownloadVideo: "Download Video",
    tabVideoOnly: "Video Only",
    tabExtractAudio: "Extract Audio",
    tabTranscript: "Transcript",

    download: "Download",
    downloading: "Downloading...",
    preparingDownload: "Preparing...",
    downloadAudio: "Download Audio (MP3)",
    extractingAudio: "Extracting Audio...",
    copyTranscript: "Copy Text",
    copied: "Copied to clipboard!",
    downloadTxt: "Download .TXT",
    downloadSrt: "Download .SRT",
    clearResult: "Reset",
    transcribe: "Extract Transcript",
    transcribing: "Transcribing Speech...",
    translating: "Translating...",
    turboAiTitle: "Turbo AI Accelerated",
    turboAiDesc: "Ultra-fast neural speech recognition & single-pass translation.",
    fastAiSummarize: "Instant AI Summary",

    selectQuality: "Select Resolution",
    quality: "Quality",
    format: "Format",
    fileSize: "Estimated Size",
    duration: "Duration",
    videoOnlyWarning: "Notice: This video stream does not contain an audio track.",
    audioFormatMp3: "Standard High Quality MP3 (320kbps / 44.1kHz)",
    audioBitrate: "Optimal Speech & Music Encoding",
    targetLanguage: "Final Output Language",

    uploadMediaTitle: "Transcribe & Translate Media",
    uploadMediaSubtitle: "Upload any local audio or video file to extract high-accuracy transcripts and automatic multi-language translations powered by AI.",
    dragDropText: "Drag and drop your audio or video file here, or browse",
    browseFiles: "Choose Local File",
    supportedFormatsList: "Supported: MP4, MP3, WAV, MOV, AVI, M4A, WebM (Long files supported)",
    stepUploading: "Uploading file to server...",
    stepExtracting: "Extracting audio with FFmpeg...",
    stepSplitting: "Optimizing & chunking audio track...",
    stepTranscribing: "Transcribing speech via Gemini AI...",
    stepTranslating: "Translating transcript into target language...",
    stepCombining: "Recombining synchronized text segments...",
    stepCompleted: "Processing completed successfully!",

    invalidUrlError: "Please enter a valid video link from a supported platform.",
    privateVideoError: "This video is private or restricted by the author.",
    loginRequiredError: "This video requires platform account authentication to view.",
    videoUnavailableError: "This video has been removed or is unavailable.",
    genericError: "An unexpected error occurred while analyzing the link.",

    toolKhaleejiTitle: "Khaleeji Dialect",
    toolKhaleejiDesc: "Convert any transcript into authentic Gulf Arabic dialogue.",
    toolFaidTitle: "Faid AI Assistant",
    toolFaidDesc: "Conversational assistant for media insights and research.",
    toolSttTitle: "Speech to Text",
    toolSttDesc: "Real-time speech recognition for multi-lingual media.",
    toolVoiceCloneTitle: "Voice Clone",
    toolVoiceCloneDesc: "Re-synthesize audio in custom vocal timbres.",
    toolSummaryTitle: "Content Summary",
    toolSummaryDesc: "Generate bullet-point takeaways and executive notes.",
    comingSoon: "Coming Soon",
    tryNow: "Explore Tool",

    feature1Title: "High-Speed Downloads",
    feature1Desc: "Multi-threaded fragment downloads ensure maximum bandwidth utilization from major video networks.",
    feature2Title: "Up to 4K Ultra HD",
    feature2Desc: "Preserve every pixel with direct stream extraction from 360p up to pristine 4K 2160p resolution.",
    feature3Title: "Clean & Watermark-Free",
    feature3Desc: "Download raw video files without overlaid logos or compression watermarks where technically possible.",
    feature4Title: "AI Speech Transcription",
    feature4Desc: "Extract spoken dialogue automatically into editable text using state-of-the-art Gemini speech models.",
    feature5Title: "Universal Translation",
    feature5Desc: "Translate transcripts into English, Arabic, French, Spanish, German, Chinese, and Japanese seamlessly.",
    feature6Title: "Pure MP3 Audio Extraction",
    feature6Desc: "Rip audio tracks directly into high-fidelity 320kbps MP3 for podcasts, lectures, and music playlists.",
  },

  ar: {
    appName: "VidSnap",
    tagline: "أي فيديو. بأعلى جودة. ملكك دائماً.",
    heroHeadline: "حمّل أي فيديو. بأعلى جودة. بضغطة واحدة.",
    heroSubtitle: "حمّل الفيديوهات، واستخرج الصوت، وحوّل الكلام إلى نصوص وترجمات فورية باستخدام الذكاء الاصطناعي من جميع منصاتك المفضلة.",
    startDownloading: "ابدأ التحميل الآن",
    howItWorks: "طريقة العمل",
    uploadFile: "رفع ملف",
    platforms: "المنصات المدعومة",
    contact: "الدعم والتواصل",
    home: "الرئيسية",
    landing: "نظرة عامة",
    aiTools: "أدوات الذكاء الاصطناعي",
    recentDownloads: "التحميلات الأخيرة",
    noDownloadsYet: "لا توجد تحميلات حتى الآن",
    clearHistory: "مسح الكل",
    language: "اللغة",

    urlPlaceholder: "الصق رابط الفيديو من يوتيوب، تيك توك، انستغرام، دوين...",
    analyze: "تحليل",
    analyzing: "جارٍ التحليل...",
    clear: "مسح",
    supportedPlatformsCount: "+8 منصات عالمية",
    featuresUpTo4K: "حتى دقة 4K فائقة",
    noWatermarks: "بدون علامات مائية",
    aiTranscription: "تفريغ صوتي بالذكاء الاصطناعي",
    noSignUp: "بدون تسجيل حساب",

    tabDownloadVideo: "تحميل الفيديو",
    tabVideoOnly: "فيديو بدون صوت",
    tabExtractAudio: "استخراج الصوت",
    tabTranscript: "تفريغ النص",

    download: "تحميل",
    downloading: "جارٍ التحميل...",
    preparingDownload: "جارٍ التجهيز...",
    downloadAudio: "تحميل الصوت (MP3)",
    extractingAudio: "جارٍ استخراج الصوت...",
    copyTranscript: "نسخ النص",
    copied: "تم نسخ النص إلى الحافظة!",
    downloadTxt: "تنزيل ملف TXT",
    downloadSrt: "تنزيل ملف SRT",
    clearResult: "إعادة ضبط",
    transcribe: "استخراج النص",
    transcribing: "جارٍ تحويل الصوت لنص...",
    translating: "جارٍ الترجمة...",
    turboAiTitle: "الاستخراج فائق السرعة (Turbo AI)",
    turboAiDesc: "تسريع فوري لاستخراج الصوت والتفريغ والترجمة العصبية في خطوة واحدة.",
    fastAiSummarize: "تلخيص فوري بالذكاء الاصطناعي",

    selectQuality: "اختر دقة العرض",
    quality: "الجودة",
    format: "الصيغة",
    fileSize: "الحجم التقريبي",
    duration: "المدة",
    videoOnlyWarning: "تنبيه: هذا المسار يحتوي على فيديو صامت بدون صوت.",
    audioFormatMp3: "صوت MP3 نقي عالي الجودة (320kbps / 44.1kHz)",
    audioBitrate: "معالجة مثالية للمقاطع الصوتية والمحاضرات",
    targetLanguage: "لغة الإخراج النهائية للترجمة",

    uploadMediaTitle: "تفريغ وترجمة الملفات المحلية",
    uploadMediaSubtitle: "ارفع أي ملف فيديو أو صوت من جهازك لتحويله إلى نص بدقة فائقة وترجمته تلقائياً باستخدام أحدث نماذج الذكاء الاصطناعي.",
    dragDropText: "اسحب وأفلت ملف الفيديو أو الصوت هنا، أو تصفح ملفاتك",
    browseFiles: "اختر ملفاً من جهازك",
    supportedFormatsList: "الصيغ المدعومة: MP4, MP3, WAV, MOV, AVI, M4A, WebM (يدعم الملفات الطويلة)",
    stepUploading: "جارٍ رفع الملف إلى الخادم...",
    stepExtracting: "جارٍ استخراج الصوت بتقنية FFmpeg...",
    stepSplitting: "جارٍ تحسين وتقسيم المسار الصوتي...",
    stepTranscribing: "جارٍ تفريغ الكلام عبر Gemini AI...",
    stepTranslating: "جارٍ الترجمة إلى اللغة المستهدفة...",
    stepCombining: "جارٍ تجميع ومطابقة النصوص...",
    stepCompleted: "تم إكمال العملية بنجاح!",

    invalidUrlError: "يرجى إدخال رابط فيديو صالح من إحدى المنصات المدعومة.",
    privateVideoError: "هذا الفيديو خاص أو مقيد بواسطة الناشر.",
    loginRequiredError: "هذا المحتوى يتطلب تسجيل دخول لعرضه.",
    videoUnavailableError: "تمت إزالة هذا الفيديو أو أنه لم يعد متاحاً على المنصة.",
    genericError: "حدث خطأ أثناء فحص الرابط ومحاولة جلب البيانات.",

    toolKhaleejiTitle: "اللهجة الخليجية",
    toolKhaleejiDesc: "تحويل النصوص والتفريغات إلى اللهجة الخليجية البيضاء الأصيلة.",
    toolFaidTitle: "مساعد فائد الذكي",
    toolFaidDesc: "مساعد محادثة لتحليل واستنباط الأفكار من الوسائط.",
    toolSttTitle: "تحويل الصوت إلى نص",
    toolSttDesc: "معالجة دقيقة للكلام متعدد اللهجات واللغات في الوقت الفعلي.",
    toolVoiceCloneTitle: "استنساخ الصوت",
    toolVoiceCloneDesc: "إعادة إنتاج الصوت بنبرات صوتية مخصصة.",
    toolSummaryTitle: "ملخص المحتوى",
    toolSummaryDesc: "توليد ملخص تنفيذي ونقاط رئيسية مستخلصة من الفيديو.",
    comingSoon: "قريباً",
    tryNow: "تجربة الأداة",

    feature1Title: "تحميل فائق السرعة",
    feature1Desc: "تحميل متزامن لقطع الفيديو يضمن الاستفادة القصوى من سرعة الإنترنت المتاحة.",
    feature2Title: "دقة تصل إلى 4K",
    feature2Desc: "احتفظ بكل تفاصيل الصورة من دقة 360p وحتى أعلى دقة فائقة 4K 2160p.",
    feature3Title: "نقي وبدون علامة مائية",
    feature3Desc: "احصل على الفيديو الأصلي نظيفاً بدون شعارات مضافة متى ما كان ذلك متاحاً تقنياً.",
    feature4Title: "تفريغ صوتي ذكي",
    feature4Desc: "تحويل الحوارات والكلام إلى نصوص مكتوبة بدقة بالغة عبر نماذج Gemini الحديثة.",
    feature5Title: "ترجمة فورية شاملة",
    feature5Desc: "ترجمة النص مباشرة إلى العربية، الإنجليزية، الفرنسية، الإسبانية، الألمانية، الصينية، واليابانية.",
    feature6Title: "استخراج صوت MP3 نقي",
    feature6Desc: "سحب المسار الصوتي بصيغة MP3 نقية بمعدل 320kbps للبودكاست والمحاضرات.",
  },

  fr: {
    appName: "VidSnap",
    tagline: "N'importe quelle vidéo. Pleine qualité. À vous.",
    heroHeadline: "Téléchargez n'importe quelle vidéo. Pleine qualité. À vous.",
    heroSubtitle: "Téléchargez des vidéos, extrayez l'audio, transcrivez la parole et traduisez le contenu de vos plateformes préférées.",
    startDownloading: "Commencer le téléchargement",
    howItWorks: "Comment ça marche",
    uploadFile: "Téléverser un fichier",
    platforms: "Plateformes",
    contact: "Contact",
    home: "Accueil",
    landing: "Aperçu",
    aiTools: "Outils IA",
    recentDownloads: "Téléchargements récents",
    noDownloadsYet: "Aucun téléchargement",
    clearHistory: "Effacer tout",
    language: "Langue",

    urlPlaceholder: "Collez le lien de la vidéo YouTube, TikTok, Instagram, Douyin...",
    analyze: "Analyser",
    analyzing: "Analyse en cours...",
    clear: "Effacer",
    supportedPlatformsCount: "8+ Plateformes",
    featuresUpTo4K: "Jusqu'à 4K UHD",
    noWatermarks: "Sans filigrane",
    aiTranscription: "Transcription IA",
    noSignUp: "Aucune inscription requise",

    tabDownloadVideo: "Télécharger Vidéo",
    tabVideoOnly: "Vidéo Seule",
    tabExtractAudio: "Extraire Audio",
    tabTranscript: "Transcription",

    download: "Télécharger",
    downloading: "Téléchargement...",
    preparingDownload: "Préparation...",
    downloadAudio: "Télécharger l'audio (MP3)",
    extractingAudio: "Extraction audio...",
    copyTranscript: "Copier le texte",
    copied: "Copié dans le presse-papiers !",
    downloadTxt: "Télécharger .TXT",
    downloadSrt: "Télécharger .SRT",
    clearResult: "Réinitialiser",
    transcribe: "Extraire la transcription",
    transcribing: "Transcription vocale...",
    translating: "Traduction...",
    turboAiTitle: "Turbo IA Accéléré",
    turboAiDesc: "Reconnaissance vocale neuronale et traduction directe ultra-rapide.",
    fastAiSummarize: "Résumé IA Instantané",

    selectQuality: "Sélectionner la résolution",
    quality: "Qualité",
    format: "Format",
    fileSize: "Taille estimée",
    duration: "Durée",
    videoOnlyWarning: "Remarque : ce flux vidéo ne comporte aucune piste audio.",
    audioFormatMp3: "MP3 haute fidélité (320kbps / 44.1kHz)",
    audioBitrate: "Encodage optimisé pour la voix et la musique",
    targetLanguage: "Langue finale de sortie",

    uploadMediaTitle: "Transcrire & Traduire un Média",
    uploadMediaSubtitle: "Importez n'importe quel fichier vidéo ou audio pour obtenir une transcription haute précision et une traduction multilingue par IA.",
    dragDropText: "Glissez et déposez votre fichier ici, ou parcourez",
    browseFiles: "Choisir un fichier",
    supportedFormatsList: "Pris en charge : MP4, MP3, WAV, MOV, AVI, M4A, WebM",
    stepUploading: "Téléversement vers le serveur...",
    stepExtracting: "Extraction audio avec FFmpeg...",
    stepSplitting: "Optimisation de la piste audio...",
    stepTranscribing: "Transcription avec Gemini AI...",
    stepTranslating: "Traduction dans la langue cible...",
    stepCombining: "Recombinaison des segments...",
    stepCompleted: "Traitement terminé avec succès !",

    invalidUrlError: "Veuillez saisir une URL valide provenant d'une plateforme prise en charge.",
    privateVideoError: "Cette vidéo est privée ou restreinte par son auteur.",
    loginRequiredError: "Cette vidéo nécessite une authentification pour être visionnée.",
    videoUnavailableError: "Cette vidéo a été supprimée ou n'est plus accessible.",
    genericError: "Une erreur est survenue lors de l'analyse du lien.",

    toolKhaleejiTitle: "Dialecte Khaliji",
    toolKhaleejiDesc: "Convertissez tout texte transcrit en arabe parlé du Golfe.",
    toolFaidTitle: "Assistant IA Faid",
    toolFaidDesc: "Assistant interactif pour analyser vos contenus médias.",
    toolSttTitle: "Reconnaissance vocale",
    toolSttDesc: "Reconnaissance vocale multi-langues en temps réel.",
    toolVoiceCloneTitle: "Clonage vocal",
    toolVoiceCloneDesc: "Recréez des voix synthétisées personnalisées.",
    toolSummaryTitle: "Résumé de contenu",
    toolSummaryDesc: "Générez les points clés et un résumé exécutif.",
    comingSoon: "Bientôt disponible",
    tryNow: "Tester l'outil",

    feature1Title: "Téléchargements Rapides",
    feature1Desc: "Téléchargement multi-flux pour maximiser votre débit réseau.",
    feature2Title: "Jusqu'en 4K Ultra HD",
    feature2Desc: "Préservez chaque détail de 360p jusqu'à 4K 2160p sans perte.",
    feature3Title: "Sans filigrane",
    feature3Desc: "Fichiers bruts sans logos superposés dès que possible.",
    feature4Title: "Transcription Vocale IA",
    feature4Desc: "Transcription automatique du dialogue parlé via les modèles Gemini.",
    feature5Title: "Traduction Universelle",
    feature5Desc: "Traduction vers l'anglais, l'arabe, le français, l'espagnol, etc.",
    feature6Title: "Extraction Audio MP3",
    feature6Desc: "Pistes audio pures en MP3 320kbps pour vos podcasts et musiques.",
  },
};
