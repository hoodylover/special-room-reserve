"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveReservation, type FormState } from "@/app/actions";
import { PURPOSE_MAX, ROLE_MAX } from "@/lib/validation";
import type { Room } from "@/lib/types";

export interface FormDefaults {
  id?: number;
  roomId: string;
  useDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  roleLabel: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary flex-1" disabled={pending}>
      {pending ? "저장 중…" : "저장"}
    </button>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm font-medium text-rose-600">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

export function ReservationForm({
  rooms,
  defaults,
  cancelHref,
}: {
  rooms: Room[];
  defaults: FormDefaults;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(saveReservation, { errors: {} });
  const v = { ...defaults, ...(state.values ?? {}) };
  const e = state.errors;
  // 서버가 돌려준 값으로 입력칸을 다시 채우기 위해 key를 바꿔 다시 그린다
  const key = JSON.stringify(state.values ?? {});

  return (
    <form action={formAction} key={key} className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200" noValidate>
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      {e.form && (
        <div role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
          {e.form}
        </div>
      )}

      <Field label="특별실" htmlFor="roomId" error={e.roomId}>
        <select id="roomId" name="roomId" defaultValue={v.roomId} className="field" aria-invalid={!!e.roomId}>
          <option value="">특별실을 고르세요</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="날짜" htmlFor="useDate" error={e.useDate}>
        <input id="useDate" name="useDate" type="date" defaultValue={v.useDate} className="field" aria-invalid={!!e.useDate} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="시작 시각" htmlFor="startTime" error={e.form && e.startTime === e.form ? undefined : e.startTime}>
          <input
            id="startTime"
            name="startTime"
            type="time"
            step={300}
            defaultValue={v.startTime}
            className="field"
            aria-invalid={!!e.startTime}
          />
        </Field>
        <Field label="종료 시각" htmlFor="endTime" error={e.endTime}>
          <input
            id="endTime"
            name="endTime"
            type="time"
            step={300}
            defaultValue={v.endTime}
            className="field"
            aria-invalid={!!e.endTime || (!!e.form && e.startTime === e.form)}
          />
        </Field>
      </div>

      <Field label="사용 목적" htmlFor="purpose" error={e.purpose} hint="학생 이름 등 학생을 알아볼 수 있는 정보는 적지 마세요.">
        <input
          id="purpose"
          name="purpose"
          maxLength={PURPOSE_MAX}
          defaultValue={v.purpose}
          placeholder="예: 과학 영상 자료 시청"
          className="field"
          aria-invalid={!!e.purpose}
        />
      </Field>

      <Field label="직책 표시" htmlFor="roleLabel" error={e.roleLabel} hint="로그인이 없어서 입력한 문구가 그대로 보여요.">
        <input
          id="roleLabel"
          name="roleLabel"
          maxLength={ROLE_MAX}
          defaultValue={v.roleLabel}
          placeholder="예: 5-4 담임 교사"
          className="field"
          aria-invalid={!!e.roleLabel}
        />
      </Field>

      <div className="flex gap-2 pt-2">
        <Link href={cancelHref} className="btn-secondary flex-1">
          취소
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
