"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, UserPlus, Pencil, Trash2, ShieldCheck,
  ChevronLeft, ChevronRight, X, Check, AlertTriangle,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AdminShell from "@/components/admin/AdminShell";

// ── Types ──────────────────────────────────────────────────────────────────

interface User {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  username: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  verified: boolean;
  createdAt: string;
}

interface PageData {
  content: User[];
  totalElements: number;
  totalPages: number;
  number: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const ROLE_STYLE: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  ADMIN:       "bg-blue-500/15   text-blue-400   border-blue-500/30",
  USER:        "bg-[#2A2A35]     text-[#9CA3AF]  border-[#2A2A35]",
};

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  USER: "User",
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Modal components ───────────────────────────────────────────────────────

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

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuth();
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state — create
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: "", email: "", phone: "", password: "", role: "USER" });
  const [createLoading, setCreateLoading] = useState(false);

  // Modal state — edit
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ fullName: "", email: "", phone: "" });
  const [editLoading, setEditLoading] = useState(false);

  const [roleTarget, setRoleTarget] = useState<User | null>(null);
  const [newRole, setNewRole] = useState("USER");
  const [roleLoading, setRoleLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ── Data fetch ─────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: "10", sort: "createdAt,desc" });
      if (keyword) params.set("keyword", keyword);
      const res = await api.get<{ data: PageData }>(`/users?${params}`);
      setData(res.data.data ?? null);
    } catch {
      showToast("Không thể tải danh sách người dùng", "error");
    } finally {
      setLoading(false);
    }
  }, [page, keyword]);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/dang-nhap"); return; }
    fetchUsers();
  }, [isAuthenticated, router, fetchUsers]);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Create ─────────────────────────────────────────────────────────────

  function openCreate() {
    setCreateForm({ fullName: "", email: "", phone: "", password: "", role: "USER" });
    setCreateOpen(true);
  }

  async function submitCreate() {
    setCreateLoading(true);
    try {
      await api.post("/users", createForm);
      showToast("Tạo người dùng thành công", "success");
      setCreateOpen(false);
      fetchUsers();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Tạo thất bại";
      showToast(msg, "error");
    } finally {
      setCreateLoading(false);
    }
  }

  // ── Edit ───────────────────────────────────────────────────────────────

  function openEdit(u: User) {
    setEditTarget(u);
    setEditForm({ fullName: u.fullName ?? "", email: u.email ?? "", phone: u.phone ?? "" });
  }

  async function submitEdit() {
    if (!editTarget) return;
    setEditLoading(true);
    try {
      await api.put(`/users/${editTarget.id}`, editForm);
      showToast("Cập nhật thành công", "success");
      setEditTarget(null);
      fetchUsers();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Cập nhật thất bại";
      showToast(msg, "error");
    } finally {
      setEditLoading(false);
    }
  }

  // ── Change role ────────────────────────────────────────────────────────

  function openRole(u: User) {
    setRoleTarget(u);
    setNewRole(u.role);
  }

  async function submitRole() {
    if (!roleTarget) return;
    setRoleLoading(true);
    try {
      await api.patch(`/users/${roleTarget.id}/role`, { role: newRole });
      showToast("Đổi quyền thành công", "success");
      setRoleTarget(null);
      fetchUsers();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Đổi quyền thất bại";
      showToast(msg, "error");
    } finally {
      setRoleLoading(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────

  async function submitDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      showToast("Đã xoá người dùng", "success");
      setDeleteTarget(null);
      fetchUsers();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Xoá thất bại";
      showToast(msg, "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Search ─────────────────────────────────────────────────────────────

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    setKeyword(inputVal);
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <AdminShell>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Người dùng</h1>
            <p className="text-sm text-[#9CA3AF] mt-0.5">
              {data ? `${data.totalElements} người dùng` : "Đang tải..."}
            </p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#1CE479] text-black text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1CE479]/90 transition-colors shrink-0">
            <UserPlus className="w-4 h-4" />
            Thêm người dùng
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 flex items-center gap-3 bg-[#1A1A20] border border-[#2A2A35] rounded-xl px-4 h-11">
            <Search className="w-4 h-4 text-[#9CA3AF] shrink-0" />
            <input
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Tìm theo tên, email, số điện thoại..."
              className="flex-1 bg-transparent text-sm text-white placeholder-[#9CA3AF] outline-none"
            />
            {inputVal && (
              <button type="button" onClick={() => { setInputVal(""); setKeyword(""); setPage(0); }}>
                <X className="w-4 h-4 text-[#9CA3AF] hover:text-white" />
              </button>
            )}
          </div>
          <button type="submit" className="px-5 h-11 bg-[#1CE479] text-black text-sm font-semibold rounded-xl hover:bg-[#1CE479]/90 transition-colors">
            Tìm
          </button>
        </form>

        {/* Table */}
        <div className="bg-[#1A1A20] border border-[#2A2A35] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A35]">
                <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF]">Người dùng</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF] hidden md:table-cell">Liên hệ</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF]">Quyền</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF] hidden lg:table-cell">Ngày tạo</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-[#9CA3AF]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#2A2A35] last:border-0 animate-pulse">
                    <td className="py-4 px-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-[#2A2A35]" /><div className="space-y-1.5"><div className="h-3 w-28 bg-[#2A2A35] rounded" /><div className="h-2.5 w-20 bg-[#2A2A35] rounded" /></div></div></td>
                    <td className="py-4 px-4 hidden md:table-cell"><div className="h-3 w-36 bg-[#2A2A35] rounded" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-16 bg-[#2A2A35] rounded-full" /></td>
                    <td className="py-4 px-4 hidden lg:table-cell"><div className="h-3 w-20 bg-[#2A2A35] rounded" /></td>
                    <td className="py-4 px-4" />
                  </tr>
                ))
              ) : data?.content.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center text-sm text-[#9CA3AF]">Không tìm thấy người dùng</td></tr>
              ) : (
                data?.content.map((u) => (
                  <tr key={u.id} className="border-b border-[#2A2A35] last:border-0 hover:bg-white/[0.02] transition-colors">
                    {/* Avatar + name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1CE479]/20 flex items-center justify-center shrink-0">
                          <span className="text-[#1CE479] text-xs font-bold">
                            {(u.fullName ?? u.email ?? "?").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{u.fullName || "—"}</p>
                          <p className="text-xs text-[#9CA3AF]">{u.username ? `@${u.username}` : "Người dùng"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <p className="text-sm text-white">{u.email || u.phone || "—"}</p>
                      {u.email && u.phone && <p className="text-xs text-[#9CA3AF]">{u.phone}</p>}
                    </td>

                    {/* Role badge */}
                    <td className="py-3.5 px-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${ROLE_STYLE[u.role]}`}>
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 hidden lg:table-cell">
                      <p className="text-sm text-[#9CA3AF]">{formatDate(u.createdAt)}</p>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          title="Chỉnh sửa"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#2A2A35] hover:text-white transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {isSuperAdmin && u.role !== "SUPER_ADMIN" && (
                          <button
                            onClick={() => openRole(u)}
                            title="Đổi quyền"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-blue-500/10 hover:text-blue-400 transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isSuperAdmin && u.role !== "SUPER_ADMIN" && (
                          <button
                            onClick={() => setDeleteTarget(u)}
                            title="Xoá"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-[#2A2A35]">
              <p className="text-xs text-[#9CA3AF]">
                Trang {data.number + 1} / {data.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={data.number === 0}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#2A2A35] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: data.totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
                      ${i === data.number ? "bg-[#1CE479] text-black" : "text-[#9CA3AF] hover:bg-[#2A2A35] hover:text-white"}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                  disabled={data.number === data.totalPages - 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#2A2A35] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Create modal ───────────────────────────────────────────────── */}
      {createOpen && (
        <Modal title="Thêm người dùng" onClose={() => setCreateOpen(false)}>
          <div className="space-y-4">
            <Field label="Họ và tên *">
              <Input value={createForm.fullName} onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })} placeholder="Nguyễn Văn A" />
            </Field>
            <Field label="Email">
              <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="email@example.com" />
            </Field>
            <Field label="Số điện thoại">
              <Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} placeholder="+84..." />
            </Field>
            <Field label="Mật khẩu *">
              <Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Tối thiểu 6 ký tự" />
            </Field>
            {isSuperAdmin && (
              <Field label="Quyền">
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full bg-[#09090b] border border-[#2A2A35] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#1CE479] transition-colors"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </Field>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setCreateOpen(false)} className="flex-1 h-10 rounded-xl border border-[#2A2A35] text-sm text-[#9CA3AF] hover:text-white transition-colors">
                Huỷ
              </button>
              <button onClick={submitCreate} disabled={createLoading}
                className="flex-1 h-10 rounded-xl bg-[#1CE479] text-black text-sm font-semibold hover:bg-[#1CE479]/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {createLoading ? "Đang tạo..." : <><UserPlus className="w-4 h-4" /> Tạo</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit modal ─────────────────────────────────────────────────── */}
      {editTarget && (
        <Modal title="Chỉnh sửa người dùng" onClose={() => setEditTarget(null)}>
          <div className="space-y-4">
            <Field label="Họ và tên">
              <Input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} placeholder="Họ và tên" />
            </Field>
            <Field label="Email">
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="email@example.com" />
            </Field>
            <Field label="Số điện thoại">
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+84..." />
            </Field>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditTarget(null)} className="flex-1 h-10 rounded-xl border border-[#2A2A35] text-sm text-[#9CA3AF] hover:text-white transition-colors">
                Huỷ
              </button>
              <button onClick={submitEdit} disabled={editLoading}
                className="flex-1 h-10 rounded-xl bg-[#1CE479] text-black text-sm font-semibold hover:bg-[#1CE479]/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {editLoading ? "Đang lưu..." : <><Check className="w-4 h-4" /> Lưu</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Change role modal ──────────────────────────────────────────── */}
      {roleTarget && (
        <Modal title="Đổi quyền người dùng" onClose={() => setRoleTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-[#9CA3AF]">
              Đổi quyền cho <span className="text-white font-medium">{roleTarget.fullName}</span>
            </p>
            <Field label="Quyền mới">
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full bg-[#09090b] border border-[#2A2A35] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-[#1CE479] transition-colors"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </Field>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setRoleTarget(null)} className="flex-1 h-10 rounded-xl border border-[#2A2A35] text-sm text-[#9CA3AF] hover:text-white transition-colors">
                Huỷ
              </button>
              <button onClick={submitRole} disabled={roleLoading}
                className="flex-1 h-10 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-500/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {roleLoading ? "Đang lưu..." : <><ShieldCheck className="w-4 h-4" /> Xác nhận</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete confirm modal ───────────────────────────────────────── */}
      {deleteTarget && (
        <Modal title="Xoá người dùng" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">
                Bạn có chắc muốn xoá người dùng <span className="font-semibold text-white">{deleteTarget.fullName}</span>? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 h-10 rounded-xl border border-[#2A2A35] text-sm text-[#9CA3AF] hover:text-white transition-colors">
                Huỷ
              </button>
              <button onClick={submitDelete} disabled={deleteLoading}
                className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-500/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {deleteLoading ? "Đang xoá..." : <><Trash2 className="w-4 h-4" /> Xoá</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Toast notification ─────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
          ${toast.type === "success" ? "bg-[#1CE479] text-black" : "bg-red-500 text-white"}`}>
          {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </AdminShell>
  );
}
