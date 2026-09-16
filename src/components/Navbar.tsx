"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@/types";

export function Navbar({ user }: { user: User | null }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-navy-100 bg-navy-800 text-parchment">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ochre-500 text-navy-900 font-display font-bold text-sm shadow-stamp">
            CP
          </span>
          <span className="font-display text-lg font-bold tracking-tight group-hover:text-ochre-300 transition">
            Citizen&apos;s Portal
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
          <Link href="/" className="hidden sm:inline hover:text-ochre-300 transition px-2 py-1">
            Browse requests
          </Link>
          <Link href="/submit" className="hidden sm:inline hover:text-ochre-300 transition px-2 py-1">
            Submit a request
          </Link>
          <Link
            href="/admin"
            className="hidden sm:inline text-navy-300 hover:text-ochre-300 transition px-2 py-1"
          >
            Town hall login
          </Link>

          {user ? (
            <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-navy-600">
              <span className="hidden md:inline text-navy-200">Hi, {user.name.split(" ")[0]}</span>
              <button onClick={handleLogout} className="btn-secondary !py-1.5 !px-3 !text-xs">
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-ochre !py-1.5 !px-4 !text-xs">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
