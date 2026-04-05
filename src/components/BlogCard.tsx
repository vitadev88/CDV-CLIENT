import Link from "next/link";
import Image from "next/image";
import { BlogPostSummary } from "@/types";
import { Calendar, Eye } from "lucide-react";

interface BlogCardProps {
  post: BlogPostSummary;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col bg-white border border-[#E5E7EB] rounded-xl overflow-hidden
                 hover:shadow-md hover:border-[#D41B2C]/30 transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#F3F4F6] overflow-hidden">
        {post.thumbnail ? (
          <Image
            src={post.thumbnail}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl select-none bg-red-50">
            📰
          </div>
        )}
        {post.categoryName && (
          <div className="absolute top-2 left-2">
            <span className="bg-[#D41B2C] text-white text-xs font-medium px-2.5 py-1 rounded-full">
              {post.categoryName}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h2 className="font-semibold text-[#1F2937] line-clamp-2 group-hover:text-[#D41B2C] transition-colors leading-snug">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-sm text-[#6B7280] line-clamp-3 flex-1">
            {post.excerpt}
          </p>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
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
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(post.publishedAt || post.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {post.viewCount.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
