window.GlacierBase = (function() {
  'use strict';

  // --- State ---
  var active = false;
  var sceneRef = null;
  var cameraRef = null;
  var trackedObjects = [];
  var hudElement = null;
  var notifElement = null;

  // Game state
  var missilesDestroyed = 0;
  var totalMissiles = 4;
  var exfilReady = false;
  var exfilMarker = null;
  var elapsed = 0;

  // Stalactites
  var stalactites = [];
  var stalactiteFalling = [];
  var stalactiteOrigY = [];

  // Enemies
  var enemies = [];

  // Fog
  var fogInitialDensity = 0.008;
  var fogMaxDensity = 0.04;

  // Key sequence for G+B
  var lastGTime = 0;

  // Explosion events (positions)
  var pendingExplosions = [];

  // Missiles (to track destruction)
  var missiles = [];

  // --- Helpers ---
  function trackAdd(scene, obj) {
    scene.add(obj);
    trackedObjects.push(obj);
    return obj;
  }

  function makeIceWallPanel(scene, x, y, z, w, h, d) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshPhongMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    trackAdd(scene, mesh);
    return mesh;
  }

  function makeMissileSilo(scene, x, z, index) {
    // Base platform
    var baseGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.5, 16);
    var baseMat = new THREE.MeshPhongMaterial({ color: 0x555566 });
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(x, 0.25, z);
    trackAdd(scene, base);

    // Silo body
    var siloGeo = new THREE.CylinderGeometry(0.8, 1.0, 6, 16);
    var siloMat = new THREE.MeshPhongMaterial({ color: 0x334455 });
    var silo = new THREE.Mesh(siloGeo, siloMat);
    silo.position.set(x, 3.5, z);
    trackAdd(scene, silo);

    // Missile inside (visible top part)
    var missileGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
    var missileMat = new THREE.MeshPhongMaterial({ color: 0xaa2222 });
    var missile = new THREE.Mesh(missileGeo, missileMat);
    missile.position.set(x, 5, z);
    trackAdd(scene, missile);
    missile.userData.siloIndex = index;
    missile.userData.alive = true;
    missiles.push(missile);

    // Cone tip
    var tipGeo = new THREE.ConeGeometry(0.3, 1, 8);
    var tipMat = new THREE.MeshPhongMaterial({ color: 0xcc3333 });
    var tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.set(x, 7.2, z);
    trackAdd(scene, tip);
    tip.userData.missileIndex = index;
    missiles.push(tip); // track for hiding

    // Warning ring
    var ringGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.1, 16, 1, true);
    var ringMat = new THREE.MeshPhongMaterial({ color: 0xff4400, emissive: 0x441100 });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(x, 0.55, z);
    trackAdd(scene, ring);

    return { silo: silo, missile: missile, tip: tip, x: x, z: z, index: index };
  }

  function makeSnowmobile(scene, x, z, rotY) {
    var bodyGeo = new THREE.BoxGeometry(2, 0.6, 0.9);
    var bodyMat = new THREE.MeshPhongMaterial({ color: 0xddddee });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(x, 0.5, z);
    body.rotation.y = rotY;
    trackAdd(scene, body);

    var handleGeo = new THREE.BoxGeometry(0.1, 0.5, 1.2);
    var handleMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(x + Math.cos(rotY) * 0.8, 0.95, z + Math.sin(rotY) * 0.8);
    handle.rotation.y = rotY;
    trackAdd(scene, handle);

    var trackGeo = new THREE.BoxGeometry(2.1, 0.15, 0.3);
    var trackMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    var trackL = new THREE.Mesh(trackGeo, trackMat);
    trackL.position.set(x, 0.18, z - 0.45);
    trackL.rotation.y = rotY;
    trackAdd(scene, trackL);
    var trackR = new THREE.Mesh(trackGeo, trackMat);
    trackR.position.set(x, 0.18, z + 0.45);
    trackR.rotation.y = rotY;
    trackAdd(scene, trackR);
  }

  function makeGeneratorRoom(scene, x, z) {
    // Room walls
    makeIceWallPanel(scene, x, 2, z - 4, 8, 4, 0.3);
    makeIceWallPanel(scene, x, 2, z + 4, 8, 4, 0.3);
    makeIceWallPanel(scene, x - 4, 2, z, 0.3, 4, 8);
    makeIceWallPanel(scene, x + 4, 2, z, 0.3, 4, 8);

    // Generator units
    var i;
    for (i = 0; i < 3; i++) {
      var genGeo = new THREE.BoxGeometry(1.5, 2, 1);
      var genMat = new THREE.MeshPhongMaterial({ color: 0x445533, emissive: 0x112200 });
      var gen = new THREE.Mesh(genGeo, genMat);
      gen.position.set(x - 2 + i * 2, 1, z - 2);
      trackAdd(scene, gen);

      // Exhaust pipe
      var pipeGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8);
      var pipeMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
      var pipe = new THREE.Mesh(pipeGeo, pipeMat);
      pipe.position.set(x - 2 + i * 2, 2.75, z - 2);
      trackAdd(scene, pipe);
    }

    // Control panel
    var panelGeo = new THREE.BoxGeometry(3, 1.5, 0.3);
    var panelMat = new THREE.MeshPhongMaterial({ color: 0x223344, emissive: 0x001122 });
    var panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(x, 1.2, z + 3.5);
    trackAdd(scene, panel);
  }

  function makeStalactite(scene, x, y, z) {
    var h = 1.5 + Math.random() * 2;
    var geo = new THREE.ConeGeometry(0.2 + Math.random() * 0.2, h, 6);
    var mat = new THREE.MeshPhongMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.8
    });
    var mesh = new THREE.Mesh(geo, mat);
    // Inverted: rotate 180 deg on Z so tip points down
    mesh.rotation.z = Math.PI;
    mesh.position.set(x, y, z);
    trackAdd(scene, mesh);
    stalactites.push(mesh);
    stalactiteFalling.push(false);
    stalactiteOrigY.push(y);
    return mesh;
  }

  function makeCatwalk(scene, x1, x2, y, z) {
    // Flat box walkway
    var len = Math.abs(x2 - x1);
    var geo = new THREE.BoxGeometry(len, 0.1, 1);
    var mat = new THREE.MeshPhongMaterial({ color: 0x666677 });
    var walk = new THREE.Mesh(geo, mat);
    walk.position.set((x1 + x2) / 2, y, z);
    trackAdd(scene, walk);

    // Railing LineSegments
    var pts = [];
    pts.push(x1, y + 0.5, z - 0.5);  pts.push(x2, y + 0.5, z - 0.5);
    pts.push(x1, y + 0.5, z + 0.5);  pts.push(x2, y + 0.5, z + 0.5);
    // Vertical posts
    var stepLen = (x2 - x1) / 4;
    var i;
    for (i = 0; i <= 4; i++) {
      var px = x1 + i * stepLen;
      pts.push(px, y, z - 0.5);  pts.push(px, y + 0.5, z - 0.5);
      pts.push(px, y, z + 0.5);  pts.push(px, y + 0.5, z + 0.5);
    }
    var lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    var lineMat = new THREE.LineBasicMaterial({ color: 0x888899 });
    var lines = new THREE.LineSegments(lineGeo, lineMat);
    trackAdd(scene, lines);
  }

  function makeEnemy(scene, x, z) {
    var group = new THREE.Group();

    // Body
    var bodyGeo = new THREE.BoxGeometry(0.6, 1, 0.4);
    var bodyMat = new THREE.MeshPhongMaterial({ color: 0xeeeeff });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.5, 0);
    group.add(body);

    // Head
    var headGeo = new THREE.SphereGeometry(0.22, 8, 8);
    var headMat = new THREE.MeshPhongMaterial({ color: 0xffddcc });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.17, 0);
    group.add(head);

    // Helmet
    var helmGeo = new THREE.SphereGeometry(0.25, 8, 8);
    var helmMat = new THREE.MeshPhongMaterial({ color: 0xddddee });
    var helm = new THREE.Mesh(helmGeo, helmMat);
    helm.position.set(0, 1.2, 0);
    group.add(helm);

    // Arms
    var armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    var armMat = new THREE.MeshPhongMaterial({ color: 0xeeeeff });
    var armL = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-0.4, 0.5, 0);
    group.add(armL);
    var armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(0.4, 0.5, 0);
    group.add(armR);

    // Weapon
    var gunGeo = new THREE.BoxGeometry(0.08, 0.08, 0.7);
    var gunMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    var gun = new THREE.Mesh(gunGeo, gunMat);
    gun.position.set(0.45, 0.55, -0.35);
    group.add(gun);

    // Legs
    var legGeo = new THREE.BoxGeometry(0.22, 0.65, 0.22);
    var legMat = new THREE.MeshPhongMaterial({ color: 0xccccdd });
    var legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.17, -0.3, 0);
    group.add(legL);
    var legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.17, -0.3, 0);
    group.add(legR);

    group.position.set(x, 0.95, z);
    group.userData.alive = true;
    group.userData.patrolDir = (Math.random() > 0.5) ? 1 : -1;
    group.userData.patrolRange = 3 + Math.random() * 3;
    group.userData.patrolOriginX = x;
    group.userData.patrolOriginZ = z;
    group.userData.patrolT = Math.random() * Math.PI * 2;
    trackAdd(scene, group);
    enemies.push(group);
    return group;
  }

  function makeFloor(scene) {
    var geo = new THREE.BoxGeometry(60, 0.3, 60);
    var mat = new THREE.MeshPhongMaterial({ color: 0xaaccdd });
    var floor = new THREE.Mesh(geo, mat);
    floor.position.set(0, -0.15, 0);
    trackAdd(scene, floor);
  }

  function makeCeiling(scene) {
    var geo = new THREE.BoxGeometry(60, 0.4, 60);
    var mat = new THREE.MeshPhongMaterial({
      color: 0x99bbdd,
      transparent: true,
      opacity: 0.5
    });
    var ceil = new THREE.Mesh(geo, mat);
    ceil.position.set(0, 8.2, 0);
    trackAdd(scene, ceil);
  }

  function makeExfilMarker(scene) {
    var geo = new THREE.CylinderGeometry(2, 2, 0.1, 16);
    var mat = new THREE.MeshPhongMaterial({
      color: 0x00ff88,
      emissive: 0x004422,
      transparent: true,
      opacity: 0.7
    });
    var marker = new THREE.Mesh(geo, mat);
    marker.position.set(20, 0.1, 20);
    trackAdd(scene, marker);

    // Helicopter pad H marker
    var hGeo = new THREE.BoxGeometry(1.5, 0.05, 0.3);
    var hMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
    var hBar = new THREE.Mesh(hGeo, hMat);
    hBar.position.set(20, 0.2, 20);
    trackAdd(scene, hBar);
    var v1Geo = new THREE.BoxGeometry(0.3, 0.05, 1.2);
    var v1 = new THREE.Mesh(v1Geo, hMat);
    v1.position.set(19.3, 0.2, 20);
    trackAdd(scene, v1);
    var v2 = new THREE.Mesh(v1Geo, hMat);
    v2.position.set(20.7, 0.2, 20);
    trackAdd(scene, v2);

    exfilMarker = marker;
    marker.visible = false;
    hBar.visible = false;
    v1.visible = false;
    v2.visible = false;
    // store references for toggling
    marker.userData.exfilParts = [hBar, v1, v2];
    return marker;
  }

  function buildHUD() {
    hudElement = document.createElement('div');
    hudElement.id = 'glacier-hud';
    hudElement.style.cssText = [
      'position:fixed',
      'top:20px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,20,40,0.75)',
      'color:#88eeff',
      'font-family:monospace',
      'font-size:14px',
      'padding:8px 18px',
      'border:1px solid #336688',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:1000',
      'display:none'
    ].join(';');
    hudElement.innerHTML = '<div id="gb-missiles">MISSILES DESTROYED: 0/4</div><div id="gb-exfil">EXFIL: NOT READY</div>';
    document.body.appendChild(hudElement);

    notifElement = document.createElement('div');
    notifElement.id = 'glacier-notif';
    notifElement.style.cssText = [
      'position:fixed',
      'top:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,40,20,0.85)',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:16px',
      'padding:6px 16px',
      'border:1px solid #00aa55',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:1001',
      'display:none',
      'transition:opacity 0.5s'
    ].join(';');
    document.body.appendChild(notifElement);
  }

  function showNotif(msg, duration) {
    if (!notifElement) return;
    notifElement.textContent = msg;
    notifElement.style.display = 'block';
    notifElement.style.opacity = '1';
    clearTimeout(notifElement._hideTimer);
    notifElement._hideTimer = setTimeout(function() {
      notifElement.style.opacity = '0';
      setTimeout(function() { notifElement.style.display = 'none'; }, 500);
    }, duration || 2500);
  }

  function updateHUD() {
    var mEl = document.getElementById('gb-missiles');
    var eEl = document.getElementById('gb-exfil');
    if (mEl) mEl.textContent = 'MISSILES DESTROYED: ' + missilesDestroyed + '/' + totalMissiles;
    if (eEl) eEl.textContent = 'EXFIL: ' + (exfilReady ? 'READY — REACH LZ' : 'NOT READY');
  }

  // --- Key handlers ---
  function onKeyDown(e) {
    if (!active) return;
    var key = e.key ? e.key.toUpperCase() : '';
    var now = Date.now();

    if (key === 'G') {
      lastGTime = now;
    } else if (key === 'B') {
      if (now - lastGTime <= 400) {
        toggleModule();
        lastGTime = 0;
      }
    }

    // E key: interact / destroy missile if close
    if (key === 'E' && cameraRef) {
      tryDestroyMissile();
    }
  }

  function tryDestroyMissile() {
    if (!cameraRef) return;
    var cam = cameraRef;
    var i;
    for (i = 0; i < missiles.length; i++) {
      var m = missiles[i];
      if (!m.userData.alive) continue;
      var dx = m.position.x - cam.position.x;
      var dz = m.position.z - cam.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 4) {
        // destroy
        m.userData.alive = false;
        m.visible = false;
        missilesDestroyed++;
        // trigger stalactite fall nearby
        pendingExplosions.push({ x: m.position.x, y: m.position.y, z: m.position.z });
        updateHUD();
        showNotif('MISSILE DESTROYED! (' + missilesDestroyed + '/' + totalMissiles + ')', 2000);
        if (missilesDestroyed >= totalMissiles && !exfilReady) {
          exfilReady = true;
          // Show exfil marker
          if (exfilMarker) {
            exfilMarker.visible = true;
            var parts = exfilMarker.userData.exfilParts;
            if (parts) {
              var p;
              for (p = 0; p < parts.length; p++) parts[p].visible = true;
            }
          }
          updateHUD();
          showNotif('ALL MISSILES DESTROYED! EXFIL POINT UNLOCKED! MOVE TO LZ!', 4000);
        }
        break;
      }
    }
  }

  function toggleModule() {
    if (active) {
      deactivate();
    } else {
      activate();
    }
  }

  function activate() {
    active = true;
    if (hudElement) hudElement.style.display = 'block';
    showNotif('GLACIER BASE ACTIVE — DESTROY ALL MISSILES [E near missile]', 3500);
  }

  function deactivate() {
    active = false;
    if (hudElement) hudElement.style.display = 'none';
    showNotif('GLACIER BASE DEACTIVATED', 1500);
  }

  // --- Module API ---
  function init(scene, camera) {
    sceneRef = scene;
    cameraRef = camera;
    active = false;
    elapsed = 0;
    missilesDestroyed = 0;
    exfilReady = false;
    exfilMarker = null;
    stalactites = [];
    stalactiteFalling = [];
    stalactiteOrigY = [];
    enemies = [];
    missiles = [];
    pendingExplosions = [];
    trackedObjects = [];
    lastGTime = 0;

    // Fog
    scene.fog = new THREE.FogExp2(0x99ccdd, fogInitialDensity);

    // Lights
    var ambient = new THREE.AmbientLight(0x445566, 0.7);
    trackAdd(scene, ambient);
    var dirLight = new THREE.DirectionalLight(0xaaddff, 0.8);
    dirLight.position.set(10, 20, 5);
    trackAdd(scene, dirLight);
    var pointLight1 = new THREE.PointLight(0x00aaff, 0.6, 30);
    pointLight1.position.set(-10, 4, -10);
    trackAdd(scene, pointLight1);
    var pointLight2 = new THREE.PointLight(0xff4400, 0.4, 20);
    pointLight2.position.set(5, 3, 5);
    trackAdd(scene, pointLight2);

    // Floor + ceiling
    makeFloor(scene);
    makeCeiling(scene);

    // --- Ice wall panels (perimeter) ---
    var i;
    // North wall
    for (i = 0; i < 4; i++) {
      makeIceWallPanel(scene, -22 + i * 15, 4, -28, 14, 8, 0.4);
    }
    // South wall
    for (i = 0; i < 4; i++) {
      makeIceWallPanel(scene, -22 + i * 15, 4, 28, 14, 8, 0.4);
    }
    // East wall
    for (i = 0; i < 4; i++) {
      makeIceWallPanel(scene, 28, 4, -22 + i * 15, 0.4, 8, 14);
    }
    // West wall
    for (i = 0; i < 4; i++) {
      makeIceWallPanel(scene, -28, 4, -22 + i * 15, 0.4, 8, 14);
    }

    // Interior divider walls
    makeIceWallPanel(scene, 0, 3, 0, 20, 6, 0.4);
    makeIceWallPanel(scene, 0, 3, 10, 0.4, 6, 10);

    // --- Missile silos (4) ---
    makeMissileSilo(scene, -15, -15, 0);
    makeMissileSilo(scene, -10, -15, 1);
    makeMissileSilo(scene, -5, -20, 2);
    makeMissileSilo(scene, -20, -20, 3);

    // --- Vehicle bay (snowmobiles) ---
    makeSnowmobile(scene, 10, -10, 0);
    makeSnowmobile(scene, 13, -10, 0.1);
    makeSnowmobile(scene, 10, -13, -0.05);
    // Bay walls
    makeIceWallPanel(scene, 13, 2, -7, 10, 4, 0.3);
    makeIceWallPanel(scene, 7, 2, -11.5, 0.3, 4, 9);
    makeIceWallPanel(scene, 19, 2, -11.5, 0.3, 4, 9);

    // --- Generator room ---
    makeGeneratorRoom(scene, 15, 15);

    // --- Ice stalactites ---
    var stalPos = [
      [-12, 8, -12], [-8, 7.5, -18], [-18, 8, -8], [-15, 7.8, -22],
      [5, 7.6, -5], [0, 8, 5], [-5, 7.5, 0], [10, 7.8, 5],
      [15, 8, -5], [-20, 7.6, 5], [3, 7.9, -20], [20, 8, 10],
      [-10, 7.5, 10], [8, 8, -14], [-3, 7.7, 14]
    ];
    var s;
    for (s = 0; s < stalPos.length; s++) {
      makeStalactite(scene, stalPos[s][0], stalPos[s][1], stalPos[s][2]);
    }

    // --- Catwalks ---
    makeCatwalk(scene, -25, -5, 5, -5);
    makeCatwalk(scene, 0, 20, 5, 5);
    makeCatwalk(scene, -5, 10, 5, 15);

    // --- Enemies ---
    makeEnemy(scene, -13, -18);
    makeEnemy(scene, -17, -10);
    makeEnemy(scene, 12, -8);
    makeEnemy(scene, 16, 14);
    makeEnemy(scene, 5, 0);
    makeEnemy(scene, -5, 20);

    // --- Exfil marker ---
    makeExfilMarker(scene);

    // --- HUD ---
    buildHUD();
    updateHUD();

    // --- Key listener ---
    document.addEventListener('keydown', onKeyDown);

    // Start active
    activate();
  }

  function update(delta) {
    if (!sceneRef) return;
    elapsed += delta;

    // Fog intensifies over time (glacial cracking)
    if (sceneRef.fog) {
      var targetDensity = fogInitialDensity + (fogMaxDensity - fogInitialDensity) * Math.min(elapsed / 180, 1);
      sceneRef.fog.density = targetDensity;
    }

    // Pulse exfil marker
    if (exfilReady && exfilMarker) {
      exfilMarker.material.opacity = 0.5 + 0.2 * Math.sin(elapsed * 3);
    }

    // Process explosion events -> trigger nearby stalactite falls
    var ei, si, fi, en, ri;
    for (ei = 0; ei < pendingExplosions.length; ei++) {
      var exp = pendingExplosions[ei];
      for (si = 0; si < stalactites.length; si++) {
        var st = stalactites[si];
        var dx = st.position.x - exp.x;
        var dz = st.position.z - exp.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 12 && !stalactiteFalling[si]) {
          stalactiteFalling[si] = true;
        }
      }
    }
    pendingExplosions = [];

    // Animate falling stalactites
    for (fi = 0; fi < stalactites.length; fi++) {
      if (stalactiteFalling[fi]) {
        stalactites[fi].position.y -= delta * 4;
        // Remove below floor
        if (stalactites[fi].position.y < -2) {
          stalactites[fi].visible = false;
        }
      }
    }

    // Enemy patrol animation
    for (en = 0; en < enemies.length; en++) {
      var enemy = enemies[en];
      if (!enemy.userData.alive) continue;
      enemy.userData.patrolT += delta * 0.8;
      var t = enemy.userData.patrolT;
      enemy.position.x = enemy.userData.patrolOriginX + Math.sin(t) * enemy.userData.patrolRange;
      enemy.position.z = enemy.userData.patrolOriginZ + Math.cos(t * 0.7) * (enemy.userData.patrolRange * 0.5);
      enemy.rotation.y = Math.atan2(
        Math.cos(t) * enemy.userData.patrolRange,
        Math.cos(t * 0.7) * enemy.userData.patrolRange * 0.5 * (-1)
      );
    }

    // Glacial rumble warning
    if (elapsed > 120 && Math.floor(elapsed) % 30 === 0 && Math.floor((elapsed - delta)) % 30 !== 0) {
      showNotif('WARNING: GLACIER DESTABILIZING!', 2000);
      // Trigger random stalactite falls
      for (ri = 0; ri < stalactites.length; ri++) {
        if (!stalactiteFalling[ri] && Math.random() < 0.2) {
          stalactiteFalling[ri] = true;
        }
      }
    }
  }

  function reset() {
    // Remove all tracked objects from scene
    var i;
    if (sceneRef) {
      for (i = 0; i < trackedObjects.length; i++) {
        sceneRef.remove(trackedObjects[i]);
      }
      sceneRef.fog = null;
    }
    trackedObjects = [];
    stalactites = [];
    stalactiteFalling = [];
    stalactiteOrigY = [];
    enemies = [];
    missiles = [];
    pendingExplosions = [];
    exfilMarker = null;
    missilesDestroyed = 0;
    exfilReady = false;
    elapsed = 0;
    active = false;
    lastGTime = 0;

    // Remove HUD
    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }
    if (notifElement && notifElement.parentNode) {
      notifElement.parentNode.removeChild(notifElement);
      notifElement = null;
    }

    document.removeEventListener('keydown', onKeyDown);

    sceneRef = null;
    cameraRef = null;
  }

  return { init: init, update: update, reset: reset };
}());
