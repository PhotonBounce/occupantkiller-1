window.GhostShip = (function () {
  'use strict';

  var scene, camera;
  var sceneObjects = [];
  var active = false;
  var elapsed = 0;
  var gKeyTime = 0;
  var hudEl = null;
  var documentsFound = 0;
  var piratesEliminated = 0;
  var shipGroup = null;
  var lanterns = [];
  var lanternPivots = [];
  var smokeParticles = [];
  var enemies = [];
  var documents = [];
  var savedFog = null;
  var savedBackground = null;
  var keydownHandler = null;
  var clickHandler = null;
  var animFrame = 0;

  var TOTAL_DOCUMENTS = 3;
  var TOTAL_PIRATES = 8;

  function addToScene(obj) {
    scene.add(obj);
    sceneObjects.push(obj);
    return obj;
  }

  function makeMat(color, opts) {
    var params = { color: color };
    if (opts) {
      if (opts.emissive !== undefined) params.emissive = opts.emissive;
      if (opts.emissiveIntensity !== undefined) params.emissiveIntensity = opts.emissiveIntensity;
      if (opts.transparent !== undefined) params.transparent = opts.transparent;
      if (opts.opacity !== undefined) params.opacity = opts.opacity;
    }
    return new THREE.MeshLambertMaterial(params);
  }

  function buildShip() {
    shipGroup = new THREE.Group();

    // --- Hull ---
    var hullGeo = new THREE.BoxGeometry(40, 4, 12);
    var hullMesh = new THREE.Mesh(hullGeo, makeMat(0x2a2a2a));
    hullMesh.position.set(0, 0, 0);
    shipGroup.add(hullMesh);

    // Hull sides - give it some depth
    var sideGeo = new THREE.BoxGeometry(40, 3, 1);
    var sideMatL = makeMat(0x1e1e1e);
    var sideL = new THREE.Mesh(sideGeo, sideMatL);
    sideL.position.set(0, 1.5, -6.5);
    shipGroup.add(sideL);
    var sideR = new THREE.Mesh(sideGeo, makeMat(0x1e1e1e));
    sideR.position.set(0, 1.5, 6.5);
    shipGroup.add(sideR);

    // Bow (front) angled plate
    var bowGeo = new THREE.BoxGeometry(3, 3, 12);
    var bowMesh = new THREE.Mesh(bowGeo, makeMat(0x1a1a1a));
    bowMesh.position.set(-21.5, 0.5, 0);
    bowMesh.rotation.z = Math.PI / 8;
    shipGroup.add(bowMesh);

    // Deck surface
    var deckGeo = new THREE.BoxGeometry(38, 0.4, 11);
    var deckMesh = new THREE.Mesh(deckGeo, makeMat(0x3a3020));
    deckMesh.position.set(0, 2.2, 0);
    shipGroup.add(deckMesh);

    // --- Bridge Tower ---
    var towerGeo = new THREE.BoxGeometry(6, 8, 6);
    var tower = new THREE.Mesh(towerGeo, makeMat(0x3c3c3c));
    tower.position.set(12, 6, 0);
    shipGroup.add(tower);

    // Bridge windows (dark panes on the tower)
    var winGeo = new THREE.BoxGeometry(0.15, 0.8, 0.8);
    var winMat = makeMat(0x88aacc, { emissive: 0x223344, emissiveIntensity: 0.5 });
    for (var wi = 0; wi < 3; wi++) {
      var win = new THREE.Mesh(winGeo, winMat);
      win.position.set(12 - 3.05, 8, -1.8 + wi * 1.8);
      shipGroup.add(win);
      var winB = new THREE.Mesh(winGeo, winMat);
      winB.position.set(12 + 3.05, 8, -1.8 + wi * 1.8);
      shipGroup.add(winB);
    }

    // Bridge top / wheelhouse
    var wheelGeo = new THREE.BoxGeometry(5, 2, 5);
    var wheel = new THREE.Mesh(wheelGeo, makeMat(0x444444));
    wheel.position.set(12, 11, 0);
    shipGroup.add(wheel);

    // Radar mast on top
    var mastGeo = new THREE.CylinderGeometry(0.08, 0.08, 4, 5);
    var mast = new THREE.Mesh(mastGeo, makeMat(0x888888));
    mast.position.set(12, 14, 0);
    shipGroup.add(mast);

    // --- Funnels ---
    var funnelPositions = [
      { x: 8, z: 0 },
      { x: 5, z: 0 }
    ];
    for (var fi = 0; fi < funnelPositions.length; fi++) {
      var fp = funnelPositions[fi];
      var funnelGeo = new THREE.CylinderGeometry(0.6, 0.9, 4, 8);
      var funnel = new THREE.Mesh(funnelGeo, makeMat(0x1a1a1a));
      funnel.position.set(fp.x, 6, fp.z);
      shipGroup.add(funnel);
      // Funnel ring
      var ringGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.3, 8);
      var ring = new THREE.Mesh(ringGeo, makeMat(0xcc2200));
      ring.position.set(fp.x, 8.1, fp.z);
      shipGroup.add(ring);
    }

    // --- Cargo Containers ---
    var containerColors = [0xcc3300, 0x2255aa, 0x228833, 0xaa8800, 0x884422, 0x115566];
    var containerDefs = [
      { x: -5, y: 3.2, z: -2.5, w: 4, h: 2.5, d: 2 },
      { x: -5, y: 5.7, z: -2.5, w: 4, h: 2.5, d: 2 },
      { x: -5, y: 3.2, z: 2.5, w: 4, h: 2.5, d: 2 },
      { x: -10, y: 3.2, z: -2.5, w: 4, h: 2.5, d: 2 },
      { x: -10, y: 5.7, z: -2.5, w: 4, h: 2.5, d: 2 },
      { x: -10, y: 3.2, z: 2.5, w: 4, h: 2.5, d: 2 },
      { x: 0, y: 3.2, z: -2.5, w: 4, h: 2.5, d: 2 },
      { x: 0, y: 3.2, z: 2.5, w: 4, h: 2.5, d: 2 }
    ];
    for (var ci = 0; ci < containerDefs.length; ci++) {
      var cd = containerDefs[ci];
      var cGeo = new THREE.BoxGeometry(cd.w, cd.h, cd.d);
      var cMesh = new THREE.Mesh(cGeo, makeMat(containerColors[ci % containerColors.length]));
      cMesh.position.set(cd.x, cd.y, cd.z);
      shipGroup.add(cMesh);

      // Container ridges
      var ridgeGeo = new THREE.BoxGeometry(0.1, cd.h, cd.d + 0.05);
      var ridgeMat = makeMat(0x111111);
      for (var ri = -1; ri <= 1; ri++) {
        var ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
        ridge.position.set(cd.x + ri * (cd.w / 3), cd.y, cd.z);
        shipGroup.add(ridge);
      }
    }

    // --- Crane Structure (LineSegments + box) ---
    var craneBaseGeo = new THREE.BoxGeometry(1.5, 5, 1.5);
    var craneBase = new THREE.Mesh(craneBaseGeo, makeMat(0x555533));
    craneBase.position.set(-15, 4.5, 0);
    shipGroup.add(craneBase);

    var craneArmGeo = new THREE.BoxGeometry(7, 0.5, 0.5);
    var craneArm = new THREE.Mesh(craneArmGeo, makeMat(0x555533));
    craneArm.position.set(-18.5, 7.5, 0);
    shipGroup.add(craneArm);

    // Crane cable (LineSegments)
    var cranePts = [];
    cranePts.push(new THREE.Vector3(-19, 7.5, 0));
    cranePts.push(new THREE.Vector3(-19, 3.5, 0));
    var craneLineGeo = new THREE.BufferGeometry().setFromPoints(cranePts);
    var craneLine = new THREE.LineSegments(craneLineGeo, new THREE.LineBasicMaterial({ color: 0x888866 }));
    shipGroup.add(craneLine);

    // Crane support diagonals
    var diagPts = [];
    diagPts.push(new THREE.Vector3(-15, 7, 0));
    diagPts.push(new THREE.Vector3(-22, 7.5, 0));
    diagPts.push(new THREE.Vector3(-22, 7.5, 0));
    diagPts.push(new THREE.Vector3(-15, 4, 0));
    var diagGeo = new THREE.BufferGeometry().setFromPoints(diagPts);
    var diagLines = new THREE.LineSegments(diagGeo, new THREE.LineBasicMaterial({ color: 0x666644 }));
    shipGroup.add(diagLines);

    // --- Anchor Chain (LineSegments) ---
    var chainPts = [];
    for (var ch = 0; ch <= 20; ch++) {
      chainPts.push(new THREE.Vector3(
        -20 + (ch % 2) * 0.25,
        2 - ch * 0.7,
        -4
      ));
    }
    var chainGeo = new THREE.BufferGeometry().setFromPoints(chainPts);
    var chainLine = new THREE.LineSegments(chainGeo, new THREE.LineBasicMaterial({ color: 0x444422 }));
    shipGroup.add(chainLine);

    // Anchor itself
    var anchorBodyGeo = new THREE.BoxGeometry(0.4, 1.5, 0.3);
    var anchor = new THREE.Mesh(anchorBodyGeo, makeMat(0x333322));
    anchor.position.set(-20, -5, -4);
    shipGroup.add(anchor);

    // --- Rope / rigging lines ---
    var rigPts = [];
    rigPts.push(new THREE.Vector3(-15, 7, 0));
    rigPts.push(new THREE.Vector3(12, 13, 0));
    rigPts.push(new THREE.Vector3(12, 13, 0));
    rigPts.push(new THREE.Vector3(16, 5, 0));
    var rigGeo = new THREE.BufferGeometry().setFromPoints(rigPts);
    var rigLines = new THREE.LineSegments(rigGeo, new THREE.LineBasicMaterial({ color: 0x665544 }));
    shipGroup.add(rigLines);

    // --- Deck railing ---
    var railPts = [];
    // Port side rail
    railPts.push(new THREE.Vector3(-20, 3, -5.8));
    railPts.push(new THREE.Vector3(19, 3, -5.8));
    // Starboard side rail
    railPts.push(new THREE.Vector3(-20, 3, 5.8));
    railPts.push(new THREE.Vector3(19, 3, 5.8));
    // Rail posts
    for (var rp = -18; rp <= 18; rp += 3) {
      railPts.push(new THREE.Vector3(rp, 2.2, -5.8));
      railPts.push(new THREE.Vector3(rp, 3, -5.8));
      railPts.push(new THREE.Vector3(rp, 2.2, 5.8));
      railPts.push(new THREE.Vector3(rp, 3, 5.8));
    }
    var railGeo = new THREE.BufferGeometry().setFromPoints(railPts);
    var railLines = new THREE.LineSegments(railGeo, new THREE.LineBasicMaterial({ color: 0x666666 }));
    shipGroup.add(railLines);

    // --- Documents (glowing boxes) ---
    var docPositions = [
      { x: -8, y: 3.5, z: 0 },
      { x: 12, y: 3, z: 2 },
      { x: -18, y: 3.5, z: 2 }
    ];
    documents = [];
    for (var di = 0; di < docPositions.length; di++) {
      var dp = docPositions[di];
      var docGeo = new THREE.BoxGeometry(0.4, 0.05, 0.3);
      var docMat = new THREE.MeshLambertMaterial({
        color: 0xffffcc,
        emissive: 0xaaaa55,
        emissiveIntensity: 0.8
      });
      var doc = new THREE.Mesh(docGeo, docMat);
      doc.position.set(dp.x, dp.y, dp.z);
      doc.userData.isDocument = true;
      doc.userData.collected = false;
      shipGroup.add(doc);
      documents.push(doc);
    }

    // --- Lanterns ---
    lanterns = [];
    lanternPivots = [];
    var lanternDefs = [
      { x: 18, y: 4, z: -5 },
      { x: 18, y: 4, z: 5 },
      { x: -18, y: 4, z: -5 },
      { x: -18, y: 4, z: 5 },
      { x: 12, y: 10, z: 0 }
    ];
    for (var li = 0; li < lanternDefs.length; li++) {
      var ld = lanternDefs[li];

      // Pivot group for swinging
      var pivot = new THREE.Group();
      pivot.position.set(ld.x, ld.y, ld.z);
      pivot.userData.swingOffset = li * 1.1;
      shipGroup.add(pivot);
      lanternPivots.push(pivot);

      // Hanging rod
      var rodGeo = new THREE.BoxGeometry(0.05, 0.6, 0.05);
      var rod = new THREE.Mesh(rodGeo, makeMat(0x333333));
      rod.position.set(0, -0.3, 0);
      pivot.add(rod);

      // Lantern body
      var lanternGeo = new THREE.BoxGeometry(0.3, 0.4, 0.3);
      var lanternMat = new THREE.MeshLambertMaterial({ color: 0xffaa22, emissive: 0xff6600, emissiveIntensity: 0.6 });
      var lanternMesh = new THREE.Mesh(lanternGeo, lanternMat);
      lanternMesh.position.set(0, -0.7, 0);
      pivot.add(lanternMesh);

      // Point light from lantern
      var light = new THREE.PointLight(0xff8800, 0.8, 12);
      light.position.set(ld.x, ld.y - 0.7, ld.z);
      shipGroup.add(light);
      lanterns.push({ light: light, pivot: pivot, baseX: ld.x, baseY: ld.y - 0.7, baseZ: ld.z });
    }

    // --- Enemies (pirate skeleton crew) ---
    enemies = [];
    var enemyPositions = [
      { x: -6, z: 0 },
      { x: -12, z: 3 },
      { x: 2, z: -3 },
      { x: 16, z: -2 },
      { x: -18, z: -3 },
      { x: -4, z: -3 },
      { x: 8, z: 3 },
      { x: 14, z: 2 }
    ];
    for (var ei = 0; ei < enemyPositions.length; ei++) {
      var ePos = enemyPositions[ei];
      var enemyGroup = new THREE.Group();
      enemyGroup.position.set(ePos.x, 2.7, ePos.z);
      enemyGroup.userData.isEnemy = true;
      enemyGroup.userData.dead = false;
      enemyGroup.userData.walkOffset = ei * 0.7;
      enemyGroup.userData.walkDir = (ei % 2 === 0) ? 1 : -1;
      enemyGroup.userData.baseX = ePos.x;
      enemyGroup.userData.baseZ = ePos.z;

      // Torso - ragged/wider
      var torsoGeo = new THREE.BoxGeometry(0.55, 0.65, 0.35);
      var torso = new THREE.Mesh(torsoGeo, makeMat(0x3a2a1a));
      torso.position.set(0, 0, 0);
      enemyGroup.add(torso);

      // Head - skull-like
      var headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
      var head = new THREE.Mesh(headGeo, makeMat(0xccbb99));
      head.position.set(0, 0.55, 0);
      enemyGroup.add(head);

      // Eye sockets (dark boxes)
      var eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.1);
      var eyeMat = makeMat(0x111111);
      var eyeL = new THREE.Mesh(eyeGeo, eyeMat);
      eyeL.position.set(-0.1, 0.57, 0.18);
      enemyGroup.add(eyeL);
      var eyeR = new THREE.Mesh(eyeGeo, eyeMat);
      eyeR.position.set(0.1, 0.57, 0.18);
      enemyGroup.add(eyeR);

      // Left arm - jagged/torn
      var armGeo = new THREE.BoxGeometry(0.15, 0.55, 0.15);
      var armL = new THREE.Mesh(armGeo, makeMat(0x2a1a0a));
      armL.position.set(-0.38, -0.08, 0);
      armL.rotation.z = 0.3;
      enemyGroup.add(armL);

      // Right arm holding weapon
      var armR = new THREE.Mesh(armGeo, makeMat(0x2a1a0a));
      armR.position.set(0.38, -0.08, 0);
      armR.rotation.z = -0.5;
      enemyGroup.add(armR);

      // Weapon (machete/cutlass - a flat box)
      var weaponGeo = new THREE.BoxGeometry(0.06, 0.5, 0.15);
      var weapon = new THREE.Mesh(weaponGeo, makeMat(0x888888));
      weapon.position.set(0.55, -0.38, 0);
      weapon.rotation.z = -0.7;
      enemyGroup.add(weapon);

      // Legs
      var legGeo = new THREE.BoxGeometry(0.18, 0.5, 0.18);
      var legL = new THREE.Mesh(legGeo, makeMat(0x1a1a2a));
      legL.position.set(-0.16, -0.58, 0);
      enemyGroup.add(legL);
      var legR = new THREE.Mesh(legGeo, makeMat(0x1a1a2a));
      legR.position.set(0.16, -0.58, 0);
      enemyGroup.add(legR);

      // Bandana
      var bandanaGeo = new THREE.BoxGeometry(0.37, 0.12, 0.37);
      var bandana = new THREE.Mesh(bandanaGeo, makeMat(0xaa1111));
      bandana.position.set(0, 0.66, 0);
      enemyGroup.add(bandana);

      shipGroup.add(enemyGroup);
      enemies.push(enemyGroup);
    }

    return shipGroup;
  }

  function buildSmoke() {
    smokeParticles = [];
    var funnelXPositions = [8, 5];
    for (var fi = 0; fi < funnelXPositions.length; fi++) {
      for (var si = 0; si < 8; si++) {
        var sGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        var sMat = new THREE.MeshLambertMaterial({
          color: 0x333333,
          transparent: true,
          opacity: 0.6
        });
        var smoke = new THREE.Mesh(sGeo, sMat);
        smoke.position.set(
          funnelXPositions[fi] + (Math.random() - 0.5) * 0.4,
          8 + si * 1.2 + Math.random() * 0.5,
          (Math.random() - 0.5) * 0.4
        );
        smoke.userData.speed = 0.8 + Math.random() * 0.6;
        smoke.userData.drift = (Math.random() - 0.5) * 0.3;
        smoke.userData.funnelX = funnelXPositions[fi];
        smoke.userData.offset = si / 8;
        shipGroup.add(smoke);
        smokeParticles.push(smoke);
      }
    }
  }

  function buildOcean() {
    // Ocean plane
    var oceanGeo = new THREE.BoxGeometry(300, 0.5, 300);
    var oceanMat = new THREE.MeshLambertMaterial({ color: 0x0a1a2a });
    var ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.position.set(0, -4, 0);
    addToScene(ocean);

    // Ambient light - very dim
    var ambient = new THREE.AmbientLight(0x111122, 0.3);
    addToScene(ambient);

    // Moon light - very faint blue
    var moonLight = new THREE.DirectionalLight(0x223355, 0.15);
    moonLight.position.set(-10, 20, -10);
    addToScene(moonLight);
  }

  function createHUD() {
    if (hudEl) return;
    hudEl = document.createElement('div');
    hudEl.id = 'ghost-ship-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:60px',
      'left:16px',
      'color:#88ccff',
      'font-family:monospace',
      'font-size:14px',
      'line-height:1.6',
      'text-shadow:0 0 6px #224488',
      'pointer-events:none',
      'z-index:9999',
      'background:rgba(0,0,10,0.5)',
      'padding:8px 12px',
      'border:1px solid #224466',
      'border-radius:4px'
    ].join(';');
    updateHUD();
    document.body.appendChild(hudEl);
  }

  function updateHUD() {
    if (!hudEl) return;
    hudEl.innerHTML =
      '<div style="color:#ffcc44;margin-bottom:4px">&#9760; GHOST SHIP &#9760;</div>' +
      '<div>DOCUMENTS FOUND: ' + documentsFound + '/' + TOTAL_DOCUMENTS + '</div>' +
      '<div>PIRATES ELIMINATED: ' + piratesEliminated + '/' + TOTAL_PIRATES + '</div>' +
      '<div style="margin-top:6px;color:#aaaaaa;font-size:11px">[CLICK] Shoot &nbsp; [WASD] Move</div>';
    if (documentsFound >= TOTAL_DOCUMENTS && piratesEliminated >= TOTAL_PIRATES) {
      hudEl.innerHTML += '<div style="color:#44ff44;margin-top:8px;font-weight:bold">MISSION COMPLETE!</div>';
    }
  }

  function removeHUD() {
    if (hudEl && hudEl.parentNode) {
      hudEl.parentNode.removeChild(hudEl);
    }
    hudEl = null;
  }

  function showNotification(msg) {
    var notif = document.createElement('div');
    notif.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#ffcc44',
      'font-family:monospace',
      'font-size:20px',
      'font-weight:bold',
      'text-shadow:0 0 10px #ff8800',
      'pointer-events:none',
      'z-index:10000',
      'background:rgba(0,0,0,0.7)',
      'padding:12px 24px',
      'border:1px solid #ff8800',
      'border-radius:6px'
    ].join(';');
    notif.textContent = msg;
    document.body.appendChild(notif);
    setTimeout(function () {
      if (notif.parentNode) notif.parentNode.removeChild(notif);
    }, 2000);
  }

  function setupKeys() {
    keydownHandler = function (e) {
      if (e.key === 'g' || e.key === 'G') {
        gKeyTime = Date.now();
      } else if ((e.key === 's' || e.key === 'S') && gKeyTime > 0) {
        if (Date.now() - gKeyTime < 400) {
          gKeyTime = 0;
          if (active) {
            deactivate();
            showNotification('GHOST SHIP: OFF');
          } else {
            activate();
            showNotification('GHOST SHIP: ON');
          }
          return;
        }
        gKeyTime = 0;
      } else {
        // Reset g key if other key pressed
        gKeyTime = 0;
      }
    };
    document.addEventListener('keydown', keydownHandler);
  }

  function setupClick() {
    clickHandler = function (e) {
      if (!active) return;
      // Shoot - raycast at enemies and documents
      var raycaster = new THREE.Raycaster();
      var center = new THREE.Vector2(0, 0);
      raycaster.setFromCamera(center, camera);

      // Check enemies
      var allEnemyMeshes = [];
      var enemyMap = [];
      for (var ei = 0; ei < enemies.length; ei++) {
        var eg = enemies[ei];
        if (!eg.userData.dead) {
          var meshes = [];
          eg.traverse(function (child) {
            if (child.isMesh) meshes.push(child);
          });
          for (var mi = 0; mi < meshes.length; mi++) {
            allEnemyMeshes.push(meshes[mi]);
            enemyMap.push(eg);
          }
        }
      }

      var intersects = raycaster.intersectObjects(allEnemyMeshes, false);
      if (intersects.length > 0) {
        var hitMesh = intersects[0].object;
        var hitIdx = allEnemyMeshes.indexOf(hitMesh);
        var hitEnemy = enemyMap[hitIdx];
        if (hitEnemy && !hitEnemy.userData.dead) {
          hitEnemy.userData.dead = true;
          // Collapse enemy
          hitEnemy.rotation.x = Math.PI / 2;
          hitEnemy.position.y = 2.3;
          piratesEliminated++;
          updateHUD();
          showNotification('PIRATE ELIMINATED! ' + piratesEliminated + '/' + TOTAL_PIRATES);
          return;
        }
      }

      // Check documents
      var docMeshes = [];
      for (var di = 0; di < documents.length; di++) {
        if (!documents[di].userData.collected) {
          docMeshes.push(documents[di]);
        }
      }
      var docIntersects = raycaster.intersectObjects(docMeshes, false);
      if (docIntersects.length > 0) {
        var hitDoc = docIntersects[0].object;
        if (!hitDoc.userData.collected) {
          hitDoc.userData.collected = true;
          hitDoc.visible = false;
          documentsFound++;
          updateHUD();
          showNotification('DOCUMENT RECOVERED! ' + documentsFound + '/' + TOTAL_DOCUMENTS);
        }
      }
    };
    document.addEventListener('click', clickHandler);
  }

  function activate() {
    active = true;

    // Save existing fog/background
    savedFog = scene.fog;
    savedBackground = scene.background;

    // Apply ghost ship atmosphere
    scene.fog = new THREE.Fog(0x0a0e14, 8, 60);
    scene.background = new THREE.Color(0x050810);

    shipGroup = buildShip();
    buildSmoke();
    buildOcean();
    addToScene(shipGroup);

    // Position camera on deck
    camera.position.set(0, 4.5, 0);
    camera.lookAt(10, 4.5, 0);

    createHUD();
    documentsFound = 0;
    piratesEliminated = 0;
    updateHUD();
  }

  function deactivate() {
    active = false;
    // Remove all tracked objects
    for (var i = 0; i < sceneObjects.length; i++) {
      scene.remove(sceneObjects[i]);
    }
    sceneObjects = [];
    // Restore fog/background
    scene.fog = savedFog || null;
    scene.background = savedBackground || null;
    shipGroup = null;
    lanterns = [];
    lanternPivots = [];
    smokeParticles = [];
    enemies = [];
    documents = [];
    removeHUD();
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    elapsed = 0;
    gKeyTime = 0;
    documentsFound = 0;
    piratesEliminated = 0;
    setupKeys();
    setupClick();
    // Don't activate immediately - wait for G+S toggle
  }

  function update(delta) {
    if (!active || !shipGroup) return;
    elapsed += delta;

    // Ocean swell - bob the whole ship
    var swell = Math.sin(elapsed * 0.4) * 0.3;
    var roll = Math.sin(elapsed * 0.3) * 0.015;
    var pitch = Math.sin(elapsed * 0.25 + 0.5) * 0.008;
    shipGroup.position.y = swell;
    shipGroup.rotation.z = roll;
    shipGroup.rotation.x = pitch;

    // Swing lanterns
    for (var li = 0; li < lanternPivots.length; li++) {
      var pivot = lanternPivots[li];
      var swing = Math.sin(elapsed * 1.2 + pivot.userData.swingOffset) * 0.15;
      pivot.rotation.z = swing;

      // Update light position to follow pivot (approximate)
      if (lanterns[li]) {
        var worldPos = new THREE.Vector3();
        pivot.getWorldPosition(worldPos);
        lanterns[li].light.position.copy(worldPos);
        lanterns[li].light.position.y -= 0.7;
        // Flicker
        lanterns[li].light.intensity = 0.7 + Math.sin(elapsed * 7 + li) * 0.15 + Math.random() * 0.05;
      }
    }

    // Smoke particle animation
    for (var si = 0; si < smokeParticles.length; si++) {
      var sp = smokeParticles[si];
      sp.position.y += sp.userData.speed * delta;
      sp.position.x += sp.userData.drift * delta;
      sp.material.opacity = Math.max(0, 0.6 - (sp.position.y - 8) / 20);

      // Reset when too high or invisible
      if (sp.position.y > 22 || sp.material.opacity <= 0) {
        sp.position.set(
          sp.userData.funnelX + (Math.random() - 0.5) * 0.4,
          8.2 + Math.random() * 0.5,
          (Math.random() - 0.5) * 0.4
        );
        sp.material.opacity = 0.6;
        sp.userData.drift = (Math.random() - 0.5) * 0.3;
      }

      // Expand slightly
      var age = (sp.position.y - 8) / 14;
      var s = 1 + age * 1.5;
      sp.scale.set(s, s, s);
    }

    // Enemy patrol movement
    for (var ei = 0; ei < enemies.length; ei++) {
      var enemy = enemies[ei];
      if (enemy.userData.dead) continue;
      var walkCycle = Math.sin(elapsed * 1.5 + enemy.userData.walkOffset);
      // Patrol back and forth
      enemy.position.x = enemy.userData.baseX + Math.sin(elapsed * 0.5 + enemy.userData.walkOffset) * 2;
      // Bob while walking
      enemy.position.y = 2.7 + Math.abs(walkCycle) * 0.05;
      // Sway
      enemy.rotation.y = Math.sin(elapsed * 0.5 + enemy.userData.walkOffset) * 0.3;
      // Leg animation (approximate via group rotation)
      enemy.rotation.z = walkCycle * 0.03;

      // Face player direction occasionally
      var dx = camera.position.x - (shipGroup.position.x + enemy.position.x);
      var dz = camera.position.z - (shipGroup.position.z + enemy.position.z);
      var distToPlayer = Math.sqrt(dx * dx + dz * dz);
      if (distToPlayer < 15) {
        enemy.rotation.y = Math.atan2(dx, dz);
      }
    }

    // Animate documents - gentle float
    for (var di = 0; di < documents.length; di++) {
      var doc = documents[di];
      if (!doc.userData.collected) {
        doc.position.y = docBaseY(di) + Math.sin(elapsed * 2 + di) * 0.08;
        doc.rotation.y += delta * 0.5;
      }
    }
  }

  function docBaseY(idx) {
    var bases = [3.5, 3.0, 3.5];
    return bases[idx] || 3.5;
  }

  function reset() {
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }
    if (clickHandler) {
      document.removeEventListener('click', clickHandler);
      clickHandler = null;
    }
    if (active) {
      deactivate();
    } else {
      // Still remove any tracked objects
      for (var i = 0; i < sceneObjects.length; i++) {
        scene.remove(sceneObjects[i]);
      }
      sceneObjects = [];
    }
    removeHUD();
    elapsed = 0;
    gKeyTime = 0;
    documentsFound = 0;
    piratesEliminated = 0;
    active = false;
  }

  return { init: init, update: update, reset: reset };
}());
