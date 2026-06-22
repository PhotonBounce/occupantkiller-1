// perk-system.js — Permanent perk upgrade tree (IIFE, all var)
// J key opens/closes. Currency = player.score / 100 (perk points).
// Persists via localStorage key 'okk_perks_v1'.
// Exposes: window.PerkSystem = { init, toggle, show, hide, getActivePerk, hasPerk, applyPerks, reset }

window.PerkSystem = (function () {

  // ── Perk definitions ─────────────────────────────────────────────────────
  var PERK_CATEGORIES = [
    {
      id: 'COMBAT',
      label: 'Combat',
      color: '#e53935',
      glow: 'rgba(229,57,53,0.55)',
      emoji: '🔫',
      perks: [
        { id: 'IRON_LUNGS',   name: 'Iron Lungs',      desc: 'Stamina drains 30% slower',                  cost: 500,  prereq: null,          icon: '🫁' },
        { id: 'QUICK_RELOAD', name: 'Quick Reload',     desc: 'Reload 25% faster',                          cost: 800,  prereq: 'IRON_LUNGS',   icon: '⚡' },
        { id: 'EXTRA_MAGS',   name: 'Extra Magazines',  desc: 'Start each wave with +1 mag per weapon',     cost: 1000, prereq: 'QUICK_RELOAD',  icon: '🎒' },
        { id: 'STEADY_HANDS', name: 'Steady Hands',     desc: 'Recoil reduced 20%',                         cost: 1200, prereq: 'EXTRA_MAGS',    icon: '🤲' },
        { id: 'DEATH_DEALER', name: 'Death Dealer',     desc: 'All damage +15%',                            cost: 2000, prereq: 'STEADY_HANDS',  icon: '💀' }
      ]
    },
    {
      id: 'SURVIVAL',
      label: 'Survival',
      color: '#1e88e5',
      glow: 'rgba(30,136,229,0.55)',
      emoji: '🛡️',
      perks: [
        { id: 'FIELD_MEDIC',  name: 'Field Medic',  desc: 'Slowly regenerate HP to 25 max',                  cost: 600,  prereq: null,           icon: '💉' },
        { id: 'HARDENED',     name: 'Hardened',      desc: 'Take 15% less damage',                            cost: 900,  prereq: 'FIELD_MEDIC',   icon: '🪖' },
        { id: 'THICK_SKIN',   name: 'Thick Skin',    desc: 'Armor absorbs 80% instead of 60%',               cost: 1100, prereq: 'HARDENED',       icon: '🦏' },
        { id: 'LAST_STAND',   name: 'Last Stand',    desc: 'At <10 HP, deal 40% more damage',                cost: 1500, prereq: 'THICK_SKIN',    icon: '⚔️' },
        { id: 'PHOENIX',      name: 'Phoenix',       desc: 'Once per level: survive lethal hit with 5 HP',   cost: 2500, prereq: 'LAST_STAND',    icon: '🔥' }
      ]
    },
    {
      id: 'TACTICAL',
      label: 'Tactical',
      color: '#43a047',
      glow: 'rgba(67,160,71,0.55)',
      emoji: '👁️',
      perks: [
        { id: 'EAGLE_EYE',    name: 'Eagle Eye',    desc: 'Enemy detection range increased; see health bars at distance', cost: 500,  prereq: null,           icon: '🦅' },
        { id: 'TRACKER',      name: 'Tracker',      desc: 'Enemies show footprint trails for 3s after moving',           cost: 700,  prereq: 'EAGLE_EYE',    icon: '🐾' },
        { id: 'HUNTER',       name: 'Hunter',       desc: 'Marked enemies (bounty/HVT) take 25% more damage',           cost: 1000, prereq: 'TRACKER',       icon: '🎯' },
        { id: 'SILENT_KILLER',name: 'Silent Killer', desc: 'Knife kills are silent, no enemy alert',                    cost: 1500, prereq: 'HUNTER',        icon: '🔪' },
        { id: 'GHOST',        name: 'Ghost',        desc: 'Stay crouched 5+ sec to become unseen by enemies',           cost: 2500, prereq: 'SILENT_KILLER', icon: '👻' }
      ]
    }
  ];

  // ── State ─────────────────────────────────────────────────────────────────
  var _unlocked = [];      // array of perk IDs
  var _perkPoints = 0;     // cached points
  var _visible = false;
  var _overlay = null;
  var _initialized = false;

  // ── Storage ───────────────────────────────────────────────────────────────
  var STORAGE_KEY = 'okk_perks_v1';

  function _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ unlocked: _unlocked, perkPoints: _perkPoints }));
    } catch (e) { /* storage unavailable */ }
  }

  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (Array.isArray(data.unlocked)) { _unlocked = data.unlocked; }
        if (typeof data.perkPoints === 'number') { _perkPoints = data.perkPoints; }
      }
    } catch (e) { /* corrupt data — start fresh */ }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function _calcPoints() {
    var score = 0;
    try {
      if (window.player && typeof window.player.score === 'number') {
        score = window.player.score;
      } else if (window.GameManager && typeof window.GameManager.getScore === 'function') {
        score = window.GameManager.getScore();
      }
    } catch (e) {}
    return Math.floor(score / 100);
  }

  function _isUnlocked(id) {
    for (var i = 0; i < _unlocked.length; i++) {
      if (_unlocked[i] === id) { return true; }
    }
    return false;
  }

  function _prereqMet(perk) {
    if (!perk.prereq) { return true; }
    return _isUnlocked(perk.prereq);
  }

  function _canAfford(cost) {
    return _perkPoints >= cost;
  }

  function _isAvailable(perk) {
    return !_isUnlocked(perk.id) && _prereqMet(perk) && _canAfford(perk.cost);
  }

  function _getPerkDef(id) {
    for (var ci = 0; ci < PERK_CATEGORIES.length; ci++) {
      var cat = PERK_CATEGORIES[ci];
      for (var pi = 0; pi < cat.perks.length; pi++) {
        if (cat.perks[pi].id === id) { return cat.perks[pi]; }
      }
    }
    return null;
  }

  function _getCategoryForPerk(id) {
    for (var ci = 0; ci < PERK_CATEGORIES.length; ci++) {
      var cat = PERK_CATEGORIES[ci];
      for (var pi = 0; pi < cat.perks.length; pi++) {
        if (cat.perks[pi].id === id) { return cat; }
      }
    }
    return null;
  }

  // ── Purchase ──────────────────────────────────────────────────────────────
  function _purchase(id) {
    var perk = _getPerkDef(id);
    if (!perk) { return; }
    if (_isUnlocked(id)) { return; }
    if (!_prereqMet(perk)) { return; }
    if (!_canAfford(perk.cost)) { return; }
    _perkPoints -= perk.cost;
    _unlocked.push(id);
    _save();
    _renderOverlay();
  }

  // ── Apply perks (called at level start) ───────────────────────────────────
  function applyPerks() {
    // Reset all perk globals to defaults first
    window._staminaDrainMult    = 1;
    window._reloadSpeedMult     = 1;
    window._bonusMagazines      = 0;
    window._recoilMult          = 1;
    window._damageMult          = window._damageMult || 1;
    window._hpRegenEnabled      = false;
    window._damageReductionMult = 1;
    window._armorAbsorption     = 0.6;
    window._lastStandBonus      = false;
    window._phoenixEnabled      = false;
    window._eagleEyeEnabled     = false;
    window._trackerEnabled      = false;
    window._hunterDamageMult    = 1;
    window._silentKnifeEnabled  = false;
    window._ghostEnabled        = false;

    if (_isUnlocked('IRON_LUNGS'))    { window._staminaDrainMult    = 0.7; }
    if (_isUnlocked('QUICK_RELOAD'))  { window._reloadSpeedMult     = 0.75; }
    if (_isUnlocked('EXTRA_MAGS'))    { window._bonusMagazines      = 1; }
    if (_isUnlocked('STEADY_HANDS'))  { window._recoilMult          = 0.8; }
    if (_isUnlocked('DEATH_DEALER'))  { window._damageMult          = (window._damageMult || 1) * 1.15; }

    if (_isUnlocked('FIELD_MEDIC'))   { window._hpRegenEnabled      = true; }
    if (_isUnlocked('HARDENED'))      { window._damageReductionMult = 0.85; }
    if (_isUnlocked('THICK_SKIN'))    { window._armorAbsorption     = 0.8; }
    if (_isUnlocked('LAST_STAND'))    { window._lastStandBonus      = true; }
    if (_isUnlocked('PHOENIX'))       { window._phoenixEnabled      = true; }

    if (_isUnlocked('EAGLE_EYE'))     { window._eagleEyeEnabled     = true; }
    if (_isUnlocked('TRACKER'))       { window._trackerEnabled      = true; }
    if (_isUnlocked('HUNTER'))        { window._hunterDamageMult    = 1.25; }
    if (_isUnlocked('SILENT_KILLER')) { window._silentKnifeEnabled  = true; }
    if (_isUnlocked('GHOST'))         { window._ghostEnabled        = true; }
  }

  // ── DOM / UI ──────────────────────────────────────────────────────────────
  var _styleEl = null;

  function _injectStyles() {
    if (_styleEl) { return; }
    _styleEl = document.createElement('style');
    _styleEl.id = 'perk-system-styles';
    _styleEl.textContent = [
      '#perk-overlay {',
      '  position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999;',
      '  background: rgba(13,13,13,0.97);',
      '  display: flex; flex-direction: column; align-items: center;',
      '  font-family: "Courier New", monospace;',
      '  color: #e0e0e0;',
      '  transform: translateX(-100%);',
      '  transition: transform 0.32s cubic-bezier(0.22,1,0.36,1);',
      '  overflow-y: auto;',
      '  padding: 24px 16px 32px;',
      '  box-sizing: border-box;',
      '}',
      '#perk-overlay.perk-visible {',
      '  transform: translateX(0);',
      '}',
      '#perk-header {',
      '  text-align: center; margin-bottom: 20px; width: 100%;',
      '}',
      '#perk-header h1 {',
      '  font-size: 28px; letter-spacing: 6px; text-transform: uppercase;',
      '  color: #f5f5f5; margin: 0 0 6px; text-shadow: 0 0 12px #fff4;',
      '}',
      '#perk-points-display {',
      '  font-size: 18px; letter-spacing: 3px; color: #ffd54f;',
      '  text-shadow: 0 0 8px #ffd54f88;',
      '}',
      '#perk-close-hint {',
      '  font-size: 12px; color: #666; margin-top: 4px; letter-spacing: 2px;',
      '}',
      '#perk-columns {',
      '  display: flex; flex-direction: row; gap: 24px;',
      '  width: 100%; max-width: 900px; justify-content: center;',
      '}',
      '.perk-column {',
      '  display: flex; flex-direction: column; gap: 12px;',
      '  flex: 1; min-width: 200px; max-width: 260px;',
      '}',
      '.perk-cat-header {',
      '  text-align: center; font-size: 14px; letter-spacing: 4px;',
      '  text-transform: uppercase; padding: 8px 0 4px;',
      '  border-bottom: 1px solid #333;',
      '  margin-bottom: 4px;',
      '}',
      '.perk-card {',
      '  width: 100%; min-height: 120px;',
      '  background: #1a1a1a;',
      '  border: 1px solid #333;',
      '  border-radius: 6px;',
      '  padding: 10px 12px;',
      '  box-sizing: border-box;',
      '  cursor: default;',
      '  position: relative;',
      '  transition: box-shadow 0.2s, border-color 0.2s, background 0.2s;',
      '  display: flex; flex-direction: column; gap: 4px;',
      '}',
      '.perk-card.perk-locked {',
      '  opacity: 0.42;',
      '  filter: grayscale(0.6);',
      '}',
      '.perk-card.perk-unlocked {',
      '  background: #0f1f0f;',
      '  opacity: 1;',
      '}',
      '.perk-card.perk-available {',
      '  cursor: pointer;',
      '  opacity: 1;',
      '  animation: perk-pulse 1.6s ease-in-out infinite;',
      '}',
      '@keyframes perk-pulse {',
      '  0%, 100% { box-shadow: 0 0 0 0 transparent; }',
      '  50% { box-shadow: 0 0 10px 2px var(--cat-glow, #ffffff44); }',
      '}',
      '.perk-card.perk-available:hover {',
      '  background: #222;',
      '}',
      '.perk-icon {',
      '  font-size: 26px; line-height: 1;',
      '}',
      '.perk-name {',
      '  font-size: 13px; font-weight: bold; letter-spacing: 1px;',
      '  text-transform: uppercase;',
      '}',
      '.perk-desc {',
      '  font-size: 11px; color: #999; line-height: 1.4;',
      '}',
      '.perk-cost {',
      '  font-size: 12px; margin-top: 4px;',
      '  letter-spacing: 1px;',
      '}',
      '.perk-status-icon {',
      '  position: absolute; top: 8px; right: 10px; font-size: 16px;',
      '}'
    ].join('\n');
    document.head.appendChild(_styleEl);
  }

  function _buildOverlay() {
    if (_overlay) { return; }
    _overlay = document.createElement('div');
    _overlay.id = 'perk-overlay';
    _overlay.setAttribute('role', 'dialog');
    _overlay.setAttribute('aria-label', 'Perk upgrade tree');
    document.body.appendChild(_overlay);
  }

  function _renderOverlay() {
    if (!_overlay) { return; }

    // Update perk points from current score
    var fresh = _calcPoints();
    // Only increase — points aren't reduced by score changes (only by spending)
    if (fresh > _perkPoints + 0) {
      _perkPoints = fresh;
    }

    var html = '';

    // Header
    html += '<div id="perk-header">';
    html += '<h1>&#9760; Perk Upgrades &#9760;</h1>';
    html += '<div id="perk-points-display">PERK POINTS: ' + _perkPoints + '</div>';
    html += '<div id="perk-close-hint">[ J ] to close</div>';
    html += '</div>';

    // Columns
    html += '<div id="perk-columns">';

    for (var ci = 0; ci < PERK_CATEGORIES.length; ci++) {
      var cat = PERK_CATEGORIES[ci];
      html += '<div class="perk-column">';
      html += '<div class="perk-cat-header" style="color:' + cat.color + '">' + cat.emoji + ' ' + cat.label + '</div>';

      for (var pi = 0; pi < cat.perks.length; pi++) {
        var perk = cat.perks[pi];
        var unlocked = _isUnlocked(perk.id);
        var available = _isAvailable(perk);
        var locked = !unlocked && !available;

        var cardClass = 'perk-card';
        if (unlocked) { cardClass += ' perk-unlocked'; }
        else if (available) { cardClass += ' perk-available'; }
        else { cardClass += ' perk-locked'; }

        var borderColor = unlocked ? cat.color : (available ? cat.color : '#333');
        var glowStyle = unlocked
          ? 'box-shadow:0 0 12px 2px ' + cat.glow + ';'
          : '';
        var style = 'border-color:' + borderColor + ';' + glowStyle + '--cat-glow:' + cat.glow + ';';

        var dataAttr = available ? 'data-perk-id="' + perk.id + '"' : '';

        html += '<div class="' + cardClass + '" style="' + style + '" ' + dataAttr + '>';

        // Status icon (top-right)
        var statusIcon = unlocked ? '&#9989;' : (available ? '&#128275;' : '&#128274;');
        html += '<span class="perk-status-icon">' + statusIcon + '</span>';

        html += '<span class="perk-icon">' + perk.icon + '</span>';
        html += '<span class="perk-name" style="color:' + (unlocked ? cat.color : (available ? cat.color : '#aaa')) + '">' + perk.name + '</span>';
        html += '<span class="perk-desc">' + perk.desc + '</span>';

        if (!unlocked) {
          var costColor = _canAfford(perk.cost) ? '#ffd54f' : '#f44336';
          html += '<span class="perk-cost" style="color:' + costColor + '">&#9760; ' + perk.cost + ' pts</span>';
        } else {
          html += '<span class="perk-cost" style="color:#43a047">UNLOCKED</span>';
        }

        html += '</div>'; // .perk-card
      }

      html += '</div>'; // .perk-column
    }

    html += '</div>'; // #perk-columns

    _overlay.innerHTML = html;

    // Attach click handlers to available cards
    var cards = _overlay.querySelectorAll('.perk-available[data-perk-id]');
    for (var k = 0; k < cards.length; k++) {
      (function (card) {
        card.addEventListener('click', function () {
          _purchase(card.getAttribute('data-perk-id'));
        });
      })(cards[k]);
    }
  }

  // ── Key handler ───────────────────────────────────────────────────────────
  function _onKeyDown(e) {
    if (e.key === 'j' || e.key === 'J') {
      // Don't intercept if typing in an input/textarea
      var tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') { return; }
      e.preventDefault();
      toggle();
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────
  function init() {
    if (_initialized) { return; }
    _initialized = true;
    _load();
    _injectStyles();
    _buildOverlay();
    document.addEventListener('keydown', _onKeyDown);
  }

  function show() {
    if (!_initialized) { init(); }
    if (_visible) { return; }
    _visible = true;
    _perkPoints = _calcPoints(); // refresh on open
    _renderOverlay();
    // Force reflow then add class for slide-in
    void _overlay.offsetWidth;
    _overlay.classList.add('perk-visible');
    _save();
  }

  function hide() {
    if (!_visible) { return; }
    _visible = false;
    _overlay.classList.remove('perk-visible');
  }

  function toggle() {
    if (_visible) { hide(); } else { show(); }
  }

  function hasPerk(id) {
    return _isUnlocked(id);
  }

  function getActivePerk() {
    // Returns first unlocked perk (legacy single-perk API shim)
    return _unlocked.length > 0 ? _unlocked[0] : null;
  }

  function reset() {
    _unlocked = [];
    _perkPoints = 0;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    if (_overlay) { _renderOverlay(); }
  }

  return { init: init, toggle: toggle, show: show, hide: hide, getActivePerk: getActivePerk, hasPerk: hasPerk, applyPerks: applyPerks, reset: reset };

})();

// Auto-init when DOM is ready
(function () {
  function _tryInit() {
    if (window.PerkSystem && typeof window.PerkSystem.init === 'function') {
      window.PerkSystem.init();
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _tryInit);
  } else {
    _tryInit();
  }
})();
