"use client";

import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/admin-logout", { method: "POST" });
        router.push("/admin/login");
        router.refresh();
      }}
      className="btn-secondary !py-1.5 !px-3 !text-xs"
    >
      Sign out
    </button>
  );
}
