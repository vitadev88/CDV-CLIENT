import {
  ApiResponse,
  BlogCategory,
  BlogPage,
  BlogPost,
  BlogPostSummary,
  CreateBlogPostPayload,
} from "@/types";

// Server components use internal Docker URL; client uses public URL (baked at build time)
const API_BASE = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/** Server-side fetch (used in RSC / generateMetadata) */
async function serverFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1/blog${path}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Blog API error: ${res.status}`);
  const json: ApiResponse<T> = await res.json();
  return json.data as T;
}

export const blogServerApi = {
  getPosts: (params?: string) =>
    serverFetch<BlogPage>(`/posts${params ? `?${params}` : ""}`),
  getPost: (slug: string) => serverFetch<BlogPost>(`/posts/${slug}`),
  getRelated: (slug: string) =>
    serverFetch<BlogPostSummary[]>(`/posts/${slug}/related`),
  getTrending: () => serverFetch<BlogPostSummary[]>("/posts/trending"),
  getCategories: () => serverFetch<BlogCategory[]>("/categories"),
};

/** Client-side: thin wrappers around the authenticated api instance */
import api from "./api";

export const blogApi = {
  // Public
  getPosts: (params?: Record<string, string | number>) =>
    api.get<ApiResponse<BlogPage>>("/blog/posts", { params }),
  getPost: (slug: string) =>
    api.get<ApiResponse<BlogPost>>(`/blog/posts/${slug}`),
  getRelated: (slug: string) =>
    api.get<ApiResponse<BlogPostSummary[]>>(`/blog/posts/${slug}/related`),
  getTrending: (limit = 5) =>
    api.get<ApiResponse<BlogPostSummary[]>>("/blog/posts/trending", {
      params: { limit },
    }),
  getCategories: () =>
    api.get<ApiResponse<BlogCategory[]>>("/blog/categories"),

  // Admin
  adminGetPosts: (params?: Record<string, string | number>) =>
    api.get<ApiResponse<BlogPage>>("/blog/admin/posts", { params }),
  adminGetPost: (id: string) =>
    api.get<ApiResponse<BlogPost>>(`/blog/admin/posts/${id}`),
  adminCreate: (payload: CreateBlogPostPayload) =>
    api.post<ApiResponse<BlogPost>>("/blog/admin/posts", payload),
  adminUpdate: (id: string, payload: Partial<CreateBlogPostPayload>) =>
    api.patch<ApiResponse<BlogPost>>(`/blog/admin/posts/${id}`, payload),
  adminDelete: (id: string) =>
    api.delete<ApiResponse<void>>(`/blog/admin/posts/${id}`),
  adminCreateCategory: (payload: { name: string; description?: string }) =>
    api.post<ApiResponse<BlogCategory>>("/blog/admin/categories", payload),
};
