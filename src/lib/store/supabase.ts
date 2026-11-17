import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizeTime } from "../time";
import {
  ConflictError,
  NotFoundError,
  StateError,
  type Reservation,
  type ReservationInput,
  type Room,
} from "../types";
import { BLOCKING, TRANSITIONS, type Store } from "./types";

type RoomRow = { id: number; name: string; created_by: string | null; created_at: string; updated_at: string };
type ReservationRow = {
  id: number;
  room_id: number;
  use_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  role_label: string;
  status: Reservation["status"];
  actual_start_at: string | null;
  actual_end_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const toRoom = (r: RoomRow): Room => ({
  id: r.id,
  name: r.name,
  createdBy: r.created_by,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toReservation = (r: ReservationRow): Reservation => ({
  id: r.id,
  roomId: r.room_id,
  useDate: r.use_date,
  startTime: normalizeTime(r.start_time),
  endTime: normalizeTime(r.end_time),
  purpose: r.purpose,
  roleLabel: r.role_label,
  status: r.status,
  actualStartAt: r.actual_start_at,
  actualEndAt: r.actual_end_at,
  createdBy: r.created_by,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/** Postgres 오류를 앱 오류로 바꾼다. 23P01 = exclusion constraint(시간 겹침) */
function raise(error: { code?: string; message: string }): never {
  if (error.code === "23P01") throw new ConflictError();
  throw new Error(error.message);
}

export function createSupabaseStore(url: string, key: string): Store {
  const db: SupabaseClient = createClient(url, key, { auth: { persistSession: false } });

  /** 친절한 안내용 사전 검사. 동시에 저장하는 경우는 DB 제약(23P01)이 막는다. */
  async function assertNoOverlap(input: ReservationInput, ignoreId?: number) {
    let q = db
      .from("reservations")
      .select("*")
      .eq("room_id", input.roomId)
      .eq("use_date", input.useDate)
      .in("status", BLOCKING)
      .lt("start_time", input.endTime)
      .gt("end_time", input.startTime)
      .limit(1);
    if (ignoreId) q = q.neq("id", ignoreId);
    const { data, error } = await q;
    if (error) raise(error);
    const clash = (data as ReservationRow[])[0];
    if (clash) {
      const c = toReservation(clash);
      throw new ConflictError(`같은 특별실에 ${c.startTime}~${c.endTime} 예약(${c.roleLabel})이 있어 시간이 겹쳐요.`);
    }
  }

  return {
    async listRooms() {
      const { data, error } = await db.from("rooms").select("*").order("id");
      if (error) raise(error);
      return (data as RoomRow[]).map(toRoom);
    },
    async listReservations(date) {
      const { data, error } = await db
        .from("reservations")
        .select("*")
        .eq("use_date", date)
        .order("start_time");
      if (error) raise(error);
      return (data as ReservationRow[]).map(toReservation);
    },
    async getReservation(id) {
      const { data, error } = await db.from("reservations").select("*").eq("id", id).maybeSingle();
      if (error) raise(error);
      return data ? toReservation(data as ReservationRow) : null;
    },
    async createReservation(input) {
      await assertNoOverlap(input);
      const { data, error } = await db
        .from("reservations")
        .insert({
          room_id: input.roomId,
          use_date: input.useDate,
          start_time: input.startTime,
          end_time: input.endTime,
          purpose: input.purpose,
          role_label: input.roleLabel,
          created_by: input.roleLabel,
        })
        .select()
        .single();
      if (error) raise(error);
      return toReservation(data as ReservationRow);
    },
    async updateReservation(id, input) {
      const current = await this.getReservation(id);
      if (!current) throw new NotFoundError();
      if (BLOCKING.includes(current.status)) await assertNoOverlap(input, id);
      const { data, error } = await db
        .from("reservations")
        .update({
          room_id: input.roomId,
          use_date: input.useDate,
          start_time: input.startTime,
          end_time: input.endTime,
          purpose: input.purpose,
          role_label: input.roleLabel,
        })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) raise(error);
      if (!data) throw new NotFoundError();
      return toReservation(data as ReservationRow);
    },
    async deleteReservation(id) {
      const { data, error } = await db.from("reservations").delete().eq("id", id).select("id");
      if (error) raise(error);
      if (!data || data.length === 0) throw new NotFoundError();
    },
    async changeStatus(id, action) {
      const t = TRANSITIONS[action];
      const now = new Date().toISOString();
      const patch: Record<string, string> = { status: t.to };
      if (action === "start") patch.actual_start_at = now;
      if (action === "end") patch.actual_end_at = now;
      // 현재 상태가 from일 때만 바꾼다 (동시에 누른 경우 한 명만 반영)
      const { data, error } = await db
        .from("reservations")
        .update(patch)
        .eq("id", id)
        .eq("status", t.from)
        .select()
        .maybeSingle();
      if (error) raise(error);
      if (!data) {
        const exists = await this.getReservation(id);
        if (!exists) throw new NotFoundError();
        throw new StateError("다른 선생님이 먼저 상태를 바꿨어요. 화면을 새로 고쳤어요.");
      }
      return toReservation(data as ReservationRow);
    },
  };
}
