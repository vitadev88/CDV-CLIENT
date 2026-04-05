"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Listing, ApiResponse } from "@/types";
import { formatPrice, timeAgo, statusLabel, statusColor } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  MapPin, Bed, Bath, Layers, Ruler, Car, Fuel, Cog, Calendar,
  ChevronLeft, ChevronRight, ArrowLeft, Phone, Heart,
  User as UserIcon, MessageSquare, Shield, Eye,
} from "lucide-react";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    api.get<ApiResponse<Listing>>(`/listings/${id}`)
      .then((res) => setListing(res.data.data ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!listing?.id) return;
    api.get<{ data: { favorited: boolean } }>(`/favorites/check/${listing.id}`)
      .then((res) => setFavorited(res.data.data?.favorited ?? false))
      .catch(() => {});
  }, [listing?.id]);

  const toggleFav = async () => {
    if (!listing) return;
    try {
      const res = await api.post<{ data: { favorited: boolean } }>(`/favorites/${listing.id}`);
      setFavorited(res.data.data?.favorited ?? false);
    } catch { /* ignore */ }
  };

  const changeStatus = async (status: string) => {
    if (!listing) return;
    setUpdating(true);
    try {
      await api.patch(`/listings/${id}/status`, { status });
      setListing({ ...listing, status: status as Listing["status"] });
    } finally { setUpdating(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F5F5F5] p-6 animate-pulse">
      <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-6">
        <div className="md:col-span-3 space-y-4">
          <div className="aspect-video bg-white rounded-xl border border-[#E5E7EB]" />
          <div className="bg-white rounded-xl border border-[#E5E7EB] h-32" />
        </div>
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-[#E5E7EB] h-80" />
        </div>
      </div>
    </div>
  );

  if (!listing) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-[#6B7280]">
      <Eye className="w-12 h-12 mb-3 text-[#E5E7EB]" />
      <p className="font-medium">Tin đăng không tồn tại.</p>
    </div>
  );

  const images = listing.imageUrls ?? [];
  const re = listing.realEstateDetails;
  const car = listing.carDetails;
  const isOwner = user?.id === listing.createdById;

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Breadcrumb / back */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-3">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#D41B2C] transition-colors"
          >
            <ArrowLeft size={15} /> Quay lại
          </button>
        </div>
      </div>

      <div className="px-6 py-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-5 gap-6">

          {/* ── Left: gallery + details ─────────────────────────────────── */}
          <div className="md:col-span-3 space-y-4">

            {/* Gallery */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm">
              <div className="relative bg-[#F3F4F6] overflow-hidden" style={{ aspectRatio: "16/9" }}>
                {images.length > 0 ? (
                  <>
                    <img src={images[imgIndex]} alt={listing.title}
                      className="w-full h-full object-cover" />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90
                                     rounded-full flex items-center justify-center shadow-md hover:bg-white transition"
                        >
                          <ChevronLeft size={18} className="text-[#1F2937]" />
                        </button>
                        <button
                          onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90
                                     rounded-full flex items-center justify-center shadow-md hover:bg-white transition"
                        >
                          <ChevronRight size={18} className="text-[#1F2937]" />
                        </button>
                        <span className="absolute bottom-3 right-3 bg-black/50 text-white
                                        text-xs px-2.5 py-1 rounded-full">
                          {imgIndex + 1} / {images.length}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-7xl">
                    {car ? "🚗" : "🏠"}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {images.map((url, i) => (
                    <button key={i} onClick={() => setImgIndex(i)}
                      className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                        i === imgIndex ? "border-[#D41B2C]" : "border-transparent hover:border-[#E5E7EB]"
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
                <h2 className="font-semibold text-[#1F2937] mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#D41B2C] rounded-full inline-block" />
                  Mô tả chi tiết
                </h2>
                <p className="text-sm text-[#6B7280] whitespace-pre-wrap leading-relaxed">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Real-estate details */}
            {re && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
                <h2 className="font-semibold text-[#1F2937] mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#D41B2C] rounded-full inline-block" />
                  Thông tin bất động sản
                </h2>
                <div className="grid grid-cols-2 gap-2.5">
                  {re.city && <DetailItem icon={<MapPin size={13} />} label="Thành phố" value={re.city} />}
                  {re.district && <DetailItem icon={<MapPin size={13} />} label="Quận/Huyện" value={re.district} />}
                  {re.areaSqm && <DetailItem icon={<Ruler size={13} />} label="Diện tích" value={`${re.areaSqm} m²`} />}
                  {re.bedrooms != null && <DetailItem icon={<Bed size={13} />} label="Phòng ngủ" value={`${re.bedrooms} phòng`} />}
                  {re.bathrooms != null && <DetailItem icon={<Bath size={13} />} label="Phòng tắm" value={`${re.bathrooms} phòng`} />}
                  {re.floors != null && <DetailItem icon={<Layers size={13} />} label="Số tầng" value={`${re.floors} tầng`} />}
                  {re.furnished != null && <DetailItem icon={null} label="Nội thất" value={re.furnished ? "Có đầy đủ" : "Không có"} />}
                  {re.availableFrom && <DetailItem icon={<Calendar size={13} />} label="Nhận phòng từ" value={re.availableFrom} />}
                  {re.deposit != null && <DetailItem icon={null} label="Tiền đặt cọc" value={`${re.deposit.toLocaleString()} NT$`} />}
                </div>
              </div>
            )}

            {/* Car details */}
            {car && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
                <h2 className="font-semibold text-[#1F2937] mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#D41B2C] rounded-full inline-block" />
                  Thông tin xe
                </h2>
                <div className="grid grid-cols-2 gap-2.5">
                  <DetailItem icon={<Car size={13} />} label="Hãng xe" value={car.brand} />
                  <DetailItem icon={<Car size={13} />} label="Dòng xe" value={car.model} />
                  <DetailItem icon={<Calendar size={13} />} label="Năm sản xuất" value={`${car.manufactureYear}`} />
                  {car.mileageKm != null && <DetailItem icon={null} label="Số km đã đi" value={`${car.mileageKm.toLocaleString()} km`} />}
                  {car.fuelType && <DetailItem icon={<Fuel size={13} />} label="Nhiên liệu"
                    value={{ GASOLINE: "Xăng", DIESEL: "Dầu diesel", ELECTRIC: "Điện", HYBRID: "Hybrid" }[car.fuelType] ?? car.fuelType} />}
                  {car.transmission && <DetailItem icon={<Cog size={13} />} label="Hộp số"
                    value={car.transmission === "AUTOMATIC" ? "Tự động" : "Số sàn"} />}
                  {car.color && <DetailItem icon={null} label="Màu sắc" value={car.color} />}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: pricing + CTA ────────────────────────────────────── */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm sticky top-20">

              {/* Category badge */}
              <span className="inline-block bg-[#FEF2F2] text-[#D41B2C] text-xs font-semibold
                               px-2.5 py-1 rounded-full border border-red-100">
                {listing.categoryName}
              </span>

              {/* Verified */}
              <div className="flex items-center gap-1.5 mt-3 text-xs text-[#16A34A]">
                <Shield size={13} className="shrink-0" />
                Tin đã được xác thực
              </div>

              {/* Title */}
              <h1 className="text-base font-bold text-[#1F2937] mt-2 leading-snug">
                {listing.title}
              </h1>

              {/* Price */}
              <p className="text-[#D41B2C] font-bold text-2xl mt-2">
                {formatPrice(listing.price, listing.priceUnit)}
              </p>

              {/* Status + time */}
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${statusColor(listing.status)}`}>
                  {statusLabel(listing.status)}
                </span>
                <span className="text-xs text-[#6B7280]">{timeAgo(listing.createdAt)}</span>
              </div>

              {/* Location */}
              {re && (re.district || re.city) && (
                <p className="flex items-center gap-1.5 text-sm text-[#6B7280] mt-3">
                  <MapPin size={13} className="text-[#D41B2C] shrink-0" />
                  {[re.district, re.city].filter(Boolean).join(", ")}
                </p>
              )}

              {/* Divider */}
              <div className="border-t border-[#E5E7EB] my-4" />

              {/* Owner */}
              <p className="text-xs text-[#6B7280] mb-2 font-medium">Người đăng tin</p>
              <Link href={`/nguoi-dung/${listing.createdById}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]
                           hover:border-[#D41B2C]/40 hover:bg-[#FEF2F2] transition-all group">
                <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] border border-red-100
                                flex items-center justify-center text-[#D41B2C] font-bold text-sm shrink-0 overflow-hidden">
                  <OwnerAvatar name={listing.createdByName} userId={listing.createdById} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1F2937] truncate group-hover:text-[#D41B2C] transition-colors">
                    {listing.createdByName}
                  </p>
                  <p className="text-xs text-[#6B7280]">Đăng {timeAgo(listing.createdAt)}</p>
                </div>
                <UserIcon size={14} className="text-[#9CA3AF] group-hover:text-[#D41B2C] transition-colors shrink-0" />
              </Link>

              {/* CTA buttons */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <a href="tel:"
                  className="flex items-center justify-center gap-2 bg-[#D41B2C] hover:bg-[#B91624]
                             text-white rounded-xl py-3 font-semibold text-sm transition-colors shadow-sm">
                  <Phone size={15} /> Gọi điện
                </a>
                <Link href={`/tin-nhan?userId=${listing.createdById}`}
                  className="flex items-center justify-center gap-2 bg-white hover:bg-[#F9FAFB]
                             border border-[#E5E7EB] hover:border-[#D41B2C]/40 text-[#1F2937]
                             rounded-xl py-3 text-sm transition-all">
                  <MessageSquare size={15} /> Nhắn tin
                </Link>
              </div>
              <button
                onClick={toggleFav}
                className={`mt-2.5 flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm
                            border transition-colors ${
                              favorited
                                ? "bg-[#FEF2F2] border-red-200 text-[#D41B2C]"
                                : "bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#D41B2C]/40 hover:text-[#D41B2C]"
                            }`}
              >
                <Heart size={14} className={favorited ? "fill-[#D41B2C]" : ""} />
                {favorited ? "Đã lưu tin" : "Lưu tin"}
              </button>

              {/* Owner controls */}
              {isOwner && (
                <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                  <p className="text-xs text-[#6B7280] mb-2.5 font-medium">Quản lý tin của bạn</p>
                  <div className="grid grid-cols-2 gap-2">
                    {listing.status === "ACTIVE" && (
                      <button onClick={() => changeStatus("INACTIVE")} disabled={updating}
                        className="text-xs bg-[#F9FAFB] border border-[#E5E7EB] text-[#6B7280]
                                   hover:text-[#1F2937] rounded-lg py-2 transition disabled:opacity-50">
                        Ẩn tin
                      </button>
                    )}
                    {listing.status === "INACTIVE" && (
                      <button onClick={() => changeStatus("ACTIVE")} disabled={updating}
                        className="text-xs bg-[#F0FDF4] border border-green-200 text-[#16A34A]
                                   hover:bg-green-50 rounded-lg py-2 transition disabled:opacity-50">
                        Hiện tin
                      </button>
                    )}
                    <button onClick={() => changeStatus("SOLD")} disabled={updating}
                      className="text-xs bg-[#FEF2F2] border border-red-200 text-[#D41B2C]
                                 hover:bg-red-50 rounded-lg py-2 transition disabled:opacity-50">
                      Đánh dấu đã bán
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Detail item ───────────────────────────────────────────────────────────────
function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2.5">
      {icon && <span className="text-[#9CA3AF] mt-0.5 shrink-0">{icon}</span>}
      <div>
        <p className="text-xs text-[#6B7280]">{label}</p>
        <p className="text-sm font-semibold text-[#1F2937]">{value}</p>
      </div>
    </div>
  );
}

// ── Owner avatar ──────────────────────────────────────────────────────────────
function OwnerAvatar({ name, userId }: { name: string; userId: string }) {
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    api.get<{ data: { avatarUrl?: string } }>(`/users/${userId}/public`)
      .then((res) => setAvatarUrl(res.data.data?.avatarUrl ?? null))
      .catch(() => {});
  }, [userId]);
  if (avatarUrl) return <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />;
  return <span>{name?.slice(0, 2).toUpperCase()}</span>;
}
