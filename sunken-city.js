window.SunkenCity = (function() {
  'use strict';

  var scene, camera;
  var objects = [];
  var animations = [];
  var hudElement = null;
  var hudState = { artifacts: 0, rivalTeam: 3, depth: -120 };
  var keyStates = { h: false, u: false };
  var lastHKeyTime = 0;

  // Helper: Create a box (replaces PlaneGeometry for flat surfaces)
  function createBox(width, height, depth, color, emissive) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || 0x000000,
      emissiveIntensity: emissive ? 0.5 : 0
    });
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  // Helper: Create a cylinder approximation with rotated box
  function createCylinder(radiusX, radiusZ, height, color) {
    var geometry = new THREE.BoxGeometry(radiusX * 2, height, radiusZ * 2);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    objects = [];
    animations = [];

    // 1. Ocean floor
    var oceanFloor = createBox(400, 0.3, 400, 0x0a1020);
    oceanFloor.position.set(0, -200, 0);
    scene.add(oceanFloor);
    objects.push(oceanFloor);

    // 2. Main sunken temple
    var temple = createBox(25, 15, 20, 0x4a5a3a);
    temple.position.set(0, -100, 0);
    scene.add(temple);
    objects.push(temple);

    // 3. Column ruins (8 broken pillars)
    var columnPositions = [
      { x: -30, z: -20 }, { x: 30, z: -20 }, { x: -30, z: 20 }, { x: 30, z: 20 },
      { x: -50, z: 0 }, { x: 50, z: 0 }, { x: 0, z: -40 }, { x: 0, z: 40 }
    ];
    for (var i = 0; i < columnPositions.length; i++) {
      var col = createBox(2, 12, 2, 0x6a7a5a);
      col.position.copy(columnPositions[i]);
      col.position.y = -94;
      col.rotation.z = (Math.random() - 0.5) * 0.4;
      scene.add(col);
      objects.push(col);
    }

    // 4. Coral reef formations (10 clusters)
    var coralColors = [0xff6b3a, 0xff8a4a, 0xee5a3f, 0xdd6b4a, 0xcc7a5a];
    for (var i = 0; i < 10; i++) {
      var clusterX = (Math.random() - 0.5) * 200;
      var clusterZ = (Math.random() - 0.5) * 200;
      for (var j = 0; j < 3; j++) {
        var coralColor = coralColors[Math.floor(Math.random() * coralColors.length)];
        var coral = createBox(3 + Math.random() * 2, 2 + Math.random() * 3, 3 + Math.random() * 2, coralColor);
        coral.position.set(clusterX + (Math.random() - 0.5) * 10, -150 + j * 2, clusterZ + (Math.random() - 0.5) * 10);
        coral.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
        scene.add(coral);
        objects.push(coral);
      }
    }

    // 5. Treasure hunter divers (4 divers)
    for (var i = 0; i < 4; i++) {
      var diver = createDiver(0xffffff, 0x000000);
      diver.position.set((Math.random() - 0.5) * 100, -80 + Math.random() * 30, (Math.random() - 0.5) * 100);
      scene.add(diver);
      objects.push(diver);

      // Bubble animation
      (function(d) {
        animations.push({
          update: function(delta) {
            d.position.y += delta * 10;
            if (d.position.y > -40) {
              d.position.y = -120;
            }
          }
        });
      })(diver);
    }

    // 6. Armed looter divers (3 divers)
    for (var i = 0; i < 3; i++) {
      var looter = createDiver(0x1a1a2a, 0x000000);
      looter.position.set((Math.random() - 0.5) * 80, -90 + Math.random() * 20, (Math.random() - 0.5) * 80);
      scene.add(looter);
      objects.push(looter);

      // Armed look - add weapon arm
      var weaponArm = createBox(0.5, 0.3, 3, 0x2a2a2a);
      weaponArm.position.set(2.5, 0, 0);
      looter.add(weaponArm);
    }

    // 7. Ancient city street
    var street = createBox(15, 0.2, 60, 0x5a6a5a);
    street.position.set(0, -180, 0);
    scene.add(street);
    objects.push(street);

    // 8. Submerged palace wall
    var palaceWall = createBox(40, 18, 1, 0x4a6a5a);
    palaceWall.position.set(60, -95, 0);
    scene.add(palaceWall);
    objects.push(palaceWall);

    // Add carved arch windows
    for (var i = 0; i < 4; i++) {
      var window = createBox(3, 4, 0.5, 0x1a2a1a);
      window.position.set(60, -80 + i * 8, 0.6);
      scene.add(window);
      objects.push(window);
    }

    // 9. Treasure chest cluster (5 chests)
    for (var i = 0; i < 5; i++) {
      var chest = createBox(2, 1.5, 1.5, 0x8b7355, 0xffd700);
      chest.position.set(-60 + i * 5, -175, (Math.random() - 0.5) * 20);
      scene.add(chest);
      objects.push(chest);

      // Glow pulse animation
      (function(c) {
        animations.push({
          update: function(delta) {
            var pulse = Math.sin(Date.now() * 0.003 + objects.indexOf(c)) * 0.3 + 0.5;
            c.material.emissiveIntensity = pulse;
          }
        });
      })(chest);
    }

    // 10. Bioluminescent jellyfish (8 jellyfish)
    for (var i = 0; i < 8; i++) {
      var jellyfish = createJellyfish();
      jellyfish.position.set((Math.random() - 0.5) * 150, -70 - Math.random() * 80, (Math.random() - 0.5) * 150);
      scene.add(jellyfish);
      objects.push(jellyfish);

      // Pulse and drift animation
      (function(j) {
        var driftPhase = Math.random() * Math.PI * 2;
        animations.push({
          update: function(delta) {
            var driftX = Math.sin(Date.now() * 0.0005 + driftPhase) * 20;
            var driftZ = Math.cos(Date.now() * 0.0005 + driftPhase) * 20;
            j.position.x = ((Math.random() - 0.5) * 150 + driftX);
            j.position.z = ((Math.random() - 0.5) * 150 + driftZ);
            j.position.y += delta * 5;
            if (j.position.y > -40) {
              j.position.y = -140;
            }
            j.scale.y = 0.8 + Math.sin(Date.now() * 0.005) * 0.3;
          }
        });
      })(jellyfish);
    }

    // 11. Fish school (25 tiny fish)
    var fishSchool = new THREE.Group();
    for (var i = 0; i < 25; i++) {
      var fish = createBox(0.3, 0.15, 0.8, 0xffaa44);
      var angle = (i / 25) * Math.PI * 2;
      fish.position.set(Math.cos(angle) * 30, -100, Math.sin(angle) * 30);
      fishSchool.add(fish);
    }
    scene.add(fishSchool);
    objects.push(fishSchool);

    animations.push({
      update: function(delta) {
        fishSchool.rotation.y += delta * 0.3;
      }
    });

    // 12. Sunken warship
    var warshipHull = createBox(30, 8, 60, 0x3a3a2a);
    warshipHull.position.set(-80, -170, 50);
    warshipHull.rotation.z = 0.15;
    scene.add(warshipHull);
    objects.push(warshipHull);

    // Cannon protrusions
    for (var i = 0; i < 4; i++) {
      var cannon = createBox(1.5, 0.8, 4, 0x2a2a1a);
      cannon.position.set(-80 + (i % 2) * 20 - 10, -165 + Math.floor(i / 2) * 4, 70);
      scene.add(cannon);
      objects.push(cannon);
    }

    // 13. Sea anemone forest (12 anemones)
    for (var i = 0; i < 12; i++) {
      var anemone = createAnemone();
      anemone.position.set((Math.random() - 0.5) * 200, -165, (Math.random() - 0.5) * 200);
      scene.add(anemone);
      objects.push(anemone);

      // Sway animation
      (function(a, idx) {
        animations.push({
          update: function(delta) {
            a.rotation.z = Math.sin(Date.now() * 0.002 + idx) * 0.1;
          }
        });
      })(anemone, i);
    }

    // 14. Treasure map room
    var roomFloor = createBox(15, 0.5, 15, 0x6a5a4a);
    roomFloor.position.set(80, -140, 50);
    scene.add(roomFloor);
    objects.push(roomFloor);

    var table = createBox(8, 1, 8, 0x5a4a3a);
    table.position.set(80, -135, 50);
    scene.add(table);
    objects.push(table);

    var map = createBox(6, 0.1, 6, 0x8a7a3a, 0xffdd00);
    map.position.set(80, -133.5, 50);
    scene.add(map);
    objects.push(map);

    // 15. Pressure crack in wall
    var crack = createBox(2, 8, 0.3, 0x1a1a1a, 0x0088ff);
    crack.position.set(-60, -120, -80);
    scene.add(crack);
    objects.push(crack);

    // 16. Deep sea shark
    var shark = createShark();
    shark.position.set(0, -110, 0);
    scene.add(shark);
    objects.push(shark);

    animations.push({
      update: function(delta) {
        var circleAngle = Date.now() * 0.0003;
        shark.position.x = Math.cos(circleAngle) * 80;
        shark.position.z = Math.sin(circleAngle) * 80;
        shark.rotation.y = circleAngle;
      }
    });

    // Setup HUD
    setupHUD();

    // Setup keyboard listeners
    setupKeyboardListeners();
  }

  function createDiver(helmetColor, suitColor) {
    var group = new THREE.Group();

    // Helmet (sphere approximation with box)
    var helmet = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 8),
      new THREE.MeshStandardMaterial({ color: helmetColor })
    );
    helmet.position.y = 2;
    group.add(helmet);

    // Suit body
    var body = createBox(1.5, 2.5, 1, suitColor);
    body.position.y = 0.5;
    group.add(body);

    // Tank
    var tank = createBox(0.5, 2, 0.5, 0x1a1a1a);
    tank.position.set(-1.2, 0.5, 0);
    group.add(tank);

    return group;
  }

  function createJellyfish() {
    var group = new THREE.Group();

    // Bell
    var bell = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x0077ff, emissiveIntensity: 0.5 })
    );
    bell.scale.set(1, 1.2, 1);
    group.add(bell);

    // Tentacles
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var tentacle = createBox(0.2, 3, 0.2, 0xff88ff, 0xff00ff);
      tentacle.position.set(Math.cos(angle) * 1, -2, Math.sin(angle) * 1);
      tentacle.material.emissiveIntensity = 0.3;
      group.add(tentacle);
    }

    return group;
  }

  function createAnemone() {
    var group = new THREE.Group();

    // Stem
    var stem = createBox(0.4, 5, 0.4, 0x4a8a4a);
    group.add(stem);

    // Tip (glowing)
    var tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 0.6 })
    );
    tip.position.y = 3;
    group.add(tip);

    return group;
  }

  function createShark() {
    var group = new THREE.Group();

    // Body
    var body = createBox(2, 1.2, 6, 0x3a3a4a);
    group.add(body);

    // Head
    var head = createBox(1.5, 1, 2, 0x4a4a5a);
    head.position.set(0, 0, 3);
    group.add(head);

    // Dorsal fin
    var fin = createBox(0.3, 2, 1.5, 0x3a3a4a);
    fin.position.set(0, 1.2, 0);
    group.add(fin);

    // Tail
    var tail = createBox(1, 0.8, 3, 0x3a3a4a);
    tail.position.set(0, 0, -4.5);
    tail.rotation.z = 0.2;
    group.add(tail);

    return group;
  }

  function setupHUD() {
    if (hudElement) {
      document.body.removeChild(hudElement);
    }

    hudElement = document.createElement('div');
    hudElement.style.position = 'fixed';
    hudElement.style.top = '20px';
    hudElement.style.left = '20px';
    hudElement.style.color = '#00ff00';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.fontSize = '14px';
    hudElement.style.zIndex = '100';
    hudElement.style.display = 'block';
    hudElement.textContent = 'ARTIFACTS: ' + hudState.artifacts + '/5\nRIVAL TEAM: ' + hudState.rivalTeam + '\nDEPTH: ' + hudState.depth + 'm';
    document.body.appendChild(hudElement);
  }

  function setupKeyboardListeners() {
    document.addEventListener('keydown', function(e) {
      var key = e.key.toLowerCase();
      if (key === 'h') {
        keyStates.h = true;
        lastHKeyTime = Date.now();
      }
      if (key === 'u') {
        keyStates.u = true;
        if (keyStates.h && Date.now() - lastHKeyTime < 400) {
          toggleHUD();
        }
      }
    });

    document.addEventListener('keyup', function(e) {
      var key = e.key.toLowerCase();
      if (key === 'h') {
        keyStates.h = false;
      }
      if (key === 'u') {
        keyStates.u = false;
      }
    });
  }

  function toggleHUD() {
    if (hudElement) {
      hudElement.style.display = hudElement.style.display === 'none' ? 'block' : 'none';
    }
  }

  function update(delta) {
    for (var i = 0; i < animations.length; i++) {
      animations[i].update(delta);
    }
  }

  function reset() {
    if (hudElement && hudElement.parentNode) {
      document.body.removeChild(hudElement);
      hudElement = null;
    }
    objects = [];
    animations = [];
    hudState = { artifacts: 0, rivalTeam: 3, depth: -120 };
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
