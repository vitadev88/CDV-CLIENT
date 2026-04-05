"use client";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { Construction } from "lucide-react";

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const { maintenanceMode } = useAppSettings();
  const { user } = useAuth();
  const pathname = usePathname();

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isLoginPage = pathname === "/dang-nhap";

  if (maintenanceMode && !isAdmin && !isLoginPage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0D0D12] px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#1A1A20] border border-[#2A2A35] flex items-center justify-center mb-6">
          <Construction className="w-8 h-8 text-[#7C6FF7]" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Hệ thống đang bảo trì</h1>
        <p className="text-sm text-[#9CA3AF] max-w-sm">
          Chúng tôi đang nâng cấp hệ thống để mang lại trải nghiệm tốt hơn. Vui lòng quay lại sau.
        </p>
        <a
          href="/dang-nhap"
          className="mt-8 text-xs text-[#7C6FF7] hover:underline"
        >
          Đăng nhập với tài khoản quản trị
        </a>
      </div>
    );
  }

  return <>{children}</>;
}
