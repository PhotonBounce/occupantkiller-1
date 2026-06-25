window.StadiumRiot = (function() {
  'use strict';

  var scene, camera;
  var objects = [];
  var animationData = {
    lightFlicker: 0,
    helicopterAngle: 0,
    tearGasRise: [0, 0, 0, 0],
    crowdBob: 0,
    gunmenPace: [0, 0, 0, 0, 0, 0],
    sniperScan: [0, 0, 0]
  };
  var hudText = null;
  var keyPressLog = [];
  var hostageCount = 5;
  var gunmenCount = 6;
  var breachTimer = 60;

  function createBox(width, height, depth, color, x, y, z, emissive) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || 0x000000,
      metalness: 0.3,
      roughness: 0.8
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function createCylinder(radiusTop, radiusBottom, height, color, x, y, z) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 16);
    var material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.2,
      roughness: 0.7
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function createSphere(radius, color, x, y, z, emissive) {
    var geometry = new THREE.SphereGeometry(radius, 16, 16);
    var material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || 0x000000,
      metalness: 0,
      roughness: 0.4
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    objects = [];
    keyPressLog = [];

    // 1. Soccer pitch — green flat box (100×0.3×70)
    var pitch = createBox(100, 0.3, 70, 0x1a6a1a, 0, 0, 0);
    scene.add(pitch);
    objects.push(pitch);

    // White line markings on pitch
    var centerLine = createBox(0.5, 0.05, 70, 0xffffff, 0, 0.16, 0);
    scene.add(centerLine);
    objects.push(centerLine);

    var centerCircle = createBox(30, 0.05, 0.5, 0xffffff, 0, 0.16, 0);
    scene.add(centerCircle);
    objects.push(centerCircle);

    var topPenalty = createBox(40, 0.05, 0.5, 0xffffff, 0, 0.16, -33);
    scene.add(topPenalty);
    objects.push(topPenalty);

    var bottomPenalty = createBox(40, 0.05, 0.5, 0xffffff, 0, 0.16, 33);
    scene.add(bottomPenalty);
    objects.push(bottomPenalty);

    // 2. Stadium seating tiers — 4 tall box tiers wrapping around pitch
    var tier1 = createBox(110, 8, 75, 0x444444, 0, 8, 0);
    scene.add(tier1);
    objects.push(tier1);

    var tier2 = createBox(110, 7, 75, 0x555555, 0, 17, 0);
    scene.add(tier2);
    objects.push(tier2);

    var tier3 = createBox(110, 6, 75, 0x666666, 0, 25, 0);
    scene.add(tier3);
    objects.push(tier3);

    var tier4 = createBox(110, 5, 75, 0x777777, 0, 32, 0);
    scene.add(tier4);
    objects.push(tier4);

    // 3. Crowd representation — hundreds of tiny colored box dots in seats
    var crowdColors = [0xff0000, 0x0000ff, 0xffff00, 0x00ff00, 0xff00ff, 0x00ffff];
    for (var c = 0; c < 120; c++) {
      var crowdColor = crowdColors[c % crowdColors.length];
      var cX = (Math.random() - 0.5) * 90;
      var cY = 8 + Math.random() * 20;
      var cZ = (Math.random() - 0.5) * 65;
      var crowd = createBox(0.8, 1.2, 0.8, crowdColor, cX, cY, cZ);
      scene.add(crowd);
      objects.push(crowd);
    }

    // 4. Soccer goals — white frame posts + crossbar
    var goalWidth = 7.32;
    var goalHeight = 2.44;
    // Top goal
    var topLeftPost = createBox(0.3, goalHeight, 0.3, 0xffffff, -goalWidth / 2, goalHeight / 2, -34);
    scene.add(topLeftPost);
    objects.push(topLeftPost);

    var topRightPost = createBox(0.3, goalHeight, 0.3, 0xffffff, goalWidth / 2, goalHeight / 2, -34);
    scene.add(topRightPost);
    objects.push(topRightPost);

    var topCrossbar = createBox(goalWidth, 0.3, 0.3, 0xffffff, 0, goalHeight, -34);
    scene.add(topCrossbar);
    objects.push(topCrossbar);

    // Bottom goal
    var bottomLeftPost = createBox(0.3, goalHeight, 0.3, 0xffffff, -goalWidth / 2, goalHeight / 2, 34);
    scene.add(bottomLeftPost);
    objects.push(bottomLeftPost);

    var bottomRightPost = createBox(0.3, goalHeight, 0.3, 0xffffff, goalWidth / 2, goalHeight / 2, 34);
    scene.add(bottomRightPost);
    objects.push(bottomRightPost);

    var bottomCrossbar = createBox(goalWidth, 0.3, 0.3, 0xffffff, 0, goalHeight, 34);
    scene.add(bottomCrossbar);
    objects.push(bottomCrossbar);

    // 5. Jumbo scoreboard — large flat box + emissive screen face
    var scoreboardBase = createBox(25, 0.5, 1, 0x333333, 0, 28, -40);
    scene.add(scoreboardBase);
    objects.push(scoreboardBase);

    var scoreboardScreen = createBox(24, 18, 0.1, 0x00ff00, 0, 37, -40, 0x00ff00);
    scoreboardScreen.userData.isEmissive = true;
    scene.add(scoreboardScreen);
    objects.push(scoreboardScreen);

    // 6. Extremist gunmen — 6 dark box figures at strategic points
    var gunmenPositions = [
      [-35, 5, -15],
      [35, 5, 15],
      [-20, 12, -20],
      [20, 12, 20],
      [0, 15, -25],
      [0, 10, 25]
    ];
    for (var g = 0; g < 6; g++) {
      var gunMan = createBox(1.5, 3, 1, 0x1a1a1a, gunmenPositions[g][0], gunmenPositions[g][1], gunmenPositions[g][2]);
      gunMan.userData.isGunman = true;
      gunMan.userData.basePos = gunmenPositions[g].slice();
      scene.add(gunMan);
      objects.push(gunMan);
    }

    // 7. Hostage crowd figures — 5 civilian box figures, cowering
    var hostagePositions = [
      [-30, 12, 10],
      [30, 10, -10],
      [-10, 14, 20],
      [15, 12, -5],
      [5, 13, 15]
    ];
    for (var h = 0; h < 5; h++) {
      var hostage = createBox(1.2, 2.8, 1, 0xccaa88, hostagePositions[h][0], hostagePositions[h][1], hostagePositions[h][2]);
      hostage.userData.isHostage = true;
      scene.add(hostage);
      objects.push(hostage);
    }

    // 8. Riot police — 4 black armor figures at tunnel entrances
    var policePositions = [
      [-45, 5, -20],
      [45, 5, 20],
      [-45, 5, 20],
      [45, 5, -20]
    ];
    for (var p = 0; p < 4; p++) {
      var policeBody = createBox(1.8, 3.5, 1.2, 0x1a1a1a, policePositions[p][0], policePositions[p][1], policePositions[p][2]);
      scene.add(policeBody);
      objects.push(policeBody);

      var shield = createBox(1.5, 2.2, 0.2, 0x444444, policePositions[p][0] + 1.2, policePositions[p][1], policePositions[p][2]);
      scene.add(shield);
      objects.push(shield);
    }

    // 9. SWAT sniper figures — 3 prone on roof section
    var sniperPositions = [
      [-30, 42, -30],
      [0, 42, -35],
      [30, 42, -30]
    ];
    for (var s = 0; s < 3; s++) {
      var sniper = createBox(0.8, 1.5, 2.5, 0x2a2a2a, sniperPositions[s][0], sniperPositions[s][1], sniperPositions[s][2]);
      sniper.userData.isSniper = true;
      sniper.userData.basePosSniper = sniperPositions[s].slice();
      sniper.rotationOrder = 'YXZ';
      scene.add(sniper);
      objects.push(sniper);
    }

    // 10. APC — armored box vehicle outside stadium entrance
    var apcBody = createBox(8, 5, 4, 0x3a3a3a, -60, 2.5, -50);
    scene.add(apcBody);
    objects.push(apcBody);

    var apcTurret = createCylinder(1.2, 1.2, 2, 0x4a4a4a, -60, 6, -50);
    scene.add(apcTurret);
    objects.push(apcTurret);

    // 11. Stadium lights — 4 tower poles with bright emissive spheres
    var lightPositions = [
      [-50, 0, -35],
      [50, 0, -35],
      [-50, 0, 35],
      [50, 0, 35]
    ];
    for (var l = 0; l < 4; l++) {
      var pole = createCylinder(0.5, 0.5, 45, 0x555555, lightPositions[l][0], 22.5, lightPositions[l][2]);
      scene.add(pole);
      objects.push(pole);

      // Light head with multiple emissive spheres
      var lightHead1 = createSphere(2, 0xffff99, lightPositions[l][0] - 3, 45, lightPositions[l][2], 0xffff99);
      lightHead1.userData.isLight = true;
      scene.add(lightHead1);
      objects.push(lightHead1);

      var lightHead2 = createSphere(2, 0xffff99, lightPositions[l][0] + 3, 45, lightPositions[l][2], 0xffff99);
      lightHead2.userData.isLight = true;
      scene.add(lightHead2);
      objects.push(lightHead2);
    }

    // 12. Breach door — stadium exit with explosive charge
    var breachDoor = createBox(3, 4, 0.3, 0x8b4513, -55, 5, 0);
    breachDoor.userData.isBreachDoor = true;
    scene.add(breachDoor);
    objects.push(breachDoor);

    var explosiveCharge = createBox(1.5, 0.8, 0.8, 0xffaa00, -55, 3, -0.5);
    explosiveCharge.userData.isExplosive = true;
    scene.add(explosiveCharge);
    objects.push(explosiveCharge);

    // 13. Floodlight glare — oversized emissive spheres
    var floodGlare1 = createSphere(15, 0xffff99, -45, 40, -40, 0xffffcc);
    floodGlare1.userData.isFloodlight = true;
    scene.add(floodGlare1);
    objects.push(floodGlare1);

    var floodGlare2 = createSphere(15, 0xffff99, 45, 40, 40, 0xffffcc);
    floodGlare2.userData.isFloodlight = true;
    scene.add(floodGlare2);
    objects.push(floodGlare2);

    // 14. TV broadcast helicopter — hovering box body + rotor, circling
    var heliBody = createBox(3, 2, 8, 0x1a1a1a, 0, 50, 40);
    heliBody.userData.isHelicopter = true;
    scene.add(heliBody);
    objects.push(heliBody);

    var heliRotor = createBox(0.3, 0.1, 12, 0xcccccc, 0, 53, 40);
    heliRotor.userData.isRotor = true;
    scene.add(heliRotor);
    objects.push(heliRotor);

    // 15. Tear gas canisters — 4 small cylinders with smoke effects
    var tearGasPositions = [
      [-25, 5, 0],
      [25, 5, 10],
      [-10, 5, -15],
      [15, 5, -10]
    ];
    for (var t = 0; t < 4; t++) {
      var canister = createCylinder(0.4, 0.4, 1.2, 0x888888, tearGasPositions[t][0], tearGasPositions[t][1], tearGasPositions[t][2]);
      canister.userData.isTearGas = true;
      canister.userData.baseY = tearGasPositions[t][1];
      scene.add(canister);
      objects.push(canister);

      // Smoke effect sphere
      var smoke = createSphere(3, 0xcccccc, tearGasPositions[t][0], tearGasPositions[t][1] + 2, tearGasPositions[t][2]);
      smoke.userData.isSmokeEffect = true;
      smoke.userData.basePos = tearGasPositions[t].slice();
      scene.add(smoke);
      objects.push(smoke);
    }

    // 16. Protest banner — large flat box banner
    var banner = createBox(40, 8, 0.2, 0xff0000, 0, 30, 36);
    banner.userData.isBanner = true;
    scene.add(banner);
    objects.push(banner);

    // Create HUD text
    createHUD();

    // Setup keyboard listener
    document.addEventListener('keydown', onKeyDown);
  }

  function createHUD() {
    if (hudText) {
      scene.remove(hudText);
    }

    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('HOSTAGES: ' + hostageCount, 20, 40);
    ctx.fillText('GUNMEN: ' + gunmenCount, 20, 70);
    ctx.fillText('BREACH ETA: ' + Math.max(0, Math.floor(breachTimer)) + 's', 20, 100);

    var texture = new THREE.CanvasTexture(canvas);
    var material = new THREE.MeshBasicMaterial({ map: texture });
    var geometry = new THREE.BoxGeometry(20, 5, 0.01);
    hudText = new THREE.Mesh(geometry, material);
    hudText.position.set(-45, 45, -45);
    scene.add(hudText);
  }

  function onKeyDown(event) {
    keyPressLog.push(event.key.toUpperCase());
    if (keyPressLog.length > 2) {
      keyPressLog.shift();
    }

    // Check for H+Q within 400ms
    if (keyPressLog.length === 2 && keyPressLog[0] === 'H' && keyPressLog[1] === 'Q') {
      reset();
      keyPressLog = [];
    } else if (event.key.toUpperCase() !== 'H' && event.key.toUpperCase() !== 'Q') {
      keyPressLog = [];
    }
  }

  function update(delta) {
    // Update timers
    breachTimer -= delta;

    // Light flicker animation
    animationData.lightFlicker += delta * 3;
    var lightIntensity = 0.5 + 0.5 * Math.sin(animationData.lightFlicker * 4);
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].userData.isLight) {
        objects[i].material.emissive.multiplyScalar(lightIntensity);
      }
    }

    // Helicopter orbit
    animationData.helicopterAngle += delta * 0.5;
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].userData.isHelicopter) {
        objects[i].position.x = Math.cos(animationData.helicopterAngle) * 60;
        objects[i].position.z = Math.sin(animationData.helicopterAngle) * 50 + 40;
      }
      if (objects[i].userData.isRotor) {
        objects[i].position.x = Math.cos(animationData.helicopterAngle) * 60;
        objects[i].position.z = Math.sin(animationData.helicopterAngle) * 50 + 40;
        objects[i].rotation.y += delta * 15;
      }
    }

    // Tear gas rise and smoke
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].userData.isTearGas) {
        var idx = i;
        animationData.tearGasRise[idx] = (animationData.tearGasRise[idx] || 0) + delta * 2;
        objects[i].position.y = objects[i].userData.baseY + animationData.tearGasRise[idx];
      }
      if (objects[i].userData.isSmokeEffect) {
        var basePos = objects[i].userData.basePos;
        objects[i].position.y = basePos[1] + Math.sin(animationData.tearGasRise[i] || 0) * 5 + animationData.tearGasRise[i];
        objects[i].scale.x = 1 + animationData.tearGasRise[i] * 0.1;
        objects[i].scale.y = 1 + animationData.tearGasRise[i] * 0.1;
        objects[i].scale.z = 1 + animationData.tearGasRise[i] * 0.1;
        objects[i].material.opacity = Math.max(0, 0.7 - animationData.tearGasRise[i] * 0.05);
      }
    }

    // Crowd bob
    animationData.crowdBob += delta * 2;
    var crowdBobAmount = Math.sin(animationData.crowdBob) * 0.3;
    for (var i = 0; i < objects.length; i++) {
      if (!objects[i].userData.isGunman && !objects[i].userData.isHostage &&
          !objects[i].userData.isLight && !objects[i].userData.isHelicopter &&
          !objects[i].userData.isRotor && !objects[i].userData.isTearGas &&
          !objects[i].userData.isSmokeEffect && !objects[i].userData.isSniper &&
          !objects[i].userData.isFloodlight && !objects[i].userData.isBanner &&
          !objects[i].userData.isBreachDoor && !objects[i].userData.isExplosive &&
          !objects[i].userData.isEmissive && objects[i].geometry.parameters.height < 1.5) {
        objects[i].userData.baseYCrowd = objects[i].userData.baseYCrowd !== undefined ? objects[i].userData.baseYCrowd : objects[i].position.y;
        objects[i].position.y = objects[i].userData.baseYCrowd + crowdBobAmount;
      }
    }

    // Gunmen pace
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].userData.isGunman) {
        var idx = objects.indexOf(objects[i]);
        animationData.gunmenPace[i] = (animationData.gunmenPace[i] || 0) + delta * 1.5;
        var basePos = objects[i].userData.basePos;
        objects[i].position.x = basePos[0] + Math.sin(animationData.gunmenPace[i]) * 3;
        objects[i].position.z = basePos[2] + Math.cos(animationData.gunmenPace[i]) * 2;
      }
    }

    // SWAT sniper scan
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].userData.isSniper) {
        animationData.sniperScan[i] = (animationData.sniperScan[i] || 0) + delta * 0.8;
        objects[i].rotation.y = Math.sin(animationData.sniperScan[i]) * 0.3;
      }
    }

    // Update HUD
    createHUD();
  }

  function reset() {
    hostageCount = 5;
    gunmenCount = 6;
    breachTimer = 60;
    animationData = {
      lightFlicker: 0,
      helicopterAngle: 0,
      tearGasRise: [0, 0, 0, 0],
      crowdBob: 0,
      gunmenPace: [0, 0, 0, 0, 0, 0],
      sniperScan: [0, 0, 0]
    };
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].userData.basePos) {
        objects[i].position.x = objects[i].userData.basePos[0];
        objects[i].position.z = objects[i].userData.basePos[2];
      }
    }
    createHUD();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
