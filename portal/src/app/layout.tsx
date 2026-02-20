import type { Metadata } from "next";
import "./globals.css";
import PasswordGate from "@/components/PasswordGate";

export const metadata: Metadata = {
  title: "Agentic Customer Operations — Diagnostic Products",
  description:
    "Three diagnostic products for agentic customer operations. Generate NRR diagnostics and transformation teardowns for any client.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">
        <PasswordGate>{children}</PasswordGate>
      </body>
    </html>
  );
}
