import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "TC-Renováveis Roadmap | PETROBRAS × IAG-USP",
  description:
    "Project roadmap for the Cooperation Agreement TC No. 050.0125966.23.9 — Wind & Waves Research, PETROBRAS/CENPES × IAG-USP.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0f1117]`}
      >
        {children}
      </body>
    </html>
  );
}
