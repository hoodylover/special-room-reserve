import Link from "next/link";

export default function NotFound() {
  return (
    <main className="space-y-4 rounded-2xl bg-white p-6 text-center ring-1 ring-slate-200">
      <p className="font-semibold">예약을 찾을 수 없어요. 이미 삭제되었을 수 있어요.</p>
      <Link href="/" className="btn-primary">
        특별실 현황으로
      </Link>
    </main>
  );
}
