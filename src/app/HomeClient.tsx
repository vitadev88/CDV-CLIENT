"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import api from "@/lib/api";
import { Listing } from "@/types";
import ListingCard from "@/components/ListingCard";
import HomeBlogSection from "@/components/HomeBlogSection";
import { Building2, Car, Tag, ChevronRight, Briefcase, Search, MapPin, Star, Heart, Copy, Check } from "lucide-react";
import Image from "next/image";
import React from "react";

interface DonationAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrImageUrl: string | null;
}

interface Category {
  id: string;
  code: string;
  name: string;
  detailType: string | null;
  active: boolean;
  sortOrder: number;
  children: Category[];
}

const publicApi = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1`,
});

// ── Quick-access category tiles ──────────────────────────────────────────────
const QUICK_CATS = [
  { icon: Building2, label: "Bất động sản", href: "/tim-kiem?category=HOUSE_RENT",    cardColor: "bg-red-50 border-red-100",       iconColor: "bg-red-50 text-[#D41B2C] border-red-100" },
  { icon: Car,       label: "Xe cộ",         href: "/tim-kiem?category=CAR_SALE",      cardColor: "bg-white border-[#E5E7EB]",     iconColor: "bg-orange-50 text-orange-500 border-orange-100" },
  { icon: Briefcase, label: "Việc làm",       href: "/tim-kiem?category=JOB_SEEKING",  cardColor: "bg-blue-50 border-blue-100",    iconColor: "bg-blue-50 text-blue-600 border-blue-100" },
  { icon: Tag,       label: "Hàng hoá",       href: "/tim-kiem?category=GOODS_HOUSEHOLD", cardColor: "bg-green-50 border-green-100", iconColor: "bg-green-50 text-green-600 border-green-100" },
];

function iconForDetailType(dt: string | null): React.ElementType {
  if (dt === "CAR") return Car;
  if (dt === "REAL_ESTATE") return Building2;
  if (dt === "JOB") return Briefcase;
  return Tag;
}

function getLeafCategories(cats: Category[]) {
  const out: { code: string; label: string; icon: React.ElementType }[] = [];
  for (const cat of cats) {
    if (cat.children.length > 0) {
      cat.children.filter((c) => c.active).forEach((c) =>
        out.push({ code: c.code, label: c.name, icon: iconForDetailType(c.detailType) })
      );
    } else if (cat.active) {
      out.push({ code: cat.code, label: cat.name, icon: iconForDetailType(cat.detailType) });
    }
  }
  return out;
}

export default function HomeClient() {
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [sections, setSections] = useState<Record<string, { listings: Listing[]; total: number }>>({});
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<{ code: string; label: string; icon: React.ElementType }[]>([]);
  const [search, setSearch] = useState("");
  const [donations, setDonations] = useState<DonationAccount[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const catRes = await publicApi.get<{ data: Category[] }>("/categories");
      const l = getLeafCategories(catRes.data.data ?? []);
      setLeaves(l);
      const [featuredRes, ...catResults] = await Promise.all([
        api.get("/listings?size=8&page=0"),
        ...l.map((s) => api.get(`/listings?categoryCode=${s.code}&size=4&page=0`)),
      ]);
      setFeatured(featuredRes.data.data?.content ?? []);
      const map: Record<string, { listings: Listing[]; total: number }> = {};
      l.forEach((s, i) => {
        map[s.code] = {
          listings: catResults[i]?.data?.data?.content ?? [],
          total: catResults[i]?.data?.data?.totalElements ?? 0,
        };
      });
      setSections(map);
      setLoading(false);
    };
    init();
    publicApi.get<{ data: DonationAccount[] }>("/donation-accounts/active")
      .then((res) => setDonations(res.data.data ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">

      {/* ── Hero Banner ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#D41B2C] to-[#9B1220] text-white px-6 py-12 md:py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20
                          rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            <Star className="w-3.5 h-3.5 fill-[#F4C542] text-[#F4C542]" />
            Cộng đồng người Việt tại Đài Loan
          </div>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
            Mua bán dễ dàng,<br />kết nối cộng đồng
          </h1>
          <p className="text-white/75 text-base mb-8">
            Hàng nghìn tin đăng bất động sản, xe cộ, việc làm và dịch vụ.
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#6B7280]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && search.trim())
                  window.location.href = `/tim-kiem?keyword=${encodeURIComponent(search.trim())}`;
              }}
              placeholder="Tìm kiếm tin đăng, bất động sản, xe cộ..."
              className="w-full pl-11 pr-32 py-3.5 rounded-xl text-[#1F2937] bg-white
                         shadow-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F4C542]"
            />
            <Link
              href={search.trim() ? `/tim-kiem?keyword=${encodeURIComponent(search.trim())}` : "/tim-kiem"}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#D41B2C] hover:bg-[#B91624]
                         text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Tìm kiếm
            </Link>
          </div>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-white/70">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Đài Loan</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>10,000+ tin đăng</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>Miễn phí đăng tin</span>
          </div>
        </div>
      </section>

      {/* ── Category Quick Links ──────────────────────────────────────────── */}
      <section className="px-6 -mt-5 mb-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUICK_CATS.map(({ icon: Icon, label, href, cardColor, iconColor }) => (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-2.5 p-5 rounded-xl border
                            shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all ${cardColor}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-[#1F2937]">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="px-6 pb-12 max-w-5xl mx-auto space-y-10">

        {/* ── Featured Listings ───────────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Tin đăng nổi bật"
            subtitle="Được quan tâm nhiều nhất hôm nay"
            href="/tim-kiem"
          />
          {loading ? (
            <SkeletonGrid count={8} cols="grid-cols-2 md:grid-cols-4" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featured.map((l, i) => (
                <ListingCard key={l.id} listing={l} badge={i === 0 ? "Nổi bật" : undefined} />
              ))}
            </div>
          )}
        </section>

        {/* ── Per-category Sections ───────────────────────────────────────── */}
        {leaves.map(({ code, label, icon: Icon }) => {
          const sec = sections[code];
          if (!loading && (!sec || sec.listings.length === 0)) return null;
          return (
            <section key={code}>
              <SectionHeader
                icon={<Icon className="w-5 h-5" />}
                title={label}
                subtitle={loading ? "" : `${sec?.total?.toLocaleString() ?? 0} tin đăng`}
                href={`/tim-kiem?category=${code}`}
              />
              {loading ? (
                <SkeletonGrid count={4} cols="grid-cols-2 md:grid-cols-4" />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {sec?.listings.map((l, i) => (
                    <ListingCard key={l.id} listing={l} badge={i === 0 ? "Nổi bật" : undefined} />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {/* ── Blog nổi bật ─────────────────────────────────────────────── */}
        <HomeBlogSection />

        {/* ── CTA Banner ──────────────────────────────────────────────────── */}
        <section className="rounded-2xl bg-gradient-to-r from-[#D41B2C] to-[#9B1220]
                            text-white p-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <h3 className="text-xl font-bold mb-1">Đăng tin miễn phí ngay hôm nay</h3>
            <p className="text-white/75 text-sm">Tiếp cận hàng nghìn người mua trong cộng đồng người Việt tại Đài Loan.</p>
          </div>
          <Link
            href="/dang-tin"
            className="shrink-0 bg-[#F4C542] hover:bg-[#e0b33a] text-[#1F2937] font-bold
                       px-6 py-3 rounded-xl text-sm transition-colors whitespace-nowrap shadow-lg"
          >
            Đăng tin ngay
          </Link>
        </section>

        {/* ── Donate ──────────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-[#e8c84a] bg-[#F4C542] p-6">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
            <h3 className="text-lg font-bold text-[#1F2937]">Ủng hộ website</h3>
          </div>
          <p className="text-sm text-[#7a5c00] mb-5">
            Website hoạt động hoàn toàn miễn phí. Mọi đóng góp giúp chúng tôi duy trì hệ thống và phát triển thêm tính năng mới. Cảm ơn bạn rất nhiều!
          </p>
          {donations.length === 0 ? (
            <p className="text-sm text-[#a07800] italic">Chưa có thông tin tài khoản.</p>
          ) : (
            <div className="flex flex-wrap gap-5">
              {donations.map((a) => (
                <div key={a.id} className="flex items-center gap-4 bg-white/70 border border-yellow-300 rounded-xl p-4">
                  {a.qrImageUrl && (
                    <Image
                      src={a.qrImageUrl}
                      alt={`QR ${a.bankName}`}
                      width={88}
                      height={88}
                      className="rounded-lg object-cover shrink-0"
                      unoptimized
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-rose-500 uppercase tracking-wide mb-1">{a.bankName}</p>
                    <div className="flex items-center gap-1.5">
                      <p className="font-mono text-base font-bold text-[#1F2937]">{a.accountNumber}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(a.accountNumber);
                          setCopiedId(a.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="text-[#9CA3AF] hover:text-rose-500 transition-colors"
                        title="Sao chép"
                      >
                        {copiedId === a.id
                          ? <Check className="w-3.5 h-3.5 text-rose-500" />
                          : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-sm text-[#6B7280] mt-0.5">{a.accountHolder}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({
  icon, title, subtitle, href,
}: {
  icon?: React.ReactNode; title: string; subtitle?: string; href: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-9 h-9 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center text-[#D41B2C]">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold text-[#1F2937]">{title}</h2>
          {subtitle && <p className="text-xs text-[#6B7280] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <Link
        href={href}
        className="flex items-center gap-1 text-sm font-medium text-[#D41B2C] hover:text-[#B91624] transition-colors"
      >
        Xem tất cả <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonGrid({ count, cols }: { count: number; cols: string }) {
  return (
    <div className={`grid ${cols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden animate-pulse">
          <div className="aspect-[4/3] bg-[#F3F4F6]" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-[#F3F4F6] rounded w-full" />
            <div className="h-4 bg-[#F3F4F6] rounded w-2/3" />
            <div className="h-5 bg-[#F3F4F6] rounded w-1/2 mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}
