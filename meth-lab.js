window.MethLab = (function() {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  var scene, camera, renderer, canvas;
  var objects = [];
  var guards = [];
  var beakers = [];
  var burners = [];
  var hudCanvas, hudContext;
  var hudVisible = true;
  var lastKeyTimes = {};
  var productSeized = 0;
  var guardsDown = 0;
  var evidenceSecured = false;

  var clock = new THREE.Clock();

  function init(containerElement) {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: own renderer, was crashing/launching over the main game */

    canvas = containerElement;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 100, 200);

    camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 10, 0);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    var spotLight = new THREE.SpotLight(0xff6b00, 0.6, 50, Math.PI / 4, 0.8, 2);
    spotLight.position.set(10, 20, -10);
    spotLight.castShadow = true;
    scene.add(spotLight);

    buildBarn();
    buildLab();
    buildStorage();
    buildGuards();
    buildSecurity();

    setupHUD();
    setupKeyboardInput();

    window.addEventListener('resize', onWindowResize);

    return { scene: scene, camera: camera, renderer: renderer };
  }

  function buildBarn() {
    var floorGeometry = new THREE.BoxGeometry(60, 0.5, 50);
    var floorMaterial = new THREE.MeshLambertMaterial({ color: 0x5c3d2e });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    floor.position.y = 0;
    scene.add(floor);
    objects.push(floor);

    var wallLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 20, 50),
      new THREE.MeshLambertMaterial({ color: 0x6b4423 })
    );
    wallLeft.castShadow = true;
    wallLeft.receiveShadow = true;
    wallLeft.position.set(-30, 10, 0);
    scene.add(wallLeft);
    objects.push(wallLeft);

    var wallRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 20, 50),
      new THREE.MeshLambertMaterial({ color: 0x6b4423 })
    );
    wallRight.castShadow = true;
    wallRight.receiveShadow = true;
    wallRight.position.set(30, 10, 0);
    scene.add(wallRight);
    objects.push(wallRight);

    var wallFront = new THREE.Mesh(
      new THREE.BoxGeometry(60, 20, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x5c3d2e })
    );
    wallFront.castShadow = true;
    wallFront.receiveShadow = true;
    wallFront.position.set(0, 10, 25);
    scene.add(wallFront);
    objects.push(wallFront);

    var wallBack = new THREE.Mesh(
      new THREE.BoxGeometry(60, 20, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x5c3d2e })
    );
    wallBack.castShadow = true;
    wallBack.receiveShadow = true;
    wallBack.position.set(0, 10, -25);
    scene.add(wallBack);
    objects.push(wallBack);

    var roofLeftMaterial = new THREE.MeshLambertMaterial({ color: 0x8b6f47 });
    var roofLeftGeometry = new THREE.BoxGeometry(60, 0.5, 25);
    var roofLeft = new THREE.Mesh(roofLeftGeometry, roofLeftMaterial);
    roofLeft.castShadow = true;
    roofLeft.receiveShadow = true;
    roofLeft.position.set(0, 20, -12.5);
    roofLeft.rotation.z = 0.3;
    scene.add(roofLeft);
    objects.push(roofLeft);

    var roofRight = new THREE.Mesh(roofLeftGeometry, roofLeftMaterial);
    roofRight.castShadow = true;
    roofRight.receiveShadow = true;
    roofRight.position.set(0, 20, 12.5);
    roofRight.rotation.z = -0.3;
    scene.add(roofRight);
    objects.push(roofRight);
  }

  function buildLab() {
    var labTableGeometry = new THREE.BoxGeometry(25, 0.8, 6);
    var labTableMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var labTable = new THREE.Mesh(labTableGeometry, labTableMaterial);
    labTable.castShadow = true;
    labTable.receiveShadow = true;
    labTable.position.set(-10, 1, 0);
    scene.add(labTable);
    objects.push(labTable);

    for (var i = 0; i < 6; i++) {
      var beakerGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1.5, 16);
      var beakerMaterial = new THREE.MeshPhongMaterial({
        color: 0x22ff22,
        emissive: 0x11aa11,
        emissiveIntensity: 0.5
      });
      var beaker = new THREE.Mesh(beakerGeometry, beakerMaterial);
      beaker.castShadow = true;
      beaker.position.set(-20 + i * 4, 2, 0);
      scene.add(beaker);
      objects.push(beaker);
      beakers.push({ mesh: beaker, baseY: 2, phase: i * 0.5 });
    }

    var vesselGeometry = new THREE.CylinderGeometry(2, 2, 3, 32);
    var vesselMaterial = new THREE.MeshPhongMaterial({
      color: 0x444444,
      emissive: 0xffff00,
      emissiveIntensity: 0.3
    });
    var vessel = new THREE.Mesh(vesselGeometry, vesselMaterial);
    vessel.castShadow = true;
    vessel.receiveShadow = true;
    vessel.position.set(10, 2, -5);
    scene.add(vessel);
    objects.push(vessel);

    var burnerBase = new THREE.Mesh(
      new THREE.BoxGeometry(15, 0.4, 2),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    burnerBase.castShadow = true;
    burnerBase.position.set(10, 0.8, 5);
    scene.add(burnerBase);
    objects.push(burnerBase);

    for (var j = 0; j < 5; j++) {
      var burner = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.3, 1),
        new THREE.MeshLambertMaterial({ color: 0x222222 })
      );
      burner.castShadow = true;
      burner.position.set(5 + j * 2, 1.2, 5);
      scene.add(burner);
      objects.push(burner);

      var flameGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var flameMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        emissive: 0xff6600,
        emissiveIntensity: 0.8
      });
      var flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.position.set(5 + j * 2, 1.8, 5);
      scene.add(flame);
      objects.push(flame);
      burners.push({ mesh: flame, baseIntensity: 0.8, phase: j * 0.4 });
    }

    var scaleBase = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.3, 2),
      new THREE.MeshLambertMaterial({ color: 0x555555 })
    );
    scaleBase.castShadow = true;
    scaleBase.position.set(20, 1.2, -8);
    scene.add(scaleBase);
    objects.push(scaleBase);

    var scalePlate = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.1, 1.5),
      new THREE.MeshPhongMaterial({ color: 0x999999 })
    );
    scalePlate.position.set(20, 1.6, -8);
    scene.add(scalePlate);
    objects.push(scalePlate);

    var gearRackGeometry = new THREE.BoxGeometry(8, 4, 1);
    var gearRackMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    var gearRack = new THREE.Mesh(gearRackGeometry, gearRackMaterial);
    gearRack.castShadow = true;
    gearRack.position.set(-20, 2.5, 12);
    scene.add(gearRack);
    objects.push(gearRack);

    for (var k = 0; k < 4; k++) {
      var suit = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 2, 0.8),
        new THREE.MeshLambertMaterial({ color: 0xffff00 })
      );
      suit.castShadow = true;
      suit.position.set(-22 + k * 2, 3.5, 12);
      scene.add(suit);
      objects.push(suit);
    }
  }

  function buildStorage() {
    var barrelPositions = [
      { x: 15, z: -15 },
      { x: 20, z: -15 },
      { x: 25, z: -15 },
      { x: 30, z: -15 },
      { x: 15, z: -20 },
      { x: 20, z: -20 },
      { x: 25, z: -20 },
      { x: 30, z: -20 }
    ];

    for (var i = 0; i < barrelPositions.length; i++) {
      var barrelGeometry = new THREE.CylinderGeometry(1, 1, 2.5, 16);
      var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0xffdd00 });
      var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      barrel.position.set(barrelPositions[i].x, 1.5, barrelPositions[i].z);
      scene.add(barrel);
      objects.push(barrel);

      var bandGeometry = new THREE.CylinderGeometry(1.05, 1.05, 0.3, 16);
      var bandMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
      var band = new THREE.Mesh(bandGeometry, bandMaterial);
      band.position.set(barrelPositions[i].x, 1.8, barrelPositions[i].z);
      scene.add(band);
      objects.push(band);
    }

    var fanFrameGeometry = new THREE.CylinderGeometry(2, 2, 0.5, 16);
    var fanFrameMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var fanFrame = new THREE.Mesh(fanFrameGeometry, fanFrameMaterial);
    fanFrame.castShadow = true;
    fanFrame.position.set(-15, 18, -20);
    scene.add(fanFrame);
    objects.push(fanFrame);

    var bladeGroup = new THREE.Group();
    bladeGroup.position.set(-15, 18, -20);
    scene.add(bladeGroup);
    objects.push(bladeGroup);

    for (var j = 0; j < 3; j++) {
      var bladeGeometry = new THREE.BoxGeometry(3.5, 0.1, 0.5);
      var bladeMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
      var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.rotation.z = j * (Math.PI * 2 / 3);
      blade.position.z = 0.3;
      bladeGroup.add(blade);
    }

    var packageTableGeometry = new THREE.BoxGeometry(10, 0.8, 4);
    var packageTableMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var packageTable = new THREE.Mesh(packageTableGeometry, packageTableMaterial);
    packageTable.castShadow = true;
    packageTable.receiveShadow = true;
    packageTable.position.set(0, 1, 15);
    scene.add(packageTable);
    objects.push(packageTable);

    for (var p = 0; p < 5; p++) {
      var brickGeometry = new THREE.BoxGeometry(1.5, 1.2, 1);
      var brickMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
      var brick = new THREE.Mesh(brickGeometry, brickMaterial);
      brick.castShadow = true;
      brick.position.set(-4 + p * 2, 2, 15);
      scene.add(brick);
      objects.push(brick);
    }

    var kitBoxGeometry = new THREE.BoxGeometry(2, 1.5, 1.5);
    var kitBoxMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.4
    });
    var kitBox = new THREE.Mesh(kitBoxGeometry, kitBoxMaterial);
    kitBox.position.set(20, 2, 15);
    scene.add(kitBox);
    objects.push(kitBox);

    var destructLightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    var destructLightMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.9
    });
    var destructLight = new THREE.Mesh(destructLightGeometry, destructLightMaterial);
    destructLight.position.set(20, 3, 15);
    scene.add(destructLight);
    objects.push(destructLight);
  }

  function buildGuards() {
    var guardPositions = [{ x: -25, z: 20 }, { x: 25, z: -20 }];

    for (var i = 0; i < guardPositions.length; i++) {
      var bodyGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.6);
      var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;
      body.position.set(guardPositions[i].x, 1.2, guardPositions[i].z);
      scene.add(body);
      objects.push(body);

      var headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
      var headMaterial = new THREE.MeshLambertMaterial({ color: 0xd4a574 });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.castShadow = true;
      head.position.set(guardPositions[i].x, 2.5, guardPositions[i].z);
      scene.add(head);
      objects.push(head);

      var gunGeometry = new THREE.BoxGeometry(0.2, 0.3, 1);
      var gunMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var gun = new THREE.Mesh(gunGeometry, gunMaterial);
      gun.castShadow = true;
      gun.position.set(guardPositions[i].x + 0.5, 1.5, guardPositions[i].z);
      scene.add(gun);
      objects.push(gun);

      guards.push({
        body: body,
        head: head,
        gun: gun,
        baseX: guardPositions[i].x,
        baseZ: guardPositions[i].z,
        direction: i === 0 ? 1 : -1
      });
    }
  }

  function buildSecurity() {
    var cameraGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.6);
    var cameraMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
    camera.castShadow = true;
    camera.position.set(25, 18, 20);
    scene.add(camera);
    objects.push(camera);

    var lensGeometry = new THREE.SphereGeometry(0.25, 12, 12);
    var lensMaterial = new THREE.MeshPhongMaterial({
      color: 0x666666,
      emissive: 0x333333,
      emissiveIntensity: 0.3
    });
    var lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.position.set(25, 18, 20.4);
    scene.add(lens);
    objects.push(lens);

    var mountGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8);
    var mountMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var mount = new THREE.Mesh(mountGeometry, mountMaterial);
    mount.position.set(25, 16.5, 20);
    scene.add(mount);
    objects.push(mount);
  }

  function setupHUD() {
    hudCanvas = document.createElement('canvas');
    hudCanvas.width = 800;
    hudCanvas.height = 200;
    hudContext = hudCanvas.getContext('2d');
  }

  function updateHUD() {
    if (!hudVisible) return;

    hudContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
    hudContext.fillRect(0, 0, hudCanvas.width, hudCanvas.height);

    hudContext.fillStyle = '#00ff00';
    hudContext.font = 'bold 20px monospace';
    hudContext.fillText('PRODUCT SEIZED: ' + productSeized + '/5 BRICKS', 20, 40);
    hudContext.fillText('GUARDS DOWN: ' + guardsDown + '/2', 20, 80);
    hudContext.fillText('EVIDENCE SECURED: ' + (evidenceSecured ? 'YES' : 'NO'), 20, 120);
    hudContext.fillText('KEYBIND: M+L to toggle HUD', 20, 160);
  }

  function setupKeyboardInput() {
    document.addEventListener('keydown', function(event) {
      var key = event.key.toUpperCase();
      var now = Date.now();

      lastKeyTimes[key] = now;

      if (lastKeyTimes['M'] && lastKeyTimes['L']) {
        if (now - lastKeyTimes['M'] < 400 && now - lastKeyTimes['L'] < 400) {
          if (Math.abs(lastKeyTimes['M'] - lastKeyTimes['L']) < 400) {
            hudVisible = !hudVisible;
            delete lastKeyTimes['M'];
            delete lastKeyTimes['L'];
          }
        }
      }

      if (key === 'M' || key === 'L') {
        setTimeout(function() {
          delete lastKeyTimes[key];
        }, 500);
      }
    });
  }

  function update() {
    var elapsed = clock.getElapsedTime();

    for (var i = 0; i < beakers.length; i++) {
      var beaker = beakers[i];
      beaker.mesh.position.y = beaker.baseY + Math.sin(elapsed + beaker.phase) * 0.1;
    }

    for (var j = 0; j < burners.length; j++) {
      var burner = burners[j];
      var flicker = 0.3 + 0.5 * Math.sin(elapsed * 8 + burner.phase);
      burner.mesh.material.emissiveIntensity = burner.baseIntensity * flicker;
    }

    var fanBladeGroup = objects.find(function(obj) {
      return obj.isGroup && obj.position.x === -15;
    });
    if (fanBladeGroup) {
      fanBladeGroup.rotation.z += 0.03;
    }

    for (var g = 0; g < guards.length; g++) {
      var guard = guards[g];
      var pace = Math.sin(elapsed * 0.5) * 3;
      guard.body.position.x = guard.baseX + pace * guard.direction;
      guard.head.position.x = guard.baseX + pace * guard.direction;
      guard.gun.position.x = guard.baseX + pace * guard.direction + 0.5 * guard.direction;
    }

    updateHUD();

    if (renderer && canvas) {
      if (renderer) renderer.render(scene, camera);
    }
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      var obj = objects[i];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(m) { m.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
      if (obj.parent) obj.parent.remove(obj);
    }
    objects = [];
    guards = [];
    beakers = [];
    burners = [];
    productSeized = 0;
    guardsDown = 0;
    evidenceSecured = false;
  }

  function onWindowResize() {
    if (!canvas || !camera || !renderer) return;
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
