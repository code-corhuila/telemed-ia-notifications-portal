/**
 * The inbox page; its list arrives with the data layer.
 *
 * A section, not a main: the shell layout already owns the main landmark.
 */
export function NotificationsPage() {
  return (
    <section aria-labelledby="notifications-title">
      <h1 id="notifications-title">Notifications</h1>
    </section>
  );
}
