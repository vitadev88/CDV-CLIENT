"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, ChevronRight, ChevronDown,
  X, Check, AlertTriangle, Tag, FolderOpen, Layers, ToggleLeft, ToggleRight,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AdminShell from "@/components/admin/AdminShell";

// ── Types ──────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  code: string;
  name: string;
  detailTypeId: string | null;
  detailType: string | null;
  detailTypeName: string | null;
  active: boolean;
  sortOrder: number;
  children: Category[];
}

interface CategoryForm {
  code: string;
  name: string;
  parentId: string;
  detailType: string;
  sortOrder: number;
}

interface EditForm {
  code: string;
  name: string;
  parentId: string;
  removeParent: boolean;
  detailType: string;
  sortOrder: number;
  active: boolean;
}

const EMPTY_FORM: CategoryForm = { code: "", name: "", parentId: "", detailType: "", sortOrder: 0 };

interface DetailType {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1A1A20] border border-[#2A2A35] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A35]">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[#9CA3AF]">{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full bg-[#09090b] border border-[#2A2A35] rounded-xl px-3 py-2.5 text-sm text-white
                 placeholder-[#9CA3AF] outline-none focus:border-[#1CE479] transition-colors"
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className="w-full bg-[#09090b] border border-[#2A2A35] rounded-xl px-3 py-2.5 text-sm text-white
                 outline-none focus:border-[#1CE479] transition-colors"
    />
  );
}

// ── Category row (recursive) ───────────────────────────────────────────────

function CategoryRow({
  category,
  depth,
  allCategories,
  onEdit,
  onDelete,
  onToggle,
}: {
  category: Category;
  depth: number;
  allCategories: Category[];
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onToggle: (c: Category) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children.length > 0;

  return (
    <>
      <tr className="border-b border-[#2A2A35] last:border-0 hover:bg-white/[0.02] transition-colors group">
        {/* Name */}
        <td className="py-3.5 px-4">
          <div className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
            {hasChildren ? (
              <button onClick={() => setExpanded((e) => !e)} className="text-[#9CA3AF] hover:text-white transition-colors shrink-0">
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <span className="w-4 shrink-0 flex items-center justify-center">
                {depth > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#2A2A35]" />}
              </span>
            )}
            {depth === 0
              ? <FolderOpen className="w-4 h-4 text-[#1CE479] shrink-0" />
              : <Tag className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
            }
            <span className={`text-sm ${depth === 0 ? "font-semibold text-white" : "text-[#D1D5DB]"}`}>
              {category.name}
            </span>
          </div>
        </td>

        {/* Code */}
        <td className="py-3.5 px-4 hidden md:table-cell">
          <span className="text-xs font-mono text-[#9CA3AF] bg-[#09090b] px-2 py-1 rounded-lg border border-[#2A2A35]">
            {category.code}
          </span>
        </td>

        {/* Detail type */}
        <td className="py-3.5 px-4 hidden lg:table-cell">
          {category.detailTypeName ? (
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#1CE479]/10 text-[#1CE479] border border-[#1CE479]/20 font-medium">
              {category.detailTypeName}
            </span>
          ) : (
            <span className="text-xs text-[#9CA3AF]">—</span>
          )}
        </td>

        {/* Sort order */}
        <td className="py-3.5 px-4 hidden lg:table-cell">
          <span className="text-sm text-[#9CA3AF]">{category.sortOrder}</span>
        </td>

        {/* Status toggle */}
        <td className="py-3.5 px-4">
          <button onClick={() => onToggle(category)} className={`transition-colors ${category.active ? "text-[#1CE479]" : "text-[#9CA3AF]"}`} title={category.active ? "Đang hiển thị — nhấn để ẩn" : "Đang ẩn — nhấn để hiển thị"}>
            {category.active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
          </button>
        </td>

        {/* Actions */}
        <td className="py-3.5 px-4">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(category)}
              title="Chỉnh sửa"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#2A2A35] hover:text-white transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(category)}
              title="Xoá"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>

      {/* Children */}
      {expanded && hasChildren && category.children.map((child) => (
        <CategoryRow
          key={child.id}
          category={child}
          depth={depth + 1}
          allCategories={allCategories}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggle={onToggle}
        />
      ))}
    </>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailTypes, setDetailTypes] = useState<DetailType[]>([]);

  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<"parent" | "child">("parent");
  const [createForm, setCreateForm] = useState<CategoryForm>(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);

  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ code: "", name: "", parentId: "", removeParent: false, detailType: "", sortOrder: 0, active: true });
  const [editLoading, setEditLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Category[] }>("/categories/all");
      setCategories(res.data.data ?? []);
    } catch {
      showToast("Không thể tải danh mục", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/dang-nhap"); return; }
    fetchCategories();
    api.get<{ data: DetailType[] }>("/category-detail-types")
      .then((res) => setDetailTypes(res.data.data ?? []))
      .catch(() => showToast("Không thể tải loại chi tiết", "error"));
  }, [isAuthenticated, router, fetchCategories]);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // Flatten for parent selector
  const flatCategories = categories.flatMap((p) => [p, ...p.children]);
  const totalCount = flatCategories.length;

  // ── Create ─────────────────────────────────────────────────────────────

  async function submitCreate() {
    if (!createForm.code || !createForm.name) return;
    setCreateLoading(true);
    try {
      await api.post("/categories", {
        code: createForm.code,
        name: createForm.name,
        parentId: createForm.parentId || null,
        detailType: createForm.detailType || null,
        sortOrder: createForm.sortOrder,
      });
      showToast("Tạo danh mục thành công", "success");
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      fetchCategories();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Tạo thất bại";
      showToast(msg, "error");
    } finally {
      setCreateLoading(false);
    }
  }

  // ── Edit ───────────────────────────────────────────────────────────────

  function openEdit(c: Category) {
    // find parent id from tree
    const parentCat = categories.find((p) => p.children.some((ch) => ch.id === c.id));
    setEditTarget(c);
    setEditForm({
      code: c.code,
      name: c.name,
      parentId: parentCat?.id ?? "",
      removeParent: false,
      detailType: c.detailType ?? "",
      sortOrder: c.sortOrder,
      active: c.active,
    });
  }

  async function submitEdit() {
    if (!editTarget) return;
    setEditLoading(true);
    try {
      await api.put(`/categories/${editTarget.id}`, {
        code: editForm.code || undefined,
        name: editForm.name || undefined,
        parentId: editForm.removeParent ? undefined : (editForm.parentId || undefined),
        removeParent: editForm.removeParent || undefined,
        detailType: editForm.detailType || null,
        sortOrder: editForm.sortOrder,
        active: editForm.active,
      });
      showToast("Cập nhật thành công", "success");
      setEditTarget(null);
      fetchCategories();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Cập nhật thất bại";
      showToast(msg, "error");
    } finally {
      setEditLoading(false);
    }
  }

  // ── Toggle active ──────────────────────────────────────────────────────

  async function toggleActive(c: Category) {
    try {
      await api.put(`/categories/${c.id}`, { active: !c.active });
      fetchCategories();
    } catch {
      showToast("Thao tác thất bại", "error");
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────

  async function submitDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/categories/${deleteTarget.id}`);
      showToast("Đã xoá danh mục", "success");
      setDeleteTarget(null);
      fetchCategories();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Xoá thất bại";
      showToast(msg, "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <AdminShell>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Danh mục</h1>
            <p className="text-sm text-[#9CA3AF] mt-0.5">
              {loading ? "Đang tải..." : `${totalCount} danh mục`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/categories/detail-types"
              className="flex items-center gap-2 bg-[#1A1A20] border border-[#2A2A35] text-[#9CA3AF] text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#2A2A35] hover:text-white transition-colors shrink-0"
            >
              <Layers className="w-4 h-4" />
              Quản lý loại
            </Link>
            <button
              onClick={() => { setCreateMode("parent"); setShowCreate(true); setCreateForm(EMPTY_FORM); }}
              className="flex items-center gap-2 bg-[#1A1A20] border border-[#2A2A35] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#2A2A35] transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Thêm danh mục cha
            </button>
            <button
              onClick={() => { setCreateMode("child"); setShowCreate(true); setCreateForm(EMPTY_FORM); }}
              className="flex items-center gap-2 bg-[#1CE479] text-black text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1CE479]/90 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Thêm danh mục con
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#1A1A20] border border-[#2A2A35] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A35]">
                <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF]">Tên danh mục</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF] hidden md:table-cell">Mã</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF] hidden lg:table-cell">Loại</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF] hidden lg:table-cell">Thứ tự</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF]">Hiển thị</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-[#9CA3AF]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#2A2A35] last:border-0 animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-40 bg-[#2A2A35] rounded" /></td>
                    <td className="py-4 px-4 hidden md:table-cell"><div className="h-4 w-24 bg-[#2A2A35] rounded" /></td>
                    <td className="py-4 px-4 hidden lg:table-cell"><div className="h-5 w-20 bg-[#2A2A35] rounded-full" /></td>
                    <td className="py-4 px-4 hidden lg:table-cell"><div className="h-4 w-6 bg-[#2A2A35] rounded" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-16 bg-[#2A2A35] rounded-full" /></td>
                    <td className="py-4 px-4" />
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-[#9CA3AF]">
                    Chưa có danh mục nào
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    depth={0}
                    allCategories={flatCategories}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                    onToggle={toggleActive}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create modal ───────────────────────────────────────────────── */}
      {showCreate && (
        <Modal
          title={createMode === "parent" ? "Thêm danh mục cha" : "Thêm danh mục con"}
          onClose={() => setShowCreate(false)}
        >
          <div className="space-y-4">
            {createMode === "child" && (
              <Field label="Thuộc danh mục cha *">
                <Select
                  value={createForm.parentId}
                  onChange={(e) => setCreateForm({ ...createForm, parentId: e.target.value })}
                >
                  <option value="">— Chọn danh mục cha —</option>
                  {categories.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
                {!createForm.parentId && (
                  <p className="text-xs text-amber-400 mt-1">Vui lòng chọn danh mục cha</p>
                )}
              </Field>
            )}
            <Field label="Tên danh mục *">
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="VD: Cho thuê nhà"
              />
            </Field>
            <Field label="Mã danh mục *">
              <Input
                value={createForm.code}
                onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                placeholder="VD: HOUSE_RENT"
              />
            </Field>
            <Field label="Loại chi tiết">
              <Select
                value={createForm.detailType}
                onChange={(e) => setCreateForm({ ...createForm, detailType: e.target.value })}
              >
                <option value="">— Không có —</option>
                {detailTypes.map((dt) => (
                  <option key={dt.id} value={dt.code}>{dt.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Thứ tự hiển thị">
              <Input
                type="number"
                value={createForm.sortOrder}
                onChange={(e) => setCreateForm({ ...createForm, sortOrder: Number(e.target.value) })}
                min={0}
              />
            </Field>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} className="flex-1 h-10 rounded-xl border border-[#2A2A35] text-sm text-[#9CA3AF] hover:text-white transition-colors">
                Huỷ
              </button>
              <button
                onClick={submitCreate}
                disabled={createLoading || !createForm.code || !createForm.name || (createMode === "child" && !createForm.parentId)}
                className="flex-1 h-10 rounded-xl bg-[#1CE479] text-black text-sm font-semibold hover:bg-[#1CE479]/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {createLoading ? "Đang tạo..." : <><Plus className="w-4 h-4" /> Tạo</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit modal ─────────────────────────────────────────────────── */}
      {editTarget && (
        <Modal title="Chỉnh sửa danh mục" onClose={() => setEditTarget(null)}>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <Field label="Mã danh mục">
              <Input
                value={editForm.code}
                onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                placeholder="VD: HOUSE_RENT"
              />
            </Field>
            <Field label="Tên danh mục">
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="VD: Cho thuê nhà"
              />
            </Field>
            <Field label="Danh mục cha">
              <Select
                value={editForm.removeParent ? "__NONE__" : (editForm.parentId || "")}
                onChange={(e) => {
                  if (e.target.value === "__NONE__") {
                    setEditForm({ ...editForm, parentId: "", removeParent: true });
                  } else {
                    setEditForm({ ...editForm, parentId: e.target.value, removeParent: false });
                  }
                }}
              >
                <option value="">— Giữ nguyên —</option>
                <option value="__NONE__">— Không có (danh mục gốc) —</option>
                {categories
                  .filter((p) => p.id !== editTarget.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
              </Select>
            </Field>
            <Field label="Danh mục con">
              {editTarget.children.length > 0 ? (
                <div className="space-y-1.5">
                  {editTarget.children.map((ch) => (
                    <div key={ch.id} className="flex items-center gap-2 px-3 py-2 bg-[#09090b] rounded-lg border border-[#2A2A35]">
                      <Tag className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                      <span className="text-sm text-white flex-1">{ch.name}</span>
                      <span className="text-xs font-mono text-[#9CA3AF]">{ch.code}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#9CA3AF] px-3 py-2 bg-[#09090b] rounded-lg border border-[#2A2A35]">
                  Không có danh mục con
                </p>
              )}
            </Field>
            <Field label="Loại chi tiết">
              <Select
                value={editForm.detailType}
                onChange={(e) => setEditForm({ ...editForm, detailType: e.target.value })}
              >
                <option value="">— Không có —</option>
                {detailTypes.map((dt) => (
                  <option key={dt.id} value={dt.code}>{dt.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Thứ tự hiển thị">
              <Input
                type="number"
                value={editForm.sortOrder}
                onChange={(e) => setEditForm({ ...editForm, sortOrder: Number(e.target.value) })}
                min={0}
              />
            </Field>
            <Field label="Trạng thái">
              <Select
                value={editForm.active ? "true" : "false"}
                onChange={(e) => setEditForm({ ...editForm, active: e.target.value === "true" })}
              >
                <option value="true">Hoạt động</option>
                <option value="false">Ẩn</option>
              </Select>
            </Field>
          </div>
          <div className="flex gap-3 pt-4 mt-2 border-t border-[#2A2A35]">
            <button onClick={() => setEditTarget(null)} className="flex-1 h-10 rounded-xl border border-[#2A2A35] text-sm text-[#9CA3AF] hover:text-white transition-colors">
              Huỷ
            </button>
            <button
              onClick={submitEdit}
              disabled={editLoading}
              className="flex-1 h-10 rounded-xl bg-[#1CE479] text-black text-sm font-semibold hover:bg-[#1CE479]/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {editLoading ? "Đang lưu..." : <><Check className="w-4 h-4" /> Lưu</>}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete confirm ─────────────────────────────────────────────── */}
      {deleteTarget && (
        <Modal title="Xoá danh mục" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">
                Xoá danh mục <span className="font-semibold text-white">{deleteTarget.name}</span>?
                {deleteTarget.children.length > 0 && (
                  <span className="block mt-1 text-red-400">⚠ Danh mục này có {deleteTarget.children.length} danh mục con.</span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 h-10 rounded-xl border border-[#2A2A35] text-sm text-[#9CA3AF] hover:text-white transition-colors">
                Huỷ
              </button>
              <button
                onClick={submitDelete}
                disabled={deleteLoading}
                className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-500/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {deleteLoading ? "Đang xoá..." : <><Trash2 className="w-4 h-4" /> Xoá</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === "success" ? "bg-[#1CE479] text-black" : "bg-red-500 text-white"}`}>
          {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </AdminShell>
  );
}
