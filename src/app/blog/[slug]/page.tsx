import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { blogServerApi } from "@/lib/blogApi";
import BlogCard from "@/components/BlogCard";
import { Calendar, Eye, Tag, User, ArrowLeft } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://congdongviet.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await blogServerApi.getPost(slug);
    const title = post.metaTitle || post.title;
    const description = post.metaDescription || post.excerpt || "Bài viết từ Cộng Đồng Việt Đài Loan";
    return {
      title: `${title} | Cộng Đồng Việt`,
      description,
      alternates: { canonical: `${SITE_URL}/blog/${slug}` },
      openGraph: {
        title, description,
        url: `${SITE_URL}/blog/${slug}`,
        type: "article",
        publishedTime: post.publishedAt,
        authors: [post.authorName],
        images: post.thumbnail
          ? [{ url: post.thumbnail, width: 1200, height: 630, alt: title }]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title, description,
        images: post.thumbnail ? [post.thumbnail] : [],
      },
    };
  } catch {
    return { title: "Bài viết không tồn tại" };
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let post, related;
  try {
    [post, related] = await Promise.all([
      blogServerApi.getPost(slug),
      blogServerApi.getRelated(slug),
    ]);
  } catch {
    notFound();
  }

  if (post.status !== "PUBLISHED") notFound();

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.thumbnail,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: post.authorName },
    publisher: {
      "@type": "Organization",
      name: "Cộng Đồng Việt Đài Loan",
      url: SITE_URL,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${slug}` },
  };

  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
    ...(post.categoryName
      ? [{ "@type": "ListItem", position: 3, name: post.categoryName, item: `${SITE_URL}/blog?categoryId=${post.categoryId}` },
         { "@type": "ListItem", position: 4, name: post.title, item: `${SITE_URL}/blog/${slug}` }]
      : [{ "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/blog/${slug}` }]
    ),
  ];

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="min-h-screen bg-[#F5F5F5]">

        {/* ── Breadcrumb bar ── */}
        <div className="bg-white border-b border-[#E5E7EB] px-6 py-3">
          <div className="max-w-3xl mx-auto">
            <nav className="flex items-center gap-2 text-sm text-[#6B7280]">
              <Link href="/" className="hover:text-[#D41B2C] transition-colors">Trang chủ</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-[#D41B2C] transition-colors">Blog</Link>
              {post.categoryName && (
                <>
                  <span>/</span>
                  <Link href={`/blog?categoryId=${post.categoryId}`}
                    className="hover:text-[#D41B2C] transition-colors">
                    {post.categoryName}
                  </Link>
                </>
              )}
              <span>/</span>
              <span className="text-[#1F2937] font-medium line-clamp-1">{post.title}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-8">

          {/* ── Article ── */}
          <article className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-sm">

            {/* Thumbnail */}
            {post.thumbnail && (
              <div className="relative aspect-video">
                <Image
                  src={post.thumbnail}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              </div>
            )}

            <div className="p-6 md:p-8">
              {/* Category badge */}
              {post.categoryName && (
                <Link href={`/blog?categoryId=${post.categoryId}`}
                  className="inline-block mb-3 text-xs font-semibold px-3 py-1 rounded-full
                             bg-red-50 text-[#D41B2C] border border-red-100 hover:bg-red-100 transition-colors">
                  {post.categoryName}
                </Link>
              )}

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-[#1F2937] leading-tight mb-4">
                {post.title}
              </h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#6B7280] pb-5 border-b border-[#F3F4F6]">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {post.authorName}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(post.publishedAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {post.viewCount.toLocaleString()} lượt xem
                </span>
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <Tag className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog?keyword=${encodeURIComponent(tag)}`}
                      className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-[#D41B2C]
                                 border border-red-100 hover:bg-red-100 transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Content */}
              <div
                className="mt-6 prose max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>
          </article>

          {/* ── Related posts ── */}
          {related.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-bold text-[#1F2937] mb-5">Bài viết liên quan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {related.map((p) => (
                  <BlogCard key={p.id} post={p} />
                ))}
              </div>
            </section>
          )}

          {/* ── Back link ── */}
          <div className="mt-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#D41B2C] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại Blog
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
