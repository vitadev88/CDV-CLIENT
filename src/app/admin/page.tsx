"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Users, Star, Tag, TrendingUp, ChevronRight } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AdminShell from "@/components/admin/AdminShell";

// ── Types ──────────────────────────────────────────────────────────────────

interface MonthStat { label: string; count: number; }
interface CategoryStat { name: string; count: number; }

interface DashboardStats {
  totalListings: number;
  totalUsers: number;
  featuredListings: number;
  totalCategories: number;
  newListingsThisMonth: number;
  newUsersThisMonth: number;
  listingsByMonth: MonthStat[];
  usersByMonth: MonthStat[];
  topCategories: CategoryStat[];
}

const BAR_COLORS = ["#1CE479", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4"];

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function StatCard({ label, value, sub, icon: Icon, color, loading }: {
  label: string; value: string; sub: string;
  icon: React.ElementType; color: string; loading: boolean;
}) {
  return (
    <div className="bg-[#1A1A20] border border-[#2A2A35] rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#9CA3AF]">{label}</span>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}22` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-7 w-24 bg-[#2A2A35] rounded" />
          <div className="h-3 w-32 bg-[#2A2A35] rounded" />
        </div>
      ) : (
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400">
            <TrendingUp className="w-3 h-3" /><span>{sub}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/dang-nhap"); return; }
    api.get<{ data: DashboardStats }>("/admin/stats")
      .then((r) => setStats(r.data.data))
      .catch((err: unknown) => console.error("Failed to load dashboard stats", err))
      .finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  const listingsByMonth = stats?.listingsByMonth ?? Array.from({ length: 12 }, (_, i) => ({ label: `T${i + 1}`, count: 0 }));
  const usersByMonth    = stats?.usersByMonth    ?? Array.from({ length: 12 }, (_, i) => ({ label: `T${i + 1}`, count: 0 }));
  const topCategories   = stats?.topCategories   ?? [];
  const maxCatCount     = Math.max(...topCategories.map((c) => c.count), 1);

  // Index of current month bar to highlight
  const currentMonthIdx = new Date().getMonth(); // 0-based, last item in the 12-month window

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-[#9CA3AF]">Tổng quan hệ thống CongDongViet</p>
        </div>

        {/* Stat cards + bar chart */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 grid grid-cols-2 gap-4">
            <StatCard label="Tổng tin đăng" value={fmt(stats?.totalListings ?? 0)}
              sub={`+${stats?.newListingsThisMonth ?? 0} tháng này`}
              icon={FileText} color="#1CE479" loading={loading} />
            <StatCard label="Người dùng" value={fmt(stats?.totalUsers ?? 0)}
              sub={`+${stats?.newUsersThisMonth ?? 0} tháng này`}
              icon={Users} color="#3B82F6" loading={loading} />
            <StatCard label="Tin nổi bật" value={fmt(stats?.featuredListings ?? 0)}
              sub="Đang hiển thị"
              icon={Star} color="#F59E0B" loading={loading} />
            <StatCard label="Danh mục" value={fmt(stats?.totalCategories ?? 0)}
              sub="Đang hoạt động"
              icon={Tag} color="#8B5CF6" loading={loading} />
          </div>

          {/* Bar chart — listings by month */}
          <div className="bg-[#1A1A20] border border-[#2A2A35] rounded-2xl p-5">
            <p className="text-sm font-semibold text-white mb-1">Tin đăng theo tháng</p>
            <p className="text-xs text-[#9CA3AF] mb-4">12 tháng gần nhất</p>
            {loading ? (
              <div className="h-[140px] flex items-end gap-1 animate-pulse">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex-1 bg-[#2A2A35] rounded-sm" style={{ height: `${30 + Math.random() * 70}%` }} />
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={listingsByMonth} barSize={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1A1A20", border: "1px solid #2A2A35", borderRadius: 8 }}
                    labelStyle={{ color: "#fff" }}
                    itemStyle={{ color: "#1CE479" }}
                    formatter={(v: unknown) => [`${v} tin`, "Số tin"]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {listingsByMonth.map((_, i) => (
                      <Cell key={i} fill={i === currentMonthIdx ? "#1CE479" : "#2A2A35"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top categories table + area chart */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

          {/* Top categories */}
          <div className="xl:col-span-3 bg-[#1A1A20] border border-[#2A2A35] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A35]">
              <div>
                <p className="text-sm font-semibold text-white">Top danh mục</p>
                <p className="text-xs text-[#9CA3AF]">Theo số tin đăng</p>
              </div>
              <Link href="/admin/categories" className="text-xs text-[#1CE479] hover:underline flex items-center gap-1">
                Xem tất cả <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A2A35]">
                  <th className="py-2 px-4 text-left text-xs text-[#9CA3AF] font-medium">#</th>
                  <th className="py-2 px-4 text-left text-xs text-[#9CA3AF] font-medium">Danh mục</th>
                  <th className="py-2 px-4 text-left text-xs text-[#9CA3AF] font-medium">Tỉ lệ</th>
                  <th className="py-2 px-4 text-right text-xs text-[#9CA3AF] font-medium">Tin</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#2A2A35] last:border-0 animate-pulse">
                      <td className="py-3 px-4"><div className="h-4 w-4 bg-[#2A2A35] rounded" /></td>
                      <td className="py-3 px-4"><div className="h-4 w-32 bg-[#2A2A35] rounded" /></td>
                      <td className="py-3 px-4"><div className="h-2 w-full bg-[#2A2A35] rounded-full" /></td>
                      <td className="py-3 px-4"><div className="h-5 w-14 bg-[#2A2A35] rounded-full ml-auto" /></td>
                    </tr>
                  ))
                ) : topCategories.length === 0 ? (
                  <tr><td colSpan={4} className="py-10 text-center text-sm text-[#9CA3AF]">Chưa có dữ liệu</td></tr>
                ) : (
                  topCategories.map((cat, i) => {
                    const pct = Math.round((cat.count / maxCatCount) * 100);
                    const color = BAR_COLORS[i % BAR_COLORS.length];
                    return (
                      <tr key={cat.name} className="border-b border-[#2A2A35] last:border-0">
                        <td className="py-3 px-4 text-[#9CA3AF] text-sm">{String(i + 1).padStart(2, "0")}</td>
                        <td className="py-3 px-4 text-white text-sm font-medium">{cat.name}</td>
                        <td className="py-3 px-4 w-32">
                          <div className="h-1.5 bg-[#2A2A35] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-xs px-2 py-0.5 rounded border font-medium"
                            style={{ color, borderColor: `${color}44`, backgroundColor: `${color}11` }}>
                            {cat.count} tin
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Area chart — new users by month */}
          <div className="xl:col-span-2 bg-[#1A1A20] border border-[#2A2A35] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-white">Người dùng mới</p>
              <span className="flex items-center gap-1 text-xs text-[#1CE479]">
                <span className="w-2 h-2 rounded-full bg-[#1CE479] inline-block" /> Mới
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF] mb-4">12 tháng gần nhất</p>
            {loading ? (
              <div className="h-[180px] bg-[#2A2A35]/30 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={usersByMonth}>
                  <defs>
                    <linearGradient id="uGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1CE479" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1CE479" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1A1A20", border: "1px solid #2A2A35", borderRadius: 8 }}
                    labelStyle={{ color: "#fff" }}
                    itemStyle={{ color: "#1CE479" }}
                    formatter={(v: unknown) => [`${v} người`, "Đăng ký"]}
                  />
                  <Area type="monotone" dataKey="count" stroke="#1CE479" strokeWidth={2}
                    fill="url(#uGrad)" dot={false} activeDot={{ r: 4, fill: "#1CE479" }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
            <div className="flex justify-between mt-3 pt-3 border-t border-[#2A2A35]">
              <div>
                <p className="text-xs text-[#9CA3AF]">Tháng trước</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {loading ? "—" : (usersByMonth[usersByMonth.length - 2]?.count ?? 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#9CA3AF]">Tháng này</p>
                <p className="text-sm font-bold text-[#1CE479] mt-0.5">
                  {loading ? "—" : (stats?.newUsersThisMonth ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
