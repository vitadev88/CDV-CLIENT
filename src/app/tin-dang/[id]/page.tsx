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
  ChevronLeft, ChevronRight, ArrowLeft, Phone, Heart, CheckCircle,
  User as UserIcon, MessageSquare,
} from "lucide-react";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    api.get<ApiResponse<Listing>>(`/listings/${id}`)
      .then((res) => setListing(res.data.data ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  const changeStatus = async (status: string) => {
    if (!listing) return;
    setUpdating(true);
    try {
      await api.patch(`/listings/${id}/status`, { status });
      setListing({ ...listing, status: status as Listing["status"] });
    } finally { setUpdating(false); }
  };

  if (loading) return (
    <div className="p-5 animate-pulse">
      <div className="h-72 bg-[#111113] rounded-xl mb-5 border border-[#27272a]" />
      <div className="h-6 bg-[#111113] rounded w-3/4 mb-3" />
    </div>
  );

  if (!listing) return (
    <div className="p-5 text-center py-20 text-[#71717a]">Tin đăng không tồn tại.</div>
  );

  const images = listing.imageUrls ?? [];
  const re = listing.realEstateDetails;
  const car = listing.carDetails;

  return (
    <div className="p-5">
      <button onClick={() => router.back()}
        className="flex items-center gap-1.5 text-[#71717a] hover:text-white text-sm mb-5 transition-colors">
        <ArrowLeft size={15} /> Quay lại
      </button>

      <div className="grid md:grid-cols-5 gap-5">
        <div className="md:col-span-3">
          {/* Gallery */}
          <div className="relative bg-[#111113] rounded-xl overflow-hidden h-72 border border-[#27272a]">
            {images.length > 0 ? (
              <>
                <img src={images[imgIndex]} alt={listing.title} className="w-full h-full object-cover" />
                {images.length > 1 && (
                  <>
                    <button onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70">
                      <ChevronLeft size={18} />
                    </button>
                    <button onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70">
                      <ChevronRight size={18} />
                    </button>
                    <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                      {imgIndex + 1}/{images.length}
                    </span>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#3f3f46] text-5xl">
                {car ? "🚗" : "🏠"}
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              {images.map((url, i) => (
                <button key={i} onClick={() => setImgIndex(i)}>
                  <img src={url} alt="" className={`w-16 h-12 object-cover rounded-lg border-2 transition-colors ${i === imgIndex ? "border-[#1CE479]" : "border-[#27272a]"}`} />
                </button>
              ))}
            </div>
          )}

          {listing.description && (
            <div className="mt-4 bg-[#111113] rounded-xl border border-[#27272a] p-4">
              <h2 className="font-semibold text-white mb-2 text-sm">Mô tả</h2>
              <p className="text-sm text-[#a1a1aa] whitespace-pre-wrap leading-relaxed">{listing.description}</p>
            </div>
          )}

          {re && (
            <div className="mt-4 bg-[#111113] rounded-xl border border-[#27272a] p-4">
              <h2 className="font-semibold text-white mb-3 text-sm">Thông tin bất động sản</h2>
              <div className="grid grid-cols-2 gap-2">
                {re.city && <DetailItem icon={<MapPin size={13} />} label="Thành phố" value={re.city} />}
                {re.district && <DetailItem icon={<MapPin size={13} />} label="Quận" value={re.district} />}
                {re.areaSqm && <DetailItem icon={<Ruler size={13} />} label="Diện tích" value={`${re.areaSqm} m²`} />}
                {re.bedrooms != null && <DetailItem icon={<Bed size={13} />} label="Phòng ngủ" value={`${re.bedrooms}`} />}
                {re.bathrooms != null && <DetailItem icon={<Bath size={13} />} label="Phòng tắm" value={`${re.bathrooms}`} />}
                {re.floors != null && <DetailItem icon={<Layers size={13} />} label="Số tầng" value={`${re.floors}`} />}
                {re.furnished != null && <DetailItem icon={null} label="Nội thất" value={re.furnished ? "Có" : "Không"} />}
                {re.availableFrom && <DetailItem icon={<Calendar size={13} />} label="Có thể ở từ" value={re.availableFrom} />}
                {re.deposit != null && <DetailItem icon={null} label="Tiền cọc" value={`${re.deposit.toLocaleString()} NT$`} />}
              </div>
            </div>
          )}

          {car && (
            <div className="mt-4 bg-[#111113] rounded-xl border border-[#27272a] p-4">
              <h2 className="font-semibold text-white mb-3 text-sm">Thông tin xe</h2>
              <div className="grid grid-cols-2 gap-2">
                <DetailItem icon={<Car size={13} />} label="Hãng xe" value={car.brand} />
                <DetailItem icon={<Car size={13} />} label="Dòng xe" value={car.model} />
                <DetailItem icon={<Calendar size={13} />} label="Năm SX" value={`${car.manufactureYear}`} />
                {car.mileageKm != null && <DetailItem icon={null} label="Số km" value={`${car.mileageKm.toLocaleString()} km`} />}
                {car.fuelType && <DetailItem icon={<Fuel size={13} />} label="Nhiên liệu" value={{ GASOLINE: "Xăng", DIESEL: "Dầu", ELECTRIC: "Điện", HYBRID: "Hybrid" }[car.fuelType] ?? car.fuelType} />}
                {car.transmission && <DetailItem icon={<Cog size={13} />} label="Hộp số" value={car.transmission === "AUTOMATIC" ? "Tự động" : "Số sàn"} />}
                {car.color && <DetailItem icon={null} label="Màu" value={car.color} />}
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="md:col-span-2">
          <div className="bg-[#111113] rounded-xl border border-[#27272a] p-5 sticky top-5">
            <span className="text-xs bg-[#18181b] border border-[#27272a] text-[#a1a1aa] px-2.5 py-1 rounded-full">
              {listing.categoryName}
            </span>
            <div className="flex items-center gap-2 mt-3 mb-1">
              <CheckCircle size={14} className="text-[#1CE479] shrink-0" />
              <span className="text-xs text-[#1CE479]">Đã xác thực</span>
            </div>
            <h1 className="text-base font-bold text-white leading-snug">{listing.title}</h1>
            <p className="text-[#1CE479] font-bold text-2xl mt-2">{formatPrice(listing.price, listing.priceUnit)}</p>

            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${statusColor(listing.status)}`}>
                {statusLabel(listing.status)}
              </span>
              <span className="text-xs text-[#52525b]">{timeAgo(listing.createdAt)}</span>
            </div>

            {re && (
              <p className="flex items-center gap-1.5 text-sm text-[#71717a] mt-3">
                <MapPin size={13} className="text-[#1CE479]" />
                {[re.district, re.city].filter(Boolean).join(", ")}
              </p>
            )}

            {/* Owner card */}
            <div className="mt-4 pt-4 border-t border-[#27272a]">
              <p className="text-xs text-[#52525b] mb-2">Người đăng tin</p>
              <Link href={`/nguoi-dung/${listing.createdById}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#18181b] border border-[#27272a] hover:border-[#1CE479]/40 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-[#1CE479]/15 border border-[#1CE479]/25 flex items-center justify-center text-[#1CE479] font-bold text-sm shrink-0 overflow-hidden">
                  <OwnerAvatar name={listing.createdByName} userId={listing.createdById} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-[#1CE479] transition-colors">
                    {listing.createdByName}
                  </p>
                  <p className="text-xs text-[#71717a]">Đăng {timeAgo(listing.createdAt)}</p>
                </div>
                <UserIcon size={14} className="text-[#52525b] group-hover:text-[#1CE479] transition-colors shrink-0" />
              </Link>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <a href={`tel:`}
                className="flex items-center justify-center gap-2 bg-[#1CE479] hover:bg-[#16c96a] text-black rounded-xl py-3 font-bold text-sm transition-colors">
                <Phone size={15} /> Gọi điện
              </a>
              <Link href={`/tin-nhan?userId=${listing.createdById}`}
                className="flex items-center justify-center gap-2 bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-white rounded-xl py-3 text-sm transition-colors">
                <MessageSquare size={15} /> Nhắn tin
              </Link>
            </div>
            <button
              className="mt-2 flex items-center justify-center gap-2 w-full bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-[#a1a1aa] hover:text-white rounded-xl py-2.5 text-sm transition-colors">
              <Heart size={14} /> Lưu tin
            </button>

            {/* Owner controls */}
            {user && listing.createdById === user.id && (
              <div className="mt-4 pt-4 border-t border-[#27272a]">
                <p className="text-xs text-[#71717a] mb-2">Quản lý tin</p>
                <div className="grid grid-cols-2 gap-2">
                  {listing.status === "ACTIVE" && (
                    <button onClick={() => changeStatus("INACTIVE")} disabled={updating}
                      className="text-xs bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-white rounded-lg py-2 transition disabled:opacity-50">
                      Ẩn tin
                    </button>
                  )}
                  {listing.status === "INACTIVE" && (
                    <button onClick={() => changeStatus("ACTIVE")} disabled={updating}
                      className="text-xs bg-[#1CE479]/10 border border-[#1CE479]/30 text-[#1CE479] hover:bg-[#1CE479]/20 rounded-lg py-2 transition disabled:opacity-50">
                      Hiện tin
                    </button>
                  )}
                  <button onClick={() => changeStatus("SOLD")} disabled={updating}
                    className="text-xs bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg py-2 transition disabled:opacity-50">
                    Đã bán
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 bg-[#18181b] rounded-lg px-3 py-2">
      {icon && <span className="text-[#71717a] mt-0.5 shrink-0">{icon}</span>}
      <div>
        <p className="text-xs text-[#71717a]">{label}</p>
        <p className="text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}

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
