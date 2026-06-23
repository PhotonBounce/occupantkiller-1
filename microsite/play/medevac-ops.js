window.MedevacOps = (function() {
  'use strict';

  var scene, camera, renderer, clock;
  var active = false;
  var helicopter, rotorTop, rotorTail;
  var helHP = 500;
  var helSpeed = 0.18;
  var casualties = [];
  var aboard = [];
  var projectiles = [];
  var enemies = [];
  var smokeParticles = [];
  var medics = [];
  var score = 0;
  var hoistState = 'idle'; // idle, lowering, attached, retracting
  var hoistCable = null;
  var hoistTarget = null;
  var hoistTimer = 0;
  var hoistCut = false;
  var fieldHospital = null;
  var triageTent = null;
  var hudDiv = null;
  var keys = {};
  var keyTimestamps = {};
  var audioCtx = null;
  var searchLight = null;
  var bellyLight = null;
  var enemyFireTimer = 0;
  var gameOver = false;
  var rootGroup = null;

  // Direction helpers
  var DIRS = { N: [0,0,-1], NE:[1,0,-1], E:[1,0,0], SE:[1,0,1], S:[0,0,1], SW:[-1,0,1], W:[-1,0,0], NW:[-1,0,-1] };

  function bearing(from, to) {
    var dx = to.x - from.x;
    var dz = to.z - from.z;
    var angle = Math.atan2(dx, -dz) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    var dirs = ['N','NE','E','SE','S','SW','W','NW'];
    var idx = Math.round(angle / 45) % 8;
    return dirs[idx];
  }

  function dist2D(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx*dx + dz*dz);
  }

  function makeHUD() {
    hudDiv = document.createElement('div');
    hudDiv.id = 'medevac-hud';
    hudDiv.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:#00FF88;font-family:monospace;font-size:14px;padding:6px 14px;border-radius:4px;z-index:9999;pointer-events:none;white-space:nowrap;';
    document.body.appendChild(hudDiv);
  }

  function updateHUD() {
    if (!hudDiv || !active) return;
    var nearestDist = Infinity;
    var nearestDir = 'N';
    for (var i = 0; i < casualties.length; i++) {
      var c = casualties[i];
      if (!c.rescued && !c.aboard) {
        var d = dist2D(helicopter.position, c.mesh.position);
        if (d < nearestDist) {
          nearestDist = d;
          nearestDir = bearing(helicopter.position, c.mesh.position);
        }
      }
    }
    var survivingCount = 0;
    for (var j = 0; j < casualties.length; j++) {
      if (!casualties[j].rescued) survivingCount++;
    }
    var nextStr = nearestDist < Infinity ? (Math.round(nearestDist) + 'm ' + nearestDir) : 'ALL CLEAR';
    hudDiv.textContent = 'MEDEVAC [ABOARD: ' + aboard.length + '/4] [CASUALTIES: ' + survivingCount + '/5] [HP: ' + Math.max(0, Math.round(helHP)) + '] [ALTITUDE: ' + Math.round(helicopter.position.y) + 'm] | NEXT WOUNDED: ' + nextStr;
  }

  function removeHUD() {
    if (hudDiv) { hudDiv.remove(); hudDiv = null; }
  }

  function buildHelicopter() {
    var group = new THREE.Group();

    // Fuselage
    var fuseGeo = new THREE.BoxGeometry(6, 2, 3);
    var fuseMat = new THREE.MeshPhongMaterial({ color: 0x228822 });
    var fuse = new THREE.Mesh(fuseGeo, fuseMat);
    group.add(fuse);

    // Red cross marker (PointLight from belly)
    bellyLight = new THREE.PointLight(0xFF0000, 2, 8);
    bellyLight.position.set(0, -1.2, 0);
    group.add(bellyLight);

    // Main rotor
    var rotorGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 8);
    var rotorMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    rotorTop = new THREE.Group();
    var rotorHub = new THREE.Mesh(rotorGeo, rotorMat);
    rotorTop.add(rotorHub);
    var bladeGeo = new THREE.BoxGeometry(5, 0.08, 0.35);
    var bladeMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    var blade1 = new THREE.Mesh(bladeGeo, bladeMat);
    var blade2 = new THREE.Mesh(bladeGeo, bladeMat);
    blade2.rotation.y = Math.PI / 2;
    rotorTop.add(blade1);
    rotorTop.add(blade2);
    rotorTop.position.set(0, 1.2, 0);
    group.add(rotorTop);

    // Tail rotor
    rotorTail = new THREE.Group();
    var tailBladeGeo = new THREE.BoxGeometry(1.5, 0.08, 0.25);
    var tBlade1 = new THREE.Mesh(tailBladeGeo, bladeMat);
    var tBlade2 = new THREE.Mesh(tailBladeGeo, bladeMat);
    tBlade2.rotation.z = Math.PI / 2;
    rotorTail.add(tBlade1);
    rotorTail.add(tBlade2);
    rotorTail.position.set(-3.2, 0.5, 0);
    rotorTail.rotation.y = Math.PI / 2;
    group.add(rotorTail);

    // Searchlight
    searchLight = new THREE.PointLight(0xFFFFDD, 3, 25);
    searchLight.position.set(0, -0.5, -2.5);
    group.add(searchLight);

    group.position.set(0, 18, 0);
    return group;
  }

  function buildCasualty(x, z, isDark) {
    var group = new THREE.Group();
    var bodyGeo = new THREE.SphereGeometry(0.8, 8, 8);
    var bodyMat = new THREE.MeshPhongMaterial({ color: 0x445544 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.scale.set(1, 0.5, 1.4);
    body.rotation.x = -Math.PI / 2;
    group.add(body);

    // Smoke beacon particles
    var smokes = [];
    for (var i = 0; i < 8; i++) {
      var sg = new THREE.SphereGeometry(0.18, 5, 5);
      var sm = new THREE.MeshBasicMaterial({ color: 0xFFFF00, transparent: true, opacity: 0.7 });
      var sp = new THREE.Mesh(sg, sm);
      sp.position.set(
        (Math.random() - 0.5) * 0.5,
        i * 0.6 + 1,
        (Math.random() - 0.5) * 0.5
      );
      sp.userData.baseY = sp.position.y;
      sp.userData.riseOffset = Math.random() * Math.PI * 2;
      group.add(sp);
      smokes.push(sp);
    }

    group.position.set(x, 0.4, z);

    var obj = {
      mesh: group,
      hp: 100,
      isDark: isDark,
      smokes: smokes,
      rescued: false,
      aboard: false,
      delivered: false,
      smokeTimer: 0
    };

    return obj;
  }

  function buildEnemy(x, z) {
    var group = new THREE.Group();
    var bodyGeo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    var bodyMat = new THREE.MeshPhongMaterial({ color: 0x664422 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.9;
    group.add(body);
    var headGeo = new THREE.SphereGeometry(0.35, 6, 6);
    var head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = 1.9;
    group.add(head);
    group.position.set(x, 0, z);
    return { mesh: group, fireTimer: Math.random() * 3 };
  }

  function buildFieldHospital() {
    var geo = new THREE.BoxGeometry(12, 6, 8);
    var mat = new THREE.MeshPhongMaterial({ color: 0x3399FF });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(60, 3, 60);
    return mesh;
  }

  function buildMedic(index) {
    var group = new THREE.Group();
    var bodyGeo = new THREE.BoxGeometry(0.7, 1.6, 0.7);
    var bodyMat = new THREE.MeshPhongMaterial({ color: 0xBBBBBB });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.8;
    group.add(body);
    group.position.set(58 + index * 2, 0, 58);
    return { mesh: group, target: null, state: 'idle' };
  }

  function buildTriageTent() {
    var geo = new THREE.BoxGeometry(8, 4, 6);
    var mat = new THREE.MeshPhongMaterial({ color: 0x228B22, transparent: true, opacity: 0.85 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(65, 2, 70);
    return mesh;
  }

  function fireRPG(enemy) {
    var geo = new THREE.SphereGeometry(0.22, 6, 6);
    var mat = new THREE.MeshPhongMaterial({ color: 0x884400 });
    var proj = new THREE.Mesh(geo, mat);
    proj.position.copy(enemy.mesh.position);
    proj.position.y += 1.5;

    var dir = new THREE.Vector3();
    dir.subVectors(helicopter.position, proj.position).normalize();
    dir.multiplyScalar(0.45 + Math.random() * 0.15);

    // Add trail
    var trailGeo = new THREE.SphereGeometry(0.1, 4, 4);
    var trailMat = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.6 });
    var trail = new THREE.Mesh(trailGeo, trailMat);
    scene.add(trail);

    scene.add(proj);
    projectiles.push({ mesh: proj, vel: dir, life: 120, trail: trail });
  }

  function spawnSmokeTrail(pos) {
    var geo = new THREE.SphereGeometry(0.25, 5, 5);
    var mat = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.6 });
    var sp = new THREE.Mesh(geo, mat);
    sp.position.copy(pos);
    sp.position.y -= 0.5;
    scene.add(sp);
    smokeParticles.push({ mesh: sp, life: 60 });
  }

  function playRadio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return; }
    }
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    var t = audioCtx.currentTime;
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.5);
    osc.frequency.linearRampToValueAtTime(900, t + 1.0);
    osc.frequency.linearRampToValueAtTime(1100, t + 1.5);
    osc.frequency.linearRampToValueAtTime(850, t + 2.0);
    osc.frequency.linearRampToValueAtTime(1200, t + 2.5);
    osc.frequency.linearRampToValueAtTime(800, t + 3.0);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0, t + 3.0);
    osc.start(t);
    osc.stop(t + 3.0);
  }

  function onKeyDown(e) {
    if (!active) return;
    keys[e.code] = true;
    keyTimestamps[e.code] = Date.now();

    // Activation check (already active, ignore)
    // R = radio
    if (e.code === 'KeyR') {
      playRadio();
    }
    // E = hoist / unload
    if (e.code === 'KeyE') {
      handleEAction();
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  function handleEAction() {
    // Unload at field hospital
    if (aboard.length > 0) {
      var distHosp = dist2D(helicopter.position, fieldHospital.position);
      if (distHosp < 14 && helicopter.position.y < 10) {
        unloadAtHospital();
        return;
      }
    }
    // Start hoist if idle
    if (hoistState === 'idle') {
      // Find nearest casualty
      var nearestDist = Infinity;
      var nearest = null;
      for (var i = 0; i < casualties.length; i++) {
        var c = casualties[i];
        if (!c.rescued && !c.aboard) {
          var d = dist2D(helicopter.position, c.mesh.position);
          if (d < 6 && helicopter.position.y < 14 && d < nearestDist) {
            nearestDist = d;
            nearest = c;
          }
        }
      }
      if (nearest && aboard.length < 4) {
        hoistTarget = nearest;
        hoistState = 'lowering';
        hoistTimer = 0;
        hoistCut = false;
        buildHoistCable();
      }
    }
  }

  function buildHoistCable() {
    if (hoistCable) { scene.remove(hoistCable); hoistCable = null; }
    var geo = new THREE.CylinderGeometry(0.06, 0.06, 0.1, 6);
    var mat = new THREE.MeshPhongMaterial({ color: 0xCCCC00 });
    hoistCable = new THREE.Mesh(geo, mat);
    hoistCable.position.copy(helicopter.position);
    hoistCable.position.y -= 1;
    scene.add(hoistCable);
  }

  function unloadAtHospital() {
    score += aboard.length * 50;
    for (var i = 0; i < aboard.length; i++) {
      var c = aboard[i];
      c.delivered = true;
      c.mesh.position.set(60 + i * 1.5, 0.4, 55);
      c.mesh.visible = true;
      scene.add(c.mesh);
      // Assign medic
      for (var m = 0; m < medics.length; m++) {
        if (medics[m].state === 'idle') {
          medics[m].target = c;
          medics[m].state = 'running';
          break;
        }
      }
    }
    aboard = [];
  }

  function init(s, c, r) {
    scene = s;
    camera = c;
    renderer = r;
    clock = new THREE.Clock();
    active = false;
    gameOver = false;
    score = 0;
    helHP = 500;
    aboard = [];
    casualties = [];
    projectiles = [];
    smokeParticles = [];
    hoistState = 'idle';
    hoistCable = null;
    hoistTarget = null;
    hoistCut = false;

    document.addEventListener('keydown', onKeyDownGlobal);
    document.addEventListener('keyup', onKeyUp);
  }

  function onKeyDownGlobal(e) {
    keys[e.code] = true;
    keyTimestamps[e.code] = Date.now();

    // Check M+E activation within 400ms
    if (!active && (e.code === 'KeyM' || e.code === 'KeyE')) {
      var tM = keyTimestamps['KeyM'] || 0;
      var tE = keyTimestamps['KeyE'] || 0;
      if (tM && tE && Math.abs(tM - tE) <= 400) {
        activate();
      }
    }

    if (!active) return;
    if (e.code === 'KeyR') { playRadio(); }
    if (e.code === 'KeyE') { handleEAction(); }
  }

  function activate() {
    if (active) return;
    active = true;

    rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Build helicopter
    helicopter = buildHelicopter();
    scene.add(helicopter);

    // Build casualties
    var positions = [
      [-30, -20], [25, -35], [-10, 30], [40, 10], [-45, 40]
    ];
    for (var i = 0; i < 5; i++) {
      var isDark = Math.random() < 0.5;
      var cas = buildCasualty(positions[i][0], positions[i][1], isDark);
      if (isDark) {
        // Darken area — point of very low ambient
        var darkLight = new THREE.PointLight(0x000033, 0.5, 20);
        darkLight.position.set(positions[i][0], 5, positions[i][1]);
        scene.add(darkLight);
      }
      scene.add(cas.mesh);
      casualties.push(cas);
    }

    // Build enemies
    var enemyPositions = [[-20, -50], [50, -30], [0, -60]];
    for (var j = 0; j < 3; j++) {
      var en = buildEnemy(enemyPositions[j][0], enemyPositions[j][1]);
      scene.add(en.mesh);
      enemies.push(en);
    }

    // Field hospital
    fieldHospital = buildFieldHospital();
    scene.add(fieldHospital);

    // Triage tent
    triageTent = buildTriageTent();
    scene.add(triageTent);

    // Medics
    for (var k = 0; k < 2; k++) {
      var med = buildMedic(k);
      scene.add(med.mesh);
      medics.push(med);
    }

    makeHUD();
  }

  function update(dt) {
    if (!active || gameOver) return;
    if (!dt) dt = 0.016;

    var elapsed = dt;

    // Rotor spin
    if (rotorTop) rotorTop.rotation.y += 0.25;
    if (rotorTail) rotorTail.rotation.x += 0.35;

    // Helicopter movement
    var spd = helSpeed;
    if (keys['KeyW']) { helicopter.position.z -= spd * 60 * dt; }
    if (keys['KeyS']) { helicopter.position.z += spd * 60 * dt; }
    if (keys['KeyA']) { helicopter.position.x -= spd * 60 * dt; }
    if (keys['KeyD']) { helicopter.position.x += spd * 60 * dt; }
    if (keys['KeyQ']) { helicopter.position.y += spd * 40 * dt; }
    if (keys['KeyE'] && hoistState === 'idle') { helicopter.position.y -= spd * 40 * dt; }

    // Altitude floor
    if (helicopter.position.y < 1) helicopter.position.y = 1;

    // Autorotation if HP < 100
    if (helHP < 100 && helicopter.position.y > 1) {
      helicopter.position.y -= 0.02;
    }

    // Smoke trail when damaged
    if (helHP < 400 && Math.random() < 0.15) {
      spawnSmokeTrail(helicopter.position);
    }

    // Casualty bleed
    for (var i = 0; i < casualties.length; i++) {
      var c = casualties[i];
      if (!c.rescued && !c.aboard && !c.delivered) {
        c.hp -= 5 * dt;
        if (c.hp < 0) c.hp = 0;
      }
      // Smoke animation
      for (var s = 0; s < c.smokes.length; s++) {
        var sp = c.smokes[s];
        sp.userData.riseOffset += dt * 0.5;
        sp.position.y = sp.userData.baseY + Math.sin(sp.userData.riseOffset) * 0.3 + elapsed * 0.5;
        if (sp.position.y > 8) sp.position.y = 1;
        sp.material.opacity = 0.4 + Math.random() * 0.3;
        if (c.rescued || c.aboard || c.delivered) {
          sp.visible = false;
        }
      }
    }

    // Enemy AI & RPG fire
    enemyFireTimer += dt;
    for (var j = 0; j < enemies.length; j++) {
      var en = enemies[j];
      en.fireTimer -= dt;
      if (en.fireTimer <= 0) {
        en.fireTimer = 3 + Math.random() * 2;
        fireRPG(en);
      }
      // Face helicopter
      var dxE = helicopter.position.x - en.mesh.position.x;
      var dzE = helicopter.position.z - en.mesh.position.z;
      en.mesh.rotation.y = Math.atan2(dxE, dzE);
    }

    // Projectiles
    for (var p = projectiles.length - 1; p >= 0; p--) {
      var proj = projectiles[p];
      proj.mesh.position.add(proj.vel);
      if (proj.trail) {
        proj.trail.position.copy(proj.mesh.position);
        proj.trail.position.sub(proj.vel.clone().multiplyScalar(2));
      }
      proj.life--;

      // Hit check
      var distProj = proj.mesh.position.distanceTo(helicopter.position);
      if (distProj < 3.5) {
        var dmg = 25 + Math.random() * 20;
        helHP -= dmg;
        // If hoisting, sever cable
        if (hoistState === 'lowering' || hoistState === 'attached') {
          severHoist();
        }
        scene.remove(proj.mesh);
        if (proj.trail) scene.remove(proj.trail);
        projectiles.splice(p, 1);
        continue;
      }
      if (proj.life <= 0) {
        scene.remove(proj.mesh);
        if (proj.trail) scene.remove(proj.trail);
        projectiles.splice(p, 1);
      }
    }

    // Hoist logic
    updateHoist(dt);

    // Smoke particles fade
    for (var sm = smokeParticles.length - 1; sm >= 0; sm--) {
      var smk = smokeParticles[sm];
      smk.mesh.position.y += 0.04;
      smk.life--;
      smk.mesh.material.opacity = smk.life / 60 * 0.6;
      if (smk.life <= 0) {
        scene.remove(smk.mesh);
        smokeParticles.splice(sm, 1);
      }
    }

    // Medics
    for (var m = 0; m < medics.length; m++) {
      var med = medics[m];
      if (med.state === 'running' && med.target) {
        var tPos = med.target.mesh.position;
        var mPos = med.mesh.position;
        var mdx = tPos.x - mPos.x;
        var mdz = tPos.z - mPos.z;
        var mDist = Math.sqrt(mdx*mdx + mdz*mdz);
        if (mDist > 0.5) {
          mPos.x += (mdx/mDist) * 0.08;
          mPos.z += (mdz/mDist) * 0.08;
        } else {
          med.state = 'treating';
        }
      }
    }

    // Score tallying
    for (var sc = 0; sc < casualties.length; sc++) {
      var cas = casualties[sc];
      if (cas.delivered && !cas._scored) {
        cas._scored = true;
        if (cas.hp > 0) {
          score += 300;
        } else {
          score += 100;
        }
      }
    }

    // Camera follow helicopter
    if (camera) {
      camera.position.x = helicopter.position.x;
      camera.position.y = helicopter.position.y + 12;
      camera.position.z = helicopter.position.z + 20;
      camera.lookAt(helicopter.position);
    }

    // HP clamp
    if (helHP <= 0) {
      helHP = 0;
      gameOver = true;
    }

    updateHUD();
  }

  function updateHoist(dt) {
    if (hoistState === 'idle' || !hoistCable || !hoistTarget) return;

    if (hoistState === 'lowering') {
      hoistTimer += dt;
      var progress = Math.min(hoistTimer / 3, 1);
      var cableLen = progress * (helicopter.position.y - hoistTarget.mesh.position.y);
      hoistCable.scale.y = Math.max(0.1, cableLen);
      hoistCable.position.copy(helicopter.position);
      hoistCable.position.y -= cableLen / 2;

      if (hoistCut) {
        // Cable severs: spin it
        hoistCable.rotation.z += 0.3;
        hoistState = 'idle';
        hoistCable.rotation.z = 0;
        scene.remove(hoistCable);
        hoistCable = null;
        hoistTarget = null;
        hoistTimer = 0;
        return;
      }

      if (progress >= 1) {
        // Auto-attach
        hoistTarget.aboard = true;
        hoistTarget.mesh.visible = false;
        hoistState = 'retracting';
        hoistTimer = 0;
      }
    } else if (hoistState === 'retracting') {
      hoistTimer += dt;
      var retProgress = Math.min(hoistTimer / 3, 1);
      var remLen = (1 - retProgress) * helicopter.position.y;
      hoistCable.scale.y = Math.max(0.1, remLen);
      hoistCable.position.copy(helicopter.position);
      hoistCable.position.y -= remLen / 2;

      if (retProgress >= 1) {
        // Casualty is aboard
        aboard.push(hoistTarget);
        hoistTarget.aboard = true;
        hoistTarget.rescued = true;
        scene.remove(hoistCable);
        hoistCable = null;
        hoistTarget = null;
        hoistTimer = 0;
        hoistState = 'idle';
      }
    }
  }

  function severHoist() {
    hoistCut = true;
    if (hoistTarget) {
      hoistTarget.aboard = false;
      hoistTarget = null;
    }
    hoistTimer = 0;
    hoistState = 'idle';
    if (hoistCable) {
      hoistCable.rotation.z = Math.PI / 4;
      scene.remove(hoistCable);
      hoistCable = null;
    }
  }

  function reset() {
    active = false;
    gameOver = false;

    // Remove helicopter
    if (helicopter) { scene.remove(helicopter); helicopter = null; }
    if (hoistCable) { scene.remove(hoistCable); hoistCable = null; }
    if (fieldHospital) { scene.remove(fieldHospital); fieldHospital = null; }
    if (triageTent) { scene.remove(triageTent); triageTent = null; }
    if (rootGroup) { scene.remove(rootGroup); rootGroup = null; }

    for (var i = 0; i < casualties.length; i++) { scene.remove(casualties[i].mesh); }
    casualties = [];
    aboard = [];

    for (var j = 0; j < enemies.length; j++) { scene.remove(enemies[j].mesh); }
    enemies = [];

    for (var p = 0; p < projectiles.length; p++) {
      scene.remove(projectiles[p].mesh);
      if (projectiles[p].trail) scene.remove(projectiles[p].trail);
    }
    projectiles = [];

    for (var s = 0; s < smokeParticles.length; s++) { scene.remove(smokeParticles[s].mesh); }
    smokeParticles = [];

    for (var m = 0; m < medics.length; m++) { scene.remove(medics[m].mesh); }
    medics = [];

    keys = {};
    keyTimestamps = {};
    score = 0;
    helHP = 500;
    hoistState = 'idle';
    hoistTarget = null;
    hoistCut = false;

    removeHUD();

    document.removeEventListener('keydown', onKeyDownGlobal);
    document.removeEventListener('keyup', onKeyUp);
  }

  return { init: init, update: update, reset: reset };
})();
