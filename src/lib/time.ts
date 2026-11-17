export const TIME_ZONE = "Asia/Seoul";

/** 한국 시간 기준 오늘 날짜 (YYYY-MM-DD) */
export function todayInSeoul(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** 한국 시간 기준 현재 시각 (HH:MM) */
export function nowTimeInSeoul(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
}

export function isValidDate(value: string | undefined | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function isValidTime(value: string | undefined | null): value is string {
  return !!value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 2026-11-17 → 11월 17일 (화) */
export function formatDateKo(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getUTCDay()];
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${weekday})`;
}

/** ISO 시각 → 한국 시간 HH:MM */
export function formatClock(iso: string | null): string {
  if (!iso) return "";
  return nowTimeInSeoul(new Date(iso));
}

/** "09:00:00" → "09:00" */
export function normalizeTime(value: string): string {
  return value.slice(0, 5);
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && aEnd > bStart;
}
