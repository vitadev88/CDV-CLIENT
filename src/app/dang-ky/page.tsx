"use client";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AuthResponse, ApiResponse } from "@/types";

const DIAL_CODES = [
  { code: "+886", flag: "🇹🇼", label: "Đài Loan (+886)" },
  { code: "+84",  flag: "🇻🇳", label: "Việt Nam (+84)" },
];

const schema = z
  .object({
    username: z.string().min(3, "Username ít nhất 3 ký tự").max(100),
    phone: z
      .string()
      .length(9, "Số điện thoại phải đúng 9 số")
      .regex(/^[1-9]\d*$/, "Không nhập số 0 đầu tiên"),
    password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [dialCode, setDialCode] = useState("+886");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Username availability check
  const [usernameVal, setUsernameVal] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const usernameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (usernameDebounce.current) clearTimeout(usernameDebounce.current);
    if (usernameVal.length < 3) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    usernameDebounce.current = setTimeout(async () => {
      try {
        const res = await api.get<{ data: { available: boolean } }>(`/auth/check-username?username=${encodeURIComponent(usernameVal)}`);
        setUsernameStatus(res.data.data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 500);
    return () => { if (usernameDebounce.current) clearTimeout(usernameDebounce.current); };
  }, [usernameVal]);

  // Phone availability check
  const [phoneVal, setPhoneVal] = useState("");
  const [phoneStatus, setPhoneStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const phoneDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phoneDebounce.current) clearTimeout(phoneDebounce.current);
    if (phoneVal.length !== 9 || phoneVal.startsWith("0")) { setPhoneStatus("idle"); return; }
    setPhoneStatus("checking");
    phoneDebounce.current = setTimeout(async () => {
      try {
        const fullPhone = `${dialCode}${phoneVal}`;
        const res = await api.get<{ data: { available: boolean } }>(`/auth/check-phone?phone=${encodeURIComponent(fullPhone)}`);
        setPhoneStatus(res.data.data.available ? "available" : "taken");
      } catch {
        setPhoneStatus("idle");
      }
    }, 500);
    return () => { if (phoneDebounce.current) clearTimeout(phoneDebounce.current); };
  }, [phoneVal, dialCode]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: "onChange" });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    const payload = {
      username: data.username,
      phone: `${dialCode}${data.phone}`,
      password: data.password,
    };
    try {
      const res = await api.post<ApiResponse<AuthResponse>>("/auth/register", payload);
      if (res.data.success && res.data.data) {
        login(res.data.data);
        router.push("/");
      } else {
        setServerError(res.data.message ?? "Đăng ký thất bại");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: ApiResponse<unknown> } };
      const errData = axiosErr.response?.data;
      if (errData && typeof errData.data === "object") {
        setServerError(Object.values(errData.data as Record<string, string>).join(", "));
      } else {
        setServerError(errData?.message ?? "Đăng ký thất bại");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-[#1c1c1e] rounded-2xl border border-[#2e2e30] p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Đăng ký tài khoản</h1>
          <p className="text-[#9ca3af] text-sm">
            Đã có tài khoản?{" "}
            <Link href="/dang-nhap" className="text-green-400 hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>

        {serverError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Tên đăng nhập</label>
            <div className="relative">
              <input
                {...register("username", { onChange: (e) => setUsernameVal(e.target.value) })}
                className="form-input pr-10"
                placeholder="ten_nguoi_dung"
                autoComplete="username"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && <Loader2 className="w-4 h-4 text-[#9ca3af] animate-spin" />}
                {usernameStatus === "available" && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                {usernameStatus === "taken" && <XCircle className="w-4 h-4 text-red-400" />}
              </div>
            </div>
            {errors.username && (
              <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>
            )}
            {usernameStatus === "available" && <p className="text-green-400 text-xs mt-1">Tên đăng nhập có thể sử dụng</p>}
            {usernameStatus === "taken" && <p className="text-red-400 text-xs mt-1">Tên đăng nhập đã được sử dụng</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Số điện thoại</label>
            <div className="flex gap-2">
              <select
                value={dialCode}
                onChange={(e) => setDialCode(e.target.value)}
                className="bg-[#09090b] border border-[#2e2e30] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-green-500 transition-colors shrink-0"
              >
                {DIAL_CODES.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.flag} {d.code}
                  </option>
                ))}
              </select>
              <div className="relative flex-1">
                <input
                  {...register("phone", { onChange: (e) => setPhoneVal(e.target.value) })}
                  type="tel"
                  className="form-input w-full pr-10"
                  placeholder="912345678"
                  autoComplete="tel"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {phoneStatus === "checking" && <Loader2 className="w-4 h-4 text-[#9ca3af] animate-spin" />}
                  {phoneStatus === "available" && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                  {phoneStatus === "taken" && <XCircle className="w-4 h-4 text-red-400" />}
                </div>
              </div>
            </div>
            <p className="text-xs text-[#4b5563] mt-1">Không nhập số 0 đầu tiên (VD: 912345678)</p>
            {errors.phone && phoneStatus === "idle" && phoneVal.length > 0 && (
              <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>
            )}
            {phoneStatus === "available" && <p className="text-green-400 text-xs mt-1">Số điện thoại có thể sử dụng</p>}
            {phoneStatus === "taken" && <p className="text-red-400 text-xs mt-1">Số điện thoại đã được đăng ký</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Mật khẩu</label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                className="form-input pr-10"
                placeholder="Ít nhất 6 ký tự"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Xác nhận mật khẩu</label>
            <div className="relative">
              <input
                {...register("confirmPassword")}
                type={showConfirm ? "text" : "password"}
                className="form-input pr-10"
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-white transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-500 hover:bg-green-400 text-black rounded-lg py-2.5 font-bold text-sm transition disabled:opacity-60"
          >
            {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>
      </div>
    </div>
  );
}
