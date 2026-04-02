"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Star, Trash2, X, AlertTriangle, Check,
  ChevronLeft, ChevronRight, Filter, Eye, MapPin,
  Home, Car, Calendar, User, Tag, ImageOff,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AdminShell from "@/components/admin/AdminShell";

// ── Types ──────────────────────────────────────────────────────────────────

interface Listing {
  id: string;
  categoryCode: string;
  categoryName: string;
  title: string;
  price: number;
  priceUnit: string;
  status: string;
  featured: boolean;
  coverImageUrl: string | null;
  createdById: string;
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
  size: number;
}

const STATUS_OPTIONS = ["", "ACTIVE", "INACTIVE", "SOLD", "RENTED"];

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
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function ListingsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ totalElements: 0, totalPages: 0, number: 0, size: 10 });
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);

  const [detailTarget, setDetailTarget] = useState<ListingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailImageIdx, setDetailImageIdx] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [statusTarget, setStatusTarget] = useState<Listing | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const fetchListings = useCallback(async (kw: string, status: string, pg: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (kw) params.set("keyword", kw);
      if (status) params.set("status", status);
      params.set("page", String(pg));
      params.set("size", "10");
      params.set("sort", "createdAt,desc");
      const res = await api.get<{ data: { content: Listing[]; totalElements: number; totalPages: number; number: number; size: number } }>(
        `/listings/admin?${params}`
      );
      const d = res.data.data;
      setListings(d.content ?? []);
      setMeta({ totalElements: d.totalElements, totalPages: d.totalPages, number: d.number, size: d.size });
    } catch {
      showToast("Không thể tải tin đăng", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/dang-nhap"); return; }
    fetchListings(keyword, statusFilter, page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, page]);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    fetchListings(keyword, statusFilter, 0);
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

  // ── Toggle featured ────────────────────────────────────────────────────

  async function toggleFeatured(listing: Listing) {
    try {
      await api.patch(`/listings/${listing.id}/featured`, { featured: !listing.featured });
      showToast(listing.featured ? "Đã bỏ nổi bật" : "Đã đặt nổi bật", "success");
      fetchListings(keyword, statusFilter, page);
    } catch {
      showToast("Thao tác thất bại", "error");
    }
  }

  // ── Change status ──────────────────────────────────────────────────────

  function openStatusModal(listing: Listing) {
    setStatusTarget(listing);
    setNewStatus(listing.status);
  }

  async function submitStatus() {
    if (!statusTarget || newStatus === statusTarget.status) return;
    setStatusLoading(true);
    try {
      await api.patch(`/listings/${statusTarget.id}/status`, { status: newStatus });
      showToast("Cập nhật trạng thái thành công", "success");
      setStatusTarget(null);
      fetchListings(keyword, statusFilter, page);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Cập nhật thất bại";
      showToast(msg, "error");
    } finally {
      setStatusLoading(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────

  async function submitDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/listings/${deleteTarget.id}`);
      showToast("Đã xoá tin đăng", "success");
      setDeleteTarget(null);
      fetchListings(keyword, statusFilter, page);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Xoá thất bại";
      showToast(msg, "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  return (
    <AdminShell>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-white">Tin đăng</h1>
            <p className="text-sm text-[#9CA3AF] mt-0.5">
              {loading ? "Đang tải..." : `${meta.totalElements} tin đăng`}
            </p>
          </div>
        </div>

        {/* Filters */}
        <form onSubmit={handleSearch} className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tiêu đề..."
              className="w-full bg-[#1A1A20] border border-[#2A2A35] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-[#9CA3AF] outline-none focus:border-[#1CE479] transition-colors"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1A1A20] border border-[#2A2A35] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white outline-none focus:border-[#1CE479] transition-colors appearance-none"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s ? STATUS_LABEL[s] : "Tất cả trạng thái"}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#1CE479] text-black text-sm font-semibold rounded-xl hover:bg-[#1CE479]/90 transition-colors"
          >
            Tìm
          </button>
        </form>

        {/* Table */}
        <div className="bg-[#1A1A20] border border-[#2A2A35] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A2A35]">
                  <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF]">Tin đăng</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF] hidden md:table-cell">Danh mục</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF] hidden lg:table-cell">Giá</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF]">Trạng thái</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF] hidden xl:table-cell">Người đăng</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF] hidden xl:table-cell">Ngày đăng</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-[#9CA3AF]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#2A2A35] last:border-0 animate-pulse">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-10 bg-[#2A2A35] rounded-lg shrink-0" />
                          <div className="h-4 w-36 bg-[#2A2A35] rounded" />
                        </div>
                      </td>
                      <td className="py-4 px-4 hidden md:table-cell"><div className="h-4 w-24 bg-[#2A2A35] rounded" /></td>
                      <td className="py-4 px-4 hidden lg:table-cell"><div className="h-4 w-20 bg-[#2A2A35] rounded" /></td>
                      <td className="py-4 px-4"><div className="h-5 w-20 bg-[#2A2A35] rounded-full" /></td>
                      <td className="py-4 px-4 hidden xl:table-cell"><div className="h-4 w-24 bg-[#2A2A35] rounded" /></td>
                      <td className="py-4 px-4 hidden xl:table-cell"><div className="h-4 w-20 bg-[#2A2A35] rounded" /></td>
                      <td className="py-4 px-4" />
                    </tr>
                  ))
                ) : listings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-[#9CA3AF]">
                      Không có tin đăng nào
                    </td>
                  </tr>
                ) : (
                  listings.map((listing) => (
                    <tr
                      key={listing.id}
                      onClick={() => openDetail(listing)}
                      className="border-b border-[#2A2A35] last:border-0 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    >
                      {/* Title + image */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-10 rounded-lg bg-[#09090b] border border-[#2A2A35] shrink-0 overflow-hidden">
                            {listing.coverImageUrl ? (
                              <img src={listing.coverImageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#2A2A35]">
                                <span className="text-xs">?</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate max-w-[180px]">{listing.title}</p>
                            {listing.featured && (
                              <span className="text-xs text-amber-400 flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400" /> Nổi bật
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <span className="text-xs px-2 py-1 rounded-lg bg-[#09090b] border border-[#2A2A35] text-[#9CA3AF] font-mono">
                          {listing.categoryCode}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 hidden lg:table-cell">
                        <span className="text-sm text-white font-medium">
                          {formatPrice(listing.price, listing.priceUnit)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openStatusModal(listing)}
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-opacity hover:opacity-80 ${STATUS_STYLE[listing.status] ?? "bg-[#2A2A35] text-[#9CA3AF] border-[#2A2A35]"}`}
                        >
                          {STATUS_LABEL[listing.status] ?? listing.status}
                        </button>
                      </td>

                      {/* CreatedBy */}
                      <td className="py-3.5 px-4 hidden xl:table-cell">
                        <span className="text-sm text-[#D1D5DB]">{listing.createdByName}</span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 hidden xl:table-cell">
                        <span className="text-sm text-[#9CA3AF]">{formatDate(listing.createdAt)}</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openDetail(listing)}
                            title="Xem chi tiết"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#2A2A35] hover:text-white transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleFeatured(listing)}
                            title={listing.featured ? "Bỏ nổi bật" : "Đặt nổi bật"}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              listing.featured
                                ? "text-amber-400 hover:bg-amber-400/10"
                                : "text-[#9CA3AF] hover:bg-[#2A2A35] hover:text-amber-400"
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${listing.featured ? "fill-amber-400" : ""}`} />
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => setDeleteTarget(listing)}
                              title="Xoá"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#2A2A35]">
              <p className="text-xs text-[#9CA3AF]">
                Trang {meta.number + 1} / {meta.totalPages} &nbsp;·&nbsp; {meta.totalElements} tin
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={meta.number === 0}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#2A2A35] hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                  const start = Math.max(0, Math.min(meta.number - 2, meta.totalPages - 5));
                  const pg = start + i;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        pg === meta.number
                          ? "bg-[#1CE479] text-black"
                          : "text-[#9CA3AF] hover:bg-[#2A2A35] hover:text-white"
                      }`}
                    >
                      {pg + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(meta.totalPages - 1, p + 1))}
                  disabled={meta.number >= meta.totalPages - 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#2A2A35] hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail drawer ─────────────────────────────────────────────── */}
      {(detailLoading || detailTarget) && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => { setDetailTarget(null); setDetailLoading(false); }}
          />
          {/* Panel */}
          <div className="w-full max-w-lg bg-[#111118] border-l border-[#1A1A20] flex flex-col overflow-hidden shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A20] shrink-0">
              <h2 className="text-base font-semibold text-white">Chi tiết tin đăng</h2>
              <button
                onClick={() => { setDetailTarget(null); setDetailLoading(false); }}
                className="text-[#9CA3AF] hover:text-white transition-colors"
              >
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
                      <img
                        src={detailTarget.imageUrls[detailImageIdx]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {detailTarget.imageUrls.length > 1 && (
                        <>
                          <button
                            onClick={() => setDetailImageIdx((i) => Math.max(0, i - 1))}
                            disabled={detailImageIdx === 0}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 disabled:opacity-30 transition-all"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDetailImageIdx((i) => Math.min(detailTarget.imageUrls.length - 1, i + 1))}
                            disabled={detailImageIdx === detailTarget.imageUrls.length - 1}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 disabled:opacity-30 transition-all"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {detailTarget.imageUrls.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setDetailImageIdx(i)}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${i === detailImageIdx ? "bg-white w-4" : "bg-white/40"}`}
                              />
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
                    <p className="text-2xl font-bold text-[#1CE479]">
                      {formatPrice(detailTarget.price, detailTarget.priceUnit)}
                    </p>
                  </div>

                  {/* Meta info */}
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
                          <div
                            key={row.label}
                            className={`p-2.5 bg-[#1A1A20] rounded-lg border border-[#2A2A35] ${row.cols === 2 ? "col-span-2" : ""}`}
                          >
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

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => { const t = detailTarget; setDetailTarget(null); openStatusModal(t); }}
                      className="flex-1 h-10 rounded-xl bg-[#1A1A20] border border-[#2A2A35] text-sm text-white hover:bg-[#2A2A35] transition-colors"
                    >
                      Đổi trạng thái
                    </button>
                    <button
                      onClick={async () => { await toggleFeatured(detailTarget); openDetail(detailTarget); }}
                      className={`flex-1 h-10 rounded-xl text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
                        detailTarget.featured
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                          : "bg-[#1A1A20] border-[#2A2A35] text-[#9CA3AF] hover:text-amber-400 hover:border-amber-500/20"
                      }`}
                    >
                      <Star className={`w-4 h-4 ${detailTarget.featured ? "fill-amber-400" : ""}`} />
                      {detailTarget.featured ? "Bỏ nổi bật" : "Nổi bật"}
                    </button>
                    {isSuperAdmin && (
                      <button
                        onClick={() => { const t = detailTarget; setDetailTarget(null); setDeleteTarget(t); }}
                        className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Change status modal ────────────────────────────────────────── */}
      {statusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A20] border border-[#2A2A35] rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A35]">
              <h2 className="text-base font-semibold text-white">Đổi trạng thái</h2>
              <button onClick={() => setStatusTarget(null)} className="text-[#9CA3AF] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#9CA3AF] truncate">
                Tin: <span className="text-white font-medium">{statusTarget.title}</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.filter(Boolean).map((s) => (
                  <button
                    key={s}
                    onClick={() => setNewStatus(s)}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      newStatus === s
                        ? STATUS_STYLE[s]
                        : "border-[#2A2A35] text-[#9CA3AF] hover:border-[#1CE479] hover:text-white"
                    }`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStatusTarget(null)} className="flex-1 h-10 rounded-xl border border-[#2A2A35] text-sm text-[#9CA3AF] hover:text-white transition-colors">
                  Huỷ
                </button>
                <button
                  onClick={submitStatus}
                  disabled={statusLoading || newStatus === statusTarget.status}
                  className="flex-1 h-10 rounded-xl bg-[#1CE479] text-black text-sm font-semibold hover:bg-[#1CE479]/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {statusLoading ? "Đang lưu..." : <><Check className="w-4 h-4" /> Lưu</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ─────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1A1A20] border border-[#2A2A35] rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A35]">
              <h2 className="text-base font-semibold text-white">Xoá tin đăng</h2>
              <button onClick={() => setDeleteTarget(null)} className="text-[#9CA3AF] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">
                  Xoá vĩnh viễn tin <span className="font-semibold text-white">&quot;{deleteTarget.title}&quot;</span>?
                  Thao tác này không thể hoàn tác.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 h-10 rounded-xl border border-[#2A2A35] text-sm text-[#9CA3AF] hover:text-white transition-colors">
                  Huỷ
                </button>
                <button
                  onClick={submitDelete}
                  disabled={deleteLoading}
                  className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-500/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {deleteLoading ? "Đang xoá..." : <><Trash2 className="w-4 h-4" /> Xoá</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === "success" ? "bg-[#1CE479] text-black" : "bg-red-500 text-white"}`}>
          {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </AdminShell>
  );
}
