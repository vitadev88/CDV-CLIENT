"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { blogApi } from "@/lib/blogApi";
import { CreateBlogPostPayload } from "@/types";
import BlogForm from "../BlogForm";
import { ArrowLeft } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

export default function CreateBlogPostPage() {
  const router = useRouter();

  const handleSubmit = async (values: CreateBlogPostPayload & { tags: string[] }) => {
    await blogApi.adminCreate({
      ...values,
      tags: values.tags,
    });
    router.push("/admin/blog");
  };

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
            <h1 className="text-xl font-bold text-white">Tạo bài viết mới</h1>
            <p className="text-sm text-[#9CA3AF]">Viết và xuất bản bài blog</p>
          </div>
        </div>

        <BlogForm onSubmit={handleSubmit} submitLabel="Lưu bài viết" />
      </div>
    </AdminShell>
  );
}
