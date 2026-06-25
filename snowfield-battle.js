window.SnowfieldBattle = (function() {
  'use strict';

  var scene, camera, renderer;
  var tanks = [];
  var infantryFriendly = [];
  var infantryEnemy = [];
  var objects = [];
  var canvas2d = null;
  var context2d = null;
  var hudTexture = null;
  var hudMaterial = null;

  var gameState = {
    enemyUnitsDown: 0,
    friendlyCasualties: 0,
    showHUD: true
  };

  var keyState = {};
  var lastSKeyTime = 0;

  function init(container) {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xb0d0e0);
    scene.fog = new THREE.Fog(0xb0d0e0, 500, 1500);

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 120, 250);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(150, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 1000;
    directionalLight.shadow.camera.left = -500;
    directionalLight.shadow.camera.right = 500;
    directionalLight.shadow.camera.top = 500;
    directionalLight.shadow.camera.bottom = -500;
    scene.add(directionalLight);

    // 1. Snow battlefield floor
    var floorGeometry = new THREE.BoxGeometry(800, 2, 800);
    var floorMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -10;
    floor.receiveShadow = true;
    scene.add(floor);
    objects.push(floor);

    // 2. Tank #1 friendly (advancing from left)
    var tank1 = createTank(new THREE.Vector3(-150, 0, 0), 0x2d5016);
    tanks.push({ mesh: tank1, direction: 1, speed: 0.3 });
    objects.push(tank1);

    // 3. Tank #2 enemy (advancing from right)
    var tank2 = createTank(new THREE.Vector3(150, 0, 0), 0x8b0000);
    tanks.push({ mesh: tank2, direction: -1, speed: 0.25 });
    objects.push(tank2);

    // 4. Friendly infantry squad (8 advancing)
    createInfantrySquad(infantryFriendly, -120, 8, 0x4CAF50, 0.2);

    // 5. Enemy infantry squad (6 defending)
    createInfantrySquad(infantryEnemy, 120, 6, 0xcc0000, 0.15);

    // 6. Artillery gun emplacement
    var artillery = createArtillery(new THREE.Vector3(-80, 0, -100));
    objects.push(artillery);

    // 7. Foxhole #1
    var foxhole1 = createFoxhole(new THREE.Vector3(-60, 0, 50));
    objects.push(foxhole1);

    // 8. Foxhole #2
    var foxhole2 = createFoxhole(new THREE.Vector3(70, 0, -60));
    objects.push(foxhole2);

    // 9. Barbed wire obstacle belt
    var barbedWire = createBarbedWire(new THREE.Vector3(0, 0, 0));
    objects.push(barbedWire);

    // 10. Destroyed half-track
    var halftrack = createHalftrack(new THREE.Vector3(100, 0, -150));
    objects.push(halftrack);

    // 11. Mortar position
    var mortar = createMortar(new THREE.Vector3(-200, 0, 150));
    objects.push(mortar);

    // 12. Field medic post
    var medicPost = createMedicPost(new THREE.Vector3(-250, 0, 50));
    objects.push(medicPost);

    // 13. Shell crater
    var crater = createCrater(new THREE.Vector3(50, 0, 100));
    objects.push(crater);

    // 14. Supply ammo boxes
    var ammoStack = createAmmoStack(new THREE.Vector3(200, 0, 200));
    objects.push(ammoStack);

    // 15. Winter forest treeline
    createTreeline();

    // 16. Muzzle flashes (at tank barrels)
    createMuzzleFlashes();

    // 17. Smoke screen
    createSmokeScreen();

    // HUD Canvas
    createHUD();

    // Keyboard input
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);
  }

  function createTank(position, color) {
    var tank = new THREE.Group();

    // Hull (box)
    var hullGeometry = new THREE.BoxGeometry(40, 30, 80);
    var hullMaterial = new THREE.MeshPhongMaterial({ color: color });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.castShadow = true;
    hull.receiveShadow = true;
    hull.position.y = 15;
    tank.add(hull);

    // Turret (box)
    var turretGeometry = new THREE.BoxGeometry(35, 25, 45);
    var turretMaterial = new THREE.MeshPhongMaterial({ color: color });
    var turret = new THREE.Mesh(turretGeometry, turretMaterial);
    turret.castShadow = true;
    turret.receiveShadow = true;
    turret.position.y = 35;
    tank.add(turret);

    // Barrel (cylinder)
    var barrelGeometry = new THREE.CylinderGeometry(4, 4, 60, 16);
    var barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(30, 35, 0);
    tank.add(barrel);

    tank.position.copy(position);
    scene.add(tank);
    return tank;
  }

  function createInfantrySquad(squad, startX, count, color, speed) {
    for (var i = 0; i < count; i++) {
      var offsetZ = (i - count / 2) * 25;
      var soldier = new THREE.Group();

      // Body (box)
      var bodyGeometry = new THREE.BoxGeometry(6, 24, 6);
      var bodyMaterial = new THREE.MeshPhongMaterial({ color: color });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;
      body.receiveShadow = true;
      body.position.y = 12;
      soldier.add(body);

      // Head (sphere)
      var headGeometry = new THREE.SphereGeometry(4, 8, 8);
      var headMaterial = new THREE.MeshPhongMaterial({ color: 0xdbb89d });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.castShadow = true;
      head.receiveShadow = true;
      head.position.y = 28;
      soldier.add(head);

      soldier.position.set(startX + i * 12, 0, offsetZ);
      scene.add(soldier);
      squad.push({ mesh: soldier, direction: startX < 0 ? 1 : -1, speed: speed });
      objects.push(soldier);
    }
  }

  function createArtillery(position) {
    var artillery = new THREE.Group();

    // Trail (box)
    var trailGeometry = new THREE.BoxGeometry(20, 10, 60);
    var trailMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    var trail = new THREE.Mesh(trailGeometry, trailMaterial);
    trail.castShadow = true;
    trail.receiveShadow = true;
    trail.position.y = 5;
    artillery.add(trail);

    // Barrel (cylinder) - elevated
    var barrelGeometry = new THREE.CylinderGeometry(5, 5, 80, 16);
    var barrelMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    barrel.rotation.z = -0.5;
    barrel.position.y = 20;
    artillery.add(barrel);
    artillery.barrelRef = barrel;

    artillery.position.copy(position);
    scene.add(artillery);
    return artillery;
  }

  function createFoxhole(position) {
    var foxhole = new THREE.Group();

    // Depression (flat box)
    var holeGeometry = new THREE.BoxGeometry(60, 15, 50);
    var holeMaterial = new THREE.MeshPhongMaterial({ color: 0x8b7355 });
    var hole = new THREE.Mesh(holeGeometry, holeMaterial);
    hole.position.y = -7;
    hole.receiveShadow = true;
    foxhole.add(hole);

    // Sandbag rim (box)
    var rimGeometry = new THREE.BoxGeometry(70, 8, 60);
    var rimMaterial = new THREE.MeshPhongMaterial({ color: 0xc2a280 });
    var rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.y = 1;
    rim.castShadow = true;
    rim.receiveShadow = true;
    foxhole.add(rim);

    foxhole.position.copy(position);
    scene.add(foxhole);
    return foxhole;
  }

  function createBarbedWire(position) {
    var wireGroup = new THREE.Group();

    // Create multiple horizontal wire segments
    for (var i = 0; i < 4; i++) {
      var points = [
        new THREE.Vector3(-400, 5 + i * 3, 0),
        new THREE.Vector3(400, 5 + i * 3, 0)
      ];
      var lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      var lineMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
      var line = new THREE.LineSegments(lineGeometry, lineMaterial);
      wireGroup.add(line);
    }

    wireGroup.position.copy(position);
    scene.add(wireGroup);
    return wireGroup;
  }

  function createHalftrack(position) {
    var halftrack = new THREE.Group();

    // Main hull (burned, dark)
    var hullGeometry = new THREE.BoxGeometry(35, 25, 70);
    var hullMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.castShadow = true;
    hull.receiveShadow = true;
    hull.position.y = 12;
    halftrack.add(hull);

    // Damage crater
    var craterGeometry = new THREE.BoxGeometry(20, 10, 40);
    var craterMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var crater = new THREE.Mesh(craterGeometry, craterMaterial);
    crater.position.y = 20;
    halftrack.add(crater);

    halftrack.position.copy(position);
    scene.add(halftrack);
    return halftrack;
  }

  function createMortar(position) {
    var mortar = new THREE.Group();

    // Mortar tube (cylinder)
    var tubeGeometry = new THREE.CylinderGeometry(3, 3, 50, 12);
    var tubeMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.castShadow = true;
    tube.receiveShadow = true;
    tube.rotation.z = -0.6;
    tube.position.y = 15;
    mortar.add(tube);

    // Base plate (box)
    var baseGeometry = new THREE.BoxGeometry(40, 8, 40);
    var baseMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.castShadow = true;
    base.receiveShadow = true;
    base.position.y = 4;
    mortar.add(base);

    mortar.position.copy(position);
    scene.add(mortar);
    return mortar;
  }

  function createMedicPost(position) {
    var post = new THREE.Group();

    // Tent (box)
    var tentGeometry = new THREE.BoxGeometry(50, 40, 50);
    var tentMaterial = new THREE.MeshPhongMaterial({ color: 0xf0f0f0 });
    var tent = new THREE.Mesh(tentGeometry, tentMaterial);
    tent.castShadow = true;
    tent.receiveShadow = true;
    tent.position.y = 20;
    post.add(tent);

    // Red cross (box marker)
    var crossGeometry = new THREE.BoxGeometry(15, 15, 2);
    var crossMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    var cross = new THREE.Mesh(crossGeometry, crossMaterial);
    cross.position.set(0, 45, 26);
    post.add(cross);

    post.position.copy(position);
    scene.add(post);
    return post;
  }

  function createCrater(position) {
    var crater = new THREE.Group();

    // Crater depression (flat box)
    var depthGeometry = new THREE.BoxGeometry(80, 15, 80);
    var depthMaterial = new THREE.MeshPhongMaterial({ color: 0x5a5a5a });
    var depth = new THREE.Mesh(depthGeometry, depthMaterial);
    depth.position.y = -7;
    depth.receiveShadow = true;
    crater.add(depth);

    // Crater rim (box)
    var rimGeometry = new THREE.BoxGeometry(100, 5, 100);
    var rimMaterial = new THREE.MeshPhongMaterial({ color: 0x8a8a8a });
    var rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.y = 1;
    rim.castShadow = true;
    rim.receiveShadow = true;
    crater.add(rim);

    crater.position.copy(position);
    scene.add(crater);
    return crater;
  }

  function createAmmoStack(position) {
    var stack = new THREE.Group();

    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 3; col++) {
        var boxGeometry = new THREE.BoxGeometry(20, 15, 20);
        var boxMaterial = new THREE.MeshPhongMaterial({ color: 0x8b6f47 });
        var box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.castShadow = true;
        box.receiveShadow = true;
        box.position.set(col * 22, row * 17, row * 10);
        stack.add(box);
      }
    }

    stack.position.copy(position);
    scene.add(stack);
    return stack;
  }

  function createTreeline() {
    var treelines = [
      new THREE.Vector3(-350, 0, -350),
      new THREE.Vector3(-280, 0, -380),
      new THREE.Vector3(-200, 0, -350),
      new THREE.Vector3(-120, 0, -370),
      new THREE.Vector3(150, 0, -360),
      new THREE.Vector3(250, 0, -340),
      new THREE.Vector3(350, 0, -370),
      new THREE.Vector3(400, 0, -350)
    ];

    treelines.forEach(function(pos) {
      // Trunk (cylinder)
      var trunkGeometry = new THREE.CylinderGeometry(6, 8, 80, 12);
      var trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x3d2817 });
      var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      trunk.position.copy(pos);
      trunk.position.y = 40;
      scene.add(trunk);
      objects.push(trunk);

      // Canopy (cone)
      var canopyGeometry = new THREE.ConeGeometry(30, 60, 16);
      var canopyMaterial = new THREE.MeshPhongMaterial({ color: 0x1a3d1a });
      var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
      canopy.castShadow = true;
      canopy.receiveShadow = true;
      canopy.position.copy(pos);
      canopy.position.y = 100;
      scene.add(canopy);
      objects.push(canopy);
    });
  }

  function createMuzzleFlashes() {
    tanks.forEach(function(tankData) {
      var flashGeometry = new THREE.SphereGeometry(5, 8, 8);
      var flashMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, emissive: 0xff8800 });
      var flash = new THREE.Mesh(flashGeometry, flashMaterial);
      flash.visible = false;
      tankData.muzzleFlash = flash;
      scene.add(flash);
    });
  }

  function createSmokeScreen() {
    var smokeGeometry = new THREE.SphereGeometry(100, 16, 16);
    var smokeMaterial = new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.4
    });
    var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
    smoke.position.set(0, 40, -150);
    smoke.drift = 0;
    scene.add(smoke);
    objects.push(smoke);
  }

  function createHUD() {
    canvas2d = document.createElement('canvas');
    canvas2d.width = 512;
    canvas2d.height = 512;
    context2d = canvas2d.getContext('2d');

    hudTexture = new THREE.CanvasTexture(canvas2d);
    hudMaterial = new THREE.MeshBasicMaterial({ map: hudTexture });
    var hudGeometry = new THREE.BoxGeometry(10, 10, 0.1);
    var hudMesh = new THREE.Mesh(hudGeometry, hudMaterial);
    hudMesh.position.set(-window.innerWidth / 400 + 5, window.innerHeight / 400 - 5, 0);
    var orthoCam = new THREE.OrthographicCamera(
      -window.innerWidth / 2,
      window.innerWidth / 2,
      window.innerHeight / 2,
      -window.innerHeight / 2,
      0.1,
      1000
    );
    orthoCam.position.z = 1;

    updateHUD();
  }

  function updateHUD() {
    if (!context2d) return;

    context2d.fillStyle = '#000000';
    context2d.fillRect(0, 0, 512, 512);

    context2d.fillStyle = '#ffffff';
    context2d.font = '32px Arial';
    context2d.fillText('ENEMY DOWN: ' + gameState.enemyUnitsDown + '/6', 20, 60);
    context2d.fillText('CASUALTIES: ' + gameState.friendlyCasualties, 20, 120);
    context2d.fillText('OBJECTIVE: ADVANCE', 20, 180);

    if (hudTexture) {
      hudTexture.needsUpdate = true;
    }
  }

  function onKeyDown(e) {
    keyState[e.key] = true;

    if (e.key === 's' || e.key === 'S') {
      var now = Date.now();
      if (now - lastSKeyTime < 400) {
        gameState.showHUD = !gameState.showHUD;
        lastSKeyTime = 0;
      } else {
        lastSKeyTime = now;
      }
    }
  }

  function onKeyUp(e) {
    keyState[e.key] = false;
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function update() {
    // Tank movement
    tanks.forEach(function(tankData) {
      var newX = tankData.mesh.position.x + tankData.direction * tankData.speed;
      if (Math.abs(newX) < 200) {
        tankData.mesh.position.x = newX;
      }

      // Barrel elevation
      var barrel = tankData.mesh.children[2];
      if (barrel) {
        barrel.rotation.z += 0.01;
      }

      // Muzzle flash pulses
      if (tankData.muzzleFlash) {
        tankData.muzzleFlash.visible = Math.random() > 0.9;
        if (tankData.muzzleFlash.visible) {
          var barrelPos = barrel.getWorldPosition(new THREE.Vector3());
          tankData.muzzleFlash.position.copy(barrelPos);
        }
      }
    });

    // Infantry movement
    infantryFriendly.forEach(function(soldierData) {
      var newX = soldierData.mesh.position.x + soldierData.direction * soldierData.speed;
      if (Math.abs(newX) < 180) {
        soldierData.mesh.position.x = newX;
      }
    });

    infantryEnemy.forEach(function(soldierData) {
      var newX = soldierData.mesh.position.x + soldierData.direction * soldierData.speed;
      if (Math.abs(newX) < 180) {
        soldierData.mesh.position.x = newX;
      }
    });

    // Smoke drift
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].drift !== undefined) {
        objects[i].drift += 0.05;
        objects[i].position.x = Math.sin(objects[i].drift * 0.05) * 20;
      }
    }

    // Tree sway
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.rotation && obj instanceof THREE.Mesh && obj.geometry instanceof THREE.ConeGeometry) {
        obj.rotation.z = Math.sin(Date.now() * 0.001) * 0.02;
      }
    }

    renderer.render(scene, camera);
  }

  function reset() {
    // Clear scene
    while (scene.children.length > 0) {
      var child = scene.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(function(m) { m.dispose(); });
        } else {
          child.material.dispose();
        }
      }
      scene.remove(child);
    }

    // Reset state
    tanks = [];
    infantryFriendly = [];
    infantryEnemy = [];
    objects = [];
    gameState.enemyUnitsDown = 0;
    gameState.friendlyCasualties = 0;

    // Dispose textures
    if (hudTexture) hudTexture.dispose();
    if (hudMaterial) hudMaterial.dispose();
    if (renderer) renderer.dispose();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
