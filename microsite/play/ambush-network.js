// ambush-network.js — Three.js Ambush Planning & Execution Module
// Pure browser JS, no imports. THREE must be available as a global.

window.AmbushNetwork = (function () {
  'use strict';

  // ─── Constants ──────────────────────────────────────────────────────────────
  var CONVOY_ROUTE_Z_START = 200;
  var CONVOY_ROUTE_Z_END   = -200;
  var CONVOY_SPEED         = 8;        // units/second
  var EXFIL_TIME           = 45;       // seconds
  var MG_FIRE_RATE         = 20;       // bullets/second
  var BULLET_SPEED         = 60;
  var TRIGGER_RADIUS       = 15;
  var MAP_SIZE             = 400;

  // Score values
  var SCORE_CLAYMORE_HIT    = 300;
  var SCORE_CONVOY_STOPPED  = 500;
  var SCORE_NO_FRIENDLY_CAS = 200;
  var SCORE_EXFIL_RALLY     = 300;

  // Element palette types
  var ELEM_KILL_ZONE = 'KILL_ZONE';
  var ELEM_TRIGGER   = 'TRIGGER_POINT';
  var ELEM_MG_POS    = 'MACHINE_GUN_POS';
  var ELEM_CLAYMORE  = 'CLAYMORE';
  var ELEM_BLOCKING  = 'BLOCKING_POSITION';
  var ELEM_RALLY     = 'RALLY_POINT';

  // ─── State ──────────────────────────────────────────────────────────────────
  var scene     = null;
  var camera    = null;
  var playerRef = null;

  var planningMode    = false;
  var overlayEl       = null;
  var planCanvas      = null;
  var planCtx         = null;
  var selectedPalette = ELEM_KILL_ZONE;

  // Placed plan elements [{type, x, y, worldX, worldZ, mesh}]
  var planElements = [];

  // Convoy
  var convoyVehicles  = [];
  var convoyInfantry  = [];
  var convoySpawned   = false;
  var convoyInTrigger = false;
  var convoyDist      = 800;

  // Ambush
  var ambushReady    = false;
  var ambushExecuted = false;
  var holdFire       = false;

  // Buddy MG gunners
  var buddyGunners = [];

  // Claymores in scene
  var claymoreObjects = [];

  // Blocking positions
  var blockingObjects = [];

  // Rally point
  var rallyMesh   = null;
  var rallyWorldX = 0;
  var rallyWorldZ = 0;

  // Bullets from MG gunners
  var activeBullets = [];

  // Exfil
  var exfilPhase    = false;
  var exfilTimer    = 0;
  var exfilComplete = false;

  // Reinforcements
  var reinforcements   = [];
  var reinforceSpawned = false;

  // Score
  var ambushScore = 0;
  var claymoreHits = 0;
  var friendlyCas  = 0;

  // HUD
  var hudEl = null;

  // Keys
  var keysDown = {};

  // ─── Helpers ────────────────────────────────────────────────────────────────
  function _worldToMap(wx, wz) {
    var px = (wx / 400) * MAP_SIZE + MAP_SIZE / 2;
    var py = (wz / 400) * MAP_SIZE + MAP_SIZE / 2;
    return { x: px, y: py };
  }

  function _mapToWorld(mx, my) {
    var wx = ((mx - MAP_SIZE / 2) / MAP_SIZE) * 400;
    var wz = ((my - MAP_SIZE / 2) / MAP_SIZE) * 400;
    return { x: wx, z: wz };
  }

  function _dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ─── Overlay / Planning UI ──────────────────────────────────────────────────
  function _buildOverlay() {
    if (overlayEl) return;

    overlayEl = document.createElement('div');
    overlayEl.id = 'ambush-planning-overlay';
    overlayEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(10,20,10,0.95)',
      'border:2px solid #4a7a4a',
      'padding:12px',
      'z-index:9999',
      'display:none',
      'font-family:monospace',
      'color:#c8e8c8',
      'user-select:none'
    ].join(';');

    var title = document.createElement('div');
    title.textContent = '[ AMBUSH PLANNING MODE ]';
    title.style.cssText = 'font-size:14px;font-weight:bold;margin-bottom:8px;color:#88ff88;text-align:center;letter-spacing:2px;';
    overlayEl.appendChild(title);

    var container = document.createElement('div');
    container.style.cssText = 'display:flex;gap:10px;';

    var palette = document.createElement('div');
    palette.style.cssText = 'width:160px;flex-shrink:0;';

    var paletteLabel = document.createElement('div');
    paletteLabel.textContent = 'ELEMENTS';
    paletteLabel.style.cssText = 'font-size:11px;color:#88aa88;margin-bottom:4px;letter-spacing:1px;';
    palette.appendChild(paletteLabel);

    var paletteItems = [
      { type: ELEM_KILL_ZONE, label: 'KILL ZONE',       color: '#ff4444' },
      { type: ELEM_TRIGGER,   label: 'TRIGGER POINT',   color: '#ff8800' },
      { type: ELEM_MG_POS,    label: 'MACHINE GUN POS', color: '#00ccff' },
      { type: ELEM_CLAYMORE,  label: 'CLAYMORE',        color: '#ff3333' },
      { type: ELEM_BLOCKING,  label: 'BLOCKING POS',    color: '#aa44ff' },
      { type: ELEM_RALLY,     label: 'RALLY POINT',     color: '#00ff66' }
    ];

    var pi;
    for (pi = 0; pi < paletteItems.length; pi++) {
      (function (item) {
        var btn = document.createElement('div');
        btn.dataset.elemType = item.type;
        btn.style.cssText = [
          'padding:5px 8px',
          'margin-bottom:4px',
          'cursor:pointer',
          'border:1px solid ' + item.color,
          'color:' + item.color,
          'font-size:11px',
          'border-radius:2px'
        ].join(';');
        btn.textContent = item.label;
        btn.addEventListener('click', function () {
          selectedPalette = item.type;
          _updatePaletteHighlight();
        });
        btn.addEventListener('mouseenter', function () {
          btn.style.background = 'rgba(255,255,255,0.08)';
        });
        btn.addEventListener('mouseleave', function () {
          _updatePaletteHighlight();
        });
        palette.appendChild(btn);
      })(paletteItems[pi]);
    }

    var clearBtn = document.createElement('button');
    clearBtn.textContent = 'CLEAR ALL';
    clearBtn.style.cssText = 'display:block;width:100%;margin-top:8px;background:#330000;border:1px solid #aa2222;color:#ff6666;font-family:monospace;font-size:11px;padding:4px;cursor:pointer;';
    clearBtn.addEventListener('click', _clearPlanElements);
    palette.appendChild(clearBtn);

    var execBtn = document.createElement('button');
    execBtn.textContent = 'EXECUTE PLAN';
    execBtn.style.cssText = 'display:block;width:100%;margin-top:4px;background:#003300;border:1px solid #22aa22;color:#66ff66;font-family:monospace;font-size:11px;padding:4px;cursor:pointer;';
    execBtn.addEventListener('click', function () {
      _closePlanning();
      _activatePlan();
    });
    palette.appendChild(execBtn);

    var closeBtn = document.createElement('button');
    closeBtn.textContent = 'CLOSE [A+M]';
    closeBtn.style.cssText = 'display:block;width:100%;margin-top:4px;background:#111;border:1px solid #446644;color:#88bb88;font-family:monospace;font-size:11px;padding:4px;cursor:pointer;';
    closeBtn.addEventListener('click', function () {
      _closePlanning();
    });
    palette.appendChild(closeBtn);

    container.appendChild(palette);

    var canvasWrap = document.createElement('div');
    canvasWrap.style.cssText = 'position:relative;';

    planCanvas = document.createElement('canvas');
    planCanvas.width  = MAP_SIZE;
    planCanvas.height = MAP_SIZE;
    planCanvas.style.cssText = 'display:block;border:1px solid #446644;cursor:crosshair;background:#0a140a;';
    planCanvas.addEventListener('click', _onMapClick);
    canvasWrap.appendChild(planCanvas);

    var canvasLabel = document.createElement('div');
    canvasLabel.textContent = 'Click to place selected element  |  Z-axis route: top-bottom';
    canvasLabel.style.cssText = 'font-size:10px;color:#668866;margin-top:4px;text-align:center;';
    canvasWrap.appendChild(canvasLabel);

    container.appendChild(canvasWrap);
    overlayEl.appendChild(container);
    document.body.appendChild(overlayEl);

    planCtx = planCanvas.getContext('2d');
    _updatePaletteHighlight();
  }

  function _updatePaletteHighlight() {
    if (!overlayEl) return;
    var btns = overlayEl.querySelectorAll('[data-elem-type]');
    var i;
    for (i = 0; i < btns.length; i++) {
      var btn = btns[i];
      if (btn.dataset.elemType === selectedPalette) {
        btn.style.background = 'rgba(255,255,255,0.18)';
        btn.style.fontWeight = 'bold';
      } else {
        btn.style.background = 'transparent';
        btn.style.fontWeight = 'normal';
      }
    }
  }

  function _openPlanning() {
    if (!overlayEl) _buildOverlay();
    planningMode = true;
    overlayEl.style.display = 'block';
    _drawMap();
  }

  function _closePlanning() {
    planningMode = false;
    if (overlayEl) overlayEl.style.display = 'none';
  }

  function _togglePlanning() {
    if (planningMode) {
      _closePlanning();
    } else {
      _openPlanning();
    }
  }

  function _onMapClick(evt) {
    if (!planCtx) return;
    var rect = planCanvas.getBoundingClientRect();
    var mx = evt.clientX - rect.left;
    var my = evt.clientY - rect.top;
    var world = _mapToWorld(mx, my);

    planElements.push({
      type:   selectedPalette,
      x:      mx,
      y:      my,
      worldX: world.x,
      worldZ: world.z,
      mesh:   null
    });

    _drawMap();
  }

  function _clearPlanElements() {
    var i;
    for (i = 0; i < planElements.length; i++) {
      if (planElements[i].mesh && scene) {
        scene.remove(planElements[i].mesh);
      }
    }
    planElements = [];
    _drawMap();
  }

  function _drawMap() {
    if (!planCtx) return;

    planCtx.fillStyle = '#0a140a';
    planCtx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

    planCtx.strokeStyle = 'rgba(60,100,60,0.3)';
    planCtx.lineWidth = 1;
    var g;
    for (g = 0; g <= MAP_SIZE; g += 40) {
      planCtx.beginPath();
      planCtx.moveTo(g, 0);
      planCtx.lineTo(g, MAP_SIZE);
      planCtx.stroke();
      planCtx.beginPath();
      planCtx.moveTo(0, g);
      planCtx.lineTo(MAP_SIZE, g);
      planCtx.stroke();
    }

    planCtx.strokeStyle = 'rgba(200,200,100,0.5)';
    planCtx.lineWidth = 6;
    planCtx.setLineDash([10, 5]);
    planCtx.beginPath();
    planCtx.moveTo(MAP_SIZE / 2, 0);
    planCtx.lineTo(MAP_SIZE / 2, MAP_SIZE);
    planCtx.stroke();
    planCtx.setLineDash([]);

    planCtx.fillStyle = 'rgba(200,200,100,0.6)';
    planCtx.font = '10px monospace';
    planCtx.fillText('CONVOY ROUTE', MAP_SIZE / 2 + 8, 14);

    var ay;
    for (ay = 20; ay < MAP_SIZE; ay += 60) {
      planCtx.fillStyle = 'rgba(200,200,100,0.4)';
      planCtx.beginPath();
      planCtx.moveTo(MAP_SIZE / 2, ay + 10);
      planCtx.lineTo(MAP_SIZE / 2 - 6, ay);
      planCtx.lineTo(MAP_SIZE / 2 + 6, ay);
      planCtx.closePath();
      planCtx.fill();
    }

    var ei;
    for (ei = 0; ei < planElements.length; ei++) {
      _drawElement(planCtx, planElements[ei]);
    }

    if (playerRef) {
      var pp = _worldToMap(playerRef.position.x, playerRef.position.z);
      planCtx.fillStyle = '#ffff00';
      planCtx.beginPath();
      planCtx.arc(pp.x, pp.y, 5, 0, Math.PI * 2);
      planCtx.fill();
      planCtx.fillStyle = '#ffff00';
      planCtx.font = '9px monospace';
      planCtx.fillText('YOU', pp.x + 7, pp.y + 3);
    }

    planCtx.fillStyle = 'rgba(100,160,100,0.8)';
    planCtx.font = '9px monospace';
    planCtx.fillText('N', MAP_SIZE - 12, 12);
    planCtx.fillStyle = 'rgba(100,160,100,0.4)';
    planCtx.fillText('S', MAP_SIZE - 12, MAP_SIZE - 4);
  }

  function _drawElement(ctx, el) {
    var x = el.x;
    var y = el.y;

    ctx.save();
    switch (el.type) {
      case ELEM_KILL_ZONE:
        ctx.strokeStyle = '#ff4444';
        ctx.fillStyle = 'rgba(255,68,68,0.15)';
        ctx.lineWidth = 2;
        ctx.fillRect(x - 30, y - 15, 60, 30);
        ctx.strokeRect(x - 30, y - 15, 60, 30);
        ctx.fillStyle = '#ff4444';
        ctx.font = '9px monospace';
        ctx.fillText('KZ', x - 8, y + 3);
        break;

      case ELEM_TRIGGER:
        ctx.strokeStyle = '#ff8800';
        ctx.fillStyle = 'rgba(255,136,0,0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ff8800';
        ctx.font = '8px monospace';
        ctx.fillText('TRG', x - 9, y + 3);
        break;

      case ELEM_MG_POS:
        ctx.strokeStyle = '#00ccff';
        ctx.fillStyle = 'rgba(0,204,255,0.15)';
        ctx.lineWidth = 2;
        ctx.fillRect(x - 10, y - 10, 20, 20);
        ctx.strokeRect(x - 10, y - 10, 20, 20);
        ctx.fillStyle = '#00ccff';
        ctx.font = '8px monospace';
        ctx.fillText('MG', x - 8, y + 3);
        break;

      case ELEM_CLAYMORE:
        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 10);
        ctx.lineTo(x + 10, y + 10);
        ctx.moveTo(x + 10, y - 10);
        ctx.lineTo(x - 10, y + 10);
        ctx.stroke();
        ctx.fillStyle = '#ff3333';
        ctx.font = '8px monospace';
        ctx.fillText('C', x + 4, y - 4);
        break;

      case ELEM_BLOCKING:
        ctx.strokeStyle = '#aa44ff';
        ctx.fillStyle = 'rgba(170,68,255,0.3)';
        ctx.lineWidth = 3;
        ctx.fillRect(x - 35, y - 5, 70, 10);
        ctx.strokeRect(x - 35, y - 5, 70, 10);
        ctx.fillStyle = '#aa44ff';
        ctx.font = '8px monospace';
        ctx.fillText('BLK', x - 8, y + 3);
        break;

      case ELEM_RALLY:
        ctx.strokeStyle = '#00ff66';
        ctx.lineWidth = 2;
        _drawStar(ctx, x, y, 12, 5);
        ctx.fillStyle = 'rgba(0,255,102,0.2)';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#00ff66';
        ctx.font = '8px monospace';
        ctx.fillText('RP', x - 6, y + 3);
        break;

      default:
        break;
    }
    ctx.restore();
  }

  function _drawStar(ctx, cx, cy, r, points) {
    var inner = r * 0.45;
    var i;
    ctx.beginPath();
    for (i = 0; i < points * 2; i++) {
      var angle  = (i * Math.PI) / points - Math.PI / 2;
      var radius = (i % 2 === 0) ? r : inner;
      var sx = cx + Math.cos(angle) * radius;
      var sy = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
  }

  // ─── Convoy Spawning ────────────────────────────────────────────────────────
  function _spawnConvoy() {
    if (!scene || convoySpawned) return;
    convoySpawned = true;
    convoyVehicles = [];
    convoyInfantry = [];

    var vehGeo = new THREE.BoxGeometry(3, 2, 5);
    var vehMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var infGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 6);
    var infMat = new THREE.MeshLambertMaterial({ color: 0x334433 });

    var vi;
    for (vi = 0; vi < 3; vi++) {
      var vMesh = new THREE.Mesh(vehGeo, vehMat.clone());
      vMesh.position.set((vi - 1) * 5, 1, CONVOY_ROUTE_Z_START - vi * 12);
      scene.add(vMesh);
      convoyVehicles.push({
        mesh:     vMesh,
        hp:       100,
        dead:     false,
        reversing: false,
        velocity: -CONVOY_SPEED,
        baseX:    (vi - 1) * 5
      });
    }

    var ii;
    for (ii = 0; ii < 6; ii++) {
      var iMesh = new THREE.Mesh(infGeo, infMat.clone());
      var side = (ii % 2 === 0) ? -6 : 6;
      iMesh.position.set(side, 0.9, CONVOY_ROUTE_Z_START - Math.floor(ii / 2) * 10 - 5);
      scene.add(iMesh);
      convoyInfantry.push({
        mesh:      iMesh,
        dead:      false,
        scattered: false,
        vx:        0,
        vz:        -CONVOY_SPEED * 0.8
      });
    }
  }

  // ─── Plan Activation ────────────────────────────────────────────────────────
  function _activatePlan() {
    if (!scene) return;
    ambushReady = true;

    _clearPlan3DObjects();

    var i;
    for (i = 0; i < planElements.length; i++) {
      _spawnElement3D(planElements[i]);
    }

    _spawnConvoy();
    _buildHUD();
  }

  function _clearPlan3DObjects() {
    if (!scene) return;
    var i;
    for (i = 0; i < claymoreObjects.length; i++) {
      scene.remove(claymoreObjects[i].mesh);
    }
    claymoreObjects = [];

    for (i = 0; i < blockingObjects.length; i++) {
      scene.remove(blockingObjects[i].mesh);
    }
    blockingObjects = [];

    for (i = 0; i < buddyGunners.length; i++) {
      scene.remove(buddyGunners[i].mesh);
    }
    buddyGunners = [];

    if (rallyMesh) {
      scene.remove(rallyMesh);
      rallyMesh = null;
    }
  }

  function _spawnElement3D(el) {
    if (!scene) return;
    var wx = el.worldX;
    var wz = el.worldZ;

    switch (el.type) {
      case ELEM_KILL_ZONE: {
        var kzGeo  = new THREE.BoxGeometry(60, 0.1, 30);
        var kzMat  = new THREE.MeshLambertMaterial({ color: 0xff2222, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
        var kzMesh = new THREE.Mesh(kzGeo, kzMat);
        kzMesh.position.set(wx, 0.1, wz);
        scene.add(kzMesh);
        el.mesh = kzMesh;
        break;
      }

      case ELEM_TRIGGER: {
        var tGeo  = new THREE.CylinderGeometry(TRIGGER_RADIUS, TRIGGER_RADIUS, 0.1, 16);
        var tMat  = new THREE.MeshLambertMaterial({ color: 0xff8800, transparent: true, opacity: 0.4 });
        var tMesh = new THREE.Mesh(tGeo, tMat);
        tMesh.position.set(wx, 0.1, wz);
        scene.add(tMesh);
        el.mesh = tMesh;
        break;
      }

      case ELEM_MG_POS: {
        var mgGeo  = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 8);
        var mgMat  = new THREE.MeshLambertMaterial({ color: 0x334433 });
        var mgMesh = new THREE.Mesh(mgGeo, mgMat);
        mgMesh.position.set(wx, 0.9, wz);
        scene.add(mgMesh);
        el.mesh = mgMesh;

        buddyGunners.push({
          mesh:        mgMesh,
          worldX:      wx,
          worldZ:      wz,
          fireTimer:   0,
          followPlayer: false,
          active:      false
        });
        break;
      }

      case ELEM_CLAYMORE: {
        var cGeo  = new THREE.BoxGeometry(0.4, 0.6, 0.2);
        var cMat  = new THREE.MeshLambertMaterial({ color: 0x886655 });
        var cMesh = new THREE.Mesh(cGeo, cMat);
        cMesh.position.set(wx, 0.3, wz);
        cMesh.lookAt(new THREE.Vector3(0, 0, 0));
        scene.add(cMesh);
        el.mesh = cMesh;

        claymoreObjects.push({
          mesh:         cMesh,
          worldX:       wx,
          worldZ:       wz,
          detonated:    false,
          debrisMeshes: []
        });
        break;
      }

      case ELEM_BLOCKING: {
        var blkGeo  = new THREE.BoxGeometry(0.5, 1.5, 8);
        var blkMat  = new THREE.MeshLambertMaterial({ color: 0x8844cc });
        var blkMesh = new THREE.Mesh(blkGeo, blkMat);
        blkMesh.position.set(wx, 0.75, wz);
        scene.add(blkMesh);
        el.mesh = blkMesh;

        blockingObjects.push({
          mesh:        blkMesh,
          worldX:      wx,
          worldZ:      wz,
          extended:    false,
          targetScaleX: 1
        });
        break;
      }

      case ELEM_RALLY: {
        var rpGeo = new THREE.CylinderGeometry(8, 8, 0.3, 16, 1, true);
        var rpMat = new THREE.MeshLambertMaterial({ color: 0x00FF88, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
        rallyMesh   = new THREE.Mesh(rpGeo, rpMat);
        rallyWorldX = wx;
        rallyWorldZ = wz;
        rallyMesh.position.set(wx, 0.2, wz);
        scene.add(rallyMesh);
        el.mesh = rallyMesh;
        break;
      }

      default:
        break;
    }
  }

  // ─── Ambush Execution ───────────────────────────────────────────────────────
  function _initiateAmbush() {
    if (!ambushReady || ambushExecuted || holdFire) return;
    if (!convoyInTrigger) return;
    ambushExecuted = true;

    var ci;
    for (ci = 0; ci < claymoreObjects.length; ci++) {
      _detonateClaymore(claymoreObjects[ci]);
    }

    var bi;
    for (bi = 0; bi < blockingObjects.length; bi++) {
      blockingObjects[bi].extended     = true;
      blockingObjects[bi].targetScaleX = 30;
    }

    var gi;
    for (gi = 0; gi < buddyGunners.length; gi++) {
      buddyGunners[gi].active = true;
    }

    var ii;
    for (ii = 0; ii < convoyInfantry.length; ii++) {
      var inf = convoyInfantry[ii];
      if (!inf.dead) {
        inf.scattered = true;
        inf.vx = (Math.random() - 0.5) * 10;
        inf.vz = (Math.random() - 0.5) * 10;
      }
    }

    var vi;
    for (vi = 0; vi < convoyVehicles.length; vi++) {
      var veh = convoyVehicles[vi];
      if (!veh.dead) {
        if (vi % 2 === 0) {
          veh.reversing = true;
          veh.velocity  = CONVOY_SPEED;
        } else {
          veh.velocity = -CONVOY_SPEED * 2;
        }
      }
    }

    _updateHUD();
  }

  function _detonateClaymore(claymore) {
    if (!scene || claymore.detonated) return;
    claymore.detonated = true;

    var blastGeo  = new THREE.SphereGeometry(6, 12, 8);
    var blastMat  = new THREE.MeshLambertMaterial({ color: 0xff6600, transparent: true, opacity: 0.7 });
    var blastMesh = new THREE.Mesh(blastGeo, blastMat);
    blastMesh.position.copy(claymore.mesh.position);
    scene.add(blastMesh);
    claymore.debrisMeshes.push({ mesh: blastMesh, life: 0.8, isSphere: true });

    var debrisGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    var d;
    for (d = 0; d < 24; d++) {
      var debrisMat  = new THREE.MeshLambertMaterial({ color: 0x886633 });
      var debrisMesh = new THREE.Mesh(debrisGeo, debrisMat);
      debrisMesh.position.copy(claymore.mesh.position);
      var fanAngle = (Math.random() - 0.5) * Math.PI * 0.6 - Math.PI / 2;
      var speed    = 8 + Math.random() * 12;
      scene.add(debrisMesh);
      claymore.debrisMeshes.push({
        mesh:     debrisMesh,
        vx:       Math.cos(fanAngle) * speed,
        vy:       1 + Math.random() * 3,
        vz:       Math.sin(fanAngle) * speed,
        life:     1.5,
        isSphere: false,
        gravity:  -9.8
      });
    }

    scene.remove(claymore.mesh);

    var vi;
    for (vi = 0; vi < convoyVehicles.length; vi++) {
      var veh = convoyVehicles[vi];
      if (!veh.dead) {
        var dist = _dist2D(claymore.worldX, claymore.worldZ, veh.mesh.position.x, veh.mesh.position.z);
        if (dist < 12) {
          veh.hp -= 80;
          if (veh.hp <= 0) veh.dead = true;
          claymoreHits++;
          ambushScore += SCORE_CLAYMORE_HIT;
        }
      }
    }
  }

  // ─── Bullets ────────────────────────────────────────────────────────────────
  function _fireMGBurst(gunner, dt) {
    gunner.fireTimer -= dt;
    if (gunner.fireTimer > 0) return;
    gunner.fireTimer = 1 / MG_FIRE_RATE;

    var target   = null;
    var nearDist = 999;
    var vi;
    for (vi = 0; vi < convoyVehicles.length; vi++) {
      var veh = convoyVehicles[vi];
      if (!veh.dead) {
        var d = _dist2D(gunner.worldX, gunner.worldZ, veh.mesh.position.x, veh.mesh.position.z);
        if (d < nearDist) {
          nearDist = d;
          target   = veh;
        }
      }
    }
    if (!target) return;

    var bGeo  = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 4);
    var bMat  = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    var bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(gunner.worldX, 1.5, gunner.worldZ);
    scene.add(bMesh);

    var dx  = target.mesh.position.x - gunner.worldX;
    var dz  = target.mesh.position.z - gunner.worldZ;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;

    activeBullets.push({
      mesh: bMesh,
      vx:   (dx / len) * BULLET_SPEED + (Math.random() - 0.5) * 2,
      vy:   0,
      vz:   (dz / len) * BULLET_SPEED + (Math.random() - 0.5) * 2,
      life: 2.0
    });
  }

  // ─── Reinforcements ─────────────────────────────────────────────────────────
  function _spawnReinforcements() {
    if (!scene || reinforceSpawned) return;
    reinforceSpawned = true;

    var vehGeo = new THREE.BoxGeometry(3, 2, 5);
    var vehMat = new THREE.MeshLambertMaterial({ color: 0x553333 });
    var i;
    for (i = 0; i < 3; i++) {
      var mesh = new THREE.Mesh(vehGeo, vehMat.clone());
      mesh.position.set((i - 1) * 6, 1, -CONVOY_ROUTE_Z_START);
      scene.add(mesh);
      reinforcements.push({
        mesh:     mesh,
        dead:     false,
        velocity: CONVOY_SPEED
      });
    }
  }

  // ─── HUD ────────────────────────────────────────────────────────────────────
  function _buildHUD() {
    if (hudEl) return;
    hudEl = document.createElement('div');
    hudEl.id = 'ambush-network-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'bottom:60px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,0,0.75)',
      'border:1px solid #226622',
      'color:#88ee88',
      'font-family:monospace',
      'font-size:12px',
      'padding:5px 14px',
      'z-index:8000',
      'pointer-events:none',
      'letter-spacing:1px',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(hudEl);
    _updateHUD();
  }

  function _updateHUD() {
    if (!hudEl) return;

    var elemCount = planElements.length;
    var status    = 'STANDBY';
    if (planningMode)                         status = 'PLANNING';
    if (ambushReady)                          status = 'READY';
    if (holdFire)                             status = 'HOLD FIRE';
    if (convoyInTrigger && !holdFire)         status = 'CONVOY IN TRIGGER!';
    if (ambushExecuted)                       status = 'INITIATED';
    if (exfilPhase)                           status = 'EXFIL [' + Math.ceil(exfilTimer) + 's]';
    if (exfilComplete)                        status = 'EXFIL COMPLETE';

    var distStr  = Math.round(convoyDist) + 'm';
    var exfilStr = exfilPhase ? 'EXFIL: ' + Math.ceil(exfilTimer) + 's' : 'EXFIL: RALLY PT';

    hudEl.textContent = 'AMBUSH [CONVOY: ' + distStr + '] [ELEMENTS: ' + elemCount + '] [STATUS: ' + status + '] | ' + exfilStr;

    if (holdFire) {
      hudEl.style.borderColor = '#aa6600';
      hudEl.style.color       = '#ffaa44';
    } else if (convoyInTrigger && !ambushExecuted) {
      hudEl.style.borderColor = '#ff2200';
      hudEl.style.color       = '#ff6644';
    } else if (ambushExecuted) {
      hudEl.style.borderColor = '#ff4400';
      hudEl.style.color       = '#ff8844';
    } else {
      hudEl.style.borderColor = '#226622';
      hudEl.style.color       = '#88ee88';
    }
  }

  // ─── Input ──────────────────────────────────────────────────────────────────
  function _onKeyDown(evt) {
    keysDown[evt.code] = true;

    var key = evt.key ? evt.key.toUpperCase() : '';

    if (key === 'A') { keysDown._A = true; }
    if (key === 'M') { keysDown._M = true; }

    if (keysDown._A && keysDown._M) {
      _togglePlanning();
    }

    if (key === 'X' && !planningMode) {
      _initiateAmbush();
    }

    if (key === 'H' && !planningMode) {
      holdFire = !holdFire;
      _updateHUD();
    }
  }

  function _onKeyUp(evt) {
    keysDown[evt.code] = false;
    var key = evt.key ? evt.key.toUpperCase() : '';
    if (key === 'A') { keysDown._A = false; }
    if (key === 'M') { keysDown._M = false; }
  }

  // ─── Update Logic ────────────────────────────────────────────────────────────
  function _updateConvoy(dt) {
    if (!convoySpawned) return;

    var leadZ = 9999;
    var vi;
    for (vi = 0; vi < convoyVehicles.length; vi++) {
      var veh = convoyVehicles[vi];
      if (!veh.dead && veh.mesh.position.z < leadZ) {
        leadZ = veh.mesh.position.z;
      }
    }

    if (playerRef && leadZ < 9000) {
      convoyDist = Math.abs(playerRef.position.z - leadZ);
    } else {
      convoyDist = Math.max(0, leadZ + 200);
    }

    var vi2;
    for (vi2 = 0; vi2 < convoyVehicles.length; vi2++) {
      var veh2 = convoyVehicles[vi2];
      if (veh2.dead) continue;

      veh2.mesh.position.z += veh2.velocity * dt;

      if (ambushExecuted) {
        var bi;
        for (bi = 0; bi < blockingObjects.length; bi++) {
          var blk = blockingObjects[bi];
          if (blk.extended) {
            var bDist = _dist2D(veh2.mesh.position.x, veh2.mesh.position.z, blk.worldX, blk.worldZ);
            if (bDist < 8) {
              veh2.velocity = 0;
            }
          }
        }
      }
    }

    var ii;
    for (ii = 0; ii < convoyInfantry.length; ii++) {
      var inf = convoyInfantry[ii];
      if (inf.dead) continue;
      if (inf.scattered) {
        inf.mesh.position.x += inf.vx * dt;
        inf.mesh.position.z += inf.vz * dt;
        inf.vx *= 0.98;
        inf.vz *= 0.98;
      } else {
        inf.mesh.position.z += inf.vz * dt;
      }
    }

    if (!ambushExecuted) {
      var ti;
      for (ti = 0; ti < planElements.length; ti++) {
        var tel = planElements[ti];
        if (tel.type !== ELEM_TRIGGER) continue;
        var tvi;
        for (tvi = 0; tvi < convoyVehicles.length; tvi++) {
          var tveh = convoyVehicles[tvi];
          if (!tveh.dead) {
            var tdist = _dist2D(tel.worldX, tel.worldZ, tveh.mesh.position.x, tveh.mesh.position.z);
            if (tdist < TRIGGER_RADIUS) {
              convoyInTrigger = true;
            }
          }
        }
      }
    }
  }

  function _updateBullets(dt) {
    var i;
    for (i = activeBullets.length - 1; i >= 0; i--) {
      var b = activeBullets[i];
      b.mesh.position.x += b.vx * dt;
      b.mesh.position.y += b.vy * dt;
      b.mesh.position.z += b.vz * dt;
      b.life -= dt;

      var vi;
      for (vi = 0; vi < convoyVehicles.length; vi++) {
        var veh = convoyVehicles[vi];
        if (!veh.dead) {
          var dist = _dist2D(b.mesh.position.x, b.mesh.position.z, veh.mesh.position.x, veh.mesh.position.z);
          if (dist < 3 && Math.abs(b.mesh.position.y - veh.mesh.position.y) < 2) {
            veh.hp -= 5;
            if (veh.hp <= 0) veh.dead = true;
            b.life = 0;
          }
        }
      }

      if (b.life <= 0) {
        scene.remove(b.mesh);
        activeBullets.splice(i, 1);
      }
    }
  }

  function _updateClaymoreDebris(dt) {
    var ci;
    for (ci = 0; ci < claymoreObjects.length; ci++) {
      var claymore = claymoreObjects[ci];
      var di;
      for (di = claymore.debrisMeshes.length - 1; di >= 0; di--) {
        var d = claymore.debrisMeshes[di];
        d.life -= dt;
        if (!d.isSphere) {
          d.mesh.position.x += d.vx * dt;
          d.mesh.position.y += d.vy * dt;
          d.mesh.position.z += d.vz * dt;
          d.vy += d.gravity * dt;
          d.mesh.rotation.x += 3 * dt;
          d.mesh.rotation.z += 2 * dt;
        } else {
          var s = Math.max(0, d.life / 0.8);
          d.mesh.scale.setScalar(s);
        }
        if (d.life <= 0) {
          scene.remove(d.mesh);
          claymore.debrisMeshes.splice(di, 1);
        }
      }
    }
  }

  function _updateBlockingPositions(dt) {
    var bi;
    for (bi = 0; bi < blockingObjects.length; bi++) {
      var blk = blockingObjects[bi];
      if (blk.extended) {
        var currentX = blk.mesh.scale.x;
        if (currentX < blk.targetScaleX) {
          blk.mesh.scale.x = Math.min(blk.targetScaleX, currentX + 15 * dt);
        }
      }
    }
  }

  function _updateBuddyGunners(dt) {
    var gi;
    for (gi = 0; gi < buddyGunners.length; gi++) {
      var gunner = buddyGunners[gi];
      if (!gunner.active) continue;

      if (!exfilPhase) {
        _fireMGBurst(gunner, dt);
      }

      if (exfilPhase && playerRef) {
        var dx  = playerRef.position.x - gunner.mesh.position.x;
        var dz  = playerRef.position.z - gunner.mesh.position.z;
        var len = Math.sqrt(dx * dx + dz * dz);
        if (len > 3) {
          gunner.mesh.position.x += (dx / len) * 5 * dt;
          gunner.mesh.position.z += (dz / len) * 5 * dt;
        }
        gunner.worldX = gunner.mesh.position.x;
        gunner.worldZ = gunner.mesh.position.z;
      }
    }
  }

  function _updateExfil(dt) {
    if (!exfilPhase || exfilComplete) return;
    exfilTimer -= dt;

    if (playerRef && rallyMesh) {
      var pdist = _dist2D(playerRef.position.x, playerRef.position.z, rallyWorldX, rallyWorldZ);
      if (pdist < 10) {
        exfilComplete = true;
        ambushScore  += SCORE_EXFIL_RALLY;
        _showScoreScreen();
        return;
      }
    }

    if (rallyMesh) {
      var pulse = 0.9 + 0.1 * Math.sin(Date.now() * 0.004);
      rallyMesh.scale.setScalar(pulse);
    }

    if (exfilTimer <= 0) {
      _spawnReinforcements();
      _updateHUD();
    }
  }

  function _updateReinforcements(dt) {
    var ri;
    for (ri = 0; ri < reinforcements.length; ri++) {
      var r = reinforcements[ri];
      if (!r.dead) {
        r.mesh.position.z += r.velocity * dt;
      }
    }
  }

  function _checkAmbushComplete() {
    if (!ambushExecuted || exfilPhase) return;

    var allDead = true;
    var vi;
    for (vi = 0; vi < convoyVehicles.length; vi++) {
      if (!convoyVehicles[vi].dead) {
        allDead = false;
        break;
      }
    }

    if (allDead) {
      ambushScore += SCORE_CONVOY_STOPPED;
      if (friendlyCas === 0) { ambushScore += SCORE_NO_FRIENDLY_CAS; }

      exfilPhase  = true;
      exfilTimer  = EXFIL_TIME;

      var gi;
      for (gi = 0; gi < buddyGunners.length; gi++) {
        buddyGunners[gi].followPlayer = true;
      }
    }
  }

  function _showScoreScreen() {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,20,0,0.96)',
      'border:2px solid #44aa44',
      'color:#88ff88',
      'font-family:monospace',
      'font-size:14px',
      'padding:20px 30px',
      'z-index:10000',
      'text-align:center',
      'min-width:300px'
    ].join(';');

    el.innerHTML = [
      '<div style="font-size:18px;font-weight:bold;color:#00ff88;margin-bottom:12px;letter-spacing:3px;">AMBUSH COMPLETE</div>',
      '<div>Claymore Hits: ' + claymoreHits + '  (+' + (claymoreHits * SCORE_CLAYMORE_HIT) + ')</div>',
      '<div>Convoy Stopped: +' + SCORE_CONVOY_STOPPED + '</div>',
      '<div>No Friendly Cas: ' + (friendlyCas === 0 ? '+' + SCORE_NO_FRIENDLY_CAS : '0') + '</div>',
      '<div>Exfil to Rally: +' + SCORE_EXFIL_RALLY + '</div>',
      '<div style="margin-top:12px;font-size:20px;color:#ffff44;font-weight:bold;">SCORE: ' + ambushScore + '</div>',
      '<div style="margin-top:10px;font-size:11px;color:#668866;">Press R to restart</div>'
    ].join('');

    document.body.appendChild(el);
  }

  // ─── Public API ─────────────────────────────────────────────────────────────
  function init(sceneRef, cameraRef, player) {
    scene     = sceneRef;
    camera    = cameraRef;
    playerRef = player;

    keysDown        = {};
    planElements    = [];
    convoyVehicles  = [];
    convoyInfantry  = [];
    claymoreObjects = [];
    blockingObjects = [];
    buddyGunners    = [];
    reinforcements  = [];
    activeBullets   = [];

    convoySpawned    = false;
    convoyInTrigger  = false;
    ambushReady      = false;
    ambushExecuted   = false;
    holdFire         = false;
    exfilPhase       = false;
    exfilTimer       = 0;
    exfilComplete    = false;
    reinforceSpawned = false;
    ambushScore      = 0;
    claymoreHits     = 0;
    friendlyCas      = 0;
    convoyDist       = 800;
    rallyMesh        = null;

    document.addEventListener('keydown', _onKeyDown);
    document.addEventListener('keyup',   _onKeyUp);

    _buildHUD();
  }

  function update(dt) {
    if (typeof dt === 'undefined' || dt === null) { dt = 0.016; }
    if (dt > 0.1) { dt = 0.1; }

    _updateConvoy(dt);

    if (ambushExecuted) {
      _updateBullets(dt);
      _updateClaymoreDebris(dt);
      _updateBlockingPositions(dt);
      _updateBuddyGunners(dt);
      _checkAmbushComplete();
    }

    if (exfilPhase) {
      _updateExfil(dt);
      _updateReinforcements(dt);
    }

    if (planningMode) {
      _drawMap();
    }

    _updateHUD();
  }

  function reset() {
    var vi, ii, bi, ri;
    if (scene) {
      for (vi = 0; vi < convoyVehicles.length; vi++) { scene.remove(convoyVehicles[vi].mesh); }
      for (ii = 0; ii < convoyInfantry.length; ii++) { scene.remove(convoyInfantry[ii].mesh); }
      for (bi = 0; bi < activeBullets.length; bi++)  { scene.remove(activeBullets[bi].mesh); }
      for (ri = 0; ri < reinforcements.length; ri++)  { scene.remove(reinforcements[ri].mesh); }
      _clearPlan3DObjects();
    }

    document.removeEventListener('keydown', _onKeyDown);
    document.removeEventListener('keyup',   _onKeyUp);

    if (overlayEl && overlayEl.parentNode) {
      overlayEl.parentNode.removeChild(overlayEl);
      overlayEl = null;
    }
    if (hudEl && hudEl.parentNode) {
      hudEl.parentNode.removeChild(hudEl);
      hudEl = null;
    }

    planCanvas = null;
    planCtx    = null;

    convoyVehicles  = [];
    convoyInfantry  = [];
    claymoreObjects = [];
    blockingObjects = [];
    buddyGunners    = [];
    reinforcements  = [];
    activeBullets   = [];
    planElements    = [];

    scene     = null;
    camera    = null;
    playerRef = null;

    convoySpawned    = false;
    convoyInTrigger  = false;
    ambushReady      = false;
    ambushExecuted   = false;
    holdFire         = false;
    planningMode     = false;
    exfilPhase       = false;
    exfilComplete    = false;
    reinforceSpawned = false;
    ambushScore      = 0;
    claymoreHits     = 0;
    friendlyCas      = 0;
    convoyDist       = 800;
    rallyMesh        = null;
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

})();
