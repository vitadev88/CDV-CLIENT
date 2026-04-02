"use client";
import { useState } from "react";
import { MessageCircle, Users, Send } from "lucide-react";

const MESSAGES = [
  {
    id: 1,
    user: "Minh Hoàng",
    avatar: "MH",
    text: "Có ai biết khu vực Tân Bắc giá phòng trọ bao nhiêu không?",
    time: "14:34",
    tag: "#Cho thuê phòng",
    verified: false,
  },
  {
    id: 2,
    user: "Thu Trang",
    avatar: "TT",
    text: "Mình vừa thuê được nhà 3 tầng ở Tân Điếm, giá tốt lắm! Recommend mọi người!",
    time: "14:35",
    tag: "#Cho thuê nhà",
    verified: true,
  },
  {
    id: 3,
    user: "Đức Anh",
    avatar: "ĐA",
    text: "Cần bán Toyota Camry 2022 mới chạy 18k km, ai quan tâm inbox nhé",
    time: "14:36",
    tag: "#Ô tô",
    verified: false,
  },
  {
    id: 4,
    user: "Lan Anh",
    avatar: "LA",
    text: "Vừa tìm được căn hộ 2PN view đẹp ở Đài Bắc. Cảm ơn cộng đồng nhiều!",
    time: "14:37",
    tag: "#Cho thuê phòng",
    verified: true,
  },
  {
    id: 5,
    user: "Tuấn Kiệt",
    avatar: "TK",
    text: "Ai cần thuê nhà ở Cao Hùng inbox mình nhé, biết vài chỗ giá tốt",
    time: "14:38",
    tag: "#Cho thuê nhà",
    verified: false,
  },
];

export default function RightSidebar() {
  const [message, setMessage] = useState("");

  return (
    <aside className="hidden xl:flex flex-col w-80 shrink-0 bg-[#111113] border-l border-[#27272a] h-screen sticky top-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#27272a]">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-[#1CE479]" />
          <span className="font-semibold text-sm text-white">Chat cộng đồng</span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#1CE479]/10 border border-[#1CE479]/20 px-2 py-1 rounded-full">
          <Users size={11} className="text-[#1CE479]" />
          <span className="text-xs text-[#1CE479] font-medium">2,156 online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {MESSAGES.map((msg) => (
          <div key={msg.id} className="flex gap-2.5">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#27272a] flex items-center justify-center text-xs font-bold text-[#a1a1aa] shrink-0 mt-0.5">
              {msg.avatar}
            </div>
            <div className="flex-1 min-w-0">
              {/* Name row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-white">{msg.user}</span>
                {msg.verified && (
                  <span className="text-xs bg-[#1CE479]/15 border border-[#1CE479]/25 text-[#1CE479] px-1.5 py-0.5 rounded-full leading-none">
                    ✓ Đã xác thực
                  </span>
                )}
                <span className="text-xs text-[#52525b] ml-auto">{msg.time}</span>
              </div>
              {/* Message */}
              <p className="text-xs text-[#a1a1aa] mt-0.5 leading-relaxed">{msg.text}</p>
              {/* Tag */}
              <span className="inline-block text-xs text-[#1CE479]/70 mt-1">{msg.tag}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-[#27272a]">
        <div className="flex gap-2 items-center bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 focus-within:border-[#1CE479]/50 transition-colors">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-[#52525b] outline-none"
            onKeyDown={(e) => { if (e.key === "Enter") setMessage(""); }}
          />
          <button
            onClick={() => setMessage("")}
            className="text-[#1CE479] hover:text-[#16c96a] transition-colors shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
