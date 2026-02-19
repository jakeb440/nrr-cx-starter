import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CX Diagnostics — Product Catalog",
  description:
    "Three diagnostic products you can generate for any client. Choose a product, open Cursor, and build.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
