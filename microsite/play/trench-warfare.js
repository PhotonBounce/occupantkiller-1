window.TrenchWarfare = (function() {
  'use strict';

  var scene, camera, container = {};
  var alliedTrench, enemyTrench, noManLand;
  var infantryGroup, enemyDefenders, explosionGroup;
  var balloonGroup, gasCloud, machineGunNest;
  var signalFlare, stretchers, hudCanvas, hudContext;
  var advance = 0, casualties = 0;
  var clock = new THREE.Clock();

  var stats = {
    advance: 0,
    casualties: 0,
    gasAlert: true
  };

  var keysPressed = {};
  var lastHKey = 0, lastTKey = 0;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    // Event listeners for HUD toggle
    window.addEventListener('keydown', function(e) {
      keysPressed[e.key] = true;
      if (e.key === 'h' || e.key === 'H') {
        lastHKey = Date.now();
      }
      if (e.key === 't' || e.key === 'T') {
        lastTKey = Date.now();
      }
    });
    window.addEventListener('keyup', function(e) {
      keysPressed[e.key] = false;
    });

    // Create HUD canvas
    createHUD();

    // 1. Muddy no-man's land ground
    var groundGeom = new THREE.BoxGeometry(400, 0.3, 400);
    var groundMat = new THREE.MeshStandardMaterial({ color: 0x4a3520 });
    noManLand = new THREE.Mesh(groundGeom, groundMat);
    noManLand.position.y = -2;
    scene.add(noManLand);

    // 2. Allied trench system - zigzag recessed channels
    alliedTrench = new THREE.Group();
    var trenchMat = new THREE.MeshStandardMaterial({ color: 0x5a4030 });
    var trenchOuterMat = new THREE.MeshStandardMaterial({ color: 0x3a2820 });

    // Main trench channel
    var trenchChannelGeom = new THREE.BoxGeometry(120, 3, 8);
    var trenchChannel1 = new THREE.Mesh(trenchChannelGeom, trenchMat);
    trenchChannel1.position.set(-60, -1.5, -60);
    alliedTrench.add(trenchChannel1);

    var trenchChannel2 = new THREE.Mesh(trenchChannelGeom, trenchMat);
    trenchChannel2.position.set(-60, -1.5, -40);
    alliedTrench.add(trenchChannel2);

    var trenchChannel3 = new THREE.Mesh(trenchChannelGeom, trenchMat);
    trenchChannel3.position.set(-60, -1.5, -20);
    alliedTrench.add(trenchChannel3);

    // Connecting traverses
    var traverseGeom = new THREE.BoxGeometry(8, 3, 20);
    var traverse1 = new THREE.Mesh(traverseGeom, trenchMat);
    traverse1.position.set(-20, -1.5, -50);
    alliedTrench.add(traverse1);

    var traverse2 = new THREE.Mesh(traverseGeom, trenchMat);
    traverse2.position.set(20, -1.5, -30);
    alliedTrench.add(traverse2);

    // Trench walls (rim)
    var wallGeom = new THREE.BoxGeometry(140, 0.5, 30);
    var wall1 = new THREE.Mesh(wallGeom, trenchOuterMat);
    wall1.position.set(-60, 0.5, -40);
    alliedTrench.add(wall1);

    var wall2 = new THREE.Mesh(wallGeom, trenchOuterMat);
    wall2.position.set(-60, 0.5, -40);
    wall2.rotation.z = Math.PI / 2;
    alliedTrench.add(wall2);

    scene.add(alliedTrench);

    // 3. Enemy trench line - 60 units away
    enemyTrench = new THREE.Group();
    var enemyChannelGeom = new THREE.BoxGeometry(140, 3, 10);
    var enemyChannel = new THREE.Mesh(enemyChannelGeom, trenchMat);
    enemyChannel.position.set(-70, -1.5, 60);
    enemyTrench.add(enemyChannel);

    var enemyWallGeom = new THREE.BoxGeometry(160, 0.5, 35);
    var enemyWall = new THREE.Mesh(enemyWallGeom, trenchOuterMat);
    enemyWall.position.set(-70, 0.5, 60);
    enemyTrench.add(enemyWall);

    scene.add(enemyTrench);

    // 4. Shell craters (10 total)
    var craterPositions = [
      [0, -1.8, 0], [40, -1.8, 20], [-40, -1.8, 10], [60, -1.8, -30],
      [-60, -1.8, 40], [20, -1.8, -20], [-20, -1.8, -40], [80, -1.8, 0],
      [-80, -1.8, 50], [0, -1.8, -50]
    ];

    var craterRimMat = new THREE.MeshStandardMaterial({ color: 0x6a5a4a });
    var craterCenterMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a });

    craterPositions.forEach(function(pos) {
      var rimGeom = new THREE.BoxGeometry(14, 0.4, 14);
      var rim = new THREE.Mesh(rimGeom, craterRimMat);
      rim.position.set(pos[0], pos[1], pos[2]);
      scene.add(rim);

      var centerGeom = new THREE.BoxGeometry(10, 0.3, 10);
      var center = new THREE.Mesh(centerGeom, craterCenterMat);
      center.position.set(pos[0], pos[1] - 0.4, pos[2]);
      scene.add(center);
    });

    // 5. Barbed wire rows (4 rows)
    var wirePostMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var wireSegMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });

    for (var row = 0; row < 4; row++) {
      var wireZ = -30 + row * 20;
      for (var post = -90; post <= 90; post += 15) {
        var postGeom = new THREE.BoxGeometry(0.8, 2, 0.8);
        var postMesh = new THREE.Mesh(postGeom, wirePostMat);
        postMesh.position.set(post, 0, wireZ);
        scene.add(postMesh);

        // Wire segment
        var wireGeom = new THREE.BoxGeometry(14, 0.3, 0.3);
        var wire = new THREE.Mesh(wireGeom, wireSegMat);
        wire.position.set(post + 7.5, 0.8, wireZ);
        scene.add(wire);
      }
    }

    // 6. Allied infantry (8 figures)
    infantryGroup = new THREE.Group();
    var khakiMat = new THREE.MeshStandardMaterial({ color: 0xc9a876 });

    for (var i = 0; i < 8; i++) {
      var infantryX = -30 + (i % 4) * 20;
      var infantryZ = -45 + Math.floor(i / 4) * 20;
      var torsoGeom = new THREE.BoxGeometry(2, 3, 1.5);
      var torso = new THREE.Mesh(torsoGeom, khakiMat);
      torso.position.set(infantryX, -0.5, infantryZ);
      infantryGroup.add(torso);

      var headGeom = new THREE.BoxGeometry(1.2, 1, 1);
      var head = new THREE.Mesh(headGeom, khakiMat);
      head.position.set(infantryX, 1.5, infantryZ);
      infantryGroup.add(head);

      var legGeom = new THREE.BoxGeometry(0.8, 1.5, 0.8);
      var leg1 = new THREE.Mesh(legGeom, khakiMat);
      leg1.position.set(infantryX - 0.6, -1.5, infantryZ - 0.3);
      infantryGroup.add(leg1);

      var leg2 = new THREE.Mesh(legGeom, khakiMat);
      leg2.position.set(infantryX + 0.6, -1.5, infantryZ + 0.3);
      infantryGroup.add(leg2);
    }
    scene.add(infantryGroup);

    // 7. Enemy defenders (6 figures)
    enemyDefenders = new THREE.Group();
    var grayMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a });

    for (var d = 0; d < 6; d++) {
      var defX = -50 + (d % 3) * 30;
      var defZ = 60;
      var defTorsoGeom = new THREE.BoxGeometry(2, 2.5, 1.2);
      var defTorso = new THREE.Mesh(defTorsoGeom, grayMat);
      defTorso.position.set(defX, 0.5, defZ);
      enemyDefenders.add(defTorso);

      var defHeadGeom = new THREE.BoxGeometry(1, 0.9, 0.9);
      var defHead = new THREE.Mesh(defHeadGeom, grayMat);
      defHead.position.set(defX, 1.5, defZ);
      enemyDefenders.add(defHead);
    }
    scene.add(enemyDefenders);

    // 8. Observation balloon
    balloonGroup = new THREE.Group();
    var balloonMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, emissive: 0x808080 });
    var balloonGeom = new THREE.BoxGeometry(12, 16, 8);
    var balloon = new THREE.Mesh(balloonGeom, balloonMat);
    balloon.position.set(-100, 40, 0);
    balloonGroup.add(balloon);

    var gondolaGeom = new THREE.BoxGeometry(6, 2, 3);
    var gondola = new THREE.Mesh(gondolaGeom, grayMat);
    gondola.position.set(-100, 22, 0);
    balloonGroup.add(gondola);

    var tetherGeom = new THREE.BoxGeometry(0.3, 35, 0.3);
    var tether = new THREE.Mesh(tetherGeom, wireSegMat);
    tether.position.set(-100, 20, 0);
    balloonGroup.add(tether);

    scene.add(balloonGroup);

    // 9. Artillery barrage explosions (5 emissive spheres)
    explosionGroup = new THREE.Group();
    var explosionMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      emissiveIntensity: 0.8
    });

    var explosionPositions = [
      [30, 1, 10], [-40, 1, -20], [50, 1, 30], [-60, 1, 20], [0, 1, -30]
    ];

    explosionPositions.forEach(function(pos) {
      var expGeom = new THREE.SphereGeometry(2, 8, 8);
      var explosion = new THREE.Mesh(expGeom, explosionMat);
      explosion.position.set(pos[0], pos[1], pos[2]);
      explosion.userData.active = false;
      explosionGroup.add(explosion);
    });
    scene.add(explosionGroup);

    // 10. Machine gun nest
    machineGunNest = new THREE.Group();
    var sandbagMat = new THREE.MeshStandardMaterial({ color: 0x8a7a5a });

    // Sandbag wall
    for (var s = 0; s < 5; s++) {
      var bagGeom = new THREE.BoxGeometry(4, 1.5, 1);
      var bag = new THREE.Mesh(bagGeom, sandbagMat);
      bag.position.set(-70 + s * 4, 0.2, 60);
      machineGunNest.add(bag);

      var bag2Geom = new THREE.BoxGeometry(4, 1.5, 1);
      var bag2 = new THREE.Mesh(bag2Geom, sandbagMat);
      bag2.position.set(-70 + s * 4, 1.5, 60);
      machineGunNest.add(bag2);
    }

    // Prone gunner
    var gunnerGeom = new THREE.BoxGeometry(1.8, 1, 1.2);
    var gunner = new THREE.Mesh(gunnerGeom, grayMat);
    gunner.position.set(-70, 0.8, 60);
    gunner.rotation.z = 0.3;
    machineGunNest.add(gunner);

    // Gun barrel
    var barrelGeom = new THREE.BoxGeometry(0.4, 0.4, 6);
    var barrel = new THREE.Mesh(barrelGeom, wirePostMat);
    barrel.position.set(-68, 1.2, 60);
    barrel.userData.barrelId = true;
    machineGunNest.add(barrel);

    scene.add(machineGunNest);

    // 11. Stretcher bearers (2 figures + stretcher)
    stretchers = new THREE.Group();
    var whiteCrossMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

    for (var st = 0; st < 2; st++) {
      var bearerX = -40 + st * 20;
      var bearerGeom = new THREE.BoxGeometry(1.5, 2.5, 1);
      var bearer = new THREE.Mesh(bearerGeom, whiteCrossMat);
      bearer.position.set(bearerX, 0, -50);
      stretchers.add(bearer);
    }

    var stretcherGeom = new THREE.BoxGeometry(3, 0.3, 1.5);
    var stretcher = new THREE.Mesh(stretcherGeom, whiteCrossMat);
    stretcher.position.set(-30, -0.2, -50);
    stretchers.add(stretcher);

    scene.add(stretchers);

    // 12. Trench dugout entrance
    var dugoutGeom = new THREE.BoxGeometry(5, 3, 0.5);
    var dugoutMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a });
    var dugout = new THREE.Mesh(dugoutGeom, dugoutMat);
    dugout.position.set(-40, -0.5, -60);
    scene.add(dugout);

    // 13. Signal flare
    signalFlare = new THREE.Group();
    var poleGeom = new THREE.BoxGeometry(0.4, 12, 0.4);
    var poleMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
    var pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.set(70, 6, 30);
    signalFlare.add(pole);

    var flareGeom = new THREE.SphereGeometry(1.5, 8, 8);
    var flareMat = new THREE.MeshStandardMaterial({
      color: 0xff2200,
      emissive: 0xff0000,
      emissiveIntensity: 0.6
    });
    var flare = new THREE.Mesh(flareGeom, flareMat);
    flare.position.set(70, 13, 30);
    signalFlare.add(flare);

    scene.add(signalFlare);

    // 14. Gas cloud
    var cloudGeom = new THREE.BoxGeometry(60, 8, 25);
    var cloudMat = new THREE.MeshStandardMaterial({
      color: 0xccdd44,
      transparent: true,
      opacity: 0.5,
      emissive: 0x888800,
      emissiveIntensity: 0.3
    });
    gasCloud = new THREE.Mesh(cloudGeom, cloudMat);
    gasCloud.position.set(-100, 3, 5);
    scene.add(gasCloud);

    // 15. Broken tree stumps (4)
    var stumpMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a });
    var stumpPositions = [[60, 0, -50], [-60, 0, 30], [40, 0, 50], [-40, 0, -30]];

    stumpPositions.forEach(function(pos) {
      var stumpGeom = new THREE.CylinderGeometry(1.2, 1.5, 3, 8);
      var stump = new THREE.Mesh(stumpGeom, stumpMat);
      stump.position.set(pos[0], pos[1], pos[2]);
      scene.add(stump);
    });

    // 16. Mud splash effects (6 emissive spheres)
    var splashMat = new THREE.MeshStandardMaterial({
      color: 0x4a3520,
      emissive: 0x2a1a0a,
      emissiveIntensity: 0.4
    });

    var splashPositions = [
      [25, 0.5, 5], [-35, 0.5, 15], [55, 0.5, -25], [-65, 0.5, 35],
      [15, 0.5, -35], [-45, 0.5, -15]
    ];

    splashPositions.forEach(function(pos) {
      var splashGeom = new THREE.SphereGeometry(1.8, 6, 6);
      var splash = new THREE.Mesh(splashGeom, splashMat);
      splash.position.set(pos[0], pos[1], pos[2]);
      splash.userData.splashId = true;
      scene.add(splash);
    });

    container.infantryGroup = infantryGroup;
    container.gasCloud = gasCloud;
    container.balloonGroup = balloonGroup;
    container.signalFlare = signalFlare;
    container.machineGunNest = machineGunNest;
    container.explosionGroup = explosionGroup;
    container.stretchers = stretchers;
  }

  function createHUD() {
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    hudCanvas = canvas;
    hudContext = canvas.getContext('2d');

    var texture = new THREE.CanvasTexture(canvas);
    var material = new THREE.MeshBasicMaterial({ map: texture });
    var geometry = new THREE.BoxGeometry(8, 4, 0.01);
    var hudMesh = new THREE.Mesh(geometry, material);
    hudMesh.position.set(-15, 8, -20);
    camera.add(hudMesh);
  }

  function updateHUD() {
    if (!hudContext) return;

    hudContext.fillStyle = '#1a1a1a';
    hudContext.fillRect(0, 0, 512, 256);

    hudContext.fillStyle = '#00ff00';
    hudContext.font = 'bold 32px monospace';
    hudContext.fillText('ALLIED ADVANCE: ' + Math.floor(stats.advance) + 'm', 20, 60);
    hudContext.fillText('CASUALTIES: ' + stats.casualties + '/8', 20, 120);

    var gasText = stats.gasAlert ? 'YES' : 'NO';
    hudContext.fillText('GAS ALERT: ' + gasText, 20, 180);

    if (hudCanvas.texture) {
      hudCanvas.texture.needsUpdate = true;
    }
  }

  function update(delta) {
    var elapsed = clock.getElapsedTime();

    // Infantry advance
    if (infantryGroup) {
      infantryGroup.position.z += delta * 12;
      stats.advance = infantryGroup.position.z + 45;
    }

    // Infantry animation (walk cycle)
    if (infantryGroup && infantryGroup.children) {
      for (var i = 0; i < infantryGroup.children.length; i++) {
        var child = infantryGroup.children[i];
        if (child.geometry && child.geometry.type === 'BoxGeometry') {
          child.position.y += Math.sin(elapsed * 4 + i * 0.5) * 0.02;
        }
      }
    }

    // Artillery explosions - pulsing
    if (explosionGroup && explosionGroup.children) {
      explosionGroup.children.forEach(function(explosion, idx) {
        var pulseCycle = Math.sin(elapsed * 3 + idx * 0.8) * 0.5 + 0.5;
        explosion.scale.set(1 + pulseCycle * 0.3, 1 + pulseCycle * 0.3, 1 + pulseCycle * 0.3);
        if (explosion.material && explosion.material.emissive) {
          explosion.material.emissiveIntensity = 0.4 + pulseCycle * 0.4;
        }
      });
    }

    // Gas cloud drift
    if (gasCloud) {
      gasCloud.position.x = -100 + Math.sin(elapsed * 0.5) * 40;
    }

    // Observation balloon bob
    if (balloonGroup) {
      balloonGroup.position.y = 40 + Math.sin(elapsed * 0.8) * 2;
    }

    // Signal flare pulse
    if (signalFlare && signalFlare.children[1]) {
      var flareChild = signalFlare.children[1];
      var flarePulse = Math.sin(elapsed * 2) * 0.3 + 0.7;
      if (flareChild.material && flareChild.material.emissive) {
        flareChild.material.emissiveIntensity = flarePulse;
      }
    }

    // Machine gun recoil
    if (machineGunNest && machineGunNest.children) {
      for (var m = 0; m < machineGunNest.children.length; m++) {
        var gunChild = machineGunNest.children[m];
        if (gunChild.userData && gunChild.userData.barrelId) {
          gunChild.position.z = 60 + Math.sin(elapsed * 5) * 0.3;
        }
      }
    }

    // HUD update and toggle check
    var timeSinceH = Date.now() - lastHKey;
    var timeSinceT = Date.now() - lastTKey;
    if (timeSinceH < 400 && timeSinceT < 400 && Math.abs(timeSinceH - timeSinceT) < 200) {
      stats.gasAlert = !stats.gasAlert;
      lastHKey = 0;
      lastTKey = 0;
    }

    updateHUD();
  }

  function reset() {
    if (infantryGroup) {
      infantryGroup.position.set(0, 0, -45);
    }
    stats.advance = 0;
    stats.casualties = 0;
    stats.gasAlert = true;
    lastHKey = 0;
    lastTKey = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
