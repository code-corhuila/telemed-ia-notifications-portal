/**
 * The page styles, rendered in a <style> inside the page: the shell does not
 * load a remote's global CSS. Every rule sits under .tn-inbox so nothing leaks
 * into the shell. Tokens follow the Corte 1 design (approved mockup).
 */
export const INBOX_STYLES = `
.tn-inbox {
  --tn-primary: #2c7be5;
  --tn-link: #1e5fc0;
  --tn-navy: #172b4d;
  --tn-text: #26364d;
  --tn-muted: #56677f;
  --tn-faint: #68788f;
  --tn-border: #e4eaf2;
  --tn-unread: #f5f9ff;
  --tn-shadow: 0 12px 34px rgba(23, 43, 77, .06);
  max-width: 880px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
  font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tn-text);
}
.tn-inbox *, .tn-inbox *::before, .tn-inbox *::after { box-sizing: border-box; }
.tn-inbox button { font-family: inherit; line-height: 1.2; cursor: pointer; }
.tn-inbox button:disabled { cursor: not-allowed; }
.tn-inbox button:focus-visible { outline: 3px solid #9cc3f5; outline-offset: 2px; }
.tn-inbox p, .tn-inbox h1, .tn-inbox h2, .tn-inbox ul { margin: 0; }

.tn-header { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 20px; }
.tn-title { font-size: 32px; line-height: 1.15; font-weight: 700; letter-spacing: -0.02em; color: var(--tn-navy); }
.tn-summary { margin-top: 6px; font-size: 15px; color: var(--tn-muted); }
.tn-mark-all {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 0 18px;
  border: 1px solid var(--tn-primary); border-radius: 12px; background: var(--tn-primary); color: #fff;
  font-size: 14px; font-weight: 600; box-shadow: 0 6px 16px rgba(44, 123, 229, .22);
}
.tn-mark-all:disabled { border-color: var(--tn-border); background: #f5f7fa; color: #8a97a8; box-shadow: none; }

.tn-filters { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; }
.tn-segmented { display: inline-flex; gap: 4px; padding: 4px; border-radius: 999px; background: #e9eef5; }
.tn-segment {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 40px; padding: 0 18px;
  border: 0; border-radius: 999px; background: transparent; color: var(--tn-muted); font-size: 14px; font-weight: 600;
}
.tn-segment[aria-pressed="true"] { background: #fff; color: var(--tn-navy); box-shadow: 0 1px 3px rgba(23, 43, 77, .14); }
.tn-badge {
  min-width: 22px; height: 22px; padding: 0 7px; border-radius: 999px; display: inline-flex; align-items: center;
  justify-content: center; background: var(--tn-primary); color: #fff; font-size: 12px; font-weight: 700;
}
.tn-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.tn-chip {
  min-height: 40px; padding: 0 16px; border: 1px solid #d5dfec; border-radius: 999px; background: #fff;
  color: var(--tn-text); font-size: 14px; font-weight: 500; white-space: nowrap;
}
.tn-chip[aria-pressed="true"] { border-color: var(--tn-navy); background: var(--tn-navy); color: #fff; }

.tn-group { display: flex; flex-direction: column; gap: 12px; }
.tn-day { padding: 0 4px; font-size: 14px; font-weight: 600; color: var(--tn-muted); }
.tn-list {
  list-style: none; padding: 0; overflow: hidden; background: #fff; border: 1px solid var(--tn-border);
  border-radius: 14px; box-shadow: var(--tn-shadow);
}
.tn-item { display: flex; align-items: flex-start; gap: 16px; padding: 18px 22px 10px; background: #fff; }
.tn-item + .tn-item { border-top: 1px solid #eef2f7; }
.tn-item--unread { background: var(--tn-unread); }
.tn-icon { flex: none; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.tn-icon--APPOINTMENT_CONFIRMED { color: #1d7a46; background: #e6f6ec; }
.tn-icon--APPOINTMENT_RESCHEDULED { color: #1e5fc0; background: #e8f1fd; }
.tn-icon--APPOINTMENT_CANCELLED { color: #b3261e; background: #fdecea; }
.tn-icon--APPOINTMENT_REMINDER { color: #9a5b00; background: #fff3dc; }
.tn-icon--DOCUMENT_READY { color: #5b3fc4; background: #efebff; }
.tn-body { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.tn-row { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
.tn-item-title { font-size: 15px; line-height: 1.4; font-weight: 500; color: var(--tn-navy); }
.tn-item--unread .tn-item-title { font-weight: 650; }
.tn-time { flex: none; font-size: 13px; color: var(--tn-faint); }
.tn-detail { font-size: 14px; line-height: 1.5; color: #4a5a70; }
.tn-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 20px; margin-top: 2px; }
.tn-action, .tn-read {
  display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0; border: 0; background: none;
  font-size: 14px;
}
.tn-action { color: var(--tn-link); font-weight: 600; }
.tn-read { color: var(--tn-muted); font-weight: 500; }
.tn-dot { flex: none; width: 10px; height: 10px; margin-top: 8px; border-radius: 50%; background: var(--tn-primary); }
.tn-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

.tn-primary, .tn-secondary {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 0 22px;
  border-radius: 999px; font-size: 14px; font-weight: 600;
}
.tn-primary { border: 1px solid var(--tn-primary); background: var(--tn-primary); color: #fff; }
.tn-secondary { border: 1px solid #c9d6e8; background: #fff; color: var(--tn-navy); }
.tn-secondary:disabled { color: var(--tn-faint); }

.tn-shimmer {
  display: block; border-radius: 12px;
  background: linear-gradient(90deg, #edf1f6 0, #f6f8fb 50%, #edf1f6 100%); background-size: 640px 100%;
  animation: tn-shimmer 1.4s linear infinite;
}
.tn-bar { height: 12px; border-radius: 6px; }
.tn-skeleton .tn-body { gap: 10px; padding: 4px 0 12px; }
@keyframes tn-shimmer { from { background-position: -320px 0; } to { background-position: 320px 0; } }
@media (prefers-reduced-motion: reduce) { .tn-shimmer { animation: none; } }

.tn-state {
  display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 48px 32px; text-align: center;
  background: #fff; border: 1px solid var(--tn-border); border-radius: 14px; box-shadow: var(--tn-shadow);
}
.tn-state--error { border-color: #f3c7c3; }
.tn-state-icon {
  width: 88px; height: 88px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  background: #eef5ff; color: var(--tn-primary);
}
.tn-state--error .tn-state-icon { border-radius: 24px; background: #fdecea; color: #b3261e; }
.tn-state-title { font-size: 18px; font-weight: 600; color: var(--tn-navy); }
.tn-state-text { max-width: 360px; font-size: 15px; line-height: 1.5; color: var(--tn-muted); }
.tn-reference { font-size: 12px; color: var(--tn-faint); overflow-wrap: anywhere; }

.tn-notice {
  display: flex; align-items: center; gap: 12px; padding: 8px 8px 8px 16px; border-radius: 12px;
  background: #fdecea; color: #8c1d18; font-size: 14px;
}
.tn-notice p { flex: 1; }
.tn-notice-close {
  flex: none; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
  border: 0; border-radius: 10px; background: transparent; color: inherit;
}

.tn-more { display: flex; flex-direction: column; align-items: center; gap: 12px; font-size: 14px; color: var(--tn-muted); }

@media (max-width: 640px) {
  .tn-inbox { gap: 20px; }
  .tn-title { font-size: 26px; }
  .tn-header > * { flex: 1 1 100%; }
  .tn-segmented { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; }
  .tn-chips { flex-wrap: nowrap; overflow-x: auto; margin: 0 -16px; padding: 0 16px 4px; }
  .tn-chip { flex: none; }
  .tn-item { gap: 12px; padding: 16px 16px 8px; }
  .tn-icon { width: 40px; height: 40px; }
}
`;
