import { notFound } from "next/navigation";
import { ReservationForm } from "@/components/ReservationForm";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function EditReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = getStore();
  const [rooms, r] = await Promise.all([store.listRooms(), store.getReservation(Number(id))]);
  if (!r) notFound();

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">예약 수정</h1>
      <ReservationForm
        rooms={rooms}
        cancelHref={`/?date=${r.useDate}`}
        defaults={{
          id: r.id,
          roomId: String(r.roomId),
          useDate: r.useDate,
          startTime: r.startTime,
          endTime: r.endTime,
          purpose: r.purpose,
          roleLabel: r.roleLabel,
        }}
      />
    </main>
  );
}
