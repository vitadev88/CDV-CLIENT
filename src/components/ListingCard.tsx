"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Listing } from "@/types";
import { formatPrice } from "@/lib/utils";
import { MapPin, Bed, Bath, Home, Heart, Ruler } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

interface Props {
  listing: Listing;
  badge?: string;
}

export default function ListingCard({ listing, badge }: Props) {
  const cover = listing.coverImageUrl ?? listing.imageUrls?.[0];
  const re = listing.realEstateDetails;
  const car = listing.carDetails;
  const { isAuthenticated } = useAuth();
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get<{ data: { favorited: boolean } }>(`/favorites/check/${listing.id}`)
      .then((res) => setFavorited(res.data.data?.favorited ?? false))
      .catch(() => {});
  }, [isAuthenticated, listing.id]);

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    try {
      const res = await api.post<{ data: { favorited: boolean } }>(`/favorites/${listing.id}`);
      setFavorited(res.data.data?.favorited ?? false);
    } catch { /* ignore */ }
  };

  return (
    <Link href={`/tin-dang/${listing.id}`} className="block group">
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden
                      hover:border-[#D41B2C]/40 hover:shadow-md transition-all duration-200">

        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[#F3F4F6]">
          {cover ? (
            <ImageWithFallback
              src={cover}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#D1D5DB]">
              <Home className="w-10 h-10" />
            </div>
          )}

          {/* Featured badge */}
          {badge === "Nổi bật" && (
            <span className="absolute top-2.5 left-2.5 bg-[#D41B2C] text-white text-[11px]
                             font-semibold px-2 py-0.5 rounded-md">
              Nổi bật
            </span>
          )}

          {/* Heart */}
          <button
            className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center
                        transition-all shadow-sm ${
                          favorited
                            ? "bg-[#D41B2C] opacity-100"
                            : "bg-white/90 opacity-0 group-hover:opacity-100"
                        }`}
            onClick={toggleFav}
          >
            <Heart className={`w-3.5 h-3.5 ${favorited ? "text-white fill-white" : "text-[#6B7280]"}`} />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5">
          <h3 className="font-medium text-[#1F2937] line-clamp-2 text-sm leading-snug min-h-[2.4rem]">
            {listing.title}
          </h3>

          <p className="mt-2 font-bold text-[#D41B2C] text-base leading-none">
            {formatPrice(listing.price, listing.priceUnit)}
          </p>

          {/* Real-estate mini specs */}
          {re && (re.bedrooms != null || re.bathrooms != null || re.areaSqm) && (
            <div className="flex items-center gap-2.5 mt-2 text-[#6B7280] text-xs">
              {re.bedrooms != null && (
                <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{re.bedrooms}</span>
              )}
              {re.bathrooms != null && (
                <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{re.bathrooms}</span>
              )}
              {re.areaSqm && (
                <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" />{re.areaSqm}m²</span>
              )}
            </div>
          )}

          {/* Car mini specs */}
          {car && (
            <p className="mt-2 text-xs text-[#6B7280]">
              {car.brand} {car.model} · {car.manufactureYear}
              {car.mileageKm ? ` · ${car.mileageKm.toLocaleString()} km` : ""}
            </p>
          )}

          {/* Location */}
          {re && (re.district || re.city) && (
            <div className="flex items-center gap-1 mt-2 text-xs text-[#6B7280]">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="line-clamp-1">{[re.district, re.city].filter(Boolean).join(", ")}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
