window.BattlefieldPromotions = (function () {
  'use strict';

  var _ranks = [
    { name: 'PRIVATE',        kills: 0,    scoreBonus: 1.0,  hpBonus: 0,   ammoBonus: 0  },
    { name: 'PRIVATE 1ST',    kills: 5,    scoreBonus: 1.05, hpBonus: 5,   ammoBonus: 5  },
    { name: 'CORPORAL',       kills: 12,   scoreBonus: 1.10, hpBonus: 10,  ammoBonus: 10 },
    { name: 'SERGEANT',       kills: 25,   scoreBonus: 1.15, hpBonus: 15,  ammoBonus: 15 },
    { name: 'STAFF SGT',      kills: 40,   scoreBonus: 1.20, hpBonus: 20,  ammoBonus: 20 },
    { name: 'LIEUTENANT',     kills: 60,   scoreBonus: 1.30, hpBonus: 25,  ammoBonus: 25 },
    { name: 'CAPTAIN',        kills: 85,   scoreBonus: 1.40, hpBonus: 30,  ammoBonus: 30 },
    { name: 'MAJOR',          kills: 115,  scoreBonus: 1.50, hpBonus: 35,  ammoBonus: 40 },
    { name: 'LT. COLONEL',    kills: 150,  scoreBonus: 1.65, hpBonus: 40,  ammoBonus: 50 },
    { name: 'COLONEL',        kills: 200,  scoreBonus: 1.80, hpBonus: 50,  ammoBonus: 60 },
    { name: 'GENERAL',        kills: 999,  scoreBonus: 2.00, hpBonus: 75,  ammoBonus: 99 }
  ];

  var _rankIndex = 0;
  var _overlayEl = null;
  var _rankEl = null;
  var _overlayTimer = 0;
  var _prevKills = 0;

  function _buildUI() {
    _overlayEl = document.createElement('div');
    _overlayEl.id = 'promotion-overlay';
    _overlayEl.style.cssText = [
      'position:fixed','top:35%','left:50%','transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.82)','border:2px solid #FFD700',
      'padding:18px 36px','color:#FFD700','font-family:monospace',
      'font-size:22px','font-weight:bold','text-align:center',
      'pointer-events:none','z-index:3000','display:none',
      'box-shadow:0 0 30px rgba(255,215,0,0.5)','letter-spacing:3px'
    ].join(';');
    document.body.appendChild(_overlayEl);

    _rankEl = document.createElement('div');
    _rankEl.id = 'rank-display';
    _rankEl.style.cssText = [
      'position:fixed','bottom:60px','left:20px',
      'color:#FFD700','font-family:monospace','font-size:12px',
      'letter-spacing:1px','pointer-events:none','z-index:1500'
    ].join(';');
    document.body.appendChild(_rankEl);
  }

  function _showPromotion(rank) {
    if (!_overlayEl) return;
    _overlayEl.innerHTML = [
      '<div style="font-size:13px;color:#aaa;letter-spacing:2px">PROMOTED TO</div>',
      '<div style="font-size:28px;color:#FFD700;margin:8px 0">' + rank.name + '</div>',
      '<div style="font-size:11px;color:#88ff88">+' + rank.hpBonus + ' MAX HP &nbsp;|&nbsp; ×' + rank.scoreBonus.toFixed(2) + ' SCORE &nbsp;|&nbsp; +' + rank.ammoBonus + ' AMMO</div>'
    ].join('');
    _overlayEl.style.display = 'block';
    _overlayTimer = 3.5;
  }

  function _applyRankBonuses(rank) {
    var player = window.player;
    if (player) {
      var maxHp = player.maxHp || 100;
      player.maxHp = maxHp + rank.hpBonus;
      player.hp = Math.min((player.hp || 100) + rank.hpBonus, player.maxHp);
    }
    if (window.Weapons && Weapons.addAmmo) Weapons.addAmmo(rank.ammoBonus);
    window._scoreMultiplier = rank.scoreBonus;
  }

  function _updateRankDisplay() {
    if (!_rankEl) return;
    var r = _ranks[_rankIndex];
    var next = _ranks[_rankIndex + 1];
    var kills = (window.player && window.player.kills) ? window.player.kills : 0;
    var killsToNext = next ? (next.kills - kills) : 0;
    _rankEl.textContent = r.name + (next ? '  ›  ' + killsToNext + ' kills to ' + next.name : '  ★ MAX RANK');
  }

  function init() {
    _rankIndex = 0;
    _overlayTimer = 0;
    _prevKills = 0;
    _buildUI();
    window._scoreMultiplier = 1.0;
  }

  function update(dt) {
    var kills = (window.player && window.player.kills) ? window.player.kills : 0;

    if (kills !== _prevKills) {
      _prevKills = kills;
      var newIdx = 0;
      for (var i = _ranks.length - 1; i >= 0; i--) {
        if (kills >= _ranks[i].kills) { newIdx = i; break; }
      }
      if (newIdx > _rankIndex) {
        _rankIndex = newIdx;
        _applyRankBonuses(_ranks[_rankIndex]);
        _showPromotion(_ranks[_rankIndex]);
      }
    }

    if (_overlayTimer > 0) {
      _overlayTimer -= dt;
      if (_overlayTimer <= 0 && _overlayEl) _overlayEl.style.display = 'none';
    }

    _updateRankDisplay();
  }

  function reset() {
    _rankIndex = 0;
    _overlayTimer = 0;
    _prevKills = 0;
    window._scoreMultiplier = 1.0;
    if (_overlayEl) _overlayEl.style.display = 'none';
    if (_rankEl) _rankEl.textContent = '';
  }

  function getRank() { return _ranks[_rankIndex].name; }

  return { init: init, update: update, getRank: getRank, reset: reset };
})();
