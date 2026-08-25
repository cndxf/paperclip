// Optional Sentry error monitoring for the browser.
//
// Activated only when the signed-in session carries a Sentry DSN. `SentryGate`
// reads the DSN off `GET /api/auth/get-session` and calls
// `initBrowserErrorMonitoring` once. A signed-out browser, or a browser with
// no DSN, calls this module never — see `SentryGate.tsx`.
//
// Sign-out must stop monitoring, not just stop starting it: `SentryGate`
// calls `teardownBrowserErrorMonitoring` when the session's DSN goes away,
// which closes the running client (`Sentry.close`) and detaches it from the
// current scope (`Sentry.getCurrentScope().setClient(undefined)`), so the
// global handlers `Sentry.init` installed send no more events. Both are
// built-in Sentry client calls — no custom filter code.
//
// State lives in one `current` session record, not in separate module
// variables, so a sign-out that races a fast sign-back-in cannot mix up the
// two sessions. `teardownBrowserErrorMonitoring` swaps `current` to `null`
// before it awaits anything, so the next `initBrowserErrorMonitoring` call
// starts its own session record right away. A bootstrap still in flight for
// the old session checks, once the dynamic import resolves, whether it is
// still `current`; a superseded bootstrap closes the client it just started
// instead of publishing it, so it can never leak into the new session.
//
// `@sentry/browser` loads through a dynamic import, so Vite puts it in a
// separate chunk that a browser with no DSN never fetches.
//
// Default-integration privacy note: two default integrations copy values
// this app does not want inside a Sentry event, so the initializer removes
// them with a built-in Sentry option — no custom filter code:
//   - `Breadcrumbs` turns a console call, a click, and a fetch call into a
//     breadcrumb with the raw arguments and the raw request URL.
//   - `HttpContext` copies the page URL, the query string, and the referrer
//     onto every event.
// The initializer keeps every other default integration, so the browser
// still captures `window.onerror` and `window.onunhandledrejection`
// (`GlobalHandlers`), the two React error boundaries, deduplicates a repeat
// event (`Dedupe`), and links a caused-by chain (`LinkedErrors`).

/** The subset of the `@sentry/browser` client surface this gate calls. */
interface SentryHandle {
  captureException(error: unknown): string;
}

/** The subset of the `@sentry/browser` module surface teardown calls. */
interface SentryModuleHandle {
  close(timeout?: number): Promise<boolean>;
  getCurrentScope(): { setClient(client: undefined): void };
}

/** One sign-in's worth of browser Sentry state. */
interface SentrySession {
  ready: Promise<void>;
  handle: SentryHandle | null;
  sentryModule: SentryModuleHandle | null;
}

let current: SentrySession | null = null;

/**
 * Load `@sentry/browser` and start the client with the given DSN. Idempotent
 * — the session query can refetch and call this again, and a second call
 * returns the first call's promise instead of starting a second client.
 */
export function initBrowserErrorMonitoring(dsn: string): Promise<void> {
  if (current) return current.ready;
  const session: SentrySession = { ready: Promise.resolve(), handle: null, sentryModule: null };
  session.ready = bootstrapBrowserSentry(dsn, session);
  current = session;
  return session.ready;
}

/**
 * Stop browser error monitoring and forget the started client. Call this on
 * sign-out, so the browser sends Sentry no more events and no more
 * breadcrumbs after the session ends.
 *
 * A no-op when monitoring never started. Detaches `current` from the module
 * before it awaits anything, so a sign-back-in that races this call starts
 * its own session record right away instead of reusing this one's promise.
 * See `bootstrapBrowserSentry` for the other half of that guard: a bootstrap
 * still in flight for the session torn down here closes the client it just
 * started rather than publish it once it notices it is no longer `current`.
 */
export async function teardownBrowserErrorMonitoring(): Promise<void> {
  const session = current;
  current = null;
  if (!session) return;
  await session.ready;
  if (!session.sentryModule) return;
  try {
    await session.sentryModule.close(2_000);
    session.sentryModule.getCurrentScope().setClient(undefined);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[paperclip] Sentry teardownBrowserErrorMonitoring failed", err);
  }
}

/**
 * Report an error to Sentry. Waits for `initBrowserErrorMonitoring` to
 * settle, so a call that races the dynamic import still reaches the client.
 * A no-op before the gate opens, when the gate never opens (no DSN on the
 * session), when bootstrap failed, or when a teardown superseded the session
 * this call started against. Never throws — observability must not change
 * control flow.
 */
export function captureBrowserException(error: unknown): void {
  void reportWhenReady(error);
}

async function reportWhenReady(error: unknown): Promise<void> {
  const session = current;
  if (!session) return;
  await session.ready;
  if (current !== session || !session.handle) return;
  try {
    session.handle.captureException(error);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[paperclip] Sentry captureBrowserException failed", err);
  }
}

/**
 * Build the `Sentry.init` options object. A pure function, split out from
 * `bootstrapBrowserSentry` so a test can call it with the real
 * `@sentry/browser` module and assert the resolved integration list and the
 * captured-event shape against the true SDK, not a stand-in.
 */
export function buildBrowserSentryInitOptions(dsn: string): Record<string, unknown> {
  return {
    dsn,
    tracesSampleRate: 0,
    sendDefaultPii: false,
    integrations: (defaults: Array<{ name: string }>) =>
      defaults.filter(
        (integration) => integration.name !== "HttpContext" && integration.name !== "Breadcrumbs",
      ),
  };
}

async function bootstrapBrowserSentry(dsn: string, session: SentrySession): Promise<void> {
  try {
    const Sentry = await import("@sentry/browser");
    Sentry.init(buildBrowserSentryInitOptions(dsn));
    if (current !== session) {
      // A teardown (and maybe a new sign-in after it) ran while the dynamic
      // import was in flight. This client belongs to no session anymore —
      // close it now instead of publishing it onto `session`, so it cannot
      // outlive the sign-out that should have stopped it.
      await Sentry.close(2_000).catch(() => {});
      Sentry.getCurrentScope().setClient(undefined);
      return;
    }
    session.handle = { captureException: (error) => Sentry.captureException(error) };
    session.sentryModule = Sentry;
  } catch (err) {
    // The dynamic import or the init call failed. Fall through with a
    // single diagnostic. The gate fails open — the app keeps running
    // without error monitoring rather than crashing on an opt-in feature.
    // eslint-disable-next-line no-console
    console.error("[paperclip] Sentry browser bootstrap failed", err);
  }
}
