import { PriceUnit } from "@/types";

export function formatPrice(price: number, unit: PriceUnit): string {
  const fmt = new Intl.NumberFormat("vi-VN").format(price);
  if (unit === "MONTHLY") return `${fmt} NT$/tháng`;
  if (unit === "NEGOTIABLE") return "Thỏa thuận";
  return `${fmt} NT$`;
}

const TZ = "Asia/Taipei";

/** Parse chuỗi từ server (không có tz info) thành Date theo Asia/Taipei */
function parseDate(dateStr: string): Date {
  // Nếu server trả về ISO có offset (ví dụ +08:00) thì Date parse đúng luôn.
  // Nếu không có offset, thêm +08:00 để browser không tự interpret sai.
  if (/[Zz]|[+-]\d{2}:\d{2}$/.test(dateStr)) return new Date(dateStr);
  return new Date(dateStr + "+08:00");
}

export function timeAgo(dateStr: string): string {
  const date = parseDate(dateStr);
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMins < 1)  return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN", { timeZone: TZ });
}

export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  return parseDate(dateStr).toLocaleString("vi-VN", { timeZone: TZ, ...opts });
}

export function statusLabel(status: string): string {
  return ({ ACTIVE: "Đang đăng", INACTIVE: "Đã ẩn", SOLD: "Đã bán", RENTED: "Đã cho thuê" }[status] ?? status);
}

export function statusColor(status: string): string {
  return ({
    ACTIVE: "bg-[#1CE479]/15 border-[#1CE479]/30 text-[#1CE479]",
    INACTIVE: "bg-[#27272a] border-[#3f3f46] text-[#71717a]",
    SOLD: "bg-red-500/15 border-red-500/30 text-red-400",
    RENTED: "bg-orange-500/15 border-orange-500/30 text-orange-400",
  }[status] ?? "bg-[#27272a] border-[#3f3f46] text-[#71717a]");
}
