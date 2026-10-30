import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSettingsProvider } from "@/components/providers/AppSettingsProvider";

export const metadata: Metadata = {
  title: {
    template: "%s — ERP Al-Mubarok",
    default: "ERP Al-Mubarok",
  },
  description: "Sistem ERP terintegrasi Al-Mubarok",
  keywords: ["ERP", "Al-Mubarok", "Pesantren", "Manajemen"],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png" },
    ],
  },
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
          <AppSettingsProvider>
            {children}
          </AppSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
