export type ReservationStatus = "reserved" | "in_use" | "done" | "unused";

export const STATUS_LABEL: Record<ReservationStatus, string> = {
  reserved: "예약됨",
  in_use: "사용 중",
  done: "사용 완료",
  unused: "미사용",
};

/** 특별실 */
export interface Room {
  id: number;
  name: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 예약 및 사용 기록 */
export interface Reservation {
  id: number;
  roomId: number;
  useDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  purpose: string;
  roleLabel: string; // 직책 표시 (신원 확인 정보 아님)
  status: ReservationStatus;
  actualStartAt: string | null; // ISO
  actualEndAt: string | null; // ISO
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationInput {
  roomId: number;
  useDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  roleLabel: string;
}

export type StatusAction = "start" | "unused" | "end";

export class ConflictError extends Error {
  constructor(message = "같은 특별실에 시간이 겹치는 예약이 있어요.") {
    super(message);
    this.name = "ConflictError";
  }
}

export class StateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StateError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "예약을 찾을 수 없어요. 이미 삭제되었을 수 있어요.") {
    super(message);
    this.name = "NotFoundError";
  }
}
