window.CrashedUFO = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var animationTimers = [];
  var alienSpawns = [];
  var particles = [];

  var colors = {
    alienSilver: 0xC0C0C0,
    energyCyan: 0x00FFEE,
    militaryGreen: 0x4A5C3A,
    crashFire: 0xFF4400,
    desertSand: 0xC8A84B,
    alienGlow: 0x88FF88
  };

  function createCrashedUFOHull() {
    var geometry = new THREE.CylinderGeometry(40, 40, 8, 64, 8);
    var material = new THREE.MeshStandardMaterial({
      color: colors.alienSilver,
      metalness: 0.9,
      roughness: 0.1
    });
    var hull = new THREE.Mesh(geometry, material);
    hull.rotation.z = 0.35;
    hull.position.set(0, 5, -20);
    hull.castShadow = true;
    hull.receiveShadow = true;
    scene.add(hull);
    meshes.push(hull);
    return hull;
  }

  function createImpactCrater() {
    var geometry = new THREE.CylinderGeometry(50, 55, 6, 48, 8);
    var material = new THREE.MeshStandardMaterial({
      color: 0x3D2817,
      metalness: 0.0,
      roughness: 1.0
    });
    var crater = new THREE.Mesh(geometry, material);
    crater.position.set(0, -0.5, -20);
    crater.receiveShadow = true;
    scene.add(crater);
    meshes.push(crater);

    for (var i = 0; i < 12; i++) {
      var angle = (Math.PI * 2 * i) / 12;
      var debrisScale = Math.random() * 3 + 2;
      var debrisGeometry = new THREE.BoxGeometry(debrisScale, debrisScale * 0.6, debrisScale);
      var debrisMaterial = new THREE.MeshStandardMaterial({
        color: 0x4A4A4A,
        roughness: 0.8
      });
      var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      debris.position.set(
        Math.cos(angle) * 45,
        0.5,
        -20 + Math.sin(angle) * 45
      );
      debris.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
      debris.castShadow = true;
      debris.receiveShadow = true;
      scene.add(debris);
      meshes.push(debris);
    }
  }

  function createAlienTechnologyPanels() {
    var panelPositions = [
      { x: -25, z: -15 },
      { x: 25, z: -15 },
      { x: 0, z: -35 },
      { x: -15, z: -25 },
      { x: 15, z: -25 }
    ];

    panelPositions.forEach(function(pos) {
      var panelGeometry = new THREE.BoxGeometry(8, 12, 0.5);
      var panelMaterial = new THREE.MeshStandardMaterial({
        color: colors.energyCyan,
        emissive: colors.energyCyan,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.1
      });
      var panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(pos.x, 4, pos.z);
      panel.castShadow = true;
      panel.receiveShadow = true;
      scene.add(panel);
      meshes.push(panel);

      var glowGeometry = new THREE.BoxGeometry(8.2, 12.2, 0.6);
      var glowMaterial = new THREE.MeshBasicMaterial({
        color: colors.energyCyan,
        transparent: true,
        opacity: 0.2
      });
      var glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(panel.position);
      glow.position.z -= 0.5;
      scene.add(glow);
      meshes.push(glow);
    });
  }

  function createMilitaryPerimeterFence() {
    var fenceLength = 120;
    var fenceHeight = 3;
    var postSpacing = 10;

    for (var i = 0; i < fenceLength; i += postSpacing) {
      var angle = (Math.PI * 2 * i) / fenceLength;
      var radius = 70;
      var x = Math.cos(angle) * radius;
      var z = -20 + Math.sin(angle) * radius;

      var postGeometry = new THREE.BoxGeometry(0.4, fenceHeight, 0.4);
      var postMaterial = new THREE.MeshStandardMaterial({
        color: 0x2A2A2A,
        metalness: 0.6,
        roughness: 0.4
      });
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(x, fenceHeight / 2, z);
      post.castShadow = true;
      post.receiveShadow = true;
      scene.add(post);
      meshes.push(post);

      var wireGeometry = new THREE.BoxGeometry(postSpacing, fenceHeight * 0.8, 0.1);
      var wireMaterial = new THREE.MeshStandardMaterial({
        color: 0x3A3A3A,
        metalness: 0.5
      });
      var wire = new THREE.Mesh(wireGeometry, wireMaterial);
      wire.position.set(x, fenceHeight * 0.5, z);
      scene.add(wire);
      meshes.push(wire);
    }
  }

  function createMilitarySearchlights() {
    var lightPositions = [
      { x: -60, z: 20 },
      { x: 60, z: 20 },
      { x: -50, z: -60 },
      { x: 50, z: -60 }
    ];

    lightPositions.forEach(function(pos) {
      var baseGeometry = new THREE.CylinderGeometry(2, 2.5, 1, 16);
      var baseMaterial = new THREE.MeshStandardMaterial({
        color: colors.militaryGreen,
        metalness: 0.4
      });
      var base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.set(pos.x, 0.5, pos.z);
      base.castShadow = true;
      scene.add(base);
      meshes.push(base);

      var mountGeometry = new THREE.BoxGeometry(1.5, 4, 1);
      var mountMaterial = new THREE.MeshStandardMaterial({
        color: colors.militaryGreen,
        metalness: 0.3
      });
      var mount = new THREE.Mesh(mountGeometry, mountMaterial);
      mount.position.set(pos.x, 2.5, pos.z);
      mount.castShadow = true;
      scene.add(mount);
      meshes.push(mount);

      var headGeometry = new THREE.SphereGeometry(1.2, 16, 12);
      var headMaterial = new THREE.MeshStandardMaterial({
        color: 0x1A1A1A,
        metalness: 0.7
      });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(pos.x, 5, pos.z);
      head.castShadow = true;
      scene.add(head);
      meshes.push(head);

      var searchlight = new THREE.SpotLight(0xFFFFFF, 1, 200, Math.PI / 4, 1, 2);
      searchlight.position.set(pos.x, 5.2, pos.z);
      searchlight.target.position.set(0, 0, -20);
      searchlight.castShadow = true;
      scene.add(searchlight);
      scene.add(searchlight.target);
      meshes.push(searchlight);
      animationTimers.push({ object: head, type: 'searchlight' });
    });
  }

  function createArmyVehicles() {
    var vehiclePositions = [
      { x: -45, z: 35 },
      { x: 45, z: 35 },
      { x: -40, z: -55 },
      { x: 40, z: -55 }
    ];

    vehiclePositions.forEach(function(pos) {
      var bodyGeometry = new THREE.BoxGeometry(5, 3, 8);
      var bodyMaterial = new THREE.MeshStandardMaterial({
        color: colors.militaryGreen,
        metalness: 0.2,
        roughness: 0.6
      });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(pos.x, 1.5, pos.z);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);
      meshes.push(body);

      var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.2, 16);
      var wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x1A1A1A,
        metalness: 0.3
      });

      var wheelPositions = [
        { x: -2, z: -2 },
        { x: 2, z: -2 },
        { x: -2, z: 2 },
        { x: 2, z: 2 }
      ];

      wheelPositions.forEach(function(wPos) {
        var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos.x + wPos.x, 0.8, pos.z + wPos.z);
        wheel.castShadow = true;
        scene.add(wheel);
        meshes.push(wheel);
      });

      var turretGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 16);
      var turretMaterial = new THREE.MeshStandardMaterial({
        color: colors.militaryGreen,
        metalness: 0.3
      });
      var turret = new THREE.Mesh(turretGeometry, turretMaterial);
      turret.position.set(pos.x, 3.5, pos.z);
      turret.castShadow = true;
      scene.add(turret);
      meshes.push(turret);
    });
  }

  function createCommandTent() {
    var tentFrameGeometry = new THREE.BoxGeometry(15, 5, 10);
    var tentMaterial = new THREE.MeshStandardMaterial({
      color: 0x5A5A4A,
      metalness: 0.1,
      roughness: 0.8
    });
    var tent = new THREE.Mesh(tentFrameGeometry, tentMaterial);
    tent.position.set(-50, 2.5, 0);
    tent.castShadow = true;
    tent.receiveShadow = true;
    scene.add(tent);
    meshes.push(tent);

    var poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 12);
    var poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x2A2A1A,
      metalness: 0.4
    });

    var polePositions = [
      { x: -45, z: -3 },
      { x: -45, z: 3 },
      { x: -55, z: -3 },
      { x: -55, z: 3 }
    ];

    polePositions.forEach(function(pPos) {
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(pPos.x, 3, pPos.z);
      pole.castShadow = true;
      scene.add(pole);
      meshes.push(pole);
    });
  }

  function createGovernmentBlackVan() {
    var vanGeometry = new THREE.BoxGeometry(4, 3.5, 7);
    var vanMaterial = new THREE.MeshStandardMaterial({
      color: 0x0A0A0A,
      metalness: 0.4,
      roughness: 0.3
    });
    var van = new THREE.Mesh(vanGeometry, vanMaterial);
    van.position.set(50, 1.75, 0);
    van.castShadow = true;
    van.receiveShadow = true;
    scene.add(van);
    meshes.push(van);

    var antennaGeometry = new THREE.CylinderGeometry(0.15, 0.15, 4, 8);
    var antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A1A1A,
      metalness: 0.6
    });
    var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(50, 5, 0);
    antenna.castShadow = true;
    scene.add(antenna);
    meshes.push(antenna);
  }

  function createPowerCablesAndConduits() {
    var conduitPositions = [
      { start: { x: -20, y: 8, z: -15 }, end: { x: -5, y: 6, z: -20 } },
      { start: { x: 20, y: 8, z: -15 }, end: { x: 5, y: 6, z: -20 } },
      { start: { x: 0, y: 8, z: -35 }, end: { x: 0, y: 6, z: -20 } }
    ];

    conduitPositions.forEach(function(conduit) {
      var dx = conduit.end.x - conduit.start.x;
      var dy = conduit.end.y - conduit.start.y;
      var dz = conduit.end.z - conduit.start.z;
      var length = Math.sqrt(dx * dx + dy * dy + dz * dz);

      var tubeGeometry = new THREE.CylinderGeometry(0.4, 0.4, length, 8);
      var tubeMaterial = new THREE.MeshStandardMaterial({
        color: colors.energyCyan,
        emissive: colors.energyCyan,
        emissiveIntensity: 0.3,
        metalness: 0.7,
        roughness: 0.2
      });
      var tube = new THREE.Mesh(tubeGeometry, tubeMaterial);

      var midX = (conduit.start.x + conduit.end.x) / 2;
      var midY = (conduit.start.y + conduit.end.y) / 2;
      var midZ = (conduit.start.z + conduit.end.z) / 2;
      tube.position.set(midX, midY, midZ);

      var angle = Math.atan2(dz, dx);
      var vertAngle = Math.asin(dy / length);
      tube.rotation.z = vertAngle;
      tube.rotation.y = angle;

      tube.castShadow = true;
      tube.receiveShadow = true;
      scene.add(tube);
      meshes.push(tube);
    });
  }

  function createAlienPowerCore() {
    var coreGeometry = new THREE.SphereGeometry(6, 32, 32);
    var coreMaterial = new THREE.MeshStandardMaterial({
      color: colors.alienGlow,
      emissive: colors.alienGlow,
      emissiveIntensity: 0.6,
      metalness: 0.3,
      roughness: 0.3
    });
    var core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.set(0, 8, -20);
    core.castShadow = true;
    scene.add(core);
    meshes.push(core);

    var ringGroup = new THREE.Group();
    var ringMaterial = new THREE.MeshStandardMaterial({
      color: colors.energyCyan,
      emissive: colors.energyCyan,
      emissiveIntensity: 0.4,
      metalness: 0.8
    });
    for (var ri = 0; ri < 12; ri++) {
      var rAngle = (ri / 12) * Math.PI * 2;
      var rSeg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), ringMaterial);
      rSeg.position.set(Math.cos(rAngle) * 7, Math.sin(rAngle) * 7, 0);
      ringGroup.add(rSeg);
    }
    ringGroup.position.set(0, 8, -20);
    ringGroup.rotation.x = Math.PI / 3;
    scene.add(ringGroup);
    meshes.push(ringGroup);
    var ring = ringGroup;

    animationTimers.push({ object: core, type: 'powercore', ring: ring });

    var energyRingGroup = new THREE.Group();
    var energyRingMaterial = new THREE.MeshStandardMaterial({
      color: colors.alienGlow,
      emissive: colors.alienGlow,
      emissiveIntensity: 0.3,
      metalness: 0.6
    });
    for (var eri = 0; eri < 12; eri++) {
      var erAngle = (eri / 12) * Math.PI * 2;
      var erSeg = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), energyRingMaterial);
      erSeg.position.set(Math.cos(erAngle) * 8.5, Math.sin(erAngle) * 8.5, 0);
      energyRingGroup.add(erSeg);
    }
    energyRingGroup.position.set(0, 8, -20);
    energyRingGroup.rotation.z = Math.PI / 4;
    scene.add(energyRingGroup);
    meshes.push(energyRingGroup);
    var energyRing = energyRingGroup;
  }

  function createEnergyDischargeArcs() {
    var arcEndPoints = [
      { start: { x: -15, y: 12, z: -15 }, end: { x: 15, y: 6, z: -25 } },
      { start: { x: 0, y: 14, z: -20 }, end: { x: -20, y: 8, z: -20 } },
      { start: { x: 0, y: 14, z: -20 }, end: { x: 20, y: 8, z: -20 } }
    ];

    arcEndPoints.forEach(function(arc) {
      var points = [];
      for (var i = 0; i <= 20; i++) {
        var t = i / 20;
        var x = arc.start.x + (arc.end.x - arc.start.x) * t;
        var y = arc.start.y + (arc.end.y - arc.start.y) * t;
        var z = arc.start.z + (arc.end.z - arc.start.z) * t;
        y += Math.sin(t * Math.PI) * 5;
        points.push(new THREE.Vector3(x, y, z));
      }
      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var material = new THREE.LineBasicMaterial({
        color: colors.energyCyan,
        linewidth: 3
      });
      var line = new THREE.LineSegments(geometry, material);
      scene.add(line);
      meshes.push(line);
      animationTimers.push({ object: line, type: 'arc', material: material });
    });
  }

  function createAlienSpawnPoints() {
    var spawnLocations = [
      { x: 0, y: 0, z: -20, name: 'inside_ship' },
      { x: -35, y: 0, z: -30, name: 'crater_edge' },
      { x: 35, y: 0, z: -30, name: 'crater_edge' },
      { x: -25, y: 0, z: -10, name: 'perimeter' },
      { x: 25, y: 0, z: -10, name: 'perimeter' }
    ];

    spawnLocations.forEach(function(loc) {
      var spawnMarker = {
        position: new THREE.Vector3(loc.x, loc.y, loc.z),
        name: loc.name,
        nextSpawnTime: 0,
        spawnCooldown: 3 + Math.random() * 5
      };
      alienSpawns.push(spawnMarker);
    });
  }

  function createDebrisSmoke() {
    var smokePositions = [
      { x: -20, z: -15 },
      { x: 20, z: -15 },
      { x: 0, z: -35 }
    ];

    smokePositions.forEach(function(pos) {
      animationTimers.push({
        type: 'smoke',
        position: new THREE.Vector3(pos.x, 3, pos.z),
        opacity: 0.3
      });
    });
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    animationTimers = [];
    alienSpawns = [];
    particles = [];

    var groundGeometry = new THREE.BoxGeometry(200, 0.5, 200);
    var groundMaterial = new THREE.MeshStandardMaterial({
      color: colors.desertSand,
      metalness: 0.0,
      roughness: 1.0
    });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    scene.add(ground);
    meshes.push(ground);

    createCrashedUFOHull();
    createImpactCrater();
    createAlienTechnologyPanels();
    createMilitaryPerimeterFence();
    createMilitarySearchlights();
    createArmyVehicles();
    createCommandTent();
    createGovernmentBlackVan();
    createPowerCablesAndConduits();
    createAlienPowerCore();
    createEnergyDischargeArcs();
    createAlienSpawnPoints();
    createDebrisSmoke();

    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
    scene.add(ambientLight);

    var sunLight = new THREE.DirectionalLight(0xFFFFFF, 0.7);
    sunLight.position.set(50, 80, 50);
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);
  }

  function update(delta) {
    var time = Date.now() * 0.001;

    for (var i = 0; i < animationTimers.length; i++) {
      var timer = animationTimers[i];

      if (timer.type === 'powercore') {
        timer.object.rotation.x += delta * 0.3;
        timer.object.rotation.y += delta * 0.5;
        var pulseScale = 1 + Math.sin(time * 3) * 0.15;
        timer.object.scale.set(pulseScale, pulseScale, pulseScale);

        if (timer.ring) {
          timer.ring.rotation.y += delta * 0.8;
        }
      }

      if (timer.type === 'searchlight') {
        timer.object.rotation.y = Math.sin(time * 0.5) * 1.5;
        timer.object.rotation.z = Math.cos(time * 0.3) * 0.3;
      }

      if (timer.type === 'arc') {
        var arcOpacity = 0.3 + Math.sin(time * 5) * 0.4;
        if (timer.material) {
          timer.material.opacity = arcOpacity;
          timer.material.transparent = true;
        }
      }

      if (timer.type === 'smoke') {
        timer.opacity = 0.2 + Math.sin(time * 1.5) * 0.15;
      }
    }

    for (var j = 0; j < alienSpawns.length; j++) {
      var spawn = alienSpawns[j];
      spawn.nextSpawnTime -= delta;
    }
  }

  function reset() {
    for (var i = meshes.length - 1; i >= 0; i--) {
      var mesh = meshes[i];
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(function(mat) {
            if (mat.dispose) {
              mat.dispose();
            }
          });
        } else if (mesh.material.dispose) {
          mesh.material.dispose();
        }
      }
      scene.remove(mesh);
    }
    meshes = [];
    animationTimers = [];
    alienSpawns = [];
    particles = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
