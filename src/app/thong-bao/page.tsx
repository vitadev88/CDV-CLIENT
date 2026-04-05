"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { NotificationResponse } from "@/types";
import { Bell, CheckCheck, MessageSquare, Heart, Star, AlertCircle } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/dang-nhap"); return; }
    api.get<{ data: { content: NotificationResponse[] } }>("/notifications?size=50")
      .then((res) => setNotifications(res.data.data?.content ?? []))
      .catch((err: unknown) => console.error("Failed to load notifications", err))
      .finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  const markAsRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    await api.patch("/notifications/read-all");
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const iconForType = (type: string) => {
    switch (type) {
      case "NEW_MESSAGE": return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case "LISTING_FAVORITED": return <Heart className="w-5 h-5 text-red-400" />;
      case "FEATURED_EXPIRED": return <Star className="w-5 h-5 text-yellow-400" />;
      default: return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#D41B2C]" />
          <h1 className="text-xl font-bold text-[#1F2937]">Thông báo</h1>
        </div>
        {notifications.some(n => !n.read) && (
          <button onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-sm text-[#D41B2C] hover:text-[#B91624] transition-colors">
            <CheckCheck className="w-4 h-4" /> Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#E5E7EB] rounded-xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-[#6B7280]">
          <Bell size={48} className="mx-auto mb-3 text-[#D1D5DB]" />
          <p>Chưa có thông báo nào.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && markAsRead(n.id)}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                n.read
                  ? "bg-white border-[#E5E7EB]"
                  : "bg-[#FEF2F2] border-[#D41B2C]/20 hover:bg-red-50"
              }`}
            >
              <div className="mt-0.5">{iconForType(n.type)}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${n.read ? "text-[#6B7280]" : "text-[#1F2937]"}`}>
                  {n.title}
                </p>
                {n.content && <p className="text-xs text-[#6B7280] mt-0.5 truncate">{n.content}</p>}
                <p className="text-xs text-[#9CA3AF] mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.read && (
                <div className="w-2.5 h-2.5 rounded-full bg-[#D41B2C] shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
