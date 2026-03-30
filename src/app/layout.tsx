import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import ActivityObserver from "@/components/ActivityObserver";

export const metadata: Metadata = {
  title: "NCSC - التصريح الأمني والجنائي",
  description: "النظام الأمني الوطني لإدارة التصاريح وسجلات التفتيش",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Providers>
          <ActivityObserver />
          {children}
        </Providers>
      </body>
    </html>
  );
}
