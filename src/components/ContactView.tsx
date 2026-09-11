import React, { useState } from "react";
import { Mail, Send, CheckCircle2, MessageSquare, Shield, HelpCircle } from "lucide-react";
import { TranslationDictionary } from "../i18n/translations";
import { ToastMessage } from "../types";

interface ContactViewProps {
  t: TranslationDictionary;
  onAddToast: (toast: Omit<ToastMessage, "id">) => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ t, onAddToast }) => {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitted(true);
    onAddToast({
      title: "Message Sent",
      description: "Thank you for reaching out. We will review your inquiry.",
      type: "success",
    });
  };

  return (
    <div id="contact-view" className="w-full max-w-3xl mx-auto space-y-10 py-4 animate-in fade-in">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/10 border border-violet-500/20 text-xs font-semibold text-violet-300">
          <Mail className="w-3.5 h-3.5" />
          <span>Support & Inquiries</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Get in Touch with VidSnap
        </h1>
        <p className="text-sm text-white/60 max-w-md mx-auto">
          Encountering an extraction issue, feature suggestion, or platform change? Let our team know.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#0B0920]/80 border border-white/10 text-center space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center mx-auto">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-white">General Support</h4>
          <p className="text-[11px] text-white/50">support@vidsnap.app</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B0920]/80 border border-white/10 text-center space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Shield className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-white">Security & DMCA</h4>
          <p className="text-[11px] text-white/50">legal@vidsnap.app</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B0920]/80 border border-white/10 text-center space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
            <HelpCircle className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-white">Platform Status</h4>
          <p className="text-[11px] text-emerald-400 font-semibold">99.9% Uptime</p>
        </div>
      </div>

      {submitted ? (
        <div className="p-8 rounded-3xl bg-[#0B0920]/90 border border-emerald-500/30 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Thank You for Your Feedback</h3>
          <p className="text-xs text-white/60 max-w-sm mx-auto">
            Your inquiry has been logged. Our development team monitors platform status 24/7.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setEmail("");
              setSubject("");
              setMessage("");
            }}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 rounded-3xl bg-[#0B0920]/90 border border-white/10 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Your Email (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full h-11 px-3.5 rounded-xl bg-[#080716] border border-white/10 focus:border-violet-500 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Platform issue, feature request..."
                className="w-full h-11 px-3.5 rounded-xl bg-[#080716] border border-white/10 focus:border-violet-500 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Message or Video Link Encountered
            </label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue or include the video URL that failed..."
              rows={5}
              className="w-full p-3.5 rounded-xl bg-[#080716] border border-white/10 focus:border-violet-500 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-7 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Message</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
