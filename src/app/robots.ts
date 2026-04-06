import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://congdongviet6368.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/dang-nhap", "/dang-ky"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
