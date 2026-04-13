"use client";

import {
  useEffect, useRef, useState, useCallback,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { blogApi } from "@/lib/blogApi";
import api from "@/lib/api";
import { BlogCategory, BlogPost } from "@/types";
import {
  Loader2, X, Bold, Italic, Underline, Link2, List, ListOrdered,
  Heading1, Heading2, Heading3, Quote, Code2, Image, AlignLeft,
  AlignCenter, AlignRight, Eye, Code, Upload, Search, Globe,
  CheckCircle2, Clock, Hash,
} from "lucide-react";

// ── Zod schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  title:           z.string().min(1, "Tiêu đề là bắt buộc"),
  slug:            z.string().optional(),
  excerpt:         z.string().optional(),
  thumbnail:       z.string().optional(),
  categoryId:      z.string().optional(),
  metaTitle:       z.string().optional(),
  metaDescription: z.string().max(320, "Tối đa 320 ký tự").optional(),
  status:          z.enum(["DRAFT", "SCHEDULED", "PUBLISHED"]),
  scheduledAt:     z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

// ── Vietnamese slug util ──────────────────────────────────────────────────────
function toSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-");
}

// ── Word count + read time ────────────────────────────────────────────────────
function getWordCount(html: string) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return 0;
  return text.split(" ").filter(Boolean).length;
}

// ── Toolbar button ────────────────────────────────────────────────────────────
function TBtn({
  title, onClick, active, children,
}: {
  title: string; onClick: () => void; active?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`w-8 h-8 rounded flex items-center justify-center transition-colors text-sm
        ${active
          ? "bg-[#1CE479] text-black"
          : "text-[#9CA3AF] hover:bg-[#2A2A35] hover:text-white"
        }`}
    >
      {children}
    </button>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  initial?: BlogPost;
  onSubmit: (values: FormValues & { content: string; tags: string[]; scheduledAt?: string }) => Promise<void>;
  submitLabel: string;
}

const AUTOSAVE_KEY = "cdv_blog_draft";

export default function BlogForm({ initial, onSubmit, submitLabel }: Props) {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags]             = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editorMode, setEditorMode] = useState<"rich" | "html" | "preview">("rich");
  const [htmlSource, setHtmlSource] = useState(initial?.content ?? "");
  const [uploading, setUploading]   = useState(false);
  const [slugManual, setSlugManual] = useState(!!initial?.slug);
  const editorRef  = useRef<HTMLDivElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);

  // ── Internal Link Panel ───────────────────────────────────────────────────
  const [linkSearch,    setLinkSearch]    = useState("");
  const [linkResults,   setLinkResults]   = useState<import("@/types").BlogPostSummary[]>([]);
  const [linkSearching, setLinkSearching] = useState(false);
  const [linkInserted,  setLinkInserted]  = useState<string | null>(null);

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:           initial?.title ?? "",
      slug:            initial?.slug  ?? "",
      excerpt:         initial?.excerpt ?? "",
      thumbnail:       initial?.thumbnail ?? "",
      categoryId:      initial?.categoryId ?? "",
      metaTitle:       initial?.metaTitle ?? "",
      metaDescription: initial?.metaDescription ?? "",
      status:          (initial?.status as "DRAFT" | "SCHEDULED" | "PUBLISHED") ?? "DRAFT",
      scheduledAt:     initial?.scheduledAt
                         ? initial.scheduledAt.slice(0, 16)   // trim to "YYYY-MM-DDTHH:mm"
                         : "",
    },
  });

  const watchTitle   = watch("title");
  const watchSlug    = watch("slug");
  const watchMeta    = watch("metaDescription") ?? "";
  const watchThumb   = watch("thumbnail") ?? "";
  const watchStatus  = watch("status");

  // ── Auto-slug from title ───────────────────────────────────────────────────
  useEffect(() => {
    if (slugManual || !watchTitle) return;
    setValue("slug", toSlug(watchTitle));
  }, [watchTitle, slugManual, setValue]);

  // ── Load categories ────────────────────────────────────────────────────────
  useEffect(() => {
    blogApi.getCategories().then((r) => setCategories(r.data.data ?? []));
  }, []);

  // ── Init editor content ────────────────────────────────────────────────────
  useEffect(() => {
    if (editorRef.current && editorMode === "rich") {
      editorRef.current.innerHTML = htmlSource;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorMode]);

  // ── Auto-save draft (no initial = create mode) ─────────────────────────────
  useEffect(() => {
    if (initial) return;
    const id = setTimeout(() => {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
        title: watchTitle, slug: watchSlug, content: htmlSource,
        tags, savedAt: new Date().toISOString(),
      }));
    }, 2000);
    return () => clearTimeout(id);
  }, [watchTitle, watchSlug, htmlSource, tags, initial]);

  // ── Restore draft ──────────────────────────────────────────────────────────
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftInfo, setDraftInfo] = useState<{ savedAt: string } | null>(null);
  useEffect(() => {
    if (initial) return;
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        setDraftInfo({ savedAt: d.savedAt });
      }
    } catch { /* ignore */ }
  }, [initial]);

  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (!saved) return;
      const d = JSON.parse(saved);
      if (d.title) setValue("title", d.title);
      if (d.slug)  { setValue("slug", d.slug); setSlugManual(true); }
      if (d.content) { setHtmlSource(d.content); if (editorRef.current) editorRef.current.innerHTML = d.content; }
      if (d.tags)  setTags(d.tags);
      setDraftRestored(true);
    } catch { /* ignore */ }
  };

  const discardDraft = () => {
    localStorage.removeItem(AUTOSAVE_KEY);
    setDraftInfo(null);
  };

  // ── Debounced internal-link search ────────────────────────────────────────
  useEffect(() => {
    if (!linkSearch.trim()) { setLinkResults([]); return; }
    const id = setTimeout(async () => {
      setLinkSearching(true);
      try {
        const r = await blogApi.adminGetPosts({ keyword: linkSearch, status: "PUBLISHED", size: 8 });
        setLinkResults(r.data.data?.content ?? []);
      } catch { /* ignore */ } finally { setLinkSearching(false); }
    }, 350);
    return () => clearTimeout(id);
  }, [linkSearch]);

  // ── Insert internal link at editor cursor ──────────────────────────────────
  const insertInternalLink = (post: import("@/types").BlogPostSummary) => {
    const href  = `/blog/${post.slug}`;
    const label = post.title;

    if (editorMode === "rich" && editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      if (sel && sel.toString().trim()) {
        // Wrap selected text with link
        document.execCommand("createLink", false, href);
      } else {
        // Insert full anchor at cursor
        document.execCommand("insertHTML", false,
          `<a href="${href}">${label}</a>`);
      }
      syncHtml();
    } else {
      // HTML source mode — insert at textarea cursor
      const ta = document.querySelector(
        'textarea[placeholder="<!-- HTML source -->"]'
      ) as HTMLTextAreaElement | null;
      const linkHtml = `<a href="${href}">${label}</a>`;
      if (ta) {
        const s = ta.selectionStart ?? ta.value.length;
        const e = ta.selectionEnd   ?? s;
        setHtmlSource(ta.value.slice(0, s) + linkHtml + ta.value.slice(e));
      } else {
        setHtmlSource((prev) => prev + linkHtml);
      }
    }

    setLinkInserted(post.slug);
    setTimeout(() => setLinkInserted(null), 2000);
  };

  // ── execCommand helpers ────────────────────────────────────────────────────
  const exec  = (cmd: string, val?: string) => { document.execCommand(cmd, false, val); editorRef.current?.focus(); };
  const fmt   = (cmd: string) => exec(cmd);
  const block = (tag: string) => exec("formatBlock", tag);

  const syncHtml = useCallback(() => {
    if (editorRef.current) setHtmlSource(editorRef.current.innerHTML);
  }, []);

  const switchMode = (mode: "rich" | "html" | "preview") => {
    // Before leaving rich mode, capture HTML
    if (editorMode === "rich" && editorRef.current) setHtmlSource(editorRef.current.innerHTML);
    setEditorMode(mode);
  };

  // ── Insert link ────────────────────────────────────────────────────────────
  const insertLink = () => {
    const url = prompt("Nhập URL:");
    if (url) exec("createLink", url);
  };

  // ── Thumbnail upload ───────────────────────────────────────────────────────
  const handleThumbnailUpload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("files", file);
      const res = await api.post<{ data: { urls: string[] } }>("/uploads", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.data?.urls?.[0];
      if (url) setValue("thumbnail", url);
    } catch { /* ignore */ } finally { setUploading(false); }
  };

  // ── Insert image into editor ───────────────────────────────────────────────
  const insertImageInEditor = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("files", file);
      const res = await api.post<{ data: { urls: string[] } }>("/uploads", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.data?.urls?.[0];
      if (url) exec("insertImage", url);
    } catch { /* ignore */ } finally { setUploading(false); }
  };

  // ── Word count ─────────────────────────────────────────────────────────────
  const wordCount = getWordCount(htmlSource);
  const readTime  = Math.max(1, Math.ceil(wordCount / 200));

  // ── Meta description indicator ────────────────────────────────────────────
  const metaLen = watchMeta.length;
  const metaColor = metaLen === 0
    ? "text-[#9CA3AF]"
    : metaLen < 120
      ? "text-yellow-400"
      : metaLen <= 160
        ? "text-[#1CE479]"
        : "text-red-400";

  // ── Form submit ────────────────────────────────────────────────────────────
  const handleFormSubmit = async (values: FormValues) => {
    // Validate: SCHEDULED requires a future date
    if (values.status === "SCHEDULED") {
      if (!values.scheduledAt) {
        alert("Vui lòng chọn ngày và giờ đăng bài."); return;
      }
      if (new Date(values.scheduledAt) <= new Date()) {
        alert("Thời gian đặt lịch phải ở tương lai."); return;
      }
    }
    // Capture latest rich editor content
    if (editorMode === "rich" && editorRef.current) setHtmlSource(editorRef.current.innerHTML);
    const content = editorMode === "rich"
      ? (editorRef.current?.innerHTML ?? htmlSource)
      : htmlSource;
    if (!content.trim()) { alert("Nội dung không được để trống."); return; }
    setSubmitting(true);
    try {
      await onSubmit({
        ...values,
        content,
        tags,
        // Only send scheduledAt when status is SCHEDULED
        scheduledAt: values.status === "SCHEDULED" ? values.scheduledAt : undefined,
      });
      if (!initial) { localStorage.removeItem(AUTOSAVE_KEY); }
    } finally { setSubmitting(false); }
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  // ── SEO preview data ───────────────────────────────────────────────────────
  const seoTitle = watch("metaTitle") || watchTitle || "Tiêu đề bài viết";
  const seoDesc  = watchMeta || watch("excerpt") || "Mô tả bài viết sẽ hiện ở đây...";
  const seoSlug  = watchSlug || "slug-bai-viet";
  const seoUrl   = `congdongviet6368.com/blog/${seoSlug}`;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-0">
      {/* Draft recovery banner */}
      {draftInfo && !initial && !draftRestored && (
        <div className="mb-4 flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30
                        rounded-xl px-4 py-3 text-sm text-yellow-400">
          <Clock className="w-4 h-4 shrink-0" />
          <span className="flex-1">
            Có bản nháp tự lưu lúc {new Date(draftInfo.savedAt).toLocaleTimeString("vi-VN")}
          </span>
          <button type="button" onClick={restoreDraft}
            className="font-semibold hover:text-yellow-300 transition-colors">
            Khôi phục
          </button>
          <button type="button" onClick={discardDraft}
            className="text-[#9CA3AF] hover:text-white transition-colors">
            Bỏ qua
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">

        {/* ── LEFT: Editor area (3/4) ──────────────────────────────────── */}
        <div className="xl:col-span-3 space-y-4">

          {/* Title */}
          <div className="bg-[#111118] border border-[#1A1A20] rounded-xl p-5">
            <input
              {...register("title")}
              placeholder="Nhập tiêu đề bài viết..."
              className="w-full text-xl font-bold bg-transparent text-white placeholder-[#4A4A55]
                         border-none outline-none resize-none"
            />
            {errors.title && (
              <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>
            )}
            {/* Slug row */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#1A1A20]">
              <Hash className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
              <span className="text-xs text-[#9CA3AF]">congdongviet6368.com/blog/</span>
              <input
                {...register("slug")}
                placeholder="slug-bai-viet"
                onChange={(e) => { setValue("slug", e.target.value); setSlugManual(true); }}
                className="flex-1 text-xs font-mono bg-transparent text-[#1CE479] placeholder-[#4A4A55]
                           border-none outline-none"
              />
              {slugManual && (
                <button type="button" onClick={() => { setSlugManual(false); setValue("slug", toSlug(watchTitle ?? "")); }}
                  className="text-[10px] text-[#9CA3AF] hover:text-white px-2 py-0.5 rounded bg-[#1A1A20] transition-colors">
                  Tự động
                </button>
              )}
            </div>
          </div>

          {/* Rich text editor */}
          <div className="bg-[#111118] border border-[#1A1A20] rounded-xl overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 flex-wrap px-3 py-2 border-b border-[#1A1A20] bg-[#0D0D12]">
              <TBtn title="Bold (Ctrl+B)"       onClick={() => fmt("bold")}         ><Bold className="w-4 h-4" /></TBtn>
              <TBtn title="Italic (Ctrl+I)"     onClick={() => fmt("italic")}       ><Italic className="w-4 h-4" /></TBtn>
              <TBtn title="Underline (Ctrl+U)"  onClick={() => fmt("underline")}    ><Underline className="w-4 h-4" /></TBtn>
              <div className="w-px h-5 bg-[#2A2A35] mx-1" />
              <TBtn title="Tiêu đề H1"  onClick={() => block("h1")}><Heading1 className="w-4 h-4" /></TBtn>
              <TBtn title="Tiêu đề H2"  onClick={() => block("h2")}><Heading2 className="w-4 h-4" /></TBtn>
              <TBtn title="Tiêu đề H3"  onClick={() => block("h3")}><Heading3 className="w-4 h-4" /></TBtn>
              <div className="w-px h-5 bg-[#2A2A35] mx-1" />
              <TBtn title="Căn trái"  onClick={() => fmt("justifyLeft")} ><AlignLeft className="w-4 h-4" /></TBtn>
              <TBtn title="Căn giữa" onClick={() => fmt("justifyCenter")}><AlignCenter className="w-4 h-4" /></TBtn>
              <TBtn title="Căn phải" onClick={() => fmt("justifyRight")} ><AlignRight className="w-4 h-4" /></TBtn>
              <div className="w-px h-5 bg-[#2A2A35] mx-1" />
              <TBtn title="Danh sách"        onClick={() => fmt("insertUnorderedList")}><List className="w-4 h-4" /></TBtn>
              <TBtn title="Danh sách số"     onClick={() => fmt("insertOrderedList")} ><ListOrdered className="w-4 h-4" /></TBtn>
              <TBtn title="Trích dẫn"        onClick={() => block("blockquote")}       ><Quote className="w-4 h-4" /></TBtn>
              <TBtn title="Code block"       onClick={() => block("pre")}              ><Code2 className="w-4 h-4" /></TBtn>
              <div className="w-px h-5 bg-[#2A2A35] mx-1" />
              <TBtn title="Chèn link"  onClick={insertLink}><Link2 className="w-4 h-4" /></TBtn>
              <label title="Chèn ảnh" className="w-8 h-8 rounded flex items-center justify-center cursor-pointer
                            text-[#9CA3AF] hover:bg-[#2A2A35] hover:text-white transition-colors">
                <Image className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && insertImageInEditor(e.target.files[0])} />
              </label>
              {uploading && <Loader2 className="w-4 h-4 text-[#1CE479] animate-spin ml-1" />}

              {/* Mode toggle */}
              <div className="ml-auto flex items-center gap-1 bg-[#1A1A20] rounded-lg p-0.5">
                {(["rich", "html", "preview"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => switchMode(m)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      editorMode === m
                        ? "bg-[#1CE479] text-black"
                        : "text-[#9CA3AF] hover:text-white"
                    }`}>
                    {m === "rich" ? <Eye className="w-3.5 h-3.5" /> : m === "html" ? <Code className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor body */}
            {editorMode === "rich" && (
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={syncHtml}
                className="min-h-[500px] p-5 text-[#E5E7EB] text-sm leading-relaxed outline-none
                           [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:my-3
                           [&_h2]:text-xl  [&_h2]:font-bold [&_h2]:text-white [&_h2]:my-2
                           [&_h3]:text-lg  [&_h3]:font-semibold [&_h3]:text-white [&_h3]:my-2
                           [&_p]:my-2 [&_a]:text-[#1CE479] [&_a]:underline
                           [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2
                           [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2
                           [&_blockquote]:border-l-4 [&_blockquote]:border-[#1CE479]/50
                           [&_blockquote]:pl-4 [&_blockquote]:text-[#9CA3AF] [&_blockquote]:italic [&_blockquote]:my-3
                           [&_pre]:bg-[#0D0D12] [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:text-sm [&_pre]:font-mono
                           [&_code]:bg-[#0D0D12] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono
                           [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-3 [&_img]:shadow-md"
                data-placeholder="Bắt đầu viết nội dung bài viết..."
                style={{ caretColor: "#1CE479" }}
              />
            )}

            {editorMode === "html" && (
              <textarea
                value={htmlSource}
                onChange={(e) => setHtmlSource(e.target.value)}
                rows={25}
                className="w-full p-5 bg-[#0D0D12] text-[#9CA3AF] text-xs font-mono
                           outline-none resize-y border-t border-[#1A1A20]"
                placeholder="<!-- HTML source -->"
              />
            )}

            {editorMode === "preview" && (
              <div
                className="min-h-[500px] p-5 text-[#E5E7EB] text-sm leading-relaxed
                           prose prose-invert max-w-none
                           [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:my-3
                           [&_h2]:text-xl  [&_h2]:font-bold [&_h2]:text-white [&_h2]:my-2
                           [&_h3]:text-lg  [&_h3]:font-semibold [&_h3]:text-white [&_h3]:my-2
                           [&_p]:my-2 [&_a]:text-[#1CE479] [&_a]:underline
                           [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2
                           [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2
                           [&_blockquote]:border-l-4 [&_blockquote]:border-[#1CE479]/50
                           [&_blockquote]:pl-4 [&_blockquote]:text-[#9CA3AF] [&_blockquote]:italic [&_blockquote]:my-3
                           [&_pre]:bg-[#0D0D12] [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:text-sm [&_pre]:font-mono
                           [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-3 [&_img]:shadow-md"
                dangerouslySetInnerHTML={{ __html: htmlSource }}
              />
            )}

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-[#1A1A20] bg-[#0D0D12] text-xs text-[#9CA3AF]">
              <span>{wordCount} từ</span>
              <span>~{readTime} phút đọc</span>
              {editorMode === "rich" && (
                <span className="ml-auto text-[#4A4A55]">Đã lưu nháp tự động</span>
              )}
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-[#111118] border border-[#1A1A20] rounded-xl p-4">
            <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
              Tóm tắt (excerpt)
            </label>
            <textarea
              {...register("excerpt")}
              rows={3}
              placeholder="Mô tả ngắn hiển thị trong danh sách bài viết. Để trống sẽ tự tạo từ nội dung."
              className="w-full bg-transparent text-[#E5E7EB] text-sm placeholder-[#4A4A55]
                         outline-none resize-none leading-relaxed"
            />
          </div>

          {/* SEO Preview */}
          <div className="bg-[#111118] border border-[#1A1A20] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
              <Search className="w-3.5 h-3.5" />
              Xem trước trên Google
            </div>

            {/* SERP mockup */}
            <div className="bg-white rounded-xl p-4 text-sm">
              <p className="text-[#1a0dab] text-lg font-normal leading-snug hover:underline cursor-pointer line-clamp-1">
                {seoTitle}
              </p>
              <p className="text-[#006621] text-xs mt-0.5 line-clamp-1">{seoUrl}</p>
              <p className="text-[#545454] text-sm mt-1 leading-snug line-clamp-2">
                {seoDesc}
              </p>
            </div>

            {/* SEO fields */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-[#9CA3AF]">Meta Title</label>
                  <span className={`text-xs ${(watch("metaTitle") ?? "").length > 60 ? "text-red-400" : "text-[#9CA3AF]"}`}>
                    {(watch("metaTitle") ?? "").length}/60
                  </span>
                </div>
                <input
                  {...register("metaTitle")}
                  placeholder="Tiêu đề SEO (tối ưu 50-60 ký tự)..."
                  className="w-full h-9 px-3 rounded-lg bg-[#0D0D12] border border-[#2A2A35]
                             text-[#E5E7EB] text-sm placeholder-[#4A4A55]
                             focus:outline-none focus:border-[#1CE479] transition"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-[#9CA3AF]">Meta Description</label>
                  <span className={`text-xs font-medium ${metaColor}`}>
                    {metaLen}/160
                    {metaLen >= 120 && metaLen <= 160 && " ✓"}
                  </span>
                </div>
                <textarea
                  {...register("metaDescription")}
                  rows={3}
                  placeholder="Mô tả SEO (tối ưu 120-160 ký tự)..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0D0D12] border border-[#2A2A35]
                             text-[#E5E7EB] text-sm placeholder-[#4A4A55] resize-none
                             focus:outline-none focus:border-[#1CE479] transition"
                />
                {/* Progress bar */}
                <div className="mt-1.5 h-1 bg-[#2A2A35] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      metaLen === 0 ? "w-0"
                        : metaLen < 120 ? "bg-yellow-400"
                        : metaLen <= 160 ? "bg-[#1CE479]"
                        : "bg-red-400"
                    }`}
                    style={{ width: `${Math.min(100, (metaLen / 160) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#9CA3AF] mt-1">
                  {metaLen === 0 && "Chưa nhập"}
                  {metaLen > 0 && metaLen < 120 && "Quá ngắn — nên thêm từ 120 ký tự"}
                  {metaLen >= 120 && metaLen <= 160 && "Tuyệt vời! Độ dài lý tưởng"}
                  {metaLen > 160 && "Quá dài — Google sẽ cắt bớt"}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ── RIGHT: Settings panel (1/4) ──────────────────────────────── */}
        <div className="xl:col-span-1 space-y-4">

          {/* Publish card */}
          <div className="bg-[#111118] border border-[#1A1A20] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Xuất bản</h3>
            <div>
              <label className="block text-xs text-[#9CA3AF] mb-1.5">Trạng thái</label>
              <select
                {...register("status")}
                className="w-full h-9 px-3 rounded-lg bg-[#0D0D12] border border-[#2A2A35]
                           text-sm text-[#E5E7EB] focus:outline-none focus:border-[#1CE479]"
              >
                <option value="DRAFT">📝 Lưu nháp</option>
                <option value="SCHEDULED">🕐 Đặt lịch đăng</option>
                <option value="PUBLISHED">🌐 Đăng ngay</option>
              </select>
            </div>

            {/* Scheduled datetime picker — only shown when status = SCHEDULED */}
            {watchStatus === "SCHEDULED" && (
              <div className="space-y-1.5">
                <label className="block text-xs text-[#9CA3AF]">
                  Ngày &amp; giờ đăng bài
                </label>
                <input
                  type="datetime-local"
                  {...register("scheduledAt")}
                  min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                  className="w-full h-9 px-3 rounded-lg bg-[#0D0D12] border border-[#2A2A35]
                             text-sm text-[#E5E7EB] focus:outline-none focus:border-[#1CE479]
                             [color-scheme:dark]"
                />
                <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
                  Bài sẽ tự động xuất hiện trên web đúng thời điểm này.
                </p>
                {/* Countdown preview */}
                {watch("scheduledAt") && new Date(watch("scheduledAt")!) > new Date() && (
                  <div className="flex items-center gap-1.5 text-[10px] text-[#1CE479]
                                  bg-[#1CE479]/5 border border-[#1CE479]/20 rounded-lg px-2.5 py-1.5">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>
                      Sẽ đăng vào{" "}
                      {new Date(watch("scheduledAt")!).toLocaleString("vi-VN", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full flex items-center justify-center gap-2 font-semibold rounded-xl
                          py-2.5 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed
                          ${watchStatus === "SCHEDULED"
                            ? "bg-blue-500 hover:bg-blue-400 text-white"
                            : "bg-[#1CE479] hover:bg-[#16c96a] text-black"
                          }`}
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                : watchStatus === "SCHEDULED"
                  ? <><Clock className="w-4 h-4" /> Đặt lịch</>
                  : <><CheckCircle2 className="w-4 h-4" /> {submitLabel}</>
              }
            </button>
          </div>

          {/* Category */}
          <div className="bg-[#111118] border border-[#1A1A20] rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Danh mục</h3>
            <select
              {...register("categoryId")}
              className="w-full h-9 px-3 rounded-lg bg-[#0D0D12] border border-[#2A2A35]
                         text-sm text-[#E5E7EB] focus:outline-none focus:border-[#1CE479]"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="bg-[#111118] border border-[#1A1A20] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Tags</h3>
            <div className="flex gap-1.5">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Nhập tag..."
                className="flex-1 h-8 px-2.5 rounded-lg bg-[#0D0D12] border border-[#2A2A35]
                           text-sm text-[#E5E7EB] placeholder-[#4A4A55]
                           focus:outline-none focus:border-[#1CE479]"
              />
              <button type="button" onClick={addTag}
                className="w-8 h-8 rounded-lg bg-[#1A1A20] border border-[#2A2A35]
                           text-[#9CA3AF] hover:text-white hover:border-[#1CE479] transition-colors text-sm">
                +
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag}
                    className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full
                               bg-[#1CE479]/10 text-[#1CE479] border border-[#1CE479]/20">
                    #{tag}
                    <button type="button" onClick={() => setTags(tags.filter((x) => x !== tag))}
                      className="hover:text-red-400 transition-colors ml-0.5">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Internal Link Panel ───────────────────────────────────── */}
          <div className="bg-[#111118] border border-[#1A1A20] rounded-xl p-4 space-y-3">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
              <Link2 className="w-3.5 h-3.5" />
              Chèn Internal Link
            </h3>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={linkSearch}
                onChange={(e) => setLinkSearch(e.target.value)}
                placeholder="Tìm bài viết đã đăng..."
                className="w-full h-8 pl-2.5 pr-7 rounded-lg bg-[#0D0D12] border border-[#2A2A35]
                           text-sm text-[#E5E7EB] placeholder-[#4A4A55]
                           focus:outline-none focus:border-[#1CE479] transition"
              />
              {linkSearching && (
                <Loader2 className="absolute right-2 top-2 w-3.5 h-3.5 text-[#1CE479] animate-spin" />
              )}
            </div>

            {/* Results */}
            {linkResults.length > 0 && (
              <div className="space-y-1 max-h-52 overflow-y-auto pr-0.5">
                {linkResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => insertInternalLink(p)}
                    title={`Chèn link: /blog/${p.slug}`}
                    className={`w-full text-left px-2.5 py-2 rounded-lg border transition-colors
                      ${linkInserted === p.slug
                        ? "bg-[#1CE479]/10 border-[#1CE479]/40 text-[#1CE479]"
                        : "bg-[#0D0D12] border-[#2A2A35] text-[#E5E7EB] hover:border-[#1CE479]/50 hover:bg-[#0D0D12]"
                      }`}
                  >
                    <span className="block text-xs font-medium line-clamp-2 leading-snug">
                      {linkInserted === p.slug ? "✓ Đã chèn — " : ""}{p.title}
                    </span>
                    <span className="block text-[10px] font-mono text-[#4A4A55] truncate mt-0.5">
                      /blog/{p.slug}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!linkSearching && linkSearch.trim() && linkResults.length === 0 && (
              <p className="text-xs text-[#4A4A55]">Không tìm thấy bài nào.</p>
            )}

            {/* Hint */}
            <p className="text-[10px] text-[#4A4A55] leading-relaxed">
              💡 Bôi đen text trước → click bài → text đó thành link. Hoặc click thẳng để chèn link đầy đủ vào vị trí con trỏ.
            </p>
          </div>

          {/* Thumbnail */}
          <div className="bg-[#111118] border border-[#1A1A20] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Ảnh bìa</h3>

            {/* Preview */}
            {watchThumb && (
              <div className="relative rounded-lg overflow-hidden aspect-video bg-[#0D0D12]">
                <img src={watchThumb} alt="Thumbnail" className="w-full h-full object-cover" />
                <button type="button"
                  onClick={() => setValue("thumbnail", "")}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full
                             flex items-center justify-center text-white hover:bg-red-500/80 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Upload button */}
            <label className={`flex items-center justify-center gap-2 h-9 rounded-lg border border-dashed
                               cursor-pointer transition-colors text-sm
                               ${uploading
                                 ? "border-[#2A2A35] text-[#9CA3AF] cursor-not-allowed"
                                 : "border-[#2A2A35] text-[#9CA3AF] hover:border-[#1CE479] hover:text-[#1CE479]"}`}>
              {uploading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang upload...</>
                : <><Upload className="w-4 h-4" /> Tải ảnh lên</>
              }
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                disabled={uploading}
                onChange={(e) => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])} />
            </label>

            {/* Or URL */}
            <input
              {...register("thumbnail")}
              placeholder="hoặc dán URL ảnh..."
              className="w-full h-9 px-3 rounded-lg bg-[#0D0D12] border border-[#2A2A35]
                         text-sm text-[#E5E7EB] placeholder-[#4A4A55]
                         focus:outline-none focus:border-[#1CE479]"
            />
          </div>

        </div>
      </div>
    </form>
  );
}
