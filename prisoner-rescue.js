window.PrisonerRescue = (function () {
  'use strict';

  var scene = null;
  var camera = null;
  var campX = 0;
  var campZ = 0;

  // Game state
  var guards = [];
  var prisoners = [];
  var fenceSections = [];
  var guardTowers = [];
  var reinforcements = [];
  var ladderColliders = [];
  var extractionZone = null;
  var extractionMarker = null;
  var campGroup = null;

  var allGuardsEliminated = false;
  var rescueComplete = false;
  var reinforcementsSpawned = false;
  var missionTimer = 0;
  var score = 0;

  var alertLevel = 0; // 0=calm, 1=alert
  var playerRef = null; // set via init or update caller

  var hudContainer = null;
  var prisonerIcons = [];
  var toastEl = null;
  var toastTimer = 0;

  var keys = {};
  var eKeyJustPressed = false;
  var prevEKey = false;

  // ─── helpers ───────────────────────────────────────────────────────────────

  function makeMaterial(color, opts) {
    var params = { color: color };
    if (opts) {
      for (var k in opts) params[k] = opts[k];
    }
    return new THREE.MeshLambertMaterial(params);
  }

  function makeMesh(geo, mat) {
    var m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function dist2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function vecDist(a, b) {
    return dist2D(a.x, a.z, b.x, b.z);
  }

  function showToast(msg, duration) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.style.opacity = '1';
    toastTimer = duration || 3;
  }

  // ─── HUD ───────────────────────────────────────────────────────────────────

  function buildHUD() {
    hudContainer = document.createElement('div');
    hudContainer.id = 'pr-hud';
    hudContainer.style.cssText =
      'position:fixed;bottom:60px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:200;pointer-events:none;';
    document.body.appendChild(hudContainer);

    for (var i = 0; i < 3; i++) {
      var icon = document.createElement('div');
      icon.style.cssText =
        'width:28px;height:40px;border:2px solid #fff;border-radius:4px;background:#555;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;color:#fff;';
      icon.title = 'Prisoner ' + (i + 1);
      var head = document.createElement('div');
      head.style.cssText = 'width:10px;height:10px;border-radius:50%;background:#888;margin-bottom:2px;';
      var body = document.createElement('div');
      body.style.cssText = 'width:8px;height:16px;background:#888;border-radius:2px;';
      icon.appendChild(head);
      icon.appendChild(body);
      hudContainer.appendChild(icon);
      prisonerIcons.push({ el: icon, head: head, body: body });
    }

    toastEl = document.createElement('div');
    toastEl.style.cssText =
      'position:fixed;top:30%;left:50%;transform:translateX(-50%);font-size:28px;font-weight:bold;color:#FFD700;text-shadow:0 0 8px #000;opacity:0;transition:opacity 0.5s;z-index:300;pointer-events:none;';
    document.body.appendChild(toastEl);
  }

  function updateHUD() {
    for (var i = 0; i < prisoners.length; i++) {
      var p = prisoners[i];
      var icon = prisonerIcons[i];
      if (!icon) continue;
      if (p.dead) {
        icon.head.style.background = '#300';
        icon.body.style.background = '#300';
        icon.el.style.borderColor = '#f00';
      } else if (p.safe) {
        icon.head.style.background = '#0f0';
        icon.body.style.background = '#0f0';
        icon.el.style.borderColor = '#0f0';
      } else if (p.freed) {
        icon.head.style.background = '#ff8c00';
        icon.body.style.background = '#ff8c00';
        icon.el.style.borderColor = '#ff8c00';
      } else {
        icon.head.style.background = '#888';
        icon.body.style.background = '#888';
        icon.el.style.borderColor = '#fff';
      }
    }
  }

  function removeHUD() {
    if (hudContainer && hudContainer.parentNode) {
      hudContainer.parentNode.removeChild(hudContainer);
    }
    if (toastEl && toastEl.parentNode) {
      toastEl.parentNode.removeChild(toastEl);
    }
    hudContainer = null;
    toastEl = null;
    prisonerIcons = [];
  }

  // ─── FENCE SECTIONS ────────────────────────────────────────────────────────

  function buildFenceSection(x1, z1, x2, z2) {
    var group = new THREE.Group();
    var dx = x2 - x1;
    var dz = z2 - z1;
    var length = Math.sqrt(dx * dx + dz * dz);
    var angle = Math.atan2(dx, dz);

    // Chain-link plane
    var fenceGeo = new THREE.PlaneGeometry(length, 2.5);
    var fenceMat = makeMaterial(0x888888, { transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    var fenceMesh = makeMesh(fenceGeo, fenceMat);
    fenceMesh.rotation.y = angle;
    fenceMesh.position.set((x1 + x2) / 2, 1.25, (z1 + z2) / 2);
    group.add(fenceMesh);

    // Poles every 3 units
    var numPoles = Math.floor(length / 3) + 1;
    for (var i = 0; i < numPoles; i++) {
      var t = i / Math.max(numPoles - 1, 1);
      var px = x1 + dx * t;
      var pz = z1 + dz * t;
      var poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.8, 6);
      var poleMesh = makeMesh(poleGeo, makeMaterial(0x666666));
      poleMesh.position.set(px, 1.4, pz);
      group.add(poleMesh);
    }

    scene.add(group);

    var fs = {
      group: group,
      mesh: fenceMesh,
      hp: 60,
      destroyed: false,
      x1: x1, z1: z1, x2: x2, z2: z2,
      cx: (x1 + x2) / 2,
      cz: (z1 + z2) / 2
    };
    fenceSections.push(fs);
    return fs;
  }

  // ─── GUARD TOWER ───────────────────────────────────────────────────────────

  function buildGuardTower(tx, tz) {
    var group = new THREE.Group();

    // Main pole/column
    var colGeo = new THREE.CylinderGeometry(0.2, 0.2, 6, 8);
    var colMesh = makeMesh(colGeo, makeMaterial(0x8B6914));
    colMesh.position.set(0, 3, 0);
    group.add(colMesh);

    // Platform box
    var platGeo = new THREE.BoxGeometry(2, 0.3, 2);
    var platMesh = makeMesh(platGeo, makeMaterial(0x8B6914));
    platMesh.position.set(0, 6.15, 0);
    group.add(platMesh);

    // Railings
    var railMat = makeMaterial(0x5a4010);
    for (var ri = 0; ri < 4; ri++) {
      var railGeo = new THREE.BoxGeometry(ri % 2 === 0 ? 2 : 0.05, 0.6, ri % 2 === 0 ? 0.05 : 2);
      var railMesh = makeMesh(railGeo, railMat);
      var rox = (ri === 1) ? 0.975 : (ri === 3) ? -0.975 : 0;
      var roz = (ri === 0) ? 0.975 : (ri === 2) ? -0.975 : 0;
      railMesh.position.set(rox, 6.6, roz);
      group.add(railMesh);
    }

    // Ladder rungs
    for (var li = 0; li < 8; li++) {
      var rungGeo = new THREE.BoxGeometry(0.4, 0.05, 0.05);
      var rungMesh = makeMesh(rungGeo, makeMaterial(0x5a4010));
      var rungY = 0.5 + li * 0.8;
      rungMesh.position.set(0.3, rungY, 0.3);
      group.add(rungMesh);

      // Ladder collider (invisible, for player climbing)
      var colliderGeo = new THREE.BoxGeometry(0.5, 0.8, 0.5);
      var colliderMat = new THREE.MeshBasicMaterial({ visible: false });
      var collider = new THREE.Mesh(colliderGeo, colliderMat);
      collider.position.set(tx + 0.3, rungY + 0.4, tz + 0.3);
      collider.userData.isLadder = true;
      collider.userData.rungY = rungY;
      scene.add(collider);
      ladderColliders.push(collider);
    }

    group.position.set(tx, 0, tz);
    scene.add(group);

    var tower = { group: group, x: tx, z: tz };
    guardTowers.push(tower);
    return tower;
  }

  // ─── GUARD NPC ─────────────────────────────────────────────────────────────

  function spawnGuard(gx, gz, isSniper) {
    var group = new THREE.Group();

    var bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.4, 8);
    var bodyMesh = makeMesh(bodyGeo, makeMaterial(0x4a4a2a));
    bodyMesh.position.y = 0.7;
    group.add(bodyMesh);

    var headGeo = new THREE.SphereGeometry(0.25, 8, 8);
    var headMesh = makeMesh(headGeo, makeMaterial(0xd4a574));
    headMesh.position.y = 1.65;
    group.add(headMesh);

    group.position.set(gx, 0, gz);
    scene.add(group);

    var guard = {
      group: group,
      x: gx,
      z: gz,
      hp: 60,
      dead: false,
      alerted: false,
      isSniper: isSniper || false,
      shootTimer: 0,
      patrolAngle: Math.random() * Math.PI * 2,
      patrolRadius: 2,
      baseX: gx,
      baseZ: gz
    };
    guards.push(guard);
    return guard;
  }

  // ─── PRISONER NPC ──────────────────────────────────────────────────────────

  function spawnPrisoner(px, pz) {
    var group = new THREE.Group();

    var bodyGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.3, 8);
    var bodyMat = makeMaterial(0xFF8C00);
    var bodyMesh = makeMesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.65;
    group.add(bodyMesh);

    var headGeo = new THREE.SphereGeometry(0.22, 8, 8);
    var headMat = makeMaterial(0xd4a574);
    var headMesh = makeMesh(headGeo, headMat);
    headMesh.position.y = 1.52;
    group.add(headMesh);

    // Arms (down position)
    for (var side = -1; side <= 1; side += 2) {
      var armGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.6, 6);
      var armMesh = makeMesh(armGeo, bodyMat);
      armMesh.position.set(side * 0.32, 0.7, 0);
      group.add(armMesh);
    }

    group.position.set(px, 0, pz);
    scene.add(group);

    var prisoner = {
      group: group,
      bodyMesh: bodyMesh,
      headMesh: headMesh,
      x: px,
      z: pz,
      hp: 40,
      freed: false,
      safe: false,
      dead: false,
      cowering: false,
      cowerX: px,
      cowerZ: pz,
      followIndex: 0
    };
    prisoners.push(prisoner);
    return prisoner;
  }

  // ─── EXTRACTION ZONE ───────────────────────────────────────────────────────

  function buildExtractionZone(ex, ez) {
    var segments = 64;
    var geo = new THREE.CircleGeometry(6, segments);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x00ff44,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(ex, 0.05, ez);
    scene.add(mesh);

    // Pulsing ring
    var ringGeo = new THREE.RingGeometry(5.8, 6, segments);
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ff44,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(ex, 0.06, ez);
    scene.add(ring);

    // Label
    var labelGeo = new THREE.PlaneGeometry(4, 1);
    var labelMat = new THREE.MeshBasicMaterial({ color: 0x00ff44, side: THREE.DoubleSide });
    var label = new THREE.Mesh(labelGeo, labelMat);
    label.rotation.x = -Math.PI / 2;
    label.position.set(ex, 0.1, ez - 7);
    scene.add(label);

    extractionZone = { x: ex, z: ez, radius: 6 };
    extractionMarker = { mesh: mesh, ring: ring };
  }

  // ─── REINFORCEMENT SPAWN ───────────────────────────────────────────────────

  function spawnReinforcements() {
    reinforcementsSpawned = true;
    showToast('REINFORCEMENTS INCOMING!', 4);
    for (var i = 0; i < 5; i++) {
      var angle = (i / 5) * Math.PI * 2;
      var rx = campX + Math.cos(angle) * 18;
      var rz = campZ + Math.sin(angle) * 18;
      var g = spawnGuard(rx, rz, false);
      g.alerted = true;
      reinforcements.push(g);
    }
  }

  // ─── SPAWN CAMP ────────────────────────────────────────────────────────────

  function spawnCamp(cx, cz) {
    campX = cx || 0;
    campZ = cz || 0;

    // Ground pad for camp
    var groundGeo = new THREE.PlaneGeometry(24, 24);
    var groundMesh = new THREE.Mesh(groundGeo, makeMaterial(0x8B7355));
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(campX, 0.01, campZ);
    scene.add(groundMesh);

    // 3 fence sections forming a U-shape compound (open at south)
    var half = 10;
    buildFenceSection(campX - half, campZ - half, campX + half, campZ - half); // north
    buildFenceSection(campX - half, campZ - half, campX - half, campZ + half); // west
    buildFenceSection(campX + half, campZ - half, campX + half, campZ + half); // east

    // 4 guard towers at corners
    var corners = [
      [campX - half, campZ - half],
      [campX + half, campZ - half],
      [campX - half, campZ + half],
      [campX + half, campZ + half]
    ];
    for (var ci = 0; ci < corners.length; ci++) {
      buildGuardTower(corners[ci][0], corners[ci][1]);
      var towerY = corners[ci][1] < campZ ? 0 : 0;
      var isUp = ci >= 2; // southern towers at ground level, northern elevated
      var guardY = isUp ? 0 : 6; // guard on top of tower vs ground
      spawnGuard(corners[ci][0], corners[ci][1], true);
    }

    // 3 prisoners inside compound
    var prisonerPositions = [
      [campX - 3, campZ + 2],
      [campX,     campZ + 2],
      [campX + 3, campZ + 2]
    ];
    for (var pi = 0; pi < prisonerPositions.length; pi++) {
      spawnPrisoner(prisonerPositions[pi][0], prisonerPositions[pi][1]);
    }

    // Extraction zone 40 units south
    buildExtractionZone(campX, campZ + 40);

    // Some cover boxes inside compound
    var coverPositions = [
      [campX - 5, campZ - 3],
      [campX + 5, campZ - 3],
      [campX,     campZ - 6]
    ];
    for (var ki = 0; ki < coverPositions.length; ki++) {
      var boxGeo = new THREE.BoxGeometry(1.5, 1.2, 1.5);
      var boxMesh = makeMesh(boxGeo, makeMaterial(0x5a3e1a));
      boxMesh.position.set(coverPositions[ki][0], 0.6, coverPositions[ki][1]);
      scene.add(boxMesh);
    }
  }

  // ─── ALERT SYSTEM ──────────────────────────────────────────────────────────

  function alertAllGuards() {
    if (alertLevel === 1) return;
    alertLevel = 1;
    for (var i = 0; i < guards.length; i++) {
      guards[i].alerted = true;
    }
  }

  // public: called by weapon system when shot fired near camp
  function onGunshotNearCamp(x, z) {
    if (dist2D(x, z, campX, campZ) < 30) {
      alertAllGuards();
    }
  }

  // ─── PRISONER FREE ─────────────────────────────────────────────────────────

  function freePrisoner(prisoner) {
    prisoner.freed = true;
    prisoner.bodyMesh.material = makeMaterial(0x888888);
    for (var i = 0; i < prisoner.group.children.length; i++) {
      var child = prisoner.group.children[i];
      // arms use same material ref — update all non-head meshes
      if (child !== prisoner.headMesh) {
        child.material = makeMaterial(0x888888);
      }
    }
    showToast('PRISONER FREED! Escort to extraction!', 3);
  }

  // ─── GUARD AI ──────────────────────────────────────────────────────────────

  function updateGuards(delta) {
    var playerPos = camera ? camera.position : new THREE.Vector3();

    for (var i = 0; i < guards.length; i++) {
      var g = guards[i];
      if (g.dead) continue;

      g.shootTimer -= delta;

      if (g.alerted) {
        // Move toward player
        var dx = playerPos.x - g.group.position.x;
        var dz = playerPos.z - g.group.position.z;
        var d = Math.sqrt(dx * dx + dz * dz);

        // Turn to face player
        g.group.rotation.y = Math.atan2(dx, dz);

        if (d > 4 && !g.isSniper) {
          var spd = 2.5 * delta;
          g.group.position.x += (dx / d) * spd;
          g.group.position.z += (dz / d) * spd;
          g.x = g.group.position.x;
          g.z = g.group.position.z;
        }

        // Shoot at player
        if (g.shootTimer <= 0 && d < 25) {
          g.shootTimer = g.isSniper ? 2.5 : 1.2;
          // Damage player via global if available
          if (window.PlayerHealth && window.PlayerHealth.damage) {
            window.PlayerHealth.damage(g.isSniper ? 15 : 8);
          }
          // Shoot at freed prisoners too
          for (var pi = 0; pi < prisoners.length; pi++) {
            var pr = prisoners[pi];
            if (pr.freed && !pr.dead && !pr.safe) {
              var pdx = pr.group.position.x - g.group.position.x;
              var pdz = pr.group.position.z - g.group.position.z;
              var pd = Math.sqrt(pdx * pdx + pdz * pdz);
              if (pd < 20) {
                pr.hp -= (g.isSniper ? 12 : 6) * delta * 0.5;
                if (pr.hp <= 0) {
                  killPrisoner(pr);
                }
              }
            }
          }
        }
      } else {
        // Patrol
        g.patrolAngle += delta * 0.5;
        g.group.position.x = g.baseX + Math.cos(g.patrolAngle) * g.patrolRadius;
        g.group.position.z = g.baseZ + Math.sin(g.patrolAngle) * g.patrolRadius;
        g.x = g.group.position.x;
        g.z = g.group.position.z;
      }
    }
  }

  function killGuard(guard) {
    if (guard.dead) return;
    guard.dead = true;
    guard.group.rotation.x = Math.PI / 2;
    guard.group.position.y = -0.5;

    // Check if all guards dead
    var allDead = true;
    for (var i = 0; i < guards.length; i++) {
      if (!guards[i].dead) { allDead = false; break; }
    }
    if (allDead) {
      allGuardsEliminated = true;
      showToast('ALL GUARDS ELIMINATED — Free the prisoners!', 4);
    }
  }

  function killPrisoner(prisoner) {
    if (prisoner.dead) return;
    prisoner.dead = true;
    score -= 200;
    prisoner.group.rotation.x = Math.PI / 2;
    prisoner.group.position.y = -0.3;
    showToast('PRISONER KIA! -200', 3);
  }

  // ─── PRISONER AI ───────────────────────────────────────────────────────────

  function updatePrisoners(delta) {
    var playerPos = camera ? camera.position : new THREE.Vector3();
    var freedIdx = 0;

    for (var i = 0; i < prisoners.length; i++) {
      var p = prisoners[i];
      if (p.dead || p.safe) continue;

      if (p.freed) {
        if (alertLevel === 1 && !p.safe) {
          // Cower: move toward nearest fence section as cover
          if (!p.cowering) {
            p.cowering = true;
            var bestDist = 9999;
            for (var fi = 0; fi < fenceSections.length; fi++) {
              var fs = fenceSections[fi];
              var fd = dist2D(p.group.position.x, p.group.position.z, fs.cx, fs.cz);
              if (fd < bestDist) {
                bestDist = fd;
                p.cowerX = fs.cx;
                p.cowerZ = fs.cz;
              }
            }
          }
          // Move to cover
          var cdx = p.cowerX - p.group.position.x;
          var cdz = p.cowerZ - p.group.position.z;
          var cd = Math.sqrt(cdx * cdx + cdz * cdz);
          if (cd > 1.5) {
            p.group.position.x += (cdx / cd) * 1.2 * delta;
            p.group.position.z += (cdz / cd) * 1.2 * delta;
          }
        } else {
          // Follow player in single file
          p.cowering = false;
          freedIdx++;
          var targetX, targetZ;
          if (freedIdx === 1) {
            // Follow player
            var backAngle = Math.atan2(
              p.group.position.z - playerPos.z,
              p.group.position.x - playerPos.x
            );
            targetX = playerPos.x + Math.cos(backAngle) * 2;
            targetZ = playerPos.z + Math.sin(backAngle) * 2;
          } else {
            // Follow the previous freed prisoner
            var prevP = null;
            var prevCount = 0;
            for (var pj = 0; pj < i; pj++) {
              if (prisoners[pj].freed && !prisoners[pj].dead && !prisoners[pj].safe) {
                prevP = prisoners[pj];
                prevCount++;
              }
            }
            if (prevP) {
              var bAngle = Math.atan2(
                p.group.position.z - prevP.group.position.z,
                p.group.position.x - prevP.group.position.x
              );
              targetX = prevP.group.position.x + Math.cos(bAngle) * 2;
              targetZ = prevP.group.position.z + Math.sin(bAngle) * 2;
            } else {
              targetX = playerPos.x;
              targetZ = playerPos.z;
            }
          }

          var fdx = targetX - p.group.position.x;
          var fdz = targetZ - p.group.position.z;
          var fd2 = Math.sqrt(fdx * fdx + fdz * fdz);
          if (fd2 > 1.5) {
            var spd = 1.5 * delta;
            p.group.position.x += (fdx / fd2) * spd;
            p.group.position.z += (fdz / fd2) * spd;
            p.x = p.group.position.x;
            p.z = p.group.position.z;
          }
        }

        // Check extraction
        if (extractionZone) {
          var ed = dist2D(p.group.position.x, p.group.position.z, extractionZone.x, extractionZone.z);
          if (ed < extractionZone.radius) {
            p.safe = true;
            p.bodyMesh.material = makeMaterial(0x00aa44);
            checkExtractionSuccess();
          }
        }
      }
    }
  }

  function checkExtractionSuccess() {
    if (rescueComplete) return;
    var safeCount = 0;
    var freedCount = 0;
    var deadCount = 0;
    for (var i = 0; i < prisoners.length; i++) {
      if (prisoners[i].safe) safeCount++;
      if (prisoners[i].freed && !prisoners[i].dead) freedCount++;
      if (prisoners[i].dead) deadCount++;
    }

    if (safeCount === 3) {
      rescueComplete = true;
      score += 800;
      showToast('RESCUE COMPLETE! +800', 5);
      if (window.ObjectiveSystem && window.ObjectiveSystem.unlockNext) {
        window.ObjectiveSystem.unlockNext('prisoner-rescue');
      }
    } else if (safeCount >= 1 && safeCount + deadCount >= 3) {
      // Partial — all accounted for
      rescueComplete = true;
      var partialScore = safeCount * 200;
      score += partialScore;
      showToast('PARTIAL RESCUE: ' + safeCount + '/3 — +' + partialScore, 5);
    }
  }

  // ─── PLAYER INTERACTION ────────────────────────────────────────────────────

  function checkPlayerInteractions() {
    if (!camera) return;
    var px = camera.position.x;
    var pz = camera.position.z;

    // E to free prisoner
    if (eKeyJustPressed) {
      for (var i = 0; i < prisoners.length; i++) {
        var p = prisoners[i];
        if (!p.freed && !p.dead) {
          var d = dist2D(px, pz, p.group.position.x, p.group.position.z);
          if (d < 2.5) {
            if (allGuardsEliminated) {
              freePrisoner(p);
            } else {
              showToast('Eliminate all guards first!', 2);
            }
            break;
          }
        }
      }
    }
  }

  function onKeyDown(e) {
    keys[e.code] = true;
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  // ─── FENCE DAMAGE ──────────────────────────────────────────────────────────

  function damageFence(fenceSection, amount) {
    if (fenceSection.destroyed) return;
    fenceSection.hp -= amount;
    if (fenceSection.hp <= 0) {
      fenceSection.destroyed = true;
      // Visually drop the fence
      fenceSection.group.position.y = -1.5;
      showToast('FENCE BREACHED!', 2);
    }
  }

  // Called by weapon/explosion system
  function onExplosionNearFence(x, z, radius, damage) {
    for (var i = 0; i < fenceSections.length; i++) {
      var fs = fenceSections[i];
      if (fs.destroyed) continue;
      var d = dist2D(x, z, fs.cx, fs.cz);
      if (d < radius) {
        damageFence(fs, damage);
      }
    }
  }

  // ─── EXTRACTION MARKER PULSE ───────────────────────────────────────────────

  var pulseTimer = 0;
  function updateExtractionMarker(delta) {
    if (!extractionMarker) return;
    pulseTimer += delta * 2;
    var opacity = 0.3 + 0.3 * Math.abs(Math.sin(pulseTimer));
    extractionMarker.ring.material.opacity = opacity;
  }

  // ─── MAIN UPDATE ───────────────────────────────────────────────────────────

  function update(delta) {
    if (!scene) return;

    // E key edge detection
    var eNow = !!keys['KeyE'];
    eKeyJustPressed = eNow && !prevEKey;
    prevEKey = eNow;

    missionTimer += delta;

    // Reinforcements at 60s
    if (missionTimer >= 60 && !reinforcementsSpawned) {
      var freedCount = 0;
      for (var fi = 0; fi < prisoners.length; fi++) {
        if (prisoners[fi].freed) freedCount++;
      }
      if (freedCount < 3) {
        spawnReinforcements();
      }
    }

    updateGuards(delta);
    updatePrisoners(delta);
    checkPlayerInteractions();
    updateExtractionMarker(delta);
    updateHUD();

    // Toast fade
    if (toastTimer > 0) {
      toastTimer -= delta;
      if (toastTimer <= 0 && toastEl) {
        toastEl.style.opacity = '0';
      }
    }
  }

  // ─── RESET ─────────────────────────────────────────────────────────────────

  function reset() {
    // Remove all scene objects
    for (var i = 0; i < guards.length; i++) {
      if (guards[i].group && guards[i].group.parent) {
        scene.remove(guards[i].group);
      }
    }
    for (var i = 0; i < prisoners.length; i++) {
      if (prisoners[i].group && prisoners[i].group.parent) {
        scene.remove(prisoners[i].group);
      }
    }
    for (var i = 0; i < fenceSections.length; i++) {
      if (fenceSections[i].group && fenceSections[i].group.parent) {
        scene.remove(fenceSections[i].group);
      }
    }
    for (var i = 0; i < guardTowers.length; i++) {
      if (guardTowers[i].group && guardTowers[i].group.parent) {
        scene.remove(guardTowers[i].group);
      }
    }
    for (var i = 0; i < ladderColliders.length; i++) {
      if (ladderColliders[i].parent) {
        scene.remove(ladderColliders[i]);
      }
    }
    if (extractionMarker) {
      if (extractionMarker.mesh.parent) scene.remove(extractionMarker.mesh);
      if (extractionMarker.ring.parent) scene.remove(extractionMarker.ring);
    }

    guards = [];
    prisoners = [];
    fenceSections = [];
    guardTowers = [];
    reinforcements = [];
    ladderColliders = [];
    extractionZone = null;
    extractionMarker = null;

    allGuardsEliminated = false;
    rescueComplete = false;
    reinforcementsSpawned = false;
    missionTimer = 0;
    alertLevel = 0;
    pulseTimer = 0;
    prevEKey = false;
    eKeyJustPressed = false;
    keys = {};
    score = 0;

    removeHUD();
  }

  // ─── INIT ──────────────────────────────────────────────────────────────────

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    buildHUD();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  // ─── PUBLIC API ────────────────────────────────────────────────────────────

  function getRescuedCount() {
    var count = 0;
    for (var i = 0; i < prisoners.length; i++) {
      if (prisoners[i].safe) count++;
    }
    return count;
  }

  return {
    init: init,
    update: update,
    spawnCamp: spawnCamp,
    getRescuedCount: getRescuedCount,
    reset: reset,
    // Extra hooks for integration
    onGunshotNearCamp: onGunshotNearCamp,
    onExplosionNearFence: onExplosionNearFence,
    killGuard: killGuard,
    getGuards: function () { return guards; },
    getFences: function () { return fenceSections; },
    getScore: function () { return score; },
    isComplete: function () { return rescueComplete; }
  };
})();
