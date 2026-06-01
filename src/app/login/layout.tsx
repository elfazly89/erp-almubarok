import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login — ERP Al-Mubarok",
  description: "Masuk ke sistem ERP Al-Mubarok",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
