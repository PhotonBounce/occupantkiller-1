/* ============================================================
 *  CHAIN-LIGHTNING.JS — electric arc gun attachment
 *  Chains electric shots between nearby enemies on hit.
 *  Toggle: Shift+L
 *  window.ChainLightning = { init, update, activate, reset }
 * ============================================================ */
window.ChainLightning = (function () {
  'use strict';

  /* ── Config ───────────────────────────────────────────── */
  var CFG = {
    CHAIN_RADIUS:     8,      // units from hit point to find chain targets
    MAX_CHAINS:       3,      // max additional enemies to arc to
    PRIMARY_DMG:      30,     // damage to directly hit enemy
    CHAIN_DMG:        15,     // damage to each chained enemy
    STUN_DURATION:    0.8,    // seconds enemies are stunned
    ARC_POINTS:       5,      // intermediate jagged points per arc
    ARC_JITTER:       0.3,    // ± random offset on arc points
    ARC_FADE_TIME:    0.3,    // seconds arc visible before fading
    COOLDOWN:         0.4,    // seconds between chain lightning fires
    SCREEN_FX_TIME:   0.1,    // seconds of yellow screen flash
    AMMO_COST:        2,      // ammo deducted per chain activation
    SCORE_PER_CHAIN:  50,     // bonus score per chained kill
    ARC_COLOR:        0xFFFF44
  };

  /* ── State ────────────────────────────────────────────── */
  var _active = false;
  var _cooldownTimer = 0;
  var _screenFxTimer = 0;
  var _arcs = [];           // [{line, timer, fromPos, toPos}]
  var _hudBadge = null;
  var _hudPulseDir = 1;
  var _hudPulseVal = 1;
  var _initialized = false;
  var _prevOnShotFired = null;
  var _keyHandler = null;

  /* ── HUD badge ────────────────────────────────────────── */
  function _createHudBadge() {
    if (_hudBadge) return;
    _hudBadge = document.createElement('div');
    _hudBadge.id = 'chain-lightning-badge';
    _hudBadge.textContent = '⚡ CHAIN';
    _hudBadge.style.cssText = [
      'position:fixed',
      'top:160px',
      'left:12px',
      'color:#FFFF44',
      'font-size:13px',
      'font-family:monospace',
      'font-weight:bold',
      'z-index:200',
      'pointer-events:none',
      'display:none',
      'background:rgba(0,0,0,0.5)',
      'padding:2px 8px',
      'border-radius:4px',
      'border:1px solid rgba(255,255,68,0.5)',
      'text-shadow:0 0 8px #FFFF44'
    ].join(';');
    document.body.appendChild(_hudBadge);
  }

  function _showHudBadge(show) {
    if (!_hudBadge) return;
    _hudBadge.style.display = show ? 'block' : 'none';
  }

  function _pulseHud(dt) {
    if (!_hudBadge || !_active) return;
    _hudPulseVal += _hudPulseDir * dt * 3;
    if (_hudPulseVal >= 1) { _hudPulseVal = 1; _hudPulseDir = -1; }
    if (_hudPulseVal <= 0.3) { _hudPulseVal = 0.3; _hudPulseDir = 1; }
    _hudBadge.style.opacity = String(_hudPulseVal);
  }

  /* ── Audio: electric zap ──────────────────────────────── */
  function _playZap() {
    try {
      var ctx = window._audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var numBlips = 3;
      var blipDur = 0.05;
      var freqStart = 300;
      var freqEnd = 800;
      for (var i = 0; i < numBlips; i++) {
        (function (delay) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freqStart, ctx.currentTime + delay);
          osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + delay + blipDur);
          gain.gain.setValueAtTime(0.18, ctx.currentTime + delay);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + blipDur);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + blipDur + 0.01);
        })(i * (blipDur + 0.01));
      }
    } catch (e) {
      /* audio not available, ignore */
    }
  }

  /* ── Screen yellow flash ──────────────────────────────── */
  function _triggerScreenFx() {
    _screenFxTimer = CFG.SCREEN_FX_TIME;
    _applyScreenFx(true);
  }

  function _applyScreenFx(on) {
    var canvas = document.querySelector('canvas');
    var container = document.getElementById('game-container') || document.body;
    var target = canvas || container;
    if (on) {
      target.style.filter = 'brightness(1.3) saturate(0.5)';
    } else {
      target.style.filter = '';
    }
  }

  /* ── Build a jagged THREE.Line arc between two positions ─ */
  function _buildArc(fromVec, toVec) {
    if (!window.THREE) return null;
    var points = [];
    points.push(fromVec.clone());
    for (var i = 1; i <= CFG.ARC_POINTS; i++) {
      var t = i / (CFG.ARC_POINTS + 1);
      var pt = fromVec.clone().lerp(toVec, t);
      pt.x += (Math.random() - 0.5) * 2 * CFG.ARC_JITTER;
      pt.y += (Math.random() - 0.5) * 2 * CFG.ARC_JITTER;
      pt.z += (Math.random() - 0.5) * 2 * CFG.ARC_JITTER;
      points.push(pt);
    }
    points.push(toVec.clone());

    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var material = new THREE.LineBasicMaterial({
      color: CFG.ARC_COLOR,
      transparent: true,
      opacity: 1.0
    });
    var line = new THREE.Line(geometry, material);
    return line;
  }

  /* ── Jitter arc points each frame (living electricity) ─── */
  function _jitterArc(arc) {
    if (!arc || !arc.line) return;
    var line = arc.line;
    var posAttr = line.geometry.attributes.position;
    if (!posAttr) return;
    var count = posAttr.count;
    // Skip first and last points (anchors)
    for (var i = 1; i < count - 1; i++) {
      var x = posAttr.getX(i) + (Math.random() - 0.5) * 0.08;
      var y = posAttr.getY(i) + (Math.random() - 0.5) * 0.08;
      var z = posAttr.getZ(i) + (Math.random() - 0.5) * 0.08;
      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
  }

  /* ── Remove an arc from scene ─────────────────────────── */
  function _removeArc(arcObj) {
    if (!arcObj || !arcObj.line) return;
    var scene = window._gameScene;
    if (scene) scene.remove(arcObj.line);
    if (arcObj.line.geometry) arcObj.line.geometry.dispose();
    if (arcObj.line.material) arcObj.line.material.dispose();
    arcObj.line = null;
  }

  /* ── Get all enemies via Enemies API ─────────────────── */
  function _getEnemies() {
    return (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
  }

  /* ── Get enemy world position ─────────────────────────── */
  function _enemyPos(enemy) {
    if (!enemy) return null;
    if (enemy.mesh && enemy.mesh.position) return enemy.mesh.position;
    if (enemy.position) return enemy.position;
    if (enemy.object3d && enemy.object3d.position) return enemy.object3d.position;
    return null;
  }

  /* ── Core chain logic ────────────────────────────────── */
  function _onShot(pos, dir) {
    if (!_active) return;
    if (_cooldownTimer > 0) return;

    /* Check ammo cost */
    if (typeof window._currentAmmo !== 'undefined' && window._currentAmmo !== null) {
      if (window._currentAmmo < CFG.AMMO_COST) return;
      window._currentAmmo -= CFG.AMMO_COST;
    }

    var scene = window._gameScene;
    if (!scene) return;
    if (!window.THREE) return;

    var hitPoint = pos && pos.isVector3 ? pos : (pos ? new THREE.Vector3(pos.x || 0, pos.y || 0, pos.z || 0) : new THREE.Vector3());

    /* Find all enemies within radius of hit point */
    var enemies = _getEnemies();
    var nearby = [];
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (!e || e.dead || e.isDead) continue;
      var epos = _enemyPos(e);
      if (!epos) continue;
      var dist = hitPoint.distanceTo(epos);
      if (dist <= CFG.CHAIN_RADIUS) {
        nearby.push({ enemy: e, pos: epos.clone(), dist: dist });
      }
    }

    /* Sort by distance, take up to MAX_CHAINS */
    nearby.sort(function (a, b) { return a.dist - b.dist; });
    var targets = nearby.slice(0, CFG.MAX_CHAINS);

    if (targets.length === 0) return;

    /* Fire effects */
    _playZap();
    _triggerScreenFx();
    _cooldownTimer = CFG.COOLDOWN;

    /* Draw arcs and deal damage */
    for (var j = 0; j < targets.length; j++) {
      var t = targets[j];
      var enemy = t.enemy;
      var toPos = t.pos;

      /* Chain arc visual */
      var line = _buildArc(hitPoint, toPos);
      if (line) {
        scene.add(line);
        _arcs.push({ line: line, timer: CFG.ARC_FADE_TIME, fromPos: hitPoint.clone(), toPos: toPos.clone() });
      }

      /* Chain damage */
      var dmg = CFG.CHAIN_DMG;
      if (typeof enemy.health !== 'undefined') {
        var prevHp = enemy.health;
        enemy.health -= dmg;
        if (enemy.health <= 0 && prevHp > 0) {
          /* Chained kill bonus */
          if (window.player && typeof window.player.score !== 'undefined') {
            window.player.score += CFG.SCORE_PER_CHAIN;
          }
          if (window.HUD && window.HUD.showToast) {
            window.HUD.showToast('CHAIN KILL! +' + CFG.SCORE_PER_CHAIN);
          }
        }
      } else if (typeof enemy.takeDamage === 'function') {
        enemy.takeDamage(dmg);
      }

      /* Stun */
      enemy.stunned = true;
      enemy.stunTimer = CFG.STUN_DURATION;
    }
  }

  /* ── Toggle chain lightning mode ─────────────────────── */
  function _toggle() {
    _active = !_active;
    _showHudBadge(_active);
    if (_active) {
      _hudPulseVal = 1;
      _hudPulseDir = -1;
    }
  }

  /* ── Key handler ──────────────────────────────────────── */
  function _onKeyDown(e) {
    /* Shift+L */
    if (e.shiftKey && (e.key === 'L' || e.key === 'l')) {
      _toggle();
    }
  }

  /* ── Public: init ─────────────────────────────────────── */
  function init() {
    if (_initialized) return;
    _initialized = true;

    _createHudBadge();

    /* Hook window._onShotFired */
    _prevOnShotFired = window._onShotFired || null;
    window._onShotFired = function (pos, dir) {
      if (_prevOnShotFired) _prevOnShotFired(pos, dir);
      _onShot(pos, dir);
    };

    /* Keyboard listener */
    _keyHandler = _onKeyDown;
    document.addEventListener('keydown', _keyHandler);
  }

  /* ── Public: update (call each frame with delta time) ─── */
  function update(dt) {
    if (!_initialized) return;

    /* Cooldown tick */
    if (_cooldownTimer > 0) {
      _cooldownTimer -= dt;
      if (_cooldownTimer < 0) _cooldownTimer = 0;
    }

    /* Screen effect fade */
    if (_screenFxTimer > 0) {
      _screenFxTimer -= dt;
      if (_screenFxTimer <= 0) {
        _screenFxTimer = 0;
        _applyScreenFx(false);
      }
    }

    /* Update arc lifetimes */
    var keepArcs = [];
    for (var i = 0; i < _arcs.length; i++) {
      var arc = _arcs[i];
      arc.timer -= dt;
      if (arc.timer <= 0) {
        _removeArc(arc);
      } else {
        /* Fade opacity */
        var opacity = arc.timer / CFG.ARC_FADE_TIME;
        if (arc.line && arc.line.material) {
          arc.line.material.opacity = opacity;
        }
        /* Jitter for living electricity */
        _jitterArc(arc);
        keepArcs.push(arc);
      }
    }
    _arcs = keepArcs;

    /* HUD pulse */
    if (_active) _pulseHud(dt);
  }

  /* ── Public: activate (programmatic trigger) ──────────── */
  function activate(pos, dir) {
    _onShot(
      pos || new (window.THREE ? THREE.Vector3 : function (x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; this.isVector3 = true; this.distanceTo = function (v) { var dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z; return Math.sqrt(dx*dx+dy*dy+dz*dz); }; this.clone = function () { return { x: this.x, y: this.y, z: this.z, isVector3: true }; }; })(),
      dir || null
    );
  }

  /* ── Public: reset ────────────────────────────────────── */
  function reset() {
    /* Remove all arcs */
    for (var i = 0; i < _arcs.length; i++) {
      _removeArc(_arcs[i]);
    }
    _arcs = [];

    _active = false;
    _cooldownTimer = 0;
    _screenFxTimer = 0;
    _applyScreenFx(false);
    _showHudBadge(false);

    /* Restore previous hook */
    if (_prevOnShotFired !== null) {
      window._onShotFired = _prevOnShotFired;
    }
    _prevOnShotFired = null;

    /* Remove key listener */
    if (_keyHandler) {
      document.removeEventListener('keydown', _keyHandler);
      _keyHandler = null;
    }

    _initialized = false;
  }

  return { init: init, update: update, activate: activate, reset: reset };

})();
