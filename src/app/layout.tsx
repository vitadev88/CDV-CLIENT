import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppSettingsProvider } from "@/context/AppSettingsContext";
import Sidebar from "@/components/Sidebar";
import FeedbackModal from "@/components/FeedbackModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import MaintenanceGuard from "@/components/MaintenanceGuard";

const archivo = Archivo({
  subsets: ["latin", "vietnamese"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cộng Đồng Việt — Marketplace người Việt tại Đài Loan",
  description: "Mua bán, tìm việc làm, thuê phòng và kết nối cộng đồng người Việt tại Đài Loan. Marketplace uy tín số 1 cho người Việt ở Đài Loan.",
  metadataBase: new URL("https://congdongviet6368.com"),
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Cộng Đồng Việt — Marketplace người Việt tại Đài Loan",
    description: "Mua bán, tìm việc làm, thuê phòng và kết nối cộng đồng người Việt tại Đài Loan.",
    url: "https://congdongviet6368.com",
    siteName: "Cộng Đồng Việt",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cộng Đồng Việt — Marketplace người Việt tại Đài Loan",
    description: "Mua bán, tìm việc làm, thuê phòng và kết nối cộng đồng người Việt tại Đài Loan.",
  },
  alternates: {
    canonical: "https://congdongviet6368.com",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${archivo.variable}`}>
      <body className="min-h-screen font-[family-name:var(--font-archivo)]">
        <AppSettingsProvider>
        <AuthProvider>
          <MaintenanceGuard>
            <div className="flex h-screen overflow-hidden">
              {/* Left sidebar */}
              <Sidebar />

              {/* Main content */}
              <ScrollArea className="flex-1 min-w-0 h-screen">
                <main className="pt-14 md:pt-0">
                  {children}
                  <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border mt-8">
                    © 2026 CongDongViet group
                  </footer>
                </main>
              </ScrollArea>
            </div>
            <FeedbackModal />
          </MaintenanceGuard>
        </AuthProvider>
        </AppSettingsProvider>
      </body>
    </html>
  );
}
