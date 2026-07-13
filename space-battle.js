window.SpaceBattle = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var fighters = [];
  var missiles = [];
  var debris = [];
  var shieldMesh = null;
  var hudText = null;
  var lastHKeyTime = 0;
  var sKeyPressed = false;
  var shipIntegrity = 75;
  var alliedFighters = 3;
  var boardingTeam = 4;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    objects = [];
    fighters = [];
    missiles = [];
    debris = [];
    lastHKeyTime = 0;
    sKeyPressed = false;
    shipIntegrity = 75;
    alliedFighters = 3;
    boardingTeam = 4;

    // 1. Space void - large dark enclosure
    var voidGeometry = new THREE.BoxGeometry(600, 600, 600);
    var voidMaterial = new THREE.MeshBasicMaterial({ color: 0x020212, side: THREE.BackSide });
    var voidMesh = new THREE.Mesh(voidGeometry, voidMaterial);
    scene.add(voidMesh);

    // 2. Star dots - 30 tiny emissive white boxes
    for (var i = 0; i < 30; i++) {
      var starGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      var starMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, emissive: 0xFFFFFF });
      var starMesh = new THREE.Mesh(starGeometry, starMaterial);
      starMesh.position.set(
        (Math.random() - 0.5) * 600,
        (Math.random() - 0.5) * 600,
        (Math.random() - 0.5) * 600
      );
      scene.add(starMesh);
      objects.push(starMesh);
    }

    // 3. Allied capital ship - massive elongated box with superstructure
    var alliedShipGroup = new THREE.Group();
    var alliedHullGeometry = new THREE.BoxGeometry(120, 20, 30);
    var alliedHullMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
    var alliedHull = new THREE.Mesh(alliedHullGeometry, alliedHullMaterial);
    alliedHull.castShadow = true;
    alliedHull.receiveShadow = true;
    alliedShipGroup.add(alliedHull);
    objects.push(alliedHull);

    // Superstructure
    var superGeometry = new THREE.BoxGeometry(30, 15, 15);
    var superMaterial = new THREE.MeshStandardMaterial({ color: 0x0f3460 });
    var superMesh = new THREE.Mesh(superGeometry, superMaterial);
    superMesh.position.set(-30, 12, 0);
    alliedShipGroup.add(superMesh);
    objects.push(superMesh);

    // Turrets (4 small boxes)
    for (var t = 0; t < 4; t++) {
      var turretGeometry = new THREE.BoxGeometry(4, 4, 4);
      var turretMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0f });
      var turretMesh = new THREE.Mesh(turretGeometry, turretMaterial);
      turretMesh.position.set(-20 + t * 30, 15, 12 + (t % 2) * 8);
      alliedShipGroup.add(turretMesh);
      objects.push(turretMesh);
    }

    // Command bridge - emissive windows
    var bridgeGeometry = new THREE.BoxGeometry(12, 12, 8);
    var bridgeMaterial = new THREE.MeshStandardMaterial({ color: 0x0f3460, emissive: 0x00AA00 });
    var bridgeMesh = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridgeMesh.position.set(-40, 18, 0);
    alliedShipGroup.add(bridgeMesh);
    objects.push(bridgeMesh);

    alliedShipGroup.position.set(-80, 0, -100);
    scene.add(alliedShipGroup);

    // 4. Enemy capital ship - angular gray
    var enemyShipGroup = new THREE.Group();
    var enemyHullGeometry = new THREE.BoxGeometry(120, 20, 30);
    var enemyHullMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a5a });
    var enemyHull = new THREE.Mesh(enemyHullGeometry, enemyHullMaterial);
    enemyHull.castShadow = true;
    enemyHull.receiveShadow = true;
    enemyShipGroup.add(enemyHull);
    objects.push(enemyHull);

    // Enemy superstructure - more angular
    var enemySuperGeometry = new THREE.BoxGeometry(25, 18, 12);
    var enemySuperMaterial = new THREE.MeshStandardMaterial({ color: 0x6a6a7a });
    var enemySuperMesh = new THREE.Mesh(enemySuperGeometry, enemySuperMaterial);
    enemySuperMesh.position.set(30, 14, 0);
    alliedShipGroup.add(enemySuperMesh);
    enemyShipGroup.add(enemySuperMesh);
    objects.push(enemySuperMesh);

    // Enemy turrets
    for (var et = 0; et < 3; et++) {
      var eturretGeometry = new THREE.BoxGeometry(5, 3, 5);
      var eturretMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a6a });
      var eturretMesh = new THREE.Mesh(eturretGeometry, eturretMaterial);
      eturretMesh.position.set(20 + et * 25, 16, 14 - et * 6);
      enemyShipGroup.add(eturretMesh);
      objects.push(eturretMesh);
    }

    enemyShipGroup.position.set(80, 0, -100);
    scene.add(enemyShipGroup);

    // 5. Allied fighter craft - 3 small delta-wing boxes
    for (var af = 0; af < 3; af++) {
      var fighterGroup = new THREE.Group();

      // Fighter body
      var fBodyGeometry = new THREE.BoxGeometry(8, 3, 3);
      var fBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
      var fBody = new THREE.Mesh(fBodyGeometry, fBodyMaterial);
      fighterGroup.add(fBody);
      objects.push(fBody);

      // Engine glow sphere
      var engGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      var engMaterial = new THREE.MeshBasicMaterial({ color: 0x00CCFF, emissive: 0x00CCFF });
      var engMesh = new THREE.Mesh(engGeometry, engMaterial);
      engMesh.position.set(4, 0, 0);
      fighterGroup.add(engMesh);
      objects.push(engMesh);

      // Wing boxes
      var wingGeometry = new THREE.BoxGeometry(2, 1, 8);
      var wingMaterial = new THREE.MeshStandardMaterial({ color: 0x0f3460 });
      var wingL = new THREE.Mesh(wingGeometry, wingMaterial);
      wingL.position.set(-2, 0, -5);
      fighterGroup.add(wingL);
      objects.push(wingL);

      var wingR = new THREE.Mesh(wingGeometry, wingMaterial);
      wingR.position.set(-2, 0, 5);
      fighterGroup.add(wingR);
      objects.push(wingR);

      fighterGroup.position.set(-60 + af * 15, -20 - af * 10, -80 + af * 20);
      scene.add(fighterGroup);
      fighters.push({ mesh: fighterGroup, time: 0, index: af });
    }

    // 6. Enemy fighter craft - 3 more angular
    for (var ef = 0; ef < 3; ef++) {
      var efighterGroup = new THREE.Group();

      var efBodyGeometry = new THREE.BoxGeometry(7, 2.5, 2.5);
      var efBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a6a });
      var efBody = new THREE.Mesh(efBodyGeometry, efBodyMaterial);
      efighterGroup.add(efBody);
      objects.push(efBody);

      var eengGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      var eengMaterial = new THREE.MeshBasicMaterial({ color: 0xFF6600, emissive: 0xFF6600 });
      var eengMesh = new THREE.Mesh(eengGeometry, eengMaterial);
      eengMesh.position.set(3.5, 0, 0);
      efighterGroup.add(eengMesh);
      objects.push(eengMesh);

      var ewingGeometry = new THREE.BoxGeometry(1.5, 1, 7);
      var ewingMaterial = new THREE.MeshStandardMaterial({ color: 0x6a6a7a });
      var ewingL = new THREE.Mesh(ewingGeometry, ewingMaterial);
      ewingL.position.set(-1.5, 0, -4);
      efighterGroup.add(ewingL);
      objects.push(ewingL);

      var ewingR = new THREE.Mesh(ewingGeometry, ewingMaterial);
      ewingR.position.set(-1.5, 0, 4);
      efighterGroup.add(ewingR);
      objects.push(ewingR);

      efighterGroup.position.set(50 + ef * 15, 15 + ef * 12, -90 + ef * 25);
      scene.add(efighterGroup);
      fighters.push({ mesh: efighterGroup, time: 0, index: ef + 3 });
    }

    // 7. Laser cannon fire - thin bright emissive beams
    var laserGeometry = new THREE.BoxGeometry(0.3, 0.3, 60);
    var laserMaterial = new THREE.MeshBasicMaterial({ color: 0xFF00FF, emissive: 0xFF00FF });
    var laserMesh = new THREE.Mesh(laserGeometry, laserMaterial);
    laserMesh.position.set(0, 5, -50);
    scene.add(laserMesh);
    objects.push(laserMesh);

    var laser2Geometry = new THREE.BoxGeometry(0.3, 0.3, 70);
    var laser2Material = new THREE.MeshBasicMaterial({ color: 0x00FF00, emissive: 0x00FF00 });
    var laser2Mesh = new THREE.Mesh(laser2Geometry, laser2Material);
    laser2Mesh.position.set(10, -3, -60);
    scene.add(laser2Mesh);
    objects.push(laser2Mesh);

    // 8. Missile trails - thin white emissive box + orange exhaust sphere
    var missileGeometry = new THREE.BoxGeometry(0.5, 0.5, 8);
    var missileMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, emissive: 0xFFFFFF });
    var missileMesh = new THREE.Mesh(missileGeometry, missileMaterial);
    missileMesh.position.set(-20, 8, -70);
    scene.add(missileMesh);
    missiles.push({ mesh: missileMesh, time: 0 });
    objects.push(missileMesh);

    var exhaustGeometry = new THREE.BoxGeometry(2, 2, 2);
    var exhaustMaterial = new THREE.MeshBasicMaterial({ color: 0xFF6600, emissive: 0xFF6600 });
    var exhaustMesh = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaustMesh.position.set(-20, 8, -75);
    scene.add(exhaustMesh);
    objects.push(exhaustMesh);

    // 9. Debris field - 20 assorted floating box chunks
    for (var d = 0; d < 20; d++) {
      var debrisGeometry = new THREE.BoxGeometry(
        Math.random() * 3 + 1,
        Math.random() * 3 + 1,
        Math.random() * 3 + 1
      );
      var debrisMaterial = new THREE.MeshStandardMaterial({ color: 0x333344 });
      var debrisMesh = new THREE.Mesh(debrisGeometry, debrisMaterial);
      debrisMesh.position.set(
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 150 - 60
      );
      debrisMesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      scene.add(debrisMesh);
      debris.push({
        mesh: debrisMesh,
        rotX: Math.random() * 0.02 - 0.01,
        rotY: Math.random() * 0.02 - 0.01,
        rotZ: Math.random() * 0.02 - 0.01
      });
      objects.push(debrisMesh);
    }

    // 10. Ship hull breach - dark recessed gap + flickering fire
    var breachGeometry = new THREE.BoxGeometry(20, 15, 0.1);
    var breachMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    var breachMesh = new THREE.Mesh(breachGeometry, breachMaterial);
    breachMesh.position.set(-70, 0, 15.5);
    scene.add(breachMesh);
    objects.push(breachMesh);

    // Flickering fire effect
    var fireGeometry = new THREE.BoxGeometry(15, 12, 2);
    var fireMaterial = new THREE.MeshBasicMaterial({ color: 0xFF4400, emissive: 0xFF2200 });
    var fireMesh = new THREE.Mesh(fireGeometry, fireMaterial);
    fireMesh.position.set(-70, 0, 16);
    scene.add(fireMesh);
    objects.push(fireMesh);

    // 11. Boarding pods - 3 small cylinders as boxes attached to enemy ship
    for (var bp = 0; bp < 3; bp++) {
      var podGeometry = new THREE.BoxGeometry(5, 3, 8);
      var podMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a3a });
      var podMesh = new THREE.Mesh(podGeometry, podMaterial);
      podMesh.position.set(70 + bp * 12, -8 - bp * 3, 20);
      scene.add(podMesh);
      objects.push(podMesh);
    }

    // 12. Space soldier figures - 4 pressurized suits as boxes in breach
    for (var ss = 0; ss < 4; ss++) {
      var soldierGeometry = new THREE.BoxGeometry(2, 4, 1.5);
      var soldierMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0f, emissive: 0x0033FF });
      var soldierMesh = new THREE.Mesh(soldierGeometry, soldierMaterial);
      soldierMesh.position.set(-70 + ss * 6 - 9, -8 + ss * 2, 15);
      scene.add(soldierMesh);
      objects.push(soldierMesh);
    }

    // 13. Engine nacelles - box cluster with emissive blue glow at ship rear
    var nacelleGroup = new THREE.Group();
    for (var n = 0; n < 3; n++) {
      var nacelleGeometry = new THREE.BoxGeometry(8, 8, 12);
      var nacelleMaterial = new THREE.MeshStandardMaterial({ color: 0x1a3a4a, emissive: 0x0066FF });
      var nacelleMesh = new THREE.Mesh(nacelleGeometry, nacelleMaterial);
      nacelleMesh.position.set(55 + n * 12, -10 + n * 6, 0);
      nacelleGroup.add(nacelleMesh);
      objects.push(nacelleMesh);
    }
    nacelleGroup.position.set(0, 0, -100);
    scene.add(nacelleGroup);

    // 14. Shield effect - flickering semi-transparent box overlaying allied ship
    var shieldGeometry = new THREE.BoxGeometry(125, 25, 35);
    var shieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x0066FF,
      emissive: 0x0066FF,
      transparent: true,
      opacity: 0.15,
      wireframe: false
    });
    shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
    shieldMesh.position.set(-80, 0, -100);
    scene.add(shieldMesh);

    // 15. Asteroid cluster - 3 large irregular rock formations
    for (var ac = 0; ac < 3; ac++) {
      var asteroidGroup = new THREE.Group();
      var asteroidCount = 4 + ac;
      for (var a = 0; a < asteroidCount; a++) {
        var astGeometry = new THREE.BoxGeometry(
          Math.random() * 8 + 4,
          Math.random() * 8 + 4,
          Math.random() * 8 + 4
        );
        var astMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a3a, roughness: 0.8 });
        var astMesh = new THREE.Mesh(astGeometry, astMaterial);
        astMesh.position.set(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        );
        asteroidGroup.add(astMesh);
        objects.push(astMesh);
      }
      asteroidGroup.position.set(
        (ac - 1) * 80 - 40,
        40 + ac * 30,
        -120 - ac * 50
      );
      scene.add(asteroidGroup);
    }

    // Setup keyboard listeners for HUD toggle
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Create HUD text
    createHUD();
  }

  function handleKeyDown(evt) {
    var now = Date.now();
    if (evt.key === 'h' || evt.key === 'H') {
      if (now - lastHKeyTime < 400) {
        sKeyPressed = true;
      }
      lastHKeyTime = now;
    } else if (evt.key === 's' || evt.key === 'S') {
      if (now - lastHKeyTime < 400) {
        sKeyPressed = true;
      }
    }
  }

  function handleKeyUp(evt) {
    if (evt.key === 's' || evt.key === 'S') {
      sKeyPressed = false;
    }
  }

  function createHUD() {
    if (hudText) return;
    var canvas = document.createElement('canvas');
    var width = 256;
    var height = 128;
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('SHIP INTEGRITY: ' + shipIntegrity + '%', 10, 30);
    ctx.fillText('FIGHTERS: ' + alliedFighters + '/3', 10, 60);
    ctx.fillText('BOARDING TEAM: ' + boardingTeam, 10, 90);

    var texture = new THREE.CanvasTexture(canvas);
    var geometry = new THREE.BoxGeometry(40, 20, 0.1);
    var material = new THREE.MeshBasicMaterial({ map: texture });
    hudText = new THREE.Mesh(geometry, material);
    hudText.position.set(-180, 140, 0);
    scene.add(hudText);
  }

  function update(delta) {
    if (!scene || !camera) return;

    // Update debris - rotate and drift
    for (var i = 0; i < debris.length; i++) {
      var d = debris[i];
      d.mesh.rotation.x += d.rotX;
      d.mesh.rotation.y += d.rotY;
      d.mesh.rotation.z += d.rotZ;
      d.mesh.position.x += Math.sin(Date.now() * 0.0001 + i) * 0.05;
      d.mesh.position.z += Math.cos(Date.now() * 0.00008 + i) * 0.05;
    }

    // Update fighters - orbit in attack patterns
    for (var f = 0; f < fighters.length; f++) {
      var fighter = fighters[f];
      fighter.time += delta;
      var angle = fighter.time * (f < 3 ? 0.3 : -0.4);
      var radius = 40 + f * 5;
      var centerX = f < 3 ? -80 : 80;
      var centerZ = -80;
      fighter.mesh.position.x = centerX + Math.cos(angle) * radius;
      fighter.mesh.position.z = centerZ + Math.sin(angle) * radius;
      fighter.mesh.position.y = -20 + Math.sin(fighter.time * 1.5) * 10;
    }

    // Pulse laser beams
    var laserIntensity = 0.5 + Math.sin(Date.now() * 0.01) * 0.5;
    for (var l = 0; l < scene.children.length; l++) {
      var child = scene.children[l];
      if (child.material && child.material.emissive) {
        if (child.material.color.getHex() === 0xFF00FF || child.material.color.getHex() === 0x00FF00) {
          child.material.emissive.setHex(child.material.color.getHex());
          child.material.opacity = laserIntensity;
        }
      }
    }

    // Animate missiles
    for (var m = 0; m < missiles.length; m++) {
      var missile = missiles[m];
      missile.time += delta;
      missile.mesh.position.x += 0.8;
      missile.mesh.position.z -= 0.5;
      if (missile.mesh.position.x > 100) {
        missile.time = 0;
        missile.mesh.position.set(-20, 8, -70);
      }
    }

    // Shield flicker
    if (shieldMesh) {
      var shieldOpacity = 0.1 + Math.random() * 0.1;
      shieldMesh.material.opacity = shieldOpacity;
    }

    // Engine nacelle glow pulse
    for (var e = 0; e < scene.children.length; e++) {
      var obj = scene.children[e];
      if (obj.material && obj.material.emissive) {
        if (obj.material.color.getHex() === 0x0066FF) {
          var pulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
          obj.material.opacity = pulse;
        }
      }
    }

    // Update HUD text
    if (hudText) {
      var canvas = hudText.material.map.image;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00FF00';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('SHIP INTEGRITY: ' + Math.max(0, shipIntegrity) + '%', 10, 30);
      ctx.fillText('FIGHTERS: ' + Math.max(0, alliedFighters) + '/3', 10, 60);
      ctx.fillText('BOARDING TEAM: ' + Math.max(0, boardingTeam), 10, 90);
      hudText.material.map.needsUpdate = true;
    }
  }

  function reset() {
    shipIntegrity = 75;
    alliedFighters = 3;
    boardingTeam = 4;
    lastHKeyTime = 0;
    sKeyPressed = false;

    // Reset all fighter positions
    for (var f = 0; f < fighters.length; f++) {
      fighters[f].time = 0;
      if (f < 3) {
        fighters[f].mesh.position.set(-60 + f * 15, -20 - f * 10, -80 + f * 20);
      } else {
        fighters[f].mesh.position.set(50 + (f - 3) * 15, 15 + (f - 3) * 12, -90 + (f - 3) * 25);
      }
    }

    // Reset missiles
    for (var m = 0; m < missiles.length; m++) {
      missiles[m].time = 0;
      missiles[m].mesh.position.set(-20, 8, -70);
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
