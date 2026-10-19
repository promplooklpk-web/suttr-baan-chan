import { buildWeekDays } from '@/lib/mealPlanStorage';
import { addWeeksLocal } from '@/utils/localDate';

describe('meal plan week helpers', () => {
  beforeAll(() => {
    process.env.TZ = 'Asia/Bangkok';
  });

  it('buildWeekDays aligns to Monday for 19 Oct 2026', () => {
    const days = buildWeekDays('2026-10-19');
    expect(days[0].date).toBe('2026-10-19');
    expect(days[6].date).toBe('2026-10-25');
  });

  it('addWeeksLocal moves exactly 7 days per week', () => {
    expect(addWeeksLocal('2026-10-19', 1)).toBe('2026-10-26');
    expect(addWeeksLocal('2026-10-19', -1)).toBe('2026-10-12');
  });
});
