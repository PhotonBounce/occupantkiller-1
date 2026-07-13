window.AirfieldAssault = (function() {
  'use strict';

  var scene, camera, renderer;
  var radarDish, runwayLights = [];
  var assaultTroops = [], defenders = [];
  var parachutists = [];
  var canvasHUD, hudContext;
  var gameState = {
    jetsDestroyed: 0,
    airfieldCaptured: false,
    assaultTroopsActive: 6,
    hudVisible: true
  };
  var keyState = {};
  var lastAKeyTime = 0;
  var sceneObjects = [];

  function init(container) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 500, 1000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(150, 120, 150);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    setupLighting();
    buildAirfield();
    setupHUD();
    setupInput();

    window.addEventListener('resize', onWindowResize, false);
  }

  function setupLighting() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    sceneObjects.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -300;
    directionalLight.shadow.camera.right = 300;
    directionalLight.shadow.camera.top = 300;
    directionalLight.shadow.camera.bottom = -300;
    scene.add(directionalLight);
    sceneObjects.push(directionalLight);
  }

  function buildAirfield() {
    // 1. Runway surface
    var runwayGeom = new THREE.BoxGeometry(50, 1, 400);
    var runwayMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var runway = new THREE.Mesh(runwayGeom, runwayMat);
    runway.castShadow = true;
    runway.receiveShadow = true;
    runway.position.y = 0;
    scene.add(runway);
    sceneObjects.push(runway);

    // 11. Runway lighting
    for (var i = -180; i <= 180; i += 30) {
      var lightGeom = new THREE.SphereGeometry(1.5, 8, 8);
      var lightMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      var light = new THREE.Mesh(lightGeom, lightMat);
      light.position.set(30, 3, i);
      scene.add(light);
      sceneObjects.push(light);
      runwayLights.push(light);

      var light2 = new THREE.Mesh(lightGeom, lightMat);
      light2.position.set(-30, 3, i);
      scene.add(light2);
      sceneObjects.push(light2);
      runwayLights.push(light2);
    }

    // 2. Fighter jet #1
    var jet1 = buildFighterJet(-40, 5, 100);
    scene.add(jet1);
    sceneObjects.push(jet1);

    // 3. Fighter jet #2
    var jet2 = buildFighterJet(40, 5, 120);
    scene.add(jet2);
    sceneObjects.push(jet2);

    // 4. Aircraft hangar
    var hangar = buildHangar(80, 0, -150);
    scene.add(hangar);
    sceneObjects.push(hangar);

    // 5. Control tower
    var tower = buildControlTower(150, 0, 80);
    scene.add(tower);
    sceneObjects.push(tower);

    // 6. Fuel bowser truck
    var bowser = buildFuelBowser(-100, 0, -80);
    scene.add(bowser);
    sceneObjects.push(bowser);

    // 7. Perimeter fence
    var fence = buildPerimeterFence();
    scene.add(fence);
    sceneObjects.push(fence);

    // 8. Guard post pillboxes
    var pillbox1 = buildPillbox(-180, 0, -180);
    scene.add(pillbox1);
    sceneObjects.push(pillbox1);

    var pillbox2 = buildPillbox(180, 0, 180);
    scene.add(pillbox2);
    sceneObjects.push(pillbox2);

    // 9. Anti-aircraft gun
    var aaGun = buildAAGun(-120, 0, 150);
    scene.add(aaGun);
    sceneObjects.push(aaGun);

    // 10. Radar dish
    var radar = buildRadar(160, 0, -180);
    scene.add(radar);
    sceneObjects.push(radar);
    radarDish = radar;

    // 12. Assault troops
    for (var i = 0; i < 6; i++) {
      var troop = buildAssaultTroop(-200 + i * 15, 0, 200);
      scene.add(troop);
      sceneObjects.push(troop);
      assaultTroops.push({
        mesh: troop,
        position: new THREE.Vector3(-200 + i * 15, 0, 200),
        target: new THREE.Vector3(0, 0, 50)
      });
    }

    // 13. Airfield defenders
    for (var i = 0; i < 4; i++) {
      var defender = buildDefender(60 + i * 12, 0, -100);
      scene.add(defender);
      sceneObjects.push(defender);
      defenders.push({
        mesh: defender,
        position: new THREE.Vector3(60 + i * 12, 0, -100),
        target: new THREE.Vector3(80, 0, -150)
      });
    }

    // 14. Ground support vehicle
    var gsvehicle = buildGroundSupportVehicle(-150, 0, 50);
    scene.add(gsvehicle);
    sceneObjects.push(gsvehicle);

    // 15. Bomb crater from airstrike
    var crater = buildCrater(0, 0, -280);
    scene.add(crater);
    sceneObjects.push(crater);

    // 16. Parachute assault troopers
    for (var i = 0; i < 3; i++) {
      var para = buildParachutist(-80 + i * 60, 200, -50);
      scene.add(para);
      sceneObjects.push(para);
      parachutists.push({
        mesh: para,
        position: new THREE.Vector3(-80 + i * 60, 200, -50),
        velocity: 0
      });
    }

    // 17. Fire from destroyed aircraft
    var fire = buildAircraftFire(-40, 15, 100);
    scene.add(fire);
    sceneObjects.push(fire);
  }

  function buildFighterJet(x, y, z) {
    var group = new THREE.Group();

    // Body
    var bodyGeom = new THREE.BoxGeometry(6, 3, 25);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.z = 2;
    group.add(body);

    // Wings
    var wingGeom = new THREE.BoxGeometry(35, 1.5, 8);
    var wingMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
    var wing = new THREE.Mesh(wingGeom, wingMat);
    wing.castShadow = true;
    wing.receiveShadow = true;
    wing.position.y = -1;
    group.add(wing);

    // Engines
    for (var i = -1; i <= 1; i += 2) {
      var engGeom = new THREE.CylinderGeometry(1.5, 1.5, 6, 16);
      var engMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
      var engine = new THREE.Mesh(engGeom, engMat);
      engine.castShadow = true;
      engine.receiveShadow = true;
      engine.position.set(i * 10, -2, 8);
      engine.rotationZ = Math.PI / 2;
      group.add(engine);
    }

    group.position.set(x, y, z);
    return group;
  }

  function buildHangar(x, y, z) {
    var group = new THREE.Group();

    // Main structure
    var hangarGeom = new THREE.BoxGeometry(80, 40, 100);
    var hangarMat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
    var hangar = new THREE.Mesh(hangarGeom, hangarMat);
    hangar.castShadow = true;
    hangar.receiveShadow = true;
    group.add(hangar);

    // Door left
    var doorGeom = new THREE.BoxGeometry(38, 35, 2);
    var doorMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var doorLeft = new THREE.Mesh(doorGeom, doorMat);
    doorLeft.position.set(-21, 0, 51);
    doorLeft.castShadow = true;
    group.add(doorLeft);

    // Door right
    var doorRight = new THREE.Mesh(doorGeom, doorMat);
    doorRight.position.set(21, 0, 51);
    doorRight.castShadow = true;
    group.add(doorRight);

    group.position.set(x, y, z);
    return group;
  }

  function buildControlTower(x, y, z) {
    var group = new THREE.Group();

    // Base
    var baseGeom = new THREE.BoxGeometry(12, 60, 12);
    var baseMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.castShadow = true;
    base.receiveShadow = true;
    base.position.y = 30;
    group.add(base);

    // Glass cab
    var cabGeom = new THREE.BoxGeometry(14, 12, 14);
    var cabMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, transparent: true, opacity: 0.6 });
    var cab = new THREE.Mesh(cabGeom, cabMat);
    cab.castShadow = true;
    cab.position.y = 68;
    group.add(cab);

    group.position.set(x, y, z);
    return group;
  }

  function buildFuelBowser(x, y, z) {
    var group = new THREE.Group();

    // Truck bed
    var bedGeom = new THREE.BoxGeometry(8, 6, 20);
    var bedMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
    var bed = new THREE.Mesh(bedGeom, bedMat);
    bed.castShadow = true;
    bed.receiveShadow = true;
    group.add(bed);

    // Tank
    var tankGeom = new THREE.CylinderGeometry(6, 6, 16, 16);
    var tankMat = new THREE.MeshStandardMaterial({ color: 0xff8800 });
    var tank = new THREE.Mesh(tankGeom, tankMat);
    tank.castShadow = true;
    tank.receiveShadow = true;
    tank.rotation.z = Math.PI / 2;
    tank.position.set(0, 6, -2);
    group.add(tank);

    // Wheels
    for (var i = -1; i <= 1; i += 2) {
      for (var j = -8; j <= 8; j += 8) {
        var wheelGeom = new THREE.CylinderGeometry(2.5, 2.5, 1, 16);
        var wheelMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        var wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(i * 5, 2, j);
        group.add(wheel);
      }
    }

    group.position.set(x, y, z);
    return group;
  }

  function buildPerimeterFence() {
    var group = new THREE.Group();
    var points = [];
    for (var angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
      points.push(new THREE.Vector3(Math.cos(angle) * 250, 0, Math.sin(angle) * 250));
      points.push(new THREE.Vector3(Math.cos(angle) * 250, 8, Math.sin(angle) * 250));
    }

    var geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(points);
    var material = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });
    var fence = new THREE.LineSegments(geometry, material);
    group.add(fence);

    // Posts
    for (var i = 0; i < 24; i++) {
      var angle = (i / 24) * Math.PI * 2;
      var postGeom = new THREE.CylinderGeometry(1, 1, 8, 8);
      var postMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
      var post = new THREE.Mesh(postGeom, postMat);
      post.castShadow = true;
      post.position.set(Math.cos(angle) * 250, 4, Math.sin(angle) * 250);
      group.add(post);
    }

    return group;
  }

  function buildPillbox(x, y, z) {
    var group = new THREE.Group();

    var pillboxGeom = new THREE.BoxGeometry(12, 8, 12);
    var pillboxMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var pillbox = new THREE.Mesh(pillboxGeom, pillboxMat);
    pillbox.castShadow = true;
    pillbox.receiveShadow = true;
    group.add(pillbox);

    // Gun opening
    var gunGeom = new THREE.BoxGeometry(4, 3, 1);
    var gunMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    var gun = new THREE.Mesh(gunGeom, gunMat);
    gun.position.z = 6;
    group.add(gun);

    group.position.set(x, y, z);
    return group;
  }

  function buildAAGun(x, y, z) {
    var group = new THREE.Group();

    // Sandbag base
    var baseGeom = new THREE.BoxGeometry(20, 3, 20);
    var baseMat = new THREE.MeshStandardMaterial({ color: 0xaa8844 });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Gun barrel
    var barrelGeom = new THREE.CylinderGeometry(1.5, 1.5, 12, 16);
    var barrelMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var barrel = new THREE.Mesh(barrelGeom, barrelMat);
    barrel.castShadow = true;
    barrel.rotation.z = Math.PI / 4;
    barrel.position.set(0, 5, 0);
    group.add(barrel);

    // Traverse
    var traverseGeom = new THREE.BoxGeometry(8, 4, 8);
    var traverseMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var traverse = new THREE.Mesh(traverseGeom, traverseMat);
    traverse.castShadow = true;
    traverse.position.y = 3;
    group.add(traverse);

    group.position.set(x, y, z);
    return group;
  }

  function buildRadar(x, y, z) {
    var group = new THREE.Group();

    // Pole
    var poleGeom = new THREE.CylinderGeometry(2, 2, 40, 16);
    var poleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    var pole = new THREE.Mesh(poleGeom, poleMat);
    pole.castShadow = true;
    pole.position.y = 20;
    group.add(pole);

    // Dish (will be stored for rotation)
    var dishGeom = new THREE.BoxGeometry(25, 1, 25);
    var dishMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    var dish = new THREE.Mesh(dishGeom, dishMat);
    dish.castShadow = true;
    dish.position.y = 42;
    group.add(dish);

    // Store dish for animation
    group.dishMesh = dish;

    group.position.set(x, y, z);
    return group;
  }

  function buildAssaultTroop(x, y, z) {
    var group = new THREE.Group();

    // Body
    var bodyGeom = new THREE.BoxGeometry(2, 4, 1.5);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x00aa00 });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.y = 2;
    group.add(body);

    // Head
    var headGeom = new THREE.SphereGeometry(1, 8, 8);
    var headMat = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    var head = new THREE.Mesh(headGeom, headMat);
    head.castShadow = true;
    head.position.y = 5;
    group.add(head);

    group.position.set(x, y, z);
    return group;
  }

  function buildDefender(x, y, z) {
    var group = new THREE.Group();

    // Body
    var bodyGeom = new THREE.BoxGeometry(2, 4, 1.5);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0xaa0000 });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.y = 2;
    group.add(body);

    // Head
    var headGeom = new THREE.SphereGeometry(1, 8, 8);
    var headMat = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    var head = new THREE.Mesh(headGeom, headMat);
    head.castShadow = true;
    head.position.y = 5;
    group.add(head);

    group.position.set(x, y, z);
    return group;
  }

  function buildGroundSupportVehicle(x, y, z) {
    var group = new THREE.Group();

    // Cab
    var cabGeom = new THREE.BoxGeometry(6, 5, 8);
    var cabMat = new THREE.MeshStandardMaterial({ color: 0x00aa44 });
    var cab = new THREE.Mesh(cabGeom, cabMat);
    cab.castShadow = true;
    cab.receiveShadow = true;
    cab.position.set(0, 2.5, 4);
    group.add(cab);

    // Bed
    var bedGeom = new THREE.BoxGeometry(7, 4, 12);
    var bedMat = new THREE.MeshStandardMaterial({ color: 0x008844 });
    var bed = new THREE.Mesh(bedGeom, bedMat);
    bed.castShadow = true;
    bed.receiveShadow = true;
    bed.position.set(0, 2, -6);
    group.add(bed);

    // Wheels
    for (var i = -1; i <= 1; i += 2) {
      for (var j = 2; j <= 10; j += 8) {
        var wheelGeom = new THREE.CylinderGeometry(2, 2, 1.5, 16);
        var wheelMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        var wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(i * 4, 1, j);
        group.add(wheel);
      }
    }

    group.position.set(x, y, z);
    return group;
  }

  function buildCrater(x, y, z) {
    var group = new THREE.Group();

    // Depression
    var craterGeom = new THREE.BoxGeometry(40, 3, 40);
    var craterMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var crater = new THREE.Mesh(craterGeom, craterMat);
    crater.castShadow = true;
    crater.receiveShadow = true;
    crater.position.y = -1.5;
    group.add(crater);

    // Rubble
    for (var i = 0; i < 5; i++) {
      var rubbleGeom = new THREE.BoxGeometry(6, 4, 6);
      var rubbleMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
      var rubble = new THREE.Mesh(rubbleGeom, rubbleMat);
      rubble.castShadow = true;
      rubble.position.set((Math.random() - 0.5) * 30, 2, (Math.random() - 0.5) * 30);
      rubble.rotation.set(Math.random(), Math.random(), Math.random());
      group.add(rubble);
    }

    group.position.set(x, y, z);
    return group;
  }

  function buildParachutist(x, y, z) {
    var group = new THREE.Group();

    // Body
    var bodyGeom = new THREE.BoxGeometry(1.5, 3, 1);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x0066ff });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = -1;
    group.add(body);

    // Head
    var headGeom = new THREE.SphereGeometry(0.7, 8, 8);
    var headMat = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    var head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 2;
    group.add(head);

    // Parachute
    var paraGeom = new THREE.ConeGeometry(8, 2, 16);
    var paraMat = new THREE.MeshStandardMaterial({ color: 0xff6600 });
    var parachute = new THREE.Mesh(paraGeom, paraMat);
    parachute.position.y = 10;
    group.add(parachute);

    group.position.set(x, y, z);
    return group;
  }

  function buildAircraftFire(x, y, z) {
    var group = new THREE.Group();

    for (var i = 0; i < 4; i++) {
      var fireGeom = new THREE.SphereGeometry(3 - i * 0.5, 8, 8);
      var fireMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.08 - i * 0.02, 1, 0.5) });
      var fire = new THREE.Mesh(fireGeom, fireMat);
      fire.position.set((Math.random() - 0.5) * 8, i * 3, (Math.random() - 0.5) * 8);
      group.add(fire);
    }

    group.position.set(x, y, z);
    return group;
  }

  function setupHUD() {
    canvasHUD = document.createElement('canvas');
    canvasHUD.width = window.innerWidth;
    canvasHUD.height = window.innerHeight;
    canvasHUD.style.position = 'absolute';
    canvasHUD.style.top = '0';
    canvasHUD.style.left = '0';
    canvasHUD.style.pointerEvents = 'none';
    document.body.appendChild(canvasHUD);

    hudContext = canvasHUD.getContext('2d');
  }

  function updateHUD() {
    if (!gameState.hudVisible) return;

    hudContext.clearRect(0, 0, canvasHUD.width, canvasHUD.height);
    hudContext.fillStyle = '#ffffff';
    hudContext.font = '20px monospace';

    var hudLines = [
      'JETS DESTROYED: ' + gameState.jetsDestroyed + '/2',
      'AIRFIELD CAPTURED: ' + (gameState.airfieldCaptured ? 'YES' : 'NO'),
      'ASSAULT TROOPS: ' + gameState.assaultTroopsActive + ' ACTIVE'
    ];

    for (var i = 0; i < hudLines.length; i++) {
      hudContext.fillText(hudLines[i], 20, 40 + i * 30);
    }
  }

  function setupInput() {
    document.addEventListener('keydown', function(e) {
      keyState[e.key] = true;

      if (e.key === 'a' || e.key === 'A') {
        var now = Date.now();
        if (now - lastAKeyTime < 400) {
          gameState.hudVisible = !gameState.hudVisible;
          lastAKeyTime = 0;
        } else {
          lastAKeyTime = now;
        }
      }
    });

    document.addEventListener('keyup', function(e) {
      keyState[e.key] = false;
    });
  }

  function update() {
    if (!scene || !renderer) return;

    // Radar rotation
    if (radarDish) {
      radarDish.rotation.y += 0.01;
    }

    // Runway lights pulse
    for (var i = 0; i < runwayLights.length; i++) {
      var intensity = Math.sin(Date.now() * 0.003 + i) * 0.5 + 0.5;
      runwayLights[i].material.opacity = 0.5 + intensity * 0.5;
    }

    // Advance assault troops
    for (var i = 0; i < assaultTroops.length; i++) {
      var troop = assaultTroops[i];
      var dir = new THREE.Vector3().subVectors(troop.target, troop.position);
      if (dir.length() > 0.5) {
        dir.normalize().multiplyScalar(0.3);
        troop.position.add(dir);
        troop.mesh.position.copy(troop.position);
      }
    }

    // Retreat defenders toward hangar
    for (var i = 0; i < defenders.length; i++) {
      var def = defenders[i];
      var dir = new THREE.Vector3().subVectors(def.target, def.position);
      if (dir.length() > 0.5) {
        dir.normalize().multiplyScalar(0.2);
        def.position.add(dir);
        def.mesh.position.copy(def.position);
      }
    }

    // Descend parachutists
    for (var i = 0; i < parachutists.length; i++) {
      var para = parachutists[i];
      para.velocity += 0.05;
      para.position.y -= para.velocity;
      if (para.position.y < 5) {
        para.position.y = 5;
        para.velocity = 0;
      }
      para.mesh.position.copy(para.position);
    }

    // Fire flicker
    var fireObjects = scene.children.filter(function(obj) {
      return obj.position.x < -30 && obj.position.x > -50 && obj.position.z > 90 && obj.position.z < 110;
    });
    for (var i = 0; i < fireObjects.length; i++) {
      var flicker = Math.random() * 0.3 + 0.7;
      if (fireObjects[i].material && fireObjects[i].material.opacity !== undefined) {
        fireObjects[i].material.opacity = flicker;
      }
    }

    updateHUD();
    renderer.render(scene, camera);
  }

  function reset() {
    if (canvasHUD && canvasHUD.parentNode) {
      canvasHUD.parentNode.removeChild(canvasHUD);
    }

    for (var i = 0; i < sceneObjects.length; i++) {
      if (sceneObjects[i].geometry) {
        sceneObjects[i].geometry.dispose();
      }
      if (sceneObjects[i].material) {
        if (Array.isArray(sceneObjects[i].material)) {
          for (var j = 0; j < sceneObjects[i].material.length; j++) {
            sceneObjects[i].material[j].dispose();
          }
        } else {
          sceneObjects[i].material.dispose();
        }
      }
    }

    if (renderer) {
      renderer.dispose();
    }

    scene = null;
    camera = null;
    renderer = null;
    radarDish = null;
    runwayLights = [];
    assaultTroops = [];
    defenders = [];
    parachutists = [];
    sceneObjects = [];
    canvasHUD = null;
    hudContext = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
