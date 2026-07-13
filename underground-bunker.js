/* ───────────────────────────────────────────────────────────────────────────
   underground-bunker.js — Cold War Nuclear Bunker Module
   API: window.UndergroundBunker = { init, update, reset }
   Controls:
     U + B  (both within 400 ms) → toggle module on / off
     WASD                        → move player
     Mouse                       → look / aim
     Left Click                  → shoot
     E (near launch console)     → disable launch / abort countdown
   Theme: Cold War underground nuclear bunker — rogue launch imminent.
          Fanatical holdout soldiers patrol claustrophobic corridors.
          Reach the launch console within the countdown and abort the strike.
   ─────────────────────────────────────────────────────────────────────────── */
window.UndergroundBunker = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;

  /* ── Activation state ──────────────────────────────────────────────────── */
  var _active     = false;
  var _uPressTime = 0;
  var _bPressTime = 0;
  var _keys       = {};

  /* ── Mouse look ────────────────────────────────────────────────────────── */
  var _yaw   = 0;
  var _pitch = 0;
  var _mouseDown   = false;
  var _pointerLocked = false;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _playerPos   = { x: 0, y: 1.7, z: 40 };
  var _playerVel   = { x: 0, y: 0,   z: 0  };
  var _playerHP    = 100;
  var _shootTimer  = 0;
  var _prevEKey    = false;

  /* ── Mission state ─────────────────────────────────────────────────────── */
  var _countdownSecs    = 300;   /* 5 minutes until launch */
  var _launchAborted    = false;
  var _missionFailed    = false;
  var _alarmActive      = true;
  var _alarmPulse       = 0;     /* 0–1 sine for red pulse */

  /* ── Scene objects (tracked for reset) ────────────────────────────────── */
  var _objects = [];  /* all THREE.Object3D added to scene */

  /* ── Environmental objects ─────────────────────────────────────────────── */
  var _blastDoors     = [];
  var _terminals      = [];
  var _launchConsole  = null;
  var _alarmLights    = [];
  var _pressureGauges = [];
  var _bunkerBeds     = [];
  var _corridorParts  = [];

  /* ── Enemies ───────────────────────────────────────────────────────────── */
  var _guards = [];

  /* ── Particle alarm effect ─────────────────────────────────────────────── */
  var _alarmParticles = null;

  /* ── Lights ────────────────────────────────────────────────────────────── */
  var _ambientLight     = null;
  var _alarmPointLights = [];

  /* ── HUD elements ──────────────────────────────────────────────────────── */
  var _hudEl       = null;
  var _countdownEl = null;
  var _msgEl       = null;
  var _msgTimer    = 0;
  var _notifEl     = null;
  var _notifTimer  = 0;

  /* ══════════════════════════════════════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════════════════════════════════════ */

  function _addToScene(obj) {
    _scene.add(obj);
    _objects.push(obj);
    return obj;
  }

  function _makeMat(color, emissive, emissiveIntensity) {
    return new THREE.MeshLambertMaterial({
      color: color,
      emissive: emissive || 0x000000,
      emissiveIntensity: emissiveIntensity || 0
    });
  }

  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function _showMsg(text, duration) {
    if (!_msgEl) return;
    _msgEl.textContent = text;
    _msgEl.style.display = 'block';
    _msgTimer = duration || 3;
  }

  function _showNotif(text) {
    if (!_notifEl) return;
    _notifEl.textContent = text;
    _notifEl.style.display = 'block';
    _notifTimer = 3;
  }

  function _formatCountdown(secs) {
    if (secs < 0) secs = 0;
    var m = Math.floor(secs / 60);
    var s = Math.floor(secs % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     HUD CREATION / REMOVAL
  ══════════════════════════════════════════════════════════════════════════ */

  function _createHUD() {
    /* ── Outer container ── */
    _hudEl = document.createElement('div');
    _hudEl.id = 'ub-hud';
    _hudEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'pointer-events:none',
      'z-index:9000',
      'font-family:monospace'
    ].join(';');

    /* ── Countdown banner ── */
    _countdownEl = document.createElement('div');
    _countdownEl.style.cssText = [
      'position:absolute',
      'top:12px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'border:2px solid #ff2200',
      'color:#ff4400',
      'font-size:22px',
      'font-weight:bold',
      'padding:6px 18px',
      'letter-spacing:3px',
      'text-shadow:0 0 8px #ff0000'
    ].join(';');
    _countdownEl.textContent = 'LAUNCH COUNTDOWN: 05:00';
    _hudEl.appendChild(_countdownEl);

    /* ── Centre message ── */
    _msgEl = document.createElement('div');
    _msgEl.style.cssText = [
      'position:absolute',
      'top:55%',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.8)',
      'color:#00ff88',
      'font-size:28px',
      'font-weight:bold',
      'padding:10px 24px',
      'display:none',
      'letter-spacing:2px',
      'text-shadow:0 0 12px #00ff88',
      'border:2px solid #00ff88'
    ].join(';');
    _hudEl.appendChild(_msgEl);

    /* ── Top-right notification ── */
    _notifEl = document.createElement('div');
    _notifEl.style.cssText = [
      'position:absolute',
      'top:12px',
      'right:16px',
      'background:rgba(0,0,0,0.7)',
      'color:#ffee00',
      'font-size:14px',
      'padding:5px 12px',
      'display:none',
      'border:1px solid #ffee00'
    ].join(';');
    _hudEl.appendChild(_notifEl);

    /* ── HP indicator ── */
    var hpEl = document.createElement('div');
    hpEl.id = 'ub-hp';
    hpEl.style.cssText = [
      'position:absolute',
      'bottom:24px',
      'left:24px',
      'background:rgba(0,0,0,0.65)',
      'color:#00ccff',
      'font-size:15px',
      'padding:4px 12px',
      'border:1px solid #0088cc'
    ].join(';');
    hpEl.textContent = 'HP: 100';
    _hudEl.appendChild(hpEl);

    /* ── Crosshair ── */
    var chEl = document.createElement('div');
    chEl.style.cssText = [
      'position:absolute',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:16px',
      'height:16px',
      'color:#ffffff',
      'font-size:18px',
      'line-height:16px',
      'text-align:center'
    ].join(';');
    chEl.textContent = '+';
    _hudEl.appendChild(chEl);

    /* ── Objective tip ── */
    var objEl = document.createElement('div');
    objEl.style.cssText = [
      'position:absolute',
      'bottom:24px',
      'right:16px',
      'background:rgba(0,0,0,0.65)',
      'color:#cccccc',
      'font-size:13px',
      'padding:4px 12px',
      'border:1px solid #555',
      'text-align:right'
    ].join(';');
    objEl.innerHTML = 'OBJECTIVE: Reach the Launch Console<br>[E] Abort Launch &nbsp;|&nbsp; [WASD] Move &nbsp;|&nbsp; [Click] Shoot';
    _hudEl.appendChild(objEl);

    document.body.appendChild(_hudEl);
  }

  function _removeHUD() {
    if (_hudEl && _hudEl.parentNode) {
      _hudEl.parentNode.removeChild(_hudEl);
    }
    _hudEl       = null;
    _countdownEl = null;
    _msgEl       = null;
    _notifEl     = null;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SCENE CONSTRUCTION
  ══════════════════════════════════════════════════════════════════════════ */

  function _buildScene() {
    /* ── Ambient + dim corridor lighting ── */
    _ambientLight = new THREE.AmbientLight(0x223344, 0.55);
    _addToScene(_ambientLight);

    var dimLight = new THREE.PointLight(0x334455, 0.8, 80);
    dimLight.position.set(0, 4, 0);
    _addToScene(dimLight);

    /* ── Concrete floor / ceiling / walls helper ── */
    var concreteMat  = _makeMat(0x555555);
    var darkMat      = _makeMat(0x222222);
    var steelMat     = _makeMat(0x446688);
    var rustMat      = _makeMat(0x775533);
    var greenScreenMat = _makeMat(0x115511, 0x00ff00, 0.3);
    var redMat       = _makeMat(0x882200, 0xff0000, 0.4);
    var yellowMat    = _makeMat(0x887700, 0xffee00, 0.3);
    var consoleMat   = _makeMat(0x003322, 0x00ff66, 0.5);

    /* ─────────────────────────────────────────────────────────────────────
       CORRIDOR NETWORK  (main east-west + 3 cross-tunnels)
    ───────────────────────────────────────────────────────────────────── */

    /* Floor */
    var floorGeo = new THREE.BoxGeometry(18, 0.5, 100);
    var floor = new THREE.Mesh(floorGeo, concreteMat);
    floor.position.set(0, -0.25, 0);
    _addToScene(floor);
    _corridorParts.push(floor);

    /* Ceiling */
    var ceilGeo = new THREE.BoxGeometry(18, 0.5, 100);
    var ceil = new THREE.Mesh(ceilGeo, darkMat);
    ceil.position.set(0, 4.25, 0);
    _addToScene(ceil);
    _corridorParts.push(ceil);

    /* Left wall */
    var wallL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 100), concreteMat);
    wallL.position.set(-9, 2, 0);
    _addToScene(wallL);
    _corridorParts.push(wallL);

    /* Right wall */
    var wallR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 100), concreteMat);
    wallR.position.set(9, 2, 0);
    _addToScene(wallR);
    _corridorParts.push(wallR);

    /* Cross-tunnel A (barracks area) */
    var ctFloorA = new THREE.Mesh(new THREE.BoxGeometry(30, 0.5, 10), concreteMat);
    ctFloorA.position.set(0, -0.25, 10);
    _addToScene(ctFloorA);

    var ctCeilA = new THREE.Mesh(new THREE.BoxGeometry(30, 0.5, 10), darkMat);
    ctCeilA.position.set(0, 4.25, 10);
    _addToScene(ctCeilA);

    var ctWallA1 = new THREE.Mesh(new THREE.BoxGeometry(30, 4, 0.5), concreteMat);
    ctWallA1.position.set(0, 2, 5);
    _addToScene(ctWallA1);

    var ctWallA2 = new THREE.Mesh(new THREE.BoxGeometry(30, 4, 0.5), concreteMat);
    ctWallA2.position.set(0, 2, 15);
    _addToScene(ctWallA2);

    /* Cross-tunnel B (control room) */
    var ctFloorB = new THREE.Mesh(new THREE.BoxGeometry(30, 0.5, 10), concreteMat);
    ctFloorB.position.set(0, -0.25, -15);
    _addToScene(ctFloorB);

    var ctCeilB = new THREE.Mesh(new THREE.BoxGeometry(30, 0.5, 10), darkMat);
    ctCeilB.position.set(0, 4.25, -15);
    _addToScene(ctCeilB);

    var ctWallB1 = new THREE.Mesh(new THREE.BoxGeometry(30, 4, 0.5), concreteMat);
    ctWallB1.position.set(0, 2, -10);
    _addToScene(ctWallB1);

    var ctWallB2 = new THREE.Mesh(new THREE.BoxGeometry(30, 4, 0.5), concreteMat);
    ctWallB2.position.set(0, 2, -20);
    _addToScene(ctWallB2);

    /* Cross-tunnel C (launch bay) */
    var ctFloorC = new THREE.Mesh(new THREE.BoxGeometry(24, 0.5, 14), concreteMat);
    ctFloorC.position.set(0, -0.25, -38);
    _addToScene(ctFloorC);

    var ctCeilC = new THREE.Mesh(new THREE.BoxGeometry(24, 0.5, 14), darkMat);
    ctCeilC.position.set(0, 4.25, -38);
    _addToScene(ctCeilC);

    var ctWallC1 = new THREE.Mesh(new THREE.BoxGeometry(24, 4, 0.5), concreteMat);
    ctWallC1.position.set(0, 2, -31);
    _addToScene(ctWallC1);

    var ctWallC2 = new THREE.Mesh(new THREE.BoxGeometry(24, 4, 0.5), concreteMat);
    ctWallC2.position.set(0, 2, -45);
    _addToScene(ctWallC2);

    /* ─────────────────────────────────────────────────────────────────────
       ENV OBJECT 1 — BLAST DOORS (two large steel slab doors)
    ───────────────────────────────────────────────────────────────────── */
    var blastMat = _makeMat(0x556677, 0x334455, 0.1);

    var bd1 = new THREE.Mesh(new THREE.BoxGeometry(8.5, 3.8, 0.6), blastMat);
    bd1.position.set(0, 1.9, 0);
    _addToScene(bd1);
    _blastDoors.push(bd1);

    /* Door frame rivets (LineSegments) */
    var rivetGeo = new THREE.BoxGeometry(9, 4, 0.1);
    var rivetEdges = new THREE.EdgesGeometry(rivetGeo);
    var rivetLines = new THREE.LineSegments(
      rivetEdges,
      new THREE.LineBasicMaterial({ color: 0x889aaa })
    );
    rivetLines.position.set(0, 2, 0.35);
    _addToScene(rivetLines);

    var bd2 = new THREE.Mesh(new THREE.BoxGeometry(8.5, 3.8, 0.6), blastMat);
    bd2.position.set(0, 1.9, -27);
    _addToScene(bd2);
    _blastDoors.push(bd2);

    var rivetEdges2 = new THREE.EdgesGeometry(new THREE.BoxGeometry(9, 4, 0.1));
    var rivetLines2 = new THREE.LineSegments(
      rivetEdges2,
      new THREE.LineBasicMaterial({ color: 0x889aaa })
    );
    rivetLines2.position.set(0, 2, -26.65);
    _addToScene(rivetLines2);

    /* ─────────────────────────────────────────────────────────────────────
       ENV OBJECT 2 — COMPUTER TERMINALS (3 units in control room)
    ───────────────────────────────────────────────────────────────────── */
    var termPositions = [
      { x: -6, z: -15 },
      { x:  0, z: -18 },
      { x:  6, z: -15 }
    ];

    for (var ti = 0; ti < termPositions.length; ti++) {
      var tp = termPositions[ti];

      /* Desk / base */
      var termBase = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.8, 0.9),
        steelMat
      );
      termBase.position.set(tp.x, 0.4, tp.z);
      _addToScene(termBase);

      /* Screen */
      var termScreen = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.9, 0.08),
        greenScreenMat
      );
      termScreen.position.set(tp.x, 1.3, tp.z - 0.1);
      _addToScene(termScreen);

      /* Keyboard strip */
      var termKeys = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.06, 0.4),
        _makeMat(0x333333)
      );
      termKeys.position.set(tp.x, 0.83, tp.z + 0.2);
      _addToScene(termKeys);

      _terminals.push(termScreen);
    }

    /* ─────────────────────────────────────────────────────────────────────
       ENV OBJECT 3 — LAUNCH CONSOLE (in the launch bay at z ≈ -38)
    ───────────────────────────────────────────────────────────────────── */
    var lcBase = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 1.1, 1.2),
      consoleMat
    );
    lcBase.position.set(0, 0.55, -38);
    _addToScene(lcBase);

    var lcScreen = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 1.2, 0.1),
      _makeMat(0x001100, 0x00ff44, 0.8)
    );
    lcScreen.position.set(0, 1.75, -38.55);
    _addToScene(lcScreen);

    /* Big launch button (cylinder) */
    var launchBtn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.18, 10),
      redMat
    );
    launchBtn.position.set(0.6, 1.12, -38);
    _addToScene(launchBtn);

    /* Console edge outline */
    var lcEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(3.6, 1.2, 1.3));
    var lcLines = new THREE.LineSegments(
      lcEdges,
      new THREE.LineBasicMaterial({ color: 0x00ff66 })
    );
    lcLines.position.set(0, 0.6, -38);
    _addToScene(lcLines);

    /* Store the base as the "interactive" launch console object */
    _launchConsole = lcBase;

    /* ─────────────────────────────────────────────────────────────────────
       ENV OBJECT 4 — BUNKER BEDS (barracks, 4 bunk frames)
    ───────────────────────────────────────────────────────────────────── */
    var bedPositions = [
      { x: -10, z: 8  },
      { x: -10, z: 12 },
      { x:  10, z: 8  },
      { x:  10, z: 12 }
    ];

    var bedFrameMat  = _makeMat(0x8B5A2B);
    var mattressMat  = _makeMat(0x4a4a5a);

    for (var bi = 0; bi < bedPositions.length; bi++) {
      var bp = bedPositions[bi];

      /* Bottom bunk frame */
      var bedFrame = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.12, 0.9),
        bedFrameMat
      );
      bedFrame.position.set(bp.x, 0.55, bp.z);
      _addToScene(bedFrame);

      /* Bottom mattress */
      var mattress1 = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.16, 0.75),
        mattressMat
      );
      mattress1.position.set(bp.x, 0.69, bp.z);
      _addToScene(mattress1);

      /* Top bunk frame */
      var topFrame = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.12, 0.9),
        bedFrameMat
      );
      topFrame.position.set(bp.x, 1.65, bp.z);
      _addToScene(topFrame);

      /* Top mattress */
      var mattress2 = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.16, 0.75),
        mattressMat
      );
      mattress2.position.set(bp.x, 1.79, bp.z);
      _addToScene(mattress2);

      /* Ladder (3 rungs) */
      for (var ri = 0; ri < 3; ri++) {
        var rung = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.06, 0.7),
          bedFrameMat
        );
        rung.position.set(bp.x + 0.9, 0.7 + ri * 0.35, bp.z);
        _addToScene(rung);
      }

      _bunkerBeds.push(bedFrame);
    }

    /* ─────────────────────────────────────────────────────────────────────
       ENV OBJECT 5 — PRESSURE GAUGES (bolted to corridor walls, 6 units)
    ───────────────────────────────────────────────────────────────────── */
    var gaugePositions = [
      { x: -8.6, y: 2.2, z: -5  },
      { x: -8.6, y: 2.2, z:  5  },
      { x:  8.6, y: 2.2, z: -5  },
      { x:  8.6, y: 2.2, z:  5  },
      { x: -8.6, y: 2.2, z: -22 },
      { x:  8.6, y: 2.2, z: -22 }
    ];

    var gaugeFaceMat   = _makeMat(0xddddcc);
    var gaugeNeedleMat = new THREE.LineBasicMaterial({ color: 0xff2200 });

    for (var gi = 0; gi < gaugePositions.length; gi++) {
      var gp = gaugePositions[gi];

      /* Gauge body (cylinder face-on) */
      var gaugeCyl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.12, 12),
        gaugeFaceMat
      );
      gaugeCyl.rotation.z = Math.PI / 2;
      gaugeCyl.position.set(gp.x, gp.y, gp.z);
      _addToScene(gaugeCyl);

      /* Gauge backing disc */
      var gaugeBack = new THREE.Mesh(
        new THREE.CylinderGeometry(0.30, 0.30, 0.06, 12),
        _makeMat(0x223344)
      );
      gaugeBack.rotation.z = Math.PI / 2;
      gaugeBack.position.set(gp.x + (gp.x < 0 ? 0.1 : -0.1), gp.y, gp.z);
      _addToScene(gaugeBack);

      /* Needle (LineSegments) */
      var needlePts = new Float32Array([0, 0, 0,  0, 0.22, 0]);
      var needleGeo = new THREE.BufferGeometry();
      needleGeo.setAttribute('position', new THREE.BufferAttribute(needlePts, 3));
      var needle = new THREE.LineSegments(needleGeo, gaugeNeedleMat);
      needle.position.set(gp.x, gp.y, gp.z);
      needle.rotation.x = 0.8; /* show angle */
      _addToScene(needle);

      _pressureGauges.push(gaugeCyl);
    }

    /* ─────────────────────────────────────────────────────────────────────
       ENV OBJECT 6 — ALARM LIGHTS (ceiling-mounted red domes, 6 units)
    ───────────────────────────────────────────────────────────────────── */
    var alarmPositions = [
      { x: -4, z:  20 },
      { x:  4, z:  20 },
      { x:  0, z:   0 },
      { x:  0, z: -15 },
      { x: -5, z: -38 },
      { x:  5, z: -38 }
    ];

    for (var ai = 0; ai < alarmPositions.length; ai++) {
      var ap = alarmPositions[ai];

      /* Dome (cone pointing down) */
      var alarmCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.35, 10),
        _makeMat(0xcc0000, 0xff0000, 0.6)
      );
      alarmCone.rotation.z = Math.PI;  /* flip to point down */
      alarmCone.position.set(ap.x, 3.9, ap.z);
      _addToScene(alarmCone);

      /* Small housing box */
      var alarmBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.18, 0.32),
        _makeMat(0x333333)
      );
      alarmBox.position.set(ap.x, 4.1, ap.z);
      _addToScene(alarmBox);

      _alarmLights.push(alarmCone);

      /* Point light per alarm */
      var alarmPL = new THREE.PointLight(0xff0000, 0.0, 18);
      alarmPL.position.set(ap.x, 3.6, ap.z);
      _addToScene(alarmPL);
      _alarmPointLights.push(alarmPL);
    }

    /* ─────────────────────────────────────────────────────────────────────
       PARTICLE / VISUAL ALARM EFFECT — floating red sparks
    ───────────────────────────────────────────────────────────────────── */
    var sparkCount = 80;
    var sparkPositions = new Float32Array(sparkCount * 3);
    for (var si = 0; si < sparkCount; si++) {
      sparkPositions[si * 3    ] = (Math.random() - 0.5) * 16;
      sparkPositions[si * 3 + 1] = Math.random() * 4;
      sparkPositions[si * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    var sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(sparkPositions, 3)
    );
    _alarmParticles = new THREE.Points(
      sparkGeo,
      new THREE.PointsMaterial({ color: 0xff2200, size: 0.12, transparent: true, opacity: 0.0 })
    );
    _addToScene(_alarmParticles);

    /* ─────────────────────────────────────────────────────────────────────
       ENEMIES — 3 guard patrol routes
    ───────────────────────────────────────────────────────────────────── */
    var guardData = [
      {
        pos: { x: 4, z: 30 },
        waypoints: [
          { x: 4,  z: 30 },
          { x: 4,  z: 5  },
          { x: -4, z: 5  },
          { x: -4, z: 30 }
        ],
        color: 0x3a6b35
      },
      {
        pos: { x: -5, z: -10 },
        waypoints: [
          { x: -5, z: -10 },
          { x:  5, z: -10 },
          { x:  5, z: -22 },
          { x: -5, z: -22 }
        ],
        color: 0x3a6b35
      },
      {
        pos: { x: 0, z: -34 },
        waypoints: [
          { x: 0,  z: -34 },
          { x: 7,  z: -41 },
          { x: -7, z: -41 },
          { x: 0,  z: -34 }
        ],
        color: 0x5a3520
      }
    ];

    for (var ei = 0; ei < guardData.length; ei++) {
      var gd = guardData[ei];
      var guardMat = _makeMat(gd.color);
      var headMat  = _makeMat(0xc8a070);
      var helmMat  = _makeMat(0x2a3a20);

      /* Body */
      var body = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 1.0, 0.35),
        guardMat
      );
      body.position.set(gd.pos.x, 1.0, gd.pos.z);

      /* Head */
      var head = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.38, 0.38),
        headMat
      );
      head.position.set(0, 0.69, 0);
      body.add(head);

      /* Helmet */
      var helm = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 6),
        helmMat
      );
      helm.position.set(0, 0.88, 0);
      body.add(helm);

      /* Rifle (box) */
      var rifle = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.8),
        _makeMat(0x1a1a1a)
      );
      rifle.position.set(0.38, 0.1, -0.3);
      body.add(rifle);

      _addToScene(body);

      _guards.push({
        mesh:        body,
        hp:          60,
        waypoints:   gd.waypoints,
        wpIdx:       0,
        speed:       2.5,
        shootTimer:  Math.random() * 2,
        alertTimer:  0,
        state:       'patrol',   /* 'patrol' | 'chase' | 'dead' */
        deathTimer:  0
      });
    }

    /* ── Dim fluorescent tube lights (corridor accent) ── */
    var tubePositions = [
      { x: 0, z:  30 },
      { x: 0, z:  10 },
      { x: 0, z: -10 },
      { x: 0, z: -30 }
    ];
    for (var li = 0; li < tubePositions.length; li++) {
      var tp2 = tubePositions[li];
      var tubeMesh = new THREE.Mesh(
        new THREE.BoxGeometry(6, 0.1, 0.1),
        _makeMat(0xaaccff, 0xaaccff, 1.0)
      );
      tubeMesh.position.set(tp2.x, 3.9, tp2.z);
      _addToScene(tubeMesh);

      var tubeLight = new THREE.PointLight(0x8899bb, 0.7, 25);
      tubeLight.position.set(tp2.x, 3.6, tp2.z);
      _addToScene(tubeLight);
    }

    /* ── Misc props: ammo crates, barrels ── */
    var cratePositions = [
      { x: -7, z: 25 }, { x: 7, z: 25 },
      { x: -7, z: -5 }, { x: 7, z: -5 }
    ];
    var crateMat = _makeMat(0x5a6a30);
    for (var ci2 = 0; ci2 < cratePositions.length; ci2++) {
      var cp = cratePositions[ci2];
      var crate = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.8, 0.8),
        crateMat
      );
      crate.position.set(cp.x, 0.4, cp.z);
      _addToScene(crate);

      /* Crate outline */
      var crEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.82, 0.82, 0.82));
      var crLines = new THREE.LineSegments(
        crEdges,
        new THREE.LineBasicMaterial({ color: 0x889944 })
      );
      crLines.position.set(cp.x, 0.4, cp.z);
      _addToScene(crLines);
    }

    /* Barrels */
    var barrelPositions = [
      { x: -8, z: 18 }, { x: 8, z: 18 },
      { x: -8, z: -33 }
    ];
    var barrelMat = _makeMat(0x334455);
    for (var bri = 0; bri < barrelPositions.length; bri++) {
      var brp = barrelPositions[bri];
      var barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, 0.9, 10),
        barrelMat
      );
      barrel.position.set(brp.x, 0.45, brp.z);
      _addToScene(barrel);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     INPUT HANDLERS
  ══════════════════════════════════════════════════════════════════════════ */

  function _onKeyDown(e) {
    var k = e.code || e.key;
    _keys[k] = true;

    if (k === 'KeyU') _uPressTime = Date.now();
    if (k === 'KeyB') _bPressTime = Date.now();

    /* Toggle check: both U and B pressed within 400 ms */
    if (
      (k === 'KeyB' && _keys['KeyU'] && (Date.now() - _uPressTime < 400)) ||
      (k === 'KeyU' && _keys['KeyB'] && (Date.now() - _bPressTime < 400))
    ) {
      _toggle();
    }
  }

  function _onKeyUp(e) {
    var k = e.code || e.key;
    _keys[k] = false;
  }

  function _onMouseMove(e) {
    if (!_active) return;
    var mx = e.movementX || 0;
    var my = e.movementY || 0;
    _yaw   -= mx * 0.0018;
    _pitch -= my * 0.0018;
    _pitch = Math.max(-1.1, Math.min(1.1, _pitch));
  }

  function _onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) _mouseDown = true;
  }

  function _onMouseUp(e) {
    if (e.button === 0) _mouseDown = false;
  }

  function _onPointerLockChange() {
    _pointerLocked = (document.pointerLockElement !== null);
  }

  function _onCanvasClick() {
    if (_active && !_pointerLocked) {
      document.body.requestPointerLock();
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     TOGGLE ON / OFF
  ══════════════════════════════════════════════════════════════════════════ */

  function _toggle() {
    if (_active) {
      _deactivate();
      _showNotif('UNDERGROUND BUNKER — STANDBY');
    } else {
      _activate();
      _showNotif('UNDERGROUND BUNKER — ACTIVATED');
    }
  }

  function _activate() {
    if (_active) return;
    _active = true;

    _buildScene();
    _createHUD();

    /* Position camera at player start */
    _playerPos.x = 0;
    _playerPos.y = 1.7;
    _playerPos.z = 40;
    _yaw         = Math.PI;  /* face into the bunker */
    _pitch       = 0;

    if (_camera) {
      _camera.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
    }

    /* Pointer lock */
    document.body.requestPointerLock();
  }

  function _deactivate() {
    if (!_active) return;
    _active = false;

    /* Exit pointer lock */
    if (document.pointerLockElement) document.exitPointerLock();

    /* Remove all scene objects */
    for (var i = 0; i < _objects.length; i++) {
      _scene.remove(_objects[i]);
      if (_objects[i].geometry) _objects[i].geometry.dispose();
      if (_objects[i].material) {
        if (Array.isArray(_objects[i].material)) {
          for (var mi = 0; mi < _objects[i].material.length; mi++) {
            _objects[i].material[mi].dispose();
          }
        } else {
          _objects[i].material.dispose();
        }
      }
    }
    _objects      = [];
    _blastDoors   = [];
    _terminals    = [];
    _launchConsole = null;
    _alarmLights  = [];
    _pressureGauges = [];
    _bunkerBeds   = [];
    _corridorParts = [];
    _guards       = [];
    _alarmParticles = null;
    _ambientLight = null;
    _alarmPointLights = [];

    /* Remove HUD */
    _removeHUD();

    /* Reset mission state */
    _countdownSecs  = 300;
    _launchAborted  = false;
    _missionFailed  = false;
    _alarmActive    = true;
    _alarmPulse     = 0;
    _playerHP       = 100;
    _playerVel      = { x: 0, y: 0, z: 0 };
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SHOOTING
  ══════════════════════════════════════════════════════════════════════════ */

  function _tryShoot() {
    /* Raycast from camera toward each guard */
    var camDir = new THREE.Vector3();
    _camera.getWorldDirection(camDir);

    for (var gi = 0; gi < _guards.length; gi++) {
      var g = _guards[gi];
      if (g.state === 'dead') continue;

      var gPos = g.mesh.position;
      var toG  = new THREE.Vector3(
        gPos.x - _playerPos.x,
        gPos.y - _playerPos.y,
        gPos.z - _playerPos.z
      );
      var distToG = toG.length();
      if (distToG > 35) continue;

      toG.normalize();
      var dot = camDir.dot(toG);
      /* Within ~15 degrees and in front */
      if (dot > 0.965 && distToG < 35) {
        g.hp -= 30;
        if (g.hp <= 0) {
          g.state = 'dead';
          g.deathTimer = 2;
          g.mesh.rotation.z = Math.PI / 2;
          g.mesh.position.y = 0.3;
        } else {
          g.state = 'chase';
          g.alertTimer = 8;
        }
        break;
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     UPDATE — called every frame
  ══════════════════════════════════════════════════════════════════════════ */

  function update(delta) {
    if (!_active) return;

    delta = Math.min(delta, 0.1); /* clamp runaway delta */

    /* ── Camera / player orientation ── */
    if (_camera) {
      _camera.rotation.order = 'YXZ';
      _camera.rotation.y     = _yaw;
      _camera.rotation.x     = _pitch;
    }

    /* ── Player movement ── */
    if (!_launchAborted && !_missionFailed) {
      var speed    = 5.5;
      var cosY     = Math.cos(_yaw);
      var sinY     = Math.sin(_yaw);
      var moveX    = 0;
      var moveZ    = 0;

      if (_keys['KeyW'] || _keys['ArrowUp'])    { moveZ -= 1; }
      if (_keys['KeyS'] || _keys['ArrowDown'])  { moveZ += 1; }
      if (_keys['KeyA'] || _keys['ArrowLeft'])  { moveX -= 1; }
      if (_keys['KeyD'] || _keys['ArrowRight']) { moveX += 1; }

      var len = Math.sqrt(moveX * moveX + moveZ * moveZ);
      if (len > 0) {
        moveX /= len;
        moveZ /= len;
      }

      var fwdX = sinY * (-moveZ) + cosY * (-moveX);
      var fwdZ = cosY * (-moveZ) - sinY * (-moveX);

      _playerPos.x += fwdX * speed * delta;
      _playerPos.z += fwdZ * speed * delta;

      /* Simple boundary clamp (stay inside bunker bounds) */
      _playerPos.x = Math.max(-8.5, Math.min(8.5, _playerPos.x));
      _playerPos.z = Math.max(-44, Math.min(42, _playerPos.z));
      _playerPos.y = 1.7;

      if (_camera) {
        _camera.position.set(_playerPos.x, _playerPos.y, _playerPos.z);
      }
    }

    /* ── Shoot ── */
    _shootTimer -= delta;
    if (_mouseDown && _shootTimer <= 0 && !_launchAborted && !_missionFailed) {
      _shootTimer = 0.18;
      _tryShoot();
    }

    /* ── E key — interact with launch console ── */
    var eKeyNow = !!(_keys['KeyE']);
    if (eKeyNow && !_prevEKey && !_launchAborted && !_missionFailed) {
      if (_launchConsole) {
        var distToConsole = _dist2D(
          _playerPos.x, _playerPos.z,
          _launchConsole.position.x, _launchConsole.position.z
        );
        if (distToConsole < 3) {
          _launchAborted = true;
          _alarmActive   = false;

          /* Dim alarm lights */
          for (var ali = 0; ali < _alarmPointLights.length; ali++) {
            _alarmPointLights[ali].intensity = 0;
          }

          /* Turn alarm particles off */
          if (_alarmParticles) {
            _alarmParticles.material.opacity = 0;
          }

          /* Turn launch console green */
          if (_launchConsole.material) {
            _launchConsole.material.emissive.setHex(0x00ff00);
            _launchConsole.material.emissiveIntensity = 1.0;
          }

          _showMsg('LAUNCH ABORTED', 999);
          if (_countdownEl) {
            _countdownEl.textContent   = 'LAUNCH ABORTED';
            _countdownEl.style.color   = '#00ff88';
            _countdownEl.style.borderColor = '#00ff88';
            _countdownEl.style.textShadow  = '0 0 8px #00ff88';
          }
        } else {
          _showMsg('TOO FAR FROM CONSOLE', 2);
        }
      }
    }
    _prevEKey = eKeyNow;

    /* ── Countdown ── */
    if (!_launchAborted && !_missionFailed) {
      _countdownSecs -= delta;
      if (_countdownSecs <= 0) {
        _countdownSecs = 0;
        _missionFailed = true;
        _showMsg('NUCLEAR LAUNCH DETECTED — MISSION FAILED', 999);
        if (_countdownEl) {
          _countdownEl.textContent   = 'LAUNCH COUNTDOWN: 00:00';
          _countdownEl.style.color   = '#ff0000';
        }
      }
      if (_countdownEl) {
        _countdownEl.textContent = 'LAUNCH COUNTDOWN: ' + _formatCountdown(_countdownSecs);
      }
    }

    /* ── Alarm pulse (red lights breathing) ── */
    if (_alarmActive) {
      _alarmPulse += delta * 3.5;
      var pulse = (Math.sin(_alarmPulse) + 1) * 0.5;  /* 0–1 */

      for (var apli = 0; apli < _alarmPointLights.length; apli++) {
        _alarmPointLights[apli].intensity = pulse * 2.2;
      }

      for (var almi = 0; almi < _alarmLights.length; almi++) {
        _alarmLights[almi].material.emissiveIntensity = 0.4 + pulse * 0.7;
      }

      /* Spark particles */
      if (_alarmParticles) {
        _alarmParticles.material.opacity = pulse * 0.75;
        /* Drift sparks upward */
        var positions = _alarmParticles.geometry.attributes.position.array;
        for (var si = 0; si < positions.length / 3; si++) {
          positions[si * 3 + 1] += delta * (0.5 + Math.random() * 0.5);
          if (positions[si * 3 + 1] > 4.2) {
            positions[si * 3 + 1] = 0.0;
          }
        }
        _alarmParticles.geometry.attributes.position.needsUpdate = true;
      }

      /* Pulse the countdown border */
      if (_countdownEl) {
        var r = Math.floor(180 + pulse * 75);
        _countdownEl.style.borderColor = 'rgb(' + r + ',0,0)';
        _countdownEl.style.color       = 'rgb(' + (r + 50) + ',60,0)';
      }
    }

    /* ── Guard AI ── */
    for (var gi2 = 0; gi2 < _guards.length; gi2++) {
      var g2 = _guards[gi2];
      if (g2.state === 'dead') {
        if (g2.deathTimer > 0) g2.deathTimer -= delta;
        continue;
      }

      /* Detect player */
      var dx2  = _playerPos.x - g2.mesh.position.x;
      var dz2  = _playerPos.z - g2.mesh.position.z;
      var dist2 = Math.sqrt(dx2 * dx2 + dz2 * dz2);

      if (dist2 < 14) {
        g2.state      = 'chase';
        g2.alertTimer = 6;
      }

      if (g2.alertTimer > 0) g2.alertTimer -= delta;
      if (g2.alertTimer <= 0 && g2.state === 'chase') {
        g2.state = 'patrol';
      }

      if (g2.state === 'chase') {
        /* Move toward player */
        var len2 = dist2 || 0.001;
        g2.mesh.position.x += (dx2 / len2) * g2.speed * delta;
        g2.mesh.position.z += (dz2 / len2) * g2.speed * delta;
        g2.mesh.rotation.y  = Math.atan2(dx2, dz2);

        /* Shoot at player */
        g2.shootTimer -= delta;
        if (g2.shootTimer <= 0 && dist2 < 18) {
          g2.shootTimer = 1.4 + Math.random() * 0.8;
          if (dist2 < 12) {
            _playerHP -= 8;
            _showMsg('TAKING FIRE!', 1);
            if (_playerHP <= 0) {
              _playerHP      = 0;
              _missionFailed = true;
              _showMsg('YOU ARE DOWN — MISSION FAILED', 999);
            }
            var hpEl2 = document.getElementById('ub-hp');
            if (hpEl2) hpEl2.textContent = 'HP: ' + _playerHP;
          }
        }
      } else {
        /* Patrol waypoints */
        var wp   = g2.waypoints[g2.wpIdx];
        var wpDx = wp.x - g2.mesh.position.x;
        var wpDz = wp.z - g2.mesh.position.z;
        var wpD  = Math.sqrt(wpDx * wpDx + wpDz * wpDz);

        if (wpD < 0.5) {
          g2.wpIdx = (g2.wpIdx + 1) % g2.waypoints.length;
        } else {
          g2.mesh.position.x += (wpDx / wpD) * g2.speed * 0.6 * delta;
          g2.mesh.position.z += (wpDz / wpD) * g2.speed * 0.6 * delta;
          g2.mesh.rotation.y  = Math.atan2(wpDx, wpDz);
        }
      }

      /* Keep guard on floor */
      g2.mesh.position.y = g2.state === 'dead' ? 0.3 : 1.0;
    }

    /* ── Terminal screen flicker ── */
    for (var tmi = 0; tmi < _terminals.length; tmi++) {
      if (Math.random() < 0.004) {
        _terminals[tmi].material.emissiveIntensity =
          0.1 + Math.random() * 0.6;
      }
    }

    /* ── Message timer ── */
    if (_msgTimer > 0) {
      _msgTimer -= delta;
      if (_msgTimer <= 0 && !_launchAborted && !_missionFailed) {
        if (_msgEl) _msgEl.style.display = 'none';
      }
    }

    /* ── Notification timer ── */
    if (_notifTimer > 0) {
      _notifTimer -= delta;
      if (_notifTimer <= 0 && _notifEl) {
        _notifEl.style.display = 'none';
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera) {
    _scene  = scene;
    _camera = camera;

    document.addEventListener('keydown',      _onKeyDown,           false);
    document.addEventListener('keyup',        _onKeyUp,             false);
    document.addEventListener('mousemove',    _onMouseMove,         false);
    document.addEventListener('mousedown',    _onMouseDown,         false);
    document.addEventListener('mouseup',      _onMouseUp,           false);
    document.addEventListener('pointerlockchange', _onPointerLockChange, false);
    document.addEventListener('click',        _onCanvasClick,       false);

    /* Show standby notification */
    /* Create a brief temporary DOM element so user knows the module loaded */
    var loadEl = document.createElement('div');
    loadEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'right:16px',
      'background:rgba(0,0,0,0.7)',
      'color:#ffee00',
      'font-family:monospace',
      'font-size:14px',
      'padding:5px 12px',
      'z-index:9999',
      'border:1px solid #ffee00'
    ].join(';');
    loadEl.textContent = 'UNDERGROUND BUNKER LOADED — Press U+B to activate';
    document.body.appendChild(loadEl);
    setTimeout(function () {
      if (loadEl.parentNode) loadEl.parentNode.removeChild(loadEl);
    }, 4000);
  }

  function reset() {
    _deactivate();
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
