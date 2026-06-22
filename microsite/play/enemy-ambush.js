/* ════════════════════════════════════════════════════════════════════
 *  ENEMY AMBUSH TRIGGER SYSTEM
 *  ─────────────────────────────────────────────────────────────────
 *  Places 5 invisible trigger zones at fixed world positions.
 *  When the player walks within 3 units of a zone (first time only):
 *   - 4-6 enemies spawn simultaneously from flanking positions
 *   - Red "AMBUSH!" vignette flashes on screen (0.5 s)
 *   - AudioContext burst of gunfire noise (0.3 s)
 *   - Optional trip-wire visual (thin CylinderGeometry beam)
 *  Each zone resets after 60 s, giving the player a second chance.
 *  Ambush enemies have 1.3× base aggression (speed multiplier).
 *
 *  Public API (window.EnemyAmbush):
 *    EnemyAmbush.init(scene)   — call once after scene is ready
 *    EnemyAmbush.update(delta) — call every frame
 *    EnemyAmbush.reset()       — clear all zones (new level / restart)
 *
 *  Debug state:
 *    window._ambushTriggered[zoneId]  — true while zone is "hot"
 * ═════════════════════════════════════════════════════════════════ */

window.EnemyAmbush = (function () {
  'use strict';

  /* ── Fixed zone definitions (world-space XZ, Y=0) ── */
  var ZONE_DEFS = [
    { id: 0, x:  20, z:  20 },
    { id: 1, x: -25, z:  15 },
    { id: 2, x:  10, z: -30 },
    { id: 3, x: -15, z: -20 },
    { id: 4, x:  30, z: -10 },
  ];

  var TRIGGER_RADIUS    = 3;       // units: player must be this close
  var SPAWN_RADIUS      = 5;       // units around zone centre enemies appear
  var RESET_DELAY       = 60;      // seconds before zone can re-trigger
  var FLASH_DURATION    = 0.5;     // seconds of red vignette
  var NOISE_DURATION    = 0.3;     // seconds of AudioContext burst
  var AGGRESSION_SCALE  = 1.3;     // speed multiplier for ambush enemies

  /* ── Module state ── */
  var _scene      = null;
  var _zones      = [];            // runtime zone objects
  var _flashTimer = 0;             // counts down while vignette is shown
  var _vignetteEl = null;          // DOM element for ambush red flash

  /* ── Public tracking object ── */
  window._ambushTriggered = window._ambushTriggered || {};

  /* ════════════════════════════════════════════════
   *  HELPERS
   * ════════════════════════════════════════════════ */

  function _getPlayerPos() {
    // Try common game globals for player position
    if (window.GameManager && window.GameManager.getPlayerPosition) {
      return window.GameManager.getPlayerPosition();
    }
    if (window._playerPos) return window._playerPos;
    if (window.player && window.player.position) return window.player.position;
    return null;
  }

  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /* ── Create / destroy the DOM vignette overlay ── */
  function _ensureVignette() {
    if (_vignetteEl) return;
    _vignetteEl = document.createElement('div');
    _vignetteEl.id = 'ambush-vignette';
    _vignetteEl.style.cssText = [
      'position:fixed',
      'top:0', 'left:0', 'right:0', 'bottom:0',
      'pointer-events:none',
      'z-index:9000',
      'background:rgba(255,0,0,0.45)',
      'box-shadow:inset 0 0 80px 30px rgba(255,0,0,0.6)',
      'display:none',
      'transition:opacity 0.1s',
    ].join(';');
    document.body.appendChild(_vignetteEl);
  }

  function _showAmbushFlash() {
    _ensureVignette();
    _flashTimer = FLASH_DURATION;
    _vignetteEl.style.display = 'block';
    _vignetteEl.style.opacity = '1';

    // "AMBUSH!" text label
    var lbl = document.createElement('div');
    lbl.style.cssText = [
      'position:absolute',
      'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'font-family:monospace',
      'font-size:48px',
      'font-weight:bold',
      'color:#ff2222',
      'text-shadow:0 0 20px #ff0000,0 0 40px #ff0000',
      'letter-spacing:8px',
      'pointer-events:none',
      'user-select:none',
    ].join(';');
    lbl.textContent = 'AMBUSH!';
    _vignetteEl.appendChild(lbl);

    // Auto-remove the label after the flash
    setTimeout(function () {
      if (lbl.parentNode) lbl.parentNode.removeChild(lbl);
    }, FLASH_DURATION * 1000 + 200);
  }

  /* ── Brief burst of gunfire noise via Web Audio API ── */
  function _playAmbushSound() {
    try {
      var AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return;
      var ctx = new AudioContextCtor();

      var burstCount = 8;
      for (var bi = 0; bi < burstCount; bi++) {
        (function (delay) {
          var bufLen = Math.floor(ctx.sampleRate * 0.08);
          var buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
          var data   = buf.getChannelData(0);
          for (var si = 0; si < bufLen; si++) {
            data[si] = (Math.random() * 2 - 1) *
                       Math.pow(1 - si / bufLen, 2.5); // sharp attack, fast decay
          }
          var src  = ctx.createBufferSource();
          src.buffer = buf;

          // Band-pass to give it a gunshot character
          var bpf         = ctx.createBiquadFilter();
          bpf.type        = 'bandpass';
          bpf.frequency.value = 800 + Math.random() * 600;
          bpf.Q.value     = 0.8;

          var gain        = ctx.createGain();
          gain.gain.value = 0.35;

          src.connect(bpf);
          bpf.connect(gain);
          gain.connect(ctx.destination);
          src.start(ctx.currentTime + delay);
          src.stop(ctx.currentTime + delay + 0.08);

          // Close the ctx after the last burst to free resources
          if (delay >= (burstCount - 1) * 0.035) {
            setTimeout(function () {
              try { ctx.close(); } catch (e2) { /* ignore */ }
            }, (delay + 0.2) * 1000);
          }
        }(bi * 0.035));
      }
    } catch (e) {
      /* AudioContext may be unavailable — silently skip */
    }
  }

  /* ── Spawn 4-6 enemies around the trigger point ── */
  function _spawnAmbushEnemies(zone) {
    if (typeof window.Enemies === 'undefined' || !window.Enemies.spawnSingle) return;

    var count    = 4 + Math.floor(Math.random() * 3); // 4, 5 or 6
    var types    = ['CONSCRIPT', 'CONSCRIPT', 'STORMER', 'ARMORED'];

    for (var i = 0; i < count; i++) {
      var angle   = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      var dist    = SPAWN_RADIUS + (Math.random() - 0.5) * 2;
      var sx      = zone.x + Math.cos(angle) * dist;
      var sz      = zone.z + Math.sin(angle) * dist;
      var typeName = types[Math.floor(Math.random() * types.length)];

      var enemy   = window.Enemies.spawnSingle(typeName, { x: sx, z: sz }, {
        aggressionScale: AGGRESSION_SCALE,
      });

      // Apply 1.3× speed if the enemy object exposes a speed field
      if (enemy) {
        if (typeof enemy.speed    === 'number') enemy.speed    *= AGGRESSION_SCALE;
        if (typeof enemy.moveSpeed === 'number') enemy.moveSpeed *= AGGRESSION_SCALE;
        // Tag so other systems can identify this enemy as ambush-sourced
        if (enemy.userData !== undefined) enemy.userData.ambushEnemy = true;
        if (enemy.mesh && enemy.mesh.userData !== undefined) {
          enemy.mesh.userData.ambushEnemy = true;
        }
      }
    }
  }

  /* ── Build a thin CylinderGeometry trip-wire beam ── */
  function _buildTripwire(zone) {
    if (!_scene) return null;

    // Horizontal beam: length = 3, thin radius, sits at y = 0.15 (just off ground)
    var geo = new THREE.CylinderGeometry(0.03, 0.03, 3, 6);
    var mat = new THREE.MeshBasicMaterial({
      color:       0xff2200,
      transparent: true,
      opacity:     0.65,
    });
    var mesh = new THREE.Mesh(geo, mat);
    // Rotate so the cylinder lies flat (along X axis)
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(zone.x, 0.15, zone.z);
    _scene.add(mesh);
    return mesh;
  }

  /* ── Build the invisible BoxGeometry trigger volume ── */
  function _buildTriggerBox(zone) {
    if (!_scene) return null;

    var geo  = new THREE.BoxGeometry(
      TRIGGER_RADIUS * 2,
      4,
      TRIGGER_RADIUS * 2
    );
    var mat  = new THREE.MeshBasicMaterial({
      visible:     false,
      transparent: true,
      opacity:     0,
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(zone.x, 1, zone.z);
    _scene.add(mesh);
    return mesh;
  }

  /* ── Fire the ambush for a given zone ── */
  function _triggerAmbush(zone) {
    window._ambushTriggered[zone.def.id] = true;
    zone.triggered   = true;
    zone.resetTimer  = RESET_DELAY;

    // Hide trip-wire when triggered
    if (zone.tripwire) zone.tripwire.visible = false;

    _showAmbushFlash();
    _playAmbushSound();
    _spawnAmbushEnemies(zone.def);

    // Optional: also call the game's own enemy-alert if available
    if (typeof window.AudioSystem !== 'undefined' && window.AudioSystem.playEnemyAlert) {
      window.AudioSystem.playEnemyAlert();
    }

    console.log('[EnemyAmbush] Zone', zone.def.id, 'triggered at', zone.def.x, zone.def.z);
  }

  /* ════════════════════════════════════════════════
   *  PUBLIC API
   * ════════════════════════════════════════════════ */

  function init(scene) {
    _scene = scene || null;
    _zones = [];

    _ensureVignette();

    for (var i = 0; i < ZONE_DEFS.length; i++) {
      var def = ZONE_DEFS[i];
      var zone = {
        def:        def,
        x:          def.x,
        z:          def.z,
        triggered:  false,
        resetTimer: 0,
        triggerBox: _buildTriggerBox(def),
        tripwire:   _buildTripwire(def),
      };
      _zones.push(zone);
    }

    console.log('[EnemyAmbush] Initialised —', _zones.length, 'zones placed.');
  }

  function update(delta) {
    /* delta: seconds elapsed since last frame */
    if (!delta || delta <= 0) delta = 0.016;

    /* ── Tick flash timer ── */
    if (_flashTimer > 0) {
      _flashTimer -= delta;
      if (_flashTimer <= 0 && _vignetteEl) {
        _vignetteEl.style.opacity = '0';
        setTimeout(function () {
          if (_vignetteEl) _vignetteEl.style.display = 'none';
        }, 150);
        _flashTimer = 0;
      }
    }

    var playerPos = _getPlayerPos();
    if (!playerPos) return;

    var px = playerPos.x;
    var pz = playerPos.z;

    for (var i = 0; i < _zones.length; i++) {
      var zone = _zones[i];

      /* ── Count-down reset timer for triggered zones ── */
      if (zone.triggered) {
        zone.resetTimer -= delta;
        if (zone.resetTimer <= 0) {
          zone.triggered  = false;
          zone.resetTimer = 0;
          window._ambushTriggered[zone.def.id] = false;
          // Restore trip-wire visibility
          if (zone.tripwire) zone.tripwire.visible = true;
          console.log('[EnemyAmbush] Zone', zone.def.id, 'reset — ready to re-trigger.');
        }
        continue; // skip proximity check while hot
      }

      /* ── Proximity check ── */
      var d = _dist2D(px, pz, zone.x, zone.z);
      if (d <= TRIGGER_RADIUS) {
        _triggerAmbush(zone);
      }
    }
  }

  function reset() {
    /* Called between levels or on restart */
    for (var i = 0; i < _zones.length; i++) {
      var zone = _zones[i];
      zone.triggered  = false;
      zone.resetTimer = 0;
      if (zone.triggerBox && _scene) {
        _scene.remove(zone.triggerBox);
        zone.triggerBox.geometry.dispose();
        zone.triggerBox.material.dispose();
        zone.triggerBox = null;
      }
      if (zone.tripwire && _scene) {
        _scene.remove(zone.tripwire);
        zone.tripwire.geometry.dispose();
        zone.tripwire.material.dispose();
        zone.tripwire = null;
      }
    }
    _zones = [];
    window._ambushTriggered = {};
    _flashTimer = 0;
    if (_vignetteEl) {
      _vignetteEl.style.display = 'none';
      _vignetteEl.style.opacity = '0';
    }
    console.log('[EnemyAmbush] Reset complete.');
  }

  /* ════════════════════════════════════════════════
   *  EXPORT
   * ════════════════════════════════════════════════ */
  return {
    init:   init,
    update: update,
    reset:  reset,
  };

}());
