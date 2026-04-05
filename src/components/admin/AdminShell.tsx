"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, Users, Tag, Layers, FileText,
  Star, Settings, LogOut, Bell, ChevronRight, Heart, Zap, MessageSquarePlus, BookOpen,
} from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import api from "@/lib/api";

const NAV = [
  { href: "/admin",            icon: LayoutDashboard, label: "Dashboard",      superAdminOnly: false },
  { href: "/admin/users",      icon: Users,           label: "Người dùng",     superAdminOnly: false },
  { href: "/admin/categories",             icon: Tag,  label: "Danh mục",      superAdminOnly: false },
  { href: "/admin/categories/detail-types", icon: Layers, label: "Loại danh mục", superAdminOnly: false },
  { href: "/admin/listings",   icon: FileText,        label: "Tin đăng",       superAdminOnly: false },
  { href: "/admin/featured",            icon: Star,            label: "Nổi bật",        superAdminOnly: false },
  { href: "/admin/featured-packages",   icon: Zap,             label: "Gói nổi bật",    superAdminOnly: false },
  { href: "/admin/blog",        icon: BookOpen,          label: "Blog",           superAdminOnly: false },
  { href: "/admin/feedback",   icon: MessageSquarePlus, label: "Góp ý",        superAdminOnly: false },
  { href: "/admin/donation",   icon: Heart,           label: "Donate",         superAdminOnly: true  },
  { href: "/admin/settings",   icon: Settings,        label: "Cài đặt",        superAdminOnly: false },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const visibleNav = NAV.filter((n) => !n.superAdminOnly || isSuperAdmin);
  const [unreadFeedback, setUnreadFeedback] = useState(0);

  useEffect(() => {
    api.get<{ data: { count: number } }>("/feedback/unread-count")
      .then((res) => setUnreadFeedback(res.data.data?.count ?? 0))
      .catch(() => {});
  }, []);

  const handleLogout = () => { logout(); router.push("/"); };

  return (
    <div className="flex h-screen bg-[#09090b] text-white overflow-hidden">

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around bg-[#111118] border-t border-[#1A1A20] h-16 px-2">
        {visibleNav.slice(0, 5).map(({ href, icon: Icon }) => (
          <Link key={href} href={href}
            className={`flex items-center justify-center w-12 h-12 rounded-xl transition-colors
              ${pathname === href ? "bg-[#1CE479] text-black" : "text-[#9CA3AF] hover:text-white"}`}>
            <Icon className="w-5 h-5" />
          </Link>
        ))}
        <button onClick={handleLogout}
          className="flex items-center justify-center w-12 h-12 rounded-xl text-[#9CA3AF] hover:text-red-400 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-52 bg-[#111118] border-r border-[#1A1A20] py-6 shrink-0">
        <div className="px-5 mb-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1CE479] rounded-xl flex items-center justify-center shrink-0">
              <span className="text-black font-bold text-xs">CDV</span>
            </div>
            <span className="text-sm font-bold text-white">Admin Panel</span>
          </Link>
        </div>
        <p className="px-5 text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest mb-3">Menu</p>
        {visibleNav.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={`relative flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
              ${(href === "/admin" ? pathname === href : pathname.startsWith(href))
                ? "bg-[#1CE479] text-black"
                : "text-[#9CA3AF] hover:bg-[#1A1A20] hover:text-white"}`}>
            <Icon className="w-4 h-4" />
            {label}
            {href === "/admin/feedback" && unreadFeedback > 0 && (
              <span className="ml-auto min-w-[1.25rem] h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {unreadFeedback > 99 ? "99+" : unreadFeedback}
              </span>
            )}
          </Link>
        ))}
        <div className="flex-1" />
        <button onClick={handleLogout}
          className="flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#9CA3AF] hover:bg-red-500/10 hover:text-red-400 transition-colors">
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-[#1A1A20] shrink-0">
          <div className="flex-1" />
          <button className="relative w-10 h-10 bg-[#1A1A20] border border-[#2A2A35] rounded-xl flex items-center justify-center text-[#9CA3AF] hover:text-white transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#1CE479] rounded-full" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#1CE479] rounded-xl flex items-center justify-center shrink-0">
              <span className="text-black font-bold text-xs">
                {user?.fullName?.slice(0, 2).toUpperCase() ?? "SA"}
              </span>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-white leading-none">{user?.fullName ?? "Admin"}</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{user?.role}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </div>
      </div>
    </div>
  );
}
