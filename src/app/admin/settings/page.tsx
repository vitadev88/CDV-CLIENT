"use client";
import AdminShell from "@/components/admin/AdminShell";
import { useAppSettings } from "@/context/AppSettingsContext";
import { Monitor, Power, Star, Zap } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import api from "@/lib/api";

type Tab = "general" | "security" | "notification" | "api";

const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "Cài đặt chung" },
  { id: "security", label: "Bảo mật" },
  { id: "notification", label: "Thông báo" },
  { id: "api", label: "Cấu hình API" },
];

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#111116] border border-[#2A2A35] rounded-xl">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-[#9CA3AF] mt-0.5">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${
          enabled ? "bg-[#1CE479]" : "bg-[#2A2A35]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#1A1A20] border border-[#2A2A35] rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-[#9CA3AF]" />
        <h2 className="text-base font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-[#9CA3AF]">
      <p className="text-sm">Tính năng đang phát triển</p>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { showFeatured, showFeaturedPackages, logoUrl, siteTitle, siteDescription, maintenanceMode, update } =
    useAppSettings();

  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [localTitle, setLocalTitle] = useState<string | null>(null);
  const [localDesc, setLocalDesc] = useState<string | null>(null);

  const displayTitle = localTitle ?? siteTitle;
  const displayDesc = localDesc ?? siteDescription;

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("files", file);
      form.append("folder", "logo");
      const res = await api.post<{ data: { urls: string[] } }>("/uploads", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.data.urls[0];
      await update({ logoUrl: url });
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveBrand() {
    await update({ siteTitle: displayTitle, siteDescription: displayDesc });
    setLocalTitle(null);
    setLocalDesc(null);
  }

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Cài đặt</h1>
          <p className="text-sm text-[#9CA3AF]">Quản lý cấu hình hệ thống</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#2A2A35]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-[#7C6FF7] border-b-2 border-[#7C6FF7]"
                  : "text-[#9CA3AF] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "general" && (
          <div className="space-y-4">
            {/* Nhận diện thương hiệu */}
            <Section icon={Monitor} title="Nhận diện thương hiệu">
              {/* Logo */}
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-xl bg-[#111116] border border-[#2A2A35] flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl ? (
                    <Image src={logoUrl} alt="Logo" width={96} height={96} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-[10px] text-[#9CA3AF] text-center px-1">SYSTEM</span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">Logo hệ thống</p>
                  <p className="text-xs text-[#9CA3AF]">Kích thước khuyến dùng 512x512px. Định dạng PNG hoặc SVG.</p>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="text-xs text-[#7C6FF7] hover:underline disabled:opacity-50"
                  >
                    {uploading ? "Đang tải lên..." : "Thay đổi ảnh"}
                  </button>
                  <input ref={fileRef} type="file" accept="image/png,image/svg+xml" className="hidden" onChange={handleLogoChange} />
                </div>
              </div>

              {/* Site title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">Tiêu đề trang web</label>
                <input
                  type="text"
                  value={displayTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  className="w-full bg-[#111116] border border-[#2A2A35] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7C6FF7]"
                />
              </div>

              {/* Meta description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">Mô tả (Meta Description)</label>
                <textarea
                  rows={3}
                  value={displayDesc}
                  onChange={(e) => setLocalDesc(e.target.value)}
                  className="w-full bg-[#111116] border border-[#2A2A35] rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-[#7C6FF7]"
                />
              </div>

              {(localTitle !== null || localDesc !== null) && (
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveBrand}
                    className="px-4 py-2 text-sm font-medium bg-[#7C6FF7] hover:bg-[#6B5FE6] text-white rounded-lg transition-colors"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              )}
            </Section>

            {/* Trạng thái hệ thống */}
            <Section icon={Power} title="Trạng thái hệ thống">
              <ToggleRow
                label="Chế độ bảo trì (Maintenance Mode)"
                description="Tạm thời vô hiệu hóa truy cập từ người dùng để nâng cấp hệ thống."
                enabled={maintenanceMode}
                onToggle={() => update({ maintenanceMode: !maintenanceMode })}
              />
            </Section>

            {/* Menu hiển thị */}
            <Section icon={Star} title="Menu hiển thị">
              <ToggleRow
                label="Tin nổi bật"
                description="Hiển thị mục Tin nổi bật trong sidebar"
                enabled={showFeatured}
                onToggle={() => update({ showFeatured: !showFeatured })}
              />
              <ToggleRow
                label="Đẩy tin nổi bật"
                description="Hiển thị mục Đẩy tin nổi bật trong sidebar"
                enabled={showFeaturedPackages}
                onToggle={() => update({ showFeaturedPackages: !showFeaturedPackages })}
              />
            </Section>
          </div>
        )}

        {activeTab !== "general" && <ComingSoon />}
      </div>
    </AdminShell>
  );
}
