import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://congdongviet.com";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/tin-dang`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/tim-kiem`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  const [blogRoutes, listingRoutes] = await Promise.all([
    fetchBlogRoutes(),
    fetchListingRoutes(),
  ]);

  return [...staticRoutes, ...blogRoutes, ...listingRoutes];
}

async function fetchBlogRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    let page = 0;
    const routes: MetadataRoute.Sitemap = [];

    while (true) {
      const res = await fetch(
        `${API_BASE}/api/v1/blog/posts?page=${page}&size=100&sort=publishedAt,desc`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) break;
      const json = await res.json();
      const posts: { slug: string; updatedAt: string }[] = json.data?.content ?? [];
      if (posts.length === 0) break;

      for (const post of posts) {
        routes.push({
          url: `${SITE_URL}/blog/${post.slug}`,
          lastModified: new Date(post.updatedAt),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }

      if (json.data?.last) break;
      page++;
    }

    return routes;
  } catch {
    return [];
  }
}

async function fetchListingRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    let page = 0;
    const routes: MetadataRoute.Sitemap = [];

    while (true) {
      const res = await fetch(
        `${API_BASE}/api/v1/listings?page=${page}&size=100&status=ACTIVE&sort=createdAt,desc`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) break;
      const json = await res.json();
      const listings: { id: string; updatedAt?: string; createdAt: string }[] =
        json.data?.content ?? json.content ?? [];
      if (listings.length === 0) break;

      for (const listing of listings) {
        routes.push({
          url: `${SITE_URL}/tin-dang/${listing.id}`,
          lastModified: new Date(listing.updatedAt ?? listing.createdAt),
          changeFrequency: "weekly",
          priority: 0.75,
        });
      }

      const isLast = json.data?.last ?? json.last ?? listings.length < 100;
      if (isLast) break;
      page++;
    }

    return routes;
  } catch {
    return [];
  }
}
