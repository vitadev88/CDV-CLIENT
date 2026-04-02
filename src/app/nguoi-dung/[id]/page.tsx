"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Listing, ListingPage } from "@/types";
import { formatPrice, timeAgo, statusLabel, statusColor } from "@/lib/utils";
import {
  ArrowLeft, MapPin, Calendar, Phone, Home,
  Bed, Bath, User as UserIcon, ChevronRight,
  MessageSquare, Package,
} from "lucide-react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PublicProfile {
  id: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  address?: string;
  zalo?: string;
  lineId?: string;
  facebook?: string;
  tiktok?: string;
  createdAt: string;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ data: PublicProfile }>(`/users/${id}/public`),
      api.get<{ data: ListingPage }>(`/users/${id}/listings`),
    ]).then(([userRes, listRes]) => {
      setProfile(userRes.data.data ?? null);
      setListings(listRes.data.data?.content ?? []);
    }).catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="max-w-4xl mx-auto p-5 space-y-5">
      <div className="h-40 bg-muted rounded-2xl animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-52 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  if (notFound || !profile) return (
    <div className="p-10 text-center text-muted-foreground">
      <UserIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p>Không tìm thấy người dùng này.</p>
      <button onClick={() => router.back()} className="mt-4 text-primary text-sm hover:underline">
        Quay lại
      </button>
    </div>
  );

  const initials = profile.fullName?.slice(0, 2).toUpperCase() ?? "?";
  const hasSocial = profile.zalo || profile.lineId || profile.facebook || profile.tiktok;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Back */}
      <button onClick={() => router.back()}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-white text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      {/* ── Profile Card ──────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Cover */}
        <div className="h-28 md:h-36 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />

        <div className="px-5 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            {/* Avatar */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-card overflow-hidden bg-primary/20 flex items-center justify-center shadow-xl shrink-0">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary">{initials}</span>
              )}
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-xl font-bold text-white mb-1">{profile.fullName}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {profile.phone && (
                  <a href={`tel:${profile.phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                    <Phone className="w-3.5 h-3.5" /> {profile.phone}
                  </a>
                )}
                {profile.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {profile.address}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Tham gia {new Date(profile.createdAt).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
                </span>
              </div>
              {profile.bio && (
                <p className="mt-2 text-sm text-muted-foreground">{profile.bio}</p>
              )}
            </div>

            {/* Stats */}
            <div className="text-center shrink-0">
              <p className="text-2xl font-bold text-white">{listings.length}</p>
              <p className="text-xs text-muted-foreground">Tin đăng</p>
            </div>
          </div>

          {/* Contact row */}
          {(profile.phone || hasSocial) && (
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
              {profile.phone && (
                <a href={`tel:${profile.phone}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  <Phone className="w-4 h-4" /> Gọi điện
                </a>
              )}
              {profile.zalo && (
                <ContactChip icon={<ZaloIcon />} label={profile.zalo} href={`https://zalo.me/${profile.zalo.replace(/\D/g, "")}`} />
              )}
              {profile.lineId && (
                <ContactChip icon={<LineIcon />} label={profile.lineId} />
              )}
              {profile.facebook && (
                <ContactChip icon={<FbIcon />} label="Facebook"
                  href={profile.facebook.startsWith("http") ? profile.facebook : `https://facebook.com/${profile.facebook}`} />
              )}
              {profile.tiktok && (
                <ContactChip icon={<TikTokIcon />} label={profile.tiktok}
                  href={`https://tiktok.com/@${profile.tiktok.replace("@", "")}`} />
              )}
              <Link href={`/tin-nhan?userId=${profile.id}`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-white hover:border-primary/50 transition-colors">
                <MessageSquare className="w-4 h-4" /> Nhắn tin
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Listings ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-primary" />
          Tin đăng của {profile.fullName}
          <span className="text-sm font-normal text-muted-foreground">({listings.length})</span>
        </h2>

        {listings.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <Home className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">Người dùng này chưa có tin đăng nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <PublicListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ContactChip({ icon, label, href }: { icon: React.ReactNode; label: string; href?: string }) {
  const cls = "flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-white hover:border-primary/50 transition-colors";
  if (href) return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {icon} {label} <ChevronRight className="w-3.5 h-3.5 opacity-50" />
    </a>
  );
  return (
    <div className={cls}>
      {icon} {label}
    </div>
  );
}

function PublicListingCard({ listing }: { listing: Listing }) {
  const cover = listing.coverImageUrl ?? listing.imageUrls?.[0];
  const re = listing.realEstateDetails;
  const car = listing.carDetails;

  return (
    <Link href={`/tin-dang/${listing.id}`} className="group block">
      <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all">
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
          <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor(listing.status)}`}>
            {statusLabel(listing.status)}
          </span>
          {listing.featured && (
            <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 font-medium">
              Nổi bật
            </span>
          )}
        </div>
        <div className="p-3">
          <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2 min-h-[2.5rem]">{listing.title}</h3>
          <p className="text-primary font-bold mb-1.5">{formatPrice(listing.price, listing.priceUnit)}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {re?.bedrooms != null && <span className="flex items-center gap-1"><Bed className="w-3 h-3"/>{re.bedrooms}</span>}
              {re?.bathrooms != null && <span className="flex items-center gap-1"><Bath className="w-3 h-3"/>{re.bathrooms}</span>}
              {re?.areaSqm && <span>{re.areaSqm}m²</span>}
              {car && <span>{car.brand} {car.model}</span>}
            </div>
            <span>{timeAgo(listing.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
