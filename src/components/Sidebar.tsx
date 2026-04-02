"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Home, Building2, Car, Tag,
  Heart, MessageSquare, Bell,
  MapPin, PlusCircle, Menu, X, LogOut, LayoutDashboard, Star, Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import React from "react";
import { Button } from "./ui/button";
import api from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  code: string;
  name: string;
  detailType: string | null;
  active: boolean;
  sortOrder: number;
  children: Category[];
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  authRequired?: boolean;
}

// ── Static nav items ───────────────────────────────────────────────────────

const TOP_ITEMS: NavItem[] = [
  { href: "/",            label: "Trang chủ",         icon: Home, exact: true },
  { href: "/noi-bat",     label: "Tin nổi bật",        icon: Star },
  { href: "/goi-noi-bat", label: "Đẩy tin nổi bật",   icon: Zap },
];

const BOTTOM_ITEMS: NavItem[] = [
  { href: "/yeu-thich",  label: "Tin yêu thích",  icon: Heart,         authRequired: true },
  { href: "/tin-nhan",   label: "Tin nhắn",       icon: MessageSquare, authRequired: true },
  { href: "/thong-bao",  label: "Thông báo",      icon: Bell,          authRequired: true },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function iconForDetailType(detailType: string | null): React.ElementType {
  if (detailType === "CAR") return Car;
  if (detailType === "REAL_ESTATE") return Building2;
  return Tag;
}

function isActive(item: NavItem, pathname: string, search: string) {
  if (item.exact) return pathname === "/";
  const [base, query] = item.href.split("?");
  if (base === "#") return false;
  if (!pathname.startsWith(base)) return false;
  if (query) {
    const itemParams = new URLSearchParams(query);
    const currentParams = new URLSearchParams(search);
    for (const [key, val] of itemParams.entries()) {
      if (currentParams.get(key) !== val) return false;
    }
  }
  return true;
}

function NavButton({
  item,
  pathname,
  search,
  onClose,
}: {
  item: NavItem;
  pathname: string;
  search: string;
  onClose: () => void;
}) {
  const active = isActive(item, pathname, search);
  const Icon = item.icon;
  return (
    <Button
      asChild
      variant={active ? "default" : "ghost"}
      className={`w-full justify-start gap-3 h-12 ${
        active
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
    >
      <Link href={item.href} onClick={onClose}>
        <Icon className="w-5 h-5" />
        {item.label}
      </Link>
    </Button>
  );
}

// ── SidebarContent ─────────────────────────────────────────────────────────

interface SidebarContentProps {
  pathname: string;
  search: string;
  user: { fullName?: string; avatarUrl?: string; role?: string } | null;
  isAuthenticated: boolean;
  categories: Category[];
  unreadMessages: number;
  unreadNotifications: number;
  onClose: () => void;
  onLogout: () => void;
}

function SidebarContent({
  pathname,
  search,
  user,
  isAuthenticated,
  categories,
  unreadMessages,
  unreadNotifications,
  onClose,
  onLogout,
}: SidebarContentProps) {
  return (
    <div className="w-64 bg-card border-r border-border h-full flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link href="/" onClick={onClose} className="flex items-center justify-center">
          <div className="bg-white/95 rounded-2xl px-4 py-2 shadow-sm">
            <Image
              src="/logo.png"
              alt="Cộng Đồng Việt"
              width={148}
              height={56}
              className="object-contain"
              priority
            />
          </div>
        </Link>
      </div>

      {/* Post Listing Button */}
      <div className="p-4 border-b border-border">
        <Button
          asChild
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 gap-2"
        >
          <Link href="/dang-tin" onClick={onClose}>
            <PlusCircle className="w-5 h-5" />
            Đăng tin
          </Link>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto space-y-1">
        {/* Static top items */}
        {TOP_ITEMS.map((item) => (
          <NavButton key={item.href} item={item} pathname={pathname} search={search} onClose={onClose} />
        ))}

        {/* Dynamic categories from API */}
        {categories.length > 0 && (
          <div className="pt-2 space-y-3">
            {categories.map((parent) => {
              const leaves = parent.children.length > 0 ? parent.children : [parent];
              return (
                <div key={parent.id}>
                  {/* Parent label (only if it has children) */}
                  {parent.children.length > 0 && (
                    <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {parent.name}
                    </p>
                  )}
                  <div className="space-y-1">
                    {leaves.map((cat) => {
                      const Icon = iconForDetailType(cat.detailType);
                      const item: NavItem = {
                        href: `/tim-kiem?category=${cat.code}`,
                        label: cat.name,
                        icon: Icon,
                      };
                      return (
                        <NavButton
                          key={cat.id}
                          item={item}
                          pathname={pathname}
                          search={search}
                          onClose={onClose}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Static bottom items */}
        <div className="pt-2 border-t border-border space-y-1">
          {BOTTOM_ITEMS.map((item) => {
            if (item.authRequired && !isAuthenticated) return null;
            const badge = item.href === "/tin-nhan" ? unreadMessages
                        : item.href === "/thong-bao" ? unreadNotifications : 0;
            return (
              <div key={item.href + item.label} className="relative">
                <NavButton item={item} pathname={pathname} search={search} onClose={onClose} />
                {badge > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border space-y-2">
        {isAuthenticated && user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
          <Link
            href="/admin"
            onClick={onClose}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Trang quản trị
          </Link>
        )}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden bg-primary flex items-center justify-center select-none">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary-foreground font-medium text-sm">
                  {user.fullName?.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{user.fullName}</p>
              <p className="text-sm text-muted-foreground">
                <Link href="/ho-so" onClick={onClose} className="hover:text-primary transition-colors">
                  Xem trang cá nhân
                </Link>
              </p>
            </div>
            <button
              title="Đăng xuất"
              onClick={onLogout}
              className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10
                         opacity-0 group-hover:opacity-100 transition-all duration-150"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/dang-nhap" onClick={onClose}>Đăng nhập</Link>
            </Button>
            <Button asChild className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/dang-ky" onClick={onClose}>Đăng ký</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SidebarInner ───────────────────────────────────────────────────────────

function SidebarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    api.get<{ data: Category[] }>("/categories")
      .then((res) => setCategories(res.data.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  // Fetch unread counts
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchCounts = () => {
      api.get<{ data: { count: number } }>("/conversations/unread-count")
        .then((res) => setUnreadMessages(res.data.data?.count ?? 0))
        .catch(() => {});
      api.get<{ data: { count: number } }>("/notifications/unread-count")
        .then((res) => setUnreadNotifications(res.data.data?.count ?? 0))
        .catch(() => {});
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = () => { logout(); router.push("/"); setOpen(false); };
  const handleClose = () => setOpen(false);

  const props: SidebarContentProps = {
    pathname,
    search: searchParams.toString(),
    user,
    isAuthenticated,
    categories,
    unreadMessages,
    unreadNotifications,
    onClose: handleClose,
    onLogout: handleLogout,
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed inset-x-0 top-0 z-50 h-14
                      flex items-center justify-between px-4
                      bg-card border-b border-border">
        <Link href="/" className="font-bold text-lg text-foreground">
          Cộng Đồng Việt
        </Link>
        <button onClick={() => setOpen(!open)} className="p-1.5 text-muted-foreground hover:text-foreground">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed top-0 left-0 bottom-0 z-50
                    transform transition-transform duration-300 ease-in-out
                    ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SidebarContent {...props} />
      </div>

      {/* Desktop static sidebar */}
      <div className="hidden md:block shrink-0 h-screen sticky top-0">
        <SidebarContent {...props} />
      </div>
    </>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────

export default function Sidebar() {
  return (
    <React.Suspense fallback={null}>
      <SidebarInner />
    </React.Suspense>
  );
}
