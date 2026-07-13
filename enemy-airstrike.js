/* ════════════════════════════════════════════════════════════════════
 *  ENEMY AIRSTRIKE / FORWARD OBSERVER SYSTEM
 *  ─────────────────────────────────────────────────────────────────
 *  Some enemies are designated Forward Observers (FO). When an FO
 *  spots the player it begins calling in an airstrike.
 *  The player must kill the FO within 8 seconds or the airstrike
 *  hits their last known position.
 *
 *  Public API:
 *    EnemyAirstrike.init(scene)            — call once after scene exists
 *    EnemyAirstrike.update(playerPos, scene) — per-frame
 *    EnemyAirstrike.triggerAirstrike(targetPos) — manual / internal
 *    EnemyAirstrike.reset()               — between waves / restarts
 *
 *  Hooks (set before or after init):
 *    window._onFOSpotted       — called when FO begins calling
 *    window._onAirstrikeInbound — called when countdown starts
 *    window._onAirstrikeCancelled — called when FO killed mid-count
 * ════════════════════════════════════════════════════════════════════ */

window.EnemyAirstrike = (function () {
  'use strict';

  /* ── module-level state ─────────────────────────────────────────── */
  var _scene           = null;

  /* active airstrike countdown */
  var _airstrikeActive  = false;
  var _airstrikeTimer   = 0;
  var _airstrikeDuration = 8;          // seconds the player has to kill the FO
  var _airstrikeTarget  = null;        // THREE.Vector3 — snapshot of player pos when called
  var _foCallerRef      = null;        // reference to the FO enemy calling the strike

  /* cooldown after a successful strike so FO can't immediately call again */
  var _globalCooldown   = 0;
  var GLOBAL_COOLDOWN   = 30;

  /* FO call-in delay: FO must be in combat 4 s before triggering */
  var COMBAT_SPOT_DELAY = 4;

  /* DOM elements (built once, reused) */
  var _hudEl            = null;        /* outer warning banner */
  var _barFillEl        = null;        /* countdown bar fill */
  var _timerTextEl      = null;        /* "8.0s" label */
  var _edgeFlashEl      = null;        /* red edge flash at 3 s */

  /* FO overhead labels — array of { enemy, div } */
  var _foLabels         = [];

  /* per-wave list of designated FOs */
  var _designatedFOs    = [];
  var _lastDesignatedWave = -1;

  /* tracks whether each FO already fired this wave */
  /* stored on enemy object as enemy._foUsedThisWave */

  /* ── internal timing for 3-s alarm ─────────────────────────────── */
  var _alarmFired       = false;

  /* ── explosion VFX queue ────────────────────────────────────────── */
  var _activeExplosions = [];   /* { mesh, mat, age, maxAge } */
  var _pendingBlasts    = [];   /* { targetPos, delay } remaining explosions */

  /* ── HUD construction ───────────────────────────────────────────── */
  function _buildHUD() {
    if (_hudEl) return;

    /* outer banner */
    _hudEl = document.createElement('div');
    _hudEl.id = 'fo-airstrike-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:8800',
      'pointer-events:none',
      'font-family:monospace',
      'text-align:center',
      'display:none',
      'min-width:280px',
    ].join(';');

    /* title row */
    var titleEl = document.createElement('div');
    titleEl.style.cssText = [
      'font-size:15px',
      'font-weight:bold',
      'color:#ff3300',
      'text-shadow:0 0 8px rgba(255,51,0,0.8)',
      'letter-spacing:2px',
      'margin-bottom:4px',
      'animation:fo-pulse 0.6s ease-in-out infinite alternate',
    ].join(';');
    titleEl.textContent = '⚠ AIRSTRIKE INBOUND — 8s ⚠';
    _hudEl.appendChild(titleEl);

    /* bar track */
    var barTrack = document.createElement('div');
    barTrack.style.cssText = [
      'width:240px',
      'height:14px',
      'background:rgba(0,0,0,0.6)',
      'border:1px solid rgba(255,51,0,0.6)',
      'border-radius:4px',
      'overflow:hidden',
      'margin:0 auto 4px auto',
      'position:relative',
    ].join(';');

    _barFillEl = document.createElement('div');
    _barFillEl.style.cssText = [
      'height:100%',
      'width:100%',
      'background:linear-gradient(90deg,#cc0000,#ff4400)',
      'border-radius:3px',
      'transition:width 0.1s linear',
    ].join(';');
    barTrack.appendChild(_barFillEl);
    _hudEl.appendChild(barTrack);

    /* timer text */
    _timerTextEl = document.createElement('div');
    _timerTextEl.style.cssText = [
      'font-size:12px',
      'color:#ff8888',
      'letter-spacing:1px',
    ].join(';');
    _timerTextEl.textContent = '8.0s';
    _hudEl.appendChild(_timerTextEl);

    /* inject @keyframes if not already present */
    if (!document.getElementById('fo-airstrike-style')) {
      var styleEl = document.createElement('style');
      styleEl.id = 'fo-airstrike-style';
      styleEl.textContent = [
        '@keyframes fo-pulse{',
        '  from{opacity:1;text-shadow:0 0 8px rgba(255,51,0,0.8);}',
        '  to{opacity:0.6;text-shadow:0 0 20px rgba(255,51,0,1);}',
        '}',
        '@keyframes fo-edge-flash{',
        '  0%{opacity:0} 50%{opacity:0.5} 100%{opacity:0}',
        '}',
      ].join('');
      document.head.appendChild(styleEl);
    }

    document.body.appendChild(_hudEl);

    /* red screen-edge flash (shown at 3 s) */
    _edgeFlashEl = document.createElement('div');
    _edgeFlashEl.id = 'fo-edge-flash';
    _edgeFlashEl.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'z-index:8790',
      'box-shadow:inset 0 0 80px 40px rgba(255,0,0,0.6)',
      'display:none',
      'animation:fo-edge-flash 0.4s ease-in-out infinite',
    ].join(';');
    document.body.appendChild(_edgeFlashEl);
  }

  /* ── FO overhead label ──────────────────────────────────────────── */
  function _buildFOLabel(enemy) {
    var div = document.createElement('div');
    div.style.cssText = [
      'position:absolute',
      'pointer-events:none',
      'z-index:8700',
      'color:#ffee00',
      'font-family:monospace',
      'font-size:12px',
      'font-weight:bold',
      'text-shadow:0 0 6px rgba(0,0,0,0.9),0 0 12px rgba(255,238,0,0.7)',
      'transform:translate(-50%,-100%)',
      'white-space:nowrap',
      'display:none',
    ].join(';');
    div.textContent = '◆ FO';
    document.body.appendChild(div);
    _foLabels.push({ enemy: enemy, div: div });
    return div;
  }

  /* ── project 3-D world position to 2-D screen coords ───────────── */
  function _worldToScreen(worldPos, camera) {
    if (!camera) return null;
    var vec = worldPos.clone();
    vec.project(camera);
    /* vec.z > 1 means behind camera */
    if (vec.z > 1) return null;
    return {
      x: (vec.x * 0.5 + 0.5) * window.innerWidth,
      y: (-vec.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  /* ── designate FOs for a new wave ──────────────────────────────── */
  function _designateFOsForWave(waveNum) {
    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    if (!enemies || enemies.length === 0) return;

    /* find enemies that already have typeCfg FO role */
    var typed = [];
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || !e.alive) continue;
      if (e.typeCfg && (e.typeCfg.role === 'FORWARD_OBSERVER' || e.typeCfg.type === 'FO')) {
        typed.push(e);
      }
    }

    /* pick random FOs from first 5 spawned if none typed */
    var candidates = typed.length > 0 ? typed : enemies.slice(0, 5);
    if (candidates.length === 0) return;

    var foIndex = Math.floor(Math.random() * candidates.length);
    var fo = candidates[foIndex];
    if (!fo) return;

    fo._isForwardObserver = true;
    fo._foSpottedTimer    = 0;   /* accumulates while playerSpotted */
    fo._foUsedThisWave    = false;
    fo._foLabelDiv        = _buildFOLabel(fo);

    _designatedFOs.push(fo);
  }

  /* ── start the countdown ────────────────────────────────────────── */
  function _beginCountdown(foEnemy, playerPos) {
    _airstrikeActive   = true;
    _airstrikeTimer    = _airstrikeDuration;
    _airstrikeTarget   = playerPos.clone();
    _foCallerRef       = foEnemy;
    _alarmFired        = false;

    _buildHUD();
    if (_hudEl) _hudEl.style.display = 'block';

    /* radio chatter */
    try {
      if (window.AudioSystem && typeof window.AudioSystem.playRadioChatter === 'function') {
        window.AudioSystem.playRadioChatter();
      }
    } catch (ex) {}

    /* hook */
    try { if (typeof window._onFOSpotted === 'function') window._onFOSpotted(foEnemy); } catch (ex) {}
    try { if (typeof window._onAirstrikeInbound === 'function') window._onAirstrikeInbound(foEnemy); } catch (ex) {}

    /* HUD notification */
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('⚠ AIRSTRIKE INBOUND — KILL THE FO!', '#ff3300');
    }
  }

  /* ── cancel the countdown (FO killed) ──────────────────────────── */
  function _cancelCountdown() {
    if (!_airstrikeActive) return;
    _airstrikeActive = false;
    _airstrikeTimer  = 0;
    _foCallerRef     = null;

    if (_hudEl) _hudEl.style.display = 'none';
    if (_edgeFlashEl) _edgeFlashEl.style.display = 'none';

    /* "CANCELLED" toast */
    if (typeof HUD !== 'undefined' && HUD.notifyPickup) {
      HUD.notifyPickup('✔ AIRSTRIKE CANCELLED', '#44ff88');
    }
    if (typeof HUD !== 'undefined' && HUD.showToast) {
      HUD.showToast('AIRSTRIKE CANCELLED', '#44ff88');
    }

    try { if (typeof window._onAirstrikeCancelled === 'function') window._onAirstrikeCancelled(); } catch (ex) {}
  }

  /* ── update HUD bar ─────────────────────────────────────────────── */
  function _updateHUD(timeLeft) {
    if (!_hudEl) return;
    var pct = Math.max(0, timeLeft / _airstrikeDuration) * 100;
    if (_barFillEl) _barFillEl.style.width = pct + '%';
    if (_timerTextEl) _timerTextEl.textContent = timeLeft.toFixed(1) + 's';
  }

  /* ── trigger the actual airstrike explosions ────────────────────── */
  function triggerAirstrike(targetPos) {
    if (!_scene) return;

    var baseX = (targetPos && targetPos.x !== undefined) ? targetPos.x : 0;
    var baseZ = (targetPos && targetPos.z !== undefined) ? targetPos.z : 0;
    var baseY = (targetPos && targetPos.y !== undefined) ? targetPos.y : 0;

    /* schedule 3 explosions 200 ms apart */
    for (var b = 0; b < 3; b++) {
      var offsetX = (Math.random() - 0.5) * 6;  /* ± 3 units */
      var offsetZ = (Math.random() - 0.5) * 6;
      _pendingBlasts.push({
        pos: new THREE.Vector3(baseX + offsetX, baseY, baseZ + offsetZ),
        delay: b * 0.2,
      });
    }

    /* camera shake */
    if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) {
      CameraSystem.shake(0.8, 1.5);
    }
  }

  /* ── spawn a single explosion mesh and register it ─────────────── */
  function _spawnExplosion(pos) {
    if (!_scene) return;

    var geo = new THREE.SphereGeometry(3, 8, 8);
    var mat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.scale.set(0.1, 0.1, 0.1);
    _scene.add(mesh);

    _activeExplosions.push({ mesh: mesh, mat: mat, age: 0, maxAge: 1.0 });

    /* damage player if within 5 units */
    try {
      var player = (window.GameManager && window.GameManager.getPlayer) ? window.GameManager.getPlayer() : null;
      if (player && player.position && !player.godMode) {
        var dx = player.position.x - pos.x;
        var dz = player.position.z - pos.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 5) {
          var dmg = Math.floor(80 * (1 - dist / 5));
          player.hp = Math.max(0, (player.hp || 100) - dmg);
          if (typeof HUD !== 'undefined' && HUD.setHealth) {
            HUD.setHealth(player.hp, player.maxHp || 100);
          }
          if (typeof HUD !== 'undefined' && HUD.showDamageFlash) {
            HUD.showDamageFlash(0xff3300, 0.7);
          }
        }
      }
    } catch (ex) {}

    /* mortar impact sound */
    try {
      if (window.AudioSystem && typeof window.AudioSystem.playMortarImpact === 'function') {
        window.AudioSystem.playMortarImpact();
      }
    } catch (ex) {}
  }

  /* ── init ───────────────────────────────────────────────────────── */
  function init(scene) {
    _scene = scene || (window.GameManager && window.GameManager.getScene && window.GameManager.getScene());
    _buildHUD();
    reset();
  }

  /* ── reset (call between waves / restarts) ──────────────────────── */
  function reset() {
    _airstrikeActive   = false;
    _airstrikeTimer    = 0;
    _airstrikeTarget   = null;
    _foCallerRef       = null;
    _alarmFired        = false;
    _globalCooldown    = 0;
    _pendingBlasts.length = 0;

    /* remove old FO labels */
    for (var i = 0; i < _foLabels.length; i++) {
      var lbl = _foLabels[i];
      if (lbl && lbl.div && lbl.div.parentNode) {
        lbl.div.parentNode.removeChild(lbl.div);
      }
    }
    _foLabels.length = 0;
    _designatedFOs.length = 0;
    _lastDesignatedWave = -1;

    /* clean up lingering explosion meshes */
    for (var j = 0; j < _activeExplosions.length; j++) {
      var exp = _activeExplosions[j];
      if (exp && exp.mesh && _scene) _scene.remove(exp.mesh);
    }
    _activeExplosions.length = 0;

    if (_hudEl) _hudEl.style.display = 'none';
    if (_edgeFlashEl) _edgeFlashEl.style.display = 'none';
  }

  /* ── per-frame update ───────────────────────────────────────────── */
  function update(playerPos, scene) {
    if (scene && scene !== _scene) _scene = scene;
    if (!_scene && window.GameManager && window.GameManager.getScene) {
      _scene = window.GameManager.getScene();
    }

    /* resolve playerPos if not passed */
    if (!playerPos && window.GameManager && window.GameManager.getPlayer) {
      var pl = window.GameManager.getPlayer();
      if (pl && pl.position) playerPos = pl.position;
    }

    /* delta — approximate from performance.now() */
    var now = performance.now() / 1000;
    if (!update._lastT) update._lastT = now;
    var delta = Math.min(now - update._lastT, 0.1);
    update._lastT = now;

    /* global cooldown tick */
    if (_globalCooldown > 0) {
      _globalCooldown -= delta;
      if (_globalCooldown < 0) _globalCooldown = 0;
    }

    /* ── wave: designate FO once per wave ── */
    var currentWave = (window.GameManager && window.GameManager.getCurrentWave) ? window.GameManager.getCurrentWave() : 0;
    if (currentWave >= 2 && currentWave !== _lastDesignatedWave) {
      _lastDesignatedWave = currentWave;
      _designateFOsForWave(currentWave);
    }

    /* ── camera reference for label projection ── */
    var camera = (window.GameManager && window.GameManager.getCamera) ? window.GameManager.getCamera() : null;
    if (!camera && window.CameraSystem && window.CameraSystem.getCamera) {
      camera = window.CameraSystem.getCamera();
    }

    /* ── update FO label positions ── */
    for (var li = 0; li < _foLabels.length; li++) {
      var lbl = _foLabels[li];
      if (!lbl || !lbl.enemy || !lbl.div) continue;
      var fo = lbl.enemy;
      if (!fo.alive || !fo.mesh) {
        lbl.div.style.display = 'none';
        continue;
      }
      if (!camera) { lbl.div.style.display = 'none'; continue; }
      var headPos = fo.mesh.position.clone();
      headPos.y += 2.5;
      var screen = _worldToScreen(headPos, camera);
      if (!screen) {
        lbl.div.style.display = 'none';
      } else {
        lbl.div.style.display = 'block';
        lbl.div.style.left = screen.x + 'px';
        lbl.div.style.top  = screen.y + 'px';
      }
    }

    /* ── scan FO enemies — check if any should start calling ── */
    if (!_airstrikeActive && _globalCooldown <= 0 && playerPos) {
      var allEnemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
      for (var ei = 0; ei < allEnemies.length; ei++) {
        var e = allEnemies[ei];
        if (!e || !e.alive || !e.mesh) continue;
        if (!e._isForwardObserver) continue;
        if (e._foUsedThisWave) continue;
        if (currentWave < 2) continue;

        /* accumulate time in combat (playerSpotted) */
        if (e.playerSpotted) {
          e._foSpottedTimer = (e._foSpottedTimer || 0) + delta;
        } else {
          /* decay slowly if player goes out of sight */
          e._foSpottedTimer = Math.max(0, (e._foSpottedTimer || 0) - delta * 0.5);
        }

        /* ready to call if in combat >= COMBAT_SPOT_DELAY */
        if (e._foSpottedTimer >= COMBAT_SPOT_DELAY) {
          _beginCountdown(e, playerPos);
          break;
        }
      }
    }

    /* ── active airstrike countdown ── */
    if (_airstrikeActive) {
      /* check if FO was killed */
      if (_foCallerRef && (!_foCallerRef.alive || _foCallerRef.hp <= 0)) {
        _cancelCountdown();
        /* FO is dead — remove its label */
        for (var ci = 0; ci < _foLabels.length; ci++) {
          if (_foLabels[ci] && _foLabels[ci].enemy === _foCallerRef) {
            if (_foLabels[ci].div) _foLabels[ci].div.style.display = 'none';
          }
        }
      } else {
        _airstrikeTimer -= delta;

        /* update HUD */
        _updateHUD(_airstrikeTimer);

        /* 3-second alarm */
        if (!_alarmFired && _airstrikeTimer <= 3) {
          _alarmFired = true;
          if (_edgeFlashEl) _edgeFlashEl.style.display = 'block';
          try {
            if (window.AudioSystem && typeof window.AudioSystem.playEnemyAlert === 'function') {
              window.AudioSystem.playEnemyAlert();
            }
          } catch (ex) {}
        }

        /* countdown reached 0 — fire! */
        if (_airstrikeTimer <= 0) {
          _airstrikeActive  = false;
          _airstrikeTimer   = 0;
          _globalCooldown   = GLOBAL_COOLDOWN;

          if (_foCallerRef) {
            _foCallerRef._foUsedThisWave = true;
            _foCallerRef._foSpottedTimer = 0;
          }
          _foCallerRef = null;

          if (_hudEl) _hudEl.style.display = 'none';
          if (_edgeFlashEl) _edgeFlashEl.style.display = 'none';

          /* snapshot player position at moment of impact */
          var targetPosSnap = _airstrikeTarget ? _airstrikeTarget.clone() : (playerPos ? playerPos.clone() : new THREE.Vector3());
          triggerAirstrike(targetPosSnap);
        }
      }
    }

    /* ── tick pending blast queue ── */
    for (var bi = _pendingBlasts.length - 1; bi >= 0; bi--) {
      _pendingBlasts[bi].delay -= delta;
      if (_pendingBlasts[bi].delay <= 0) {
        _spawnExplosion(_pendingBlasts[bi].pos);
        _pendingBlasts.splice(bi, 1);
      }
    }

    /* ── animate active explosion meshes ── */
    for (var xi = _activeExplosions.length - 1; xi >= 0; xi--) {
      var exp = _activeExplosions[xi];
      if (!exp) { _activeExplosions.splice(xi, 1); continue; }
      exp.age += delta;
      var progress = exp.age / exp.maxAge;
      /* scale from 0.1 → 1 in first half, then hold */
      var s = Math.min(1, progress * 2);
      exp.mesh.scale.set(s, s, s);
      /* fade out in second half */
      exp.mat.opacity = Math.max(0, 1 - (progress - 0.4) / 0.6);
      if (exp.age >= exp.maxAge) {
        if (_scene) _scene.remove(exp.mesh);
        exp.mesh.geometry.dispose();
        exp.mat.dispose();
        _activeExplosions.splice(xi, 1);
      }
    }
  }

  /* ── public API ─────────────────────────────────────────────────── */
  return {
    init:             init,
    update:           update,
    triggerAirstrike: triggerAirstrike,
    reset:            reset,
  };

})();
