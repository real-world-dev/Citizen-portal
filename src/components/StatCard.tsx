import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "navy" | "ochre" | "red" | "green";
}) {
  const accentClass = {
    navy: "text-navy-700",
    ochre: "text-ochre-600",
    red: "text-red-600",
    green: "text-green-700",
  }[accent ?? "navy"];

  return (
    <div className="stamp-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</p>
      <p className={cn("mt-2 font-display text-3xl font-bold", accentClass)}>{value}</p>
    </div>
  );
}
