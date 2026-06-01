import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: {
    template: "%s — ERP Al-Mubarok",
    default: "ERP Al-Mubarok",
  },
  description: "Sistem ERP terintegrasi Pondok Pesantren Al-Mubarok",
  keywords: ["ERP", "Al-Mubarok", "Pesantren", "Manajemen"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
