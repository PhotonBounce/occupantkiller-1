window.BallisticShieldOps = (function () {
  'use strict';

  // ── state ──────────────────────────────────────────────────────────────────
  var scene, camera, renderer;
  var active = false;           // B+S both pressed to equip
  var equipped = false;

  // Key tracking
  var keys = {};

  // Shield variants
  var VARIANTS = [
    {
      name: 'FULL BODY',
      w: 1.2, h: 2.2, d: 0.08,
      color: 0x4A4A4A,
      cover: 1.00,
      speedMult: 0.70,
      canShoot: false
    },
    {
      name: 'HALF BODY',
      w: 1.0, h: 1.4, d: 0.08,
      color: 0x556677,
      cover: 0.70,
      speedMult: 0.85,
      canShoot: true
    },
    {
      name: 'BALLISTIC DOOR',
      w: 1.8, h: 2.8, d: 0.12,
      color: 0x2A3A2A,
      cover: 1.10,
      speedMult: 0.50,
      canShoot: false,
      buddyCarry: true
    }
  ];
  var variantIdx = 0;

  // Shield mesh & HP
  var shieldMesh = null;
  var shieldHP = 300;
  var shieldMaxHP = 300;
  var crackLines = null;          // LineSegments for cracks
  var dentMarks = [];             // persistent BoxGeometry dents on shield face
  var shieldDebris = [];          // scatter pieces on break
  var shieldBroken = false;

  // Impact sparks
  var sparks = [];                // {meshes:[], t:0}

  // Shield bash / slam
  var bashCooldown = 0;
  var spaceHeld = 0;              // seconds space held
  var bashState = 'idle';         // 'idle' | 'bash' | 'slam'
  var bashTimer = 0;
  var playerVelocity = { x: 0, y: 0, z: 0 };

  // Breach team NPCs
  var buddyTeam = [];
  var breachState = 'idle';       // 'idle' | 'forming' | 'breaching'
  var breachTimer = 0;

  // Door target
  var doorMesh = null;
  var doorOpen = false;
  var doorHinge = null;           // pivot object

  // Room clearing
  var rooms = [];                 // {enemies:[], cleared:false, center:{x,z}}
  var roomsCleared = 0;

  // Smoke grenades
  var smokeList = [];             // {mesh:THREE.Mesh, timer:0}

  // Workbench
  var workbenchMesh = null;
  var repairing = false;
  var repairTimer = 0;

  // Smoke-toss cooldown
  var smokeCooldown = 0;

  // HUD element
  var hudEl = null;

  // Clock
  var clock = null;

  // ── helpers ────────────────────────────────────────────────────────────────
  function makeMaterial(color, opts) {
    var params = { color: color };
    if (opts) {
      if (opts.transparent !== undefined) params.transparent = opts.transparent;
      if (opts.opacity !== undefined) params.opacity = opts.opacity;
      if (opts.wireframe !== undefined) params.wireframe = opts.wireframe;
    }
    return new THREE.MeshLambertMaterial(params);
  }

  function makeBox(w, h, d, color, opts) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMaterial(color, opts);
    return new THREE.Mesh(geo, mat);
  }

  function vecDist(a, b) {
    var dx = a.x - b.x, dy = (a.y || 0) - (b.y || 0), dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // ── shield build ───────────────────────────────────────────────────────────
  function buildShield() {
    if (shieldMesh) {
      camera.remove(shieldMesh);
      scene.remove(shieldMesh);
    }
    if (crackLines) {
      if (shieldMesh) shieldMesh.remove(crackLines);
      crackLines = null;
    }
    dentMarks = [];

    var v = VARIANTS[variantIdx];
    shieldMesh = makeBox(v.w, v.h, v.d, v.color);
    shieldMesh.position.set(0, -0.3, -1.0);
    camera.add(shieldMesh);

    shieldBroken = false;
  }

  function destroyShield() {
    if (!shieldMesh) return;
    // scatter debris
    for (var i = 0; i < 8; i++) {
      var piece = makeBox(0.15 + Math.random() * 0.2, 0.15 + Math.random() * 0.2, 0.05, 0x4A4A4A);
      piece.position.copy(shieldMesh.getWorldPosition(new THREE.Vector3()));
      piece.position.x += (Math.random() - 0.5) * 1.5;
      piece.position.y += (Math.random() - 0.5) * 1.5;
      piece.position.z += (Math.random() - 0.5) * 1.5;
      piece._vel = {
        x: (Math.random() - 0.5) * 3,
        y: Math.random() * 3,
        z: (Math.random() - 0.5) * 3
      };
      piece._life = 2.0;
      scene.add(piece);
      shieldDebris.push(piece);
    }
    camera.remove(shieldMesh);
    shieldMesh = null;
    shieldBroken = true;
  }

  function addCracks() {
    if (!shieldMesh || crackLines) return;
    var v = VARIANTS[variantIdx];
    var hw = v.w / 2, hh = v.h / 2;
    var pts = [
      // diagonal X
      -hw, hh, 0,   hw, -hh, 0,
      -hw, -hh, 0,  hw, hh, 0
    ];
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    var mat = new THREE.LineBasicMaterial({ color: 0xFF2200 });
    crackLines = new THREE.LineSegments(geo, mat);
    crackLines.position.z = v.d / 2 + 0.001;
    shieldMesh.add(crackLines);
  }

  function removeCracks() {
    if (crackLines && shieldMesh) {
      shieldMesh.remove(crackLines);
      crackLines = null;
    }
  }

  // ── sparks on impact ───────────────────────────────────────────────────────
  function spawnSparks(hitWorldPos) {
    var group = [];
    for (var i = 0; i < 6; i++) {
      var s = makeBox(0.04, 0.04, 0.04, 0xFFDD00);
      s.position.copy(hitWorldPos);
      s._vel = {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4,
        z: (Math.random() - 0.5) * 4
      };
      s._life = 0.4 + Math.random() * 0.3;
      scene.add(s);
      group.push(s);
    }
    sparks.push({ meshes: group, t: 0 });
  }

  function addDentMark(hitWorldPos) {
    if (!shieldMesh) return;
    var v = VARIANTS[variantIdx];
    var dent = makeBox(0.08, 0.08, 0.02, 0x222222);
    // convert world pos to shield-local pos
    var localPos = shieldMesh.worldToLocal(hitWorldPos.clone());
    dent.position.set(localPos.x, localPos.y, v.d / 2 + 0.005);
    shieldMesh.add(dent);
    dentMarks.push(dent);
  }

  // ── buddy team ─────────────────────────────────────────────────────────────
  function spawnBuddyTeam() {
    clearBuddyTeam();
    for (var i = 0; i < 3; i++) {
      var geo = new THREE.CylinderGeometry(0.25, 0.25, 1.8, 8);
      var mat = new THREE.MeshLambertMaterial({ color: 0x111111 });
      var npc = new THREE.Mesh(geo, mat);
      npc._offset = (i - 1);   // -1, 0, +1 relative to player
      npc._breachAngle = 0;
      scene.add(npc);
      buddyTeam.push(npc);
    }
    breachState = 'forming';
  }

  function clearBuddyTeam() {
    for (var i = 0; i < buddyTeam.length; i++) {
      scene.remove(buddyTeam[i]);
    }
    buddyTeam = [];
    breachState = 'idle';
  }

  function updateBuddyTeam(dt) {
    if (buddyTeam.length === 0) return;
    var cp = camera.position;
    var cd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    var right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

    if (breachState === 'forming') {
      // line up behind player
      for (var i = 0; i < buddyTeam.length; i++) {
        var npc = buddyTeam[i];
        var target = cp.clone()
          .addScaledVector(cd, -(i + 1) * 1.2)   // behind
          .addScaledVector(right, npc._offset * 0.6);
        target.y = cp.y - 0.3;
        npc.position.lerp(target, dt * 4);
      }
    } else if (breachState === 'breaching') {
      breachTimer += dt;
      // fan out — each takes a different angle
      var angles = [-60, 0, 60];
      for (var j = 0; j < buddyTeam.length; j++) {
        var npcB = buddyTeam[j];
        var ang = (angles[j] * Math.PI) / 180;
        var dir = cd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
        var dest = cp.clone().addScaledVector(dir, 4 + breachTimer * 3);
        dest.y = cp.y - 0.3;
        npcB.position.lerp(dest, dt * 5);
      }
      if (breachTimer > 3) {
        breachState = 'idle';
      }
    }
  }

  // ── door breach ────────────────────────────────────────────────────────────
  function buildDoorTarget(position) {
    if (doorMesh) {
      scene.remove(doorMesh);
    }
    doorHinge = new THREE.Object3D();
    doorHinge.position.copy(position);
    scene.add(doorHinge);

    doorMesh = makeBox(1.0, 2.2, 0.08, 0x8B6914);
    // door pivot is on left edge: shift mesh right by half width
    doorMesh.position.set(0.5, 0, 0);
    doorHinge.add(doorMesh);
    doorOpen = false;
  }

  function kickDoor() {
    if (!doorHinge || doorOpen) return;
    doorOpen = true;
  }

  function updateDoor(dt) {
    if (!doorHinge || !doorOpen) return;
    // rotate door open around Y axis (hinge)
    var target = -Math.PI / 2;
    doorHinge.rotation.y = THREE.MathUtils.lerp(
      doorHinge.rotation.y, target, dt * 4
    );
  }

  // ── room clearing ──────────────────────────────────────────────────────────
  function registerRoom(center, enemies) {
    rooms.push({ center: center, enemies: enemies, cleared: false });
  }

  function updateRooms() {
    for (var i = 0; i < rooms.length; i++) {
      var room = rooms[i];
      if (room.cleared) continue;
      var allDown = true;
      for (var j = 0; j < room.enemies.length; j++) {
        if (room.enemies[j].parent) { allDown = false; break; }
      }
      if (allDown && room.enemies.length > 0) {
        room.cleared = true;
        roomsCleared++;
      }
    }
  }

  // ── smoke ──────────────────────────────────────────────────────────────────
  function throwSmoke() {
    if (smokeCooldown > 0) return;
    smokeCooldown = 5;
    var cd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    var throwPos = camera.position.clone().addScaledVector(cd, 4);
    throwPos.y = camera.position.y - 1;

    var geo = new THREE.SphereGeometry(6, 12, 8);
    var mat = new THREE.MeshLambertMaterial({
      color: 0xCCCCCC, transparent: true, opacity: 0.6
    });
    var smoke = new THREE.Mesh(geo, mat);
    smoke.position.copy(throwPos);
    scene.add(smoke);
    smokeList.push({ mesh: smoke, timer: 20 });
  }

  function updateSmoke(dt) {
    smokeCooldown = Math.max(0, smokeCooldown - dt);
    for (var i = smokeList.length - 1; i >= 0; i--) {
      var s = smokeList[i];
      s.timer -= dt;
      if (s.timer <= 3) {
        s.mesh.material.opacity = Math.max(0, (s.timer / 3) * 0.6);
      }
      if (s.timer <= 0) {
        scene.remove(s.mesh);
        smokeList.splice(i, 1);
      }
    }
  }

  // ── workbench ──────────────────────────────────────────────────────────────
  function buildWorkbench(position) {
    workbenchMesh = makeBox(1.0, 0.9, 0.5, 0x5C3A1E);
    workbenchMesh.position.copy(position);
    scene.add(workbenchMesh);
  }

  function tryRepair(dt) {
    if (!workbenchMesh || shieldHP >= shieldMaxHP) { repairing = false; repairTimer = 0; return; }
    var dist = vecDist(camera.position, workbenchMesh.position);
    if (dist < 2.5 && keys['r']) {
      repairing = true;
    } else {
      repairing = false;
      repairTimer = 0;
    }
    if (repairing) {
      repairTimer += dt;
      // 100 HP over 4s
      shieldHP = Math.min(shieldMaxHP, shieldHP + (100 / 4) * dt);
      if (shieldHP >= shieldMaxHP || repairTimer >= 4) {
        repairing = false;
        repairTimer = 0;
      }
    }
  }

  // ── bash / slam ────────────────────────────────────────────────────────────
  function tryBash(dt) {
    if (!equipped || shieldBroken) return;

    if (bashState !== 'idle') {
      bashTimer += dt;
      var cd2 = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

      if (bashState === 'bash') {
        // lunge 2 units forward over 0.2s
        var progress = Math.min(bashTimer / 0.2, 1);
        camera.position.addScaledVector(cd2, 2 * dt / 0.2 * dt);
        if (bashTimer >= 0.25) {
          bashState = 'idle';
          bashTimer = 0;
          bashCooldown = 1.5;
        }
      } else if (bashState === 'slam') {
        // charge 6 units forward over 0.6s
        camera.position.addScaledVector(cd2, 6 * dt / 0.6);
        if (bashTimer >= 0.6) {
          bashState = 'idle';
          bashTimer = 0;
          bashCooldown = 1.5;
        }
      }
      return;
    }

    bashCooldown = Math.max(0, bashCooldown - dt);

    if (keys[' ']) {
      spaceHeld += dt;
    } else {
      if (spaceHeld > 0 && bashCooldown <= 0) {
        if (spaceHeld >= 1.5) {
          // slam
          bashState = 'slam';
          bashTimer = 0;
        } else {
          // bash
          bashState = 'bash';
          bashTimer = 0;
        }
      }
      spaceHeld = 0;
    }
  }

  // ── sparks update ──────────────────────────────────────────────────────────
  function updateSparks(dt) {
    for (var i = sparks.length - 1; i >= 0; i--) {
      var grp = sparks[i];
      grp.t += dt;
      var alive = false;
      for (var j = 0; j < grp.meshes.length; j++) {
        var m = grp.meshes[j];
        if (grp.t < m._life) {
          m.position.x += m._vel.x * dt;
          m.position.y += m._vel.y * dt - 4 * dt * dt;
          m.position.z += m._vel.z * dt;
          m.material.opacity = 1 - grp.t / m._life;
          m.material.transparent = true;
          alive = true;
        } else {
          scene.remove(m);
        }
      }
      if (!alive) sparks.splice(i, 1);
    }
  }

  // ── debris update ──────────────────────────────────────────────────────────
  function updateDebris(dt) {
    for (var i = shieldDebris.length - 1; i >= 0; i--) {
      var p = shieldDebris[i];
      p._life -= dt;
      p.position.x += p._vel.x * dt;
      p.position.y += p._vel.y * dt;
      p.position.z += p._vel.z * dt;
      p._vel.y -= 9.8 * dt;
      p.material.opacity = Math.max(0, p._life / 2.0);
      p.material.transparent = true;
      if (p._life <= 0) {
        scene.remove(p);
        shieldDebris.splice(i, 1);
      }
    }
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'bso-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'left:20px',
      'font-family:monospace',
      'font-size:13px',
      'color:#00FF88',
      'background:rgba(0,0,0,0.55)',
      'padding:8px 14px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:pre'
    ].join(';');
    document.body.appendChild(hudEl);
  }

  function updateHUD() {
    if (!hudEl) return;
    if (!equipped) {
      hudEl.textContent = '[BSO] Press B+S to equip shield';
      return;
    }
    var v = VARIANTS[variantIdx];
    var bashStatus = bashCooldown > 0
      ? ('BASH: ' + bashCooldown.toFixed(1) + 's')
      : 'BASH: READY';
    var slamHint = spaceHeld >= 1.5 ? ' [SLAM CHARGING]' : '';
    hudEl.textContent =
      'SHIELD [' + v.name + ']' +
      ' [HP: ' + Math.ceil(shieldHP) + '/' + shieldMaxHP + ']' +
      ' [' + bashStatus + ']' +
      ' [ROOMS: ' + roomsCleared + ' CLEARED]' +
      slamHint;
  }

  // ── key handlers ───────────────────────────────────────────────────────────
  function onKeyDown(e) {
    keys[e.key.toLowerCase()] = true;
    // Also track raw key for space
    keys[e.key] = true;

    // Equip: B + S
    if (keys['b'] && keys['s']) {
      if (!equipped) {
        equipped = true;
        shieldHP = shieldMaxHP;
        buildShield();
      }
    }

    // Cycle variant with Tab
    if (e.key === 'Tab' && equipped) {
      e.preventDefault();
      variantIdx = (variantIdx + 1) % VARIANTS.length;
      buildShield();
    }

    // Breach formation: F
    if (e.key === 'f' || e.key === 'F') {
      if (equipped) {
        if (breachState === 'idle') spawnBuddyTeam();
        else clearBuddyTeam();
      }
    }

    // Execute breach: Enter
    if (e.key === 'Enter') {
      if (breachState === 'forming') {
        breachState = 'breaching';
        breachTimer = 0;
      }
    }

    // Door breach: E
    if (e.key === 'e' || e.key === 'E') {
      if (doorHinge && !doorOpen && doorMesh) {
        var doorWorldPos = new THREE.Vector3();
        doorHinge.getWorldPosition(doorWorldPos);
        if (vecDist(camera.position, doorWorldPos) < 1.5) {
          kickDoor();
          if (breachState === 'forming') {
            breachState = 'breaching';
            breachTimer = 0;
          }
        }
      }
    }

    // Smoke grenade: G
    if (e.key === 'g' || e.key === 'G') {
      if (equipped) throwSmoke();
    }
  }

  function onKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
    keys[e.key] = false;
  }

  // ── public API ─────────────────────────────────────────────────────────────
  function init(opts) {
    if (!opts || !opts.scene || !opts.camera) {
      console.error('[BallisticShieldOps] init requires {scene, camera}');
      return;
    }
    scene = opts.scene;
    camera = opts.camera;
    renderer = opts.renderer || null;

    clock = new THREE.Clock();

    // Build HUD
    buildHUD();

    // Demo geometry: a workbench and a door target for testing
    buildWorkbench(new THREE.Vector3(5, 0, -5));
    buildDoorTarget(new THREE.Vector3(-3, 1.1, -6));

    // Register a sample room (empty — real game would pass enemy meshes)
    registerRoom({ x: 0, z: -10 }, []);

    // Keyboard listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    console.log('[BallisticShieldOps] initialised — press B+S to equip shield');
    active = true;
  }

  function update() {
    if (!active) return;
    var dt = clock ? clock.getDelta() : 0.016;
    dt = Math.min(dt, 0.05); // clamp

    // --- shield HP thresholds ---
    if (equipped && !shieldBroken) {
      if (shieldHP <= 150 && !crackLines) {
        addCracks();
      } else if (shieldHP > 150 && crackLines) {
        removeCracks();
      }
      if (shieldHP <= 0) {
        destroyShield();
        equipped = false;
      }
    }

    // --- bash / slam ---
    tryBash(dt);

    // --- buddy team ---
    updateBuddyTeam(dt);

    // --- door ---
    updateDoor(dt);

    // --- room clearing ---
    updateRooms();

    // --- repair ---
    tryRepair(dt);

    // --- smoke ---
    updateSmoke(dt);

    // --- sparks ---
    updateSparks(dt);

    // --- debris ---
    updateDebris(dt);

    // --- HUD ---
    updateHUD();
  }

  function reset() {
    equipped = false;
    shieldBroken = false;
    shieldHP = shieldMaxHP;
    variantIdx = 0;
    bashCooldown = 0;
    spaceHeld = 0;
    bashState = 'idle';
    bashTimer = 0;
    breachTimer = 0;
    roomsCleared = 0;
    smokeCooldown = 0;
    repairing = false;
    repairTimer = 0;
    keys = {};

    if (shieldMesh) {
      camera.remove(shieldMesh);
      shieldMesh = null;
    }
    crackLines = null;
    dentMarks = [];

    for (var i = 0; i < shieldDebris.length; i++) scene.remove(shieldDebris[i]);
    shieldDebris = [];

    for (var j = 0; j < sparks.length; j++) {
      for (var k = 0; k < sparks[j].meshes.length; k++) scene.remove(sparks[j].meshes[k]);
    }
    sparks = [];

    clearBuddyTeam();

    for (var s = 0; s < smokeList.length; s++) scene.remove(smokeList[s].mesh);
    smokeList = [];

    rooms = [];
    registerRoom({ x: 0, z: -10 }, []);

    if (hudEl) hudEl.textContent = '[BSO] Press B+S to equip shield';

    console.log('[BallisticShieldOps] reset');
  }

  // ── public method: simulate bullet hit on shield ───────────────────────────
  // Call this from your bullet system: BallisticShieldOps.onBulletHit(worldPos, damage)
  function onBulletHit(worldPos, damage) {
    if (!equipped || shieldBroken || !shieldMesh) return false;
    var v = VARIANTS[variantIdx];
    // probability of block based on cover
    var blocked = Math.random() < v.cover;
    if (blocked) {
      var hitPos = worldPos
        ? new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z)
        : shieldMesh.getWorldPosition(new THREE.Vector3());
      spawnSparks(hitPos);
      addDentMark(hitPos);
      shieldHP = Math.max(0, shieldHP - (damage || 10));
    }
    return blocked;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    onBulletHit: onBulletHit
  };
})();
