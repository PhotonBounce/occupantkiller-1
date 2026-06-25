window.AsteroidField = (function() {
  'use strict';

  var scene, camera, renderer, canvas, hudCanvas;
  var mainAsteroid, mediumAsteroid1, mediumAsteroid2;
  var miningBarge, miningLaser, oreHopper;
  var raiderShip1, raiderShip2;
  var miningDrone1, miningDrone2;
  var solarPanels, escapePod;
  var debrisField = [];
  var commRelay;
  var plasmaCannon;
  var shieldGenerator;

  var oreCollected = 0;
  var raidersDestroyed = 0;
  var bargeIntegrity = 100;

  var hudVisible = true;
  var lastAKeyTime = 0;

  var animationIds = [];
  var geometries = [];
  var materials = [];
  var meshes = [];

  function createAsteroid(posX, posY, posZ, scale, rotationAxes) {
    var group = new THREE.Group();
    var boxCount = 3;
    if (scale > 3) boxCount = 5;

    for (var i = 0; i < boxCount; i++) {
      var size = 1 + Math.random() * 0.8;
      var offsetX = (Math.random() - 0.5) * scale * 0.6;
      var offsetY = (Math.random() - 0.5) * scale * 0.6;
      var offsetZ = (Math.random() - 0.5) * scale * 0.6;

      var geometry = new THREE.BoxGeometry(size, size, size);
      geometries.push(geometry);
      var material = new THREE.MeshStandardMaterial({ color: 0x654321 });
      materials.push(material);
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(offsetX, offsetY, offsetZ);
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      mesh.userData.rotationAxes = rotationAxes || [
        Math.random() * 0.01,
        Math.random() * 0.01,
        Math.random() * 0.01
      ];
      group.add(mesh);
      meshes.push(mesh);
    }

    group.position.set(posX, posY, posZ);
    group.scale.set(scale, scale, scale);
    group.userData.rotationAxes = rotationAxes || [0.001, 0.002, 0.001];
    return group;
  }

  function init(containerElement) {
    canvas = document.createElement('canvas');
    canvas.width = containerElement.clientWidth;
    canvas.height = containerElement.clientHeight;
    containerElement.appendChild(canvas);

    hudCanvas = document.createElement('canvas');
    hudCanvas.width = canvas.width;
    hudCanvas.height = canvas.height;
    hudCanvas.style.position = 'absolute';
    hudCanvas.style.top = '0';
    hudCanvas.style.left = '0';
    hudCanvas.style.pointerEvents = 'none';
    containerElement.appendChild(hudCanvas);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(
      75,
      canvas.width / canvas.height,
      0.1,
      10000
    );
    camera.position.set(15, 10, 15);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.width, canvas.height);
    renderer.shadowMap.enabled = true;

    var light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(10, 15, 10);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    scene.add(light);

    var ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    mainAsteroid = createAsteroid(0, 0, 0, 4, [0.001, 0.0005, 0.0008]);
    scene.add(mainAsteroid);

    mediumAsteroid1 = createAsteroid(-12, 8, -10, 2.5, [0.002, 0.001, 0.0015]);
    scene.add(mediumAsteroid1);

    mediumAsteroid2 = createAsteroid(10, -6, 8, 2.5, [0.0008, 0.0012, 0.001]);
    scene.add(mediumAsteroid2);

    miningBarge = new THREE.Group();
    var bargeHull = new THREE.BoxGeometry(5, 3, 8);
    geometries.push(bargeHull);
    var bargeMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5568 });
    materials.push(bargeMaterial);
    var bargeHullMesh = new THREE.Mesh(bargeHull, bargeMaterial);
    bargeHullMesh.castShadow = true;
    bargeHullMesh.receiveShadow = true;
    miningBarge.add(bargeHullMesh);
    meshes.push(bargeHullMesh);

    var drumGeometry = new THREE.CylinderGeometry(1.5, 1.5, 4, 16);
    geometries.push(drumGeometry);
    var drumMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    materials.push(drumMaterial);
    var drumMesh = new THREE.Mesh(drumGeometry, drumMaterial);
    drumMesh.rotation.z = Math.PI / 2;
    drumMesh.castShadow = true;
    miningBarge.add(drumMesh);
    meshes.push(drumMesh);

    miningBarge.position.set(18, 5, 5);
    miningBarge.userData.rotationAxes = [0, 0, 0];
    scene.add(miningBarge);

    miningLaser = new THREE.Group();
    var laserArm = new THREE.BoxGeometry(0.4, 0.4, 6);
    geometries.push(laserArm);
    var laserMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    materials.push(laserMaterial);
    var laserArmMesh = new THREE.Mesh(laserArm, laserMaterial);
    laserArmMesh.position.z = 3;
    miningLaser.add(laserArmMesh);
    meshes.push(laserArmMesh);

    var laserTip = new THREE.SphereGeometry(0.6, 8, 8);
    geometries.push(laserTip);
    var tipMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 });
    materials.push(tipMaterial);
    var tipMesh = new THREE.Mesh(laserTip, tipMaterial);
    tipMesh.position.z = 6.5;
    tipMesh.castShadow = true;
    miningLaser.add(tipMesh);
    meshes.push(tipMesh);

    miningLaser.position.set(-8, 3, 0);
    scene.add(miningLaser);

    oreHopper = new THREE.Group();
    var hopperWide = new THREE.BoxGeometry(3, 1, 3);
    geometries.push(hopperWide);
    var hopperMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    materials.push(hopperMaterial);
    var hopperWideMesh = new THREE.Mesh(hopperWide, hopperMaterial);
    hopperWideMesh.position.y = 1;
    hopperWideMesh.castShadow = true;
    oreHopper.add(hopperWideMesh);
    meshes.push(hopperWideMesh);

    var hopperNarrow = new THREE.BoxGeometry(1.5, 2, 1.5);
    geometries.push(hopperNarrow);
    var hopperNarrowMesh = new THREE.Mesh(hopperNarrow, hopperMaterial);
    hopperNarrowMesh.position.y = -1;
    hopperNarrowMesh.castShadow = true;
    oreHopper.add(hopperNarrowMesh);
    meshes.push(hopperNarrowMesh);

    oreHopper.position.set(-18, 5, 0);
    scene.add(oreHopper);

    raiderShip1 = new THREE.Group();
    var raiderBody = new THREE.BoxGeometry(2, 1.5, 5);
    geometries.push(raiderBody);
    var raiderMaterial = new THREE.MeshStandardMaterial({ color: 0x661111 });
    materials.push(raiderMaterial);
    var raiderBodyMesh = new THREE.Mesh(raiderBody, raiderMaterial);
    raiderBodyMesh.castShadow = true;
    raiderShip1.add(raiderBodyMesh);
    meshes.push(raiderBodyMesh);

    var enginePod1 = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
    geometries.push(enginePod1);
    var engineMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600 });
    materials.push(engineMaterial);
    var engineMesh1 = new THREE.Mesh(enginePod1, engineMaterial);
    engineMesh1.position.set(-1, -1, 0);
    engineMesh1.rotation.z = Math.PI / 2;
    engineMesh1.castShadow = true;
    raiderShip1.add(engineMesh1);
    meshes.push(engineMesh1);

    var engineMesh2 = new THREE.Mesh(enginePod1, engineMaterial);
    engineMesh2.position.set(1, -1, 0);
    engineMesh2.rotation.z = Math.PI / 2;
    engineMesh2.castShadow = true;
    raiderShip1.add(engineMesh2);
    meshes.push(engineMesh2);

    raiderShip1.position.set(-25, 10, -20);
    raiderShip1.userData.velocity = new THREE.Vector3(0.3, -0.1, 0.25);
    scene.add(raiderShip1);

    raiderShip2 = new THREE.Group();
    var raiderBodyMesh2 = new THREE.Mesh(raiderBody, raiderMaterial);
    raiderBodyMesh2.castShadow = true;
    raiderShip2.add(raiderBodyMesh2);
    meshes.push(raiderBodyMesh2);

    var engineMesh3 = new THREE.Mesh(enginePod1, engineMaterial);
    engineMesh3.position.set(-1, -1, 0);
    engineMesh3.rotation.z = Math.PI / 2;
    engineMesh3.castShadow = true;
    raiderShip2.add(engineMesh3);
    meshes.push(engineMesh3);

    var engineMesh4 = new THREE.Mesh(enginePod1, engineMaterial);
    engineMesh4.position.set(1, -1, 0);
    engineMesh4.rotation.z = Math.PI / 2;
    engineMesh4.castShadow = true;
    raiderShip2.add(engineMesh4);
    meshes.push(engineMesh4);

    raiderShip2.position.set(25, 15, 20);
    raiderShip2.userData.velocity = new THREE.Vector3(-0.25, -0.15, -0.3);
    scene.add(raiderShip2);

    miningDrone1 = new THREE.Group();
    var droneBody = new THREE.BoxGeometry(0.8, 0.8, 1.2);
    geometries.push(droneBody);
    var droneMaterial = new THREE.MeshStandardMaterial({ color: 0x00aa00 });
    materials.push(droneMaterial);
    var droneMesh1 = new THREE.Mesh(droneBody, droneMaterial);
    droneMesh1.castShadow = true;
    miningDrone1.add(droneMesh1);
    meshes.push(droneMesh1);

    var rotor1 = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 8);
    geometries.push(rotor1);
    var rotorMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    materials.push(rotorMaterial);
    var rotorMesh1a = new THREE.Mesh(rotor1, rotorMaterial);
    rotorMesh1a.position.set(-0.5, 0.8, 0);
    miningDrone1.add(rotorMesh1a);
    meshes.push(rotorMesh1a);

    var rotorMesh1b = new THREE.Mesh(rotor1, rotorMaterial);
    rotorMesh1b.position.set(0.5, 0.8, 0);
    miningDrone1.add(rotorMesh1b);
    meshes.push(rotorMesh1b);

    miningDrone1.position.set(-5, 8, -8);
    miningDrone1.userData.orbitAngle = 0;
    miningDrone1.userData.orbitRadius = 12;
    miningDrone1.userData.orbitSpeed = 0.01;
    scene.add(miningDrone1);

    miningDrone2 = new THREE.Group();
    var droneMesh2 = new THREE.Mesh(droneBody, droneMaterial);
    droneMesh2.castShadow = true;
    miningDrone2.add(droneMesh2);
    meshes.push(droneMesh2);

    var rotorMesh2a = new THREE.Mesh(rotor1, rotorMaterial);
    rotorMesh2a.position.set(-0.5, 0.8, 0);
    miningDrone2.add(rotorMesh2a);
    meshes.push(rotorMesh2a);

    var rotorMesh2b = new THREE.Mesh(rotor1, rotorMaterial);
    rotorMesh2b.position.set(0.5, 0.8, 0);
    miningDrone2.add(rotorMesh2b);
    meshes.push(rotorMesh2b);

    miningDrone2.position.set(5, 8, 8);
    miningDrone2.userData.orbitAngle = Math.PI;
    miningDrone2.userData.orbitRadius = 12;
    miningDrone2.userData.orbitSpeed = 0.01;
    scene.add(miningDrone2);

    solarPanels = new THREE.Group();
    var panelFrame = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
    geometries.push(panelFrame);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    materials.push(frameMaterial);
    var frameMesh = new THREE.Mesh(panelFrame, frameMaterial);
    frameMesh.rotation.z = Math.PI / 2;
    solarPanels.add(frameMesh);
    meshes.push(frameMesh);

    var panelGeometry = new THREE.BoxGeometry(6, 0.1, 3);
    geometries.push(panelGeometry);
    var panelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
    materials.push(panelMaterial);
    var panelMesh1 = new THREE.Mesh(panelGeometry, panelMaterial);
    panelMesh1.position.set(0, 2, 0);
    panelMesh1.castShadow = true;
    solarPanels.add(panelMesh1);
    meshes.push(panelMesh1);

    var panelMesh2 = new THREE.Mesh(panelGeometry, panelMaterial);
    panelMesh2.position.set(0, -2, 0);
    panelMesh2.castShadow = true;
    solarPanels.add(panelMesh2);
    meshes.push(panelMesh2);

    solarPanels.position.set(20, 12, -15);
    scene.add(solarPanels);

    escapePod = new THREE.Group();
    var podGeometry = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 8);
    geometries.push(podGeometry);
    var podMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    materials.push(podMaterial);
    var podMesh = new THREE.Mesh(podGeometry, podMaterial);
    podMesh.castShadow = true;
    escapePod.add(podMesh);
    meshes.push(podMesh);

    escapePod.position.set(-20, 12, 15);
    scene.add(escapePod);

    for (var i = 0; i < 20; i++) {
      var debrisType = Math.random() > 0.5 ? 'box' : 'sphere';
      var debrisX = (Math.random() - 0.5) * 50;
      var debrisY = (Math.random() - 0.5) * 30;
      var debrisZ = (Math.random() - 0.5) * 50;
      var debrisSize = 0.3 + Math.random() * 0.5;

      var debrisGeometry, debrisMaterial, debrisMesh;
      if (debrisType === 'box') {
        debrisGeometry = new THREE.BoxGeometry(debrisSize, debrisSize, debrisSize);
      } else {
        debrisGeometry = new THREE.SphereGeometry(debrisSize / 2, 4, 4);
      }
      geometries.push(debrisGeometry);
      debrisMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
      materials.push(debrisMaterial);
      debrisMesh = new THREE.Mesh(debrisGeometry, debrisMaterial);
      debrisMesh.position.set(debrisX, debrisY, debrisZ);
      debrisMesh.castShadow = true;
      scene.add(debrisMesh);
      debrisField.push(debrisMesh);
      meshes.push(debrisMesh);
    }

    commRelay = new THREE.Group();
    var relayBase = new THREE.CylinderGeometry(0.8, 0.8, 3, 8);
    geometries.push(relayBase);
    var relayMaterial = new THREE.MeshStandardMaterial({ color: 0x0066ff });
    materials.push(relayMaterial);
    var relayBaseMesh = new THREE.Mesh(relayBase, relayMaterial);
    relayBaseMesh.castShadow = true;
    commRelay.add(relayBaseMesh);
    meshes.push(relayBaseMesh);

    var antennaPoints = [
      new THREE.Vector3(0, 2, 0),
      new THREE.Vector3(0, 5, 0)
    ];
    var antennaGeometry = new THREE.BufferGeometry().setFromPoints(antennaPoints);
    var antennaLine = new THREE.LineSegments(
      antennaGeometry,
      new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 })
    );
    commRelay.add(antennaLine);

    commRelay.position.set(0, -10, 25);
    scene.add(commRelay);

    plasmaCannon = new THREE.Group();
    var cannonBase = new THREE.BoxGeometry(2, 2, 2);
    geometries.push(cannonBase);
    var cannonMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    materials.push(cannonMaterial);
    var cannonBaseMesh = new THREE.Mesh(cannonBase, cannonMaterial);
    cannonBaseMesh.castShadow = true;
    plasmaCannon.add(cannonBaseMesh);
    meshes.push(cannonBaseMesh);

    var barrelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 4, 8);
    geometries.push(barrelGeometry);
    var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    materials.push(barrelMaterial);
    var barrelMesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrelMesh.position.z = 3;
    barrelMesh.rotation.x = Math.PI / 2;
    barrelMesh.castShadow = true;
    plasmaCannon.add(barrelMesh);
    meshes.push(barrelMesh);

    plasmaCannon.position.set(-15, -5, -15);
    plasmaCannon.userData.trackAngle = 0;
    scene.add(plasmaCannon);

    shieldGenerator = new THREE.Group();
    var shieldGeometry = new THREE.SphereGeometry(3, 16, 16);
    geometries.push(shieldGeometry);
    var shieldMaterial = new THREE.MeshStandardMaterial({
      color: 0x0099ff,
      emissive: 0x0099ff,
      emissiveIntensity: 0.3,
      wireframe: true
    });
    materials.push(shieldMaterial);
    var shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
    shieldMesh.castShadow = true;
    shieldGenerator.add(shieldMesh);
    meshes.push(shieldMesh);

    shieldGenerator.position.set(18, -8, -10);
    shieldGenerator.userData.pulsePhase = 0;
    scene.add(shieldGenerator);

    document.addEventListener('keydown', handleKeyDown);

    updateHUD();
    animate();
  }

  function handleKeyDown(event) {
    if (event.key === 'a' || event.key === 'A') {
      var now = Date.now();
      if (now - lastAKeyTime < 400) {
        hudVisible = !hudVisible;
      }
      lastAKeyTime = now;
    }
    if (event.key === 'f' || event.key === 'F') {
      var now = Date.now();
      if (now - lastAKeyTime < 400) {
        hudVisible = !hudVisible;
      }
      lastAKeyTime = now;
    }
  }

  function updateHUD() {
    if (!hudCanvas) return;
    var ctx = hudCanvas.getContext('2d');
    ctx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);

    if (!hudVisible) return;

    ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.font = '18px monospace';
    ctx.fillText('ORE COLLECTED: ' + oreCollected + '/5 LOADS', 20, 30);
    ctx.fillText('RAIDERS DESTROYED: ' + raidersDestroyed + '/2', 20, 60);
    ctx.fillText('BARGE INTEGRITY: ' + bargeIntegrity + '%', 20, 90);
  }

  function animate() {
    animationIds.push(requestAnimationFrame(animate));

    if (mainAsteroid) {
      mainAsteroid.rotation.x += mainAsteroid.userData.rotationAxes[0];
      mainAsteroid.rotation.y += mainAsteroid.userData.rotationAxes[1];
      mainAsteroid.rotation.z += mainAsteroid.userData.rotationAxes[2];
    }

    if (mediumAsteroid1) {
      mediumAsteroid1.rotation.x += mediumAsteroid1.userData.rotationAxes[0];
      mediumAsteroid1.rotation.y += mediumAsteroid1.userData.rotationAxes[1];
      mediumAsteroid1.rotation.z += mediumAsteroid1.userData.rotationAxes[2];
    }

    if (mediumAsteroid2) {
      mediumAsteroid2.rotation.x += mediumAsteroid2.userData.rotationAxes[0];
      mediumAsteroid2.rotation.y += mediumAsteroid2.userData.rotationAxes[1];
      mediumAsteroid2.rotation.z += mediumAsteroid2.userData.rotationAxes[2];
    }

    if (miningDrone1 && miningDrone1.userData.orbitAngle !== undefined) {
      miningDrone1.userData.orbitAngle += miningDrone1.userData.orbitSpeed;
      miningDrone1.position.x = Math.cos(miningDrone1.userData.orbitAngle) * miningDrone1.userData.orbitRadius;
      miningDrone1.position.z = Math.sin(miningDrone1.userData.orbitAngle) * miningDrone1.userData.orbitRadius;
    }

    if (miningDrone2 && miningDrone2.userData.orbitAngle !== undefined) {
      miningDrone2.userData.orbitAngle += miningDrone2.userData.orbitSpeed;
      miningDrone2.position.x = Math.cos(miningDrone2.userData.orbitAngle) * miningDrone2.userData.orbitRadius;
      miningDrone2.position.z = Math.sin(miningDrone2.userData.orbitAngle) * miningDrone2.userData.orbitRadius;
    }

    if (raiderShip1 && raiderShip1.userData.velocity) {
      raiderShip1.position.add(raiderShip1.userData.velocity);
      raiderShip1.lookAt(
        raiderShip1.position.x - raiderShip1.userData.velocity.x,
        raiderShip1.position.y - raiderShip1.userData.velocity.y,
        raiderShip1.position.z - raiderShip1.userData.velocity.z
      );
    }

    if (raiderShip2 && raiderShip2.userData.velocity) {
      raiderShip2.position.add(raiderShip2.userData.velocity);
      raiderShip2.lookAt(
        raiderShip2.position.x - raiderShip2.userData.velocity.x,
        raiderShip2.position.y - raiderShip2.userData.velocity.y,
        raiderShip2.position.z - raiderShip2.userData.velocity.z
      );
    }

    if (miningLaser && miningLaser.children.length > 1) {
      var tipChild = miningLaser.children[1];
      var pulseIntensity = 0.3 + Math.sin(Date.now() * 0.005) * 0.3;
      tipChild.material.emissiveIntensity = pulseIntensity;
    }

    if (plasmaCannon) {
      plasmaCannon.userData.trackAngle += 0.01;
      plasmaCannon.rotation.y = plasmaCannon.userData.trackAngle;
    }

    if (shieldGenerator) {
      shieldGenerator.userData.pulsePhase += 0.03;
      var pulseScale = 1 + Math.sin(shieldGenerator.userData.pulsePhase) * 0.1;
      shieldGenerator.scale.set(pulseScale, pulseScale, pulseScale);
      if (shieldGenerator.children[0] && shieldGenerator.children[0].material) {
        shieldGenerator.children[0].material.emissiveIntensity = 0.3 + Math.sin(shieldGenerator.userData.pulsePhase) * 0.2;
      }
    }

    renderer.render(scene, camera);
    updateHUD();
  }

  function reset() {
    document.removeEventListener('keydown', handleKeyDown);

    for (var i = 0; i < animationIds.length; i++) {
      cancelAnimationFrame(animationIds[i]);
    }
    animationIds = [];

    for (var i = 0; i < geometries.length; i++) {
      geometries[i].dispose();
    }
    geometries = [];

    for (var i = 0; i < materials.length; i++) {
      materials[i].dispose();
    }
    materials = [];

    if (renderer) {
      renderer.dispose();
    }

    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    if (hudCanvas && hudCanvas.parentNode) {
      hudCanvas.parentNode.removeChild(hudCanvas);
    }

    scene = null;
    camera = null;
    renderer = null;
    canvas = null;
    hudCanvas = null;
    mainAsteroid = null;
    mediumAsteroid1 = null;
    mediumAsteroid2 = null;
    miningBarge = null;
    miningLaser = null;
    oreHopper = null;
    raiderShip1 = null;
    raiderShip2 = null;
    miningDrone1 = null;
    miningDrone2 = null;
    solarPanels = null;
    escapePod = null;
    debrisField = [];
    commRelay = null;
    plasmaCannon = null;
    shieldGenerator = null;
    meshes = [];

    oreCollected = 0;
    raidersDestroyed = 0;
    bargeIntegrity = 100;
  }

  return {
    init: init,
    update: animate,
    reset: reset
  };
}());
