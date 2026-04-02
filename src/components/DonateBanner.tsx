"use client";
import { useEffect, useState } from "react";
import { Heart, X, Copy, Check } from "lucide-react";
import axios from "axios";

const publicApi = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1`,
});

interface DonationAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrImageUrl: string | null;
}

const STORAGE_KEY = "cdv_donate_banner_closed";

export default function DonateBanner() {
  const [accounts, setAccounts] = useState<DonationAccount[]>([]);
  const [visible, setVisible] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const closed = sessionStorage.getItem(STORAGE_KEY);
    if (closed) return;

    publicApi.get<{ data: DonationAccount[] }>("/donation-accounts/active")
      .then((res) => {
        if (res.data.data?.length) {
          setAccounts(res.data.data);
          setVisible(true);
        }
      })
      .catch((err: unknown) => console.error("Failed to load donation accounts", err));
  }, []);

  function close() {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  if (!visible || accounts.length === 0) return null;

  return (
    <div className="w-full bg-gradient-to-r from-[#0f2a1a] via-[#1a3a24] to-[#0f2a1a] border-b border-[#1CE479]/20">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-4 flex-wrap">
        {/* Label */}
        <div className="flex items-center gap-2 shrink-0">
          <Heart className="w-4 h-4 text-[#1CE479] fill-[#1CE479]" />
          <span className="text-sm font-semibold text-[#1CE479]">Ủng hộ website</span>
          <span className="text-xs text-[#9CA3AF] hidden sm:inline">— Miễn phí hoàn toàn, chi phí duy trì do cộng đồng đóng góp</span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[#2A2A35] shrink-0 hidden sm:block" />

        {/* Accounts */}
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center gap-2 bg-[#1A1A20] border border-[#2A2A35] rounded-lg px-3 py-1.5">
              <span className="text-xs text-[#9CA3AF] shrink-0">{a.bankName}</span>
              <span className="text-xs font-mono font-semibold text-white">{a.accountNumber}</span>
              <span className="text-xs text-[#9CA3AF] hidden md:inline">— {a.accountHolder}</span>
              <button
                onClick={() => copy(a.accountNumber, a.id)}
                title="Sao chép số tài khoản"
                className="text-[#9CA3AF] hover:text-[#1CE479] transition-colors ml-1"
              >
                {copiedId === a.id
                  ? <Check className="w-3.5 h-3.5 text-[#1CE479]" />
                  : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>

        {/* Close */}
        <button onClick={close} className="text-[#9CA3AF] hover:text-white transition-colors shrink-0 ml-auto">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
