"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DatePicker({
  date,
  label,
  prev,
  next,
  today,
}: {
  date: string;
  label: string;
  prev: string;
  next: string;
  today: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-2">
        <Link href={`/?date=${prev}`} className="btn-ghost" aria-label="이전 날짜">
          ‹
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex-1 rounded-xl px-3 py-2 text-center text-base font-bold hover:bg-slate-50"
        >
          {label}
          <span className="ml-2 text-sm font-medium text-sky-700">날짜 선택</span>
        </button>
        <Link href={`/?date=${next}`} className="btn-ghost" aria-label="다음 날짜">
          ›
        </Link>
      </div>
      {open && (
        <form
          className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            const v = new FormData(e.currentTarget).get("date");
            if (v) {
              setOpen(false);
              router.push(`/?date=${v}`);
            }
          }}
        >
          <input
            type="date"
            name="date"
            defaultValue={date}
            required
            className="field flex-1"
            aria-label="날짜"
          />
          <button type="submit" className="btn-primary">
            보기
          </button>
          {date !== today && (
            <Link href={`/?date=${today}`} onClick={() => setOpen(false)} className="btn-secondary">
              오늘
            </Link>
          )}
        </form>
      )}
    </div>
  );
}
