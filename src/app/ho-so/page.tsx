"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { UserProfile, Listing, ListingPage } from "@/types";
import { formatPrice, timeAgo, statusLabel, statusColor } from "@/lib/utils";
import {
  Camera, Save, User as UserIcon, MessageCircle, Music2,
  MapPin, Calendar, Edit3, X, Check, Home, Bed, Bath,
  Phone, ChevronRight, PlusCircle, Package,
} from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

// ── Tabs ──────────────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: "ALL",      label: "Tất cả" },
  { key: "ACTIVE",   label: "Đang đăng" },
  { key: "INACTIVE", label: "Đã ẩn" },
  { key: "SOLD",     label: "Đã bán" },
  { key: "RENTED",   label: "Đã cho thuê" },
];

// ── Icons SVG ─────────────────────────────────────────────────────────────────
const ZaloIcon = () => <img src="/zalo.jpg" alt="Zalo" className="w-4 h-4 rounded object-cover" />;
const LineIcon = () => <img src="/line.jpg" alt="LINE" className="w-4 h-4 rounded object-cover" />;
const FbIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);
const TikTokIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="white">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z"/>
  </svg>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { isAuthenticated, updateUser } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "contact">("info");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [zalo, setZalo] = useState("");
  const [lineId, setLineId] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!isAuthenticated) { router.push("/dang-nhap"); return; }
    Promise.all([
      api.get<{ data: UserProfile }>("/users/me"),
      api.get<{ data: ListingPage }>("/listings/mine"),
    ]).then(([userRes, listRes]) => {
      const p = userRes.data.data;
      if (p) {
        setProfile(p);
        setFullName(p.fullName ?? "");
        setPhone(p.phone ?? "");
        setBio(p.bio ?? "");
        setAddress(p.address ?? "");
        setDateOfBirth(p.dateOfBirth ?? "");
        setZalo(p.zalo ?? "");
        setLineId(p.lineId ?? "");
        setFacebook(p.facebook ?? "");
        setTiktok(p.tiktok ?? "");
      }
      setListings(listRes.data.data?.content ?? []);
    }).catch((err: unknown) => console.error(err))
      .finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put<{ data: UserProfile }>("/users/me", {
        fullName, phone, bio, address, dateOfBirth: dateOfBirth || null,
        zalo: zalo || null, lineId: lineId || null,
        facebook: facebook || null, tiktok: tiktok || null,
      });
      if (res.data.data) {
        setProfile(res.data.data);
        updateUser({ fullName: res.data.data.fullName });
      }
      setEditing(false);
      showToast("Cập nhật thành công!");
    } catch {
      showToast("Lỗi khi cập nhật", false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!profile) return;
    setFullName(profile.fullName ?? "");
    setPhone(profile.phone ?? "");
    setBio(profile.bio ?? "");
    setAddress(profile.address ?? "");
    setDateOfBirth(profile.dateOfBirth ?? "");
    setZalo(profile.zalo ?? "");
    setLineId(profile.lineId ?? "");
    setFacebook(profile.facebook ?? "");
    setTiktok(profile.tiktok ?? "");
    setEditing(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await api.post<{ data: UserProfile }>("/users/me/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.data) {
        setProfile(res.data.data);
        updateUser({ avatarUrl: res.data.data.avatarUrl });
      }
      showToast("Ảnh đại diện đã cập nhật!");
    } catch {
      showToast("Lỗi upload ảnh", false);
    }
  };

  const filteredListings = statusFilter === "ALL"
    ? listings
    : listings.filter((l) => l.status === statusFilter);

  const listingCount = listings.length;
  const initials = profile?.fullName?.slice(0, 2).toUpperCase() ?? "?";

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-6xl mx-auto">
        <div className="h-48 bg-muted rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-muted rounded-2xl animate-pulse" />
          <div className="lg:col-span-2 h-96 bg-muted rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium border shadow-lg transition-all ${
          toast.ok
            ? "bg-[#1CE479]/10 border-[#1CE479]/30 text-[#1CE479]"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          {toast.ok ? <Check className="inline w-4 h-4 mr-1.5" /> : <X className="inline w-4 h-4 mr-1.5" />}
          {toast.msg}
        </div>
      )}

      {/* ── Hero Card ─────────────────────────────────────────────────── */}
      <div className="relative bg-card border border-border rounded-2xl overflow-hidden">
        {/* Cover gradient */}
        <div className="h-32 md:h-44 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />

        {/* Avatar + info row */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14">
            {/* Avatar */}
            <div className="relative group shrink-0 self-start">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-card overflow-hidden bg-primary/20 flex items-center justify-center shadow-xl">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-primary">{initials}</span>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            {/* Name & meta */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl md:text-2xl font-bold text-white truncate">{profile?.fullName}</h1>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                  profile?.role === "SUPER_ADMIN" ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-400"
                  : profile?.role === "ADMIN" ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                  : "bg-primary/15 border-primary/30 text-primary"
                }`}>
                  {profile?.role === "SUPER_ADMIN" ? "Super Admin" : profile?.role === "ADMIN" ? "Admin" : "Thành viên"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {(profile?.email || profile?.phone) && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {profile?.phone || profile?.email}
                  </span>
                )}
                {profile?.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile.address}
                  </span>
                )}
                {profile?.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Tham gia {new Date(profile.createdAt).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
                  </span>
                )}
              </div>
              {profile?.bio && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>
              )}
            </div>

            {/* Stats + Edit button */}
            <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
              <div className="text-center sm:text-right">
                <p className="text-2xl font-bold text-white">{listingCount}</p>
                <p className="text-xs text-muted-foreground">Tin đăng</p>
              </div>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 text-sm text-muted-foreground hover:text-white transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleCancel} className="px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? "Đang lưu..." : "Lưu"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Left panel ──────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Tab switcher */}
          <div className="flex bg-card border border-border rounded-xl p-1 gap-1">
            {(["info", "contact"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === t
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "info" ? "Thông tin" : "Liên lạc"}
              </button>
            ))}
          </div>

          {/* Info tab */}
          {activeTab === "info" && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              {editing ? (
                <>
                  <FormField label="Họ tên" value={fullName} onChange={setFullName} />
                  <FormField label="Số điện thoại" value={phone} onChange={setPhone} />
                  <FormField label="Địa chỉ" value={address} onChange={setAddress} />
                  <FormField label="Ngày sinh" value={dateOfBirth} onChange={setDateOfBirth} type="date" />
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">Giới thiệu</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
                      placeholder="Viết vài dòng về bạn..."
                    />
                  </div>
                </>
              ) : (
                <dl className="space-y-3">
                  <InfoRow label="Họ tên" value={profile?.fullName} />
                  <InfoRow label="Số điện thoại" value={profile?.phone} />
                  <InfoRow label="Email" value={profile?.email} />
                  <InfoRow label="Địa chỉ" value={profile?.address} />
                  <InfoRow
                    label="Ngày sinh"
                    value={profile?.dateOfBirth
                      ? new Date(profile.dateOfBirth).toLocaleDateString("vi-VN")
                      : undefined}
                  />
                  {profile?.bio && (
                    <div>
                      <dt className="text-xs text-muted-foreground mb-1">Giới thiệu</dt>
                      <dd className="text-sm text-foreground leading-relaxed">{profile.bio}</dd>
                    </div>
                  )}
                  {!profile?.phone && !profile?.email && !profile?.address && !profile?.bio && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Chưa có thông tin.{" "}
                      <button onClick={() => setEditing(true)} className="text-primary underline">Cập nhật ngay</button>
                    </p>
                  )}
                </dl>
              )}
            </div>
          )}

          {/* Contact tab */}
          {activeTab === "contact" && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              {editing ? (
                <>
                  <SocialFormField icon={<ZaloIcon />} label="Zalo" value={zalo} onChange={setZalo} placeholder="Số Zalo" />
                  <SocialFormField icon={<LineIcon />} label="LINE" value={lineId} onChange={setLineId} placeholder="LINE ID" />
                  <SocialFormField icon={<FbIcon />} label="Facebook" value={facebook} onChange={setFacebook} placeholder="Link hoặc tên" />
                  <SocialFormField icon={<TikTokIcon />} label="TikTok" value={tiktok} onChange={setTiktok} placeholder="@tiktok của bạn" />
                </>
              ) : (
                <>
                  <SocialDisplayRow icon={<ZaloIcon />} label="Zalo" value={profile?.zalo} />
                  <SocialDisplayRow icon={<LineIcon />} label="LINE" value={profile?.lineId} />
                  <SocialDisplayRow icon={<FbIcon />} label="Facebook" value={profile?.facebook} href={profile?.facebook?.startsWith("http") ? profile.facebook : undefined} />
                  <SocialDisplayRow icon={<TikTokIcon />} label="TikTok" value={profile?.tiktok} />
                  {!profile?.zalo && !profile?.lineId && !profile?.facebook && !profile?.tiktok && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Chưa có liên lạc.{" "}
                      <button onClick={() => setEditing(true)} className="text-primary underline">Thêm ngay</button>
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Right panel — Listings ───────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Bài đăng của tôi
              <span className="text-sm font-normal text-muted-foreground">({listingCount})</span>
            </h2>
            <Link
              href="/dang-tin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Đăng tin
            </Link>
          </div>

          {/* Status filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {STATUS_TABS.map((t) => {
              const count = t.key === "ALL" ? listings.length : listings.filter((l) => l.status === t.key).length;
              return (
                <button
                  key={t.key}
                  onClick={() => setStatusFilter(t.key)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    statusFilter === t.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                  }`}
                >
                  {t.label}
                  {count > 0 && (
                    <span className={`ml-1.5 text-xs ${statusFilter === t.key ? "opacity-80" : "text-muted-foreground"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Grid */}
          {filteredListings.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <Home className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {statusFilter === "ALL" ? "Bạn chưa có tin đăng nào." : `Không có tin ở trạng thái "${STATUS_TABS.find(t=>t.key===statusFilter)?.label}".`}
              </p>
              {statusFilter === "ALL" && (
                <Link href="/dang-tin" className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  <PlusCircle className="w-4 h-4" /> Đăng tin ngay
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredListings.map((listing) => (
                <MyListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <dt className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-foreground flex-1 break-words">{value}</dd>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
      />
    </div>
  );
}

function SocialFormField({ icon, label, value, onChange, placeholder }: {
  icon: React.ReactNode; label: string; value: string;
  onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <label className="block text-xs text-muted-foreground mb-1">{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </div>
    </div>
  );
}

function SocialDisplayRow({ icon, label, value, href }: {
  icon: React.ReactNode; label: string; value?: string; href?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className="text-sm text-primary hover:underline truncate block">{value}</a>
        ) : (
          <p className="text-sm text-foreground truncate">{value}</p>
        )}
      </div>
      {href && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
    </div>
  );
}

function MyListingCard({ listing }: { listing: Listing }) {
  const cover = listing.coverImageUrl ?? listing.imageUrls?.[0];
  const re = listing.realEstateDetails;
  const car = listing.carDetails;

  return (
    <Link href={`/tin-dang/${listing.id}`} className="group block">
      <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all">
        {/* Image */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          {cover ? (
            <ImageWithFallback
              src={cover}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Home className="w-8 h-8" />
            </div>
          )}
          {/* Status badge */}
          <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor(listing.status)}`}>
            {statusLabel(listing.status)}
          </span>
          {listing.featured && (
            <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 font-medium">
              Nổi bật
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2 min-h-[2.5rem]">
            {listing.title}
          </h3>
          <p className="text-primary font-bold mb-2">
            {formatPrice(listing.price, listing.priceUnit)}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {re && re.bedrooms != null && (
                <span className="flex items-center gap-1"><Bed className="w-3 h-3"/>{re.bedrooms}</span>
              )}
              {re && re.bathrooms != null && (
                <span className="flex items-center gap-1"><Bath className="w-3 h-3"/>{re.bathrooms}</span>
              )}
              {re?.areaSqm && <span>{re.areaSqm}m²</span>}
              {car && <span>{car.brand} {car.model} · {car.manufactureYear}</span>}
            </div>
            <span>{timeAgo(listing.createdAt)}</span>
          </div>
          {(re?.city || re?.district) && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{[re.district, re.city].filter(Boolean).join(", ")}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
