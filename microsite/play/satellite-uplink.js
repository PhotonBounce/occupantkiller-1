/* ───────────────────────────────────────────────────────────────────────────
   satellite-uplink.js — Satellite uplink system with orbital intelligence
   and precision strike packages.

   Player flow:
     1. Find and activate the satellite dish (spawned at world edge)
     2. Press U to open the terminal interface (green on black overlay)
     3. Pick a strike package (A / B / C) and click ground to deploy

   Strike packages:
     A — KINETIC PENETRATOR: rod-drop in 6s, 15-unit radius, 800 dmg
     B — EMP BURST: 30-unit radius, disables enemy weapons 20s, stuns vehicles
     C — RECON SWEEP: satellite pass reveals all enemies on minimap 45s

   API: window.SatelliteUplink = { init(scene, camera), update(delta),
                                    activateDish(x,z), callStrike(pkg,pos), reset() }
   ─────────────────────────────────────────────────────────────────────────── */
window.SatelliteUplink = (function () {
  'use strict';

  /* ── constants ─────────────────────────────────────────────────────────── */
  var DISH_RANGE         = 40;     // player must stay within this radius
  var DISH_HP            = 150;    // dish can take this much damage
  var STRIKE_COOLDOWN    = 45;     // seconds per package recharge
  var KINETIC_DELAY      = 6;      // seconds until rod impact
  var KINETIC_RADIUS     = 15;     // blast radius
  var KINETIC_DAMAGE     = 800;
  var EMP_RADIUS         = 30;
  var EMP_DURATION       = 20;     // seconds
  var RECON_DURATION     = 45;     // seconds
  var SAT_PASS_DURATION  = 8;      // seconds for satellite light to cross sky
  var UPLINK_FLUCTUATE   = 0.3;    // rate of quality oscillation

  /* ── scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;

  /* ── dish state ────────────────────────────────────────────────────────── */
  var _dishGroup       = null;   // THREE.Group
  var _dishActivated   = false;
  var _dishHP          = DISH_HP;
  var _dishPos         = { x: 0, z: 0 };
  var _holoRing        = null;   // rotating holographic ring mesh
  var _holoRingMat     = null;
  var _holoTextMesh    = null;   // status text above dish (sprite canvas)
  var _holoAngle       = 0;

  /* ── interface state ───────────────────────────────────────────────────── */
  var _interfaceOpen   = false;
  var _selectedPkg     = 'A';    // A / B / C
  var _targeting       = false;  // waiting for ground click
  var _overlayEl       = null;
  var _uplinkQuality   = 75;     // percentage, 50-100
  var _qualityTimer    = 0;

  /* ── recon state ───────────────────────────────────────────────────────── */
  var _reconActive     = false;
  var _reconTimer      = 0;

  /* ── satellite pass animation ──────────────────────────────────────────── */
  var _satPassLight    = null;   // THREE.PointLight
  var _satPassActive   = false;
  var _satPassTimer    = 0;
  var _satPassStartX   = -200;
  var _satPassEndX     = 200;

  /* ── cooldowns: three packages ─────────────────────────────────────────── */
  var _pkgCooldowns    = { A: 0, B: 0, C: 0 };  // remaining seconds

  /* ── pending kinetic rod ─────────────────────────────────────────────────*/
  var _kineticPending  = false;
  var _kineticTimer    = 0;
  var _kineticTarget   = null;  // { x, z }
  var _kineticStreak   = null;  // THREE.Mesh falling rod visual

  /* ── temporary scene objects ───────────────────────────────────────────── */
  var _tempObjects     = [];    // { mesh, mat, life, t, update }
  var _empRings        = [];    // { mesh, mat, t, life }

  /* ── HUD elements ──────────────────────────────────────────────────────── */
  var _hudEl           = null;

  /* ── audio helper ──────────────────────────────────────────────────────── */
  function _getAudioCtx() {
    return window._audioCtx ||
      (window._audioCtx = new (window.AudioContext || window.webkitAudioContext)());
  }

  function _playBeep(freq, dur, vol) {
    try {
      var ctx  = _getAudioCtx();
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq || 880;
      gain.gain.setValueAtTime(vol || 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur || 0.2));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (dur || 0.2));
    } catch (e) { /* silent */ }
  }

  function _playBoom() {
    try {
      var ctx = _getAudioCtx();
      var buf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
      var d   = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.4));
      }
      var src = ctx.createBufferSource();
      var lp  = ctx.createBiquadFilter();
      var gn  = ctx.createGain();
      lp.type = 'lowpass';
      lp.frequency.value = 200;
      gn.gain.value = 1.0;
      src.buffer = buf;
      src.connect(lp);
      lp.connect(gn);
      gn.connect(ctx.destination);
      src.start();
    } catch (e) { /* silent */ }
  }

  function _playEmpSound() {
    try {
      var ctx  = _getAudioCtx();
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 1.5);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    } catch (e) { /* silent */ }
  }

  /* ── toast helper ──────────────────────────────────────────────────────── */
  function _toast(msg) {
    if (window.HUD && window.HUD.showToast) {
      window.HUD.showToast(msg);
    } else if (window.HUD && window.HUD.notifyPickup) {
      window.HUD.notifyPickup(msg);
    }
  }

  /* ── Three.js shorthand ─────────────────────────────────────────────────── */
  function _T() { return window.THREE; }

  /* ── dish mesh construction ─────────────────────────────────────────────── */
  function _buildDishMesh() {
    var T     = _T();
    var group = new T.Group();

    /* pole */
    var poleGeo = new T.CylinderGeometry(0.2, 0.25, 6, 8);
    var poleMat = new T.MeshLambertMaterial({ color: 0x556677 });
    var poleMesh = new T.Mesh(poleGeo, poleMat);
    poleMesh.position.y = 3;
    group.add(poleMesh);

    /* dish base (tilt bracket) */
    var bracketGeo = new T.BoxGeometry(0.4, 1.5, 0.4);
    var bracketMat = new T.MeshLambertMaterial({ color: 0x445566 });
    var bracketMesh = new T.Mesh(bracketGeo, bracketMat);
    bracketMesh.position.set(0, 6.5, 0);
    bracketMesh.rotation.z = 0.4;
    group.add(bracketMesh);

    /* 8-unit dish bowl (torus + filled disc) */
    var dishRimGeo = new T.TorusGeometry(4, 0.18, 8, 32);
    var dishMat    = new T.MeshLambertMaterial({ color: 0x778899 });
    var dishRim    = new T.Mesh(dishRimGeo, dishMat);
    dishRim.position.set(0, 7.5, 0);
    dishRim.rotation.x = Math.PI / 2 - 0.5;
    group.add(dishRim);

    /* dish surface (concave) using multiple rings */
    for (var ri = 0; ri < 4; ri++) {
      var rr = (ri + 1) * 0.8;
      var ringGeo = new T.TorusGeometry(rr, 0.08, 6, 24);
      var ringMat = new T.MeshLambertMaterial({ color: 0x667788 });
      var ringMesh = new T.Mesh(ringGeo, ringMat);
      ringMesh.position.set(0, 7.5 - ri * 0.12, 0);
      ringMesh.rotation.x = Math.PI / 2 - 0.5;
      group.add(ringMesh);
    }

    /* feed horn at center */
    var hornGeo = new T.CylinderGeometry(0.08, 0.25, 1.2, 8);
    var hornMat = new T.MeshLambertMaterial({ color: 0x334455 });
    var hornMesh = new T.Mesh(hornGeo, hornMat);
    hornMesh.position.set(0, 7.5, 1.5);
    hornMesh.rotation.x = 0.5;
    group.add(hornMesh);

    /* holographic status ring (floating above dish) */
    var holoGeo = new T.TorusGeometry(1.2, 0.05, 6, 32);
    var holoMat = new T.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.7 });
    var holoMesh = new T.Mesh(holoGeo, holoMat);
    holoMesh.position.set(0, 10, 0);
    group.add(holoMesh);
    _holoRing    = holoMesh;
    _holoRingMat = holoMat;

    /* point light on active dish */
    var dishLight = new T.PointLight(0x00ff88, 0, 20);
    dishLight.position.set(0, 10, 0);
    group.add(dishLight);
    _dishGroup._statusLight = dishLight;

    return group;
  }

  /* ── spawn dish at world edge ───────────────────────────────────────────── */
  function activateDish(x, z) {
    if (_dishGroup) {
      if (_scene) _scene.remove(_dishGroup);
    }

    _dishPos.x   = x;
    _dishPos.z   = z;
    _dishHP      = DISH_HP;
    _dishActivated = true;

    var T = _T();
    _dishGroup = new T.Group();
    _dishGroup._statusLight = null;

    var inner = _buildDishMesh();
    _dishGroup.add(inner);
    _dishGroup.position.set(x, 0, z);
    _scene.add(_dishGroup);

    _toast('SATELLITE DISH LOCATED — press U to uplink');
    _playBeep(440, 0.3, 0.2);
  }

  /* ── distance helper ────────────────────────────────────────────────────── */
  function _distToPlayer(wx, wz) {
    if (!_camera) return 9999;
    var dx = _camera.position.x - wx;
    var dz = _camera.position.z - wz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /* ── build overlay HTML ─────────────────────────────────────────────────── */
  function _createOverlay() {
    if (_overlayEl) return;
    _overlayEl = document.createElement('div');
    _overlayEl.id = 'satellite-uplink-overlay';
    _overlayEl.style.cssText = [
      'position:fixed',
      'top:0', 'left:0', 'right:0', 'bottom:0',
      'background:rgba(0,0,0,0.92)',
      'color:#00ff44',
      'font-family:monospace',
      'font-size:14px',
      'z-index:9000',
      'display:none',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'pointer-events:none',
      'user-select:none'
    ].join(';');
    document.body.appendChild(_overlayEl);
  }

  function _renderOverlay() {
    if (!_overlayEl) return;

    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    var aliveCount = 0;
    var mapDots = '';
    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en || en.dead || en.alive === false) continue;
      aliveCount++;
      var ep = en.position || (en.mesh && en.mesh.position);
      if (ep) {
        /* map 100x100 world to 200px canvas coords */
        var mx = Math.round(((ep.x + 50) / 100) * 190 + 5);
        var mz = Math.round(((ep.z + 50) / 100) * 190 + 5);
        mx = Math.max(5, Math.min(195, mx));
        mz = Math.max(5, Math.min(195, mz));
        var dotColor = (_reconActive || (en._reconRevealed)) ? '#00ff44' : '#ff4400';
        mapDots += '<rect x="' + (mx - 2) + '" y="' + (mz - 2) + '" width="4" height="4" fill="' + dotColor + '"/>';
      }
    }

    /* player dot */
    var ppx = 100, ppz = 100;
    if (_camera) {
      ppx = Math.round(((_camera.position.x + 50) / 100) * 190 + 5);
      ppz = Math.round(((_camera.position.z + 50) / 100) * 190 + 5);
      ppx = Math.max(5, Math.min(195, ppx));
      ppz = Math.max(5, Math.min(195, ppz));
    }

    var pkgNames = {
      A: 'KINETIC PENETRATOR  [15r/800dmg/6s]',
      B: 'EMP BURST           [30r/20s disable]',
      C: 'RECON SWEEP         [45s intel reveal]'
    };

    function cdStr(pkg) {
      var cd = _pkgCooldowns[pkg];
      if (cd <= 0) return '[READY]';
      return '[' + Math.ceil(cd) + 's]';
    }

    var qual = Math.round(_uplinkQuality);
    var qualColor = qual >= 80 ? '#00ff44' : qual >= 60 ? '#ffaa00' : '#ff4400';
    var dishDist = _distToPlayer(_dishPos.x, _dishPos.z);
    var inRange  = dishDist <= DISH_RANGE;

    var reconStr = _reconActive ? ' [RECON ACTIVE ' + Math.ceil(_reconTimer) + 's]' : '';

    _overlayEl.innerHTML = [
      '<div style="border:1px solid #00ff44;padding:20px;max-width:700px;width:90%;position:relative;">',
      '<div style="text-align:center;font-size:18px;letter-spacing:4px;margin-bottom:12px;color:#00ff88;">',
      '[ ORBITAL INTELLIGENCE UPLINK ]</div>',
      '<div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center;">',

      /* left panel: map */
      '<div>',
      '<div style="margin-bottom:4px;color:#00cc44;">TACTICAL MAP — ENEMY POSITIONS</div>',
      '<svg width="200" height="200" style="border:1px solid #00ff44;background:#001100;">',
      '<line x1="100" y1="0" x2="100" y2="200" stroke="#003300" stroke-width="1"/>',
      '<line x1="0" y1="100" x2="200" y2="100" stroke="#003300" stroke-width="1"/>',
      mapDots,
      '<rect x="' + (ppx - 3) + '" y="' + (ppz - 3) + '" width="6" height="6" fill="#0088ff"/>',
      '</svg>',
      '<div style="margin-top:4px;font-size:11px;">',
      '<span style="color:#0088ff;">■</span> YOU &nbsp;',
      '<span style="color:#00ff44;">■</span> TRACKED &nbsp;',
      '<span style="color:#ff4400;">■</span> UNTRACKED',
      '</div>',
      '</div>',

      /* right panel: status + packages */
      '<div style="min-width:280px;">',
      '<div style="margin-bottom:8px;">',
      'ENEMY COUNT: <span style="color:#ff4400;">' + aliveCount + '</span>',
      reconStr ? '<span style="color:#00ffcc;">' + reconStr + '</span>' : '',
      '</div>',
      '<div style="margin-bottom:8px;">',
      'UPLINK QUALITY: <span style="color:' + qualColor + ';">' + qual + '%</span>',
      '</div>',
      '<div style="margin-bottom:8px;">',
      'DISH HP: <span style="color:' + (_dishHP < 50 ? '#ff4400' : '#00ff44') + ';">' + _dishHP + '/' + DISH_HP + '</span>',
      '</div>',
      '<div style="margin-bottom:8px;">',
      'SIGNAL RANGE: <span style="color:' + (inRange ? '#00ff44' : '#ff4400') + ';">',
      inRange ? 'LOCKED (' + Math.round(dishDist) + 'm)' : 'LOST — TOO FAR (' + Math.round(dishDist) + 'm / ' + DISH_RANGE + 'm max)',
      '</span></div>',
      '<hr style="border-color:#003300;margin:10px 0;">',
      '<div style="margin-bottom:6px;letter-spacing:2px;color:#00cc88;">STRIKE PACKAGES</div>',

      /* package A */
      '<div style="margin-bottom:8px;padding:6px;border:1px solid ' + (_selectedPkg === 'A' ? '#00ff44' : '#003300') + ';cursor:pointer;" data-pkg="A">',
      '<span style="color:' + (_selectedPkg === 'A' ? '#00ff44' : '#007733') + ';">[A] ' + pkgNames.A + '</span>',
      ' <span style="color:' + (_pkgCooldowns.A <= 0 ? '#00ff44' : '#ff8800') + ';">' + cdStr('A') + '</span>',
      '<div style="height:4px;background:#001100;margin-top:4px;border:1px solid #003300;">',
      '<div style="height:100%;width:' + Math.round((1 - _pkgCooldowns.A / STRIKE_COOLDOWN) * 100) + '%;background:#00ff44;"></div>',
      '</div></div>',

      /* package B */
      '<div style="margin-bottom:8px;padding:6px;border:1px solid ' + (_selectedPkg === 'B' ? '#00ff44' : '#003300') + ';cursor:pointer;" data-pkg="B">',
      '<span style="color:' + (_selectedPkg === 'B' ? '#00ff44' : '#007733') + ';">[B] ' + pkgNames.B + '</span>',
      ' <span style="color:' + (_pkgCooldowns.B <= 0 ? '#00ff44' : '#ff8800') + ';">' + cdStr('B') + '</span>',
      '<div style="height:4px;background:#001100;margin-top:4px;border:1px solid #003300;">',
      '<div style="height:100%;width:' + Math.round((1 - _pkgCooldowns.B / STRIKE_COOLDOWN) * 100) + '%;background:#00ff44;"></div>',
      '</div></div>',

      /* package C */
      '<div style="margin-bottom:8px;padding:6px;border:1px solid ' + (_selectedPkg === 'C' ? '#00ff44' : '#003300') + ';cursor:pointer;" data-pkg="C">',
      '<span style="color:' + (_selectedPkg === 'C' ? '#00ff44' : '#007733') + ';">[C] ' + pkgNames.C + '</span>',
      ' <span style="color:' + (_pkgCooldowns.C <= 0 ? '#00ff44' : '#ff8800') + ';">' + cdStr('C') + '</span>',
      '<div style="height:4px;background:#001100;margin-top:4px;border:1px solid #003300;">',
      '<div style="height:100%;width:' + Math.round((1 - _pkgCooldowns.C / STRIKE_COOLDOWN) * 100) + '%;background:#00ff44;"></div>',
      '</div></div>',

      '<hr style="border-color:#003300;margin:10px 0;">',
      inRange
        ? '<div style="text-align:center;color:#00cc88;">[CLICK MAP / WORLD] MARK TARGET &nbsp; [A/B/C] SELECT &nbsp; [U] CLOSE</div>'
        : '<div style="text-align:center;color:#ff4400;">SIGNAL LOST — RETURN TO DISH WITHIN ' + DISH_RANGE + ' UNITS</div>',
      '</div>',  /* right panel */
      '</div>',  /* flex row */
      '</div>'   /* border box */
    ].join('');

    /* re-attach pointer events to package rows */
    _overlayEl.style.pointerEvents = 'auto';
    var rows = _overlayEl.querySelectorAll('[data-pkg]');
    for (var ri = 0; ri < rows.length; ri++) {
      (function (row) {
        row.addEventListener('click', function (e) {
          e.stopPropagation();
          _selectedPkg = row.getAttribute('data-pkg');
          _renderOverlay();
        }, false);
      })(rows[ri]);
    }
  }

  /* ── open / close interface ─────────────────────────────────────────────── */
  function _openInterface() {
    if (!_dishActivated) { _toast('No uplink dish activated'); return; }
    _interfaceOpen = true;
    _createOverlay();
    _overlayEl.style.display = 'flex';
    _targeting = false;
    _renderOverlay();
    _playBeep(660, 0.1, 0.1);
    _playBeep(880, 0.12, 0.1);
  }

  function _closeInterface() {
    _interfaceOpen = false;
    _targeting = false;
    if (_overlayEl) _overlayEl.style.display = 'none';
    _playBeep(440, 0.1, 0.08);
  }

  /* ── ground click raycasting ────────────────────────────────────────────── */
  function _groundPosFromEvent(event) {
    if (!_scene || !_camera) return null;
    var T    = _T();
    var rect = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    var canvas = document.querySelector('canvas');
    if (canvas && canvas.id !== 'minimap-canvas') rect = canvas.getBoundingClientRect();
    var nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    var ny = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    var raycaster = new T.Raycaster();
    raycaster.setFromCamera({ x: nx, y: ny }, _camera);
    var plane  = new T.Plane(new T.Vector3(0, 1, 0), 0);
    var target = new T.Vector3();
    var hit    = raycaster.ray.intersectPlane(plane, target);
    if (hit) return { x: target.x, z: target.z };
    var dir = new T.Vector3();
    _camera.getWorldDirection(dir);
    return {
      x: _camera.position.x + dir.x * 30,
      z: _camera.position.z + dir.z * 30
    };
  }

  /* ── satellite pass animation ───────────────────────────────────────────── */
  function _startSatellitePass(callback) {
    if (_satPassActive) return;
    var T = _T();
    _satPassLight = new T.PointLight(0xffffff, 4, 80);
    _satPassLight.position.set(_satPassStartX, 100, 0);
    _scene.add(_satPassLight);
    _satPassActive = true;
    _satPassTimer  = 0;
    _satPassCallback = callback || null;
  }

  var _satPassCallback = null;

  function _updateSatPass(delta) {
    if (!_satPassActive || !_satPassLight) return;
    _satPassTimer += delta;
    var t = _satPassTimer / SAT_PASS_DURATION;
    if (t >= 1) {
      _scene.remove(_satPassLight);
      if (_satPassLight.dispose) _satPassLight.dispose();
      _satPassLight  = null;
      _satPassActive = false;
      if (_satPassCallback) { _satPassCallback(); _satPassCallback = null; }
      return;
    }
    _satPassLight.position.x = _satPassStartX + (_satPassEndX - _satPassStartX) * t;
    /* pulse intensity */
    _satPassLight.intensity = 3 + Math.sin(t * Math.PI * 8) * 1.5;
  }

  /* ── strike: KINETIC PENETRATOR ─────────────────────────────────────────── */
  function _doKineticStrike(pos) {
    _kineticPending = true;
    _kineticTimer   = KINETIC_DELAY;
    _kineticTarget  = { x: pos.x, z: pos.z };
    _toast('KINETIC PENETRATOR INBOUND — ' + KINETIC_DELAY + 's');
    _playBeep(330, 0.5, 0.2);

    /* spawn the falling streak from high altitude */
    var T = _T();
    var streakGeo = new T.CylinderGeometry(0.15, 0.05, 8, 6);
    var streakMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
    var streakMesh = new T.Mesh(streakGeo, streakMat);
    streakMesh.position.set(pos.x, 90, pos.z);
    _scene.add(streakMesh);
    _kineticStreak = streakMesh;

    _startSatellitePass(null);
  }

  function _updateKinetic(delta) {
    if (!_kineticPending) return;
    _kineticTimer -= delta;

    /* animate streak falling */
    if (_kineticStreak) {
      var fallFrac = 1 - Math.max(0, _kineticTimer / KINETIC_DELAY);
      _kineticStreak.position.y = 90 - fallFrac * 85;
      _kineticStreak.material.opacity = 0.9 - fallFrac * 0.3;
    }

    if (_kineticTimer <= 0) {
      _kineticPending = false;
      /* remove streak */
      if (_kineticStreak) {
        _scene.remove(_kineticStreak);
        if (_kineticStreak.geometry) _kineticStreak.geometry.dispose();
        if (_kineticStreak.material) _kineticStreak.material.dispose();
        _kineticStreak = null;
      }
      _kineticImpact(_kineticTarget);
      _kineticTarget = null;
    }
  }

  function _kineticImpact(pos) {
    _playBoom();
    var T = _T();

    /* flash light */
    var flash = new T.PointLight(0xffffff, 30, 40);
    flash.position.set(pos.x, 1, pos.z);
    _scene.add(flash);
    _tempObjects.push({
      mesh: flash, isLight: true,
      t: 0, life: 0.5,
      update: function (obj, delta) {
        obj.mesh.intensity = 30 * (1 - obj.t / obj.life);
      }
    });

    /* explosion particles */
    for (var i = 0; i < 20; i++) {
      var pGeo = new T.SphereGeometry(0.4, 5, 4);
      var pMat = new T.MeshBasicMaterial({ color: (i % 2 === 0) ? 0xff6600 : 0xffdd00, transparent: true, opacity: 0.9 });
      var pMesh = new T.Mesh(pGeo, pMat);
      var ang = (i / 20) * Math.PI * 2;
      pMesh.position.set(pos.x, 0.5, pos.z);
      _scene.add(pMesh);
      var vx = Math.cos(ang) * (4 + Math.random() * 8);
      var vy = 4 + Math.random() * 10;
      var vz = Math.sin(ang) * (4 + Math.random() * 8);
      (function (mesh, mat, pvx, pvy, pvz) {
        _tempObjects.push({
          mesh: mesh, mat: mat, t: 0, life: 1.2 + Math.random() * 0.6,
          vx: pvx, vy: pvy, vz: pvz,
          update: function (obj, dt) {
            obj.mesh.position.x += obj.vx * dt;
            obj.mesh.position.y += obj.vy * dt;
            obj.mesh.position.z += obj.vz * dt;
            obj.vy -= 9.8 * dt;
            obj.mat.opacity = 0.9 * (1 - obj.t / obj.life);
            var s = 1 + (obj.t / obj.life) * 3;
            obj.mesh.scale.set(s, s, s);
          }
        });
      })(pMesh, pMat, vx, vy, vz);
    }

    /* crater */
    var cGeo  = new T.CircleGeometry(3, 20);
    var cMat  = new T.MeshBasicMaterial({ color: 0x110800, transparent: true, opacity: 0.9 });
    var cMesh = new T.Mesh(cGeo, cMat);
    cMesh.rotation.x = -Math.PI / 2;
    cMesh.position.set(pos.x, 0.02, pos.z);
    _scene.add(cMesh);
    _tempObjects.push({
      mesh: cMesh, mat: cMat, t: 0, life: 60,
      update: function (obj, dt) {
        if (obj.t > 55) {
          obj.mat.opacity = 0.9 * (1 - (obj.t - 55) / 5);
        }
      }
    });

    /* damage enemies */
    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    var kills = 0;
    for (var k = 0; k < enemies.length; k++) {
      var en = enemies[k];
      if (!en || en.dead || en.alive === false) continue;
      var ep = en.position || (en.mesh && en.mesh.position);
      if (!ep) continue;
      var dx = ep.x - pos.x;
      var dz = ep.z - pos.z;
      if (Math.sqrt(dx * dx + dz * dz) <= KINETIC_RADIUS) {
        var wasDead = en.dead || en.alive === false;
        if (en.takeDamage) en.takeDamage(KINETIC_DAMAGE);
        else if (en.health !== undefined) { en.health -= KINETIC_DAMAGE; if (en.health <= 0) en.dead = true; }
        if (!wasDead && (en.dead || en.alive === false || (en.health !== undefined && en.health <= 0))) kills++;
      }
    }

    /* destroy voxel blocks in radius */
    if (window.VoxelWorld && window.VoxelWorld.setBlock) {
      for (var bx = Math.floor(pos.x - KINETIC_RADIUS); bx <= Math.ceil(pos.x + KINETIC_RADIUS); bx++) {
        for (var bz = Math.floor(pos.z - KINETIC_RADIUS); bz <= Math.ceil(pos.z + KINETIC_RADIUS); bz++) {
          var bdx = bx - pos.x;
          var bdz = bz - pos.z;
          if (Math.sqrt(bdx * bdx + bdz * bdz) <= KINETIC_RADIUS) {
            for (var by = 0; by < 10; by++) {
              window.VoxelWorld.setBlock(bx, by, bz, 0);
            }
          }
        }
      }
    }

    if (kills > 0) _toast('KINETIC IMPACT — ' + kills + ' ELIMINATED');
    else _toast('KINETIC IMPACT');
    _playBeep(880, 0.1, 0.2);
  }

  /* ── strike: EMP BURST ──────────────────────────────────────────────────── */
  function _doEmpStrike(pos) {
    _toast('EMP BURST DEPLOYED');
    _playEmpSound();
    _startSatellitePass(null);

    var T = _T();

    /* expanding rings */
    for (var ri = 0; ri < 3; ri++) {
      var rGeo = new T.RingGeometry(0.1, 0.5, 32);
      var rMat = new T.MeshBasicMaterial({ color: 0x00ccff, side: T.DoubleSide, transparent: true, opacity: 0.8 });
      var rMesh = new T.Mesh(rGeo, rMat);
      rMesh.rotation.x = -Math.PI / 2;
      rMesh.position.set(pos.x, 0.3, pos.z);
      _scene.add(rMesh);
      (function (mesh, mat, delay) {
        var obj = {
          mesh: mesh, mat: mat, t: -delay, life: 1.5,
          update: function (o, dt) {
            if (o.t < 0) return;
            var prog = o.t / o.life;
            var r = prog * EMP_RADIUS;
            o.mesh.scale.setScalar(r > 0 ? r : 0.01);
            o.mat.opacity = 0.8 * (1 - prog);
          }
        };
        _empRings.push(obj);
        _tempObjects.push(obj);
      })(rMesh, rMat, ri * 0.3);
    }

    /* EMP light pulse */
    var eLight = new T.PointLight(0x00ccff, 15, EMP_RADIUS);
    eLight.position.set(pos.x, 2, pos.z);
    _scene.add(eLight);
    _tempObjects.push({
      mesh: eLight, isLight: true, t: 0, life: 1.0,
      update: function (obj, dt) {
        obj.mesh.intensity = 15 * (1 - obj.t / obj.life);
      }
    });

    /* apply EMP to enemies */
    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    var affected = 0;
    for (var ei = 0; ei < enemies.length; ei++) {
      var en = enemies[ei];
      if (!en || en.dead || en.alive === false) continue;
      var ep = en.position || (en.mesh && en.mesh.position);
      if (!ep) continue;
      var dx = ep.x - pos.x;
      var dz = ep.z - pos.z;
      if (Math.sqrt(dx * dx + dz * dz) <= EMP_RADIUS) {
        en._empDisabled    = true;
        en._empDisableTime = EMP_DURATION;
        en._empStunned     = true;
        affected++;
      }
    }

    /* stun vehicles */
    var vehicles = (window.Vehicles && window.Vehicles.getAll) ? window.Vehicles.getAll() : [];
    for (var vi = 0; vi < vehicles.length; vi++) {
      var v = vehicles[vi];
      if (!v) continue;
      var vp = v.position || (v.mesh && v.mesh.position);
      if (!vp) continue;
      var vdx = vp.x - pos.x;
      var vdz = vp.z - pos.z;
      if (Math.sqrt(vdx * vdx + vdz * vdz) <= EMP_RADIUS) {
        v._empStunned    = true;
        v._empStunTime   = EMP_DURATION;
      }
    }

    _toast('EMP BURST — ' + affected + ' TARGETS DISABLED FOR ' + EMP_DURATION + 's');
  }

  /* ── strike: RECON SWEEP ────────────────────────────────────────────────── */
  function _doReconSweep() {
    _toast('RECON SWEEP — all enemies revealed for ' + RECON_DURATION + 's');
    _reconActive = true;
    _reconTimer  = RECON_DURATION;

    /* mark all enemies as revealed */
    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i]) enemies[i]._reconRevealed = true;
    }

    _startSatellitePass(function () {
      _toast('RECON DATA INCOMING');
    });
    _playBeep(550, 0.2, 0.15);
    _playBeep(660, 0.2, 0.15);
    _playBeep(770, 0.3, 0.15);
  }

  /* ── public callStrike(pkg, pos) ────────────────────────────────────────── */
  function callStrike(pkg, pos) {
    pkg = pkg || _selectedPkg;
    if (!pkg || !pos) return;

    /* validate uplink */
    if (!_dishActivated || _dishHP <= 0) {
      _toast('UPLINK OFFLINE — dish destroyed or not activated');
      return;
    }
    if (_distToPlayer(_dishPos.x, _dishPos.z) > DISH_RANGE) {
      _toast('SIGNAL LOST — move closer to dish');
      return;
    }

    var cd = _pkgCooldowns[pkg];
    if (cd === undefined) { _toast('Unknown package: ' + pkg); return; }
    if (cd > 0) { _toast('Package ' + pkg + ' recharging — ' + Math.ceil(cd) + 's'); return; }

    _pkgCooldowns[pkg] = STRIKE_COOLDOWN;
    _closeInterface();

    if (pkg === 'A') {
      _doKineticStrike(pos);
    } else if (pkg === 'B') {
      _doEmpStrike(pos);
    } else if (pkg === 'C') {
      _doReconSweep();
    }
  }

  /* ── keyboard & click handlers ──────────────────────────────────────────── */
  function _onKeyDown(e) {
    if (e.code === 'KeyU') {
      e.preventDefault();
      if (_interfaceOpen) {
        _closeInterface();
      } else {
        _openInterface();
      }
      return;
    }
    if (_interfaceOpen) {
      if (e.code === 'KeyA') { _selectedPkg = 'A'; _renderOverlay(); return; }
      if (e.code === 'KeyB') { _selectedPkg = 'B'; _renderOverlay(); return; }
      if (e.code === 'KeyC') { _selectedPkg = 'C'; _renderOverlay(); return; }
    }
  }

  function _onClick(e) {
    if (!_interfaceOpen) return;
    /* ignore clicks on the overlay UI elements (package rows handled separately) */
    if (e.target && e.target.closest && e.target.closest('[data-pkg]')) return;
    if (e.target && e.target.id === 'satellite-uplink-overlay') return;

    /* check signal */
    if (!_dishActivated || _dishHP <= 0) { _toast('Dish offline'); return; }
    if (_distToPlayer(_dishPos.x, _dishPos.z) > DISH_RANGE) {
      _toast('Signal lost — too far from dish');
      _closeInterface();
      return;
    }

    var pos = _groundPosFromEvent(e);
    if (!pos) return;

    callStrike(_selectedPkg, pos);
  }

  /* ── dish damage (for enemy fire integration) ────────────────────────────── */
  function _takeDishDamage(amount) {
    if (!_dishActivated) return;
    _dishHP -= (amount || 10);
    if (_dishHP < 0) _dishHP = 0;
    if (_dishHP === 0) {
      _toast('SATELLITE DISH DESTROYED — uplink offline!');
      _closeInterface();
      _dishActivated = false;
      /* dim the holo ring */
      if (_holoRingMat) _holoRingMat.color.setHex(0xff2200);
      if (_dishGroup && _dishGroup._statusLight) _dishGroup._statusLight.color.setHex(0xff2200);
      _playBeep(110, 0.8, 0.3);
    } else if (_dishHP < 75) {
      _toast('DISH TAKING DAMAGE — ' + _dishHP + ' HP remaining!');
    }
  }

  /* ── update EMP timers on enemies ────────────────────────────────────────── */
  function _updateEmpEffects(delta) {
    var enemies = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en || !en._empDisabled) continue;
      en._empDisableTime -= delta;
      if (en._empDisableTime <= 0) {
        en._empDisabled    = false;
        en._empDisableTime = 0;
        en._empStunned     = false;
      }
    }
    var vehicles = (window.Vehicles && window.Vehicles.getAll) ? window.Vehicles.getAll() : [];
    for (var vi = 0; vi < vehicles.length; vi++) {
      var v = vehicles[vi];
      if (!v || !v._empStunned) continue;
      v._empStunTime -= delta;
      if (v._empStunTime <= 0) {
        v._empStunned  = false;
        v._empStunTime = 0;
      }
    }
  }

  /* ── update temp scene objects ──────────────────────────────────────────── */
  function _updateTempObjects(delta) {
    for (var i = _tempObjects.length - 1; i >= 0; i--) {
      var obj = _tempObjects[i];
      obj.t += delta;
      if (obj.update) obj.update(obj, delta);
      if (obj.t >= obj.life) {
        if (obj.isLight) {
          if (_scene) _scene.remove(obj.mesh);
          if (obj.mesh && obj.mesh.dispose) obj.mesh.dispose();
        } else {
          if (_scene) _scene.remove(obj.mesh);
          if (obj.mesh && obj.mesh.geometry) obj.mesh.geometry.dispose();
          if (obj.mat && obj.mat.dispose) obj.mat.dispose();
        }
        _tempObjects.splice(i, 1);
      }
    }
  }

  /* ── update holographic ring on dish ────────────────────────────────────── */
  function _updateHolo(delta) {
    if (!_holoRing) return;
    _holoAngle += delta * 1.5;
    _holoRing.rotation.y = _holoAngle;
    /* pulse brightness */
    var pulse = 0.5 + 0.3 * Math.sin(_holoAngle * 3);
    if (_holoRingMat) {
      _holoRingMat.opacity = _dishActivated ? 0.5 + pulse * 0.4 : 0.2;
    }
    if (_dishGroup && _dishGroup._statusLight) {
      _dishGroup._statusLight.intensity = _dishActivated && _dishHP > 0
        ? 1.5 + pulse
        : 0;
    }
  }

  /* ── update uplink quality fluctuation ──────────────────────────────────── */
  function _updateQuality(delta) {
    _qualityTimer += delta;
    _uplinkQuality = 75 + 25 * Math.sin(_qualityTimer * UPLINK_FLUCTUATE)
                       + 10 * Math.sin(_qualityTimer * 0.7)
                       - 10 * Math.cos(_qualityTimer * 0.4);
    _uplinkQuality = Math.max(50, Math.min(100, _uplinkQuality));
  }

  /* ── update cooldowns ────────────────────────────────────────────────────── */
  function _updateCooldowns(delta) {
    var pkgs = ['A', 'B', 'C'];
    for (var i = 0; i < pkgs.length; i++) {
      var p = pkgs[i];
      if (_pkgCooldowns[p] > 0) {
        _pkgCooldowns[p] -= delta;
        if (_pkgCooldowns[p] < 0) _pkgCooldowns[p] = 0;
      }
    }
  }

  /* ── update HUD bar ──────────────────────────────────────────────────────── */
  function _updateHUD() {
    if (!_hudEl) return;
    var dishStr = _dishActivated ? (_dishHP > 0 ? 'ONLINE' : 'DESTROYED') : 'NO DISH';
    var dishColor = (!_dishActivated || _dishHP <= 0) ? '#ff4400' : '#00ff44';
    var cdA = _pkgCooldowns.A <= 0 ? 'RDY' : Math.ceil(_pkgCooldowns.A) + 's';
    var cdB = _pkgCooldowns.B <= 0 ? 'RDY' : Math.ceil(_pkgCooldowns.B) + 's';
    var cdC = _pkgCooldowns.C <= 0 ? 'RDY' : Math.ceil(_pkgCooldowns.C) + 's';
    _hudEl.innerHTML = '<span style="color:' + dishColor + ';">SAT:' + dishStr + '</span>'
      + ' &nbsp; A:' + cdA + ' B:' + cdB + ' C:' + cdC
      + ' &nbsp; <span style="color:#888;">[U]UPLINK</span>';
  }

  /* ── public update(delta) ────────────────────────────────────────────────── */
  function update(delta) {
    if (!delta || delta <= 0) return;

    _updateCooldowns(delta);
    _updateQuality(delta);
    _updateHolo(delta);
    _updateSatPass(delta);
    _updateKinetic(delta);
    _updateTempObjects(delta);
    _updateEmpEffects(delta);

    /* recon sweep countdown */
    if (_reconActive) {
      _reconTimer -= delta;
      if (_reconTimer <= 0) {
        _reconActive = false;
        _reconTimer  = 0;
        /* clear recon flags */
        var enems = (window.Enemies && window.Enemies.getAll) ? window.Enemies.getAll() : [];
        for (var i = 0; i < enems.length; i++) {
          if (enems[i]) enems[i]._reconRevealed = false;
        }
        _toast('RECON SWEEP EXPIRED');
      }
    }

    /* signal check when interface is open */
    if (_interfaceOpen) {
      if (_distToPlayer(_dishPos.x, _dishPos.z) > DISH_RANGE) {
        _toast('SIGNAL LOST — interface closed');
        _closeInterface();
      } else {
        _renderOverlay();
      }
    }

    _updateHUD();

    /* expose dish damage function so other modules can call it */
    if (!window.SatelliteUplink._takeDishDamage) {
      window.SatelliteUplink._takeDishDamage = _takeDishDamage;
    }
  }

  /* ── public init(scene, camera) ─────────────────────────────────────────── */
  function init(scene, camera) {
    _scene  = scene  || window._gameScene || null;
    _camera = camera || window._camera    || null;

    _createOverlay();

    /* HUD strip */
    if (!_hudEl) {
      _hudEl = document.createElement('div');
      _hudEl.id = 'satellite-uplink-hud';
      _hudEl.style.cssText = [
        'position:fixed',
        'bottom:60px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.6)',
        'border:1px solid #00aa44',
        'color:#00ff44',
        'font-family:monospace',
        'font-size:12px',
        'padding:3px 10px',
        'border-radius:3px',
        'z-index:400',
        'pointer-events:none',
        'letter-spacing:1px'
      ].join(';');
      document.body.appendChild(_hudEl);
    }

    document.addEventListener('keydown', _onKeyDown, false);
    document.addEventListener('click',   _onClick,   false);

    /* auto-spawn dish at world edge if not yet activated */
    if (!_dishActivated && _scene) {
      activateDish(80, 80);
    }
  }

  /* ── public reset() ──────────────────────────────────────────────────────── */
  function reset() {
    _closeInterface();

    if (_dishGroup && _scene) _scene.remove(_dishGroup);
    _dishGroup     = null;
    _holoRing      = null;
    _holoRingMat   = null;
    _dishActivated = false;
    _dishHP        = DISH_HP;
    _holoAngle     = 0;

    /* kinetic */
    if (_kineticStreak && _scene) {
      _scene.remove(_kineticStreak);
      if (_kineticStreak.geometry) _kineticStreak.geometry.dispose();
      if (_kineticStreak.material) _kineticStreak.material.dispose();
    }
    _kineticStreak  = null;
    _kineticPending = false;
    _kineticTimer   = 0;
    _kineticTarget  = null;

    /* satellite pass */
    if (_satPassLight && _scene) {
      _scene.remove(_satPassLight);
      if (_satPassLight.dispose) _satPassLight.dispose();
    }
    _satPassLight    = null;
    _satPassActive   = false;
    _satPassTimer    = 0;
    _satPassCallback = null;

    /* temp objects */
    for (var i = 0; i < _tempObjects.length; i++) {
      var obj = _tempObjects[i];
      if (_scene) _scene.remove(obj.mesh);
      if (!obj.isLight) {
        if (obj.mesh && obj.mesh.geometry) obj.mesh.geometry.dispose();
        if (obj.mat && obj.mat.dispose) obj.mat.dispose();
      } else if (obj.mesh && obj.mesh.dispose) {
        obj.mesh.dispose();
      }
    }
    _tempObjects = [];
    _empRings    = [];

    /* cooldowns */
    _pkgCooldowns = { A: 0, B: 0, C: 0 };

    /* recon */
    _reconActive = false;
    _reconTimer  = 0;

    /* quality */
    _uplinkQuality = 75;
    _qualityTimer  = 0;

    /* hud */
    _updateHUD();
  }

  return {
    init:           init,
    update:         update,
    activateDish:   activateDish,
    callStrike:     callStrike,
    reset:          reset
  };
})();
