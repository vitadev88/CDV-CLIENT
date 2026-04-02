"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Listing } from "@/types";
import { formatPrice } from "@/lib/utils";
import { MapPin, Bed, Bath, Home, Heart } from "lucide-react";
import { Badge } from "./ui/badge";
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
      <div className="bg-card rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-all cursor-pointer">
        {/* Image — aspect 4:3 */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {cover ? (
            <ImageWithFallback
              src={cover}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Home className="w-9 h-9" />
            </div>
          )}

          {/* Badges */}
          {badge === "Nổi bật" && (
            <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
              Nổi bật
            </Badge>
          )}

          {/* Heart button */}
          <button
            className={`absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              favorited
                ? "bg-red-500/80 opacity-100"
                : "bg-black/50 opacity-0 group-hover:opacity-100"
            }`}
            onClick={toggleFav}
          >
            <Heart className={`w-4 h-4 ${favorited ? "text-white fill-white" : "text-white"}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-medium mb-2 line-clamp-2 min-h-[2.5rem] text-foreground">
            {listing.title}
          </h3>

          <div className="flex items-baseline gap-1 mb-2">
            <span className="font-bold text-lg text-primary">
              {formatPrice(listing.price, listing.priceUnit)}
            </span>
          </div>

          {re && (re.bedrooms != null || re.bathrooms != null || re.areaSqm) && (
            <div className="flex items-center gap-3 mb-2 text-sm text-muted-foreground">
              {re.bedrooms != null && (
                <div className="flex items-center gap-1">
                  <Bed className="w-4 h-4" />
                  <span>{re.bedrooms}</span>
                </div>
              )}
              {re.bathrooms != null && (
                <div className="flex items-center gap-1">
                  <Bath className="w-4 h-4" />
                  <span>{re.bathrooms}</span>
                </div>
              )}
              {re.areaSqm && (
                <div className="flex items-center gap-1">
                  <Home className="w-4 h-4" />
                  <span>{re.areaSqm}m²</span>
                </div>
              )}
            </div>
          )}

          {car && (
            <div className="mb-2 text-sm text-muted-foreground">
              {car.mileageKm ? `${car.mileageKm.toLocaleString()} km` : `${car.brand} ${car.model} · ${car.manufactureYear}`}
            </div>
          )}

          {re && (re.district || re.city) && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="line-clamp-1">{[re.district, re.city].filter(Boolean).join(", ")}</span>
            </div>
          )}
          {car && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="line-clamp-1">{car.brand} {car.model} · {car.manufactureYear}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
