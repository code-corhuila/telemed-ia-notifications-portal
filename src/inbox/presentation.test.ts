import type { InboxNotification, InboxNotificationType, InboxSubject } from './inbox-types';
import { groupByDay, presentNotification } from './presentation';

// Monday 26 October 2026, 10:00 in Bogotá (UTC-5).
const NOW = new Date('2026-10-26T15:00:00Z');
const TIME_ZONE = 'America/Bogota';
const PATIENT = { now: NOW, role: 'PATIENT', timeZone: TIME_ZONE };
const PROFESSIONAL = { now: NOW, role: 'PROFESSIONAL', timeZone: TIME_ZONE };

let sequence = 0;

function notification(
  type: InboxNotificationType,
  overrides: { at?: string | null; subject?: InboxSubject | null; createdAt?: string; read?: boolean } = {},
): InboxNotification {
  sequence += 1;
  const subjectType = type === 'DOCUMENT_READY' ? 'DOCUMENT' : 'APPOINTMENT';
  return {
    id: `00000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`,
    type,
    subject:
      overrides.subject !== undefined
        ? overrides.subject
        : { type: subjectType, id: '11111111-1111-4111-8111-111111111111', at: overrides.at ?? null },
    read: overrides.read ?? false,
    readAt: null,
    createdAt: overrides.createdAt ?? '2026-10-26T14:55:00Z',
  };
}

describe('presentNotification', () => {
  describe('for a patient', () => {
    it.each([
      ['APPOINTMENT_CONFIRMED', '2026-10-28T15:00:00Z', 'Tu cita fue confirmada', 'Miércoles 28 de octubre · 10:00 a. m.', 'Ver cita'],
      ['APPOINTMENT_RESCHEDULED', '2026-10-30T20:30:00Z', 'Tu cita fue reprogramada', 'Nueva fecha: viernes 30 de octubre · 3:30 p. m.', 'Ver cita'],
      ['APPOINTMENT_CANCELLED', '2026-11-02T16:00:00Z', 'Tu cita fue cancelada', 'Era el lunes 2 de noviembre · 11:00 a. m.', 'Ver mis citas'],
    ] as const)('describes %s', (type, at, title, detail, actionLabel) => {
      const view = presentNotification(notification(type, { at }), PATIENT);

      expect(view).toMatchObject({ title, detail, actionLabel, target: '/appointment' });
    });

    it.each([
      ['2026-10-26T20:00:00Z', 'Tu cita es hoy', 'Lunes 26 de octubre · 3:00 p. m.'],
      ['2026-10-27T14:00:00Z', 'Tu cita es mañana', 'Martes 27 de octubre · 9:00 a. m.'],
      ['2026-10-29T14:00:00Z', 'Recordatorio de tu cita', 'Jueves 29 de octubre · 9:00 a. m.'],
    ])('reminds of the appointment at %s', (at, title, detail) => {
      const view = presentNotification(notification('APPOINTMENT_REMINDER', { at }), PATIENT);

      expect(view).toMatchObject({ title, detail, actionLabel: 'Ver cita', target: '/appointment' });
    });

    it('sends a ready document to the documents page, never to a file', () => {
      const view = presentNotification(notification('DOCUMENT_READY', { at: '2026-10-26T14:00:00Z' }), PATIENT);

      expect(view).toMatchObject({
        title: 'El resumen de tu consulta está listo',
        detail: 'Ya puedes verlo y descargarlo en tus documentos.',
        actionLabel: 'Ver documento',
        target: '/documents',
      });
    });

    it.each([null, undefined])('falls back when the appointment time is %s', (at) => {
      const subject = at === null ? null : { type: 'APPOINTMENT' as const, id: '11111111-1111-4111-8111-111111111111', at: null };
      const view = presentNotification(notification('APPOINTMENT_REMINDER', { subject }), PATIENT);

      expect(view).toMatchObject({ title: 'Recordatorio de tu cita', detail: 'Revisa los detalles en tus citas.' });
    });
  });

  describe('for a professional', () => {
    it.each([
      ['APPOINTMENT_CONFIRMED', 'Tienes una nueva cita'],
      ['APPOINTMENT_RESCHEDULED', 'Una cita fue reprogramada'],
      ['APPOINTMENT_CANCELLED', 'Una cita fue cancelada'],
    ] as const)('describes %s and opens the agenda', (type, title) => {
      const view = presentNotification(notification(type, { at: '2026-10-28T15:00:00Z' }), PROFESSIONAL);

      expect(view).toMatchObject({ title, actionLabel: 'Ver mi agenda', target: '/appointment/professional' });
    });

    it('reminds of tomorrow and falls back to the agenda copy', () => {
      expect(presentNotification(notification('APPOINTMENT_REMINDER', { at: '2026-10-27T14:00:00Z' }), PROFESSIONAL).title)
        .toBe('Tienes una cita mañana');
      expect(presentNotification(notification('APPOINTMENT_CONFIRMED', { subject: null }), PROFESSIONAL).detail)
        .toBe('Revisa los detalles en tu agenda.');
    });
  });

  it('keeps the id, the type and whether it is unread', () => {
    const source = notification('APPOINTMENT_CONFIRMED', { read: true });

    expect(presentNotification(source, PATIENT)).toMatchObject({ id: source.id, type: source.type, unread: false });
    expect(presentNotification(notification('DOCUMENT_READY'), PATIENT).unread).toBe(true);
  });

  it.each([
    ['2026-10-26T14:59:40Z', 'Ahora'],
    ['2026-10-26T15:02:00Z', 'Ahora'],
    ['2026-10-26T14:55:00Z', 'Hace 5 min'],
    ['2026-10-26T14:00:00Z', 'Hace 1 h'],
    ['2026-10-26T10:01:00Z', 'Hace 4 h'],
    ['2026-10-26T08:00:00Z', '3:00 a. m.'],
    ['2026-10-20T21:18:00Z', '4:18 p. m.'],
  ])('tells when %s was', (createdAt, time) => {
    expect(presentNotification(notification('DOCUMENT_READY', { createdAt }), PATIENT).time).toBe(time);
  });
});

describe('groupByDay', () => {
  it('groups in the order given, by the local calendar day', () => {
    const today = notification('DOCUMENT_READY', { createdAt: '2026-10-26T05:30:00Z' });
    const lateYesterday = notification('DOCUMENT_READY', { createdAt: '2026-10-26T04:30:00Z' });
    const yesterday = notification('DOCUMENT_READY', { createdAt: '2026-10-25T15:00:00Z' });
    const lastWeek = notification('DOCUMENT_READY', { createdAt: '2026-10-20T21:18:00Z' });
    const lastYear = notification('DOCUMENT_READY', { createdAt: '2025-12-31T15:00:00Z' });

    const groups = groupByDay([today, lateYesterday, yesterday, lastWeek, lastYear], { now: NOW, timeZone: TIME_ZONE });

    expect(groups).toEqual([
      { label: 'Hoy', items: [today] },
      { label: 'Ayer', items: [lateYesterday, yesterday] },
      { label: 'Martes 20 de octubre', items: [lastWeek] },
      { label: 'Miércoles 31 de diciembre de 2025', items: [lastYear] },
    ]);
  });

  it('returns no groups for no notifications', () => {
    expect(groupByDay([], { now: NOW, timeZone: TIME_ZONE })).toEqual([]);
  });
});
