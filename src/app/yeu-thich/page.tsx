"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Listing, ListingPage } from "@/types";
import ListingCard from "@/components/ListingCard";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";

export default function FavoritesPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState<ListingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/dang-nhap"); return; }
    setLoading(true);
    api.get<{ data: ListingPage }>(`/favorites?page=${currentPage}&size=12`)
      .then((res) => setPage(res.data.data ?? null))
      .catch((err: unknown) => console.error("Failed to load favorites", err))
      .finally(() => setLoading(false));
  }, [isAuthenticated, router, currentPage]);

  return (
    <div className="p-5">
      <div className="mb-5 flex items-center gap-2">
        <Heart className="w-5 h-5 text-red-400" />
        <h1 className="text-xl font-bold text-white">Tin yêu thích</h1>
        {page && <span className="text-sm text-muted-foreground ml-1">({page.totalElements})</span>}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg h-56 animate-pulse" />
          ))}
        </div>
      ) : !page || page.content.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Heart size={48} className="mx-auto mb-3 text-border" />
          <p>Bạn chưa lưu tin nào.</p>
          <p className="text-sm mt-1">Nhấn ❤️ trên tin đăng để lưu vào đây.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {page.content.map((l: Listing) => <ListingCard key={l.id} listing={l} />)}
          </div>
          {page.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button disabled={page.number === 0} onClick={() => setCurrentPage(p => p - 1)}
                className="p-2 rounded-lg bg-card border border-border disabled:opacity-40 hover:border-muted text-white">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-muted-foreground px-2">{page.number + 1} / {page.totalPages}</span>
              <button disabled={page.number + 1 >= page.totalPages} onClick={() => setCurrentPage(p => p + 1)}
                className="p-2 rounded-lg bg-card border border-border disabled:opacity-40 hover:border-muted text-white">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
