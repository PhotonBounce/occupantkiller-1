window.AvalancheZone = (function() {
  'use strict';

  var scene, camera, renderer, canvas;
  var objects = [];
  var animations = [];
  var clock = null;
  var hudVisible = true;
  var hudCanvas = null;
  var hudCtx = null;
  var lastKeyPress = {};
  var keyComboPending = false;
  var keyComboPendingTimeout = null;

  function init(containerId) {
    canvas = document.getElementById(containerId);

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 500, 800);

    // Camera
    camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      2000
    );
    camera.position.set(80, 60, 100);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.shadowMap.enabled = true;

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    var pointLight = new THREE.PointLight(0xff6600, 1, 300);
    pointLight.position.set(30, 40, 20);
    scene.add(pointLight);

    clock = new THREE.Clock();

    // Create all scene objects
    createSnowMountain();
    createAvalancheMass();
    createBuriedBuilding();
    createRescueCamps();
    createSearchDogs();
    createRescueWorkers();
    createVictimFigure();
    createHelicopter();
    createSnowProbes();
    createDebrisChunks();
    createIceWall();
    createRescueSled();
    createThermalScanner();
    createSupplyCrate();
    createCrevasse();
    createBeacon();

    // Create HUD
    createHUD();

    // Event listeners
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();
  }

  function createSnowMountain() {
    var geometry = new THREE.BoxGeometry(300, 200, 150);
    var material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-50, -30, -100);
    mesh.rotation.z = -0.2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
  }

  function createAvalancheMass() {
    var positions = [
      { x: 0, y: 40, z: -20 },
      { x: 30, y: 20, z: 0 },
      { x: -40, y: 30, z: 10 },
      { x: 20, y: 10, z: 30 },
      { x: -25, y: 5, z: -40 }
    ];

    var index = 0;
    var avalancheChunks = [];

    positions.forEach(function(pos) {
      var geometry = new THREE.BoxGeometry(40, 35, 45);
      var material = new THREE.MeshStandardMaterial({
        color: 0xf0f8ff,
        roughness: 0.6,
        metalness: 0.1
      });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.rotation.x = Math.random() * 0.3;
      mesh.rotation.y = Math.random() * 0.3;
      scene.add(mesh);
      objects.push(mesh);
      avalancheChunks.push(mesh);

      var chunkIndex = index++;
      animations.push({
        type: 'avalanche',
        mesh: mesh,
        initialZ: pos.z,
        initialY: pos.y,
        speed: 0.3 + Math.random() * 0.2
      });
    });
  }

  function createBuriedBuilding() {
    var geometry = new THREE.BoxGeometry(50, 40, 50);
    var material = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
      metalness: 0
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-30, -25, 50);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
  }

  function createRescueCamps() {
    var campPositions = [
      { x: -80, y: 0, z: -60 },
      { x: 60, y: 0, z: -80 },
      { x: 70, y: 0, z: 40 }
    ];

    campPositions.forEach(function(campPos) {
      // Tent 1
      var tent1Geom = new THREE.BoxGeometry(30, 25, 35);
      var tentMat = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        roughness: 0.7,
        metalness: 0
      });
      var tent1 = new THREE.Mesh(tent1Geom, tentMat);
      tent1.position.set(campPos.x, campPos.y + 10, campPos.z);
      tent1.castShadow = true;
      tent1.receiveShadow = true;
      scene.add(tent1);
      objects.push(tent1);
    });
  }

  function createSearchDogs() {
    var dogPositions = [
      { x: -50, z: 20 },
      { x: 40, z: -30 }
    ];

    dogPositions.forEach(function(pos, idx) {
      // Body
      var bodyGeom = new THREE.BoxGeometry(15, 12, 25);
      var bodyMat = new THREE.MeshStandardMaterial({
        color: 0xd4a373,
        roughness: 0.7,
        metalness: 0
      });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.set(pos.x, 8, pos.z);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);
      objects.push(body);

      // Head
      var headGeom = new THREE.BoxGeometry(10, 10, 12);
      var head = new THREE.Mesh(headGeom, bodyMat);
      head.position.set(pos.x, 14, pos.z + 15);
      head.castShadow = true;
      head.receiveShadow = true;
      scene.add(head);
      objects.push(head);

      // Legs (cylinders)
      for (var i = 0; i < 4; i++) {
        var legGeom = new THREE.CylinderGeometry(3, 3, 10, 8);
        var leg = new THREE.Mesh(legGeom, bodyMat);
        var legOffset = (i % 2) * 8 - 4;
        var legZOffset = Math.floor(i / 2) * 10 - 5;
        leg.position.set(pos.x + legOffset, 5, pos.z + legZOffset);
        leg.castShadow = true;
        leg.receiveShadow = true;
        scene.add(leg);
        objects.push(leg);
      }

      animations.push({
        type: 'dog',
        body: body,
        initialX: pos.x,
        range: 40,
        speed: 0.015 + Math.random() * 0.01,
        direction: idx === 0 ? 1 : -1
      });
    });
  }

  function createRescueWorkers() {
    var workerPositions = [
      { x: -20, z: 30 },
      { x: 10, z: 40 },
      { x: 30, z: 20 },
      { x: -10, z: -20 },
      { x: 50, z: 10 }
    ];

    workerPositions.forEach(function(pos) {
      // Body (box)
      var bodyGeom = new THREE.BoxGeometry(8, 20, 6);
      var workerMat = new THREE.MeshStandardMaterial({
        color: 0xff9900,
        roughness: 0.7,
        metalness: 0
      });
      var body = new THREE.Mesh(bodyGeom, workerMat);
      body.position.set(pos.x, 13, pos.z);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);
      objects.push(body);

      // Head (sphere)
      var headGeom = new THREE.SphereGeometry(4, 8, 8);
      var head = new THREE.Mesh(headGeom, workerMat);
      head.position.set(pos.x, 24, pos.z);
      head.castShadow = true;
      head.receiveShadow = true;
      scene.add(head);
      objects.push(head);

      animations.push({
        type: 'dig',
        mesh: body,
        initialY: 13,
        range: 3,
        speed: 0.02 + Math.random() * 0.01
      });
    });
  }

  function createVictimFigure() {
    // Body (half-submerged box)
    var bodyGeom = new THREE.BoxGeometry(6, 18, 5);
    var victimMat = new THREE.MeshStandardMaterial({
      color: 0x8b0000,
      roughness: 0.7,
      metalness: 0
    });
    var body = new THREE.Mesh(bodyGeom, victimMat);
    body.position.set(20, 5, -10);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    objects.push(body);

    // Head (sphere)
    var headGeom = new THREE.SphereGeometry(3, 8, 8);
    var head = new THREE.Mesh(headGeom, victimMat);
    head.position.set(20, 14, -10);
    head.castShadow = true;
    head.receiveShadow = true;
    scene.add(head);
    objects.push(head);
  }

  function createHelicopter() {
    // Fuselage (box)
    var fuselageGeom = new THREE.BoxGeometry(15, 12, 35);
    var helicopterMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      roughness: 0.6,
      metalness: 0.3
    });
    var fuselage = new THREE.Mesh(fuselageGeom, helicopterMat);
    fuselage.position.set(0, 120, 0);
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    scene.add(fuselage);
    objects.push(fuselage);

    // Rotor (cylinder)
    var rotorGeom = new THREE.CylinderGeometry(30, 30, 2, 32);
    var rotorMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.5
    });
    var rotor = new THREE.Mesh(rotorGeom, rotorMat);
    rotor.position.set(0, 130, 0);
    rotor.castShadow = true;
    rotor.receiveShadow = true;
    scene.add(rotor);
    objects.push(rotor);

    animations.push({
      type: 'helicopter',
      fuselage: fuselage,
      rotor: rotor,
      hoverHeight: 120,
      hoverRange: 30,
      hoverSpeed: 0.01
    });
  }

  function createSnowProbes() {
    var probePositions = [
      { x: -15, z: 25 },
      { x: 25, z: -15 },
      { x: -35, z: -25 },
      { x: 45, z: 30 }
    ];

    probePositions.forEach(function(pos) {
      var geometry = new THREE.CylinderGeometry(1, 1, 80, 8);
      var material = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.6,
        metalness: 0.4
      });
      var probe = new THREE.Mesh(geometry, material);
      probe.position.set(pos.x, 40, pos.z);
      probe.castShadow = true;
      probe.receiveShadow = true;
      scene.add(probe);
      objects.push(probe);
    });
  }

  function createDebrisChunks() {
    var debrisCount = 12;
    for (var i = 0; i < debrisCount; i++) {
      var geometry = new THREE.BoxGeometry(
        15 + Math.random() * 20,
        10 + Math.random() * 15,
        12 + Math.random() * 18
      );
      var material = new THREE.MeshStandardMaterial({
        color: 0xe8e8e8,
        roughness: 0.8,
        metalness: 0
      });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        -100 + Math.random() * 200,
        10 + Math.random() * 30,
        -120 + Math.random() * 180
      );
      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.y = Math.random() * Math.PI;
      mesh.rotation.z = Math.random() * Math.PI;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      objects.push(mesh);
    }
  }

  function createIceWall() {
    var geometry = new THREE.BoxGeometry(150, 120, 15);
    var material = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      roughness: 0.4,
      metalness: 0.2
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-100, 40, 80);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
  }

  function createRescueSled() {
    // Sled body (flat box)
    var sledGeom = new THREE.BoxGeometry(25, 3, 40);
    var sledMat = new THREE.MeshStandardMaterial({
      color: 0xdc143c,
      roughness: 0.6,
      metalness: 0
    });
    var sled = new THREE.Mesh(sledGeom, sledMat);
    sled.position.set(-60, 2, 60);
    sled.castShadow = true;
    sled.receiveShadow = true;
    scene.add(sled);
    objects.push(sled);

    // Runners (cylinders)
    for (var i = 0; i < 2; i++) {
      var runnerGeom = new THREE.CylinderGeometry(3, 3, 40, 8);
      var runner = new THREE.Mesh(runnerGeom, sledMat);
      runner.rotation.z = Math.PI / 2;
      runner.position.set(-60 + (i ? 10 : -10), 1, 60);
      runner.castShadow = true;
      runner.receiveShadow = true;
      scene.add(runner);
      objects.push(runner);
    }
  }

  function createThermalScanner() {
    // Scanner box
    var scannerGeom = new THREE.BoxGeometry(12, 8, 12);
    var scannerMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7,
      metalness: 0
    });
    var scanner = new THREE.Mesh(scannerGeom, scannerMat);
    scanner.position.set(35, 12, -35);
    scanner.castShadow = true;
    scanner.receiveShadow = true;
    scene.add(scanner);
    objects.push(scanner);

    // Tripod legs (3 cylinders)
    for (var i = 0; i < 3; i++) {
      var legGeom = new THREE.CylinderGeometry(1.5, 1.5, 15, 8);
      var leg = new THREE.Mesh(legGeom, scannerMat);
      var angle = (i / 3) * Math.PI * 2;
      leg.position.set(
        35 + Math.cos(angle) * 8,
        7,
        -35 + Math.sin(angle) * 8
      );
      leg.castShadow = true;
      leg.receiveShadow = true;
      scene.add(leg);
      objects.push(leg);
    }
  }

  function createSupplyCrate() {
    // Crate box
    var crateGeom = new THREE.BoxGeometry(20, 20, 20);
    var crateMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.7,
      metalness: 0
    });
    var crate = new THREE.Mesh(crateGeom, crateMat);
    crate.position.set(-5, 80, -50);
    crate.castShadow = true;
    crate.receiveShadow = true;
    scene.add(crate);
    objects.push(crate);

    // Parachute (cone above)
    var parachuteGeom = new THREE.ConeGeometry(25, 20, 32);
    var paraMat = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      roughness: 0.6,
      metalness: 0
    });
    var parachute = new THREE.Mesh(parachuteGeom, paraMat);
    parachute.position.set(-5, 105, -50);
    parachute.castShadow = true;
    parachute.receiveShadow = true;
    scene.add(parachute);
    objects.push(parachute);

    animations.push({
      type: 'crate',
      crate: crate,
      parachute: parachute,
      initialY: 80,
      finalY: 20,
      speed: 0.08
    });
  }

  function createCrevasse() {
    var geometry = new THREE.BoxGeometry(80, 15, 30);
    var material = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.9,
      metalness: 0
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(80, -8, 0);
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);
  }

  function createBeacon() {
    // Post (cylinder)
    var postGeom = new THREE.CylinderGeometry(2, 2, 40, 8);
    var postMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.7,
      metalness: 0
    });
    var post = new THREE.Mesh(postGeom, postMat);
    post.position.set(-70, 25, -60);
    post.castShadow = true;
    post.receiveShadow = true;
    scene.add(post);
    objects.push(post);

    // Strobe light (emissive orange)
    var strobeGeom = new THREE.SphereGeometry(4, 8, 8);
    var strobeMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff6600,
      emissiveIntensity: 1,
      roughness: 0.3,
      metalness: 0.5
    });
    var strobe = new THREE.Mesh(strobeGeom, strobeMat);
    strobe.position.set(-70, 45, -60);
    strobe.castShadow = true;
    scene.add(strobe);
    objects.push(strobe);

    animations.push({
      type: 'strobe',
      mesh: strobe,
      material: strobeMat,
      on: true
    });
  }

  function createHUD() {
    hudCanvas = document.createElement('canvas');
    hudCanvas.width = 512;
    hudCanvas.height = 256;
    hudCtx = hudCanvas.getContext('2d');

    var texture = new THREE.CanvasTexture(hudCanvas);
    var geometry = new THREE.BoxGeometry(100, 50, 1);
    var material = new THREE.MeshBasicMaterial({ map: texture });
    var plane = new THREE.Mesh(geometry, material);
    plane.position.set(0, 100, -200);
    plane.position.z -= 0.1;
    scene.add(plane);
    objects.push(plane);

    updateHUDText();
  }

  function updateHUDText() {
    if (!hudCtx) return;

    hudCtx.fillStyle = '#000000';
    hudCtx.fillRect(0, 0, hudCanvas.width, hudCanvas.height);

    hudCtx.fillStyle = '#ffffff';
    hudCtx.font = 'bold 40px Arial';
    hudCtx.fillText('SURVIVORS FOUND: 0/5', 20, 60);
    hudCtx.fillText('RESCUE TEAMS DEPLOYED: 3', 20, 120);
    hudCtx.fillText('AVALANCHE STATUS: ACTIVE', 20, 180);

    hudCtx.fillStyle = '#ffff00';
    hudCtx.font = '20px Arial';
    hudCtx.fillText('[Press A+Z to toggle HUD]', 20, 230);

    if (hudCanvas.parentElement === undefined) {
      var texture = new THREE.CanvasTexture(hudCanvas);
      texture.needsUpdate = true;
    }
  }

  function onKeyDown(event) {
    var key = event.key.toUpperCase();

    lastKeyPress[key] = true;

    if (key === 'A' && !keyComboPending) {
      keyComboPending = true;
      if (keyComboPendingTimeout) {
        clearTimeout(keyComboPendingTimeout);
      }
      keyComboPendingTimeout = setTimeout(function() {
        keyComboPending = false;
      }, 400);
    } else if (key === 'Z' && keyComboPending && lastKeyPress['A']) {
      hudVisible = !hudVisible;
      keyComboPending = false;
      if (keyComboPendingTimeout) {
        clearTimeout(keyComboPendingTimeout);
      }
    }
  }

  function onWindowResize() {
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function animate() {
    requestAnimationFrame(animate);

    var deltaTime = clock.getDelta();
    var elapsedTime = clock.getElapsedTime();

    // Update animations
    animations.forEach(function(anim) {
      if (anim.type === 'avalanche') {
        anim.mesh.position.z += anim.speed;
        anim.mesh.position.y -= anim.speed * 0.5;
        if (anim.mesh.position.z > 150) {
          anim.mesh.position.z = -100;
          anim.mesh.position.y = anim.initialY;
        }
      } else if (anim.type === 'helicopter') {
        anim.fuselage.position.y = anim.hoverHeight + Math.sin(elapsedTime * anim.hoverSpeed) * anim.hoverRange;
        anim.rotor.rotation.z += 0.3;
      } else if (anim.type === 'dog') {
        var dogX = anim.initialX + Math.sin(elapsedTime * anim.speed) * anim.range;
        anim.body.position.x = dogX;
      } else if (anim.type === 'dig') {
        anim.mesh.position.y = anim.initialY + Math.sin(elapsedTime * anim.speed * 3) * anim.range;
      } else if (anim.type === 'strobe') {
        var strobeIntensity = Math.sin(elapsedTime * 5) > 0.5 ? 1 : 0.2;
        anim.material.emissiveIntensity = strobeIntensity;
      } else if (anim.type === 'crate') {
        var crateY = anim.initialY - (anim.initialY - anim.finalY) * Math.min(elapsedTime * anim.speed, 1);
        anim.crate.position.y = crateY;
        anim.parachute.position.y = crateY + 25;
      }
    });

    renderer.render(scene, camera);
  }

  function update() {
    // Called externally if needed
  }

  function reset() {
    // Dispose resources
    objects.forEach(function(obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(m) { m.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
    });

    if (hudCanvas && hudCanvas.parentNode) {
      hudCanvas.parentNode.removeChild(hudCanvas);
    }

    objects = [];
    animations = [];
    clock = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
