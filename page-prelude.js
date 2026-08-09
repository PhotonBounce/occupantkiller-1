// Top-of-page bootstrap helpers that need the initial DOM shell to exist.
(function () {
  var dot = document.getElementById('conn-dot');
  var _connTimer = null;
  var _connDelayMs = 4000;
  var _connDelayMin = 4000;
  var _connDelayMax = 30000;

  function scheduleConnCheck(delayMs) {
    if (_connTimer) clearTimeout(_connTimer);
    _connTimer = setTimeout(checkConn, delayMs);
  }

  function checkConn() {
    if (document.hidden) {
      scheduleConnCheck(Math.min(_connDelayMax, _connDelayMs + 4000));
      return;
    }

    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeoutId = setTimeout(function () {
      if (ctrl) ctrl.abort();
    }, 2500);

    // Skip health check on static hosts (GitHub Pages, etc.) — no server endpoint exists
    var isStaticHost = location.hostname.indexOf('github.io') >= 0 || location.protocol === 'file:';
    if (isStaticHost) {
      if (dot) { dot.style.background = '#3f3'; dot.title = 'Static host (no server)'; }
      scheduleConnCheck(_connDelayMax);
      return;
    }
    fetch('/healthz', {
      cache: 'no-store',
      signal: ctrl ? ctrl.signal : undefined,
    }).then(function () {
      clearTimeout(timeoutId);
      if (dot) { dot.style.background = '#3f3'; dot.title = 'Connected'; }
      _connDelayMs = _connDelayMin;
      scheduleConnCheck(_connDelayMs);
    }).catch(function () {
      clearTimeout(timeoutId);
      if (dot) { dot.style.background = '#f33'; dot.title = 'Disconnected'; }
      _connDelayMs = Math.min(_connDelayMax, Math.floor(_connDelayMs * 1.6));
      scheduleConnCheck(_connDelayMs);
    });
  }

  checkConn();
})();

// Controls legend toggle (? button + keyboard '?')
(function () {
  function bind() {
    var btn = document.getElementById('controls-legend-toggle');
    var legend = document.getElementById('controls-legend');
    if (!btn || !legend) return;
    function toggle() {
      legend.style.display = (legend.style.display === 'none' || !legend.style.display) ? 'block' : 'none';
    }
    btn.addEventListener('click', toggle);
    window.addEventListener('keydown', function (e) {
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) toggle();
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();

window.showAudioWarning = function (msg) {
  var overlayEl = document.getElementById('error-overlay');
  if (!overlayEl) return;
  overlayEl.style.display = 'block';
  overlayEl.innerText = 'AUDIO ERROR:\n' + msg;
  setTimeout(function () { overlayEl.style.display = 'none'; }, 3000);
};

(function () {
  var overlayEl = document.getElementById('error-overlay');
  var firstError = false;

  function showError(msg, url, line, col, err) {
    if (!overlayEl || firstError) return;
    firstError = true;
    overlayEl.style.display = 'block';
    overlayEl.innerText = '[FATAL JS ERROR]\n' + msg + '\n' + (url || '') + ' @ ' + line + ':' + col + (err && err.stack ? '\n' + err.stack : '');
  }

  window.addEventListener('error', function (event) {
    // Ignore benign non-fatal errors that must NOT trip the fatal overlay:
    //  • Opaque cross-origin script errors: browsers report these as the literal
    //    "Script error." with no file/line/stack. Offline, the ethers CDN <script>
    //    produces exactly this — harmless (web3 is optional and degrades), but it
    //    was painting a full "[FATAL JS ERROR]" panel over the game.
    //  • Resource load failures (a <script>/<img>/<link> that 404s): event.target
    //    is the element and there's no event.error/message.
    try {
      var msg = event && event.message;
      if (!msg || msg === 'Script error.' || msg === 'Script error') return;
      if (event.target && event.target !== window && (event.target.src || event.target.href) && !event.error) return;
    } catch (e) {}
    showError(event.message, event.filename, event.lineno, event.colno, event.error);
  });

  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    var message = reason && reason.message ? reason.message : reason;
    showError('Unhandled Promise rejection: ' + message, '', '', '', reason);
  });
})();