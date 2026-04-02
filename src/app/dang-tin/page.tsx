"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Category, ApiResponse, Listing } from "@/types";
import { ImagePlus, X, Loader2, ChevronRight } from "lucide-react";

const schema = z.object({
  categoryCode: z.string().min(1, "Vui lòng chọn danh mục"),
  title: z.string().min(5, "Tiêu đề ít nhất 5 ký tự"),
  description: z.string().optional(),
  price: z.number().min(1, "Vui lòng nhập giá"),
  priceUnit: z.enum(["MONTHLY", "TOTAL", "NEGOTIABLE"]),
  city: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  areaSqm: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  floors: z.number().optional(),
  isFurnished: z.boolean().optional(),
  availableFrom: z.string().optional(),
  deposit: z.number().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  manufactureYear: z.number().optional(),
  mileageKm: z.number().optional(),
  fuelType: z.enum(["GASOLINE", "DIESEL", "ELECTRIC", "HYBRID"]).optional(),
  transmission: z.enum(["MANUAL", "AUTOMATIC"]).optional(),
  color: z.string().optional(),
  // JOB
  jobType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE"]).optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  experienceYears: z.number().optional(),
  contactName: z.string().optional(),
  // SERVICE
  contactPhone: z.string().optional(),
  // GOODS
  goodsCondition: z.enum(["NEW", "LIKE_NEW", "GOOD", "FAIR"]).optional(),
});

type FormData = z.infer<typeof schema>;

export default function CreateListingPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [selectedParentCode, setSelectedParentCode] = useState("");
  const [serverError, setServerError] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageFiles(files: FileList) {
    if (!files.length) return;
    const remaining = 10 - imageUrls.length;
    if (remaining <= 0) return;
    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const form = new FormData();
      toUpload.forEach((f) => form.append("files", f));
      form.append("folder", "listings");
      const res = await api.post<{ data: { urls: string[] } }>("/uploads", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImageUrls((prev) => [...prev, ...(res.data.data?.urls ?? [])]);
    } catch {
      setServerError("Upload ảnh thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(idx: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priceUnit: "TOTAL" },
  });

  const selectedCategory = watch("categoryCode");

  // Tìm leaf category đang chọn để biết detailType
  const allLeaves = categoryTree.flatMap((p) =>
    p.children && p.children.length > 0 ? p.children : [p]
  );
  const selectedCat = allLeaves.find((c) => c.code === selectedCategory);
  const isRealEstate = selectedCat?.detailType === "REAL_ESTATE";
  const isCar = selectedCat?.detailType === "CAR";
  const isJob = selectedCat?.detailType === "JOB";
  const isService = selectedCat?.detailType === "SERVICE";
  const isGoods = selectedCat?.detailType === "GOODS";
  const isRental = ["HOUSE_RENT", "ROOM_RENT", "APARTMENT_RENT"].includes(selectedCategory);

  // Danh mục con của parent đang chọn
  const selectedParent = categoryTree.find((p) => p.code === selectedParentCode);
  const childCategories: Category[] =
    selectedParent?.children && selectedParent.children.length > 0
      ? selectedParent.children.filter((c) => c.active)
      : [];

  function handleParentSelect(code: string) {
    setSelectedParentCode(code);
    setValue("categoryCode", ""); // reset con khi đổi cha
    // Nếu parent không có con thì chọn luôn
    const parent = categoryTree.find((p) => p.code === code);
    if (!parent?.children || parent.children.length === 0) {
      setValue("categoryCode", code);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) { router.push("/dang-nhap"); return; }
    api.get("/categories").then((res) => {
      setCategoryTree(res.data.data ?? []);
    });
  }, [isAuthenticated, router]);

  const onSubmit = async (data: FormData) => {
    setServerError("");
    const payload: Record<string, unknown> = {
      categoryCode: data.categoryCode,
      title: data.title,
      description: data.description,
      price: data.price,
      priceUnit: data.priceUnit,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    };
    if (isRealEstate) {
      payload.realEstateDetails = {
        city: data.city, district: data.district, address: data.address,
        areaSqm: data.areaSqm, bedrooms: data.bedrooms, bathrooms: data.bathrooms,
        floors: data.floors, isFurnished: data.isFurnished,
        availableFrom: data.availableFrom, deposit: data.deposit,
      };
    }
    if (isCar) {
      payload.carDetails = {
        brand: data.brand, model: data.model, manufactureYear: data.manufactureYear,
        mileageKm: data.mileageKm, fuelType: data.fuelType,
        transmission: data.transmission, color: data.color,
      };
    }
    if (isJob) {
      payload.jobDetails = {
        jobType: data.jobType, city: data.city, district: data.district,
        salaryMin: data.salaryMin, salaryMax: data.salaryMax,
        experienceYears: data.experienceYears, contactName: data.contactName,
      };
    }
    if (isService) {
      payload.serviceDetails = {
        city: data.city, district: data.district,
        contactName: data.contactName, contactPhone: data.contactPhone,
      };
    }
    if (isGoods) {
      payload.goodsDetails = {
        condition: data.goodsCondition, brand: data.brand, city: data.city,
      };
    }
    try {
      const res = await api.post<ApiResponse<Listing>>("/listings", payload);
      if (res.data.success && res.data.data) {
        router.push(`/tin-dang/${res.data.data.id}`);
      } else {
        setServerError(res.data.message ?? "Đăng tin thất bại");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: ApiResponse<unknown> } };
      const errData = axiosErr.response?.data;
      if (errData && typeof errData.data === "object") {
        setServerError(Object.values(errData.data as Record<string, string>).join(", "));
      } else {
        setServerError(errData?.message ?? "Đăng tin thất bại");
      }
    }
  };

  return (
    <div className="p-5 max-w-2xl">
      <h1 className="text-xl font-bold text-white mb-6">Đăng tin mới</h1>

      {serverError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-5">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit, (errs) => {
        const msgs = Object.values(errs).map((e) => (e as { message?: string })?.message).filter(Boolean).join(" • ");
        setServerError(msgs || "Vui lòng kiểm tra lại thông tin.");
      })} className="space-y-4">
        <Section title="Thông tin cơ bản">
          {/* Bước 1: Chọn danh mục cha */}
          <div>
            <p className="text-sm font-medium text-[#9ca3af] mb-2">Danh mục</p>
            <div className="flex flex-wrap gap-2">
              {categoryTree.filter((p) => p.active).map((parent) => (
                <button
                  key={parent.code}
                  type="button"
                  onClick={() => handleParentSelect(parent.code)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                    selectedParentCode === parent.code
                      ? "bg-green-500/15 border-green-500/50 text-green-400"
                      : "bg-[#2a2a2c] border-[#3a3a3c] text-[#9ca3af] hover:border-[#555] hover:text-white"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedParentCode === parent.code ? "border-green-400" : "border-[#555]"
                  }`}>
                    {selectedParentCode === parent.code && (
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                    )}
                  </span>
                  {parent.name}
                </button>
              ))}
            </div>
          </div>

          {/* Bước 2: Chọn danh mục con (nếu có) */}
          {selectedParentCode && childCategories.length > 0 && (
            <div>
              <p className="text-sm font-medium text-[#9ca3af] mb-2 flex items-center gap-1">
                <ChevronRight className="w-4 h-4" /> Loại cụ thể
              </p>
              <div className="flex flex-wrap gap-2">
                {childCategories.map((child) => (
                  <button
                    key={child.code}
                    type="button"
                    onClick={() => setValue("categoryCode", child.code)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      selectedCategory === child.code
                        ? "bg-green-500/15 border-green-500/50 text-green-400"
                        : "bg-[#2a2a2c] border-[#3a3a3c] text-[#9ca3af] hover:border-[#555] hover:text-white"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selectedCategory === child.code ? "border-green-400" : "border-[#555]"
                    }`}>
                      {selectedCategory === child.code && (
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                      )}
                    </span>
                    {child.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* hidden input để react-hook-form validate */}
          <input type="hidden" {...register("categoryCode")} />
          {errors.categoryCode && (
            <p className="text-red-400 text-xs">{errors.categoryCode.message}</p>
          )}
          <Field label="Tiêu đề tin đăng" error={errors.title?.message}>
            <input
              {...register("title")}
              className="form-input"
              placeholder="VD: Cho thuê nhà 3 phòng ngủ Đài Bắc"
            />
          </Field>
          <Field label="Mô tả">
            <textarea
              {...register("description")}
              rows={4}
              className="form-input resize-none"
              placeholder="Mô tả chi tiết về tin đăng..."
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Giá (NT$)" error={errors.price?.message}>
              <input
                {...register("price", { valueAsNumber: true })}
                type="number" min={0} className="form-input" placeholder="0"
              />
            </Field>
            <Field label="Đơn vị giá">
              <select {...register("priceUnit")} className="form-input">
                <option value="TOTAL">Tổng giá</option>
                <option value="MONTHLY">Theo tháng</option>
                <option value="NEGOTIABLE">Thỏa thuận</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* Image Upload */}
        <Section title="Hình ảnh">
          <p className="text-xs text-[#9ca3af] -mt-2">Tối đa 10 ảnh. Ảnh đầu tiên là ảnh bìa.</p>
          <div className="flex flex-wrap gap-3 mt-2">
            {imageUrls.map((url, idx) => (
              <div key={url} className="relative w-24 h-24 rounded-xl overflow-hidden border border-[#2e2e30] group">
                <Image src={url} alt={`ảnh ${idx + 1}`} fill className="object-cover" unoptimized />
                {idx === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-black/60 text-white py-0.5">
                    Bìa
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {imageUrls.length < 10 && (
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-[#2e2e30] flex flex-col items-center justify-center gap-1 text-[#9ca3af] hover:border-green-500 hover:text-green-400 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-[11px]">Thêm ảnh</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleImageFiles(e.target.files)}
          />
        </Section>

        {isRealEstate && (
          <Section title="Thông tin bất động sản">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Thành phố">
                <input {...register("city")} className="form-input" placeholder="Đài Bắc" />
              </Field>
              <Field label="Quận/Huyện">
                <input {...register("district")} className="form-input" placeholder="Đại An" />
              </Field>
            </div>
            <Field label="Địa chỉ">
              <input {...register("address")} className="form-input" placeholder="Số nhà, đường..." />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Diện tích (m²)">
                <input {...register("areaSqm", { valueAsNumber: true })} type="number" min={0} className="form-input" />
              </Field>
              <Field label="Phòng ngủ">
                <input {...register("bedrooms", { valueAsNumber: true })} type="number" min={0} className="form-input" />
              </Field>
              <Field label="Phòng tắm">
                <input {...register("bathrooms", { valueAsNumber: true })} type="number" min={0} className="form-input" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Số tầng">
                <input {...register("floors", { valueAsNumber: true })} type="number" min={0} className="form-input" />
              </Field>
              <Field label="Nội thất">
                <select {...register("isFurnished", { setValueAs: (v) => v === "true" })} className="form-input">
                  <option value="">-- Chọn --</option>
                  <option value="true">Có nội thất</option>
                  <option value="false">Không nội thất</option>
                </select>
              </Field>
            </div>
            {isRental && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ngày có thể ở">
                  <input {...register("availableFrom")} type="date" className="form-input" />
                </Field>
                <Field label="Tiền cọc (NT$)">
                  <input {...register("deposit", { valueAsNumber: true })} type="number" min={0} className="form-input" />
                </Field>
              </div>
            )}
          </Section>
        )}

        {isCar && (
          <Section title="Thông tin xe">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Hãng xe">
                <input {...register("brand")} className="form-input" placeholder="Toyota" />
              </Field>
              <Field label="Dòng xe">
                <input {...register("model")} className="form-input" placeholder="Camry" />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Năm sản xuất">
                <input {...register("manufactureYear", { valueAsNumber: true })} type="number" min={1990} max={2030} className="form-input" />
              </Field>
              <Field label="Số km">
                <input {...register("mileageKm", { valueAsNumber: true })} type="number" min={0} className="form-input" />
              </Field>
              <Field label="Màu sắc">
                <input {...register("color")} className="form-input" placeholder="Trắng" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nhiên liệu">
                <select {...register("fuelType")} className="form-input">
                  <option value="">-- Chọn --</option>
                  <option value="GASOLINE">Xăng</option>
                  <option value="DIESEL">Dầu</option>
                  <option value="ELECTRIC">Điện</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </Field>
              <Field label="Hộp số">
                <select {...register("transmission")} className="form-input">
                  <option value="">-- Chọn --</option>
                  <option value="AUTOMATIC">Tự động</option>
                  <option value="MANUAL">Số sàn</option>
                </select>
              </Field>
            </div>
          </Section>
        )}

        {isJob && (
          <Section title="Thông tin việc làm">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Loại công việc">
                <select {...register("jobType")} className="form-input">
                  <option value="">-- Chọn --</option>
                  <option value="FULL_TIME">Toàn thời gian</option>
                  <option value="PART_TIME">Bán thời gian</option>
                  <option value="CONTRACT">Hợp đồng</option>
                  <option value="FREELANCE">Freelance</option>
                </select>
              </Field>
              <Field label="Kinh nghiệm (năm)">
                <input {...register("experienceYears", { valueAsNumber: true })} type="number" min={0} className="form-input" placeholder="0" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Thành phố">
                <input {...register("city")} className="form-input" placeholder="Đài Bắc" />
              </Field>
              <Field label="Quận/Huyện">
                <input {...register("district")} className="form-input" placeholder="Đại An" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Lương tối thiểu (NT$)">
                <input {...register("salaryMin", { valueAsNumber: true })} type="number" min={0} className="form-input" placeholder="0" />
              </Field>
              <Field label="Lương tối đa (NT$)">
                <input {...register("salaryMax", { valueAsNumber: true })} type="number" min={0} className="form-input" placeholder="0" />
              </Field>
            </div>
            <Field label="Người liên hệ">
              <input {...register("contactName")} className="form-input" placeholder="Tên người liên hệ" />
            </Field>
          </Section>
        )}

        {isService && (
          <Section title="Thông tin dịch vụ">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Thành phố">
                <input {...register("city")} className="form-input" placeholder="Đài Bắc" />
              </Field>
              <Field label="Quận/Huyện">
                <input {...register("district")} className="form-input" placeholder="Đại An" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Người liên hệ">
                <input {...register("contactName")} className="form-input" placeholder="Tên người liên hệ" />
              </Field>
              <Field label="Số điện thoại">
                <input {...register("contactPhone")} className="form-input" placeholder="+886..." />
              </Field>
            </div>
          </Section>
        )}

        {isGoods && (
          <Section title="Thông tin đồ dùng">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tình trạng">
                <select {...register("goodsCondition")} className="form-input">
                  <option value="">-- Chọn --</option>
                  <option value="NEW">Mới</option>
                  <option value="LIKE_NEW">Như mới</option>
                  <option value="GOOD">Tốt</option>
                  <option value="FAIR">Trung bình</option>
                </select>
              </Field>
              <Field label="Thương hiệu">
                <input {...register("brand")} className="form-input" placeholder="VD: Samsung, Apple..." />
              </Field>
            </div>
            <Field label="Thành phố">
              <input {...register("city")} className="form-input" placeholder="Đài Bắc" />
            </Field>
          </Section>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-500 hover:bg-green-400 text-black rounded-xl py-3 font-bold transition-colors disabled:opacity-60"
        >
          {isSubmitting ? "Đang đăng tin..." : "Đăng tin ngay"}
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1c1c1e] rounded-xl border border-[#2e2e30] p-5">
      <h2 className="font-semibold text-white mb-4 text-sm">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
