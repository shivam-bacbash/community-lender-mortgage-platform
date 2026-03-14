import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Community Lender Mortgage Platform",
  description:
    "Next.js frontend starter wired for a Supabase-powered community lender platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
