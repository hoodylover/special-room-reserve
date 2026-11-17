import { STATUS_LABEL, type ReservationStatus } from "@/lib/types";

const STYLE: Record<ReservationStatus, string> = {
  reserved: "bg-sky-50 text-sky-800 ring-sky-200",
  in_use: "bg-rose-50 text-rose-700 ring-rose-200",
  done: "bg-slate-100 text-slate-600 ring-slate-200",
  unused: "bg-amber-50 text-amber-800 ring-amber-200",
};

export function StatusBadge({ status }: { status: ReservationStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STYLE[status]}`}>
      {status === "in_use" && <span className="size-1.5 animate-pulse rounded-full bg-rose-500" aria-hidden />}
      {STATUS_LABEL[status]}
    </span>
  );
}
