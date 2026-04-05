"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Category, Listing, ListingPage } from "@/types";
import ListingCard from "@/components/ListingCard";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";

// ── Filter input ──────────────────────────────────────────────────────────────
function FilterInput({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#6B7280] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2.5 text-sm
                   text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#D41B2C]
                   focus:ring-1 focus:ring-[#D41B2C]/20 transition"
      />
    </div>
  );
}

// ── Category chip ─────────────────────────────────────────────────────────────
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
        active
          ? "bg-[#D41B2C] border-[#D41B2C] text-white"
          : "bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#D41B2C] hover:text-[#D41B2C]"
      }`}
    >
      {label}
    </button>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────
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

  const [keyword, setKeyword]   = useState(searchParams.get("keyword") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [city, setCity]         = useState(searchParams.get("city") ?? "");
  const [minArea, setMinArea]   = useState(searchParams.get("minArea") ?? "");
  const [maxArea, setMaxArea]   = useState(searchParams.get("maxArea") ?? "");
  const [sortBy, setSortBy]     = useState(searchParams.get("sort") ?? "createdAt,desc");

  useEffect(() => { setSelected(categoryParam); }, [categoryParam]);

  useEffect(() => {
    api.get("/categories").then((res) => {
      const tree: Category[] = (res.data as { data: Category[] }).data ?? [];
      const leaves: Category[] = [];
      for (const parent of tree) {
        if ((parent.children ?? []).length > 0) {
          (parent.children ?? []).filter((c) => c.active).forEach((c) => leaves.push(c));
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
    if (selected)       params.set("categoryCode", selected);
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (minPrice)       params.set("minPrice", minPrice);
    if (maxPrice)       params.set("maxPrice", maxPrice);
    if (city.trim())    params.set("city", city.trim());
    if (minArea)        params.set("minArea", minArea);
    if (maxArea)        params.set("maxArea", maxArea);
    params.set("page", String(pageParam));
    params.set("size", "12");
    params.set("sort", sortBy);
    api.get(`/listings?${params.toString()}`)
      .then((res) => setPage((res.data as { data: ListingPage }).data ?? null))
      .finally(() => setLoading(false));
  }, [selected, pageParam, keyword, minPrice, maxPrice, city, minArea, maxArea, sortBy]);

  const go = (cat: string, p: number) => {
    const q = new URLSearchParams();
    if (cat)             q.set("category", cat);
    if (p > 0)           q.set("page", String(p));
    if (keyword.trim())  q.set("keyword", keyword.trim());
    if (minPrice)        q.set("minPrice", minPrice);
    if (maxPrice)        q.set("maxPrice", maxPrice);
    if (city.trim())     q.set("city", city.trim());
    if (minArea)         q.set("minArea", minArea);
    if (maxArea)         q.set("maxArea", maxArea);
    if (sortBy !== "createdAt,desc") q.set("sort", sortBy);
    router.push(`/tim-kiem?${q.toString()}`);
  };

  const clearFilters = () => {
    setKeyword(""); setMinPrice(""); setMaxPrice("");
    setCity(""); setMinArea(""); setMaxArea(""); setSortBy("createdAt,desc");
  };

  const hasActiveFilters = !!(keyword || minPrice || maxPrice || city || minArea || maxArea);

  const currentCatName = categories.find((c) => c.code === selected)?.name ?? "Tất cả tin đăng";

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* ── Top bar ── */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-[#1F2937]">{currentCatName}</h1>
              {page && (
                <p className="text-xs text-[#6B7280] mt-0.5">
                  {page.totalElements.toLocaleString()} tin đăng
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Sort select */}
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); go(selected, 0); }}
                className="h-9 px-3 rounded-lg border border-[#E5E7EB] bg-white text-sm
                           text-[#1F2937] focus:outline-none focus:border-[#D41B2C]"
              >
                <option value="createdAt,desc">Mới nhất</option>
                <option value="createdAt,asc">Cũ nhất</option>
                <option value="price,asc">Giá tăng dần</option>
                <option value="price,desc">Giá giảm dần</option>
              </select>
              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-medium
                            border transition-colors ${
                              showFilters || hasActiveFilters
                                ? "bg-[#FEF2F2] border-[#D41B2C]/30 text-[#D41B2C]"
                                : "bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#D41B2C] hover:text-[#D41B2C]"
                            }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Bộ lọc
                {hasActiveFilters && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D41B2C]" />
                )}
              </button>
            </div>
          </div>

          {/* Category chips */}
          <div className="flex gap-2 flex-wrap">
            <Chip label="Tất cả" active={!selected}
              onClick={() => { setSelected(""); go("", 0); }} />
            {categories.map((cat) => (
              <Chip key={cat.code} label={cat.name} active={selected === cat.code}
                onClick={() => { setSelected(cat.code); go(cat.code, 0); }} />
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-5 max-w-5xl mx-auto">
        {/* ── Filter panel ── */}
        {showFilters && (
          <div className="mb-5 bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#1F2937]">Bộ lọc nâng cao</h3>
              {hasActiveFilters && (
                <button onClick={clearFilters}
                  className="text-xs text-[#D41B2C] hover:text-[#B91624] flex items-center gap-1">
                  <X className="w-3 h-3" /> Xoá bộ lọc
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FilterInput label="Từ khoá" value={keyword} onChange={setKeyword} placeholder="Tìm theo tiêu đề..." />
              <FilterInput label="Giá từ (NT$)" value={minPrice} onChange={setMinPrice} placeholder="0" type="number" />
              <FilterInput label="Giá đến (NT$)" value={maxPrice} onChange={setMaxPrice} placeholder="Không giới hạn" type="number" />
              <FilterInput label="Thành phố" value={city} onChange={setCity} placeholder="Taipei, Taichung..." />
              <FilterInput label="Diện tích từ (m²)" value={minArea} onChange={setMinArea} placeholder="0" type="number" />
              <FilterInput label="Diện tích đến (m²)" value={maxArea} onChange={setMaxArea} placeholder="Không giới hạn" type="number" />
            </div>
            <button
              onClick={() => go(selected, 0)}
              className="mt-4 w-full sm:w-auto bg-[#D41B2C] hover:bg-[#B91624] text-white
                         rounded-lg px-6 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Search className="w-4 h-4" /> Áp dụng bộ lọc
            </button>
          </div>
        )}

        {/* ── Listings grid ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white border border-[#E5E7EB] rounded-xl h-60 animate-pulse">
                <div className="aspect-[4/3] bg-[#F3F4F6] rounded-t-xl" />
                <div className="p-3.5 space-y-2">
                  <div className="h-3.5 bg-[#F3F4F6] rounded w-full" />
                  <div className="h-3.5 bg-[#F3F4F6] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : !page || page.content.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-[#D41B2C]" />
            </div>
            <p className="font-semibold text-[#1F2937] mb-1">Không có tin đăng nào</p>
            {hasActiveFilters && (
              <p className="text-sm text-[#6B7280]">Thử thay đổi bộ lọc để tìm thêm.</p>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {page.content.map((l: Listing) => <ListingCard key={l.id} listing={l} />)}
            </div>

            {/* Pagination */}
            {page.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  disabled={page.number === 0}
                  onClick={() => go(selected, page.number - 1)}
                  className="w-9 h-9 rounded-lg bg-white border border-[#E5E7EB] disabled:opacity-40
                             hover:border-[#D41B2C] text-[#6B7280] hover:text-[#D41B2C] flex items-center justify-center transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(page.totalPages, 7) }, (_, i) => {
                  const p = page.totalPages <= 7
                    ? i
                    : page.number < 4
                      ? i
                      : page.number > page.totalPages - 5
                        ? page.totalPages - 7 + i
                        : page.number - 3 + i;
                  return (
                    <button key={p} onClick={() => go(selected, p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        p === page.number
                          ? "bg-[#D41B2C] text-white border border-[#D41B2C]"
                          : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:border-[#D41B2C] hover:text-[#D41B2C]"
                      }`}
                    >
                      {p + 1}
                    </button>
                  );
                })}
                <button
                  disabled={page.number + 1 >= page.totalPages}
                  onClick={() => go(selected, page.number + 1)}
                  className="w-9 h-9 rounded-lg bg-white border border-[#E5E7EB] disabled:opacity-40
                             hover:border-[#D41B2C] text-[#6B7280] hover:text-[#D41B2C] flex items-center justify-center transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64 text-[#6B7280]">Đang tải...</div>
    }>
      <SearchContent />
    </Suspense>
  );
}
