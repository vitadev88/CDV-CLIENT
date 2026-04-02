"use client";
import { useEffect, useState, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { Listing } from "@/types";
import ListingCard from "@/components/ListingCard";

const PAGE_SIZE = 12;

export default function FeaturedPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/listings?featured=true&page=${p}&size=${PAGE_SIZE}&sort=createdAt,desc`);
      const data = res.data.data;
      setListings(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings(page);
  }, [page, fetchListings]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tin nổi bật</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Đang tải..." : `${totalElements} tin đăng nổi bật`}
          </p>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="rounded-xl bg-card border border-border animate-pulse">
              <div className="h-48 bg-muted rounded-t-xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-5 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Star className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Chưa có tin nổi bật nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} badge="Nổi bật" />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="w-9 h-9 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
                ${i === page ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-accent"}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="w-9 h-9 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
