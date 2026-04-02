"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Category, Listing, ListingPage } from "@/types";
import ListingCard from "@/components/ListingCard";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryParam = searchParams.get("category") ?? "";
  const pageParam = parseInt(searchParams.get("page") ?? "0");

  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState<ListingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(categoryParam);
  const [showFilters, setShowFilters] = useState(false);

  // Sync selected với URL khi sidebar thay đổi category param
  useEffect(() => {
    setSelected(categoryParam);
  }, [categoryParam]);

  // Filter state
  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [minArea, setMinArea] = useState(searchParams.get("minArea") ?? "");
  const [maxArea, setMaxArea] = useState(searchParams.get("maxArea") ?? "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") ?? "createdAt,desc");

  useEffect(() => {
    api.get("/categories").then((res) => {
      const tree: Category[] = (res.data as { data: Category[] }).data ?? [];
      const leaves: Category[] = [];
      for (const parent of tree) {
        if (parent.children && parent.children.length > 0) {
          parent.children.filter((c) => c.active).forEach((c) => leaves.push(c));
        } else if (parent.active && parent.detailType !== null) {
          leaves.push(parent);
        }
      }
      setCategories(leaves);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selected) params.set("categoryCode", selected);
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (city.trim()) params.set("city", city.trim());
    if (minArea) params.set("minArea", minArea);
    if (maxArea) params.set("maxArea", maxArea);
    params.set("page", String(pageParam));
    params.set("size", "12");
    params.set("sort", sortBy);

    api.get(`/listings?${params.toString()}`)
      .then((res) => setPage((res.data as { data: ListingPage }).data ?? null))
      .finally(() => setLoading(false));
  }, [selected, pageParam, keyword, minPrice, maxPrice, city, minArea, maxArea, sortBy]);

  const go = (cat: string, p: number) => {
    const q = new URLSearchParams();
    if (cat) q.set("category", cat);
    if (p > 0) q.set("page", String(p));
    if (keyword.trim()) q.set("keyword", keyword.trim());
    if (minPrice) q.set("minPrice", minPrice);
    if (maxPrice) q.set("maxPrice", maxPrice);
    if (city.trim()) q.set("city", city.trim());
    if (minArea) q.set("minArea", minArea);
    if (maxArea) q.set("maxArea", maxArea);
    if (sortBy !== "createdAt,desc") q.set("sort", sortBy);
    router.push(`/tim-kiem?${q.toString()}`);
  };

  const clearFilters = () => {
    setKeyword(""); setMinPrice(""); setMaxPrice("");
    setCity(""); setMinArea(""); setMaxArea("");
    setSortBy("createdAt,desc");
  };

  const hasActiveFilters = keyword || minPrice || maxPrice || city || minArea || maxArea;

  return (
    <div className="p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">
            {categories.find((c) => c.code === selected)?.name ?? "Tất cả tin đăng"}
          </h1>
          {page && <p className="text-sm text-muted-foreground mt-0.5">{page.totalElements} tin đăng</p>}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${
            showFilters || hasActiveFilters
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-card border-border text-muted-foreground hover:text-white hover:border-muted"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Bộ lọc
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-primary" />
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Bộ lọc nâng cao</h3>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                <X className="w-3 h-3" /> Xoá bộ lọc
              </button>
            )}
          </div>

          {/* Keyword */}
          <FilterInput label="Từ khoá" value={keyword} onChange={setKeyword} placeholder="Tìm theo tiêu đề..." />

          {/* Price range */}
          <div className="grid grid-cols-2 gap-3">
            <FilterInput label="Giá từ (VNĐ)" value={minPrice} onChange={setMinPrice} placeholder="0" type="number" />
            <FilterInput label="Giá đến (VNĐ)" value={maxPrice} onChange={setMaxPrice} placeholder="∞" type="number" />
          </div>

          {/* City + Area (real estate) */}
          <FilterInput label="Thành phố" value={city} onChange={setCity} placeholder="Hà Nội, TP.HCM..." />
          <div className="grid grid-cols-2 gap-3">
            <FilterInput label="Diện tích từ (m²)" value={minArea} onChange={setMinArea} placeholder="0" type="number" />
            <FilterInput label="Diện tích đến (m²)" value={maxArea} onChange={setMaxArea} placeholder="∞" type="number" />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Sắp xếp</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
            >
              <option value="createdAt,desc">Mới nhất</option>
              <option value="createdAt,asc">Cũ nhất</option>
              <option value="price,asc">Giá tăng dần</option>
              <option value="price,desc">Giá giảm dần</option>
            </select>
          </div>

          <button
            onClick={() => go(selected, 0)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-2.5 font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" /> Tìm kiếm
          </button>
        </div>
      )}

      {/* Category chips */}
      <div className="flex gap-2 flex-wrap mb-6">
        <Chip label="Tất cả" active={!selected} onClick={() => { setSelected(""); go("", 0); }} />
        {categories.map((cat) => (
          <Chip key={cat.code} label={cat.name} active={selected === cat.code}
            onClick={() => { setSelected(cat.code); go(cat.code, 0); }} />
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg h-56 animate-pulse" />
          ))}
        </div>
      ) : !page || page.content.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Search size={48} className="mx-auto mb-3 text-border" />
          <p>Không có tin đăng nào.</p>
          {hasActiveFilters && <p className="text-sm mt-1">Thử thay đổi bộ lọc để tìm thêm.</p>}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {page.content.map((l: Listing) => <ListingCard key={l.id} listing={l} />)}
          </div>
          {page.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button disabled={page.number === 0} onClick={() => go(selected, page.number - 1)}
                className="p-2 rounded-lg bg-card border border-border disabled:opacity-40 hover:border-muted text-white">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-muted-foreground px-2">{page.number + 1} / {page.totalPages}</span>
              <button disabled={page.number + 1 >= page.totalPages} onClick={() => go(selected, page.number + 1)}
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

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${active
        ? "bg-primary/15 border border-primary/40 text-primary"
        : "bg-card border border-border text-muted-foreground hover:border-muted hover:text-white"}`}>
      {label}
    </button>
  );
}

function FilterInput({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary"
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Đang tải...</div>}>
      <SearchContent />
    </Suspense>
  );
}
