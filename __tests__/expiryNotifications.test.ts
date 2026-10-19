import { buildExpiryNotificationBody } from '@/lib/expiryNotifications';

describe('buildExpiryNotificationBody', () => {
  it('lists items nearing expiry for a specific day', () => {
    const body = buildExpiryNotificationBody(
      [
        {
          id: '1',
          name: 'นม',
          quantity: 1,
          unit: 'ลิตร',
          place: 'chilled',
          expiresAt: '2026-10-21',
          addedAt: '',
          updatedAt: '',
        },
      ],
      3,
      '2026-10-19',
    );
    expect(body).toContain('ใกล้หมดอายุ');
    expect(body).toContain('นม');
  });

  it('returns null when nothing is expiring for that day', () => {
    expect(buildExpiryNotificationBody([], 3, '2026-10-19')).toBeNull();
    const body = buildExpiryNotificationBody(
      [
        {
          id: '1',
          name: 'นม',
          quantity: 1,
          unit: 'ลิตร',
          place: 'chilled',
          expiresAt: '2026-11-01',
          addedAt: '',
          updatedAt: '',
        },
      ],
      3,
      '2026-10-19',
    );
    expect(body).toBeNull();
  });

  it('uses different counts per future day', () => {
    const items = [
      {
        id: '1',
        name: 'นม',
        quantity: 1,
        unit: 'ลิตร',
        place: 'chilled' as const,
        expiresAt: '2026-10-20',
        addedAt: '',
        updatedAt: '',
      },
    ];
    expect(buildExpiryNotificationBody(items, 3, '2026-10-19')).toContain('นม');
    const far = [{ ...items[0], expiresAt: '2026-10-25' }];
    expect(buildExpiryNotificationBody(far, 3, '2026-10-19')).toBeNull();
  });
});
