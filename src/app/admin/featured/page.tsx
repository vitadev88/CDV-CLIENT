"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Star, X, Search, Plus, Check, AlertTriangle,
  ChevronLeft, ChevronRight, ImageOff,
  Home, Car, Calendar, User, Tag,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AdminShell from "@/components/admin/AdminShell";

// ── Types ──────────────────────────────────────────────────────────────────

interface Listing {
  id: string;
  title: string;
  categoryCode: string;
  categoryName: string;
  price: number;
  priceUnit: string;
  status: string;
  featured: boolean;
  coverImageUrl: string | null;
  createdByName: string;
  createdAt: string;
}

interface RealEstateDetail {
  city: string; district: string; address: string;
  areaSqm: number; bedrooms: number; bathrooms: number;
  floors: number; furnished: boolean;
  availableFrom: string; deposit: number;
}

interface CarDetail {
  brand: string; model: string; manufactureYear: number;
  mileageKm: number; fuelType: string; transmission: string; color: string;
}

interface ListingDetail extends Listing {
  description: string;
  imageUrls: string[];
  realEstateDetails: RealEstateDetail | null;
  carDetails: CarDetail | null;
}

interface PageMeta {
  totalElements: number;
  totalPages: number;
  number: number;
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  INACTIVE: "bg-[#2A2A35] text-[#9CA3AF] border-[#2A2A35]",
  SOLD:     "bg-blue-500/10 text-blue-400 border-blue-500/20",
  RENTED:   "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Đang đăng", INACTIVE: "Ẩn", SOLD: "Đã bán", RENTED: "Đã thuê",
};

const PRICE_UNIT_LABEL: Record<string, string> = {
  MONTHLY: "/tháng", TOTAL: "", NEGOTIABLE: " (TT)",
};

function formatPrice(price: number, unit: string) {
  const val = price >= 1_000_000_000
    ? `${(price / 1_000_000_000).toFixed(1)} tỷ`
    : price >= 1_000_000
    ? `${(price / 1_000_000).toFixed(0)} triệu`
    : price.toLocaleString("vi-VN");
  return val + (PRICE_UNIT_LABEL[unit] ?? "");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function FeaturedPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Featured list
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [featMeta, setFeatMeta] = useState<PageMeta>({ totalElements: 0, totalPages: 0, number: 0 });
  const [featPage, setFeatPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Detail drawer
  const [detailTarget, setDetailTarget] = useState<ListingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailImageIdx, setDetailImageIdx] = useState(0);

  // Add-listing search panel
  const [showSearch, setShowSearch] = useState(false);
  const [searchKw, setSearchKw] = useState("");
  const [searchResults, setSearchResults] = useState<Listing[]>([]);
  const [searchMeta, setSearchMeta] = useState<PageMeta>({ totalElements: 0, totalPages: 0, number: 0 });
  const [searchPage, setSearchPage] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);

  // Remove confirm
  const [removeTarget, setRemoveTarget] = useState<Listing | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ── Fetch featured ─────────────────────────────────────────────────────

  const fetchFeatured = useCallback(async (pg: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ featured: "true", size: "12", page: String(pg), sort: "createdAt,desc" });
      const res = await api.get<{ data: { content: Listing[]; totalElements: number; totalPages: number; number: number } }>(
        `/listings/admin?${params}`
      );
      const d = res.data.data;
      setFeatured(d.content ?? []);
      setFeatMeta({ totalElements: d.totalElements, totalPages: d.totalPages, number: d.number });
    } catch {
      showToast("Không thể tải danh sách nổi bật", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/dang-nhap"); return; }
    fetchFeatured(featPage);
  }, [isAuthenticated, router, fetchFeatured, featPage]);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Detail drawer ──────────────────────────────────────────────────────

  async function openDetail(listing: Listing) {
    setDetailLoading(true);
    setDetailTarget(null);
    setDetailImageIdx(0);
    try {
      const res = await api.get<{ data: ListingDetail }>(`/listings/${listing.id}`);
      setDetailTarget(res.data.data);
    } catch {
      showToast("Không thể tải chi tiết", "error");
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetailTarget(null);
    setDetailLoading(false);
  }

  // ── Search listings to add ─────────────────────────────────────────────

  const doSearch = useCallback(async (kw: string, pg: number) => {
    setSearchLoading(true);
    try {
      const params = new URLSearchParams({ size: "8", page: String(pg), sort: "createdAt,desc" });
      if (kw) params.set("keyword", kw);
      const res = await api.get<{ data: { content: Listing[]; totalElements: number; totalPages: number; number: number } }>(
        `/listings/admin?${params}`
      );
      const d = res.data.data;
      setSearchResults(d.content ?? []);
      setSearchMeta({ totalElements: d.totalElements, totalPages: d.totalPages, number: d.number });
    } catch {
      showToast("Tìm kiếm thất bại", "error");
    } finally {
      setSearchLoading(false);
    }
  }, []);

  function openSearch() {
    setShowSearch(true);
    setSearchKw("");
    setSearchPage(0);
    doSearch("", 0);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearchPage(0);
    doSearch(searchKw, 0);
  }

  useEffect(() => {
    if (showSearch) doSearch(searchKw, searchPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchPage]);

  // ── Toggle featured ────────────────────────────────────────────────────

  async function toggleFeatured(listing: Listing, value: boolean) {
    try {
      await api.patch(`/listings/${listing.id}/featured`, { featured: value });
      showToast(value ? "Đã thêm vào nổi bật" : "Đã gỡ khỏi nổi bật", "success");
      fetchFeatured(featPage);
      if (showSearch) doSearch(searchKw, searchPage);
      // Update detail drawer if open
      if (detailTarget?.id === listing.id) {
        setDetailTarget((prev) => prev ? { ...prev, featured: value } : null);
      }
    } catch {
      showToast("Thao tác thất bại", "error");
    }
  }

  async function submitRemove() {
    if (!removeTarget) return;
    setRemoveLoading(true);
    try {
      await api.patch(`/listings/${removeTarget.id}/featured`, { featured: false });
      showToast("Đã gỡ khỏi nổi bật", "success");
      setRemoveTarget(null);
      fetchFeatured(featPage);
    } catch {
      showToast("Thao tác thất bại", "error");
    } finally {
      setRemoveLoading(false);
    }
  }

  return (
    <AdminShell>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Tin đăng nổi bật</h1>
            <p className="text-sm text-[#9CA3AF] mt-0.5">
              {loading ? "Đang tải..." : `${featMeta.totalElements} tin nổi bật`}
            </p>
          </div>
          <button
            onClick={openSearch}
            className="flex items-center gap-2 bg-[#1CE479] text-black text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1CE479]/90 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Thêm tin nổi bật
          </button>
        </div>

        {/* Featured grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#1A1A20] border border-[#2A2A35] rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-[#2A2A35]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 bg-[#2A2A35] rounded" />
                  <div className="h-3 w-1/2 bg-[#2A2A35] rounded" />
                  <div className="h-5 w-1/3 bg-[#2A2A35] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="bg-[#1A1A20] border border-[#2A2A35] rounded-2xl py-20 flex flex-col items-center gap-3">
            <Star className="w-10 h-10 text-[#2A2A35]" />
            <p className="text-sm text-[#9CA3AF]">Chưa có tin nổi bật</p>
            <button onClick={openSearch} className="mt-1 text-sm text-[#1CE479] hover:underline">
              Thêm tin nổi bật ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((listing) => (
              <div
                key={listing.id}
                onClick={() => openDetail(listing)}
                className="bg-[#1A1A20] border border-[#2A2A35] rounded-2xl overflow-hidden group hover:border-[#1CE479]/30 transition-colors cursor-pointer"
              >
                {/* Cover */}
                <div className="aspect-video bg-[#09090b] relative overflow-hidden">
                  {listing.coverImageUrl ? (
                    <img src={listing.coverImageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#2A2A35]">
                      <ImageOff className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500/90 text-black text-xs font-semibold px-2 py-1 rounded-full">
                    <Star className="w-3 h-3 fill-black" /> Nổi bật
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setRemoveTarget(listing); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    title="Gỡ nổi bật"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-4 space-y-1.5">
                  <p className="text-sm font-semibold text-white line-clamp-2 leading-snug">{listing.title}</p>
                  <p className="text-xs text-[#9CA3AF]">{listing.categoryName}</p>
                  <p className="text-base font-bold text-[#1CE479]">{formatPrice(listing.price, listing.priceUnit)}</p>
                  <p className="text-xs text-[#9CA3AF]">Bởi {listing.createdByName}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && featMeta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setFeatPage((p) => Math.max(0, p - 1))} disabled={featMeta.number === 0}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#9CA3AF] hover:bg-[#1A1A20] disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: featMeta.totalPages }, (_, i) => (
              <button key={i} onClick={() => setFeatPage(i)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${i === featMeta.number ? "bg-[#1CE479] text-black" : "text-[#9CA3AF] hover:bg-[#1A1A20] hover:text-white"}`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setFeatPage((p) => Math.min(featMeta.totalPages - 1, p + 1))} disabled={featMeta.number >= featMeta.totalPages - 1}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#9CA3AF] hover:bg-[#1A1A20] disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Detail drawer ─────────────────────────────────────────────── */}
      {(detailLoading || detailTarget) && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={closeDetail} />
          <div className="w-full max-w-lg bg-[#111118] border-l border-[#1A1A20] flex flex-col overflow-hidden shadow-2xl">

            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A20] shrink-0">
              <h2 className="text-base font-semibold text-white">Chi tiết tin đăng</h2>
              <button onClick={closeDetail} className="text-[#9CA3AF] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#1CE479] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : detailTarget ? (
              <div className="flex-1 overflow-y-auto">

                {/* Images */}
                <div className="relative bg-[#09090b] aspect-video">
                  {detailTarget.imageUrls.length > 0 ? (
                    <>
                      <img src={detailTarget.imageUrls[detailImageIdx]} alt="" className="w-full h-full object-cover" />
                      {detailTarget.imageUrls.length > 1 && (
                        <>
                          <button onClick={() => setDetailImageIdx((i) => Math.max(0, i - 1))} disabled={detailImageIdx === 0}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 disabled:opacity-30 transition-all">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDetailImageIdx((i) => Math.min(detailTarget.imageUrls.length - 1, i + 1))} disabled={detailImageIdx === detailTarget.imageUrls.length - 1}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 disabled:opacity-30 transition-all">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {detailTarget.imageUrls.map((_, i) => (
                              <button key={i} onClick={() => setDetailImageIdx(i)}
                                className={`h-1.5 rounded-full transition-all ${i === detailImageIdx ? "bg-white w-4" : "bg-white/40 w-1.5"}`} />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#2A2A35]">
                      <ImageOff className="w-10 h-10" />
                      <span className="text-sm">Không có ảnh</span>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-6">

                  {/* Title + badges */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_STYLE[detailTarget.status] ?? "bg-[#2A2A35] text-[#9CA3AF]"}`}>
                        {STATUS_LABEL[detailTarget.status] ?? detailTarget.status}
                      </span>
                      {detailTarget.featured && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400" /> Nổi bật
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white leading-snug">{detailTarget.title}</h3>
                    <p className="text-2xl font-bold text-[#1CE479]">{formatPrice(detailTarget.price, detailTarget.priceUnit)}</p>
                  </div>

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 bg-[#1A1A20] rounded-xl border border-[#2A2A35]">
                      <Tag className="w-4 h-4 text-[#1CE479] shrink-0" />
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Danh mục</p>
                        <p className="text-sm text-white font-medium">{detailTarget.categoryName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-[#1A1A20] rounded-xl border border-[#2A2A35]">
                      <User className="w-4 h-4 text-[#1CE479] shrink-0" />
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Người đăng</p>
                        <p className="text-sm text-white font-medium">{detailTarget.createdByName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-[#1A1A20] rounded-xl border border-[#2A2A35] col-span-2">
                      <Calendar className="w-4 h-4 text-[#1CE479] shrink-0" />
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Ngày đăng</p>
                        <p className="text-sm text-white font-medium">{formatDate(detailTarget.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {detailTarget.description && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">Mô tả</p>
                      <p className="text-sm text-[#D1D5DB] leading-relaxed whitespace-pre-wrap">{detailTarget.description}</p>
                    </div>
                  )}

                  {/* Real estate details */}
                  {detailTarget.realEstateDetails && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-[#1CE479]" />
                        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">Bất động sản</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "Địa chỉ", value: [detailTarget.realEstateDetails.address, detailTarget.realEstateDetails.district, detailTarget.realEstateDetails.city].filter(Boolean).join(", "), cols: 2 },
                          { label: "Diện tích", value: detailTarget.realEstateDetails.areaSqm ? `${detailTarget.realEstateDetails.areaSqm} m²` : null },
                          { label: "Phòng ngủ", value: detailTarget.realEstateDetails.bedrooms ? `${detailTarget.realEstateDetails.bedrooms} phòng` : null },
                          { label: "Phòng tắm", value: detailTarget.realEstateDetails.bathrooms ? `${detailTarget.realEstateDetails.bathrooms} phòng` : null },
                          { label: "Số tầng", value: detailTarget.realEstateDetails.floors ? `${detailTarget.realEstateDetails.floors} tầng` : null },
                          { label: "Nội thất", value: detailTarget.realEstateDetails.furnished ? "Có" : "Không" },
                          { label: "Đặt cọc", value: detailTarget.realEstateDetails.deposit ? formatPrice(detailTarget.realEstateDetails.deposit, "TOTAL") : null },
                          { label: "Ngày trống", value: detailTarget.realEstateDetails.availableFrom ? new Date(detailTarget.realEstateDetails.availableFrom).toLocaleDateString("vi-VN") : null },
                        ].filter((r) => r.value).map((row) => (
                          <div key={row.label} className={`p-2.5 bg-[#1A1A20] rounded-lg border border-[#2A2A35] ${row.cols === 2 ? "col-span-2" : ""}`}>
                            <p className="text-xs text-[#9CA3AF]">{row.label}</p>
                            <p className="text-sm text-white mt-0.5">{row.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Car details */}
                  {detailTarget.carDetails && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-[#1CE479]" />
                        <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-widest">Thông tin xe</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "Hãng xe", value: detailTarget.carDetails.brand },
                          { label: "Model", value: detailTarget.carDetails.model },
                          { label: "Năm SX", value: detailTarget.carDetails.manufactureYear?.toString() },
                          { label: "Số km", value: detailTarget.carDetails.mileageKm ? `${detailTarget.carDetails.mileageKm.toLocaleString()} km` : null },
                          { label: "Nhiên liệu", value: detailTarget.carDetails.fuelType },
                          { label: "Hộp số", value: detailTarget.carDetails.transmission },
                          { label: "Màu sắc", value: detailTarget.carDetails.color },
                        ].filter((r) => r.value).map((row) => (
                          <div key={row.label} className="p-2.5 bg-[#1A1A20] rounded-lg border border-[#2A2A35]">
                            <p className="text-xs text-[#9CA3AF]">{row.label}</p>
                            <p className="text-sm text-white mt-0.5">{row.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action */}
                  <div className="pt-2">
                    <button
                      onClick={() => toggleFeatured(detailTarget, false)}
                      className="w-full h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" /> Gỡ khỏi nổi bật
                    </button>
                  </div>

                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Add listing search panel ───────────────────────────────────── */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setShowSearch(false)} />
          <div className="w-full max-w-lg bg-[#111118] border-l border-[#1A1A20] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A20] shrink-0">
              <h2 className="text-base font-semibold text-white">Thêm tin nổi bật</h2>
              <button onClick={() => setShowSearch(false)} className="text-[#9CA3AF] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSearchSubmit} className="px-6 py-4 border-b border-[#1A1A20] shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  value={searchKw}
                  onChange={(e) => setSearchKw(e.target.value)}
                  placeholder="Tìm theo tiêu đề..."
                  className="w-full bg-[#1A1A20] border border-[#2A2A35] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-[#9CA3AF] outline-none focus:border-[#1CE479] transition-colors"
                />
              </div>
            </form>
            <div className="flex-1 overflow-y-auto">
              {searchLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-14 h-12 bg-[#2A2A35] rounded-xl shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-3/4 bg-[#2A2A35] rounded" />
                        <div className="h-3 w-1/2 bg-[#2A2A35] rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-16 text-center text-sm text-[#9CA3AF]">Không tìm thấy tin đăng</div>
              ) : (
                <div className="p-4 space-y-2">
                  {searchResults.map((listing) => (
                    <div key={listing.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${listing.featured ? "border-amber-500/30 bg-amber-500/5" : "border-[#2A2A35] hover:border-[#1CE479]/30 hover:bg-white/[0.02]"}`}>
                      <div className="w-14 h-12 rounded-lg bg-[#09090b] border border-[#2A2A35] shrink-0 overflow-hidden">
                        {listing.coverImageUrl
                          ? <img src={listing.coverImageUrl} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><ImageOff className="w-4 h-4 text-[#2A2A35]" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{listing.title}</p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">{listing.categoryName} · {formatPrice(listing.price, listing.priceUnit)}</p>
                      </div>
                      {listing.featured ? (
                        <button onClick={() => toggleFeatured(listing, false)}
                          className="shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center hover:bg-amber-500/20 transition-colors" title="Gỡ nổi bật">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                        </button>
                      ) : (
                        <button onClick={() => toggleFeatured(listing, true)}
                          className="shrink-0 w-8 h-8 rounded-lg bg-[#1A1A20] border border-[#2A2A35] text-[#9CA3AF] flex items-center justify-center hover:bg-[#1CE479] hover:text-black hover:border-[#1CE479] transition-colors" title="Thêm nổi bật">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {!searchLoading && searchMeta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 px-6 py-3 border-t border-[#1A1A20] shrink-0">
                <button onClick={() => setSearchPage((p) => Math.max(0, p - 1))} disabled={searchMeta.number === 0}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#1A1A20] disabled:opacity-30 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-[#9CA3AF]">{searchMeta.number + 1} / {searchMeta.totalPages}</span>
                <button onClick={() => setSearchPage((p) => Math.min(searchMeta.totalPages - 1, p + 1))} disabled={searchMeta.number >= searchMeta.totalPages - 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#1A1A20] disabled:opacity-30 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Remove confirm ─────────────────────────────────────────────── */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A20] border border-[#2A2A35] rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A35]">
              <h2 className="text-base font-semibold text-white">Gỡ tin nổi bật</h2>
              <button onClick={() => setRemoveTarget(null)} className="text-[#9CA3AF] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <Star className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 fill-amber-400" />
                <p className="text-sm text-amber-200">
                  Gỡ <span className="font-semibold text-white">&quot;{removeTarget.title}&quot;</span> khỏi danh sách nổi bật?
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setRemoveTarget(null)} className="flex-1 h-10 rounded-xl border border-[#2A2A35] text-sm text-[#9CA3AF] hover:text-white transition-colors">Huỷ</button>
                <button onClick={submitRemove} disabled={removeLoading}
                  className="flex-1 h-10 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-500/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                  {removeLoading ? "Đang xử lý..." : <><Check className="w-4 h-4" /> Xác nhận</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === "success" ? "bg-[#1CE479] text-black" : "bg-red-500 text-white"}`}>
          {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </AdminShell>
  );
}
