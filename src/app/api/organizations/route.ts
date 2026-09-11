import { NextResponse } from "next/server";
import { listOrganizations } from "@/lib/repo";

export async function GET() {
  const organizations = await listOrganizations();
  return NextResponse.json({ organizations });
}
