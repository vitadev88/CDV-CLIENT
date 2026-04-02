"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Check, AlertTriangle, Heart, ToggleLeft, ToggleRight } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AdminShell from "@/components/admin/AdminShell";

interface DonationAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrImageUrl: string | null;
  active: boolean;
  sortOrder: number;
}

const EMPTY_FORM = { bankName: "", accountNumber: "", accountHolder: "", qrImageUrl: "", active: true, sortOrder: 0 };

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1A1A20] border border-[#2A2A35] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A35]">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-white transition-colors"><X className="w-5 h-5" /></button>
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
    <input {...props} className="w-full bg-[#09090b] border border-[#2A2A35] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#9CA3AF] outline-none focus:border-[#1CE479] transition-colors" />
  );
}

export default function DonationPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [accounts, setAccounts] = useState<DonationAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DonationAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DonationAccount | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: DonationAccount[] }>("/donation-accounts");
      setAccounts(res.data.data ?? []);
    } catch {
      showToast("Không thể tải dữ liệu", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/dang-nhap"); return; }
    fetchAccounts();
  }, [isAuthenticated, router, fetchAccounts]);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function openCreate() { setForm(EMPTY_FORM); setCreateOpen(true); }

  function openEdit(a: DonationAccount) {
    setForm({ bankName: a.bankName, accountNumber: a.accountNumber, accountHolder: a.accountHolder, qrImageUrl: a.qrImageUrl ?? "", active: a.active, sortOrder: a.sortOrder });
    setEditTarget(a);
  }

  async function submitSave() {
    setSaving(true);
    try {
      if (editTarget) {
        await api.put(`/donation-accounts/${editTarget.id}`, form);
        showToast("Cập nhật thành công", "success");
        setEditTarget(null);
      } else {
        await api.post("/donation-accounts", form);
        showToast("Thêm thành công", "success");
        setCreateOpen(false);
      }
      fetchAccounts();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Thao tác thất bại";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  async function submitDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/donation-accounts/${deleteTarget.id}`);
      showToast("Đã xoá", "success");
      setDeleteTarget(null);
      fetchAccounts();
    } catch {
      showToast("Xoá thất bại", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function toggleActive(a: DonationAccount) {
    try {
      await api.put(`/donation-accounts/${a.id}`, { ...a, active: !a.active });
      fetchAccounts();
    } catch {
      showToast("Thao tác thất bại", "error");
    }
  }

  const FormFields = (
    <div className="space-y-4">
      <Field label="Tên ngân hàng *">
        <Input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="VD: Vietcombank, BIDV, CTB..." />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Số tài khoản *">
          <Input value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="1234567890" />
        </Field>
        <Field label="Thứ tự hiển thị">
          <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
        </Field>
      </div>
      <Field label="Chủ tài khoản *">
        <Input value={form.accountHolder} onChange={(e) => setForm({ ...form, accountHolder: e.target.value })} placeholder="NGUYEN VAN A" />
      </Field>
      <Field label="URL ảnh QR (tuỳ chọn)">
        <Input value={form.qrImageUrl} onChange={(e) => setForm({ ...form, qrImageUrl: e.target.value })} placeholder="https://..." />
      </Field>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setForm({ ...form, active: !form.active })} className={`transition-colors ${form.active ? "text-[#1CE479]" : "text-[#9CA3AF]"}`}>
          {form.active ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
        </button>
        <span className="text-sm text-[#9CA3AF]">{form.active ? "Đang hiển thị" : "Đã ẩn"}</span>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={() => { setCreateOpen(false); setEditTarget(null); }} className="flex-1 h-10 rounded-xl border border-[#2A2A35] text-sm text-[#9CA3AF] hover:text-white transition-colors">Huỷ</button>
        <button onClick={submitSave} disabled={saving || !form.bankName || !form.accountNumber || !form.accountHolder}
          className="flex-1 h-10 rounded-xl bg-[#1CE479] text-black text-sm font-semibold hover:bg-[#1CE479]/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          {saving ? "Đang lưu..." : <><Check className="w-4 h-4" /> Lưu</>}
        </button>
      </div>
    </div>
  );

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Tài khoản Donate</h1>
            <p className="text-sm text-[#9CA3AF] mt-0.5">Quản lý thông tin nhận donate hiển thị trên banner</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-[#1CE479] text-black text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1CE479]/90 transition-colors">
            <Plus className="w-4 h-4" /> Thêm tài khoản
          </button>
        </div>

        <div className="bg-[#1A1A20] border border-[#2A2A35] rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A35]">
                <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF]">Ngân hàng</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF]">Số tài khoản</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[#9CA3AF] hidden md:table-cell">Chủ tài khoản</th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-[#9CA3AF]">Trạng thái</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-[#9CA3AF]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#2A2A35] last:border-0 animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-28 bg-[#2A2A35] rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-32 bg-[#2A2A35] rounded" /></td>
                    <td className="py-4 px-4 hidden md:table-cell"><div className="h-4 w-28 bg-[#2A2A35] rounded" /></td>
                    <td className="py-4 px-4 hidden lg:table-cell"><div className="h-4 w-40 bg-[#2A2A35] rounded" /></td>
                    <td className="py-4 px-4" /><td className="py-4 px-4" />
                  </tr>
                ))
              ) : accounts.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-sm text-[#9CA3AF]">Chưa có tài khoản nào</td></tr>
              ) : (
                accounts.map((a) => (
                  <tr key={a.id} className="border-b border-[#2A2A35] last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#1CE479]/10 flex items-center justify-center shrink-0">
                          <Heart className="w-4 h-4 text-[#1CE479]" />
                        </div>
                        <span className="text-sm font-medium text-white">{a.bankName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-sm text-white">{a.accountNumber}</span>
                    </td>
                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <span className="text-sm text-[#9CA3AF]">{a.accountHolder}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button onClick={() => toggleActive(a)} className={`transition-colors ${a.active ? "text-[#1CE479]" : "text-[#9CA3AF]"}`}>
                        {a.active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(a)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#2A2A35] hover:text-white transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(a)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-red-500/10 hover:text-red-400 transition-colors">
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

      {createOpen && <Modal title="Thêm tài khoản donate" onClose={() => setCreateOpen(false)}>{FormFields}</Modal>}
      {editTarget && <Modal title="Cập nhật tài khoản donate" onClose={() => setEditTarget(null)}>{FormFields}</Modal>}

      {deleteTarget && (
        <Modal title="Xoá tài khoản" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">Xoá tài khoản <span className="font-semibold text-white">{deleteTarget.bankName} — {deleteTarget.accountNumber}</span>?</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 h-10 rounded-xl border border-[#2A2A35] text-sm text-[#9CA3AF] hover:text-white transition-colors">Huỷ</button>
              <button onClick={submitDelete} disabled={deleteLoading} className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-500/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {deleteLoading ? "Đang xoá..." : <><Trash2 className="w-4 h-4" /> Xoá</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === "success" ? "bg-[#1CE479] text-black" : "bg-red-500 text-white"}`}>
          {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </AdminShell>
  );
}
