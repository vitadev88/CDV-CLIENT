"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BlogCategory } from "@/types";
import { Search, X } from "lucide-react";

interface Props {
  categories: BlogCategory[];
  initialKeyword?: string;
  initialCategoryId?: string;
}

export default function BlogListClient({
  categories,
  initialKeyword = "",
  initialCategoryId = "",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(initialKeyword);

  const navigate = (newKeyword: string, newCategoryId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newKeyword) params.set("keyword", newKeyword);
    else params.delete("keyword");
    if (newCategoryId) params.set("categoryId", newCategoryId);
    else params.delete("categoryId");
    params.delete("page");
    router.push(`/blog?${params.toString()}`);
  };

  const hasFilter = !!initialKeyword || !!initialCategoryId;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <input
          type="text"
          placeholder="Tìm kiếm bài viết..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate(keyword, initialCategoryId);
          }}
          className="w-full pl-9 pr-4 h-10 rounded-xl border border-[#E5E7EB] bg-white text-sm
                     text-[#1F2937] placeholder-[#9CA3AF]
                     focus:outline-none focus:border-[#D41B2C] focus:ring-1 focus:ring-[#D41B2C]/20 transition"
        />
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <select
          value={initialCategoryId}
          onChange={(e) => navigate(keyword, e.target.value)}
          className="h-10 px-3 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#1F2937]
                     focus:outline-none focus:border-[#D41B2C] transition"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      )}

      <button
        onClick={() => navigate(keyword, initialCategoryId)}
        className="h-10 px-5 rounded-xl bg-[#D41B2C] hover:bg-[#B91624] text-white text-sm font-semibold transition-colors"
      >
        Tìm
      </button>

      {hasFilter && (
        <button
          onClick={() => { setKeyword(""); navigate("", ""); }}
          className="h-10 px-3 rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#D41B2C] text-sm flex items-center gap-1 transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Xoá lọc
        </button>
      )}
    </div>
  );
}
