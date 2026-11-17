import type { Reservation, ReservationInput, Room, StatusAction } from "../types";

export interface Store {
  listRooms(): Promise<Room[]>;
  listReservations(date: string): Promise<Reservation[]>;
  getReservation(id: number): Promise<Reservation | null>;
  /** 같은 특별실·시간 겹침이면 ConflictError */
  createReservation(input: ReservationInput): Promise<Reservation>;
  updateReservation(id: number, input: ReservationInput): Promise<Reservation>;
  deleteReservation(id: number): Promise<void>;
  /** 상태 변경. 현재 상태에서 할 수 없는 변경이면 StateError */
  changeStatus(id: number, action: StatusAction): Promise<Reservation>;
}

export const DEFAULT_ROOMS = ["체육관", "시청각실", "컴퓨터실", "과학실", "음악실", "놀이실"];

/** 상태 전이 규칙: 예약됨 → 사용 중 → 사용 완료, 예약됨 → 미사용 */
export const TRANSITIONS: Record<StatusAction, { from: Reservation["status"]; to: Reservation["status"] }> = {
  start: { from: "reserved", to: "in_use" },
  unused: { from: "reserved", to: "unused" },
  end: { from: "in_use", to: "done" },
};

/**
 * 시간 겹침 검사에 포함하는 상태. '미사용'과 '사용 완료'는 그 시간이 비었다는 뜻이라
 * 다른 교사가 같은 시간(남은 시간)을 새로 예약할 수 있다.
 */
export const BLOCKING: Reservation["status"][] = ["reserved", "in_use"];
