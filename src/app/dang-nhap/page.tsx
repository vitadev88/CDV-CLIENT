"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AuthResponse, ApiResponse } from "@/types";

const schema = z.object({
  identifier: z.string().min(1, "Vui lòng nhập email, số điện thoại hoặc tên đăng nhập"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      const res = await api.post<ApiResponse<AuthResponse>>("/auth/login", data);
      if (res.data.success && res.data.data) {
        login(res.data.data);
        router.push("/");
      } else {
        setServerError(res.data.message ?? "Đăng nhập thất bại");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: ApiResponse<unknown> } };
      setServerError(axiosErr.response?.data?.message ?? "Đăng nhập thất bại");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#1c1c1e] rounded-2xl border border-[#2e2e30] p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Đăng nhập</h1>
          <p className="text-[#9ca3af] text-sm">
            Chưa có tài khoản?{" "}
            <Link href="/dang-ky" className="text-green-400 hover:underline">
              Đăng ký ngay
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
            <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">
              Email / Số điện thoại / Tên đăng nhập
            </label>
            <input
              {...register("identifier")}
              className="form-input"
              placeholder="Nhập email, SĐT hoặc username"
            />
            {errors.identifier && (
              <p className="text-red-400 text-xs mt-1">{errors.identifier.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Mật khẩu</label>
            <input
              {...register("password")}
              type="password"
              className="form-input"
              placeholder="Nhập mật khẩu"
            />
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-500 hover:bg-green-400 text-black rounded-lg py-2.5 font-bold text-sm transition disabled:opacity-60"
          >
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
