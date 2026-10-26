import type { ReactNode } from 'react';

import type { ErrorDescription } from './error-message';
import { Icon } from './notification-item';

const BELL = <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9m4.3 13a1.94 1.94 0 0 0 3.4 0" />;
const FUNNEL = <path d="M3 4h18l-7 8.5V19l-4 2v-8.5z" />;
const WARNING = <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />;
const RETRY = <path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" />;

/** Three placeholder rows; the shimmer stops when the user prefers reduced motion. */
export function InboxSkeleton() {
  return (
    <div className="tn-list tn-skeleton" role="status" aria-busy="true">
      <span className="tn-sr">Cargando notificaciones…</span>
      {[70, 55, 64].map((width) => (
        <div className="tn-item" key={width} aria-hidden="true">
          <span className="tn-icon tn-shimmer" />
          <span className="tn-body">
            <span className="tn-shimmer tn-bar" style={{ width: `${width}%` }} />
            <span className="tn-shimmer tn-bar" style={{ width: '88%' }} />
            <span className="tn-shimmer tn-bar" style={{ width: '32%' }} />
          </span>
        </div>
      ))}
    </div>
  );
}

function StateCard({ icon, title, children, tone }: { icon: ReactNode; title: string; children: ReactNode; tone?: 'error' }) {
  return (
    <div className={tone ? `tn-state tn-state--${tone}` : 'tn-state'} role={tone === 'error' ? 'alert' : undefined}>
      <span className="tn-state-icon">
        <Icon size={36}>{icon}</Icon>
      </span>
      <h2 className="tn-state-title">{title}</h2>
      {children}
    </div>
  );
}

export function EmptyState({ filtered, onShowAll }: { filtered: boolean; onShowAll: () => void }) {
  if (filtered) {
    return (
      <StateCard icon={FUNNEL} title="No hay notificaciones con este filtro">
        <p className="tn-state-text">Prueba con otro tipo o vuelve a verlas todas.</p>
        <button type="button" className="tn-secondary" onClick={onShowAll}>
          Ver todas
        </button>
      </StateCard>
    );
  }
  return (
    <StateCard icon={BELL} title="Aún no tienes notificaciones">
      <p className="tn-state-text">
        Aquí te avisaremos cuando agendes, cambies o canceles una cita, y cuando tus documentos estén listos.
      </p>
    </StateCard>
  );
}

export function ErrorState({ error, onRetry }: { error: ErrorDescription | null; onRetry: () => void }) {
  return (
    <StateCard icon={WARNING} title="No pudimos cargar tus notificaciones" tone="error">
      <p className="tn-state-text">{error?.message}</p>
      <button type="button" className="tn-primary" onClick={onRetry}>
        <Icon size={16}>{RETRY}</Icon>
        Reintentar
      </button>
      {error?.reference && <p className="tn-reference">Referencia para soporte: {error.reference}</p>}
    </StateCard>
  );
}

/** A failed action (mark read, load more): the list stays, the user can close the notice. */
export function ActionNotice({ error, onDismiss }: { error: ErrorDescription; onDismiss: () => void }) {
  return (
    <div className="tn-notice" role="alert">
      <Icon size={18}>{WARNING}</Icon>
      <p>{error.message}</p>
      <button type="button" className="tn-notice-close" aria-label="Cerrar aviso" onClick={onDismiss}>
        <Icon size={18}>
          <path d="M18 6 6 18M6 6l12 12" />
        </Icon>
      </button>
    </div>
  );
}

interface LoadMoreProps {
  readonly shown: number;
  readonly total: number;
  readonly hasMore: boolean;
  readonly loading: boolean;
  readonly onLoadMore: () => void;
}

export function LoadMore({ shown, total, hasMore, loading, onLoadMore }: LoadMoreProps) {
  return (
    <div className="tn-more">
      <p>{`Mostrando ${shown} de ${total} ${total === 1 ? 'notificación' : 'notificaciones'}`}</p>
      {hasMore && (
        <button type="button" className="tn-secondary" aria-busy={loading} disabled={loading} onClick={onLoadMore}>
          {loading ? 'Cargando…' : 'Cargar más'}
        </button>
      )}
    </div>
  );
}
