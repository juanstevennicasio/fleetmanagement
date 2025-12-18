import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "FleetFlow - Gestión Logística y Monitoreo de Flota",
  description: "Sistema integral de gestión de flotas y monitoreo logístico",
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
