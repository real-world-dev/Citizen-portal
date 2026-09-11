import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { AdminProposalsTable } from "@/components/AdminProposalsTable";
import { CategoryBarChart, StatusPieChart, TrendLineChart } from "@/components/Charts";
import { StatCard } from "@/components/StatCard";
import { getAdminSession } from "@/lib/auth";
import { getAdminStats, getOrganizationById, listProposals } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const [org, stats, proposals] = await Promise.all([
    getOrganizationById(session.orgId),
    getAdminStats(session.orgId),
    listProposals({ orgId: session.orgId }),
  ]);

  const openCount = stats.total - stats.byStatus.done - stats.byStatus.declined;
  const highUrgencyCount = stats.byUrgency.high;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ochre-600">
            Town hall dashboard
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-900">
            {org?.name ?? "Your town"}
          </h1>
        </div>
        <AdminLogoutButton />
      </div>

      {org && !org.licenseActive && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          This town&apos;s license is inactive — analytics are read-only. Contact sales to
          reactivate full access.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total requests" value={stats.total} accent="navy" />
        <StatCard label="Open" value={openCount} accent="ochre" />
        <StatCard label="High urgency" value={highUrgencyCount} accent="red" />
        <StatCard label="Done" value={stats.byStatus.done} accent="green" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="stamp-card p-5">
          <h2 className="font-display font-semibold text-navy-800 mb-2">Requests by category</h2>
          <CategoryBarChart byCategory={stats.byCategory} />
        </div>
        <div className="stamp-card p-5">
          <h2 className="font-display font-semibold text-navy-800 mb-2">Requests by status</h2>
          <StatusPieChart byStatus={stats.byStatus} />
        </div>
      </div>

      <div className="stamp-card p-5">
        <h2 className="font-display font-semibold text-navy-800 mb-2">Submissions, last 14 days</h2>
        <TrendLineChart trend={stats.trend} />
      </div>

      <div>
        <h2 className="font-display font-semibold text-navy-800 mb-3">All requests</h2>
        <AdminProposalsTable initialProposals={proposals} />
      </div>
    </div>
  );
}
