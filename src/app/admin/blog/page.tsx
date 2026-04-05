"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { blogApi } from "@/lib/blogApi";
import { BlogPage, BlogPostSummary } from "@/types";
import { PlusCircle, Pencil, Trash2, Eye, Search } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN");
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [data, setData] = useState<BlogPage | null>(null);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(() => {
    setLoading(true);
    blogApi
      .adminGetPosts({ keyword, status, page, size: 20, sort: "createdAt,desc" })
      .then((res) => setData(res.data.data ?? null))
      .finally(() => setLoading(false));
  }, [keyword, status, page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Xoá bài viết "${title}"?`)) return;
    await blogApi.adminDelete(id);
    fetchPosts();
  };

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Quản lý Blog</h1>
            <p className="text-sm text-[#9CA3AF]">
              {data?.totalElements ?? 0} bài viết
            </p>
          </div>
          <Link
            href="/admin/blog/tao-bai"
            className="flex items-center gap-2 bg-[#1CE479] hover:bg-[#17c46a] text-black text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Tạo bài viết
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setPage(0); fetchPosts(); } }}
              placeholder="Tìm theo tiêu đề..."
              className="w-full pl-9 pr-4 h-10 rounded-xl border border-[#2A2A35] bg-[#1A1A20] text-white text-sm
                         placeholder-[#9CA3AF] focus:outline-none focus:border-[#1CE479]/50 transition-colors"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            className="h-10 px-3 rounded-xl border border-[#2A2A35] bg-[#1A1A20] text-white text-sm focus:outline-none focus:border-[#1CE479]/50"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PUBLISHED">Đã đăng</option>
            <option value="DRAFT">Nháp</option>
          </select>
          <button
            onClick={() => { setPage(0); fetchPosts(); }}
            className="h-10 px-4 rounded-xl border border-[#2A2A35] bg-[#1A1A20] text-[#9CA3AF] hover:text-white text-sm transition-colors"
          >
            Lọc
          </button>
        </div>

        {/* Table */}
        <div className="bg-[#1A1A20] border border-[#2A2A35] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-[#2A2A35]">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[#9CA3AF]">Tiêu đề</th>
                <th className="text-left px-4 py-3 font-medium text-[#9CA3AF] hidden md:table-cell">Danh mục</th>
                <th className="text-left px-4 py-3 font-medium text-[#9CA3AF]">Trạng thái</th>
                <th className="text-left px-4 py-3 font-medium text-[#9CA3AF] hidden lg:table-cell">Ngày tạo</th>
                <th className="text-left px-4 py-3 font-medium text-[#9CA3AF] hidden lg:table-cell">Lượt xem</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A35]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#9CA3AF]">
                    Đang tải...
                  </td>
                </tr>
              ) : data?.content.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#9CA3AF]">
                    Không có bài viết nào.
                  </td>
                </tr>
              ) : (
                data?.content.map((post: BlogPostSummary) => (
                  <tr key={post.id} className="hover:bg-[#111118] transition-colors">
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-white line-clamp-1">{post.title}</p>
                      <p className="text-xs text-[#9CA3AF]">/blog/{post.slug}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-[#9CA3AF]">
                      {post.categoryName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.status === "PUBLISHED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        }`}
                      >
                        {post.status === "PUBLISHED" ? "Đã đăng" : "Nháp"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-[#9CA3AF]">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-[#9CA3AF]">
                      {post.viewCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {post.status === "PUBLISHED" && (
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-[#2A2A35] text-[#9CA3AF] hover:text-white transition-colors"
                            title="Xem"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => router.push(`/admin/blog/${post.id}`)}
                          className="p-1.5 rounded-lg hover:bg-[#2A2A35] text-[#9CA3AF] hover:text-[#1CE479] transition-colors"
                          title="Sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#9CA3AF] hover:text-red-400 transition-colors"
                          title="Xoá"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: data.totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                  i === page
                    ? "bg-[#1CE479] text-black"
                    : "border border-[#2A2A35] text-[#9CA3AF] hover:text-white hover:border-[#1CE479]/50"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
