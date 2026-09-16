import type { Metadata } from "next";
import { Bitter, Public_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth";

const bitter = Bitter({
  subsets: ["latin"],
  variable: "--font-bitter",
  weight: ["600", "700"],
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Citizen's Portal",
  description:
    "Propose changes for your town, refined and categorized by AI, and see what your town hall does with it.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${bitter.variable} ${publicSans.variable}`}>
      <body className="min-h-screen flex flex-col font-sans">
        <Navbar user={user} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-navy-100 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-sm text-navy-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>Citizen&apos;s Portal — a demo civic proposal platform.</p>
            <p>Seeded with Elda &amp; Petrer, Alicante.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
