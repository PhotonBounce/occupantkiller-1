window.BorderCrossing = (function() {
  'use strict';

  var scene;
  var camera;
  var objects = [];
  var patrolGuard;
  var barrierArm;
  var flags = [];
  var incursionsRepelled = 0;
  var checkpointIntegrity = 100;
  var contraband = 0;
  var barrierLowered = false;
  var barrierTimer = 0;
  var barrierCycle = 4; // seconds for full cycle
  var patrolPosition = 0;
  var patrolSpeed = 0.5;
  var moduleEnabled = true;
  var hudElement;
  var lastBKeyTime = 0;
  var bKeyPressed = false;

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    objects = [];
    patrolPosition = 0;
    barrierTimer = 0;
    barrierLowered = false;
    incursionsRepelled = 0;
    checkpointIntegrity = 100;
    contraband = 0;

    // Fog for dusty atmosphere
    scene.fog = new THREE.Fog(0xc4a560, 200, 1000);
    scene.background = new THREE.Color(0xa08860);

    // Create checkpoint booth structure
    var boothGeom = new THREE.BoxGeometry(3, 4, 2);
    var boothMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.7 });
    var booth = new THREE.Mesh(boothGeom, boothMat);
    booth.position.set(0, 2, 0);
    scene.add(booth);
    objects.push(booth);

    // Booth roof
    var roofGeom = new THREE.BoxGeometry(3.5, 0.3, 2.5);
    var roofMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(0, 4.3, 0);
    scene.add(roof);
    objects.push(roof);

    // Striped barrier arm mechanism - base
    var baseGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 16);
    var baseMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.set(-2, 1, 0);
    scene.add(base);
    objects.push(base);

    // Striped barrier arm (will be rotated)
    var armGeom = new THREE.BoxGeometry(0.2, 0.2, 6);
    var armMat = new THREE.MeshStandardMaterial({ color: 0xff6b35, roughness: 0.4 });
    barrierArm = new THREE.Mesh(armGeom, armMat);
    barrierArm.position.set(-2, 1.5, 0);
    barrierArm.rotation.z = Math.PI / 2; // starts lowered
    scene.add(barrierArm);
    objects.push(barrierArm);

    // Stripe pattern on barrier
    var stripeGeom = new THREE.BoxGeometry(0.3, 0.3, 0.6);
    var stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    for (var i = 0; i < 8; i++) {
      var stripe = new THREE.Mesh(stripeGeom, stripeMat);
      stripe.position.set(-2 + (i * 0.75), 1.5, 0);
      stripe.rotation.z = Math.PI / 2;
      scene.add(stripe);
      objects.push(stripe);
    }

    // Concrete barriers (left side)
    var concreteGeom = new THREE.BoxGeometry(1, 1.5, 4);
    var concreteMat = new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.8 });
    for (var i = 0; i < 3; i++) {
      var barrier = new THREE.Mesh(concreteGeom, concreteMat);
      barrier.position.set(-8 + (i * 3), 0.75, 2);
      scene.add(barrier);
      objects.push(barrier);
    }

    // Sandbag walls (right side)
    var sandbagGeom = new THREE.BoxGeometry(0.8, 1, 3);
    var sandbagMat = new THREE.MeshStandardMaterial({ color: 0xa89968, roughness: 0.9 });
    for (var i = 0; i < 4; i++) {
      var sandbag = new THREE.Mesh(sandbagGeom, sandbagMat);
      sandbag.position.set(8 - (i * 2), 0.5, -3);
      scene.add(sandbag);
      objects.push(sandbag);
    }

    // Left guard tower
    var towerLeftGeom = new THREE.BoxGeometry(2, 6, 2);
    var towerMat = new THREE.MeshStandardMaterial({ color: 0x556655, roughness: 0.7 });
    var towerLeft = new THREE.Mesh(towerLeftGeom, towerMat);
    towerLeft.position.set(-12, 3, 8);
    scene.add(towerLeft);
    objects.push(towerLeft);

    // Right guard tower
    var towerRight = new THREE.Mesh(towerLeftGeom, towerMat);
    towerRight.position.set(12, 3, 8);
    scene.add(towerRight);
    objects.push(towerRight);

    // Vehicle inspection pit (recessed area)
    var pitGeom = new THREE.BoxGeometry(6, 0.5, 4);
    var pitMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.9 });
    var pit = new THREE.Mesh(pitGeom, pitMat);
    pit.position.set(5, -0.25, -6);
    scene.add(pit);
    objects.push(pit);

    // Left flag pole
    var leftPoleGeom = new THREE.CylinderGeometry(0.15, 0.15, 5, 8);
    var poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
    var leftPole = new THREE.Mesh(leftPoleGeom, poleMat);
    leftPole.position.set(-15, 2.5, 0);
    scene.add(leftPole);
    objects.push(leftPole);

    // Left flag
    var flagGeom = new THREE.BoxGeometry(2, 1.2, 0.05);
    var flagMat = new THREE.MeshStandardMaterial({ color: 0x1a1a6b, roughness: 0.5 });
    var leftFlag = new THREE.Mesh(flagGeom, flagMat);
    leftFlag.position.set(-13.5, 4.5, 0);
    leftFlag.rotation.z = Math.PI / 6;
    scene.add(leftFlag);
    objects.push(leftFlag);
    flags.push({ mesh: leftFlag, baseRotation: leftFlag.rotation.z, speed: 2 });

    // Right flag pole
    var rightPole = new THREE.Mesh(leftPoleGeom, poleMat);
    rightPole.position.set(15, 2.5, 0);
    scene.add(rightPole);
    objects.push(rightPole);

    // Right flag
    var rightFlag = new THREE.Mesh(flagGeom, flagMat);
    rightFlag.position.set(13.5, 4.5, 0);
    rightFlag.rotation.z = -Math.PI / 6;
    scene.add(rightFlag);
    objects.push(rightFlag);
    flags.push({ mesh: rightFlag, baseRotation: rightFlag.rotation.z, speed: 2.2 });

    // Road lane dividers
    var dividerGeom = new THREE.BoxGeometry(0.3, 0.1, 0.6);
    var dividerMat = new THREE.MeshStandardMaterial({ color: 0xffff99, roughness: 0.4 });
    for (var i = 0; i < 20; i++) {
      var divider = new THREE.Mesh(dividerGeom, dividerMat);
      divider.position.set((i - 10) * 0.8, 0.05, 0);
      scene.add(divider);
      objects.push(divider);
    }

    // Patrol guard (simple box figure)
    var guardGeom = new THREE.BoxGeometry(0.6, 1.8, 0.4);
    var guardMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.6 });
    patrolGuard = new THREE.Mesh(guardGeom, guardMat);
    patrolGuard.position.set(0, 0.9, -4);
    scene.add(patrolGuard);
    objects.push(patrolGuard);

    // Guard head
    var headGeom = new THREE.SphereGeometry(0.25, 8, 8);
    var headMat = new THREE.MeshStandardMaterial({ color: 0xc9a876, roughness: 0.5 });
    var head = new THREE.Mesh(headGeom, headMat);
    head.position.set(0, 2, -4);
    scene.add(head);
    objects.push(head);

    // Ground plane
    var groundGeom = new THREE.BoxGeometry(100, 0.2, 100);
    var groundMat = new THREE.MeshStandardMaterial({ color: 0x9a8860, roughness: 0.9 });
    var ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.y = -0.1;
    scene.add(ground);
    objects.push(ground);

    // Create HUD
    createHUD();

    // Setup keyboard listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
  }

  function createHUD() {
    var existing = document.getElementById('border-crossing-hud');
    if (existing) {
      existing.remove();
    }

    hudElement = document.createElement('div');
    hudElement.id = 'border-crossing-hud';
    hudElement.style.position = 'fixed';
    hudElement.style.top = '20px';
    hudElement.style.left = '20px';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.fontSize = '14px';
    hudElement.style.color = '#00ff00';
    hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudElement.style.padding = '10px';
    hudElement.style.border = '2px solid #00ff00';
    hudElement.style.zIndex = '1000';
    hudElement.style.display = moduleEnabled ? 'block' : 'none';
    hudElement.innerHTML = 'BORDER INCURSIONS REPELLED: ' + incursionsRepelled + '<br/>' +
                           'CHECKPOINT INTEGRITY: ' + checkpointIntegrity + '%<br/>' +
                           'CONTRABAND SEIZED: ' + contraband + '<br/>' +
                           '<span style="font-size: 12px; margin-top: 8px; display: block; color: #ffff00;">Press B+X to toggle</span>';
    document.body.appendChild(hudElement);
  }

  function handleKeyDown(event) {
    if (event.key.toUpperCase() === 'B') {
      var now = Date.now();
      if (bKeyPressed === false) {
        lastBKeyTime = now;
        bKeyPressed = true;
      }
    }
    if (event.key.toUpperCase() === 'X' && bKeyPressed && (Date.now() - lastBKeyTime) < 400) {
      toggleModule();
      bKeyPressed = false;
    }
  }

  function handleKeyUp(event) {
    if (event.key.toUpperCase() === 'B') {
      bKeyPressed = false;
    }
  }

  function toggleModule() {
    moduleEnabled = !moduleEnabled;
    if (hudElement) {
      hudElement.style.display = moduleEnabled ? 'block' : 'none';
    }
    var notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '50%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';
    notification.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    notification.style.color = '#00ff00';
    notification.style.padding = '20px 40px';
    notification.style.fontSize = '24px';
    notification.style.border = '2px solid #00ff00';
    notification.style.zIndex = '10000';
    notification.style.fontFamily = 'monospace';
    notification.innerHTML = 'CHECKPOINT ' + (moduleEnabled ? 'ONLINE' : 'OFFLINE');
    document.body.appendChild(notification);
    setTimeout(function() {
      notification.remove();
    }, 800);
  }

  function update(delta) {
    if (!moduleEnabled) {
      return;
    }

    // Animate barrier arm
    barrierTimer += delta;
    if (barrierTimer > barrierCycle) {
      barrierTimer -= barrierCycle;
    }
    var cycleProgress = barrierTimer / barrierCycle;
    if (cycleProgress < 0.3) {
      // Raise barrier
      var raiseProgress = cycleProgress / 0.3;
      barrierArm.rotation.z = Math.PI / 2 - (Math.PI / 2) * raiseProgress;
      barrierLowered = false;
    } else if (cycleProgress < 0.7) {
      // Hold raised
      barrierArm.rotation.z = 0;
      barrierLowered = false;
    } else {
      // Lower barrier
      var lowerProgress = (cycleProgress - 0.7) / 0.3;
      barrierArm.rotation.z = (Math.PI / 2) * lowerProgress;
      barrierLowered = true;
    }

    // Animate flags waving
    for (var i = 0; i < flags.length; i++) {
      var flagData = flags[i];
      var wave = Math.sin(Date.now() * 0.001 * flagData.speed) * 0.2;
      flagData.mesh.rotation.y = wave;
    }

    // Patrol guard walking animation
    patrolPosition += patrolSpeed * delta;
    if (patrolPosition > 6) {
      patrolPosition = -6;
    }
    patrolGuard.position.x = patrolPosition;

    // Simulate random incursion detection
    if (Math.random() < 0.0005) {
      incursionsRepelled++;
      checkpointIntegrity = Math.max(0, checkpointIntegrity - 3);
    }

    // Simulate random contraband seizure
    if (Math.random() < 0.0003) {
      contraband += Math.floor(Math.random() * 5) + 1;
    }

    // Update HUD
    if (hudElement) {
      hudElement.innerHTML = 'BORDER INCURSIONS REPELLED: ' + incursionsRepelled + '<br/>' +
                             'CHECKPOINT INTEGRITY: ' + checkpointIntegrity + '%<br/>' +
                             'CONTRABAND SEIZED: ' + contraband + '<br/>' +
                             '<span style="font-size: 12px; margin-top: 8px; display: block; color: #ffff00;">Press B+X to toggle</span>';
    }
  }

  function reset() {
    // Remove all added objects from scene
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    flags = [];

    // Remove HUD
    if (hudElement) {
      hudElement.remove();
      hudElement = null;
    }

    // Remove event listeners
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);

    // Reset state
    patrolGuard = null;
    barrierArm = null;
    incursionsRepelled = 0;
    checkpointIntegrity = 100;
    contraband = 0;
    moduleEnabled = true;
    barrierTimer = 0;
    patrolPosition = 0;
    bKeyPressed = false;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
