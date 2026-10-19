/** Calendar dates in the device local timezone (never use toISOString for YYYY-MM-DD). */

export function localDateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseLocalDateIso(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map((n) => Number(n));
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

export function todayLocalIso(now = new Date()): string {
  return localDateToIso(now);
}

/** Monday 00:00 local for the week containing `d`. */
export function startOfWeekMondayLocal(d: Date): Date {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function weekStartIsoForDate(isoDate: string): string {
  return localDateToIso(startOfWeekMondayLocal(parseLocalDateIso(isoDate)));
}

export function addDaysLocal(isoDate: string, days: number): string {
  const d = parseLocalDateIso(isoDate);
  d.setDate(d.getDate() + days);
  return localDateToIso(d);
}

export function addWeeksLocal(isoWeekStart: string, weeks: number): string {
  return addDaysLocal(isoWeekStart, weeks * 7);
}

export function daysBetweenLocal(fromIso: string, toIso: string): number {
  const a = parseLocalDateIso(fromIso).getTime();
  const b = parseLocalDateIso(toIso).getTime();
  return Math.round((b - a) / 86400000);
}

export function buildWeekDayIsos(anchor: Date | string): string[] {
  const start =
    typeof anchor === 'string'
      ? startOfWeekMondayLocal(parseLocalDateIso(anchor))
      : startOfWeekMondayLocal(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return localDateToIso(d);
  });
}
