window.MountainRescue = (function() {
  'use strict';

  var scene, camera, renderer, clock;
  var sceneObjects = [];
  var updatables = [];
  var keysPressed = {};
  var lastMPress = 0;
  var hudVisible = true;
  var hudCanvas, hudCtx;
  var gameState = {
    climbersRescued: 0,
    militiaNeutralized: 0,
    helicopterFuel: 78
  };

  function init(containerElement) {
    clock = new THREE.Clock();

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 500, 1000);

    // Camera setup
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(200, 150, 200);
    camera.lookAt(0, 100, 0);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    containerElement.appendChild(renderer.domElement);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -500;
    directionalLight.shadow.camera.right = 500;
    directionalLight.shadow.camera.top = 500;
    directionalLight.shadow.camera.bottom = -500;
    scene.add(directionalLight);

    // Build scene objects
    buildCliffFace();
    buildMountainLedge();
    buildStrandedClimbers();
    buildRescueHelicopter();
    buildWinchCable();
    buildMilitiaSoldiers();
    buildMountainRoad();
    buildMilitiaTruck();
    buildRockfallDebris();
    buildClimbingRopeAnchor();
    buildEmergencyBivouac();
    buildRescueMedic();
    buildAntiAircraftPosition();
    buildRadioRelayTower();
    buildMountainGoat();
    buildSupplyCache();
    buildFlareSignal();

    // HUD setup
    setupHUD();

    // Event listeners
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      update(clock.getDelta());
      renderer.render(scene, camera);
    }
    animate();
  }

  function buildCliffFace() {
    var geometry = new THREE.BoxGeometry(80, 400, 40);
    var material = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 });
    var cliff = new THREE.Mesh(geometry, material);
    cliff.position.set(0, 200, 0);
    cliff.castShadow = true;
    cliff.receiveShadow = true;
    scene.add(cliff);
    sceneObjects.push({ mesh: cliff, material: material, geometry: geometry });
  }

  function buildMountainLedge() {
    var geometry = new THREE.BoxGeometry(100, 20, 60);
    var material = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.7 });
    var ledge = new THREE.Mesh(geometry, material);
    ledge.position.set(0, 180, -20);
    ledge.castShadow = true;
    ledge.receiveShadow = true;
    scene.add(ledge);
    sceneObjects.push({ mesh: ledge, material: material, geometry: geometry });
  }

  function buildStrandedClimbers() {
    var positions = [
      { x: -20, z: -20 },
      { x: 0, z: -20 },
      { x: 20, z: -20 }
    ];

    positions.forEach(function(pos) {
      // Body (box)
      var bodyGeom = new THREE.BoxGeometry(8, 20, 8);
      var bodyMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.set(pos.x, 195, pos.z);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);
      sceneObjects.push({ mesh: body, material: bodyMat, geometry: bodyGeom });

      // Head (sphere)
      var headGeom = new THREE.SphereGeometry(5, 16, 16);
      var headMat = new THREE.MeshStandardMaterial({ color: 0xfdbcb4 });
      var head = new THREE.Mesh(headGeom, headMat);
      head.position.set(pos.x, 215, pos.z);
      head.castShadow = true;
      head.receiveShadow = true;
      scene.add(head);
      sceneObjects.push({ mesh: head, material: headMat, geometry: headGeom });

      // Store for animation
      updatables.push({
        type: 'climber',
        body: body,
        head: head,
        amplitude: 5,
        phase: Math.random() * Math.PI * 2,
        frequency: 1
      });
    });
  }

  function buildRescueHelicopter() {
    // Fuselage (box)
    var fuselageGeom = new THREE.BoxGeometry(15, 12, 50);
    var fuselageMat = new THREE.MeshStandardMaterial({ color: 0xff4444 });
    var fuselage = new THREE.Mesh(fuselageGeom, fuselageMat);
    fuselage.position.set(100, 300, 100);
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    scene.add(fuselage);
    sceneObjects.push({ mesh: fuselage, material: fuselageMat, geometry: fuselageGeom });

    // Rotor (cylinder)
    var rotorGeom = new THREE.CylinderGeometry(40, 40, 2, 16);
    var rotorMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var rotor = new THREE.Mesh(rotorGeom, rotorMat);
    rotor.position.set(100, 318, 100);
    rotor.castShadow = true;
    rotor.receiveShadow = true;
    scene.add(rotor);
    sceneObjects.push({ mesh: rotor, material: rotorMat, geometry: rotorGeom });

    // Store for animation
    updatables.push({
      type: 'helicopter',
      fuselage: fuselage,
      rotor: rotor,
      startPos: new THREE.Vector3(100, 300, 100),
      circleRadius: 80,
      phase: 0,
      descending: true,
      descent: 0
    });
  }

  function buildWinchCable() {
    var points = [
      new THREE.Vector3(100, 300, 100),
      new THREE.Vector3(0, 120, -20)
    ];
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var material = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 });
    var cable = new THREE.LineSegments(geometry, material);
    scene.add(cable);

    // Store for animation
    updatables.push({
      type: 'winchCable',
      cable: cable,
      maxExtension: 150
    });

    sceneObjects.push({ mesh: cable, material: material, geometry: geometry });
  }

  function buildMilitiaSoldiers() {
    var positions = [
      { x: -80, y: 5 },
      { x: -40, y: 5 },
      { x: 40, y: 5 },
      { x: 80, y: 5 }
    ];

    positions.forEach(function(pos) {
      // Body (box)
      var bodyGeom = new THREE.BoxGeometry(6, 18, 6);
      var bodyMat = new THREE.MeshStandardMaterial({ color: 0x3d5c3d });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.set(pos.x, pos.y + 10, -100);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);
      sceneObjects.push({ mesh: body, material: bodyMat, geometry: bodyGeom });

      // Head (sphere)
      var headGeom = new THREE.SphereGeometry(4, 16, 16);
      var headMat = new THREE.MeshStandardMaterial({ color: 0xfdbcb4 });
      var head = new THREE.Mesh(headGeom, headMat);
      head.position.set(pos.x, pos.y + 28, -100);
      head.castShadow = true;
      head.receiveShadow = true;
      scene.add(head);
      sceneObjects.push({ mesh: head, material: headMat, geometry: headGeom });
    });
  }

  function buildMountainRoad() {
    var geometry = new THREE.BoxGeometry(150, 2, 300);
    var material = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
    var road = new THREE.Mesh(geometry, material);
    road.position.set(0, 0, -100);
    road.receiveShadow = true;
    scene.add(road);
    sceneObjects.push({ mesh: road, material: material, geometry: geometry });
  }

  function buildMilitiaTruck() {
    // Truck body (box)
    var bodyGeom = new THREE.BoxGeometry(20, 15, 40);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x556b2f });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(-80, 8, -150);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    sceneObjects.push({ mesh: body, material: bodyMat, geometry: bodyGeom });

    // Wheels (cylinders)
    var wheelPositions = [
      { x: -8, z: -10 },
      { x: -8, z: 10 },
      { x: 8, z: -10 },
      { x: 8, z: 10 }
    ];

    wheelPositions.forEach(function(pos) {
      var wheelGeom = new THREE.CylinderGeometry(5, 5, 4, 16);
      var wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      var wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(-80 + pos.x, 5, -150 + pos.z);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      scene.add(wheel);
      sceneObjects.push({ mesh: wheel, material: wheelMat, geometry: wheelGeom });
    });

    // Store for animation
    updatables.push({
      type: 'truck',
      body: body,
      startX: -80,
      direction: 1
    });
  }

  function buildRockfallDebris() {
    var count = 6;
    for (var i = 0; i < count; i++) {
      var size = 10 + Math.random() * 10;
      var geometry = new THREE.BoxGeometry(size, size, size);
      var material = new THREE.MeshStandardMaterial({ color: 0x6b5d52 });
      var rock = new THREE.Mesh(geometry, material);
      rock.position.set(-40 + Math.random() * 80, 5 + i * 8, -120 + Math.random() * 20);
      rock.castShadow = true;
      rock.receiveShadow = true;
      scene.add(rock);
      sceneObjects.push({ mesh: rock, material: material, geometry: geometry });

      // Store for animation
      updatables.push({
        type: 'rockfall',
        mesh: rock,
        velocity: { x: (Math.random() - 0.5) * 30, y: -50, z: (Math.random() - 0.5) * 20 },
        active: false
      });
    }
  }

  function buildClimbingRopeAnchor() {
    // Bolt (cylinder)
    var boltGeom = new THREE.CylinderGeometry(3, 3, 8, 8);
    var boltMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    var bolt = new THREE.Mesh(boltGeom, boltMat);
    bolt.position.set(-30, 200, -10);
    bolt.castShadow = true;
    bolt.receiveShadow = true;
    scene.add(bolt);
    sceneObjects.push({ mesh: bolt, material: boltMat, geometry: boltGeom });

    // Rope (LineSegments)
    var ropePoints = [
      new THREE.Vector3(-30, 200, -10),
      new THREE.Vector3(-20, 190, 0),
      new THREE.Vector3(-10, 180, 10)
    ];
    var ropeGeom = new THREE.BufferGeometry().setFromPoints(ropePoints);
    var ropeMat = new THREE.LineBasicMaterial({ color: 0xaa8844, linewidth: 2 });
    var rope = new THREE.LineSegments(ropeGeom, ropeMat);
    scene.add(rope);
    sceneObjects.push({ mesh: rope, material: ropeMat, geometry: ropeGeom });
  }

  function buildEmergencyBivouac() {
    var geometry = new THREE.BoxGeometry(25, 15, 20);
    var material = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
    var tent = new THREE.Mesh(geometry, material);
    tent.position.set(30, 190, -15);
    tent.castShadow = true;
    tent.receiveShadow = true;
    scene.add(tent);
    sceneObjects.push({ mesh: tent, material: material, geometry: geometry });
  }

  function buildRescueMedic() {
    // Body with orange vest (box)
    var bodyGeom = new THREE.BoxGeometry(7, 18, 7);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0xff8800 });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(50, 195, -15);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    sceneObjects.push({ mesh: body, material: bodyMat, geometry: bodyGeom });

    // Head (sphere)
    var headGeom = new THREE.SphereGeometry(4, 16, 16);
    var headMat = new THREE.MeshStandardMaterial({ color: 0xfdbcb4 });
    var head = new THREE.Mesh(headGeom, headMat);
    head.position.set(50, 215, -15);
    head.castShadow = true;
    head.receiveShadow = true;
    scene.add(head);
    sceneObjects.push({ mesh: head, material: headMat, geometry: headGeom });
  }

  function buildAntiAircraftPosition() {
    // Base (box)
    var baseGeom = new THREE.BoxGeometry(25, 5, 25);
    var baseMat = new THREE.MeshStandardMaterial({ color: 0x556b2f });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.set(-100, 8, -200);
    base.receiveShadow = true;
    scene.add(base);
    sceneObjects.push({ mesh: base, material: baseMat, geometry: baseGeom });

    // Gun barrel (cylinder)
    var gunGeom = new THREE.CylinderGeometry(2, 2, 40, 12);
    var gunMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var gun = new THREE.Mesh(gunGeom, gunMat);
    gun.rotation.z = Math.PI / 6;
    gun.position.set(-100, 25, -200);
    gun.castShadow = true;
    gun.receiveShadow = true;
    scene.add(gun);
    sceneObjects.push({ mesh: gun, material: gunMat, geometry: gunGeom });
  }

  function buildRadioRelayTower() {
    // Pole (cylinder)
    var poleGeom = new THREE.CylinderGeometry(3, 3, 150, 12);
    var poleMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    var pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.set(120, 75, -50);
    pole.castShadow = true;
    pole.receiveShadow = true;
    scene.add(pole);
    sceneObjects.push({ mesh: pole, material: poleMat, geometry: poleGeom });

    // Antenna (LineSegments)
    var antennaPts = [
      new THREE.Vector3(120, 150, -50),
      new THREE.Vector3(135, 160, -35)
    ];
    var antennaGeom = new THREE.BufferGeometry().setFromPoints(antennaPts);
    var antennaMat = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
    var antenna = new THREE.LineSegments(antennaGeom, antennaMat);
    scene.add(antenna);
    sceneObjects.push({ mesh: antenna, material: antennaMat, geometry: antennaGeom });
  }

  function buildMountainGoat() {
    // Body (box)
    var bodyGeom = new THREE.BoxGeometry(12, 18, 20);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(60, 160, 50);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    sceneObjects.push({ mesh: body, material: bodyMat, geometry: bodyGeom });

    // Head (box)
    var headGeom = new THREE.BoxGeometry(10, 12, 10);
    var headMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    var head = new THREE.Mesh(headGeom, headMat);
    head.position.set(60, 175, 65);
    head.castShadow = true;
    head.receiveShadow = true;
    scene.add(head);
    sceneObjects.push({ mesh: head, material: headMat, geometry: headGeom });
  }

  function buildSupplyCache() {
    // Crate (box)
    var crateGeom = new THREE.BoxGeometry(20, 20, 20);
    var crateMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    var crate = new THREE.Mesh(crateGeom, crateMat);
    crate.position.set(40, 195, 20);
    crate.castShadow = true;
    crate.receiveShadow = true;
    scene.add(crate);
    sceneObjects.push({ mesh: crate, material: crateMat, geometry: crateGeom });

    // Straps (LineSegments)
    var strapPts = [
      new THREE.Vector3(30, 210, 20),
      new THREE.Vector3(50, 210, 20),
      new THREE.Vector3(40, 200, 10),
      new THREE.Vector3(40, 200, 30)
    ];
    var strapGeom = new THREE.BufferGeometry().setFromPoints(strapPts);
    var strapMat = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
    var straps = new THREE.LineSegments(strapGeom, strapMat);
    scene.add(straps);
    sceneObjects.push({ mesh: straps, material: strapMat, geometry: strapGeom });
  }

  function buildFlareSignal() {
    var geometry = new THREE.SphereGeometry(4, 16, 16);
    var material = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.8
    });
    var flare = new THREE.Mesh(geometry, material);
    flare.position.set(0, 0, -20);
    scene.add(flare);
    sceneObjects.push({ mesh: flare, material: material, geometry: geometry });

    // Store for animation
    updatables.push({
      type: 'flare',
      mesh: flare,
      velocity: new THREE.Vector3(0, 120, 0),
      lifetime: 3,
      active: false
    });
  }

  function setupHUD() {
    hudCanvas = document.createElement('canvas');
    hudCanvas.width = window.innerWidth;
    hudCanvas.height = window.innerHeight;
    hudCanvas.style.position = 'absolute';
    hudCanvas.style.top = '0';
    hudCanvas.style.left = '0';
    hudCanvas.style.pointerEvents = 'none';
    document.body.appendChild(hudCanvas);
    hudCtx = hudCanvas.getContext('2d');
  }

  function updateHUD() {
    if (!hudVisible) {
      hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
      return;
    }

    hudCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    hudCtx.fillRect(0, 0, hudCanvas.width, hudCanvas.height);

    hudCtx.fillStyle = '#ffffff';
    hudCtx.font = 'bold 24px Arial';
    hudCtx.textAlign = 'left';

    var y = 40;
    var lineHeight = 50;

    hudCtx.fillText('CLIMBERS RESCUED: ' + gameState.climbersRescued + '/3', 20, y);
    y += lineHeight;
    hudCtx.fillText('MILITIA NEUTRALIZED: ' + gameState.militiaNeutralized + '/4', 20, y);
    y += lineHeight;
    hudCtx.fillText('HELICOPTER FUEL: ' + gameState.helicopterFuel + '%', 20, y);

    hudCtx.font = '16px Arial';
    hudCtx.textAlign = 'right';
    hudCtx.fillText('(Press M+R to toggle HUD)', hudCanvas.width - 20, hudCanvas.height - 20);
  }

  function onKeyDown(event) {
    keysPressed[event.key.toLowerCase()] = true;

    if (event.key.toLowerCase() === 'm') {
      var now = Date.now();
      if (now - lastMPress < 400) {
        hudVisible = !hudVisible;
      }
      lastMPress = now;
    }
  }

  function onKeyUp(event) {
    keysPressed[event.key.toLowerCase()] = false;
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    hudCanvas.width = window.innerWidth;
    hudCanvas.height = window.innerHeight;
  }

  function update(deltaTime) {
    // Update all animated objects
    updatables.forEach(function(obj) {
      if (obj.type === 'climber') {
        obj.phase += obj.frequency * deltaTime;
        var waveOffset = Math.sin(obj.phase) * obj.amplitude;
        obj.head.position.y += waveOffset * 0.1;
      }
      else if (obj.type === 'helicopter') {
        obj.phase += 0.3 * deltaTime;
        var newX = obj.startPos.x + Math.cos(obj.phase) * obj.circleRadius;
        var newZ = obj.startPos.z + Math.sin(obj.phase) * obj.circleRadius;
        obj.fuselage.position.x = newX;
        obj.fuselage.position.z = newZ;

        if (obj.descending && obj.descent < 100) {
          obj.descent += 30 * deltaTime;
          obj.fuselage.position.y = obj.startPos.y - obj.descent;
        }

        obj.rotor.position.x = newX;
        obj.rotor.position.z = newZ;
        obj.rotor.rotation.y += 0.3;
      }
      else if (obj.type === 'winchCable') {
        var helicopterY = scene.getObjectByProperty('uuid', updatables.find(function(u) { return u.type === 'helicopter'; }).fuselage.uuid).position.y;
        var targetY = helicopterY - 180;
        obj.cable.geometry.attributes.position.array[1] = targetY;
        obj.cable.geometry.attributes.position.needsUpdate = true;
      }
      else if (obj.type === 'truck') {
        obj.body.position.x += obj.direction * 30 * deltaTime;
        if (obj.body.position.x > -20 || obj.body.position.x < -150) {
          obj.direction *= -1;
        }
      }
      else if (obj.type === 'rockfall' && obj.active) {
        obj.mesh.position.x += obj.velocity.x * deltaTime;
        obj.mesh.position.y += obj.velocity.y * deltaTime;
        obj.mesh.position.z += obj.velocity.z * deltaTime;
        obj.velocity.y -= 98 * deltaTime;
        if (obj.mesh.position.y < 5) {
          obj.active = false;
        }
      }
      else if (obj.type === 'flare' && obj.active) {
        obj.mesh.position.x += obj.velocity.x * deltaTime;
        obj.mesh.position.y += obj.velocity.y * deltaTime;
        obj.mesh.position.z += obj.velocity.z * deltaTime;
        obj.lifetime -= deltaTime;
        if (obj.lifetime <= 0) {
          obj.active = false;
        }
      }
    });

    // Decrement fuel
    if (gameState.helicopterFuel > 0) {
      gameState.helicopterFuel = Math.max(0, gameState.helicopterFuel - 5 * deltaTime);
    }

    // Update HUD
    updateHUD();
  }

  function reset() {
    // Dispose of all geometries and materials
    sceneObjects.forEach(function(obj) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(m) { m.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
      if (obj.mesh) {
        obj.mesh.parent.remove(obj.mesh);
      }
    });

    sceneObjects = [];
    updatables = [];
    keysPressed = {};
    gameState = {
      climbersRescued: 0,
      militiaNeutralized: 0,
      helicopterFuel: 78
    };

    if (hudCanvas && hudCanvas.parentNode) {
      hudCanvas.parentNode.removeChild(hudCanvas);
    }
    hudCanvas = null;
    hudCtx = null;

    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }

    scene = null;
    camera = null;
    renderer = null;
    clock = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
