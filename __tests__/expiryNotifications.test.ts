import { buildExpiryNotificationBody } from '@/lib/expiryNotifications';

describe('buildExpiryNotificationBody', () => {
  it('lists items nearing expiry', () => {
    const body = buildExpiryNotificationBody(
      [
        {
          id: '1',
          name: 'นม',
          quantity: 1,
          unit: 'ลิตร',
          place: 'chilled',
          expiresAt: '2026-10-20',
          addedAt: '',
          updatedAt: '',
        },
      ],
      3,
    );
    expect(body).toContain('ใกล้หมดอายุ');
    expect(body).toContain('นม');
  });

  it('reports when nothing is expiring soon', () => {
    const body = buildExpiryNotificationBody([], 3);
    expect(body).toContain('ไม่มีของใกล้หมดอายุ');
  });
});
