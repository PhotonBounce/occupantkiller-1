window.Leaderboard = (function() {
  var STORAGE_KEY = 'okk_leaderboard_v1';
  var MAX_ENTRIES = 10;
  var _entries = [];

  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      _entries = raw ? JSON.parse(raw) : [];
    } catch(e) { _entries = []; }
  }

  function _save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_entries)); } catch(e) {}
  }

  // Submit a score. Returns rank (1-based) or null if not in top 10.
  function submitScore(name, score, wave, kills, level) {
    _load();
    var entry = {
      name: name || 'UNKNOWN',
      score: score || 0,
      wave: wave || 1,
      kills: kills || 0,
      level: level || 'KYIV',
      date: new Date().toISOString().slice(0, 10)
    };
    _entries.push(entry);
    _entries.sort(function(a, b) { return b.score - a.score; });
    _entries = _entries.slice(0, MAX_ENTRIES);
    _save();
    for (var i = 0; i < _entries.length; i++) {
      if (_entries[i] === entry) return i + 1;
    }
    return null;
  }

  function getEntries() {
    _load();
    return _entries.slice();
  }

  function clear() {
    _entries = [];
    _save();
  }

  // ── HUD overlay ──────────────────────────────────────────────────
  var _overlayEl = null;

  function show() {
    _load();
    if (!_overlayEl) {
      _overlayEl = document.createElement('div');
      _overlayEl.id = 'leaderboard-overlay';
      _overlayEl.style.cssText = [
        'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);',
        'width:480px;max-height:80vh;overflow-y:auto;',
        'background:rgba(0,0,0,0.92);border:2px solid #cc0000;border-radius:6px;',
        'color:#fff;font-family:monospace;padding:16px;z-index:9999;',
        'display:none;'
      ].join('');
      document.body.appendChild(_overlayEl);
      _overlayEl.addEventListener('click', function(e) { e.stopPropagation(); });
    }
    _render();
    _overlayEl.style.display = 'block';
  }

  function hide() {
    if (_overlayEl) _overlayEl.style.display = 'none';
  }

  function toggle() {
    if (_overlayEl && _overlayEl.style.display === 'block') { hide(); } else { show(); }
  }

  function _render() {
    if (!_overlayEl) return;
    var rows = '';
    for (var i = 0; i < _entries.length; i++) {
      var e = _entries[i];
      var medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.';
      var color = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#aaa';
      rows += '<tr style="color:' + color + '">' +
        '<td style="padding:4px 8px">' + medal + '</td>' +
        '<td style="padding:4px 8px">' + _esc(e.name) + '</td>' +
        '<td style="padding:4px 8px;text-align:right">' + e.score.toLocaleString() + '</td>' +
        '<td style="padding:4px 8px;text-align:right">W' + e.wave + '</td>' +
        '<td style="padding:4px 8px;text-align:right">' + e.kills + 'K</td>' +
        '<td style="padding:4px 8px;font-size:10px;color:#666">' + e.level + '</td>' +
        '</tr>';
    }
    if (!rows) rows = '<tr><td colspan="6" style="text-align:center;color:#666;padding:20px">No scores yet — play a game!</td></tr>';
    _overlayEl.innerHTML = '<h2 style="text-align:center;color:#ff4444;margin:0 0 12px">🏆 TOP SCORES</h2>' +
      '<table style="width:100%;border-collapse:collapse"><tbody>' + rows + '</tbody></table>' +
      '<div style="text-align:center;margin-top:12px;font-size:11px;color:#555">[TAB] to close · ' + _entries.length + '/' + MAX_ENTRIES + ' entries</div>';
  }

  function _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { submitScore: submitScore, getEntries: getEntries, clear: clear, show: show, hide: hide, toggle: toggle };
})();
