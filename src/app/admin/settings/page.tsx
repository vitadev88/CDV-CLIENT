"use client";
import AdminShell from "@/components/admin/AdminShell";
import { useAppSettings } from "@/context/AppSettingsContext";
import { Star, Zap } from "lucide-react";

interface ToggleRowProps {
  icon: React.ElementType;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

function ToggleRow({ icon: Icon, label, description, enabled, onToggle }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#1A1A20] border border-[#2A2A35] rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#2A2A35] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#9CA3AF]" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
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

export default function AdminSettingsPage() {
  const { showFeatured, showFeaturedPackages, update } = useAppSettings();

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Cài đặt</h1>
          <p className="text-sm text-[#9CA3AF]">Bật/tắt hiển thị các mục trong menu</p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">Menu hiển thị</p>
          <ToggleRow
            icon={Star}
            label="Tin nổi bật"
            description="Hiển thị mục Tin nổi bật trong sidebar"
            enabled={showFeatured}
            onToggle={() => update({ showFeatured: !showFeatured })}
          />
          <ToggleRow
            icon={Zap}
            label="Đẩy tin nổi bật"
            description="Hiển thị mục Đẩy tin nổi bật trong sidebar"
            enabled={showFeaturedPackages}
            onToggle={() => update({ showFeaturedPackages: !showFeaturedPackages })}
          />

        </div>
      </div>
    </AdminShell>
  );
}
