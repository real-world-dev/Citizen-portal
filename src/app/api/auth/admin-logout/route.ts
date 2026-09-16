import { NextResponse } from "next/server";
import { AUTH_COOKIES } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(AUTH_COOKIES.ADMIN_COOKIE);
  return res;
}
