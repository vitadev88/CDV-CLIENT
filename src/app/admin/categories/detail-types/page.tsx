"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Check, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AdminShell from "@/components/admin/AdminShell";

// ── Types ──────────────────────────────────────────────────────────────────

interface DetailType {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
}

interface DetailTypeForm {
  code: string;
  name: string;
  sortOrder: number;
}

const EMPTY_FORM: DetailTypeForm = { code: "", name: "", sortOrder: 0 };

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

// ── Main page ───────────────────────────────────────────────────────────────

export default function DetailTypesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [types, setTypes] = useState<DetailType[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<DetailTypeForm>(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);

  const [editTarget, setEditTarget] = useState<DetailType | null>(null);
  const [editForm, setEditForm] = useState<DetailTypeForm>(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DetailType | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: DetailType[] }>("/category-detail-types");
      setTypes(res.data.data ?? []);
    } catch {
      showToast("Không thể tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/dang-nhap"); return; }
    fetchTypes();
  }, [isAuthenticated, router, fetchTypes]);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function submitCreate() {
    if (!createForm.code || !createForm.name) return;
    setCreateLoading(true);
    try {
      await api.post("/category-detail-types", createForm);
      showToast("Tạo loại thành công", "success");
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      fetchTypes();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Tạo thất bại";
      showToast(msg, "error");
    } finally {
      setCreateLoading(false);
    }
  }

  function openEdit(t: DetailType) {
    setEditTarget(t);
    setEditForm({ code: t.code, name: t.name, sortOrder: t.sortOrder });
  }

  async function submitEdit() {
    if (!editTarget) return;
    setEditLoading(true);
    try {
      await api.put(`/category-detail-types/${editTarget.id}`, editForm);
      showToast("Cập nhật thành công", "success");
      setEditTarget(null);
      fetchTypes();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Cập nhật thất bại";
      showToast(msg, "error");
    } finally {
      setEditLoading(false);
    }
  }

  async function submitDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/category-detail-types/${deleteTarget.id}`);
      showToast("Đã xoá loại", "success");
      setDeleteTarget(null);
      fetchTypes();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Xoá thất bại";
      showToast(msg, "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <AdminShell>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Loại danh mục</h1>
            <p className="text-sm text-[#9CA3AF] mt-0.5">
              {loading ? "Đang tải..." : `${types.length} loại`}
            </p>
          </div>
          <button
            onClick={() => { setShowCreate(true); setCreateForm(EMPTY_FORM); }}
            className="flex items-center gap-2 bg-[#1CE479] text-black text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1CE479]/90 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Thêm loại
          </button>
        </div>

        {/* Table */}
        <div className="bg-[#1A1A20] border border-[#2A2A35] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A35]">
                <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF]">Tên loại</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF] hidden md:table-cell">Mã</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF] hidden lg:table-cell">Thứ tự</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-[#9CA3AF]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#2A2A35] last:border-0 animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-40 bg-[#2A2A35] rounded" /></td>
                    <td className="py-4 px-4 hidden md:table-cell"><div className="h-4 w-24 bg-[#2A2A35] rounded" /></td>
                    <td className="py-4 px-4 hidden lg:table-cell"><div className="h-4 w-6 bg-[#2A2A35] rounded" /></td>
                    <td className="py-4 px-4" />
                  </tr>
                ))
              ) : types.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-sm text-[#9CA3AF]">
                    Chưa có loại nào
                  </td>
                </tr>
              ) : (
                types.map((t) => (
                  <tr key={t.id} className="border-b border-[#2A2A35] last:border-0 hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3.5 px-4">
                      <span className="text-sm font-medium text-white">{t.name}</span>
                    </td>
                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <span className="text-xs font-mono text-[#9CA3AF] bg-[#09090b] px-2 py-1 rounded-lg border border-[#2A2A35]">
                        {t.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 hidden lg:table-cell">
                      <span className="text-sm text-[#9CA3AF]">{t.sortOrder}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(t)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#2A2A35] hover:text-white transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(t)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create modal ───────────────────────────────────────────────── */}
      {showCreate && (
        <Modal title="Thêm loại danh mục" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <Field label="Tên loại *">
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="VD: Bất động sản"
              />
            </Field>
            <Field label="Mã loại *">
              <Input
                value={createForm.code}
                onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                placeholder="VD: REAL_ESTATE"
              />
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
                disabled={createLoading || !createForm.code || !createForm.name}
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
        <Modal title="Chỉnh sửa loại danh mục" onClose={() => setEditTarget(null)}>
          <div className="space-y-4">
            <Field label="Tên loại">
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </Field>
            <Field label="Mã loại">
              <Input
                value={editForm.code}
                onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
              />
            </Field>
            <Field label="Thứ tự hiển thị">
              <Input
                type="number"
                value={editForm.sortOrder}
                onChange={(e) => setEditForm({ ...editForm, sortOrder: Number(e.target.value) })}
                min={0}
              />
            </Field>
          </div>
          <div className="flex gap-3 pt-4 mt-4 border-t border-[#2A2A35]">
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
        <Modal title="Xoá loại danh mục" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">
                Xoá loại <span className="font-semibold text-white">{deleteTarget.name}</span>?
                Các danh mục đang dùng loại này sẽ bị mất liên kết.
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
