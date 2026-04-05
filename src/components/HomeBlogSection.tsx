"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BlogPostSummary } from "@/types";
import { BookOpen, ChevronRight, Eye, TrendingUp } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function fetchTrendingPosts(): Promise<BlogPostSummary[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/blog/posts/trending`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data as BlogPostSummary[]) ?? [];
  } catch {
    return [];
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ── Featured post card (large) ────────────────────────────────────────────────
function FeaturedPostCard({ post }: { post: BlogPostSummary }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex flex-col bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden
                 hover:shadow-lg hover:border-[#D41B2C]/30 transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] bg-[#F3F4F6] overflow-hidden">
        {post.thumbnail ? (
          <Image
            src={post.thumbnail}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl select-none bg-gradient-to-br from-red-50 to-red-100">
            📰
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Category badge */}
        {post.categoryName && (
          <span className="absolute top-3 left-3 bg-[#D41B2C] text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
            {post.categoryName}
          </span>
        )}

        {/* Trending badge */}
        <span className="absolute top-3 right-3 bg-[#F4C542] text-[#1F2937] text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <TrendingUp className="w-3 h-3" /> Nổi bật
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <h3 className="text-base font-bold text-[#1F2937] line-clamp-2 group-hover:text-[#D41B2C] transition-colors leading-snug">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-sm text-[#6B7280] line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-[#D41B2C] border border-red-100"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-[#9CA3AF] mt-auto pt-3 border-t border-[#F3F4F6]">
          <span className="font-medium text-[#6B7280] truncate">{post.authorName}</span>
          <div className="flex items-center gap-3 shrink-0 ml-2">
            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {post.viewCount?.toLocaleString() ?? 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Mini post item (list style) ───────────────────────────────────────────────
function MiniPostItem({ post, rank }: { post: BlogPostSummary; rank: number }) {
  const rankColors = ["text-[#D41B2C]", "text-orange-400", "text-yellow-500"];
  const rankColor = rankColors[rank] ?? "text-[#D1D5DB]";

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex gap-3 items-start p-3 rounded-xl hover:bg-[#FEF2F2] transition-colors"
    >
      <span className={`text-xl font-black w-6 shrink-0 leading-tight pt-0.5 ${rankColor}`}>
        {rank + 1}
      </span>

      {post.thumbnail ? (
        <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-[#F3F4F6]">
          <Image
            src={post.thumbnail}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="64px"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-16 h-12 rounded-lg bg-red-50 flex items-center justify-center shrink-0 text-2xl">
          📰
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1F2937] line-clamp-2 leading-snug group-hover:text-[#D41B2C] transition-colors">
          {post.title}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-[#9CA3AF]">
          <span>{formatDate(post.publishedAt || post.createdAt)}</span>
          <span className="flex items-center gap-0.5">
            <Eye className="w-2.5 h-2.5" />
            {post.viewCount?.toLocaleString() ?? 0}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function BlogSkeleton() {
  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden shadow-sm animate-pulse">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F6]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#F3F4F6] rounded-lg" />
          <div>
            <div className="h-4 bg-[#F3F4F6] rounded w-28 mb-1" />
            <div className="h-3 bg-[#F3F4F6] rounded w-40" />
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-[#E5E7EB] overflow-hidden bg-white">
              <div className="aspect-video bg-[#F3F4F6]" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-[#F3F4F6] rounded w-full" />
                <div className="h-4 bg-[#F3F4F6] rounded w-3/4" />
                <div className="h-3 bg-[#F3F4F6] rounded w-1/2 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HomeBlogSection() {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingPosts()
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <BlogSkeleton />;
  if (posts.length === 0) return null;

  const [first, second, ...rest] = posts;
  const featured = [first, second].filter(Boolean);
  const sideList = rest.slice(0, 4);

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F6]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#D41B2C]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1F2937]">Blog nổi bật</h2>
            <p className="text-xs text-[#9CA3AF]">Bài viết được đọc nhiều nhất</p>
          </div>
        </div>
        <Link
          href="/blog"
          className="flex items-center gap-1 text-sm font-semibold text-[#D41B2C] hover:text-[#B91624] transition-colors"
        >
          Xem tất cả <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex gap-6 items-start">
          {/* Left: 1–2 featured cards */}
          {featured.length > 0 && (
            <div
              className={`grid gap-4 flex-1 min-w-0 ${featured.length >= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 max-w-sm"
                }`}
            >
              {featured.map((post) => (
                <FeaturedPostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* Right: ranked mini list */}
          {sideList.length > 0 && (
            <div className="hidden lg:flex flex-col w-64 shrink-0 divide-y divide-[#F3F4F6]">
              {sideList.map((post, idx) => (
                <MiniPostItem key={post.id} post={post} rank={featured.length + idx} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
