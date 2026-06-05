import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { Toaster } from "@/components/ui/sonner";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FixIT — Solusi Perbaikan Laptop Terpercaya",
  description: "Platform servis laptop on-demand. Menghubungkan Anda dengan teknisi profesional terdekat secara real-time. Cepat, Bergaransi, dan Transparan.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={cn("scroll-smooth", plusJakarta.variable, inter.variable)}>
      <body className="font-sans bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
