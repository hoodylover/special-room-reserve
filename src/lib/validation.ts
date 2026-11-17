import { isValidDate, isValidTime } from "./time";
import type { ReservationInput } from "./types";

export type FieldErrors = Partial<Record<keyof ReservationInput | "form", string>>;

export const PURPOSE_MAX = 100;
export const ROLE_MAX = 40;

export function parseReservationForm(form: FormData): {
  values: Record<keyof ReservationInput, string>;
  input: ReservationInput | null;
  errors: FieldErrors;
} {
  const values = {
    roomId: String(form.get("roomId") ?? "").trim(),
    useDate: String(form.get("useDate") ?? "").trim(),
    startTime: String(form.get("startTime") ?? "").trim(),
    endTime: String(form.get("endTime") ?? "").trim(),
    purpose: String(form.get("purpose") ?? "").trim(),
    roleLabel: String(form.get("roleLabel") ?? "").trim(),
  };
  const errors: FieldErrors = {};

  const roomId = Number(values.roomId);
  if (!values.roomId || !Number.isInteger(roomId) || roomId <= 0) errors.roomId = "특별실을 선택해 주세요.";
  if (!values.useDate) errors.useDate = "날짜를 입력해 주세요.";
  else if (!isValidDate(values.useDate)) errors.useDate = "날짜 형식이 올바르지 않아요.";
  if (!values.startTime) errors.startTime = "시작 시각을 입력해 주세요.";
  else if (!isValidTime(values.startTime)) errors.startTime = "시각 형식이 올바르지 않아요.";
  if (!values.endTime) errors.endTime = "종료 시각을 입력해 주세요.";
  else if (!isValidTime(values.endTime)) errors.endTime = "시각 형식이 올바르지 않아요.";
  if (!errors.startTime && !errors.endTime && values.startTime >= values.endTime) {
    errors.endTime = "종료 시각은 시작 시각보다 늦어야 해요.";
  }
  if (!values.purpose) errors.purpose = "사용 목적을 입력해 주세요.";
  else if (values.purpose.length > PURPOSE_MAX) errors.purpose = `사용 목적은 ${PURPOSE_MAX}자 이내로 입력해 주세요.`;
  if (!values.roleLabel) errors.roleLabel = "직책 표시를 입력해 주세요.";
  else if (values.roleLabel.length > ROLE_MAX) errors.roleLabel = `직책 표시는 ${ROLE_MAX}자 이내로 입력해 주세요.`;

  const input =
    Object.keys(errors).length === 0
      ? { ...values, roomId }
      : null;
  return { values, input, errors };
}
