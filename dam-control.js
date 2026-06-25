window.DamControl = (function() {
  'use strict';

  var scene, camera, renderer, canvas2d, ctx2d;
  var damWall, spillways, turbineHall, powerTowers, controlBuilding;
  var waterTowers, penstocks, generators, securityGuards, saboteurs;
  var demolitionCharge, securityBoat, crane, waterReservoir, downstreamRiver;
  var floodgate, waterSurface, spillwayWater;

  var gameState = {
    chargesDefused: 0,
    saboteurDown: 0,
    damIntegrity: 100,
    hudVisible: false,
    lastDKeyTime: 0
  };

  var objects = [];
  var lineSegments = [];

  function init(containerElement) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 2000, 4000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(100, 150, 300);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    containerElement.appendChild(renderer.domElement);

    initCanvas2D();
    initLighting();
    buildScene();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onWindowResize);

    animate();
  }

  function initCanvas2D() {
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

  function initLighting() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(200, 300, 200);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 1000;
    directionalLight.shadow.camera.left = -500;
    directionalLight.shadow.camera.right = 500;
    directionalLight.shadow.camera.top = 500;
    directionalLight.shadow.camera.bottom = -500;
    scene.add(directionalLight);
  }

  function buildScene() {
    var groundGeo = new THREE.BoxGeometry(1000, 1, 1000);
    var groundMat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    ground.position.y = -50;
    scene.add(ground);
    objects.push(ground);

    buildDamWall();
    buildDamCrestWalkway();
    buildSpillways();
    buildTurbineHall();
    buildPowerTowers();
    buildControlBuilding();
    buildWaterTowers();
    buildPenstocks();
    buildGenerators();
    buildSecurityGuards();
    buildSaboteurs();
    buildDemolitionCharge();
    buildSecurityBoat();
    buildCrane();
    buildWaterSurfaces();
    buildEmergencyFloodgate();
  }

  function buildDamWall() {
    var damGeo = new THREE.BoxGeometry(200, 300, 50);
    var damMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7 });
    damWall = new THREE.Mesh(damGeo, damMat);
    damWall.castShadow = true;
    damWall.receiveShadow = true;
    damWall.position.set(0, 100, -100);
    scene.add(damWall);
    objects.push(damWall);
  }

  function buildDamCrestWalkway() {
    var walkwayGeo = new THREE.BoxGeometry(210, 5, 30);
    var walkwayMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var walkway = new THREE.Mesh(walkwayGeo, walkwayMat);
    walkway.castShadow = true;
    walkway.receiveShadow = true;
    walkway.position.set(0, 255, -95);
    scene.add(walkway);
    objects.push(walkway);
  }

  function buildSpillways() {
    var spillwayGeo = new THREE.BoxGeometry(60, 150, 20);
    var spillwayMat = new THREE.MeshStandardMaterial({ color: 0x999999 });

    var spillway1 = new THREE.Mesh(spillwayGeo, spillwayMat);
    spillway1.castShadow = true;
    spillway1.position.set(-80, 80, 30);
    spillway1.rotation.z = 0.3;
    scene.add(spillway1);
    objects.push(spillway1);

    var spillway2 = new THREE.Mesh(spillwayGeo, spillwayMat);
    spillway2.castShadow = true;
    spillway2.position.set(80, 80, 30);
    spillway2.rotation.z = -0.3;
    scene.add(spillway2);
    objects.push(spillway2);
  }

  function buildTurbineHall() {
    var hallGeo = new THREE.BoxGeometry(200, 80, 120);
    var hallMat = new THREE.MeshStandardMaterial({ color: 0x666644 });
    turbineHall = new THREE.Mesh(hallGeo, hallMat);
    turbineHall.castShadow = true;
    turbineHall.receiveShadow = true;
    turbineHall.position.set(0, 30, 150);
    scene.add(turbineHall);
    objects.push(turbineHall);
  }

  function buildPowerTowers() {
    var towerPositions = [
      [-100, 0, 300],
      [100, 0, 300],
      [-100, 0, 500],
      [100, 0, 500]
    ];

    powerTowers = [];
    for (var i = 0; i < towerPositions.length; i++) {
      var cylinderGeo = new THREE.CylinderGeometry(5, 5, 250, 16);
      var cylinderMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
      var tower = new THREE.Mesh(cylinderGeo, cylinderMat);
      tower.castShadow = true;
      tower.position.set(towerPositions[i][0], towerPositions[i][1] + 125, towerPositions[i][2]);
      scene.add(tower);
      objects.push(tower);
      powerTowers.push(tower);
    }

    var material = new THREE.LineBasicMaterial({ color: 0x444444 });
    var geometry = new THREE.BufferGeometry();
    var vertices = new Float32Array([
      -100, 240, 300,
      100, 240, 300,
      -100, 240, 500,
      100, 240, 500,
      -100, 240, 300,
      -100, 240, 500,
      100, 240, 300,
      100, 240, 500
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    var lines = new THREE.LineSegments(geometry, material);
    scene.add(lines);
    lineSegments.push(lines);
  }

  function buildControlBuilding() {
    var buildingGeo = new THREE.BoxGeometry(80, 60, 60);
    var buildingMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    controlBuilding = new THREE.Mesh(buildingGeo, buildingMat);
    controlBuilding.castShadow = true;
    controlBuilding.position.set(-150, 40, 100);
    scene.add(controlBuilding);
    objects.push(controlBuilding);

    var screenGeo = new THREE.BoxGeometry(20, 20, 2);
    var screenMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00 });
    var screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(-110, 50, 90);
    scene.add(screen);
    objects.push(screen);
  }

  function buildWaterTowers() {
    var towerGeo = new THREE.CylinderGeometry(15, 15, 100, 16);
    var towerMat = new THREE.MeshStandardMaterial({ color: 0x888888 });

    var tower1 = new THREE.Mesh(towerGeo, towerMat);
    tower1.castShadow = true;
    tower1.position.set(-80, 50, -200);
    scene.add(tower1);
    objects.push(tower1);

    var tower2 = new THREE.Mesh(towerGeo, towerMat);
    tower2.castShadow = true;
    tower2.position.set(80, 50, -200);
    scene.add(tower2);
    objects.push(tower2);
  }

  function buildPenstocks() {
    var pipeGeo = new THREE.CylinderGeometry(12, 12, 250, 16);
    var pipeMat = new THREE.MeshStandardMaterial({ color: 0x777777 });

    penstocks = [];
    for (var i = 0; i < 3; i++) {
      var pipe = new THREE.Mesh(pipeGeo, pipeMat);
      pipe.castShadow = true;
      pipe.position.set(-50 + i * 50, 100, -50);
      pipe.rotation.x = 0.4;
      scene.add(pipe);
      objects.push(pipe);
      penstocks.push(pipe);
    }
  }

  function buildGenerators() {
    generators = [];
    for (var i = 0; i < 3; i++) {
      var genGeo = new THREE.CylinderGeometry(20, 20, 50, 16);
      var genMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
      var generator = new THREE.Mesh(genGeo, genMat);
      generator.castShadow = true;
      generator.position.set(-60 + i * 60, 30, 150);
      scene.add(generator);
      objects.push(generator);
      generators.push(generator);
    }
  }

  function buildSecurityGuards() {
    securityGuards = [];
    var guardPositions = [
      [-50, 0, 0],
      [50, 0, 0],
      [0, 0, -100],
      [-100, 0, 150]
    ];

    for (var i = 0; i < guardPositions.length; i++) {
      var guard = buildCharacter(guardPositions[i], 0x0000ff);
      securityGuards.push(guard);
    }
  }

  function buildSaboteurs() {
    saboteurs = [];
    var saboteurPositions = [
      [30, 0, 50],
      [-30, 0, 60],
      [0, 0, 80]
    ];

    for (var i = 0; i < saboteurPositions.length; i++) {
      var saboteur = buildCharacter(saboteurPositions[i], 0xff0000);
      saboteurs.push(saboteur);
    }
  }

  function buildCharacter(pos, color) {
    var bodyGeo = new THREE.BoxGeometry(10, 20, 8);
    var bodyMat = new THREE.MeshStandardMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.position.set(pos[0], pos[1] + 10, pos[2]);
    scene.add(body);
    objects.push(body);

    var headGeo = new THREE.SphereGeometry(6, 16, 16);
    var headMat = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.castShadow = true;
    head.position.set(pos[0], pos[1] + 28, pos[2]);
    scene.add(head);
    objects.push(head);

    return { body: body, head: head };
  }

  function buildDemolitionCharge() {
    var chargeGeo = new THREE.BoxGeometry(20, 20, 20);
    var chargeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000 });
    demolitionCharge = new THREE.Mesh(chargeGeo, chargeMat);
    demolitionCharge.castShadow = true;
    demolitionCharge.position.set(0, 10, -80);
    scene.add(demolitionCharge);
    objects.push(demolitionCharge);
  }

  function buildSecurityBoat() {
    var hullGeo = new THREE.BoxGeometry(40, 15, 80);
    var hullMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var hull = new THREE.Mesh(hullGeo, hullMat);
    hull.castShadow = true;
    hull.position.set(-150, 8, -250);
    scene.add(hull);
    objects.push(hull);

    var outboardGeo = new THREE.CylinderGeometry(4, 4, 30, 16);
    var outboardMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var outboard = new THREE.Mesh(outboardGeo, outboardMat);
    outboard.castShadow = true;
    outboard.position.set(-150, -8, -250);
    scene.add(outboard);
    objects.push(outboard);

    securityBoat = { hull: hull, outboard: outboard, x: -150, z: -250 };
  }

  function buildCrane() {
    var frameGeo = new THREE.BoxGeometry(30, 200, 20);
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    var frame = new THREE.Mesh(frameGeo, frameMat);
    frame.castShadow = true;
    frame.position.set(-100, 150, -95);
    scene.add(frame);
    objects.push(frame);

    crane = frame;
  }

  function buildWaterSurfaces() {
    var reservoirGeo = new THREE.BoxGeometry(300, 1, 250);
    var waterMat = new THREE.MeshStandardMaterial({
      color: 0x0099ff,
      transparent: true,
      opacity: 0.6
    });
    waterReservoir = new THREE.Mesh(reservoirGeo, waterMat);
    waterReservoir.receiveShadow = true;
    waterReservoir.position.set(-50, -5, -200);
    scene.add(waterReservoir);
    objects.push(waterReservoir);

    var riverGeo = new THREE.BoxGeometry(150, 1, 400);
    var river = new THREE.Mesh(riverGeo, waterMat);
    river.receiveShadow = true;
    river.position.set(0, -6, 300);
    scene.add(river);
    objects.push(river);
    downstreamRiver = river;

    waterSurface = waterReservoir;
  }

  function buildEmergencyFloodgate() {
    var gateGeo = new THREE.BoxGeometry(150, 100, 20);
    var gateMat = new THREE.MeshStandardMaterial({ color: 0xff6600 });
    floodgate = new THREE.Mesh(gateGeo, gateMat);
    floodgate.castShadow = true;
    floodgate.position.set(0, 150, -100);
    scene.add(floodgate);
    objects.push(floodgate);
  }

  function update() {
    var time = Date.now() * 0.001;

    if (floodgate) {
      floodgate.position.y = Math.max(20, 150 - time * 20);
    }

    if (demolitionCharge) {
      var alpha = Math.sin(time * 5) * 0.5 + 0.5;
      demolitionCharge.material.emissiveIntensity = alpha;
    }

    if (securityBoat) {
      securityBoat.x = -150 + Math.sin(time * 0.5) * 100;
      securityBoat.hull.position.x = securityBoat.x;
      securityBoat.outboard.position.x = securityBoat.x;
    }

    if (generators.length > 0) {
      for (var i = 0; i < generators.length; i++) {
        generators[i].rotation.z += 0.05;
      }
    }

    if (waterSurface) {
      waterSurface.position.y = -5 + Math.sin(time * 2) * 0.5;
    }

    if (securityGuards.length > 0 && saboteurs.length > 0) {
      var guardDir = new THREE.Vector3();
      guardDir.subVectors(saboteurs[0].body.position, securityGuards[0].body.position);
      guardDir.normalize();
      securityGuards[0].body.position.addScaledVector(guardDir, 0.1);
    }

    updateHUD();
    renderer.render(scene, camera);
  }

  function animate() {
    requestAnimationFrame(animate);
    update();
  }

  function updateHUD() {
    if (!gameState.hudVisible) {
      return;
    }

    ctx2d.clearRect(0, 0, canvas2d.width, canvas2d.height);
    ctx2d.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx2d.fillRect(20, 20, 400, 150);

    ctx2d.fillStyle = '#ffffff';
    ctx2d.font = '20px Arial';
    ctx2d.fillText('CHARGES DEFUSED: ' + gameState.chargesDefused + '/3', 40, 60);
    ctx2d.fillText('SABOTEURS DOWN: ' + gameState.saboteurDown + '/3', 40, 100);
    ctx2d.fillText('DAM INTEGRITY: ' + gameState.damIntegrity + '%', 40, 140);
  }

  function onKeyDown(e) {
    if (e.key === 'd' || e.key === 'D') {
      var now = Date.now();
      if (now - gameState.lastDKeyTime < 400) {
        if (e.key === 'd' || e.key === 'D') {
          gameState.lastDKeyTime = 0;
          gameState.hudVisible = !gameState.hudVisible;
        }
      } else {
        gameState.lastDKeyTime = now;
      }
    }

    if ((e.key === 'c' || e.key === 'C') && (Date.now() - gameState.lastDKeyTime) < 400) {
      gameState.lastDKeyTime = 0;
      gameState.hudVisible = !gameState.hudVisible;
    }
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (canvas2d) {
      canvas2d.width = window.innerWidth;
      canvas2d.height = window.innerHeight;
    }
  }

  function reset() {
    if (canvas2d && canvas2d.parentNode) {
      canvas2d.parentNode.removeChild(canvas2d);
    }

    for (var i = 0; i < objects.length; i++) {
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
      if (objects[i].material) {
        if (Array.isArray(objects[i].material)) {
          for (var j = 0; j < objects[i].material.length; j++) {
            objects[i].material[j].dispose();
          }
        } else {
          objects[i].material.dispose();
        }
      }
    }

    for (var k = 0; k < lineSegments.length; k++) {
      if (lineSegments[k].geometry) {
        lineSegments[k].geometry.dispose();
      }
      if (lineSegments[k].material) {
        lineSegments[k].material.dispose();
      }
    }

    if (renderer && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    if (renderer) {
      renderer.dispose();
    }

    objects = [];
    lineSegments = [];
    gameState = {
      chargesDefused: 0,
      saboteurDown: 0,
      damIntegrity: 100,
      hudVisible: false,
      lastDKeyTime: 0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
