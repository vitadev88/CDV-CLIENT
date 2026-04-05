import { Metadata } from "next";
import Link from "next/link";
import { blogServerApi } from "@/lib/blogApi";
import BlogCard from "@/components/BlogCard";
import BlogListClient from "./BlogListClient";
import { TrendingUp, BookOpen, Tag } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://congdongviet.com";

type SearchParams = Promise<{ keyword?: string; categoryId?: string; page?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const page = Number(params.page ?? 0);

  let categoryName = "";
  if (params.categoryId) {
    try {
      const categories = await blogServerApi.getCategories();
      categoryName = categories.find((c) => c.id === params.categoryId)?.name ?? "";
    } catch { /* ignore */ }
  }

  const titleParts: string[] = [];
  if (categoryName) titleParts.push(categoryName);
  if (params.keyword) titleParts.push(`"${params.keyword}"`);
  const prefix = titleParts.length ? `${titleParts.join(" · ")} — ` : "";
  const pageLabel = page > 0 ? ` (Trang ${page + 1})` : "";

  const title = `${prefix}Blog${pageLabel} | Cộng Đồng Việt Đài Loan`;
  const description = categoryName
    ? `Bài viết về "${categoryName}" từ cộng đồng người Việt tại Đài Loan.`
    : "Tin tức, kinh nghiệm và chia sẻ từ cộng đồng người Việt tại Đài Loan.";

  const canonicalParams = new URLSearchParams();
  if (params.keyword) canonicalParams.set("keyword", params.keyword);
  if (params.categoryId) canonicalParams.set("categoryId", params.categoryId);
  if (page > 0) canonicalParams.set("page", String(page));
  const qs = canonicalParams.toString();

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/blog${qs ? `?${qs}` : ""}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/blog${qs ? `?${qs}` : ""}`,
      type: "website",
    },
  };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 0);
  const qs = new URLSearchParams();
  if (params.keyword)    qs.set("keyword", params.keyword);
  if (params.categoryId) qs.set("categoryId", params.categoryId);
  qs.set("page", String(page));
  qs.set("size", "12");
  qs.set("sort", "publishedAt,desc");

  const [blogPage, categories, trending] = await Promise.all([
    blogServerApi.getPosts(qs.toString()).catch(() => ({ content: [], totalElements: 0, totalPages: 0, number: 0 })),
    blogServerApi.getCategories().catch(() => []),
    blogServerApi.getTrending().catch(() => []),
  ]);

  const selectedCat = categories.find((c) => c.id === params.categoryId);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">

      {/* ── Header ── */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#D41B2C]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1F2937]">Blog</h1>
          </div>
          <p className="text-[#6B7280] text-sm ml-13 pl-[52px]">
            Tin tức và chia sẻ từ cộng đồng người Việt tại Đài Loan
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-8 items-start">

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            {/* Search + filter */}
            <div className="mb-6">
              <BlogListClient
                categories={categories}
                initialKeyword={params.keyword}
                initialCategoryId={params.categoryId}
              />
            </div>

            {/* Active filter label */}
            {selectedCat && (
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-[#D41B2C]" />
                <span className="text-sm font-medium text-[#1F2937]">{selectedCat.name}</span>
                <span className="text-sm text-[#6B7280]">· {blogPage.totalElements} bài viết</span>
              </div>
            )}

            {/* Posts grid */}
            {blogPage.content.length === 0 ? (
              <div className="text-center py-24">
                <BookOpen className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
                <p className="text-[#6B7280] font-medium">Không tìm thấy bài viết nào.</p>
                <p className="text-sm text-[#9CA3AF] mt-1">Thử thay đổi từ khoá hoặc danh mục.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {blogPage.content.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Pagination */}
                {blogPage.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-10">
                    {/* rel prev/next links for SEO */}
                    {page > 0 && (
                      <link
                        rel="prev"
                        href={`?${new URLSearchParams({
                          ...(params.keyword ? { keyword: params.keyword } : {}),
                          ...(params.categoryId ? { categoryId: params.categoryId } : {}),
                          page: String(page - 1),
                        })}`}
                      />
                    )}
                    {page < blogPage.totalPages - 1 && (
                      <link
                        rel="next"
                        href={`?${new URLSearchParams({
                          ...(params.keyword ? { keyword: params.keyword } : {}),
                          ...(params.categoryId ? { categoryId: params.categoryId } : {}),
                          page: String(page + 1),
                        })}`}
                      />
                    )}
                    {Array.from({ length: Math.min(blogPage.totalPages, 7) }, (_, i) => {
                      const p = blogPage.totalPages <= 7
                        ? i
                        : page < 4
                          ? i
                          : page > blogPage.totalPages - 5
                            ? blogPage.totalPages - 7 + i
                            : page - 3 + i;
                      return (
                        <a
                          key={p}
                          href={`?${new URLSearchParams({
                            ...(params.keyword ? { keyword: params.keyword } : {}),
                            ...(params.categoryId ? { categoryId: params.categoryId } : {}),
                            page: String(p),
                          })}`}
                          aria-label={`Trang ${p + 1}`}
                          aria-current={p === page ? "page" : undefined}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-colors
                            ${p === page
                              ? "bg-[#D41B2C] text-white"
                              : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:border-[#D41B2C] hover:text-[#D41B2C]"
                            }`}
                        >
                          {p + 1}
                        </a>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="hidden lg:flex flex-col gap-5 w-64 shrink-0">

            {/* Trending */}
            {trending.length > 0 && (
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-[#D41B2C]" />
                  <h3 className="font-semibold text-[#1F2937] text-sm">Bài viết nổi bật</h3>
                </div>
                <ol className="space-y-3">
                  {trending.map((post, idx) => (
                    <li key={post.id} className="flex gap-3 items-start">
                      <span className={`text-lg font-bold w-6 shrink-0 leading-tight
                        ${idx === 0 ? "text-[#D41B2C]" : idx === 1 ? "text-orange-400" : idx === 2 ? "text-yellow-500" : "text-[#D1D5DB]"}`}>
                        {idx + 1}
                      </span>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-sm text-[#1F2937] hover:text-[#D41B2C] transition-colors line-clamp-2 leading-snug"
                      >
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-4 h-4 text-[#D41B2C]" />
                  <h3 className="font-semibold text-[#1F2937] text-sm">Danh mục</h3>
                </div>
                <ul className="space-y-1">
                  <li>
                    <Link
                      href="/blog"
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                        ${!params.categoryId ? "bg-red-50 text-[#D41B2C] font-medium" : "text-[#6B7280] hover:bg-[#F5F5F5] hover:text-[#1F2937]"}`}
                    >
                      Tất cả
                    </Link>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/blog?categoryId=${cat.id}`}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                          ${params.categoryId === cat.id ? "bg-red-50 text-[#D41B2C] font-medium" : "text-[#6B7280] hover:bg-[#F5F5F5] hover:text-[#1F2937]"}`}
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

        </div>
      </div>
    </div>
  );
}
