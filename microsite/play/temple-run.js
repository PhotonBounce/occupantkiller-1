window.TempleRun = (function() {
  'use strict';

  // State
  var scene = null;
  var camera = null;
  var allObjects = [];
  var enemies = [];
  var projectiles = [];
  var state = {
    relicSecured: false,
    smugglersEliminated: 0,
    trapsBisarmed: 0,
    keybindsPressed: [],
    hudElement: null,
    lastTime: 0
  };

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    allObjects = [];
    enemies = [];
    projectiles = [];

    state.relicSecured = false;
    state.smugglersEliminated = 0;
    state.trapsBisarmed = 0;
    state.keybindsPressed = [];
    state.lastTime = Date.now();

    // Fog and lighting
    scene.fog = new THREE.Fog(0x2d5016, 100, 300);
    scene.background = new THREE.Color(0x1a3d0a);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xccbb99, 0.6);
    scene.add(ambientLight);
    allObjects.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffee, 0.8);
    directionalLight.position.set(50, 80, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    allObjects.push(directionalLight);

    // Main temple tower (prasat) - stacked boxes narrowing with cone top
    var towerGroup = createTempleGrp();
    scene.add(towerGroup);
    allObjects.push(towerGroup);

    // Inner sanctuary hall (long corridor)
    var hallGrp = createSanctuaryHall();
    scene.add(hallGrp);
    allObjects.push(hallGrp);

    // Ornate gate gopura
    var gateGrp = createGopuraGate();
    scene.add(gateGrp);
    allObjects.push(gateGrp);

    // Moat
    var moatGrp = createMoat();
    scene.add(moatGrp);
    allObjects.push(moatGrp);

    // Stone bridge
    var bridgeGrp = createBridge();
    scene.add(bridgeGrp);
    allObjects.push(bridgeGrp);

    // Jungle vines
    var vinesGrp = createVines();
    scene.add(vinesGrp);
    allObjects.push(vinesGrp);

    // Bas-relief walls
    var basReliefGrp = createBasRelief();
    scene.add(basReliefGrp);
    allObjects.push(basReliefGrp);

    // Reflecting pool
    var poolGrp = createReflectingPool();
    scene.add(poolGrp);
    allObjects.push(poolGrp);

    // Incense burner
    var incenseGrp = createIncenseBurner();
    scene.add(incenseGrp);
    allObjects.push(incenseGrp);

    // Stone naga balustrade
    var nagaGrp = createNagaBalustrade();
    scene.add(nagaGrp);
    allObjects.push(nagaGrp);

    // Artifact pedestal with golden relic
    var artifactGrp = createArtifactPedestal();
    scene.add(artifactGrp);
    allObjects.push(artifactGrp);

    // Tree roots
    var rootsGrp = createTreeRoots();
    scene.add(rootsGrp);
    allObjects.push(rootsGrp);

    // Meditation pavilion
    var pavilionGrp = createPavilion();
    scene.add(pavilionGrp);
    allObjects.push(pavilionGrp);

    // Library tower
    var libraryGrp = createLibraryTower();
    scene.add(libraryGrp);
    allObjects.push(libraryGrp);

    // Face tower
    var faceGrp = createFaceTower();
    scene.add(faceGrp);
    allObjects.push(faceGrp);

    // Create enemies
    createEnemies();

    // Setup HUD
    setupHUD();

    // Setup keyboard listening
    document.addEventListener('keydown', onKeyDown);
  }

  function createTempleGrp() {
    var group = new THREE.Group();
    var mats = {
      stone: new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xccaa00, roughness: 0.4 })
    };

    // Base tier
    var base = new THREE.Mesh(new THREE.BoxGeometry(40, 8, 40), mats.stone);
    base.position.y = 4;
    group.add(base);

    // Middle tier
    var mid = new THREE.Mesh(new THREE.BoxGeometry(28, 6, 28), mats.stone);
    mid.position.y = 16;
    group.add(mid);

    // Upper tier
    var upper = new THREE.Mesh(new THREE.BoxGeometry(16, 5, 16), mats.stone);
    upper.position.y = 25;
    group.add(upper);

    // Cone top
    var cone = new THREE.Mesh(new THREE.ConeGeometry(8, 12, 32), mats.gold);
    cone.position.y = 35;
    group.add(cone);

    group.position.set(0, 0, -60);
    return group;
  }

  function createSanctuaryHall() {
    var group = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.9 });
    var hallGeom = new THREE.BoxGeometry(18, 12, 50);
    var hall = new THREE.Mesh(hallGeom, mat);
    hall.position.set(0, 6, 10);
    group.add(hall);
    return group;
  }

  function createGopuraGate() {
    var group = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.9 });

    // Gate frame
    var gate = new THREE.Mesh(new THREE.BoxGeometry(20, 18, 4), mat);
    gate.position.set(30, 9, 0);
    group.add(gate);

    // Cylinder columns
    var colMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.8 });
    var colGeom = new THREE.CylinderGeometry(2, 2, 16, 16);
    var col1 = new THREE.Mesh(colGeom, colMat);
    col1.position.set(22, 8, 0);
    group.add(col1);

    var col2 = new THREE.Mesh(colGeom, colMat);
    col2.position.set(38, 8, 0);
    group.add(col2);

    return group;
  }

  function createMoat() {
    var group = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: 0x2d5016, roughness: 0.3 });
    var water = new THREE.Mesh(new THREE.BoxGeometry(120, 2, 120), mat);
    water.position.y = -5;
    group.add(water);
    return group;
  }

  function createBridge() {
    var group = new THREE.Group();
    var stoneMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });

    // Bridge deck
    var deck = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 30), stoneMat);
    deck.position.set(0, 0, 0);
    group.add(deck);

    // Rail posts
    var postMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.9 });
    var postGeom = new THREE.CylinderGeometry(1, 1, 3, 8);
    var post1 = new THREE.Mesh(postGeom, postMat);
    post1.position.set(-6, 2, -12);
    group.add(post1);

    var post2 = new THREE.Mesh(postGeom, postMat);
    post2.position.set(6, 2, -12);
    group.add(post2);

    var post3 = new THREE.Mesh(postGeom, postMat);
    post3.position.set(-6, 2, 12);
    group.add(post3);

    var post4 = new THREE.Mesh(postGeom, postMat);
    post4.position.set(6, 2, 12);
    group.add(post4);

    return group;
  }

  function createVines() {
    var group = new THREE.Group();
    var mat = new THREE.LineBasicMaterial({ color: 0x4a7c3e });

    // Hanging vines
    for (var i = 0; i < 8; i++) {
      var points = [];
      var startX = -40 + i * 10;
      points.push(new THREE.Vector3(startX, 30, 20));
      points.push(new THREE.Vector3(startX + 2, 15, 22));
      points.push(new THREE.Vector3(startX, 0, 20));

      var geom = new THREE.BufferGeometry().setFromPoints(points);
      var vine = new THREE.LineSegments(geom, mat);
      group.add(vine);
    }

    return group;
  }

  function createBasRelief() {
    var group = new THREE.Group();
    var stoneMat = new THREE.MeshStandardMaterial({ color: 0x7a6f5d, roughness: 0.95 });

    // Wall panels
    var panel = new THREE.Mesh(new THREE.BoxGeometry(16, 8, 1), stoneMat);
    panel.position.set(-35, 8, 5);
    group.add(panel);

    var panel2 = new THREE.Mesh(new THREE.BoxGeometry(16, 8, 1), stoneMat);
    panel2.position.set(35, 8, 5);
    group.add(panel2);

    // Relief carvings (simple lines)
    var carveLineMat = new THREE.LineBasicMaterial({ color: 0x666666 });
    var carvePts = [];
    carvePts.push(new THREE.Vector3(-32, 10, 5.1));
    carvePts.push(new THREE.Vector3(-28, 6, 5.1));
    var carveGeom = new THREE.BufferGeometry().setFromPoints(carvePts);
    var carve = new THREE.LineSegments(carveGeom, carveLineMat);
    group.add(carve);

    return group;
  }

  function createReflectingPool() {
    var group = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: 0x1e4d6b, roughness: 0.2 });
    var pool = new THREE.Mesh(new THREE.BoxGeometry(20, 1, 20), mat);
    pool.position.set(0, -1, 35);
    group.add(pool);
    return group;
  }

  function createIncenseBurner() {
    var group = new THREE.Group();
    var bronzeMat = new THREE.MeshStandardMaterial({ color: 0xa0826d, roughness: 0.6 });

    // Pedestal
    var pedestal = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 6), bronzeMat);
    pedestal.position.set(-30, 1.5, 0);
    group.add(pedestal);

    // Burner cylinder
    var burnerMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8 });
    var burner = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 4, 16), burnerMat);
    burner.position.set(-30, 5, 0);
    group.add(burner);

    // Smoke (animated thin cylinder)
    burner.userData.smoke = true;
    burner.userData.smokeScale = 0.1;

    return group;
  }

  function createNagaBalustrade() {
    var group = new THREE.Group();
    var serpentMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.8 });

    // Naga body (cylinder)
    var body = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 16, 8), serpentMat);
    body.position.set(30, 5, -20);
    body.rotation.z = Math.PI / 6;
    group.add(body);

    // Naga head (sphere)
    var headMat = new THREE.MeshStandardMaterial({ color: 0xaa8844, roughness: 0.7 });
    var head = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 16), headMat);
    head.position.set(30, 14, -20);
    group.add(head);

    // Secondary head
    var head2 = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 16), headMat);
    head2.position.set(28, 12, -18);
    group.add(head2);

    return group;
  }

  function createArtifactPedestal() {
    var group = new THREE.Group();
    group.userData.isArtifact = true;
    group.userData.glowPulse = 0;

    var stoneMat = new THREE.MeshStandardMaterial({ color: 0x6b5d4a, roughness: 0.9 });
    var pedestal = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 5), stoneMat);
    pedestal.position.set(0, 2, -60);
    group.add(pedestal);

    var goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, emissive: 0xffaa00 });
    var relic = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 32), goldMat);
    relic.position.set(0, 7, -60);
    group.add(relic);

    return group;
  }

  function createTreeRoots() {
    var group = new THREE.Group();
    var rootMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.95 });

    // Organic root cluster
    for (var i = 0; i < 4; i++) {
      var root = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.5, 8, 6), rootMat);
      root.position.set(-25 + i * 3, 4, 15);
      root.rotation.z = (Math.PI / 6) * i;
      group.add(root);
    }

    return group;
  }

  function createPavilion() {
    var group = new THREE.Group();
    var pillarMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.9 });
    var roofMat = new THREE.MeshStandardMaterial({ color: 0xa0826d, roughness: 0.8 });

    // Roof (box)
    var roof = new THREE.Mesh(new THREE.BoxGeometry(15, 2, 15), roofMat);
    roof.position.set(30, 14, 30);
    group.add(roof);

    // Pillars (cylinders)
    for (var i = 0; i < 4; i++) {
      var px = 30 + (i % 2) * 12 - 6;
      var pz = 30 + Math.floor(i / 2) * 12 - 6;
      var pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 12, 12), pillarMat);
      pillar.position.set(px, 6, pz);
      group.add(pillar);
    }

    return group;
  }

  function createLibraryTower() {
    var group = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: 0x7a6f5d, roughness: 0.95 });

    // Tall narrow tower
    var tower = new THREE.Mesh(new THREE.BoxGeometry(8, 25, 8), mat);
    tower.position.set(-40, 12.5, -30);
    group.add(tower);

    return group;
  }

  function createFaceTower() {
    var group = new THREE.Group();
    var stoneMat = new THREE.MeshStandardMaterial({ color: 0x9a8f7e, roughness: 0.9 });
    var faceMat = new THREE.MeshStandardMaterial({ color: 0xb8a090, roughness: 0.85 });

    // Main tower
    var tower = new THREE.Mesh(new THREE.BoxGeometry(10, 20, 10), stoneMat);
    tower.position.set(40, 10, 30);
    group.add(tower);

    // Face (cylinder eyes)
    var eye1 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.5, 16), faceMat);
    eye1.position.set(37, 18, 30);
    group.add(eye1);

    var eye2 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.5, 16), faceMat);
    eye2.position.set(43, 18, 30);
    group.add(eye2);

    return group;
  }

  function createEnemies() {
    enemies = [];
    var khakiMat = new THREE.MeshStandardMaterial({ color: 0xc9b785, roughness: 0.7 });

    // 12 enemies
    for (var i = 0; i < 12; i++) {
      var enemy = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2), khakiMat);
      var angle = (i / 12) * Math.PI * 2;
      enemy.position.set(Math.cos(angle) * 30, 2, Math.sin(angle) * 30);
      enemy.userData.alive = true;
      enemy.userData.angle = angle;
      scene.add(enemy);
      allObjects.push(enemy);
      enemies.push(enemy);
    }
  }

  function setupHUD() {
    if (state.hudElement) {
      document.body.removeChild(state.hudElement);
    }

    var hud = document.createElement('div');
    hud.id = 'temple-run-hud';
    hud.style.cssText = 'position: fixed; top: 20px; left: 20px; color: #4a7c3e; font-family: monospace; font-size: 14px; line-height: 1.6; text-shadow: 1px 1px 2px rgba(0,0,0,0.5); z-index: 100; pointer-events: none;';
    hud.innerHTML = '<div>RELIC SECURED: ' + (state.relicSecured ? 'YES' : 'NO') + '</div>' +
                    '<div>SMUGGLERS ELIMINATED: ' + state.smugglersEliminated + '/12</div>' +
                    '<div>TEMPLE TRAPS DISARMED: ' + state.trapsBisarmed + '/3</div>';
    document.body.appendChild(hud);
    state.hudElement = hud;
  }

  function updateHUD() {
    if (state.hudElement) {
      state.hudElement.innerHTML = '<div>RELIC SECURED: ' + (state.relicSecured ? 'YES' : 'NO') + '</div>' +
                                   '<div>SMUGGLERS ELIMINATED: ' + state.smugglersEliminated + '/12</div>' +
                                   '<div>TEMPLE TRAPS DISARMED: ' + state.trapsBisarmed + '/3</div>';
    }
  }

  function onKeyDown(event) {
    var key = event.key.toUpperCase();
    state.keybindsPressed.push(key);

    // Keep only last 2 keys and reset after 400ms
    if (state.keybindsPressed.length > 2) {
      state.keybindsPressed.shift();
    }

    // Check for T+R combo
    if (state.keybindsPressed.length >= 2) {
      var last2 = state.keybindsPressed.slice(-2);
      if (last2[0] === 'T' && last2[1] === 'R') {
        toggleGameMode();
        state.keybindsPressed = [];
      }
    }

    // Reset keybinds after 400ms
    setTimeout(function() {
      if (state.keybindsPressed.length > 0) {
        state.keybindsPressed = [];
      }
    }, 400);
  }

  function toggleGameMode() {
    var notification = document.createElement('div');
    notification.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: #4a7c3e; padding: 20px 40px; font-family: monospace; font-size: 16px; z-index: 200; pointer-events: none; border: 2px solid #4a7c3e;';
    notification.textContent = 'GAME MODE TOGGLED';
    document.body.appendChild(notification);

    setTimeout(function() {
      document.body.removeChild(notification);
    }, 1500);
  }

  function update(delta) {
    if (!scene || !camera) return;

    // Update artifact glow/pulse
    for (var i = 0; i < allObjects.length; i++) {
      var obj = allObjects[i];
      if (obj.userData && obj.userData.isArtifact) {
        obj.userData.glowPulse += delta * 2;
        var scale = 0.9 + Math.sin(obj.userData.glowPulse) * 0.1;
        obj.children.forEach(function(child) {
          if (child.geometry instanceof THREE.SphereGeometry) {
            child.scale.set(scale, scale, scale);
          }
        });
      }

      // Update smoke effect
      if (obj.userData && obj.userData.smoke) {
        obj.userData.smokeScale += delta * 0.1;
        obj.scale.y = 0.1 + Math.sin(obj.userData.smokeScale) * 0.05;
      }
    }

    // Animate enemies
    for (var j = 0; j < enemies.length; j++) {
      var enemy = enemies[j];
      if (enemy.userData.alive) {
        enemy.userData.angle += delta * 0.3;
        enemy.position.x = Math.cos(enemy.userData.angle) * 30;
        enemy.position.z = Math.sin(enemy.userData.angle) * 30;
        enemy.rotation.y += delta * 0.5;
      }
    }

    // Periodically shoot trap arrows
    if (Math.random() < 0.01) {
      shootTrapArrow();
    }

    updateHUD();
  }

  function shootTrapArrow() {
    var arrowMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.7 });
    var arrow = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), arrowMat);
    arrow.position.set(-35 + Math.random() * 20, 10, -20 + Math.random() * 40);
    arrow.velocity = new THREE.Vector3(
      Math.random() * 2 - 1,
      -0.5,
      Math.random() * 2 - 1
    );
    scene.add(arrow);
    allObjects.push(arrow);
    projectiles.push(arrow);
  }

  function reset() {
    // Remove all objects
    for (var i = allObjects.length - 1; i >= 0; i--) {
      var obj = allObjects[i];
      if (scene && obj.parent === scene) {
        scene.remove(obj);
      }
    }
    allObjects = [];
    enemies = [];
    projectiles = [];

    state.relicSecured = false;
    state.smugglersEliminated = 0;
    state.trapsBisarmed = 0;
    state.keybindsPressed = [];

    if (state.hudElement && state.hudElement.parentNode) {
      document.body.removeChild(state.hudElement);
      state.hudElement = null;
    }

    document.removeEventListener('keydown', onKeyDown);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
