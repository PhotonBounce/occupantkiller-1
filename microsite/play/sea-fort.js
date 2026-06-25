window.SeaFort = (function() { 'use strict';

  var scene, camera, renderer, canvas2d, ctx2d;
  var seaFortObjects = [];
  var garrison = [];
  var commandos = [];
  var speedboat = null;
  var radarDish = null;
  var searchlight = null;
  var aaGun1 = null;
  var aaGun2 = null;
  var mainPlatform = null;
  var secondaryPlatform = null;
  var time = 0;

  var gameState = {
    garrisonDown: 0,
    gunsDisabled: 0,
    extractionComplete: false
  };

  var hudVisible = false;

  function init(container) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 150, 300);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(30, 40, 30);
    camera.lookAt(0, 10, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    var light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(50, 50, 50);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    scene.add(light);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    buildSeaFort();
    createGarrison();
    createCommandos();
    createSpeedboat();
    createCanvas2D();
    setupInputHandling();

    window.addEventListener('resize', onWindowResize);
  }

  function buildSeaFort() {
    var material = function(color) {
      var m = new THREE.MeshStandardMaterial({ color: color });
      return m;
    };

    var seaMaterial = material(0x4A90A4);
    var steelMaterial = material(0x555555);
    var platMaterial = material(0x666677);
    var gunMaterial = material(0x333333);
    var radiatorMaterial = material(0x888899);

    // 1. Sea surface base
    var seaGeom = new THREE.BoxGeometry(200, 2, 200);
    var sea = new THREE.Mesh(seaGeom, seaMaterial);
    sea.position.y = -5;
    sea.receiveShadow = true;
    scene.add(sea);
    seaFortObjects.push(sea);

    // 2. Main platform
    var mainPlatGeom = new THREE.BoxGeometry(30, 2, 25);
    mainPlatform = new THREE.Mesh(mainPlatGeom, platMaterial);
    mainPlatform.position.set(0, 15, 0);
    mainPlatform.castShadow = true;
    mainPlatform.receiveShadow = true;
    scene.add(mainPlatform);
    seaFortObjects.push(mainPlatform);

    // Main platform legs
    var legGeom = new THREE.BoxGeometry(1, 15, 1);
    var legPositions = [[-12, 7.5, -10], [12, 7.5, -10], [-12, 7.5, 10], [12, 7.5, 10]];
    legPositions.forEach(function(pos) {
      var leg = new THREE.Mesh(legGeom, steelMaterial);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      scene.add(leg);
      seaFortObjects.push(leg);
    });

    // 3. Secondary platform
    var secPlatGeom = new THREE.BoxGeometry(20, 2, 20);
    secondaryPlatform = new THREE.Mesh(secPlatGeom, platMaterial);
    secondaryPlatform.position.set(25, 14, 0);
    secondaryPlatform.castShadow = true;
    secondaryPlatform.receiveShadow = true;
    scene.add(secondaryPlatform);
    seaFortObjects.push(secondaryPlatform);

    // Secondary platform legs
    var secLegPositions = [[-8, 7, -8], [8, 7, -8], [-8, 7, 8], [8, 7, 8]];
    secLegPositions.forEach(function(pos) {
      var leg = new THREE.Mesh(legGeom, steelMaterial);
      leg.position.set(pos[0] + 25, pos[1], pos[2]);
      leg.castShadow = true;
      scene.add(leg);
      seaFortObjects.push(leg);
    });

    // Catwalk connecting platforms
    var catGeom = new THREE.BoxGeometry(12, 0.5, 1);
    var catwalk = new THREE.Mesh(catGeom, steelMaterial);
    catwalk.position.set(12.5, 15, 0);
    catwalk.castShadow = true;
    scene.add(catwalk);
    seaFortObjects.push(catwalk);

    // 4. AA gun platform
    var aaGunPlatGeom = new THREE.BoxGeometry(15, 2, 15);
    var aaGunPlat = new THREE.Mesh(aaGunPlatGeom, platMaterial);
    aaGunPlat.position.set(-20, 12, 15);
    aaGunPlat.castShadow = true;
    aaGunPlat.receiveShadow = true;
    scene.add(aaGunPlat);
    seaFortObjects.push(aaGunPlat);

    // AA gun platform legs
    var aaLegPositions = [[-5, 6, -5], [5, 6, -5], [-5, 6, 5], [5, 6, 5]];
    aaLegPositions.forEach(function(pos) {
      var leg = new THREE.Mesh(legGeom, steelMaterial);
      leg.position.set(pos[0] - 20, pos[1], pos[2] + 15);
      leg.castShadow = true;
      scene.add(leg);
      seaFortObjects.push(leg);
    });

    // 5. AA gun #1
    var gunBaseGeom = new THREE.CylinderGeometry(2, 2, 1, 16);
    var gunBase1 = new THREE.Mesh(gunBaseGeom, gunMaterial);
    gunBase1.position.set(-20, 13.5, 15);
    gunBase1.castShadow = true;
    scene.add(gunBase1);
    seaFortObjects.push(gunBase1);

    var barrelGeom = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
    var barrel1a = new THREE.Mesh(barrelGeom, gunMaterial);
    barrel1a.position.set(-20.8, 15.5, 15);
    barrel1a.rotation.z = Math.PI / 12;
    barrel1a.castShadow = true;
    scene.add(barrel1a);
    seaFortObjects.push(barrel1a);

    var barrel1b = new THREE.Mesh(barrelGeom, gunMaterial);
    barrel1b.position.set(-19.2, 15.5, 15);
    barrel1b.rotation.z = -Math.PI / 12;
    barrel1b.castShadow = true;
    scene.add(barrel1b);
    seaFortObjects.push(barrel1b);

    aaGun1 = {
      base: gunBase1,
      barrels: [barrel1a, barrel1b],
      position: new THREE.Vector3(-20, 13.5, 15),
      rotationY: 0
    };

    // 6. AA gun #2
    var gunBase2 = new THREE.Mesh(gunBaseGeom, gunMaterial);
    gunBase2.position.set(-20, 13.5, -15);
    gunBase2.castShadow = true;
    scene.add(gunBase2);
    seaFortObjects.push(gunBase2);

    var barrel2a = new THREE.Mesh(barrelGeom, gunMaterial);
    barrel2a.position.set(-20.8, 15.5, -15);
    barrel2a.rotation.z = Math.PI / 12;
    barrel2a.castShadow = true;
    scene.add(barrel2a);
    seaFortObjects.push(barrel2a);

    var barrel2b = new THREE.Mesh(barrelGeom, gunMaterial);
    barrel2b.position.set(-19.2, 15.5, -15);
    barrel2b.rotation.z = -Math.PI / 12;
    barrel2b.castShadow = true;
    scene.add(barrel2b);
    seaFortObjects.push(barrel2b);

    aaGun2 = {
      base: gunBase2,
      barrels: [barrel2a, barrel2b],
      position: new THREE.Vector3(-20, 13.5, -15),
      rotationY: 0
    };

    // 7. Radar platform
    var radarPlatGeom = new THREE.BoxGeometry(12, 1.5, 12);
    var radarPlat = new THREE.Mesh(radarPlatGeom, platMaterial);
    radarPlat.position.set(0, 18, -20);
    radarPlat.castShadow = true;
    radarPlat.receiveShadow = true;
    scene.add(radarPlat);
    seaFortObjects.push(radarPlat);

    // Radar legs
    var radarLegPositions = [[-4, 9, -4], [4, 9, -4], [-4, 9, 4], [4, 9, 4]];
    radarLegPositions.forEach(function(pos) {
      var leg = new THREE.Mesh(legGeom, steelMaterial);
      leg.position.set(pos[0], pos[1], pos[2] - 20);
      leg.castShadow = true;
      scene.add(leg);
      seaFortObjects.push(leg);
    });

    // Radar dish
    var radarDishGeom = new THREE.CylinderGeometry(4, 4, 0.5, 32);
    radarDish = new THREE.Mesh(radarDishGeom, radiatorMaterial);
    radarDish.position.set(0, 20, -20);
    radarDish.castShadow = true;
    scene.add(radarDish);
    seaFortObjects.push(radarDish);

    // 8. Living quarters tower
    var quartersGeom = new THREE.BoxGeometry(8, 8, 8);
    var quarters = new THREE.Mesh(quartersGeom, platMaterial);
    quarters.position.set(-8, 19, 5);
    quarters.castShadow = true;
    quarters.receiveShadow = true;
    scene.add(quarters);
    seaFortObjects.push(quarters);

    // 9. Control room cabin
    var cabinGeom = new THREE.BoxGeometry(6, 5, 6);
    var cabin = new THREE.Mesh(cabinGeom, radiatorMaterial);
    cabin.position.set(10, 18, -8);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    scene.add(cabin);
    seaFortObjects.push(cabin);

    // 10. Crane arm
    var craneGeom = new THREE.BoxGeometry(2, 1, 12);
    var crane = new THREE.Mesh(craneGeom, steelMaterial);
    crane.position.set(15, 17, 10);
    crane.rotation.z = Math.PI / 8;
    crane.castShadow = true;
    scene.add(crane);
    seaFortObjects.push(crane);

    // 11. Signal mast
    var mastGeom = new THREE.CylinderGeometry(0.5, 0.5, 12, 8);
    var mast = new THREE.Mesh(mastGeom, steelMaterial);
    mast.position.set(-15, 21, -10);
    mast.castShadow = true;
    scene.add(mast);
    seaFortObjects.push(mast);

    // 14. Supply speedboat (created separately in createSpeedboat)

    // 15. Rope ladder
    var ropeSpacing = 1.5;
    for (var i = 0; i < 8; i++) {
      var rungGeom = new THREE.BoxGeometry(3, 0.3, 0.3);
      var rung = new THREE.Mesh(rungGeom, steelMaterial);
      rung.position.set(15, 16 - i * ropeSpacing, 0);
      rung.castShadow = true;
      scene.add(rung);
      seaFortObjects.push(rung);
    }

    // 16. Searchlight
    var searchlightBaseGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16);
    var searchlightBase = new THREE.Mesh(searchlightBaseGeom, gunMaterial);
    searchlightBase.position.set(10, 20, 15);
    scene.add(searchlightBase);
    seaFortObjects.push(searchlightBase);

    var searchlightBeamGeom = new THREE.CylinderGeometry(0.8, 0.8, 3, 8);
    var searchlightBeam = new THREE.Mesh(searchlightBeamGeom, gunMaterial);
    searchlightBeam.position.set(10, 21.5, 15);
    searchlightBeam.castShadow = true;
    scene.add(searchlightBeam);
    seaFortObjects.push(searchlightBeam);

    var searchlightSphereGeom = new THREE.SphereGeometry(1, 16, 16);
    var searchlightSphere = new THREE.Mesh(searchlightSphereGeom, new THREE.MeshBasicMaterial({ color: 0xffff99, emissive: 0xffff99 }));
    searchlightSphere.position.set(10, 22.5, 15);
    scene.add(searchlightSphere);
    seaFortObjects.push(searchlightSphere);

    searchlight = {
      base: searchlightBase,
      beam: searchlightBeam,
      sphere: searchlightSphere,
      rotationY: 0
    };

    // 17. Ammunition storage box cluster
    var ammoGeom = new THREE.BoxGeometry(4, 3, 4);
    var ammoMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    var ammoPositions = [[-12, 18, -12], [-8, 18, -12], [-10, 21, -12], [-14, 18, -14]];
    ammoPositions.forEach(function(pos) {
      var ammoBox = new THREE.Mesh(ammoGeom, ammoMaterial);
      ammoBox.position.set(pos[0], pos[1], pos[2]);
      ammoBox.castShadow = true;
      ammoBox.receiveShadow = true;
      scene.add(ammoBox);
      seaFortObjects.push(ammoBox);
    });
  }

  function createGarrison() {
    for (var i = 0; i < 6; i++) {
      var posX = -10 + i * 4;
      var soldier = createSoldier(posX, 16, 5, 0x228B22);
      soldier.index = i;
      garrison.push(soldier);
      scene.add(soldier.group);
    }
  }

  function createCommandos() {
    for (var i = 0; i < 4; i++) {
      var posX = 35 + i * 3;
      var commando = createSoldier(posX, 16, -15, 0x2F4F4F);
      commando.index = i;
      commando.isCommando = true;
      commandos.push(commando);
      scene.add(commando.group);
    }
  }

  function createSoldier(x, y, z, color) {
    var group = new THREE.Group();

    var bodyGeom = new THREE.BoxGeometry(1.5, 3, 1);
    var bodyMat = new THREE.MeshStandardMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 1.5;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    var headGeom = new THREE.SphereGeometry(0.7, 16, 16);
    var head = new THREE.Mesh(headGeom, bodyMat);
    head.position.y = 3.7;
    head.castShadow = true;
    group.add(head);

    group.position.set(x, y, z);
    group.castShadow = true;

    return {
      group: group,
      body: body,
      head: head,
      position: new THREE.Vector3(x, y, z),
      velocity: new THREE.Vector3(0, 0, 0),
      down: false,
      index: -1,
      isCommando: false
    };
  }

  function createSpeedboat() {
    var group = new THREE.Group();

    var hullGeom = new THREE.BoxGeometry(8, 2, 3);
    var hullMat = new THREE.MeshStandardMaterial({ color: 0x1C1C1C });
    var hull = new THREE.Mesh(hullGeom, hullMat);
    hull.position.y = 0.5;
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    var engineGeom = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 8);
    var engine = new THREE.Mesh(engineGeom, new THREE.MeshStandardMaterial({ color: 0x444444 }));
    engine.position.set(-2, 1, 0);
    engine.castShadow = true;
    group.add(engine);

    group.position.set(60, 0, 0);

    speedboat = {
      group: group,
      hull: hull,
      engine: engine,
      position: new THREE.Vector3(60, 0, 0),
      targetX: 5,
      progress: 0
    };

    scene.add(group);
    seaFortObjects.push(group);
  }

  function createCanvas2D() {
    canvas2d = document.createElement('canvas');
    canvas2d.width = window.innerWidth;
    canvas2d.height = window.innerHeight;
    canvas2d.style.position = 'absolute';
    canvas2d.style.top = '0';
    canvas2d.style.left = '0';
    canvas2d.style.pointerEvents = 'none';
    document.body.appendChild(canvas2d);

    ctx2d = canvas2d.getContext('2d');
  }

  function drawHUD() {
    ctx2d.clearRect(0, 0, canvas2d.width, canvas2d.height);
    ctx2d.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx2d.font = '24px monospace';
    ctx2d.fillText('GARRISON DOWN: ' + gameState.garrisonDown + '/6', 20, 50);
    ctx2d.fillText('AA GUNS DISABLED: ' + gameState.gunsDisabled + '/2', 20, 90);
    ctx2d.fillText('EXTRACTION: ' + (gameState.extractionComplete ? 'COMPLETE' : 'PENDING'), 20, 130);
  }

  var keyStates = {};
  var lastSKeyTime = -1;

  function setupInputHandling() {
    document.addEventListener('keydown', function(e) {
      keyStates[e.key.toUpperCase()] = true;

      if (e.key.toUpperCase() === 'S') {
        var now = Date.now();
        if (now - lastSKeyTime < 400 && keyStates['F']) {
          hudVisible = !hudVisible;
        }
        lastSKeyTime = now;
      }
    });

    document.addEventListener('keyup', function(e) {
      keyStates[e.key.toUpperCase()] = false;
    });
  }

  function update() {
    time += 0.016;

    if (radarDish) {
      radarDish.rotation.y += 0.02;
    }

    if (aaGun1) {
      aaGun1.base.rotation.y += 0.01;
      aaGun1.barrels[0].rotation.y = aaGun1.base.rotation.y;
      aaGun1.barrels[1].rotation.y = aaGun1.base.rotation.y;
    }

    if (aaGun2) {
      aaGun2.base.rotation.y -= 0.015;
      aaGun2.barrels[0].rotation.y = aaGun2.base.rotation.y;
      aaGun2.barrels[1].rotation.y = aaGun2.base.rotation.y;
    }

    if (searchlight) {
      searchlight.rotationY += 0.008;
      searchlight.sphere.position.x = 10 + Math.cos(searchlight.rotationY) * 30;
      searchlight.sphere.position.z = 15 + Math.sin(searchlight.rotationY) * 30;
    }

    if (speedboat) {
      speedboat.progress += 0.001;
      if (speedboat.progress > 1) speedboat.progress = 0;
      speedboat.group.position.x = 60 - speedboat.progress * 55;
      speedboat.group.position.y = -2 + Math.sin(time * 2) * 0.3;
    }

    garrison.forEach(function(soldier) {
      if (!soldier.down) {
        soldier.position.z += 0.05;
        soldier.group.position.copy(soldier.position);
      }
    });

    commandos.forEach(function(commando) {
      if (!commando.down) {
        commando.position.x -= 0.08;
        commando.group.position.copy(commando.position);
      }
    });

    if (mainPlatform) {
      mainPlatform.position.y = 15 + Math.sin(time * 0.3) * 0.2;
    }

    if (secondaryPlatform) {
      secondaryPlatform.position.y = 14 + Math.sin(time * 0.3 + 0.5) * 0.15;
    }

    if (hudVisible) {
      drawHUD();
    }

    renderer.render(scene, camera);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvas2d.width = window.innerWidth;
    canvas2d.height = window.innerHeight;
  }

  function reset() {
    gameState.garrisonDown = 0;
    gameState.gunsDisabled = 0;
    gameState.extractionComplete = false;
    hudVisible = false;

    garrison.forEach(function(soldier) {
      soldier.down = false;
      soldier.position.copy(soldier.group.position);
    });

    commandos.forEach(function(commando) {
      commando.down = false;
      commando.position.copy(commando.group.position);
    });

    if (speedboat) {
      speedboat.progress = 0;
      speedboat.group.position.set(60, 0, 0);
    }

    seaFortObjects.forEach(function(obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
    });

    if (canvas2d && canvas2d.parentNode) {
      canvas2d.parentNode.removeChild(canvas2d);
    }

    seaFortObjects = [];
    garrison = [];
    commandos = [];
    speedboat = null;
    radarDish = null;
    searchlight = null;
    aaGun1 = null;
    aaGun2 = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
