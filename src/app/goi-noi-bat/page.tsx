"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Star, Check, Zap, AlertTriangle, ChevronLeft, X } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Listing } from "@/types";

interface FeaturedPackage {
  id: string;
  name: string;
  price: number;
  durationDays: number;
}

function formatPrice(price: number) {
  if (price === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN").format(price) + "₫";
}

const PACKAGE_META: Record<number, { color: string; bg: string; border: string; badge?: string; popular?: boolean }> = {
  0: {
    color: "text-muted-foreground",
    bg: "bg-card",
    border: "border-border",
  },
  1: {
    color: "text-amber-400",
    bg: "bg-card",
    border: "border-amber-500/40",
    popular: true,
  },
  2: {
    color: "text-violet-400",
    bg: "bg-card",
    border: "border-violet-500/40",
    badge: "Tốt nhất",
  },
};

function getMeta(index: number) {
  return PACKAGE_META[index] ?? PACKAGE_META[0];
}

export default function GoiNoiBatPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [packages, setPackages] = useState<FeaturedPackage[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // modal state
  const [selectedPackage, setSelectedPackage] = useState<FeaturedPackage | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [step, setStep] = useState<"listing" | "confirm">("listing");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pkgRes, listingRes] = await Promise.all([
        api.get<{ data: FeaturedPackage[] }>("/featured-packages/active"),
        isAuthenticated
          ? api.get<{ data: { content: Listing[] } }>("/listings/mine")
          : Promise.resolve(null),
      ]);
      setPackages(pkgRes.data.data ?? []);
      setMyListings(listingRes?.data?.data?.content ?? []);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openModal(pkg: FeaturedPackage) {
    if (!isAuthenticated) { router.push("/dang-nhap"); return; }
    setSelectedPackage(pkg);
    setSelectedListing(null);
    setStep("listing");
    setError(null);
    setSuccess(false);
  }

  function closeModal() {
    setSelectedPackage(null);
    setSuccess(false);
    setError(null);
  }

  async function handleApply() {
    if (!selectedPackage || !selectedListing) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/featured-packages/apply", {
        listingId: selectedListing.id,
        packageId: selectedPackage.id,
      });
      setSuccess(true);
      fetchData();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Thao tác thất bại";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const perks = (pkg: FeaturedPackage) => [
    `Hiển thị ${pkg.durationDays} ngày liên tục`,
    "Xuất hiện đầu trang tìm kiếm",
    "Huy hiệu nổi bật",
    pkg.durationDays >= 14 ? "Ưu tiên trong danh mục" : null,
    pkg.durationDays >= 30 ? "Hiển thị trang chủ" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/20 mb-4">
          <Zap className="w-6 h-6 text-amber-400" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Đẩy tin nổi bật</h1>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto text-sm">
          Tăng khả năng hiển thị, tiếp cận nhiều người mua hơn
        </p>
      </div>

      {/* Pricing cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <Star className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">Chưa có gói nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {packages.map((pkg, i) => {
            const meta = getMeta(i);
            return (
              <div
                key={pkg.id}
                className={`relative flex flex-col rounded-2xl border ${meta.border} ${meta.bg} p-6 transition-all hover:shadow-lg hover:-translate-y-0.5`}
              >
                {/* Badge */}
                {meta.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                      Phổ biến
                    </span>
                  </div>
                )}
                {meta.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-violet-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {meta.badge}
                    </span>
                  </div>
                )}

                {/* Name */}
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  {pkg.name}
                </p>

                {/* Price */}
                <div className="mb-1">
                  <span className={`text-4xl font-bold ${meta.color}`}>
                    {pkg.price === 0 ? "0₫" : new Intl.NumberFormat("vi-VN").format(pkg.price) + "₫"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-6">
                  {pkg.price === 0 ? "Hoàn toàn miễn phí" : "một lần / lần đẩy"}
                </p>

                {/* Duration pill */}
                <div className={`inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-xl text-sm font-semibold mb-6
                  ${i === 1 ? "bg-amber-500/15 text-amber-400" : i === 2 ? "bg-violet-500/15 text-violet-400" : "bg-muted text-muted-foreground"}`}>
                  <Star className="w-3.5 h-3.5" />
                  {pkg.durationDays} ngày nổi bật
                </div>

                {/* Perks */}
                <ul className="space-y-2.5 flex-1 mb-8">
                  {perks(pkg).map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {perk}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => openModal(pkg)}
                  className={`w-full h-11 rounded-xl text-sm font-semibold transition-colors
                    ${i === 1
                      ? "bg-amber-500 text-white hover:bg-amber-500/90"
                      : i === 2
                      ? "bg-violet-500 text-white hover:bg-violet-500/90"
                      : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                >
                  {pkg.price === 0 ? "Dùng miễn phí" : "Chọn gói này"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Note */}
      <p className="text-center text-xs text-muted-foreground/60 mt-8">
        Mỗi lần đẩy áp dụng cho một bài đăng · Bài đang nổi bật không thể đẩy thêm
      </p>

      {/* Modal: select listing + confirm */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] flex flex-col shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                {step === "confirm" && !success && (
                  <button onClick={() => setStep("listing")} className="text-muted-foreground hover:text-foreground transition-colors mr-1">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <span className="font-semibold text-foreground text-sm">
                  {success ? "Đẩy tin thành công" : step === "listing" ? `Gói ${selectedPackage.name} — Chọn bài đăng` : "Xác nhận đẩy tin"}
                </span>
              </div>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-5">

              {success ? (
                <div className="flex flex-col items-center text-center py-8 gap-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Đẩy tin thành công!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      "{selectedListing?.title}" đã nổi bật trong{" "}
                      <span className="font-medium text-foreground">{selectedPackage.durationDays} ngày</span>
                    </p>
                  </div>
                  <div className="flex gap-3 w-full mt-2">
                    <button onClick={closeModal} className="flex-1 h-10 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Đóng
                    </button>
                    <button onClick={() => router.push("/noi-bat")} className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                      Xem tin nổi bật
                    </button>
                  </div>
                </div>
              ) : step === "listing" ? (
                <div className="space-y-2">
                  {myListings.length === 0 ? (
                    <div className="flex flex-col items-center py-12 gap-3 text-center">
                      <Star className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-muted-foreground text-sm">Bạn chưa có bài đăng nào</p>
                      <button onClick={() => router.push("/dang-tin")} className="text-sm text-primary hover:underline">
                        Đăng tin ngay →
                      </button>
                    </div>
                  ) : (
                    myListings.map((listing) => (
                      <button
                        key={listing.id}
                        onClick={() => { if (!listing.featured) { setSelectedListing(listing); setStep("confirm"); } }}
                        disabled={listing.featured}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all text-left"
                      >
                        {listing.coverImageUrl ? (
                          <img src={listing.coverImageUrl} alt={listing.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{listing.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Intl.NumberFormat("vi-VN").format(Number(listing.price))} ₫
                          </p>
                        </div>
                        {listing.featured ? (
                          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-lg font-medium shrink-0">
                            Đang nổi bật
                          </span>
                        ) : (
                          <Check className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="rounded-xl border border-border bg-muted/30 divide-y divide-border">
                    <div className="flex justify-between items-center px-4 py-3 text-sm">
                      <span className="text-muted-foreground">Bài đăng</span>
                      <span className="font-medium text-foreground text-right max-w-[55%] truncate">{selectedListing?.title}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 text-sm">
                      <span className="text-muted-foreground">Gói</span>
                      <span className="font-medium text-foreground">{selectedPackage.name}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 text-sm">
                      <span className="text-muted-foreground">Thời hạn</span>
                      <span className="font-medium text-foreground">{selectedPackage.durationDays} ngày</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-sm text-muted-foreground font-medium">Tổng cộng</span>
                      <span className={`text-xl font-bold ${selectedPackage.price === 0 ? "text-green-500" : "text-foreground"}`}>
                        {formatPrice(selectedPackage.price)}
                      </span>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl">
                      <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleApply}
                    disabled={submitting}
                    className="w-full h-12 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-500/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? "Đang xử lý..." : <><Zap className="w-4 h-4" /> Xác nhận đẩy tin</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
