import {
  addDaysLocal,
  buildWeekDayIsos,
  daysBetweenLocal,
  localDateToIso,
  parseLocalDateIso,
  startOfWeekMondayLocal,
  todayLocalIso,
  weekStartIsoForDate,
} from '@/utils/localDate';

describe('localDate (Asia/Bangkok)', () => {
  const TZ = 'Asia/Bangkok';

  beforeAll(() => {
    process.env.TZ = TZ;
  });

  it('todayLocalIso at 01:30 is the local calendar day', () => {
    const d = new Date('2026-10-20T01:30:00+07:00');
    expect(todayLocalIso(d)).toBe('2026-10-20');
  });

  it('todayLocalIso at 23:30 is still the same local day', () => {
    const d = new Date('2026-10-19T23:30:00+07:00');
    expect(todayLocalIso(d)).toBe('2026-10-19');
  });

  it('week starts Monday for Sunday anchor', () => {
    const sun = parseLocalDateIso('2026-10-18');
    expect(localDateToIso(startOfWeekMondayLocal(sun))).toBe('2026-10-12');
  });

  it('buildWeekDayIsos for Mon 19 Oct 2026', () => {
    const days = buildWeekDayIsos('2026-10-19');
    expect(days).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ]);
  });

  it('addDaysLocal +3 from 20 Oct at 01:30 context', () => {
    const now = new Date('2026-10-20T01:30:00+07:00');
    expect(addDaysLocal(todayLocalIso(now), 3)).toBe('2026-10-23');
    expect(daysBetweenLocal(todayLocalIso(now), '2026-10-23')).toBe(3);
  });

  it('weekStartIsoForDate maps Tuesday to its Monday', () => {
    expect(weekStartIsoForDate('2026-10-20')).toBe('2026-10-19');
  });
});
