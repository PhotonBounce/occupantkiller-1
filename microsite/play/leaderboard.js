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

  var _activeTab = 'scores';

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

    var tabBtnStyle = 'padding:6px 16px;cursor:pointer;border:none;font-family:monospace;font-size:13px;';
    var scoresBtnStyle = tabBtnStyle + (_activeTab === 'scores' ? 'background:#cc0000;color:#fff;' : 'background:#222;color:#aaa;');
    var guidesBtnStyle = tabBtnStyle + (_activeTab === 'guide' ? 'background:#cc0000;color:#fff;' : 'background:#222;color:#aaa;');

    var content = '';
    if (_activeTab === 'scores') {
      content = '<table style="width:100%;border-collapse:collapse"><tbody>' + rows + '</tbody></table>';
    } else {
      content = _renderGuide();
    }

    var prestigeInfo = window._prestigeLevel > 0
      ? '<div style="text-align:center;color:#ffd700;margin-bottom:8px">⭐ PRESTIGE ' + window._prestigeLevel + ' · ×' + (window._prestigeScoreMult || 1).toFixed(2) + ' score bonus</div>'
      : '';

    _overlayEl.innerHTML =
      '<h2 style="text-align:center;color:#ff4444;margin:0 0 10px">⚔ OCCUPANT KILLER</h2>' +
      prestigeInfo +
      '<div style="display:flex;gap:4px;margin-bottom:12px;justify-content:center">' +
        '<button id="lb-tab-scores" style="' + scoresBtnStyle + '">🏆 TOP SCORES</button>' +
        '<button id="lb-tab-guide" style="' + guidesBtnStyle + '">📖 CONTROLS</button>' +
      '</div>' +
      content +
      '<div style="text-align:center;margin-top:12px;font-size:11px;color:#555">[TAB] to close</div>';

    document.getElementById('lb-tab-scores').onclick = function() { _activeTab = 'scores'; _render(); };
    document.getElementById('lb-tab-guide').onclick = function() { _activeTab = 'guide'; _render(); };
  }

  function _renderGuide() {
    var sections = [
      { title: '🔫 COMBAT', keys: [
        ['LMB / Space', 'Fire weapon'],
        ['RMB', 'Aim down sights / zoom'],
        ['R', 'Reload'],
        ['Q / Mouse wheel', 'Switch weapon'],
        ['G', 'Throw grenade / deploy Bradley'],
        ['H', 'Apply field bandage'],
        ['B', 'Build mode (fortifications)'],
      ]},
      { title: '🚁 DRONES & VEHICLES', keys: [
        ['F', 'Enter/exit vehicle'],
        ['E', 'Possess drone'],
        ['Shift+C', 'Deploy Companion Drone'],
        ['Shift+W', 'Cycle weather (clear/rain/snow/fog)'],
      ]},
      { title: '🌟 SPECIAL FEATURES', keys: [
        ['Shift+N', 'Toggle Night Vision Goggles (NVG)'],
        ['Shift+P', 'Toggle Challenge Mode (×2 score)'],
        ['N', 'Call airdrop beacon'],
        ['TAB', 'Leaderboard / controls guide'],
        ['F10', 'Toggle FPS counter'],
      ]},
      { title: '🏆 SCORING', keys: [
        ['Kill streak ×2+', 'DOUBLE/TRIPLE/QUAD kill banners + bonus %'],
        ['Headshot', 'Extra score + HUD flash'],
        ['Barrel explosion', 'Chain reaction bonus kills'],
        ['Prestige (all levels)', '+25% score per prestige level'],
        ['Challenge mode', '×2 score multiplier'],
      ]},
    ];
    var html = '<div style="column-count:2;column-gap:16px;">';
    for (var s = 0; s < sections.length; s++) {
      var sec = sections[s];
      html += '<div style="break-inside:avoid;margin-bottom:12px;">';
      html += '<div style="color:#ff8800;font-weight:bold;margin-bottom:4px;">' + sec.title + '</div>';
      for (var k = 0; k < sec.keys.length; k++) {
        html += '<div style="display:flex;gap:8px;margin-bottom:2px;font-size:11px;">' +
          '<span style="color:#ffd700;min-width:100px">' + _esc(sec.keys[k][0]) + '</span>' +
          '<span style="color:#ccc">' + _esc(sec.keys[k][1]) + '</span>' +
          '</div>';
      }
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { submitScore: submitScore, getEntries: getEntries, clear: clear, show: show, hide: hide, toggle: toggle };
})();
