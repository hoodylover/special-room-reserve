import { ReservationForm } from "@/components/ReservationForm";
import { getStore } from "@/lib/store";
import { isValidDate, todayInSeoul } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function NewReservationPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; room?: string }>;
}) {
  const sp = await searchParams;
  const date = isValidDate(sp.date) ? sp.date : todayInSeoul();
  const rooms = await getStore().listRooms();
  const roomId = rooms.some((r) => String(r.id) === sp.room) ? String(sp.room) : "";

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">예약 추가</h1>
      <ReservationForm
        rooms={rooms}
        cancelHref={`/?date=${date}`}
        defaults={{ roomId, useDate: date, startTime: "", endTime: "", purpose: "", roleLabel: "" }}
      />
    </main>
  );
}
