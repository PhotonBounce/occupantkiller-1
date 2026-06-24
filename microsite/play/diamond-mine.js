/* ───────────────────────────────────────────────────────────────────────────
   diamond-mine.js — Deep African Diamond Mine Mission
   API: window.DiamondMine = { init, update, reset }
   Controls:
     D + M (D held, M pressed)  → activate / deactivate module
     WASD / Mouse               → move / look
     F (near miner, within 3u)  → free miner
     E (near crusher, within 3u)→ destroy ore crusher
   Objectives:
     • Free all 8 miners
     • Destroy all 3 ore crushers
     • Trigger cave-in to bury the warlord operation
   ─────────────────────────────────────────────────────────────────────────── */
window.DiamondMine = (function () {
  'use strict';

  /* ── Scene refs ─────────────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _active = false;

  /* ── All added objects (for cleanup) ────────────────────────────────────── */
  var _objects = [];

  /* ── HUD element ────────────────────────────────────────────────────────── */
  var _hud = null;

  /* ── Keybind state ──────────────────────────────────────────────────────── */
  var _keys             = {};
  var _dHeld            = false;
  var _dmCooldown       = 0;

  /* ── Player ─────────────────────────────────────────────────────────────── */
  var _posX   = 0;
  var _posY   = 1.8;
  var _posZ   = 30;
  var _yaw    = 0;
  var _pitch  = 0;
  var _speed  = 6;
  var _velY   = 0;
  var _onGround = true;
  var _pointerLocked = false;

  /* ── Objectives ─────────────────────────────────────────────────────────── */
  var _minersFree       = 0;
  var _minersTotal      = 8;
  var _crushersDestroyed = 0;
  var _crushersTotal    = 3;
  var _caveInTriggered  = false;
  var _caveInComplete   = false;
  var _missionComplete  = false;

  /* ── Game entity lists ──────────────────────────────────────────────────── */
  var _miners   = [];   // { mesh, freed, pos }
  var _crushers = [];   // { mesh, destroyed, pos, animT }
  var _guards   = [];   // { mesh, helmet, pos, dir, speed, range, baseX, baseZ }
  var _particles = [];  // { mesh, vx, vy, vz, ox, oz }
  var _ceiling  = [];   // { mesh, fallSpeed, falling }
  var _props    = [];   // static decorative meshes

  /* ── Interaction timers ─────────────────────────────────────────────────── */
  var _fDown    = false;
  var _eDown    = false;
  var _fCooldown = 0;
  var _eCooldown = 0;

  /* ── Notify banner ──────────────────────────────────────────────────────── */
  var _notify       = null;
  var _notifyTimer  = 0;

  /* ═══════════════════════════════════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════════════════════════════════ */

  function _makeMat(color, opts) {
    var params = { color: color };
    if (opts) {
      if (opts.emissive !== undefined) params.emissive = opts.emissive;
      if (opts.emissiveIntensity !== undefined) params.emissiveIntensity = opts.emissiveIntensity;
    }
    return new THREE.MeshLambertMaterial(params);
  }

  function _addMesh(mesh) {
    _scene.add(mesh);
    _objects.push(mesh);
    return mesh;
  }

  function _dist2(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _showNotify(msg, duration) {
    if (!_notify) return;
    _notify.textContent = msg;
    _notify.style.opacity = '1';
    _notifyTimer = duration || 3;
  }

  function _updateHUD() {
    if (!_hud) return;
    var lines = [
      '<b style="color:#FFD700">&#9651; DIAMOND MINE</b>',
      'MINERS FREED: ' + _minersFree + '/' + _minersTotal,
      'CRUSHERS DESTROYED: ' + _crushersDestroyed + '/' + _crushersTotal,
    ];
    if (_caveInTriggered) {
      lines.push('<span style="color:#FF4500">&#x26A0; CAVE-IN IN PROGRESS!</span>');
    }
    if (_missionComplete) {
      lines.push('<span style="color:#00FF88">&#10003; MISSION COMPLETE — MINERS FREED!</span>');
    }
    _hud.innerHTML = lines.join('<br>');
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ENVIRONMENT CONSTRUCTION
  ═══════════════════════════════════════════════════════════════════════════ */

  function _buildEnvironment() {

    /* ── Ambient light ─────────────────────────────────────────────────────── */
    var ambient = new THREE.AmbientLight(0x332211, 0.6);
    _addMesh(ambient);

    /* ── Point lights (simulate floodlights) ────────────────────────────────── */
    var ptColors = [0xFFAA33, 0xFF8800, 0xFFCC55];
    var ptPositions = [
      [-20, 8, -10], [10, 8, 0], [25, 8, 15]
    ];
    for (var li = 0; li < ptPositions.length; li++) {
      var pt = new THREE.PointLight(ptColors[li % ptColors.length], 1.2, 40);
      pt.position.set(ptPositions[li][0], ptPositions[li][1], ptPositions[li][2]);
      _addMesh(pt);
    }

    /* ── Floor ──────────────────────────────────────────────────────────────── */
    var floorGeo = new THREE.BoxGeometry(80, 0.4, 80);
    var floorMat = _makeMat(0x4A3728);
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.2, 0);
    _addMesh(floor);

    /* ── Ceiling panels (will fall in cave-in) ──────────────────────────────── */
    var ceilPositions = [
      [-25, 14, -15], [-10, 14, -5], [5, 14, 5],
      [20, 14, 15], [-5, 14, 20], [15, 14, -20],
      [0, 14, -30], [30, 14, 0]
    ];
    for (var ci = 0; ci < ceilPositions.length; ci++) {
      var cGeo = new THREE.BoxGeometry(14, 1.2, 14);
      var cMat = _makeMat(0x3D2B1A);
      var cMesh = new THREE.Mesh(cGeo, cMat);
      cMesh.position.set(ceilPositions[ci][0], ceilPositions[ci][1], ceilPositions[ci][2]);
      _addMesh(cMesh);
      _ceiling.push({ mesh: cMesh, fallSpeed: 0, falling: false, startY: ceilPositions[ci][1] });
    }

    /* ── Rock walls ─────────────────────────────────────────────────────────── */
    var wallDefs = [
      { w: 2, h: 15, d: 80, x: -40, y: 7.5, z: 0 },
      { w: 2, h: 15, d: 80, x:  40, y: 7.5, z: 0 },
      { w: 80, h: 15, d: 2, x: 0,  y: 7.5, z: -40 },
      { w: 80, h: 15, d: 2, x: 0,  y: 7.5, z:  40 }
    ];
    for (var wi = 0; wi < wallDefs.length; wi++) {
      var wd = wallDefs[wi];
      var wGeo = new THREE.BoxGeometry(wd.w, wd.h, wd.d);
      var wMat = _makeMat(0x5C4033);
      var wMesh = new THREE.Mesh(wGeo, wMat);
      wMesh.position.set(wd.x, wd.y, wd.z);
      _addMesh(wMesh);
    }

    /* ── Rock pillars ───────────────────────────────────────────────────────── */
    var pillarPositions = [
      [-15, 0], [15, -10], [-20, 15], [25, -20], [0, -25], [30, 25]
    ];
    for (var pi = 0; pi < pillarPositions.length; pi++) {
      var pGeo = new THREE.CylinderGeometry(1.2, 1.5, 12, 8);
      var pMat = _makeMat(0x5A3E2B);
      var pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(pillarPositions[pi][0], 6, pillarPositions[pi][1]);
      _addMesh(pMesh);
      _props.push(pMesh);
    }

    /* ── Mining cart rail track ──────────────────────────────────────────────── */
    _buildRails();

    /* ── Mining carts on rails ───────────────────────────────────────────────── */
    _buildMineCarts();

    /* ── Ore crushers (3 — objectives) ──────────────────────────────────────── */
    _buildCrushers();

    /* ── Mining cage elevator ────────────────────────────────────────────────── */
    _buildElevator();

    /* ── Explosive barrels ───────────────────────────────────────────────────── */
    _buildBarrels();

    /* ── Floodlights on stands ───────────────────────────────────────────────── */
    _buildFloodlights();

    /* ── Dust particles ──────────────────────────────────────────────────────── */
    _buildParticles();

    /* ── Miner NPCs (stationary colored boxes) ───────────────────────────────── */
    _buildMiners();

    /* ── Warlord guards ──────────────────────────────────────────────────────── */
    _buildGuards();
  }

  /* ── Rail track ─────────────────────────────────────────────────────────── */
  function _buildRails() {
    var railMat = _makeMat(0x888888);
    var tiePositions = [];
    for (var ti = -18; ti <= 18; ti += 2) {
      tiePositions.push(ti);
    }
    for (var ri = 0; ri < tiePositions.length; ri++) {
      var tGeo = new THREE.BoxGeometry(3, 0.15, 0.3);
      var tMesh = new THREE.Mesh(tGeo, railMat);
      tMesh.position.set(-5, 0.08, tiePositions[ri]);
      _addMesh(tMesh);
      _props.push(tMesh);
    }
    // left rail
    var lRailGeo = new THREE.BoxGeometry(0.15, 0.2, 38);
    var lRail = new THREE.Mesh(lRailGeo, railMat);
    lRail.position.set(-6, 0.1, 0);
    _addMesh(lRail);
    // right rail
    var rRail = new THREE.Mesh(lRailGeo.clone(), railMat);
    rRail.position.set(-4, 0.1, 0);
    _addMesh(rRail);
  }

  /* ── Mine carts ─────────────────────────────────────────────────────────── */
  function _buildMineCarts() {
    var cartPositions = [-14, -4, 10];
    var cartMat = _makeMat(0x8B4513);
    var oreMat  = _makeMat(0x4A4A4A);
    for (var mci = 0; mci < cartPositions.length; mci++) {
      var cartBody = new THREE.BoxGeometry(2, 1, 1.2);
      var cart = new THREE.Mesh(cartBody, cartMat);
      cart.position.set(-5, 0.6, cartPositions[mci]);
      _addMesh(cart);
      _props.push(cart);
      // ore in cart
      var oreGeo = new THREE.BoxGeometry(1.6, 0.5, 0.9);
      var ore = new THREE.Mesh(oreGeo, oreMat);
      ore.position.set(-5, 1.3, cartPositions[mci]);
      _addMesh(ore);
      // cart wheels
      for (var wi = 0; wi < 2; wi++) {
        var wGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.3, 8);
        var wMesh = new THREE.Mesh(wGeo, _makeMat(0x555555));
        wMesh.rotation.z = Math.PI / 2;
        wMesh.position.set(-5, 0.25, cartPositions[mci] + (wi === 0 ? -0.4 : 0.4));
        _addMesh(wMesh);
      }
    }
  }

  /* ── Ore crushers ────────────────────────────────────────────────────────── */
  function _buildCrushers() {
    var crusherDefs = [
      { x: 20,  z: -10 },
      { x: -25, z:  5  },
      { x: 10,  z:  25 }
    ];
    var bodyMat    = _makeMat(0x777766);
    var drumMat    = _makeMat(0x555544);
    var activeMat  = _makeMat(0xFF4400, { emissive: 0xFF2200, emissiveIntensity: 0.4 });

    for (var cri = 0; cri < crusherDefs.length; cri++) {
      var cd = crusherDefs[cri];
      // base
      var baseGeo = new THREE.BoxGeometry(3, 1, 2.5);
      var baseMesh = new THREE.Mesh(baseGeo, bodyMat);
      baseMesh.position.set(cd.x, 0.5, cd.z);
      _addMesh(baseMesh);
      // body
      var cbGeo = new THREE.BoxGeometry(2.5, 2, 2);
      var cbMesh = new THREE.Mesh(cbGeo, bodyMat);
      cbMesh.position.set(cd.x, 2, cd.z);
      _addMesh(cbMesh);
      // rotating drum (indicator)
      var drumGeo = new THREE.CylinderGeometry(0.6, 0.6, 2.1, 8);
      var drum = new THREE.Mesh(drumGeo, drumMat);
      drum.position.set(cd.x, 2, cd.z);
      drum.rotation.z = Math.PI / 2;
      _addMesh(drum);
      // active light indicator
      var indGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      var indMesh = new THREE.Mesh(indGeo, activeMat);
      indMesh.position.set(cd.x + 1.4, 2.6, cd.z);
      _addMesh(indMesh);

      _crushers.push({
        mesh: cbMesh,
        drum: drum,
        ind: indMesh,
        destroyed: false,
        pos: { x: cd.x, z: cd.z },
        animT: 0
      });
    }
  }

  /* ── Mining cage elevator ────────────────────────────────────────────────── */
  function _buildElevator() {
    var frameMat = _makeMat(0x888877);
    var cageMat  = _makeMat(0x666655);
    // shaft uprights
    var uprights = [
      [-34, 0], [-32, 0]
    ];
    for (var ui = 0; ui < uprights.length; ui++) {
      var uGeo = new THREE.BoxGeometry(0.3, 14, 0.3);
      var uMesh = new THREE.Mesh(uGeo, frameMat);
      uMesh.position.set(uprights[ui][0], 7, uprights[ui][1]);
      _addMesh(uMesh);
    }
    // cross bars
    for (var cbi = 0; cbi <= 3; cbi++) {
      var cbGeo = new THREE.BoxGeometry(2.5, 0.2, 0.2);
      var cbMesh = new THREE.Mesh(cbGeo, frameMat);
      cbMesh.position.set(-33, cbi * 4.5, 0);
      _addMesh(cbMesh);
    }
    // cage platform
    var cageGeo = new THREE.BoxGeometry(2, 0.3, 2);
    var cage = new THREE.Mesh(cageGeo, cageMat);
    cage.position.set(-33, 1, 0);
    _addMesh(cage);
    // cage bars
    var barOffsets = [-0.9, 0.9];
    for (var bi = 0; bi < barOffsets.length; bi++) {
      var bGeo = new THREE.BoxGeometry(0.1, 2, 2);
      var bMesh = new THREE.Mesh(bGeo, frameMat);
      bMesh.position.set(-33 + barOffsets[bi], 1.7, 0);
      _addMesh(bMesh);
    }
    // pulley wheel at top
    var pulGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 12);
    var pulMesh = new THREE.Mesh(pulGeo, frameMat);
    pulMesh.position.set(-33, 13.5, 0);
    _addMesh(pulMesh);
    // cable
    var cableGeo = new THREE.BoxGeometry(0.08, 12, 0.08);
    var cableMesh = new THREE.Mesh(cableGeo, _makeMat(0x444444));
    cableMesh.position.set(-33, 7.5, 0);
    _addMesh(cableMesh);
  }

  /* ── Explosive barrels ───────────────────────────────────────────────────── */
  function _buildBarrels() {
    var barrelDefs = [
      { x:  8, z: -18 },
      { x:  9, z: -18 },
      { x: -18, z: 20 },
      { x: -17, z: 20 },
      { x:  28, z:  8 },
    ];
    var bMat  = _makeMat(0xCC2200);
    var bMat2 = _makeMat(0xDD3300);
    for (var bari = 0; bari < barrelDefs.length; bari++) {
      var bd = barrelDefs[bari];
      var bGeo = new THREE.CylinderGeometry(0.45, 0.45, 1.1, 10);
      var bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.position.set(bd.x, 0.55, bd.z);
      _addMesh(bMesh);
      // stripe
      var strGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.15, 10);
      var strMesh = new THREE.Mesh(strGeo, bMat2);
      strMesh.position.set(bd.x, 0.7, bd.z);
      _addMesh(strMesh);
      _props.push(bMesh);
    }
  }

  /* ── Floodlights on stands ───────────────────────────────────────────────── */
  function _buildFloodlights() {
    var standMat  = _makeMat(0x888888);
    var lightMat  = _makeMat(0xFFFF99, { emissive: 0xFFFF44, emissiveIntensity: 0.8 });
    var houseMat  = _makeMat(0x555555);
    var lightDefs = [
      { x: -20, z: -10 },
      { x:  10, z:   0 },
      { x:  25, z:  15 },
      { x: -5,  z:  25 }
    ];
    for (var fli = 0; fli < lightDefs.length; fli++) {
      var fl = lightDefs[fli];
      // stand pole
      var poleGeo = new THREE.CylinderGeometry(0.1, 0.12, 5, 8);
      var poleMesh = new THREE.Mesh(poleGeo, standMat);
      poleMesh.position.set(fl.x, 2.5, fl.z);
      _addMesh(poleMesh);
      // stand base tripod legs
      for (var leg = 0; leg < 3; leg++) {
        var ang = (leg / 3) * Math.PI * 2;
        var lGeo = new THREE.BoxGeometry(0.08, 1, 0.08);
        var lMesh = new THREE.Mesh(lGeo, standMat);
        lMesh.position.set(
          fl.x + Math.cos(ang) * 0.5,
          0.5,
          fl.z + Math.sin(ang) * 0.5
        );
        lMesh.rotation.z = Math.cos(ang) * 0.4;
        lMesh.rotation.x = Math.sin(ang) * 0.4;
        _addMesh(lMesh);
      }
      // light housing
      var houseGeo = new THREE.BoxGeometry(0.6, 0.4, 0.3);
      var houseMesh = new THREE.Mesh(houseGeo, houseMat);
      houseMesh.position.set(fl.x, 5.2, fl.z);
      _addMesh(houseMesh);
      // light bulb
      var bulbGeo = new THREE.BoxGeometry(0.5, 0.3, 0.1);
      var bulbMesh = new THREE.Mesh(bulbGeo, lightMat);
      bulbMesh.position.set(fl.x, 5.2, fl.z + 0.2);
      _addMesh(bulbMesh);
    }
  }

  /* ── Dust particles (small gray boxes drifting upward) ───────────────────── */
  function _buildParticles() {
    var pMat = _makeMat(0xAAAAAA);
    for (var pni = 0; pni < 60; pni++) {
      var pGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      var pMesh = new THREE.Mesh(pGeo, pMat);
      var ox = (Math.random() - 0.5) * 60;
      var oz = (Math.random() - 0.5) * 60;
      pMesh.position.set(ox, Math.random() * 10, oz);
      _addMesh(pMesh);
      _particles.push({
        mesh: pMesh,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.3 + Math.random() * 0.5,
        vz: (Math.random() - 0.5) * 0.4,
        ox: ox,
        oz: oz
      });
    }
  }

  /* ── Miner NPCs ─────────────────────────────────────────────────────────── */
  function _buildMiners() {
    var minerPositions = [
      { x: -10, z: -20 }, { x:  5,  z: -25 }, { x:  18, z: -18 },
      { x: -28, z: -5  }, { x:  30, z:  10 }, { x:  12, z:  30 },
      { x: -15, z:  28 }, { x: -30, z:  22 }
    ];
    var bodyColors = [0xCC8855, 0xBB7744, 0xDD9966, 0xAA6633, 0xCC9955, 0xBB8844, 0xDD8855, 0xAA7755];
    var shirtColors = [0x3355AA, 0x225599, 0x4466BB, 0x114488, 0x336699, 0x2255AA, 0x4455BB, 0x335588];
    for (var mi = 0; mi < minerPositions.length; mi++) {
      var mp = minerPositions[mi];
      var group = new THREE.Group();
      // torso
      var torsoGeo = new THREE.BoxGeometry(0.6, 0.8, 0.35);
      var torsoMesh = new THREE.Mesh(torsoGeo, _makeMat(shirtColors[mi]));
      torsoMesh.position.set(0, 0.9, 0);
      group.add(torsoMesh);
      // head
      var headGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
      var headMesh = new THREE.Mesh(headGeo, _makeMat(bodyColors[mi]));
      headMesh.position.set(0, 1.55, 0);
      group.add(headMesh);
      // legs
      var legGeo = new THREE.BoxGeometry(0.25, 0.6, 0.28);
      for (var li = 0; li < 2; li++) {
        var legMesh = new THREE.Mesh(legGeo, _makeMat(0x443322));
        legMesh.position.set(li === 0 ? -0.16 : 0.16, 0.3, 0);
        group.add(legMesh);
      }
      // arms (bound — raised slightly)
      var armGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
      for (var ai = 0; ai < 2; ai++) {
        var armMesh = new THREE.Mesh(armGeo, _makeMat(bodyColors[mi]));
        armMesh.position.set(ai === 0 ? -0.45 : 0.45, 0.9, 0);
        armMesh.rotation.z = ai === 0 ? 0.4 : -0.4;
        group.add(armMesh);
      }
      // rope/chain (box between arms)
      var ropeGeo = new THREE.BoxGeometry(0.7, 0.08, 0.08);
      var ropeMesh = new THREE.Mesh(ropeGeo, _makeMat(0x997744));
      ropeMesh.position.set(0, 1.2, 0);
      group.add(ropeMesh);

      group.position.set(mp.x, 0, mp.z);
      _scene.add(group);
      _objects.push(group);

      _miners.push({
        mesh: group,
        freed: false,
        pos: { x: mp.x, z: mp.z }
      });
    }
  }

  /* ── Warlord guards ──────────────────────────────────────────────────────── */
  function _buildGuards() {
    var guardDefs = [
      { x:  15, z: -15, dir: 1,  speed: 2.5, range: 12 },
      { x: -20, z:  10, dir: -1, speed: 2.0, range: 10 },
      { x:  25, z:  20, dir: 1,  speed: 3.0, range: 14 },
      { x: -10, z:  -5, dir: -1, speed: 2.2, range: 8  },
      { x:  0,  z:  30, dir: 1,  speed: 1.8, range: 10 }
    ];
    var bodyMat    = _makeMat(0x556644);    // camo green
    var skinMat    = _makeMat(0xCC9966);
    var helmetMat  = _makeMat(0xFFDD44);    // hard-hat yellow
    var pantsMat   = _makeMat(0x3D4030);
    var gunMat     = _makeMat(0x222222);

    for (var gi = 0; gi < guardDefs.length; gi++) {
      var gd = guardDefs[gi];
      var grp = new THREE.Group();

      // torso
      var tGeo = new THREE.BoxGeometry(0.65, 0.85, 0.38);
      grp.add(new THREE.Mesh(tGeo, bodyMat));
      // head
      var hGeo = new THREE.BoxGeometry(0.48, 0.48, 0.48);
      var hMesh = new THREE.Mesh(hGeo, skinMat);
      hMesh.position.set(0, 0.67, 0);
      grp.add(hMesh);
      // hard-hat helmet (box geometry)
      var hatGeo = new THREE.BoxGeometry(0.58, 0.22, 0.58);
      var hatMesh = new THREE.Mesh(hatGeo, helmetMat);
      hatMesh.position.set(0, 1.0, 0);
      grp.add(hatMesh);
      // hat brim
      var brimGeo = new THREE.BoxGeometry(0.72, 0.06, 0.72);
      var brimMesh = new THREE.Mesh(brimGeo, helmetMat);
      brimMesh.position.set(0, 0.88, 0);
      grp.add(brimMesh);
      // legs
      var glGeo = new THREE.BoxGeometry(0.28, 0.65, 0.3);
      for (var gli = 0; gli < 2; gli++) {
        var glMesh = new THREE.Mesh(glGeo, pantsMat);
        glMesh.position.set(gli === 0 ? -0.18 : 0.18, -0.75, 0);
        grp.add(glMesh);
      }
      // arms
      var gaGeo = new THREE.BoxGeometry(0.22, 0.6, 0.22);
      for (var gai = 0; gai < 2; gai++) {
        var gaMesh = new THREE.Mesh(gaGeo, bodyMat);
        gaMesh.position.set(gai === 0 ? -0.45 : 0.45, 0, 0);
        grp.add(gaMesh);
      }
      // rifle
      var rifleGeo = new THREE.BoxGeometry(0.1, 0.1, 1.1);
      var rifleMesh = new THREE.Mesh(rifleGeo, gunMat);
      rifleMesh.position.set(0.5, -0.05, 0.4);
      grp.add(rifleMesh);
      // rifle stock
      var stockGeo = new THREE.BoxGeometry(0.1, 0.22, 0.3);
      var stockMesh = new THREE.Mesh(stockGeo, gunMat);
      stockMesh.position.set(0.5, -0.12, -0.15);
      grp.add(stockMesh);

      // position group — origin at hip level
      grp.position.set(gd.x, 1.1, gd.z);
      _scene.add(grp);
      _objects.push(grp);

      _guards.push({
        mesh: grp,
        dir: gd.dir,
        speed: gd.speed,
        range: gd.range,
        baseX: gd.x,
        baseZ: gd.z,
        pos: { x: gd.x, z: gd.z },
        animT: 0
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     HUD
  ═══════════════════════════════════════════════════════════════════════════ */

  function _createHUD() {
    _hud = document.createElement('div');
    _hud.id = 'diamond-mine-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:16px',
      'left:16px',
      'background:rgba(0,0,0,0.72)',
      'color:#FFFFFF',
      'font-family:monospace',
      'font-size:13px',
      'padding:10px 14px',
      'border-radius:4px',
      'border:1px solid #FFD700',
      'line-height:1.7',
      'pointer-events:none',
      'z-index:9999'
    ].join(';');
    document.body.appendChild(_hud);

    _notify = document.createElement('div');
    _notify.id = 'diamond-mine-notify';
    _notify.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.82)',
      'color:#FFD700',
      'font-family:monospace',
      'font-size:18px',
      'font-weight:bold',
      'padding:12px 24px',
      'border-radius:6px',
      'border:2px solid #FFD700',
      'pointer-events:none',
      'opacity:0',
      'transition:opacity 0.4s',
      'z-index:10000',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_notify);
    _updateHUD();
  }

  function _removeHUD() {
    if (_hud && _hud.parentNode) {
      _hud.parentNode.removeChild(_hud);
      _hud = null;
    }
    if (_notify && _notify.parentNode) {
      _notify.parentNode.removeChild(_notify);
      _notify = null;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     INPUT
  ═══════════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    _keys[e.code] = true;

    // D+M toggle
    if (e.code === 'KeyD') {
      _dHeld = true;
    }
    if (e.code === 'KeyM' && _dHeld && _dmCooldown <= 0) {
      _dmCooldown = 1.0;
      if (!_active) {
        _activate();
      } else {
        _deactivate();
      }
    }
  }

  function _onKeyUp(e) {
    _keys[e.code] = false;
    if (e.code === 'KeyD') {
      _dHeld = false;
    }
  }

  function _onMouseMove(e) {
    if (!_active || !_pointerLocked) return;
    var dx = e.movementX || 0;
    var dy = e.movementY || 0;
    _yaw   -= dx * 0.002;
    _pitch -= dy * 0.002;
    _pitch = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, _pitch));
  }

  function _onPointerLockChange() {
    if (!_camera || !_camera.domElement) return;
    var canvas = _camera.domElement || document.querySelector('canvas');
    _pointerLocked = (document.pointerLockElement === canvas);
  }

  function _onMouseDown() {
    if (!_active) return;
    var canvas = _camera && _camera.domElement ? _camera.domElement : document.querySelector('canvas');
    if (canvas && !_pointerLocked) {
      canvas.requestPointerLock();
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     ACTIVATE / DEACTIVATE
  ═══════════════════════════════════════════════════════════════════════════ */

  function _activate() {
    if (_active) return;
    _active = true;
    _createHUD();
    _buildEnvironment();
    _showNotify('DIAMOND MINE — FREE THE MINERS! (F=Free, E=Destroy)', 4);
    _updateHUD();
  }

  function _deactivate() {
    if (!_active) return;
    _active = false;
    _showNotify('DIAMOND MINE deactivated', 2);
    _clearScene();
    _removeHUD();
  }

  function _clearScene() {
    for (var oi = 0; oi < _objects.length; oi++) {
      if (_objects[oi] && _objects[oi].parent) {
        _objects[oi].parent.remove(_objects[oi]);
      }
    }
    _objects    = [];
    _miners     = [];
    _crushers   = [];
    _guards     = [];
    _particles  = [];
    _ceiling    = [];
    _props      = [];
    _minersFree        = 0;
    _crushersDestroyed = 0;
    _caveInTriggered   = false;
    _caveInComplete    = false;
    _missionComplete   = false;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     UPDATE
  ═══════════════════════════════════════════════════════════════════════════ */

  function update(delta) {
    if (!_active || !_camera || !_scene) return;

    /* cooldowns */
    if (_dmCooldown > 0) _dmCooldown -= delta;
    if (_fCooldown  > 0) _fCooldown  -= delta;
    if (_eCooldown  > 0) _eCooldown  -= delta;

    /* notify fade */
    if (_notifyTimer > 0) {
      _notifyTimer -= delta;
      if (_notifyTimer <= 0 && _notify) {
        _notify.style.opacity = '0';
      }
    }

    /* ── Player movement ────────────────────────────────────────────────────── */
    _updatePlayer(delta);

    /* ── Interaction ─────────────────────────────────────────────────────────── */
    _checkInteractions();

    /* ── Guards patrol ───────────────────────────────────────────────────────── */
    _updateGuards(delta);

    /* ── Crusher animation ───────────────────────────────────────────────────── */
    _updateCrushers(delta);

    /* ── Dust particles ──────────────────────────────────────────────────────── */
    _updateParticles(delta);

    /* ── Cave-in ─────────────────────────────────────────────────────────────── */
    _updateCaveIn(delta);
  }

  /* ── Player movement ─────────────────────────────────────────────────────── */
  function _updatePlayer(delta) {
    /* camera quaternion from yaw / pitch */
    var cosY = Math.cos(_yaw);
    var sinY = Math.sin(_yaw);

    var fw = 0;
    var st = 0;
    if (_keys['KeyW'] || _keys['ArrowUp'])    fw =  1;
    if (_keys['KeyS'] || _keys['ArrowDown'])  fw = -1;
    if (_keys['KeyA'] || _keys['ArrowLeft'])  st = -1;
    if (_keys['KeyD'] || _keys['ArrowRight']) st =  1;

    var spd = _speed * delta;
    var dx = (fw * sinY + st * cosY) * spd;
    var dz = (fw * cosY - st * sinY) * spd;

    /* clamp to mine bounds */
    _posX = Math.max(-38, Math.min(38, _posX + dx));
    _posZ = Math.max(-38, Math.min(38, _posZ + dz));

    /* gravity */
    if (!_onGround) {
      _velY -= 9.8 * delta;
    }
    _posY += _velY * delta;
    if (_posY <= 1.8) {
      _posY    = 1.8;
      _velY    = 0;
      _onGround = true;
    }

    /* jump */
    if ((_keys['Space'] || _keys['KeyJ']) && _onGround) {
      _velY    = 5;
      _onGround = false;
    }

    /* apply to camera */
    _camera.position.set(_posX, _posY, _posZ);
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y     = _yaw;
    _camera.rotation.x     = _pitch;
  }

  /* ── Interactions (F=free miner, E=destroy crusher) ──────────────────────── */
  function _checkInteractions() {
    /* F key — free nearest miner within 3 units */
    var fNow = _keys['KeyF'];
    if (fNow && !_fDown && _fCooldown <= 0) {
      _fCooldown = 0.5;
      for (var mi = 0; mi < _miners.length; mi++) {
        var miner = _miners[mi];
        if (miner.freed) continue;
        var d = _dist2(_posX, _posZ, miner.pos.x, miner.pos.z);
        if (d <= 3) {
          miner.freed = true;
          _minersFree++;
          /* visual: remove rope, change shirt to white (liberated) */
          var children = miner.mesh.children;
          for (var mci = 0; mci < children.length; mci++) {
            if (children[mci].geometry && children[mci].material) {
              /* rope is a small flat box — remove by scaling to zero */
              var geo = children[mci].geometry;
              if (geo.parameters && geo.parameters.height === 0.08) {
                children[mci].visible = false;
              }
            }
          }
          miner.mesh.position.y = 0.1; /* slight bob up on freedom */
          _showNotify('MINER FREED! (' + _minersFree + '/' + _minersTotal + ')', 2.5);
          _updateHUD();
          if (_minersFree >= _minersTotal) {
            _showNotify('ALL MINERS FREED! DESTROY THE CRUSHERS!', 4);
          }
          break;
        }
      }
    }
    _fDown = fNow;

    /* E key — destroy nearest crusher within 3 units */
    var eNow = _keys['KeyE'];
    if (eNow && !_eDown && _eCooldown <= 0) {
      _eCooldown = 0.5;
      for (var cri = 0; cri < _crushers.length; cri++) {
        var crusher = _crushers[cri];
        if (crusher.destroyed) continue;
        var cd = _dist2(_posX, _posZ, crusher.pos.x, crusher.pos.z);
        if (cd <= 3) {
          crusher.destroyed = true;
          _crushersDestroyed++;
          /* visual: scale down, change color to dark rubble */
          crusher.mesh.scale.set(1, 0.15, 1);
          crusher.mesh.material = _makeMat(0x333322);
          if (crusher.drum)  crusher.drum.visible  = false;
          if (crusher.ind)   crusher.ind.visible   = false;
          _showNotify('CRUSHER DESTROYED! (' + _crushersDestroyed + '/' + _crushersTotal + ')', 2.5);
          _updateHUD();
          /* trigger cave-in when all crushers gone */
          if (_crushersDestroyed >= _crushersTotal) {
            _triggerCaveIn();
          }
          break;
        }
      }
    }
    _eDown = eNow;
  }

  /* ── Guards patrol ───────────────────────────────────────────────────────── */
  function _updateGuards(delta) {
    for (var gi = 0; gi < _guards.length; gi++) {
      var g = _guards[gi];
      g.animT += delta;
      /* patrol along X axis */
      g.pos.x += g.dir * g.speed * delta;
      if (g.pos.x > g.baseX + g.range) {
        g.pos.x = g.baseX + g.range;
        g.dir = -1;
      }
      if (g.pos.x < g.baseX - g.range) {
        g.pos.x = g.baseX - g.range;
        g.dir = 1;
      }
      g.mesh.position.x = g.pos.x;

      /* bob and face direction */
      g.mesh.position.y = 1.1 + Math.sin(g.animT * 4) * 0.05;
      g.mesh.rotation.y = g.dir > 0 ? 0 : Math.PI;
    }
  }

  /* ── Crusher drum rotation animation ────────────────────────────────────── */
  function _updateCrushers(delta) {
    for (var cri = 0; cri < _crushers.length; cri++) {
      var c = _crushers[cri];
      if (!c.destroyed && c.drum) {
        c.animT += delta;
        c.drum.rotation.x += delta * 3;
      }
    }
  }

  /* ── Dust particles ──────────────────────────────────────────────────────── */
  function _updateParticles(delta) {
    for (var pi = 0; pi < _particles.length; pi++) {
      var p = _particles[pi];
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;
      /* respawn at bottom when drifted too high */
      if (p.mesh.position.y > 12) {
        p.mesh.position.y = 0.2;
        p.mesh.position.x = p.ox + (Math.random() - 0.5) * 4;
        p.mesh.position.z = p.oz + (Math.random() - 0.5) * 4;
        p.vx = (Math.random() - 0.5) * 0.4;
        p.vz = (Math.random() - 0.5) * 0.4;
      }
    }
  }

  /* ── Cave-in trigger ─────────────────────────────────────────────────────── */
  function _triggerCaveIn() {
    _caveInTriggered = true;
    _showNotify('CAVE-IN! RUN!', 5);
    _updateHUD();
    for (var ci = 0; ci < _ceiling.length; ci++) {
      _ceiling[ci].falling  = true;
      _ceiling[ci].fallSpeed = 1 + Math.random() * 3;
    }
  }

  function _updateCaveIn(delta) {
    if (!_caveInTriggered || _caveInComplete) return;
    var allDown = true;
    for (var ci = 0; ci < _ceiling.length; ci++) {
      var cb = _ceiling[ci];
      if (!cb.falling) continue;
      cb.mesh.position.y -= cb.fallSpeed * delta;
      cb.fallSpeed += 9.8 * delta; /* accelerate */
      if (cb.mesh.position.y > -0.5) {
        allDown = false;
      }
    }
    if (allDown && !_missionComplete) {
      _missionComplete = true;
      _showNotify('OPERATION COMPLETE — WARLORD OPERATION DESTROYED!', 6);
      _updateHUD();
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ═══════════════════════════════════════════════════════════════════════════ */

  function init(sceneRef, cameraRef) {
    _scene  = sceneRef;
    _camera = cameraRef;

    /* register listeners */
    document.addEventListener('keydown',              _onKeyDown,            false);
    document.addEventListener('keyup',                _onKeyUp,              false);
    document.addEventListener('mousemove',            _onMouseMove,          false);
    document.addEventListener('mousedown',            _onMouseDown,          false);
    document.addEventListener('pointerlockchange',    _onPointerLockChange,  false);

    /* show activation hint in console */
    console.log('[DiamondMine] Ready. Hold D + press M to activate.');
  }

  function reset() {
    _deactivate();
    /* remove listeners */
    document.removeEventListener('keydown',           _onKeyDown,            false);
    document.removeEventListener('keyup',             _onKeyUp,              false);
    document.removeEventListener('mousemove',         _onMouseMove,          false);
    document.removeEventListener('mousedown',         _onMouseDown,          false);
    document.removeEventListener('pointerlockchange', _onPointerLockChange,  false);
    _scene  = null;
    _camera = null;
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
