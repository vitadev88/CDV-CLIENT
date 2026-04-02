"use client";
import { useState } from "react";
import { MessageSquarePlus, X, Send, Check, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const CATEGORIES = [
  { value: "BUG",        label: "🐛 Báo lỗi" },
  { value: "SUGGESTION", label: "💡 Góp ý / Đề xuất" },
  { value: "OTHER",      label: "💬 Khác" },
];

export default function FeedbackModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [category, setCategory] = useState("SUGGESTION");
  const [content, setContent] = useState("");
  const [senderName, setSenderName] = useState(user?.fullName ?? "");
  const [senderEmail, setSenderEmail] = useState(user?.email ?? "");

  const handleOpen = () => { setOpen(true); setDone(false); setError(""); };
  const handleClose = () => { setOpen(false); setDone(false); setContent(""); setError(""); };

  const handleSubmit = async () => {
    if (!content.trim()) { setError("Vui lòng nhập nội dung góp ý."); return; }
    setSending(true);
    setError("");
    try {
      await api.post("/feedback", {
        content: content.trim(),
        category,
        senderName: senderName || null,
        senderEmail: senderEmail || null,
      });
      setDone(true);
      setContent("");
    } catch {
      setError("Gửi thất bại. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={handleOpen}
        title="Góp ý"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl
                   bg-primary text-primary-foreground shadow-lg shadow-primary/30
                   hover:bg-primary/90 hover:scale-105 active:scale-95
                   transition-all duration-200 font-medium text-sm"
      >
        <MessageSquarePlus className="w-4 h-4" />
        <span className="hidden sm:inline">Góp ý</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-white">Gửi góp ý</h2>
              </div>
              <button onClick={handleClose} className="text-muted-foreground hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            {done ? (
              <div className="px-5 py-10 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-white font-semibold mb-1">Cảm ơn bạn!</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Góp ý của bạn đã được gửi. Chúng tôi sẽ xem xét và cải thiện.
                </p>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <div className="px-5 py-5 space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">Loại góp ý</label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full appearance-none bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary pr-8 transition-colors"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">
                    Nội dung <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => { setContent(e.target.value); setError(""); }}
                    rows={4}
                    maxLength={2000}
                    placeholder="Mô tả lỗi hoặc ý kiến của bạn..."
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary resize-none transition-colors"
                  />
                  <div className="flex justify-between mt-1">
                    {error ? <p className="text-xs text-red-400">{error}</p> : <span />}
                    <span className="text-xs text-muted-foreground">{content.length}/2000</span>
                  </div>
                </div>

                {/* Name + email (chỉ hiện nếu chưa đăng nhập) */}
                {!user && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Họ tên</label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="Không bắt buộc"
                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">Email</label>
                      <input
                        type="email"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        placeholder="Không bắt buộc"
                        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 font-medium text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {sending ? "Đang gửi..." : "Gửi góp ý"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
