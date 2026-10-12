/**
 * Inline script that installs a defensive `console.error` filter BEFORE React
 * hydrates, so the harmless React hydration warnings caused by Rocket's
 * `@dhiwise/component-tagger` (which injects source line numbers into every
 * JSX element as `data-component-line` attributes) stop drowning the console.
 *
 * SAFETY GUARANTEES — designed so it can NEVER hide a real bug:
 *
 * 1. Filter runs ONLY on `console.error` / `console.warn` arguments.
 *    Uncaught runtime Errors (TypeError, ReferenceError, SyntaxError,
 *    ChunkLoadError, network failures, Supabase errors, unhandled rejections
 *    from real app code, etc.) are NEVER filtered based on stack trace —
 *    only if the top-level error MESSAGE itself is one of the four exact
 *    React hydration strings.
 *
 * 2. A tight CRITICAL_ALLOW list force-passes anything that mentions
 *    TypeError, ReferenceError, SyntaxError, ChunkLoadError, network / fetch
 *    failures, Supabase, "Cannot read", "is not a function", "is not defined",
 *    stack traces (`at .../src/...`), 4xx/5xx status codes, promise rejection,
 *    memory / quota errors — even if the same log ALSO happens to contain a
 *    hydration keyword.
 *
 * 3. Filtered messages are NOT deleted — they are re-emitted at
 *    `console.debug` prefixed with `[hydration-noise-filtered]`, so a
 *    developer can always inspect them via DevTools > Console > Verbose.
 *
 * 4. Escape hatches to disable filtering entirely (for debugging):
 *      - Add `?debugHydration=1` to the URL
 *      - Run in DevTools console: `localStorage.setItem('detara:debug-hydration','1')`
 *      - Set `window.__DETARA_DISABLE_HYDRATION_FILTER__ = true` before hydration
 *
 * 5. A one-time `console.info` banner tells the developer the filter is
 *    active, so it is discoverable and not "invisible magic".
 *
 * 6. If ANY error is thrown inside the filter itself, it falls through and
 *    logs normally — the filter can never break logging.
 */

export const hydrationErrorFilterScript = `
(function () {
  if (typeof window === 'undefined') return;
  if (window.__DETARA_HYDRATION_FILTER_INSTALLED__) return;
  window.__DETARA_HYDRATION_FILTER_INSTALLED__ = true;

  // ─── Escape hatches ──────────────────────────────────────────────────────
  var disabled = false;
  try {
    if (window.__DETARA_DISABLE_HYDRATION_FILTER__ === true) disabled = true;
    if (location && location.search && /[?&]debugHydration=1/i.test(location.search)) disabled = true;
    if (window.localStorage && localStorage.getItem('detara:debug-hydration') === '1') disabled = true;
  } catch (e) { /* storage blocked — treat as enabled */ }

  var origError = console.error.bind(console);
  var origWarn  = console.warn.bind(console);
  var origInfo  = console.info ? console.info.bind(console) : origError;
  var origDebug = console.debug ? console.debug.bind(console) : origError;

  if (disabled) {
    origInfo('%c[DETARA] hydration filter DISABLED via escape hatch — all errors will show', 'color:#D4B07A');
    return;
  }

  // ─── ONLY these exact React hydration signatures are candidates ──────────
  // These strings are stable across React 18 and 19. Anything not in this
  // list is left alone.
  var HYDRATION_PATTERNS = [
    /hydration failed because the server rendered HTML didn'?t match the client/i,
    /there was an error while hydrating/i,
    /text content does not match server-rendered HTML/i,
    /text content did not match\\. server:/i,
    /a tree hydrated but some attributes of the server rendered HTML didn'?t match the client properties/i,
    /prop \`[^\`]+\` did not match\\. server:/i,
    /extra attributes from the server:/i,
    /hydrating the entire root will switch to client rendering/i,
    /minified react error #4(18|22|23|25)/i,
    // Line-number attribute mismatch strings React 19 emits when the tagger
    // is involved. Matching these is safe — they contain the literal attr name.
    /server:.+data-component-(id|line|end-line|path|name|file|content)/i,
    /client:.+data-component-(id|line|end-line|path|name|file|content)/i
  ];

  // ─── ALLOWLIST — if any of these markers appear in the log, ALWAYS show
  // it, even if it also happens to contain hydration keywords. This is the
  // safety net that guarantees real bugs are never swallowed.
  var CRITICAL_ALLOW = [
    /\\bTypeError\\b/,
    /\\bReferenceError\\b/,
    /\\bSyntaxError\\b/,
    /\\bRangeError\\b/,
    /\\bURIError\\b/,
    /\\bEvalError\\b/,
    /\\bChunkLoadError\\b/i,
    /\\bLoadError\\b/i,
    /\\bAbortError\\b/,
    /\\bNetworkError\\b/i,
    /Failed to fetch/i,
    /NetworkError when attempting to fetch/i,
    /net::ERR_/i,
    /ERR_CONNECTION_/i,
    /ERR_INTERNET_DISCONNECTED/i,
    /ERR_NAME_NOT_RESOLVED/i,
    /Cannot read propert/i,          // TypeError "Cannot read property/properties of..."
    /Cannot set propert/i,
    /is not a function/i,
    /is not defined/i,
    /is not iterable/i,
    /is not a constructor/i,
    /Unexpected token/i,
    /Unexpected end of/i,
    /\\bnull is not an object\\b/i,
    /\\bundefined is not an object\\b/i,
    /Loading chunk \\d+ failed/i,
    /Loading CSS chunk/i,
    /\\bsupabase\\b/i,               // Any Supabase-flagged error
    /\\bPostgrestError\\b/,
    /\\bAuthApiError\\b/,
    /\\bAuthRetryableFetchError\\b/,
    /\\brow[- ]level security\\b/i,
    /\\bJWT\\b/,
    /Invariant/i,
    /HTTP 4\\d\\d/,                  // 4xx status codes
    /HTTP 5\\d\\d/,                  // 5xx status codes
    /status(?:\\s*[:=]|\\s+is)\\s*4\\d\\d/i,
    /status(?:\\s*[:=]|\\s+is)\\s*5\\d\\d/i,
    /\\b(4\\d\\d|5\\d\\d)\\s+(Bad Request|Unauthorized|Forbidden|Not Found|Internal Server|Bad Gateway|Service Unavailable|Gateway Timeout)\\b/i,
    /Uncaught \\(in promise\\)/i,
    /Unhandled Promise Rejection/i,
    /QuotaExceededError/i,
    /out of memory/i,
    /Maximum call stack/i,
    /Script error\\./i,             // Cross-origin script errors — always show
    // If the log includes a stack frame pointing at OUR source, it is a real
    // runtime error, not a hydration warning.
    /\\bat\\s+\\S+\\s+\\(?.*\\/(src|app|components|lib|contexts?)\\//,
    /webpack-internal:\\/\\/\\//,
    /\\.(?:tsx?|jsx?):\\d+/         // "…file.tsx:123" — a source location
  ];

  function extractString(a) {
    if (a == null) return '';
    if (typeof a === 'string') return a;
    if (a instanceof Error) return (a.stack || a.message || String(a));
    if (typeof a === 'object') {
      var out = '';
      if (typeof a.message === 'string') out += a.message + ' ';
      if (typeof a.stack === 'string') out += a.stack + ' ';
      if (!out) { try { out = JSON.stringify(a); } catch (e) { out = ''; } }
      return out;
    }
    try { return String(a); } catch (e) { return ''; }
  }

  function joinArgs(args) {
    var out = '';
    for (var i = 0; i < args.length; i++) out += ' ' + extractString(args[i]);
    return out;
  }

  function isCriticalPassthrough(text) {
    for (var i = 0; i < CRITICAL_ALLOW.length; i++) {
      if (CRITICAL_ALLOW[i].test(text)) return true;
    }
    return false;
  }

  function isHydrationOnly(text) {
    for (var i = 0; i < HYDRATION_PATTERNS.length; i++) {
      if (HYDRATION_PATTERNS[i].test(text)) return true;
    }
    return false;
  }

  function shouldSuppress(args) {
    try {
      var text = joinArgs(args);
      if (!text) return false;
      // CRITICAL rule: if ANY critical marker fires, ALWAYS show the message.
      if (isCriticalPassthrough(text)) return false;
      // Otherwise, suppress only if it matches a known hydration signature.
      return isHydrationOnly(text);
    } catch (e) {
      return false; // never swallow on filter failure
    }
  }

  var suppressedCount = 0;

  function wrap(orig) {
    return function () {
      try {
        if (shouldSuppress(arguments)) {
          suppressedCount++;
          origDebug.apply(null, ['[hydration-noise-filtered]'].concat([].slice.call(arguments)));
          return;
        }
      } catch (e) { /* fall through */ }
      return orig.apply(null, arguments);
    };
  }

  console.error = wrap(origError);
  console.warn  = wrap(origWarn);

  // Optional helper for the developer to see what was filtered in this session.
  window.__detaraShowFilteredHydrationCount = function () {
    origInfo('[DETARA] hydration warnings suppressed this session:', suppressedCount);
    origInfo('Set localStorage[\\'detara:debug-hydration\\'] = \\'1\\' and reload to disable filtering.');
    return suppressedCount;
  };

  // window.onerror — swallow ONLY the specific hydration event, and ONLY when
  // the stack does not include app source. Every real runtime error passes.
  window.addEventListener('error', function (ev) {
    try {
      var msg = (ev && ev.message) || '';
      var stack = (ev && ev.error && ev.error.stack) || '';
      var combined = msg + ' ' + stack;
      if (!msg) return;
      if (isCriticalPassthrough(combined)) return;
      // Only suppress bare React hydration errors, never anything else.
      var isBareHydration =
        /hydration failed because the server rendered HTML didn'?t match the client/i.test(msg) ||
        /minified react error #4(18|22|23|25)/i.test(msg);
      if (isBareHydration) {
        suppressedCount++;
        origDebug('[hydration-noise-filtered]', msg);
        ev.preventDefault();
        ev.stopImmediatePropagation();
        return false;
      }
    } catch (e) { /* fall through */ }
  }, true);

  window.addEventListener('unhandledrejection', function (ev) {
    try {
      var reason = ev && ev.reason;
      var text = extractString(reason);
      if (!text) return;
      if (isCriticalPassthrough(text)) return;
      var isBareHydration =
        /hydration failed because the server rendered HTML didn'?t match the client/i.test(text) ||
        /minified react error #4(18|22|23|25)/i.test(text);
      if (isBareHydration) {
        suppressedCount++;
        origDebug('[hydration-noise-filtered]', text);
        ev.preventDefault();
        return false;
      }
    } catch (e) { /* fall through */ }
  }, true);

  // One-time discoverability banner so this is not "invisible".
  origInfo(
    '%c[DETARA] hydration-noise filter active %cReal errors still show. ' +
    'To disable: add ?debugHydration=1 to URL or run '+ 'localStorage.setItem(\\'detara:debug-hydration\\',\\'1\\') and reload. ' +
    'Call __detaraShowFilteredHydrationCount() to see how many were suppressed.',
    'background:#171817;color:#D4B07A;padding:2px 6px;border-radius:2px',
    'color:#7A5C46'
  );
})();
`?.trim();
