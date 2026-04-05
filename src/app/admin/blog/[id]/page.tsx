"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { blogApi } from "@/lib/blogApi";
import { BlogPost, CreateBlogPostPayload } from "@/types";
import BlogForm from "../BlogForm";
import { ArrowLeft } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

export default function EditBlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blogApi
      .adminGetPost(id)
      .then((res) => setPost(res.data.data ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (values: CreateBlogPostPayload & { tags: string[] }) => {
    await blogApi.adminUpdate(id, { ...values, tags: values.tags });
    router.push("/admin/blog");
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-64 text-[#9CA3AF]">
          Đang tải...
        </div>
      </AdminShell>
    );
  }

  if (!post) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-64 text-[#9CA3AF]">
          Không tìm thấy bài viết.
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/blog"
            className="p-2 rounded-xl hover:bg-[#1A1A20] text-[#9CA3AF] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Chỉnh sửa bài viết</h1>
            <p className="text-sm text-[#9CA3AF] line-clamp-1">{post.title}</p>
          </div>
        </div>

        <BlogForm initial={post} onSubmit={handleSubmit} submitLabel="Lưu thay đổi" />
      </div>
    </AdminShell>
  );
}
