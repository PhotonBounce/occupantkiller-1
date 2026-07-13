window.MagmaCore = (function() {
  'use strict';

  var scene, camera;
  var drillTowerRotation = 0;
  var lavaFlowPhase = 0;
  var objects = [];

  function createMaterial(color, emissive, emissiveIntensity) {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive || 0x000000,
      emissiveIntensity: emissiveIntensity || 0,
      metalness: 0.4,
      roughness: 0.6
    });
  }

  function buildDrillingRig() {
    var group = new THREE.Group();
    var steelMat = createMaterial(0x333333, 0x000000, 0);
    var warningMat = createMaterial(0xFFAA00, 0xFF8800, 0.3);

    var towerGeo = new THREE.CylinderGeometry(8, 8, 60, 16);
    var tower = new THREE.Mesh(towerGeo, steelMat);
    tower.position.y = 30;
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    var crossBeamGeo = new THREE.BoxGeometry(40, 3, 3);
    var crossBeam1 = new THREE.Mesh(crossBeamGeo, warningMat);
    crossBeam1.position.set(0, 50, 0);
    crossBeam1.castShadow = true;
    group.add(crossBeam1);

    var crossBeam2 = new THREE.Mesh(crossBeamGeo, warningMat);
    crossBeam2.position.set(0, 40, 0);
    crossBeam2.rotation.z = Math.PI / 4;
    crossBeam2.castShadow = true;
    group.add(crossBeam2);

    var boreHeadCone = new THREE.ConeGeometry(6, 15, 16);
    var boreHeadConeMesh = new THREE.Mesh(boreHeadCone, createMaterial(0x444444, 0x000000, 0));
    boreHeadConeMesh.position.y = -10;
    boreHeadConeMesh.castShadow = true;
    group.add(boreHeadConeMesh);

    var boreHeadCyl = new THREE.CylinderGeometry(6, 6, 8, 16);
    var boreHeadCylMesh = new THREE.Mesh(boreHeadCyl, steelMat);
    boreHeadCylMesh.position.y = -17;
    boreHeadCylMesh.castShadow = true;
    group.add(boreHeadCylMesh);

    group.position.set(0, 5, 0);
    objects.push(group);
    return group;
  }

  function buildSuspendedPlatforms() {
    var group = new THREE.Group();
    var platformMat = createMaterial(0x222222, 0xFF4400, 0.4);

    for (var i = 0; i < 3; i++) {
      var platformGeo = new THREE.BoxGeometry(30, 2, 25);
      var platform = new THREE.Mesh(platformGeo, platformMat);
      platform.position.set(-40 + i * 40, 20 - i * 15, 0);
      platform.castShadow = true;
      platform.receiveShadow = true;
      group.add(platform);
    }

    objects.push(group);
    return group;
  }

  function buildMagmaLakes() {
    var group = new THREE.Group();
    var lavaMat = createMaterial(0xFF3300, 0xFF6600, 0.8);

    var lakeGeo = new THREE.BoxGeometry(50, 1, 50);
    var lake1 = new THREE.Mesh(lakeGeo, lavaMat);
    lake1.position.set(-30, -40, -30);
    lake1.castShadow = true;
    lake1.receiveShadow = true;
    group.add(lake1);

    var lake2 = new THREE.Mesh(lakeGeo, lavaMat);
    lake2.position.set(30, -42, 30);
    lake2.castShadow = true;
    lake2.receiveShadow = true;
    group.add(lake2);

    objects.push(group);
    return group;
  }

  function buildLavaFlows() {
    var group = new THREE.Group();
    var flowMat = createMaterial(0xFF2200, 0xFF5500, 0.9);

    for (var i = 0; i < 12; i++) {
      var sphereGeo = new THREE.SphereGeometry(2, 8, 8);
      var sphere = new THREE.Mesh(sphereGeo, flowMat);
      var x = Math.cos((i / 12) * Math.PI * 2) * 45;
      var z = Math.sin((i / 12) * Math.PI * 2) * 45;
      sphere.position.set(x, -30 + i * 2, z);
      sphere.castShadow = true;
      group.add(sphere);
    }

    objects.push(group);
    return group;
  }

  function buildCoolingPipes() {
    var group = new THREE.Group();
    var pipeMat = createMaterial(0x0088FF, 0x0044FF, 0.3);

    var wallX = [-50, 50];
    var wallZ = [-50, 50];

    wallX.forEach(function(x) {
      for (var y = -30; y < 30; y += 10) {
        var pipeGeo = new THREE.CylinderGeometry(1.5, 1.5, 40, 8);
        var pipe = new THREE.Mesh(pipeGeo, pipeMat);
        pipe.position.set(x, y, 0);
        pipe.rotation.z = Math.PI / 2;
        pipe.castShadow = true;
        group.add(pipe);
      }
    });

    objects.push(group);
    return group;
  }

  function buildEvacuationPods() {
    var group = new THREE.Group();
    var podMat = createMaterial(0xFF9900, 0xFF6600, 0.5);

    var positions = [
      [-35, 35, -35],
      [35, 35, -35],
      [-35, 35, 35],
      [35, 35, 35]
    ];

    positions.forEach(function(pos) {
      var podGeo = new THREE.SphereGeometry(3, 12, 12);
      var pod = new THREE.Mesh(podGeo, podMat);
      pod.position.set(pos[0], pos[1], pos[2]);
      pod.castShadow = true;
      group.add(pod);
    });

    objects.push(group);
    return group;
  }

  function buildHeatShields() {
    var group = new THREE.Group();
    var shieldMat = createMaterial(0xCCCCCC, 0x000000, 0);

    for (var i = 0; i < 8; i++) {
      var shieldGeo = new THREE.BoxGeometry(15, 20, 1);
      var shield = new THREE.Mesh(shieldGeo, shieldMat);
      var angle = (i / 8) * Math.PI * 2;
      var radius = 48;
      shield.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
      shield.rotation.y = angle;
      shield.castShadow = true;
      group.add(shield);
    }

    objects.push(group);
    return group;
  }

  function buildEnvironment() {
    var envGroup = new THREE.Group();

    var floorGeo = new THREE.BoxGeometry(100, 1, 100);
    var floorMat = createMaterial(0x1a1a1a, 0x000000, 0);
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -50;
    floor.castShadow = true;
    floor.receiveShadow = true;
    envGroup.add(floor);

    var ceilingGeo = new THREE.BoxGeometry(100, 1, 100);
    var ceilingMat = createMaterial(0x222222, 0x000000, 0);
    var ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.y = 60;
    ceiling.castShadow = true;
    ceiling.receiveShadow = true;
    envGroup.add(ceiling);

    objects.push(envGroup);
    return envGroup;
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];

    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.3);
    scene.add(ambientLight);

    var pointLight1 = new THREE.PointLight(0xFF6600, 2, 200);
    pointLight1.position.set(-30, -35, -30);
    pointLight1.castShadow = true;
    scene.add(pointLight1);

    var pointLight2 = new THREE.PointLight(0xFF6600, 2, 200);
    pointLight2.position.set(30, -35, 30);
    pointLight2.castShadow = true;
    scene.add(pointLight2);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(40, 40, 40);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    buildEnvironment();
    buildDrillingRig();
    buildSuspendedPlatforms();
    buildMagmaLakes();
    buildLavaFlows();
    buildCoolingPipes();
    buildEvacuationPods();
    buildHeatShields();

    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 150, 300);
  }

  function update(delta) {
    drillTowerRotation += delta * 0.3;
    lavaFlowPhase += delta;

    objects.forEach(function(obj) {
      if (obj.children && obj.children.length > 0) {
        if (obj.children[0].geometry instanceof THREE.ConeGeometry) {
          obj.rotation.y = drillTowerRotation;
        }
      }

      obj.children.forEach(function(child) {
        if (child.geometry instanceof THREE.SphereGeometry && child.material.emissiveIntensity > 0.5) {
          child.position.y += Math.sin(lavaFlowPhase * 2 + child.position.x) * delta * 2;
        }
      });
    });
  }

  function reset() {
    drillTowerRotation = 0;
    lavaFlowPhase = 0;
    objects.forEach(function(obj) {
      scene.remove(obj);
    });
    objects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
