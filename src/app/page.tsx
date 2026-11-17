import Link from "next/link";
import { changeStatus } from "./actions";
import { AutoRefresh } from "@/components/AutoRefresh";
import { DatePicker } from "@/components/DatePicker";
import { StatusBadge } from "@/components/StatusBadge";
import { getStore } from "@/lib/store";
import { formatClock, formatDateKo, isValidDate, nowTimeInSeoul, shiftDate, todayInSeoul } from "@/lib/time";
import type { Reservation, Room } from "@/lib/types";

export const dynamic = "force-dynamic";

type NowState = { tone: "busy" | "pending" | "free"; text: string };

function nowStateFor(list: Reservation[], now: string): NowState {
  const inUse = list.find((r) => r.status === "in_use");
  if (inUse) return { tone: "busy", text: `지금 사용 중 · ${inUse.roleLabel}` };
  const slot = list.find((r) => r.status === "reserved" && r.startTime <= now && now < r.endTime);
  if (slot) return { tone: "pending", text: `지금 예약 시간 · 사용 시작 전 (${slot.roleLabel})` };
  return { tone: "free", text: "지금 비어 있음" };
}

const NOW_STYLE: Record<NowState["tone"], string> = {
  busy: "bg-rose-50 text-rose-700",
  pending: "bg-sky-50 text-sky-800",
  free: "bg-emerald-50 text-emerald-700",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; notice?: string }>;
}) {
  const sp = await searchParams;
  const today = todayInSeoul();
  const date = isValidDate(sp.date) ? sp.date : today;
  const isToday = date === today;
  const now = nowTimeInSeoul();

  const store = getStore();
  const [rooms, reservations] = await Promise.all([store.listRooms(), store.listReservations(date)]);
  const byRoom = new Map<number, Reservation[]>();
  for (const r of reservations) byRoom.set(r.roomId, [...(byRoom.get(r.roomId) ?? []), r]);

  return (
    <main className="space-y-4">
      <AutoRefresh />
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">특별실 현황</h1>
          <p className="mt-1 text-sm text-slate-500">예약과 실제 사용 여부를 한눈에 확인해요.</p>
        </div>
        <Link href={`/reservations/new?date=${date}`} className="btn-primary shrink-0">
          + 예약 추가
        </Link>
      </header>

      {sp.notice && (
        <p role="status" className="rounded-xl bg-slate-800 px-4 py-3 text-sm font-medium text-white">
          {sp.notice}
        </p>
      )}

      <DatePicker
        date={date}
        label={`${formatDateKo(date)}${isToday ? " · 오늘" : ""}`}
        prev={shiftDate(date, -1)}
        next={shiftDate(date, 1)}
        today={today}
      />

      {rooms.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-500 ring-1 ring-slate-200">
          등록된 특별실이 없어요.
        </p>
      )}

      <ul className="space-y-3">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            date={date}
            list={byRoom.get(room.id) ?? []}
            nowState={isToday ? nowStateFor(byRoom.get(room.id) ?? [], now) : null}
          />
        ))}
      </ul>
    </main>
  );
}

function RoomCard({
  room,
  date,
  list,
  nowState,
}: {
  room: Room;
  date: string;
  list: Reservation[];
  nowState: NowState | null;
}) {
  return (
    <li className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold">{room.name}</h2>
          {nowState && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${NOW_STYLE[nowState.tone]}`}>
              {nowState.text}
            </span>
          )}
        </div>
        <Link
          href={`/reservations/new?date=${date}&room=${room.id}`}
          className="btn-sm text-sky-700 hover:bg-sky-50"
          aria-label={`${room.name} 예약 추가`}
        >
          + 예약
        </Link>
      </div>
      {list.length === 0 ? (
        <p className="px-4 py-4 text-sm text-slate-400">이 날짜에 예약이 없어요.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {list.map((r) => (
            <ReservationRow key={r.id} r={r} date={date} />
          ))}
        </ul>
      )}
    </li>
  );
}

function ReservationRow({ r, date }: { r: Reservation; date: string }) {
  const faded = r.status === "unused" || r.status === "done";
  return (
    <li className="px-4 py-3">
      <div className={`flex flex-wrap items-start justify-between gap-2 ${faded ? "opacity-70" : ""}`}>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className={`text-base font-bold tabular-nums ${r.status === "unused" ? "line-through" : ""}`}>
              {r.startTime}–{r.endTime}
            </span>
            <StatusBadge status={r.status} />
          </p>
          <p className="mt-1 text-sm font-medium text-slate-700">{r.roleLabel}</p>
          <p className="text-sm text-slate-500">{r.purpose}</p>
          {(r.actualStartAt || r.actualEndAt) && (
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              실제 사용 {formatClock(r.actualStartAt)} 시작
              {r.actualEndAt && ` · ${formatClock(r.actualEndAt)} 종료`}
            </p>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {r.status === "reserved" && (
          <>
            <StatusButton id={r.id} date={date} action="start" className="bg-rose-600 text-white hover:bg-rose-700">
              사용 시작
            </StatusButton>
            <StatusButton id={r.id} date={date} action="unused" className="bg-amber-100 text-amber-900 hover:bg-amber-200">
              미사용
            </StatusButton>
          </>
        )}
        {r.status === "in_use" && (
          <StatusButton id={r.id} date={date} action="end" className="bg-slate-800 text-white hover:bg-slate-900">
            사용 종료
          </StatusButton>
        )}
        <Link href={`/reservations/${r.id}/edit`} className="btn-sm text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50">
          예약 수정
        </Link>
        <Link href={`/reservations/${r.id}/delete`} className="btn-sm text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-50">
          예약 삭제
        </Link>
      </div>
    </li>
  );
}

function StatusButton({
  id,
  date,
  action,
  className,
  children,
}: {
  id: number;
  date: string;
  action: "start" | "unused" | "end";
  className: string;
  children: React.ReactNode;
}) {
  return (
    <form action={changeStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="action" value={action} />
      <button type="submit" className={`btn-sm ${className}`}>
        {children}
      </button>
    </form>
  );
}
