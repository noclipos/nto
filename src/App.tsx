import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { HomeView } from "./components/HomeView";
import { UploadView } from "./components/UploadView";
import { LandingView } from "./components/LandingView";
import { HowItWorksView } from "./components/HowItWorksView";
import { PlatformsView } from "./components/PlatformsView";
import { ContactView } from "./components/ContactView";
import { ToastContainer } from "./components/Toast";
import { AiToolsModal, AiToolType } from "./components/AiToolsModal";
import {
  AppLanguage,
  AppRoute,
  RecentDownloadItem,
  ToastMessage,
} from "./types";
import { translations } from "./i18n/translations";

export const App: React.FC = () => {
  // Navigation route
  const [currentRoute, setCurrentRoute] = useState<AppRoute>("home");

  // Internationalization state
  const [language, setLanguage] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem("vidsnap_lang");
    if (saved === "ar" || saved === "fr" || saved === "en") return saved;
    return "en";
  });

  // Recent activity persisted in localStorage
  const [recentDownloads, setRecentDownloads] = useState<RecentDownloadItem[]>(() => {
    try {
      const saved = localStorage.getItem("vidsnap_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals state
  const [activeAiTool, setActiveAiTool] = useState<AiToolType | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync language to html attributes
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    localStorage.setItem("vidsnap_lang", language);
  }, [language]);

  // Persist recent items
  useEffect(() => {
    localStorage.setItem("vidsnap_history", JSON.stringify(recentDownloads));
  }, [recentDownloads]);

  const t = translations[language] || translations.en;

  const addToast = (toast: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddRecent = (item: Omit<RecentDownloadItem, "id" | "timestamp">) => {
    const newItem: RecentDownloadItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setRecentDownloads((prev) => [newItem, ...prev.slice(0, 19)]);
  };

  const handleRemoveRecent = (id: string) => {
    setRecentDownloads((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearRecent = () => {
    setRecentDownloads([]);
  };

  return (
    <div
      id="app-root"
      className={`min-h-screen bg-[#080716] text-white flex flex-col relative overflow-x-hidden selection:bg-violet-600 selection:text-white ${
        language === "ar" ? "font-cairo" : "font-sans"
      }`}
    >
      {/* Visual background layers: Glowing orbs and subtle grid texture */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle geometric dot grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        {/* Ambient Top Left Glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />

        {/* Ambient Center Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-700/10 rounded-full blur-[140px]" />

        {/* Ambient Bottom Right Glow */}
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
      </div>

      {/* Fixed Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onRouteChange={setCurrentRoute}
        language={language}
        onLanguageChange={setLanguage}
        t={t}
        recentDownloads={recentDownloads}
        onRemoveRecent={handleRemoveRecent}
        onClearRecent={handleClearRecent}
        onOpenAiTool={setActiveAiTool}
        isOpenOnMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main App Container */}
      <div
        className={`flex-1 flex flex-col min-h-screen relative z-10 transition-all duration-300 ${
          language === "ar" ? "lg:mr-[240px]" : "lg:ml-[240px]"
        }`}
      >
        {/* Top Header */}
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onRouteChange={setCurrentRoute}
          language={language}
          t={t}
        />

        {/* Main Content View with Smooth Transition */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10 pb-16">
          {currentRoute === "home" && (
            <HomeView
              t={t}
              language={language}
              onAddRecent={handleAddRecent}
              onAddToast={addToast}
            />
          )}

          {currentRoute === "upload" && (
            <UploadView
              t={t}
              onAddRecent={handleAddRecent}
              onAddToast={addToast}
            />
          )}

          {currentRoute === "landing" && (
            <LandingView
              t={t}
              onRouteChange={setCurrentRoute}
            />
          )}

          {currentRoute === "how-it-works" && (
            <HowItWorksView
              t={t}
              onRouteChange={setCurrentRoute}
            />
          )}

          {currentRoute === "platforms" && (
            <PlatformsView
              t={t}
              onRouteChange={setCurrentRoute}
            />
          )}

          {currentRoute === "contact" && (
            <ContactView
              t={t}
              onAddToast={addToast}
            />
          )}
        </main>
      </div>

      {/* Floating Toasts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* AI Tools Modal */}
      <AiToolsModal
        tool={activeAiTool}
        onClose={() => setActiveAiTool(null)}
        t={t}
        language={language}
      />
    </div>
  );
};

export default App;
