"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ConversationResponse, MessageResponse } from "@/types";
import { MessageSquare, Send, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export default function MessagesPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationResponse | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [input, setInput] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/dang-nhap"); return; }
    api.get<{ data: ConversationResponse[] }>("/conversations")
      .then((res) => setConversations(res.data.data ?? []))
      .catch((err: unknown) => console.error("Failed to load conversations", err))
      .finally(() => setLoadingConvs(false));
  }, [isAuthenticated, router]);

  const openConversation = async (conv: ConversationResponse) => {
    setActiveConv(conv);
    setLoadingMsgs(true);
    try {
      const res = await api.get<{ data: { content: MessageResponse[] } }>(`/conversations/${conv.id}/messages?size=100`);
      setMessages((res.data.data?.content ?? []).reverse());
      await api.patch(`/conversations/${conv.id}/read`);
      // Update unread count
      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling for new messages
  useEffect(() => {
    if (!activeConv) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get<{ data: { content: MessageResponse[] } }>(`/conversations/${activeConv.id}/messages?size=100`);
        setMessages((res.data.data?.content ?? []).reverse());
      } catch { /* ignore polling errors */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeConv]);

  const sendMessage = async () => {
    if (!input.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      const res = await api.post<{ data: MessageResponse }>(`/conversations/${activeConv.id}/messages`, { content: input });
      if (res.data.data) {
        setMessages(prev => [...prev, res.data.data!]);
        setInput("");
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conv: ConversationResponse) => {
    return conv.participants.find(p => p.id !== user?.id) ?? conv.participants[0];
  };

  return (
    <div className="flex h-[calc(100vh-56px)] md:h-screen">
      {/* Conversation list */}
      <div className={`w-full md:w-80 border-r border-border bg-card flex flex-col shrink-0 ${
        activeConv ? "hidden md:flex" : "flex"
      }`}>
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> Tin nhắn
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Chưa có tin nhắn nào.
            </div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              return (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-b border-border/50 ${
                    activeConv?.id === conv.id ? "bg-muted/70" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-sm font-medium text-primary">
                    {other?.fullName?.slice(0, 2).toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white truncate">{other?.fullName}</p>
                      {conv.lastMessageAt && (
                        <span className="text-xs text-muted-foreground">{timeAgo(conv.lastMessageAt)}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate">{conv.lastMessage ?? "..."}</p>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    {conv.listingTitle && (
                      <p className="text-xs text-primary/70 truncate mt-0.5">📌 {conv.listingTitle}</p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col bg-background ${!activeConv ? "hidden md:flex" : "flex"}`}>
        {activeConv ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
              <button onClick={() => setActiveConv(null)} className="md:hidden p-1 text-muted-foreground">
                <ArrowLeft size={20} />
              </button>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                {getOtherParticipant(activeConv)?.fullName?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{getOtherParticipant(activeConv)?.fullName}</p>
                {activeConv.listingTitle && (
                  <p className="text-xs text-muted-foreground">📌 {activeConv.listingTitle}</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Bắt đầu cuộc trò chuyện...
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-card border border-border text-white rounded-bl-md"
                      }`}>
                        {msg.imageUrl && (
                          <img src={msg.imageUrl} alt="" className="rounded-lg mb-2 max-w-full max-h-48 object-cover" />
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {timeAgo(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 py-3 disabled:opacity-40 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto mb-3 text-border" />
              <p>Chọn cuộc trò chuyện để bắt đầu</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
