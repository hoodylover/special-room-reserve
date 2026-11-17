"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStore } from "@/lib/store";
import { isValidDate } from "@/lib/time";
import { ConflictError, NotFoundError, StateError, type StatusAction } from "@/lib/types";
import { parseReservationForm, type FieldErrors } from "@/lib/validation";

export interface FormState {
  errors: FieldErrors;
  values?: Record<string, string>;
}

function backTo(date: string, notice?: string): never {
  const qs = new URLSearchParams();
  if (isValidDate(date)) qs.set("date", date);
  if (notice) qs.set("notice", notice);
  const s = qs.toString();
  redirect(s ? `/?${s}` : "/");
}

function toFormError(err: unknown): string {
  if (err instanceof ConflictError || err instanceof NotFoundError) return err.message;
  console.error(err);
  return "저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.";
}

export async function saveReservation(_prev: FormState, form: FormData): Promise<FormState> {
  const { values, input, errors } = parseReservationForm(form);
  if (!input) return { errors, values };

  const idRaw = String(form.get("id") ?? "");
  const store = getStore();
  try {
    if (idRaw) await store.updateReservation(Number(idRaw), input);
    else await store.createReservation(input);
  } catch (err) {
    const message = toFormError(err);
    if (err instanceof ConflictError) return { errors: { startTime: message, form: message }, values };
    return { errors: { form: message }, values };
  }
  revalidatePath("/");
  backTo(input.useDate, idRaw ? "예약을 수정했어요." : "예약을 추가했어요.");
}

export async function changeStatus(form: FormData) {
  const id = Number(form.get("id"));
  const action = String(form.get("action")) as StatusAction;
  const date = String(form.get("date") ?? "");
  let notice: string | undefined;
  try {
    if (!["start", "unused", "end"].includes(action)) throw new StateError("알 수 없는 동작이에요.");
    await getStore().changeStatus(id, action);
  } catch (err) {
    if (err instanceof StateError || err instanceof NotFoundError) notice = err.message;
    else {
      console.error(err);
      notice = "상태를 바꾸지 못했어요. 잠시 뒤 다시 시도해 주세요.";
    }
  }
  revalidatePath("/");
  backTo(date, notice);
}

export async function deleteReservation(form: FormData) {
  const id = Number(form.get("id"));
  const date = String(form.get("date") ?? "");
  let notice = "예약을 삭제했어요.";
  try {
    await getStore().deleteReservation(id);
  } catch (err) {
    notice = err instanceof NotFoundError ? err.message : "삭제하지 못했어요. 잠시 뒤 다시 시도해 주세요.";
    if (!(err instanceof NotFoundError)) console.error(err);
  }
  revalidatePath("/");
  backTo(date, notice);
}
