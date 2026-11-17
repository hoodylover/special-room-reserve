import { promises as fs } from "fs";
import path from "path";
import { overlaps } from "../time";
import {
  ConflictError,
  NotFoundError,
  StateError,
  type Reservation,
  type ReservationInput,
  type Room,
  type StatusAction,
} from "../types";
import { BLOCKING, DEFAULT_ROOMS, TRANSITIONS, type Store } from "./types";

/**
 * 로컬 개발용 저장소. Supabase 환경변수가 없을 때만 쓰인다.
 * 서버리스(Vercel)에서는 파일이 유지되지 않으므로 배포에는 Supabase를 쓴다.
 */
interface Db {
  seq: { room: number; reservation: number };
  rooms: Room[];
  reservations: Reservation[];
}

const DB_PATH = process.env.LOCAL_DB_PATH ?? path.join(process.cwd(), ".data", "dev-db.json");

let queue: Promise<unknown> = Promise.resolve();
function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function load(): Promise<Db> {
  try {
    return JSON.parse(await fs.readFile(DB_PATH, "utf8")) as Db;
  } catch {
    const now = new Date().toISOString();
    const rooms = DEFAULT_ROOMS.map((name, i) => ({
      id: i + 1,
      name,
      createdBy: "초기 설정",
      createdAt: now,
      updatedAt: now,
    }));
    const db: Db = { seq: { room: rooms.length, reservation: 0 }, rooms, reservations: [] };
    await save(db);
    return db;
  }
}

async function save(db: Db) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

function assertNoOverlap(db: Db, input: ReservationInput, ignoreId?: number) {
  const clash = db.reservations.find(
    (r) =>
      r.id !== ignoreId &&
      r.roomId === input.roomId &&
      r.useDate === input.useDate &&
      BLOCKING.includes(r.status) &&
      overlaps(r.startTime, r.endTime, input.startTime, input.endTime),
  );
  if (clash) {
    throw new ConflictError(
      `같은 특별실에 ${clash.startTime}~${clash.endTime} 예약(${clash.roleLabel})이 있어 시간이 겹쳐요.`,
    );
  }
}

export const fileStore: Store = {
  async listRooms() {
    return (await load()).rooms.sort((a, b) => a.id - b.id);
  },
  async listReservations(date) {
    return (await load()).reservations
      .filter((r) => r.useDate === date)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  },
  async getReservation(id) {
    return (await load()).reservations.find((r) => r.id === id) ?? null;
  },
  createReservation(input) {
    return serialized(async () => {
      const db = await load();
      if (!db.rooms.some((r) => r.id === input.roomId)) throw new NotFoundError("특별실을 찾을 수 없어요.");
      assertNoOverlap(db, input);
      const now = new Date().toISOString();
      const rec: Reservation = {
        id: ++db.seq.reservation,
        ...input,
        status: "reserved",
        actualStartAt: null,
        actualEndAt: null,
        createdBy: input.roleLabel,
        createdAt: now,
        updatedAt: now,
      };
      db.reservations.push(rec);
      await save(db);
      return rec;
    });
  },
  updateReservation(id, input) {
    return serialized(async () => {
      const db = await load();
      const rec = db.reservations.find((r) => r.id === id);
      if (!rec) throw new NotFoundError();
      if (BLOCKING.includes(rec.status)) assertNoOverlap(db, input, id);
      Object.assign(rec, input, { updatedAt: new Date().toISOString() });
      await save(db);
      return rec;
    });
  },
  deleteReservation(id) {
    return serialized(async () => {
      const db = await load();
      const before = db.reservations.length;
      db.reservations = db.reservations.filter((r) => r.id !== id);
      if (db.reservations.length === before) throw new NotFoundError();
      await save(db);
    });
  },
  changeStatus(id, action: StatusAction) {
    return serialized(async () => {
      const db = await load();
      const rec = db.reservations.find((r) => r.id === id);
      if (!rec) throw new NotFoundError();
      const t = TRANSITIONS[action];
      if (rec.status !== t.from) throw new StateError("다른 선생님이 먼저 상태를 바꿨어요. 화면을 새로 고쳤어요.");
      const now = new Date().toISOString();
      rec.status = t.to;
      if (action === "start") rec.actualStartAt = now;
      if (action === "end") rec.actualEndAt = now;
      rec.updatedAt = now;
      await save(db);
      return rec;
    });
  },
};
