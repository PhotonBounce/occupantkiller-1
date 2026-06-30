const MissionManager = (function() {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════════════
     MISSION MANAGER — Standalone module extracted from game-manager.js
     Handles: mission tracker, leaderboard, daily challenges, bounties,
              achievement popups, perk display, and killstreak panel.
     ═══════════════════════════════════════════════════════════════════════ */

  // ── Private state ───────────────────────────────────────────────────
  var _hudSlowTimer = 0;   // throttle slow HUD updates (dailies, bounties, prestige)
  var _initialized = false;

  // Placeholder callbacks for GameManager dependencies (player, camera, etc.)
  var _deps = {
    getPlayer:      function() { return null; },
    getCamera:      function() { return null; },
    getCurrentWave: function() { return 0; },
    getCurrentStage:function() { return 0; },
    getGameState:   function() { return 'menu'; },
    isPlaying:      function() { return false; },
    getStageDef:    function() { return null; },
    notify:         function() {},
    shakeCamera:    function() {},
    playExplosionSound: function() {},
    onWaveComplete: function() {}
  };

  function _setCallbacks(callbacks) {
    if (!callbacks) return;
    for (var key in callbacks) {
      if (_deps.hasOwnProperty(key) && typeof callbacks[key] === 'function') {
        _deps[key] = callbacks[key];
      }
    }
  }

  function _safeNotify(msg, color) {
    try {
      if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup(msg, color);
      } else {
        _deps.notify(msg, color);
      }
    } catch (e) {}
  }

  function _safeShake(intensity, duration) {
    try {
      if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
        CameraSystem.shake(intensity, duration);
      } else {
        _deps.shakeCamera(intensity, duration);
      }
    } catch (e) {}
  }

  // ── Public API ──────────────────────────────────────────────────────

  function init(callbacks) {
    if (_initialized) return;
    _setCallbacks(callbacks);
    _hudSlowTimer = 0;
    _initialized = true;
  }

  function update(delta) {
    if (!_initialized) return;
    trackMission(delta);
    updateChallenges(delta);
  }

  /**
   * Update mission tracker panel (mission-tracker) and HUD mission line (hud-missions).
   * Also drives MissionTypes.update() and MissionSystem.update() per frame.
   */
  function trackMission(delta) {
    // MissionSystem frame updates
    if (typeof MissionSystem !== 'undefined') {
      if (MissionSystem.update) MissionSystem.update(delta);
      if (MissionSystem.updateMissionTimer) MissionSystem.updateMissionTimer(delta);
    }

    // MissionTypes scripted mission tracker DOM updates
    if (typeof MissionTypes !== 'undefined') {
      var player = _deps.getPlayer();
      var missionResult = MissionTypes.update(delta, player ? player.position : null);
      if (missionResult) {
        var mTracker = document.getElementById('mission-tracker');
        if (mTracker) {
          if (missionResult.state === 'ACTIVE') {
            mTracker.style.display = 'block';
            var mTitle = document.getElementById('mission-tracker-title');
            if (mTitle) {
              mTitle.textContent = '\ud83d\udccc ' + (MissionTypes.getActive() ? MissionTypes.getActive().config.name : 'MISSION');
            }
            var mTimer = document.getElementById('mission-tracker-timer');
            if (mTimer && missionResult.timeRemaining !== undefined) {
              mTimer.textContent = '\u23f1 ' + Math.ceil(missionResult.timeRemaining) + 's';
            }
            var mObj = document.getElementById('mission-tracker-objectives');
            if (mObj) {
              var _objTxt = '';
              switch (missionResult.type) {
                case 'CAPTURE_ZONE':
                  _objTxt = 'Hold zone: ' + Math.round((missionResult.holdProgress || 0) * 100) + '%' + (missionResult.contested ? ' \u2694 CONTESTED' : '');
                  break;
                case 'DEMOLITION':
                  _objTxt = missionResult.planted ? '\u2713 Charge planted \u2014 move 25m clear!' : 'Plant charge: ' + Math.round((missionResult.plantProgress || 0) * 100) + '%';
                  break;
                case 'ASSASSINATION':
                  _objTxt = missionResult.hvtLocated ? ('HVT HP: ' + Math.max(0, Math.round(missionResult.hvtHP || 0))) : 'Locate and engage HVT in zone';
                  break;
                case 'RESCUE': {
                  var _powTot = MissionTypes.getActive() ? MissionTypes.getActive().config.powCount : 3;
                  var _powNear = (missionResult.activePow >= 0) ? ' \u2014 hold [F] to free POW ' + (missionResult.activePow + 1) : ' \u2014 find a POW (approach within 5m)';
                  var _powFreeing = (missionResult.activePow >= 0 && missionResult.pows && missionResult.pows[missionResult.activePow])
                    ? (missionResult.pows[missionResult.activePow].freeProgress > 0 ? ' [freeing: ' + Math.round(missionResult.pows[missionResult.activePow].freeProgress * 100) + '%]' : '') : '';
                  _objTxt = 'POWs freed: ' + (missionResult.freed || 0) + '/' + _powTot + _powFreeing + _powNear;
                  break;
                }
                case 'DEFUSE': {
                  var _bombTot = MissionTypes.getActive() ? MissionTypes.getActive().config.bombCount : 3;
                  var _defProg = missionResult.defuseProgress > 0 ? ' [defusing: ' + Math.round(missionResult.defuseProgress * 100) + '%]' : '';
                  _objTxt = 'Bombs defused: ' + (missionResult.defused || 0) + '/' + _bombTot + _defProg + ' \u00b7 Detonation in ' + Math.ceil(missionResult.detonationTimer || 0) + 's';
                  break;
                }
                case 'ASSAULT_DUGOUTS':
                  _objTxt = 'Dugouts: ' + (missionResult.dugoutsCleared || 0) + '/' + (MissionTypes.getActive() ? MissionTypes.getActive().config.dugoutCount : 4);
                  break;
              }
              mObj.textContent = _objTxt;
            }
          } else if (missionResult.state === 'COMPLETE') {
            var _completingMission = MissionTypes.getActive();
            var _completingType = _completingMission ? _completingMission.config.id : null;
            if (_completingType === 'DEMOLITION' && _completingMission && typeof Enemies !== 'undefined' && Enemies.damageInRadius) {
              var _demCfg = _completingMission.config;
              var _demY = (typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight)
                ? VoxelWorld.getTerrainHeight(_completingMission.zoneX, _completingMission.zoneZ)
                : 0;
              if (typeof THREE !== 'undefined') {
                Enemies.damageInRadius(
                  new THREE.Vector3(_completingMission.zoneX, _demY, _completingMission.zoneZ),
                  _demCfg.blastRadius || 15, _demCfg.blastDamage || 500
                );
              }
              _safeShake(0.08, 0.6);
            }
            var reward = MissionTypes.completeMission();
            if (reward) {
              _safeNotify('\u2705 MISSION COMPLETE! +' + reward.okc + ' OKC +' + reward.xp + ' XP', '#44ff88');
              if (typeof Marketplace !== 'undefined' && Marketplace.awardCustomOKC) {
                var _awardPromise = Marketplace.awardCustomOKC(reward.okc, 'mission_type_complete', {
                  missionType: _completingType,
                });
                if (_awardPromise && typeof _awardPromise.then === 'function') {
                  _awardPromise.then(function () {
                    if (typeof HUD !== 'undefined' && HUD.updateOKC) HUD.updateOKC(Marketplace.getOKC());
                  });
                } else if (typeof HUD !== 'undefined' && HUD.updateOKC) {
                  HUD.updateOKC(Marketplace.getOKC());
                }
              } else if (typeof Marketplace !== 'undefined') {
                Marketplace.addOKC(reward.okc);
              }
              if (typeof RankSystem !== 'undefined' && RankSystem.addXP) RankSystem.addXP(reward.xp);
              if (typeof Progression !== 'undefined' && Progression.trackStat) Progression.trackStat('wavesCleared', 0);
            }
            mTracker.style.display = 'none';
          } else if (missionResult.state === 'FAILED') {
            var _failMsg = { TIME_UP: 'Time ran out', DETONATION: 'Bomb detonated', VIP_DEAD: 'VIP eliminated' }[missionResult.reason] || (missionResult.reason || 'Mission failed');
            _safeNotify('\u274c MISSION FAILED: ' + _failMsg, '#ff4444');
            if (missionResult.reason === 'DETONATION') {
              var player = _deps.getPlayer();
              if (player && !player.godMode) {
                var _defCfg = MissionTypes.getActive() ? MissionTypes.getActive().config : null;
                var _defDmg = (_defCfg && _defCfg.blastDamage) ? _defCfg.blastDamage : 200;
                player.hp = Math.max(1, player.hp - _defDmg);
                if (typeof HUD !== 'undefined' && HUD.setHealth) HUD.setHealth(player.hp, player.maxHp);
              }
              _safeShake(0.15, 1.2);
            }
            if (MissionTypes.cancelMission) MissionTypes.cancelMission();
            mTracker.style.display = 'none';
          }
        }
      }
    }

    // HUD mission status line (from updateExtendedHUD)
    var missionEl = document.getElementById('hud-missions');
    if (missionEl && typeof MissionSystem !== 'undefined' && MissionSystem.getActive) {
      var active = MissionSystem.getActive();
      if (active.length > 0 && active[0]) {
        missionEl.textContent = '\ud83d\udccb ' + active[0].name + ' (' + active[0].status + ')';
      } else {
        missionEl.textContent = '\ud83d\udccb No active missions';
      }
    }
  }

  /**
   * Update leaderboard display (e.g., on death screen).
   */
  function updateLeaderboard(rank) {
    var deadLB = document.getElementById('dead-leaderboard');
    if (deadLB) {
      deadLB.textContent = '\ud83c\udfc6 Leaderboard Rank: #' + (rank || '?');
    }
  }

  /**
   * Update daily challenges and bounty displays (throttled to once per second).
   */
  function updateChallenges(delta) {
    _hudSlowTimer -= delta || 0;
    if (_hudSlowTimer > 0) return;
    _hudSlowTimer = 1.0;

    if (typeof Progression === 'undefined') return;

    // Daily challenges display
    var dailyPanel = document.getElementById('daily-challenges');
    if (dailyPanel) {
      var dailies = (typeof Progression.getDailies === 'function') ? Progression.getDailies() : [];
      if (dailies && dailies.length > 0) {
        dailyPanel.style.display = 'block';
        var dailyList = document.getElementById('daily-challenges-list');
        if (dailyList) {
          var dHTML = '';
          for (var di = 0; di < dailies.length; di++) {
            var d = dailies[di];
            var pct = Math.min(100, Math.round((d.progress / d.target) * 100));
            var color = d.completed ? '#44ff44' : '#ccc';
            dHTML += '<div style="color:' + color + '">' + (d.completed ? '\u2705 ' : '<span style="display:inline-block;width:10px;height:10px;border:1px solid #888;margin-right:4px;vertical-align:middle"></span>') + d.name + ': ' + d.progress + '/' + d.target + ' (' + pct + '%)</div>';
          }
          dailyList.innerHTML = dHTML;
        }
      }
    }

    // Bounty display (rendered inside daily-challenges panel so it doesn't free-float)
    var bountyPanel = document.getElementById('bounty-display');
    if (bountyPanel) bountyPanel.style.display = 'none';
    var dailyList = document.getElementById('daily-challenges-list');
    if (dailyList) {
      var bounties = (typeof Progression.getBounties === 'function') ? Progression.getBounties() : [];
      if (bounties && bounties.length > 0) {
        var bHTML = '<div style="color:#ffaa00;font-weight:bold;margin-top:6px;border-top:1px solid rgba(255,170,0,0.3);padding-top:4px">BOUNTIES</div>';
        for (var bi = 0; bi < bounties.length; bi++) {
          var b = bounties[bi];
          var bpct = Math.min(100, Math.round((b.progress / b.target) * 100));
          var bcolor = b.completed ? '#44ff44' : '#ffaa00';
          bHTML += '<div style="color:' + bcolor + '">' + (b.completed ? '&#10003;' : '$') + ' ' + b.name + ': ' + b.progress + '/' + b.target + ' (+' + b.reward + ' OKC)</div>';
        }
        dailyList.innerHTML += bHTML;
      }
    }

    // Prestige indicator
    var prestigeInd = document.getElementById('prestige-indicator');
    if (prestigeInd && typeof Progression.getPrestigeLevel === 'function' && Progression.getPrestigeLevel() > 0) {
      prestigeInd.textContent = Progression.getPrestigeIcon() + ' P' + Progression.getPrestigeLevel();
    }
  }

  /**
   * Show an achievement popup (achievement-popup element).
   */
  function showAchievement(id, title, icon) {
    var popup = document.getElementById('achievement-popup');
    if (!popup) return;
    popup.style.display = 'block';
    var content = popup.querySelector('.achievement-content') || popup;
    if (content && title) {
      var safeTitle = String(title).replace(/[<>]/g, '');
      var safeIcon = icon ? String(icon).replace(/[<>]/g, '') : '\ud83c\udfc6';
      content.innerHTML = '<div style="font-size:24px">' + safeIcon + '</div><div style="color:#ffcc00;font-weight:bold">' + safeTitle + '</div><div style="color:#aaa;font-size:11px">Achievement Unlocked</div>';
    }
    setTimeout(function() {
      popup.style.display = 'none';
    }, 3000);
  }

  /**
   * Update perk display slots in the HUD (perk-slot-1, perk-slot-2, perk-slot-3).
   */
  function showPerk() {
    if (typeof Perks === 'undefined') return;
    var equipped = Perks.getEquipped();
    for (var i = 0; i < 3; i++) {
      var slot = document.getElementById('perk-slot-' + (i + 1));
      if (!slot) continue;
      if (equipped[i]) {
        slot.style.display = 'block';
        slot.textContent = equipped[i].icon + ' ' + equipped[i].name;
      } else {
        slot.style.display = 'none';
      }
    }
  }

  /**
   * Refresh the killstreak panel based on available Perks streaks.
   */
  function updateKillstreak() {
    if (typeof Perks === 'undefined') return;
    var ksList = document.getElementById('killstreak-list');
    if (!ksList) return;
    var avail = Perks.getAvailableStreaks();
    if (avail.length > 0) {
      var panel = document.getElementById('killstreak-panel');
      if (panel) panel.style.display = 'block';
      ksList.innerHTML = '';
      for (var ksi = 0; ksi < avail.length; ksi++) {
        var div = document.createElement('div');
        div.style.cssText = 'margin:3px 0;cursor:pointer;padding:2px 4px;border:1px solid #ff6600;border-radius:3px';
        div.textContent = avail[ksi].icon + ' ' + avail[ksi].name;
        div.onclick = (function(idx) {
          return function() { _activateStreak(idx); };
        })(ksi);
        ksList.appendChild(div);
      }
    } else {
      var panel = document.getElementById('killstreak-panel');
      if (panel) panel.style.display = 'none';
      ksList.innerHTML = '';
    }
  }

  /**
   * Activate a killstreak reward by index (called from killstreak panel clicks).
   */
  function _activateStreak(index) {
    if (typeof Perks === 'undefined') return;
    var streak = Perks.activateStreak(index);
    if (!streak) return;
    _safeNotify(streak.icon + ' ' + streak.name + ' ACTIVATED!', '#ff6600');
    try {
      if (typeof window !== 'undefined' && window.AudioSystem && window.AudioSystem.playExplosion) {
        window.AudioSystem.playExplosion();
      }
    } catch (e) {}
    _safeShake(0.4, 0.5);

    var player = _deps.getPlayer();
    var camera = _deps.getCamera();

    if (streak.id === 'ARTILLERY' || streak.id === 'AIRSTRIKE') {
      if (player && camera && typeof THREE !== 'undefined' && typeof Enemies !== 'undefined' && Enemies.damageInRadius) {
        var fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        var target = player.position.clone().add(fwd.multiplyScalar(30));
        Enemies.damageInRadius(target, streak.radius || 15, streak.damage || 200);
        if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion) {
          Tracers.spawnExplosion(target, (streak.radius || 15) * 0.3);
        }
      }
    } else if (streak.id === 'NUKE') {
      if (typeof Enemies !== 'undefined' && Enemies.getAll) {
        var allEn = Enemies.getAll();
        for (var i = 0; i < allEn.length; i++) {
          if (allEn[i].alive) Enemies.damage(allEn[i], 99999);
        }
      }
      if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion && player) {
        Tracers.spawnExplosion(player.position, 10);
      }
      _safeNotify('\u2622\ufe0f TACTICAL NUKE DEPLOYED!', '#ff0000');
    } else if (streak.id === 'ORBITAL') {
      if (player && typeof Enemies !== 'undefined' && Enemies.damageInRadius) {
        Enemies.damageInRadius(player.position, streak.radius || 20, streak.damage || 500);
      }
      if (typeof Tracers !== 'undefined' && Tracers.spawnExplosion && player) {
        Tracers.spawnExplosion(player.position, 8);
      }
    }

    // Refresh panel after activation
    var ksList = document.getElementById('killstreak-list');
    if (ksList) {
      var avail = Perks.getAvailableStreaks();
      if (avail.length === 0) {
        var panel = document.getElementById('killstreak-panel');
        if (panel) panel.style.display = 'none';
        ksList.innerHTML = '';
      }
    }
  }

  // ── Return public API ───────────────────────────────────────────────
  return {
    init: init,
    update: update,
    trackMission: trackMission,
    updateLeaderboard: updateLeaderboard,
    updateChallenges: updateChallenges,
    showAchievement: showAchievement,
    showPerk: showPerk,
    updateKillstreak: updateKillstreak
  };
})();

// Global export for browser environments (Node check-safe)
if (typeof window !== 'undefined') {
  window.MissionManager = MissionManager;
}
if (typeof globalThis !== 'undefined') {
  globalThis.MissionManager = MissionManager;
}
