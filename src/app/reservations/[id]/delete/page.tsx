import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteReservation } from "@/app/actions";
import { StatusBadge } from "@/components/StatusBadge";
import { getStore } from "@/lib/store";
import { formatDateKo } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function DeleteReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const [rooms, r] = await Promise.all([store.listRooms(), store.getReservation(Number(id))]);
  if (!r) notFound();
  const room = rooms.find((x) => x.id === r.roomId);

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">예약 삭제</h1>
      <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-base font-semibold">이 예약을 삭제할까요?</p>
        <dl className="grid grid-cols-[5.5rem_1fr] gap-y-2 rounded-xl bg-slate-50 p-4 text-sm">
          <dt className="text-slate-500">특별실</dt>
          <dd className="font-semibold">{room?.name ?? "알 수 없음"}</dd>
          <dt className="text-slate-500">날짜</dt>
          <dd>{formatDateKo(r.useDate)}</dd>
          <dt className="text-slate-500">시간</dt>
          <dd className="tabular-nums">
            {r.startTime}–{r.endTime}
          </dd>
          <dt className="text-slate-500">직책 표시</dt>
          <dd>{r.roleLabel}</dd>
          <dt className="text-slate-500">상태</dt>
          <dd>
            <StatusBadge status={r.status} />
          </dd>
        </dl>
        <form action={deleteReservation} className="flex gap-2">
          <input type="hidden" name="id" value={r.id} />
          <input type="hidden" name="date" value={r.useDate} />
          <Link href={`/?date=${r.useDate}`} className="btn-secondary flex-1">
            취소
          </Link>
          <button type="submit" className="btn-danger flex-1">
            삭제
          </button>
        </form>
      </section>
    </main>
  );
}
