"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { Percent, Heart, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DonationAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrImageUrl: string | null;
}

const publicApi = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1`,
});

export default function TopBanners() {
  const [donations, setDonations] = useState<DonationAccount[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    publicApi.get<{ data: DonationAccount[] }>("/donation-accounts/active")
      .then((res) => setDonations(res.data.data ?? []))
      .catch(() => {});
  }, []);

  function copyAccount(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 pt-6">
      {/* Banner 1: Đăng tin miễn phí */}
      <div className="relative bg-gradient-to-r from-primary/20 to-primary/40 rounded-xl p-6 overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-primary">Ưu đãi đặc biệt</span>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-foreground">Miễn phí đăng tin</h2>
          <p className="text-muted-foreground mb-4">
            Đăng tin cho thuê, mua bán miễn phí — Tiếp cận hàng nghìn khách hàng
          </p>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/dang-tin">Đăng tin ngay</Link>
          </Button>
        </div>
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/20 rounded-full blur-xl" />
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-primary/30 rounded-full blur-lg" />
      </div>

      {/* Banner 2: Donate */}
      <div className="relative bg-gradient-to-r from-rose-500/20 to-rose-600/30 rounded-xl p-6 overflow-hidden">
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
            <span className="text-sm font-medium text-rose-400">Ủng hộ website</span>
          </div>
          <h2 className="text-2xl font-bold mb-1 text-foreground">Donate</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Website miễn phí hoàn toàn. Mọi đóng góp giúp chúng tôi duy trì và phát triển.
          </p>
          {donations.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Chưa có thông tin tài khoản</p>
          ) : (
            <div className="flex gap-0 flex-1">
              {donations.map((a, i) => (
                <>
                  {i > 0 && (
                    <div key={`divider-${a.id}`} className="w-px bg-white/10 mx-3 self-stretch" />
                  )}
                  <div key={a.id} className="flex flex-col items-center gap-2 flex-1">
                    {a.qrImageUrl && (
                      <Image
                        src={a.qrImageUrl}
                        alt={`QR ${a.bankName}`}
                        width={100}
                        height={100}
                        className="rounded-xl object-cover"
                        unoptimized
                      />
                    )}
                    <div className="text-center min-w-0 w-full">
                      <p className="text-xs text-rose-300 font-medium">{a.bankName}</p>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <p className="font-mono text-sm font-bold text-white truncate">{a.accountNumber}</p>
                        <button
                          onClick={() => copyAccount(a.accountNumber, a.id)}
                          className="shrink-0 text-muted-foreground hover:text-rose-400 transition-colors"
                          title="Sao chép số tài khoản"
                        >
                          {copiedId === a.id
                            ? <Check className="w-3.5 h-3.5 text-rose-400" />
                            : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{a.accountHolder}</p>
                    </div>
                  </div>
                </>
              ))}
            </div>
          )}
        </div>
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-rose-500/20 rounded-full blur-xl" />
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-rose-500/30 rounded-full blur-lg" />
      </div>
    </div>
  );
}
