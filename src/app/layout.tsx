import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import TopBanners from "@/components/TopBanners";
import FeedbackModal from "@/components/FeedbackModal";
import { ScrollArea } from "@/components/ui/scroll-area";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cộng Đồng Việt — Marketplace người Việt tại Đài Loan",
  description: "Tìm phòng thuê, mua bán nhà đất và xe cộ cho người Việt tại Đài Loan",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${archivo.variable} dark`}>
      <body className="bg-[#09090b] text-[#fafafa] min-h-screen font-[family-name:var(--font-archivo)]">
        <AuthProvider>
          <div className="flex h-screen overflow-hidden">
            {/* Left sidebar */}
            <Sidebar />

            {/* Main content */}
            <ScrollArea className="flex-1 min-w-0 h-screen">
              <main className="pt-14 md:pt-0">
                <TopBanners />
                {children}
              </main>
            </ScrollArea>

          </div>
          <FeedbackModal />
        </AuthProvider>
      </body>
    </html>
  );
}
