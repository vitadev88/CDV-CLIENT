"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageSquarePlus, Check, ChevronLeft, ChevronRight, User, Mail, Tag, Clock } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AdminShell from "@/components/admin/AdminShell";

// ── Types ──────────────────────────────────────────────────────────────────
interface Feedback {
  id: string;
  content: string;
  category: "BUG" | "SUGGESTION" | "OTHER";
  senderName: string | null;
  senderEmail: string | null;
  userId: string | null;
  userFullName: string | null;
  status: "NEW" | "READ";
  createdAt: string;
}

interface PageData {
  content: Feedback[];
  totalElements: number;
  totalPages: number;
  number: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const CATEGORY_STYLE: Record<string, { label: string; cls: string }> = {
  BUG:        { label: "Báo lỗi",        cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  SUGGESTION: { label: "Góp ý / Đề xuất",cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  OTHER:      { label: "Khác",            cls: "bg-[#2A2A35] text-[#9CA3AF] border-[#2A2A35]" },
};

function formatDate(s: string) {
  return new Date(s).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Component ──────────────────────────────────────────────────────────────
export default function AdminFeedbackPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<Feedback[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Feedback | null>(null);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "NEW" | "READ">("ALL");
  const [unread, setUnread] = useState(0);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (!isAdmin) { router.push("/"); }
  }, [isAdmin, router]);

  const load = useCallback(() => {
    setLoading(true);
    api.get<{ data: PageData }>(`/feedback?page=${page}&size=15`)
      .then((res) => {
        const d = res.data.data;
        setItems(d?.content ?? []);
        setTotal(d?.totalElements ?? 0);
        setTotalPages(d?.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
    api.get<{ data: { count: number } }>("/feedback/unread-count")
      .then((res) => setUnread(res.data.data?.count ?? 0))
      .catch(() => {});
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (feedback: Feedback) => {
    if (feedback.status === "READ") return;
    await api.patch(`/feedback/${feedback.id}/read`);
    setItems((prev) => prev.map((f) => f.id === feedback.id ? { ...f, status: "READ" } : f));
    setUnread((n) => Math.max(0, n - 1));
    if (selected?.id === feedback.id) setSelected({ ...feedback, status: "READ" });
  };

  const handleOpen = (feedback: Feedback) => {
    setSelected(feedback);
    handleMarkRead(feedback);
  };

  const filtered = filterStatus === "ALL" ? items : items.filter((f) => f.status === filterStatus);

  if (!isAdmin) return null;

  return (
    <AdminShell>
      <div className="p-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5 text-primary" />
              Góp ý từ người dùng
            </h1>
            <p className="text-sm text-[#9CA3AF] mt-0.5">
              {total} góp ý · {unread > 0 && <span className="text-primary font-medium">{unread} chưa đọc</span>}
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5">
          {(["ALL", "NEW", "READ"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                filterStatus === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-[#2A2A35] text-[#9CA3AF] hover:text-white"
              }`}
            >
              {s === "ALL" ? "Tất cả" : s === "NEW" ? `Chưa đọc${unread > 0 ? ` (${unread})` : ""}` : "Đã đọc"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* List */}
          <div className="lg:col-span-2 space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 bg-[#1A1A20] rounded-xl animate-pulse" />
              ))
            ) : filtered.length === 0 ? (
              <div className="bg-[#1A1A20] border border-[#2A2A35] rounded-xl p-8 text-center">
                <MessageSquarePlus className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2 opacity-40" />
                <p className="text-sm text-[#9CA3AF]">Chưa có góp ý nào.</p>
              </div>
            ) : (
              filtered.map((feedback) => {
                const cat = CATEGORY_STYLE[feedback.category];
                const isNew = feedback.status === "NEW";
                return (
                  <button
                    key={feedback.id}
                    onClick={() => handleOpen(feedback)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selected?.id === feedback.id
                        ? "border-primary bg-primary/5"
                        : "border-[#2A2A35] bg-[#1A1A20] hover:border-[#3A3A45]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cat.cls}`}>
                          {cat.label}
                        </span>
                        {isNew && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-primary font-medium">
                            Mới
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#52525b] shrink-0">{formatDate(feedback.createdAt)}</span>
                    </div>
                    <p className={`text-sm line-clamp-2 ${isNew ? "text-white font-medium" : "text-[#9CA3AF]"}`}>
                      {feedback.content}
                    </p>
                    <p className="text-xs text-[#52525b] mt-1.5">
                      {feedback.userFullName || feedback.senderName || "Ẩn danh"}
                    </p>
                  </button>
                );
              })
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-lg border border-[#2A2A35] text-[#9CA3AF] hover:text-white disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-[#9CA3AF]">{page + 1} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-lg border border-[#2A2A35] text-[#9CA3AF] hover:text-white disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-3">
            {selected ? (
              <div className="bg-[#1A1A20] border border-[#2A2A35] rounded-xl p-5 sticky top-5">
                {/* Category + status */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${CATEGORY_STYLE[selected.category].cls}`}>
                    {CATEGORY_STYLE[selected.category].label}
                  </span>
                  {selected.status === "READ" ? (
                    <span className="flex items-center gap-1 text-xs text-[#52525b]">
                      <Check className="w-3.5 h-3.5" /> Đã đọc
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary font-medium">Mới</span>
                  )}
                </div>

                {/* Content */}
                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap mb-5">
                  {selected.content}
                </p>

                {/* Meta */}
                <div className="space-y-2 border-t border-[#2A2A35] pt-4">
                  <MetaRow icon={<User className="w-3.5 h-3.5" />} label="Người gửi"
                    value={selected.userFullName || selected.senderName || "Ẩn danh"} />
                  {selected.senderEmail && (
                    <MetaRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={selected.senderEmail} />
                  )}
                  {selected.userId && (
                    <MetaRow icon={<User className="w-3.5 h-3.5" />} label="User ID" value={selected.userId} mono />
                  )}
                  <MetaRow icon={<Tag className="w-3.5 h-3.5" />} label="Loại" value={CATEGORY_STYLE[selected.category].label} />
                  <MetaRow icon={<Clock className="w-3.5 h-3.5" />} label="Thời gian" value={formatDate(selected.createdAt)} />
                </div>
              </div>
            ) : (
              <div className="bg-[#1A1A20] border border-[#2A2A35] rounded-xl p-12 text-center sticky top-5">
                <MessageSquarePlus className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3 opacity-30" />
                <p className="text-sm text-[#9CA3AF]">Chọn một góp ý để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function MetaRow({ icon, label, value, mono = false }: {
  icon: React.ReactNode; label: string; value: string; mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-[#52525b] mt-0.5 shrink-0">{icon}</span>
      <span className="text-[#9CA3AF] shrink-0 w-20">{label}</span>
      <span className={`text-white break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
