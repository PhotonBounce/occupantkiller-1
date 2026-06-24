window.CaveNetwork = (function() {
  'use strict';

  // Private state
  var scene = null;
  var camera = null;
  var objects = [];
  var animations = [];
  var keybindState = { c: false, cTime: 0 };
  var hudElement = null;
  var hudData = {
    cachesFound: 0,
    weaponsDestroyed: 0,
    squadDepth: 0
  };

  // Keybind toggle
  var isActive = false;

  // Initialize the module
  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    // Setup fog for deep cave atmosphere
    scene.fog = new THREE.Fog(0x0a0a0a, 50, 300);
    scene.background = new THREE.Color(0x0a0a0a);

    // Create HUD element
    createHUD();

    // Create cave network elements
    createCaveTunnels();
    createStalactites();
    createStalagmites();
    createCrystalFormations();
    createSubterraneanRiver();
    createRopeBridge();
    createWeaponsCacheRoom();
    createEnemyCookingFire();
    createLivingQuarters();
    createCavePoolReflection();
    createNarrowPassage();
    createRockfallDebris();
    createLanternOnRope();
    createBatColonyRoost();
    createAncientPaintingWall();

    // Create enemies
    createEnemies();

    // Setup keybind listener
    setupKeybindListener();

    // Initial HUD update
    updateHUD();
  };

  // Create cave tunnel sections
  var createCaveTunnels = function() {
    var tunnelConfigs = [
      { pos: [0, 0, -30], rot: [0, 0, 0], scale: [8, 6, 40] },
      { pos: [20, 2, -50], rot: [0, 0.3, 0], scale: [6, 5, 30] },
      { pos: [-20, -3, -70], rot: [0, -0.3, 0], scale: [7, 5, 30] },
      { pos: [0, -5, -100], rot: [0.1, 0, 0], scale: [10, 4, 35] },
      { pos: [25, 0, -120], rot: [0, 0.4, 0], scale: [5, 6, 25] }
    ];

    tunnelConfigs.forEach(function(cfg) {
      var geom = new THREE.BoxGeometry(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
      var mat = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.8,
        metalness: 0.0
      });
      var mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      mesh.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
      scene.add(mesh);
      objects.push(mesh);
    });
  };

  // Create stalactites (inverted cones hanging from ceiling)
  var createStalactites = function() {
    var positions = [
      [-15, 25, -40],
      [-5, 26, -45],
      [5, 25, -50],
      [15, 27, -55],
      [-20, 24, -70],
      [0, 25, -90],
      [20, 26, -100]
    ];

    positions.forEach(function(pos) {
      var geom = new THREE.ConeGeometry(0.8, 3, 8);
      var mat = new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        roughness: 0.7
      });
      var mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(pos[0], pos[1], pos[2]);
      mesh.rotation.z = Math.PI;
      scene.add(mesh);
      objects.push(mesh);
    });
  };

  // Create stalagmites (cones on floor)
  var createStalagmites = function() {
    var positions = [
      [-18, -20, -35],
      [-8, -22, -42],
      [8, -21, -48],
      [18, -20, -60],
      [-15, -23, -75],
      [5, -22, -95],
      [22, -21, -105]
    ];

    positions.forEach(function(pos) {
      var geom = new THREE.ConeGeometry(0.9, 4, 8);
      var mat = new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        roughness: 0.7
      });
      var mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(pos[0], pos[1], pos[2]);
      scene.add(mesh);
      objects.push(mesh);
    });
  };

  // Create crystal formations
  var createCrystalFormations = function() {
    var positions = [
      [-12, 5, -40],
      [12, 8, -60],
      [-8, -10, -80],
      [15, 3, -100]
    ];

    positions.forEach(function(pos) {
      var group = new THREE.Group();
      group.position.set(pos[0], pos[1], pos[2]);

      for (var i = 0; i < 6; i++) {
        var geom = new THREE.BoxGeometry(1.5, 3.5, 1.5);
        var mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(0.6 + Math.random() * 0.1, 1, 0.6),
          roughness: 0.3,
          metalness: 0.2,
          emissive: new THREE.Color().setHSL(0.6 + Math.random() * 0.1, 1, 0.3),
          emissiveIntensity: 0.5
        });
        var mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 6
        );
        mesh.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        group.add(mesh);
      }

      scene.add(group);
      objects.push(group);
      animations.push({
        type: 'crystal',
        target: group,
        time: 0
      });
    });
  };

  // Create subterranean river
  var createSubterraneanRiver = function() {
    var geom = new THREE.BoxGeometry(4, 1, 80);
    var mat = new THREE.MeshStandardMaterial({
      color: 0x001a33,
      roughness: 0.6,
      metalness: 0.3,
      emissive: 0x000d1a,
      emissiveIntensity: 0.3
    });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(0, -24, -60);
    scene.add(mesh);
    objects.push(mesh);

    animations.push({
      type: 'river',
      target: mesh,
      time: 0
    });
  };

  // Create rope bridge
  var createRopeBridge = function() {
    var group = new THREE.Group();
    group.position.set(-25, -5, -85);

    // Bridge planks
    for (var i = 0; i < 8; i++) {
      var geom = new THREE.BoxGeometry(3, 0.3, 1.2);
      var mat = new THREE.MeshStandardMaterial({
        color: 0x5a3d2a,
        roughness: 0.9
      });
      var mesh = new THREE.Mesh(geom, mat);
      mesh.position.y = i * 1.5;
      group.add(mesh);
    }

    // Rope lines
    var ropePositions = [
      [-2, 0, -0.8],
      [2, 0, -0.8],
      [-2, 0, 0.8],
      [2, 0, 0.8]
    ];

    ropePositions.forEach(function(pos) {
      var points = [];
      for (var j = 0; j < 8; j++) {
        points.push(new THREE.Vector3(pos[0], j * 1.5, pos[2]));
      }
      var geom = new THREE.BufferGeometry().setFromPoints(points);
      var mat = new THREE.LineBasicMaterial({ color: 0x8b7355, linewidth: 2 });
      var line = new THREE.LineSegments(geom, mat);
      group.add(line);
    });

    scene.add(group);
    objects.push(group);

    animations.push({
      type: 'bridge',
      target: group,
      time: 0
    });
  };

  // Create weapons cache room
  var createWeaponsCacheRoom = function() {
    var group = new THREE.Group();
    group.position.set(35, -10, -70);

    // Stacked crates
    for (var i = 0; i < 10; i++) {
      var geom = new THREE.BoxGeometry(2, 2, 2);
      var mat = new THREE.MeshStandardMaterial({
        color: 0x4a4a2a,
        roughness: 0.9
      });
      var mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(
        (i % 3) * 2.5,
        Math.floor(i / 3) * 2.2,
        0
      );
      group.add(mesh);
    }

    scene.add(group);
    objects.push(group);
  };

  // Create enemy cooking fire
  var createEnemyCookingFire = function() {
    var group = new THREE.Group();
    group.position.set(-35, -20, -110);

    // Fire sphere
    var fireGeom = new THREE.SphereGeometry(1.5, 16, 16);
    var fireMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff4400,
      emissiveIntensity: 0.8,
      roughness: 0.5
    });
    var fire = new THREE.Mesh(fireGeom, fireMat);
    group.add(fire);

    // Smoke cones
    for (var i = 0; i < 3; i++) {
      var smokeGeom = new THREE.ConeGeometry(0.8, 3, 8);
      var smokeMat = new THREE.MeshStandardMaterial({
        color: 0x444444,
        emissive: 0x222222,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.6
      });
      var smoke = new THREE.Mesh(smokeGeom, smokeMat);
      smoke.position.set(
        (Math.random() - 0.5) * 2,
        2 + i * 1.5,
        (Math.random() - 0.5) * 2
      );
      group.add(smoke);
    }

    scene.add(group);
    objects.push(group);

    animations.push({
      type: 'fire',
      target: group,
      fireChild: fire,
      time: 0
    });
  };

  // Create living quarters
  var createLivingQuarters = function() {
    var group = new THREE.Group();
    group.position.set(30, -15, -130);

    // Shelves (boxes)
    for (var i = 0; i < 4; i++) {
      var shelfGeom = new THREE.BoxGeometry(6, 0.5, 2);
      var shelfMat = new THREE.MeshStandardMaterial({
        color: 0x3a2a1a,
        roughness: 0.8
      });
      var shelf = new THREE.Mesh(shelfGeom, shelfMat);
      shelf.position.y = i * 2;
      group.add(shelf);
    }

    // Sleeping mats
    for (var j = 0; j < 3; j++) {
      var matGeom = new THREE.BoxGeometry(2, 0.3, 4);
      var matMat = new THREE.MeshStandardMaterial({
        color: 0x5a4a3a,
        roughness: 0.9
      });
      var sleepMat = new THREE.Mesh(matGeom, matMat);
      sleepMat.position.set((j - 1) * 3, -2, 0);
      group.add(sleepMat);
    }

    scene.add(group);
    objects.push(group);
  };

  // Create cave pool reflection
  var createCavePoolReflection = function() {
    var geom = new THREE.BoxGeometry(6, 0.5, 8);
    var mat = new THREE.MeshStandardMaterial({
      color: 0x0a3a5a,
      roughness: 0.4,
      metalness: 0.5,
      emissive: 0x0a2a4a,
      emissiveIntensity: 0.2
    });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(-30, -22, -95);
    scene.add(mesh);
    objects.push(mesh);
  };

  // Create narrow squeeze passage
  var createNarrowPassage = function() {
    var geom = new THREE.BoxGeometry(2, 3, 20);
    var mat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.95
    });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(40, -8, -95);
    scene.add(mesh);
    objects.push(mesh);
  };

  // Create rockfall debris
  var createRockfallDebris = function() {
    var group = new THREE.Group();
    group.position.set(-40, -15, -60);

    for (var i = 0; i < 12; i++) {
      var size = 0.8 + Math.random() * 1.2;
      var geom = new THREE.BoxGeometry(size, size, size);
      var mat = new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        roughness: 0.85
      });
      var mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 8,
        Math.random() * 4,
        (Math.random() - 0.5) * 8
      );
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      group.add(mesh);
    }

    scene.add(group);
    objects.push(group);
  };

  // Create lantern on rope
  var createLanternOnRope = function() {
    var group = new THREE.Group();
    group.position.set(-50, 10, -50);

    // Rope
    var ropePoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -8, 0)
    ];
    var ropeGeom = new THREE.BufferGeometry().setFromPoints(ropePoints);
    var ropeMat = new THREE.LineBasicMaterial({ color: 0x8b7355 });
    var rope = new THREE.LineSegments(ropeGeom, ropeMat);
    group.add(rope);

    // Lantern sphere
    var sphereGeom = new THREE.SphereGeometry(0.6, 12, 12);
    var sphereMat = new THREE.MeshStandardMaterial({
      color: 0xff8800,
      emissive: 0xff6600,
      emissiveIntensity: 0.9,
      roughness: 0.4
    });
    var sphere = new THREE.Mesh(sphereGeom, sphereMat);
    sphere.position.y = -8;
    group.add(sphere);

    // Lantern cage cylinder
    var cylinderGeom = new THREE.CylinderGeometry(0.7, 0.7, 1.2, 8);
    var cylinderMat = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      roughness: 0.8
    });
    var cylinder = new THREE.Mesh(cylinderGeom, cylinderMat);
    cylinder.position.y = -8;
    group.add(cylinder);

    scene.add(group);
    objects.push(group);

    animations.push({
      type: 'lantern',
      target: group,
      time: 0
    });
  };

  // Create bat colony roost
  var createBatColonyRoost = function() {
    var group = new THREE.Group();
    group.position.set(15, 20, -75);

    for (var i = 0; i < 12; i++) {
      var geom = new THREE.SphereGeometry(0.4, 8, 8);
      var mat = new THREE.MeshStandardMaterial({
        color: 0x2a1a3a,
        roughness: 0.7
      });
      var mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 8
      );
      group.add(mesh);
    }

    scene.add(group);
    objects.push(group);

    animations.push({
      type: 'bats',
      target: group,
      time: 0
    });
  };

  // Create ancient painting wall
  var createAncientPaintingWall = function() {
    var group = new THREE.Group();
    group.position.set(-45, 0, -125);

    // Wall background
    var wallGeom = new THREE.BoxGeometry(8, 10, 0.5);
    var wallMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.95
    });
    var wall = new THREE.Mesh(wallGeom, wallMat);
    group.add(wall);

    // Emissive symbols (small boxes)
    var symbolPositions = [
      [-2, 3, 0.3],
      [0, 3, 0.3],
      [2, 3, 0.3],
      [-1, 0, 0.3],
      [1, 0, 0.3],
      [-2, -2, 0.3],
      [2, -2, 0.3]
    ];

    symbolPositions.forEach(function(pos) {
      var symGeom = new THREE.BoxGeometry(0.5, 0.5, 0.2);
      var symMat = new THREE.MeshStandardMaterial({
        color: 0x5a5a2a,
        emissive: 0x8a8a4a,
        emissiveIntensity: 0.6
      });
      var sym = new THREE.Mesh(symGeom, symMat);
      sym.position.set(pos[0], pos[1], pos[2]);
      group.add(sym);
    });

    scene.add(group);
    objects.push(group);
  };

  // Create enemies
  var createEnemies = function() {
    var enemyPositions = [
      [0, -18, -50],
      [25, -15, -90],
      [-25, -20, -100],
      [35, -12, -130]
    ];

    enemyPositions.forEach(function(pos) {
      var group = new THREE.Group();
      group.position.set(pos[0], pos[1], pos[2]);

      // Enemy body
      var bodyGeom = new THREE.BoxGeometry(0.8, 2, 0.5);
      var bodyMat = new THREE.MeshStandardMaterial({
        color: 0x2a3a2a,
        roughness: 0.8
      });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      group.add(body);

      // Enemy head
      var headGeom = new THREE.BoxGeometry(0.6, 0.8, 0.6);
      var headMat = new THREE.MeshStandardMaterial({
        color: 0x3a4a3a,
        roughness: 0.8
      });
      var head = new THREE.Mesh(headGeom, headMat);
      head.position.y = 1.5;
      group.add(head);

      scene.add(group);
      objects.push(group);
    });
  };

  // Setup keybind listener
  var setupKeybindListener = function() {
    document.addEventListener('keydown', function(e) {
      if (e.key === 'c' || e.key === 'C') {
        var now = Date.now();
        if (!keybindState.c) {
          keybindState.c = true;
          keybindState.cTime = now;
        } else if (now - keybindState.cTime < 400) {
          // C pressed twice within 400ms, check for N
          keybindState.awaitingN = true;
        }
      }
      if ((e.key === 'n' || e.key === 'N') && keybindState.awaitingN) {
        var now = Date.now();
        if (now - keybindState.cTime < 400) {
          isActive = !isActive;
          showHUDNotification(isActive ? 'CAVE NETWORK ACTIVATED' : 'CAVE NETWORK DEACTIVATED');
          keybindState.awaitingN = false;
          keybindState.c = false;
        }
      }
    });

    document.addEventListener('keyup', function(e) {
      if (e.key === 'c' || e.key === 'C') {
        var now = Date.now();
        if (now - keybindState.cTime > 400) {
          keybindState.c = false;
          keybindState.awaitingN = false;
        }
      }
    });
  };

  // Create HUD element
  var createHUD = function() {
    hudElement = document.createElement('div');
    hudElement.id = 'cave-network-hud';
    hudElement.style.position = 'fixed';
    hudElement.style.top = '20px';
    hudElement.style.right = '20px';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.color = '#00ff00';
    hudElement.style.backgroundColor = 'rgba(0, 20, 0, 0.8)';
    hudElement.style.padding = '15px';
    hudElement.style.border = '2px solid #00ff00';
    hudElement.style.fontSize = '14px';
    hudElement.style.lineHeight = '1.6';
    hudElement.style.zIndex = '1000';
    hudElement.style.display = 'none';
    document.body.appendChild(hudElement);
  };

  // Update HUD display
  var updateHUD = function() {
    if (!hudElement) return;
    if (!isActive) {
      hudElement.style.display = 'none';
      return;
    }
    hudElement.style.display = 'block';
    hudElement.innerHTML = '<div>' +
      'CACHE ROOMS FOUND: ' + hudData.cachesFound + '/5<br>' +
      'WEAPONS DESTROYED: ' + hudData.weaponsDestroyed + '<br>' +
      'SQUAD DEPTH: -' + Math.abs(Math.floor(hudData.squadDepth)) + 'm' +
      '</div>';
  };

  // Show HUD notification
  var showHUDNotification = function(text) {
    var notif = document.createElement('div');
    notif.style.position = 'fixed';
    notif.style.top = '50%';
    notif.style.left = '50%';
    notif.style.transform = 'translate(-50%, -50%)';
    notif.style.fontFamily = 'monospace';
    notif.style.color = '#00ff00';
    notif.style.backgroundColor = 'rgba(0, 20, 0, 0.9)';
    notif.style.padding = '20px 40px';
    notif.style.border = '2px solid #00ff00';
    notif.style.fontSize = '18px';
    notif.style.zIndex = '2000';
    notif.textContent = text;
    document.body.appendChild(notif);

    setTimeout(function() {
      notif.remove();
    }, 1500);
  };

  // Update function called each frame
  var update = function(delta) {
    if (!isActive) return;

    // Animate crystal formations
    animations.forEach(function(anim) {
      anim.time += delta;

      if (anim.type === 'crystal') {
        var pulse = Math.sin(anim.time * 2) * 0.3 + 0.7;
        anim.target.children.forEach(function(child) {
          if (child.material && child.material.emissiveIntensity !== undefined) {
            child.material.emissiveIntensity = pulse * 0.5;
          }
        });
      }

      if (anim.type === 'river') {
        var flow = Math.sin(anim.time * 1.5) * 0.15;
        if (anim.target.material) {
          anim.target.material.emissiveIntensity = 0.3 + flow;
        }
      }

      if (anim.type === 'bridge') {
        var sway = Math.sin(anim.time * 1.2) * 0.05;
        anim.target.position.x = sway;
      }

      if (anim.type === 'fire') {
        var flicker = Math.sin(anim.time * 3.5) * 0.2 + 0.8;
        if (anim.fireChild && anim.fireChild.material) {
          anim.fireChild.material.emissiveIntensity = flicker;
        }
      }

      if (anim.type === 'lantern') {
        var swing = Math.sin(anim.time * 0.8) * 0.1;
        anim.target.position.x = swing;
      }

      if (anim.type === 'bats') {
        if (anim.time > 2) {
          anim.target.children.forEach(function(child) {
            child.position.x += (Math.random() - 0.5) * 0.3;
            child.position.y += (Math.random() - 0.5) * 0.3;
            child.position.z += (Math.random() - 0.5) * 0.3;
          });
          anim.time = 0;
        }
      }
    });

    updateHUD();
  };

  // Reset function
  var reset = function() {
    // Remove all objects from scene
    objects.forEach(function(obj) {
      scene.remove(obj);
    });
    objects = [];
    animations = [];
    keybindState = { c: false, cTime: 0 };
    hudData = {
      cachesFound: 0,
      weaponsDestroyed: 0,
      squadDepth: 0
    };
    isActive = false;

    if (hudElement) {
      hudElement.remove();
      hudElement = null;
    }

    scene = null;
    camera = null;
  };

  // Public API
  return {
    init: init,
    update: update,
    reset: reset
  };
}());
