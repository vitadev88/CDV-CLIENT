"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Listing, ListingPage } from "@/types";
import { formatPrice, timeAgo, statusLabel, statusColor } from "@/lib/utils";
import { PlusCircle, Home, Car, TrendingUp } from "lucide-react";

export default function MyListingsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) router.push("/dang-nhap");
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    api.get<{ success: boolean; data: ListingPage }>(`/listings?createdBy=me&page=${page}&size=10`)
      .then((res) => {
        setListings(res.data.data?.content ?? []);
        setTotalPages(res.data.data?.totalPages ?? 0);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, page]);

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Tin của tôi</h1>
        <Link href="/dang-tin"
          className="flex items-center gap-2 bg-[#1CE479] hover:bg-[#16c96a] text-black px-4 py-2 rounded-lg text-sm font-bold transition-colors">
          <PlusCircle size={15} /> Đăng tin mới
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-[#111113] border border-[#27272a] rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 text-[#71717a]">
          <Home size={48} className="mx-auto mb-3 text-[#27272a]" />
          <p className="mb-4">Bạn chưa có tin đăng nào.</p>
          <Link href="/dang-tin" className="text-[#1CE479] hover:underline text-sm">Đăng tin ngay →</Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {listings.map((l) => (
              <MyListingRow key={l.id} listing={l}
                onStatusChange={(id, status) =>
                  setListings((prev) => prev.map((item) => item.id === id ? { ...item, status } : item))
                }
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${i === page ? "bg-[#1CE479] text-black" : "bg-[#111113] border border-[#27272a] text-[#a1a1aa] hover:text-white"}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MyListingRow({ listing, onStatusChange }: {
  listing: Listing;
  onStatusChange: (id: string, status: Listing["status"]) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const cover = listing.coverImageUrl ?? listing.imageUrls?.[0];

  const update = async (status: Listing["status"]) => {
    setUpdating(true);
    try {
      await api.patch(`/listings/${listing.id}/status`, { status });
      onStatusChange(listing.id, status);
    } finally { setUpdating(false); }
  };

  return (
    <div className="bg-[#111113] border border-[#27272a] hover:border-[#3f3f46] rounded-xl flex gap-3 p-3 transition-colors">
      <Link href={`/tin-dang/${listing.id}`} className="shrink-0">
        <div className="w-20 h-20 bg-[#18181b] rounded-lg overflow-hidden border border-[#27272a]">
          {cover ? (
            <img src={cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#3f3f46]">
              {listing.carDetails ? <Car size={22} /> : <Home size={22} />}
            </div>
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/tin-dang/${listing.id}`}>
          <h3 className="font-semibold text-white text-sm truncate hover:text-[#1CE479] transition-colors">
            {listing.title}
          </h3>
        </Link>
        <p className="text-[#1CE479] font-bold text-sm mt-0.5">{formatPrice(listing.price, listing.priceUnit)}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusColor(listing.status)}`}>
            {statusLabel(listing.status)}
          </span>
          <span className="text-xs text-[#52525b] flex items-center gap-1">
            <TrendingUp size={10} className="text-[#1CE479]" />
            {timeAgo(listing.createdAt)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 shrink-0 justify-center">
        {listing.status === "ACTIVE" && (
          <button onClick={() => update("INACTIVE")} disabled={updating}
            className="text-xs bg-[#18181b] border border-[#27272a] text-[#a1a1aa] hover:text-white rounded-lg px-2.5 py-1.5 transition disabled:opacity-50">
            Ẩn
          </button>
        )}
        {listing.status === "INACTIVE" && (
          <button onClick={() => update("ACTIVE")} disabled={updating}
            className="text-xs bg-[#1CE479]/10 border border-[#1CE479]/30 text-[#1CE479] hover:bg-[#1CE479]/20 rounded-lg px-2.5 py-1.5 transition disabled:opacity-50">
            Hiện
          </button>
        )}
        {listing.status === "ACTIVE" && (
          <button onClick={() => update("SOLD")} disabled={updating}
            className="text-xs bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg px-2.5 py-1.5 transition disabled:opacity-50">
            Đã bán
          </button>
        )}
      </div>
    </div>
  );
}
