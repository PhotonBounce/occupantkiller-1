window.OrbitalWeapons = (function() {
  'use strict';

  var scene = null;
  var objects = [];
  var platformGroup = null;
  var railgunGroup = null;
  var targetingGroup = null;
  var laserGroup = null;
  var engineGroup = null;
  var satelliteGroup = null;
  var commsGroup = null;
  var warphdGroup = null;
  var controlGroup = null;
  var crewGroup = null;
  var medicalGroup = null;
  var escapeGroup = null;
  var shieldGroup = null;
  var viewportGroup = null;

  var animationState = {
    railgunCharge: 0,
    laserPulse: 0,
    engineThrust: 0,
    targetingFlicker: 0,
    platformRotation: 0
  };

  function createBoxMesh(width, height, depth, color, emissive) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.7,
      roughness: 0.3
    });
    if (emissive !== undefined) {
      material.emissive = new THREE.Color(emissive);
      material.emissiveIntensity = 0;
    }
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  function createCylinderMesh(radiusTop, radiusBottom, height, segments, color, emissive) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
    var material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.7,
      roughness: 0.3
    });
    if (emissive !== undefined) {
      material.emissive = new THREE.Color(emissive);
      material.emissiveIntensity = 0;
    }
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  function createSphereMesh(radius, widthSegments, heightSegments, color, emissive) {
    var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    var material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.7,
      roughness: 0.3
    });
    if (emissive !== undefined) {
      material.emissive = new THREE.Color(emissive);
      material.emissiveIntensity = 0;
    }
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  function createConeMesh(radius, height, segments, color) {
    var geometry = new THREE.ConeGeometry(radius, height, segments);
    var material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.6,
      roughness: 0.4
    });
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  function buildPlatformHull() {
    platformGroup = new THREE.Group();

    var mainHull = createBoxMesh(80, 15, 60, 0x333344);
    mainHull.position.y = 0;
    platformGroup.add(mainHull);
    objects.push(mainHull);

    var solarWingLeft = createBoxMesh(50, 2, 80, 0x4455AA);
    solarWingLeft.position.set(-50, 2, 0);
    platformGroup.add(solarWingLeft);
    objects.push(solarWingLeft);

    var solarWingRight = createBoxMesh(50, 2, 80, 0x4455AA);
    solarWingRight.position.set(50, 2, 0);
    platformGroup.add(solarWingRight);
    objects.push(solarWingRight);

    scene.add(platformGroup);
  }

  function buildRailgun() {
    railgunGroup = new THREE.Group();
    railgunGroup.position.set(0, 8, 35);

    var barrelBase = createCylinderMesh(4, 4, 15, 16, 0x444455);
    barrelBase.rotation.z = Math.PI / 2;
    railgunGroup.add(barrelBase);
    objects.push(barrelBase);

    var barrelExtension = createCylinderMesh(3.5, 3.5, 45, 16, 0x555566);
    barrelExtension.position.z = 30;
    barrelExtension.rotation.z = Math.PI / 2;
    railgunGroup.add(barrelExtension);
    objects.push(barrelExtension);

    var chargingCoil = createCylinderMesh(5, 5, 8, 16, 0x444455, 0xFF6600);
    chargingCoil.position.y = 8;
    railgunGroup.add(chargingCoil);
    objects.push(chargingCoil);

    scene.add(railgunGroup);
  }

  function buildTargetingComputer() {
    targetingGroup = new THREE.Group();
    targetingGroup.position.set(-25, 5, -20);

    var mainRoom = createBoxMesh(20, 12, 15, 0x334455);
    targetingGroup.add(mainRoom);
    objects.push(mainRoom);

    var screenLeft = createBoxMesh(8, 8, 1, 0x001144, 0x0088FF);
    screenLeft.position.set(-6, 2, 8);
    targetingGroup.add(screenLeft);
    objects.push(screenLeft);

    var screenCenter = createBoxMesh(8, 8, 1, 0x001144, 0x0088FF);
    screenCenter.position.set(0, 2, 8);
    targetingGroup.add(screenCenter);
    objects.push(screenCenter);

    var screenRight = createBoxMesh(8, 8, 1, 0x001144, 0x0088FF);
    screenRight.position.set(6, 2, 8);
    targetingGroup.add(screenRight);
    objects.push(screenRight);

    scene.add(targetingGroup);
  }

  function buildLaserCannon() {
    laserGroup = new THREE.Group();
    laserGroup.position.set(20, 12, 30);

    var barrel1 = createCylinderMesh(2, 2, 20, 12, 0x555566, 0x00FF00);
    barrel1.position.set(-8, 0, 0);
    barrel1.rotation.z = Math.PI / 2;
    laserGroup.add(barrel1);
    objects.push(barrel1);

    var barrel2 = createCylinderMesh(2, 2, 20, 12, 0x555566, 0x00FF00);
    barrel2.position.set(0, 0, 0);
    barrel2.rotation.z = Math.PI / 2;
    laserGroup.add(barrel2);
    objects.push(barrel2);

    var barrel3 = createCylinderMesh(2, 2, 20, 12, 0x555566, 0x00FF00);
    barrel3.position.set(8, 0, 0);
    barrel3.rotation.z = Math.PI / 2;
    laserGroup.add(barrel3);
    objects.push(barrel3);

    var powerCore = createSphereMesh(4, 8, 8, 0x445555, 0x0088FF);
    powerCore.position.y = 6;
    laserGroup.add(powerCore);
    objects.push(powerCore);

    scene.add(laserGroup);
  }

  function buildNuclearWarheads() {
    warphdGroup = new THREE.Group();
    warphdGroup.position.set(-30, 2, 15);

    var vaultOuter = createBoxMesh(16, 14, 12, 0x553344);
    warphdGroup.add(vaultOuter);
    objects.push(vaultOuter);

    var warhead1 = createCylinderMesh(2.5, 2.5, 8, 12, 0xFF3333);
    warhead1.position.set(-4, -2, 0);
    warhead1.rotation.z = Math.PI / 2.5;
    warphdGroup.add(warhead1);
    objects.push(warhead1);

    var warhead2 = createCylinderMesh(2.5, 2.5, 8, 12, 0xFF3333);
    warhead2.position.set(0, -2, 0);
    warhead2.rotation.z = Math.PI / 2.5;
    warphdGroup.add(warhead2);
    objects.push(warhead2);

    var warhead3 = createCylinderMesh(2.5, 2.5, 8, 12, 0xFF3333);
    warhead3.position.set(4, -2, 0);
    warhead3.rotation.z = Math.PI / 2.5;
    warphdGroup.add(warhead3);
    objects.push(warhead3);

    var lockingMechanism = createBoxMesh(15, 2, 10, 0x333333);
    lockingMechanism.position.y = 8;
    warphdGroup.add(lockingMechanism);
    objects.push(lockingMechanism);

    scene.add(warphdGroup);
  }

  function buildControlBridge() {
    controlGroup = new THREE.Group();
    controlGroup.position.set(0, 15, -25);

    var bridgeWall = createBoxMesh(35, 10, 18, 0x334466);
    controlGroup.add(bridgeWall);
    objects.push(bridgeWall);

    var captainChair = createCylinderMesh(3, 3, 8, 12, 0x554433);
    captainChair.position.set(0, -2, 0);
    controlGroup.add(captainChair);
    objects.push(captainChair);

    var chairBackrest = createBoxMesh(4, 6, 2, 0x665544);
    chairBackrest.position.set(0, 1, -4);
    controlGroup.add(chairBackrest);
    objects.push(chairBackrest);

    var consoleLeft = createBoxMesh(8, 4, 3, 0x334455);
    consoleLeft.position.set(-12, -3, 8);
    controlGroup.add(consoleLeft);
    objects.push(consoleLeft);

    var consoleRight = createBoxMesh(8, 4, 3, 0x334455);
    consoleRight.position.set(12, -3, 8);
    controlGroup.add(consoleRight);
    objects.push(consoleRight);

    scene.add(controlGroup);
  }

  function buildSatelliteDishes() {
    satelliteGroup = new THREE.Group();
    satelliteGroup.position.set(35, 10, -10);

    var pole1 = createCylinderMesh(1.5, 1.5, 25, 8, 0x555566);
    pole1.position.set(-10, 0, 0);
    satelliteGroup.add(pole1);
    objects.push(pole1);

    var dish1 = createBoxMesh(12, 1, 12, 0x555566);
    dish1.position.set(-10, 15, 0);
    dish1.rotation.x = 0.3;
    satelliteGroup.add(dish1);
    objects.push(dish1);

    var pole2 = createCylinderMesh(1.5, 1.5, 25, 8, 0x555566);
    pole2.position.set(0, 0, 0);
    satelliteGroup.add(pole2);
    objects.push(pole2);

    var dish2 = createBoxMesh(12, 1, 12, 0x555566);
    dish2.position.set(0, 15, 0);
    dish2.rotation.x = 0.3;
    satelliteGroup.add(dish2);
    objects.push(dish2);

    var pole3 = createCylinderMesh(1.5, 1.5, 25, 8, 0x555566);
    pole3.position.set(10, 0, 0);
    satelliteGroup.add(pole3);
    objects.push(pole3);

    var dish3 = createBoxMesh(12, 1, 12, 0x555566);
    dish3.position.set(10, 15, 0);
    dish3.rotation.x = 0.3;
    satelliteGroup.add(dish3);
    objects.push(dish3);

    scene.add(satelliteGroup);
  }

  function buildCrewQuarters() {
    crewGroup = new THREE.Group();
    crewGroup.position.set(0, 5, 0);

    var ring = createCylinderMesh(40, 40, 8, 20, 0x334455);
    crewGroup.add(ring);
    objects.push(ring);

    var compartment1 = createBoxMesh(12, 6, 10, 0x334455);
    compartment1.position.set(-30, 0, 0);
    crewGroup.add(compartment1);
    objects.push(compartment1);

    var compartment2 = createBoxMesh(12, 6, 10, 0x334455);
    compartment2.position.set(30, 0, 0);
    crewGroup.add(compartment2);
    objects.push(compartment2);

    var compartment3 = createBoxMesh(12, 6, 10, 0x334455);
    compartment3.position.set(0, 0, -30);
    crewGroup.add(compartment3);
    objects.push(compartment3);

    scene.add(crewGroup);
  }

  function buildEngineNozzles() {
    engineGroup = new THREE.Group();
    engineGroup.position.set(0, 2, -50);

    var nozzle1 = createCylinderMesh(3, 3, 18, 12, 0x445544);
    nozzle1.position.set(-8, 0, 0);
    engineGroup.add(nozzle1);
    objects.push(nozzle1);

    var thrust1 = createSphereMesh(4, 8, 8, 0xFF4400, 0xFF6600);
    thrust1.position.set(-8, -12, 0);
    thrust1.scale.set(1, 1, 1);
    engineGroup.add(thrust1);
    objects.push(thrust1);

    var nozzle2 = createCylinderMesh(3, 3, 18, 12, 0x445544);
    nozzle2.position.set(0, 0, 0);
    engineGroup.add(nozzle2);
    objects.push(nozzle2);

    var thrust2 = createSphereMesh(4, 8, 8, 0xFF4400, 0xFF6600);
    thrust2.position.set(0, -12, 0);
    thrust2.scale.set(1, 1, 1);
    engineGroup.add(thrust2);
    objects.push(thrust2);

    var nozzle3 = createCylinderMesh(3, 3, 18, 12, 0x445544);
    nozzle3.position.set(8, 0, 0);
    engineGroup.add(nozzle3);
    objects.push(nozzle3);

    var thrust3 = createSphereMesh(4, 8, 8, 0xFF4400, 0xFF6600);
    thrust3.position.set(8, -12, 0);
    thrust3.scale.set(1, 1, 1);
    engineGroup.add(thrust3);
    objects.push(thrust3);

    scene.add(engineGroup);
  }

  function buildMedicalBay() {
    medicalGroup = new THREE.Group();
    medicalGroup.position.set(25, 8, 10);

    var bayRoom = createBoxMesh(16, 10, 14, 0x334466);
    medicalGroup.add(bayRoom);
    objects.push(bayRoom);

    var surgicalArm = createCylinderMesh(1.2, 1.2, 14, 8, 0xCCCCCC);
    surgicalArm.position.set(0, 2, 0);
    surgicalArm.rotation.z = Math.PI / 4;
    medicalGroup.add(surgicalArm);
    objects.push(surgicalArm);

    var medicalPod1 = createBoxMesh(6, 4, 8, 0x334466);
    medicalPod1.position.set(-5, -2, -4);
    medicalGroup.add(medicalPod1);
    objects.push(medicalPod1);

    var medicalPod2 = createBoxMesh(6, 4, 8, 0x334466);
    medicalPod2.position.set(5, -2, -4);
    medicalGroup.add(medicalPod2);
    objects.push(medicalPod2);

    scene.add(medicalGroup);
  }

  function buildEscapePods() {
    escapeGroup = new THREE.Group();
    escapeGroup.position.set(-35, 8, 0);

    var pod1 = createCylinderMesh(2.5, 2.5, 8, 10, 0x334455);
    pod1.position.set(-6, 0, 0);
    escapeGroup.add(pod1);
    objects.push(pod1);

    var pod2 = createCylinderMesh(2.5, 2.5, 8, 10, 0x334455);
    pod2.position.set(0, 0, 0);
    escapeGroup.add(pod2);
    objects.push(pod2);

    var pod3 = createCylinderMesh(2.5, 2.5, 8, 10, 0x334455);
    pod3.position.set(6, 0, 0);
    escapeGroup.add(pod3);
    objects.push(pod3);

    var podRack = createBoxMesh(18, 2, 10, 0x444455);
    podRack.position.y = -6;
    escapeGroup.add(podRack);
    objects.push(podRack);

    scene.add(escapeGroup);
  }

  function buildCommsAntenna() {
    commsGroup = new THREE.Group();
    commsGroup.position.set(40, 15, 20);

    var antennaMast = createCylinderMesh(2, 2, 50, 10, 0x555566);
    commsGroup.add(antennaMast);
    objects.push(antennaMast);

    var antennaTop1 = createCylinderMesh(1, 1, 15, 8, 0x555566);
    antennaTop1.position.set(-5, 28, 0);
    antennaTop1.rotation.z = Math.PI / 3;
    commsGroup.add(antennaTop1);
    objects.push(antennaTop1);

    var antennaTop2 = createCylinderMesh(1, 1, 15, 8, 0x555566);
    antennaTop2.position.set(5, 28, 0);
    antennaTop2.rotation.z = -Math.PI / 3;
    commsGroup.add(antennaTop2);
    objects.push(antennaTop2);

    scene.add(commsGroup);
  }

  function buildShield() {
    shieldGroup = new THREE.Group();
    shieldGroup.position.set(0, 0, 0);

    var outerHull = createBoxMesh(95, 25, 75, 0x444455);
    shieldGroup.add(outerHull);
    objects.push(outerHull);

    var damagePanel1 = createBoxMesh(8, 8, 2, 0x333333);
    damagePanel1.position.set(40, 10, 35);
    shieldGroup.add(damagePanel1);
    objects.push(damagePanel1);

    var damagePanel2 = createBoxMesh(8, 8, 2, 0x333333);
    damagePanel2.position.set(-40, -8, -33);
    shieldGroup.add(damagePanel2);
    objects.push(damagePanel2);

    scene.add(shieldGroup);
  }

  function buildViewport() {
    viewportGroup = new THREE.Group();
    viewportGroup.position.set(0, 12, 0);

    var viewportWindow = createBoxMesh(30, 15, 2, 0x000011);
    viewportGroup.add(viewportWindow);
    objects.push(viewportWindow);

    for (var i = 0; i < 20; i++) {
      var starX = (Math.random() - 0.5) * 200;
      var starY = (Math.random() - 0.5) * 200;
      var starZ = -100;
      var starSize = Math.random() * 0.5 + 0.2;
      var star = createSphereMesh(starSize, 4, 4, 0xFFFFFF);
      star.position.set(starX, starY, starZ);
      viewportGroup.add(star);
      objects.push(star);
    }

    scene.add(viewportGroup);
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    objects = [];
    animationState = {
      railgunCharge: 0,
      laserPulse: 0,
      engineThrust: 0,
      targetingFlicker: 0,
      platformRotation: 0
    };

    buildPlatformHull();
    buildRailgun();
    buildTargetingComputer();
    buildLaserCannon();
    buildNuclearWarheads();
    buildControlBridge();
    buildSatelliteDishes();
    buildCrewQuarters();
    buildEngineNozzles();
    buildMedicalBay();
    buildEscapePods();
    buildCommsAntenna();
    buildShield();
    buildViewport();
  }

  function update(delta) {
    if (!scene) return;

    animationState.railgunCharge += delta * 2;
    animationState.laserPulse += delta * 1.5;
    animationState.engineThrust += delta * 1.8;
    animationState.targetingFlicker += delta * 5;
    animationState.platformRotation += delta * 0.05;

    if (platformGroup) {
      platformGroup.rotation.y = animationState.platformRotation;
    }

    if (railgunGroup) {
      var chargeIntensity = Math.sin(animationState.railgunCharge) * 0.5 + 0.5;
      for (var i = 0; i < railgunGroup.children.length; i++) {
        var child = railgunGroup.children[i];
        if (child.material && child.material.emissive !== undefined) {
          child.material.emissiveIntensity = chargeIntensity * 0.8;
        }
      }
    }

    if (laserGroup) {
      var laserIntensity = Math.sin(animationState.laserPulse) * 0.5 + 0.5;
      for (var i = 0; i < laserGroup.children.length; i++) {
        var child = laserGroup.children[i];
        if (child.material && child.material.emissive !== undefined) {
          child.material.emissiveIntensity = laserIntensity * 0.9;
        }
      }
    }

    if (engineGroup) {
      var thrustScale = Math.sin(animationState.engineThrust) * 0.3 + 1;
      var thrustIntensity = Math.sin(animationState.engineThrust) * 0.5 + 0.5;
      for (var i = 0; i < engineGroup.children.length; i++) {
        var child = engineGroup.children[i];
        if (child.geometry instanceof THREE.SphereGeometry) {
          child.scale.y = thrustScale;
          if (child.material && child.material.emissive !== undefined) {
            child.material.emissiveIntensity = thrustIntensity * 0.8;
          }
        }
      }
    }

    if (satelliteGroup) {
      for (var i = 0; i < satelliteGroup.children.length; i++) {
        var child = satelliteGroup.children[i];
        if (child.geometry instanceof THREE.BoxGeometry && child.position.y > 10) {
          child.rotation.y += delta * 0.5;
        }
      }
    }

    if (commsGroup) {
      commsGroup.rotation.y += delta * 0.3;
    }

    if (targetingGroup) {
      var flicker = Math.floor(animationState.targetingFlicker) % 2 === 0;
      for (var i = 0; i < targetingGroup.children.length; i++) {
        var child = targetingGroup.children[i];
        if (child.material && child.material.emissive !== undefined && child.position.z > 0) {
          child.material.emissiveIntensity = flicker ? 0.8 : 0.2;
        }
      }
    }
  }

  function reset() {
    if (!scene) return;

    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        obj.material.dispose();
      }
    }

    if (platformGroup && platformGroup.parent) platformGroup.parent.remove(platformGroup);
    if (railgunGroup && railgunGroup.parent) railgunGroup.parent.remove(railgunGroup);
    if (targetingGroup && targetingGroup.parent) targetingGroup.parent.remove(targetingGroup);
    if (laserGroup && laserGroup.parent) laserGroup.parent.remove(laserGroup);
    if (warphdGroup && warphdGroup.parent) warphdGroup.parent.remove(warphdGroup);
    if (controlGroup && controlGroup.parent) controlGroup.parent.remove(controlGroup);
    if (satelliteGroup && satelliteGroup.parent) satelliteGroup.parent.remove(satelliteGroup);
    if (crewGroup && crewGroup.parent) crewGroup.parent.remove(crewGroup);
    if (engineGroup && engineGroup.parent) engineGroup.parent.remove(engineGroup);
    if (medicalGroup && medicalGroup.parent) medicalGroup.parent.remove(medicalGroup);
    if (escapeGroup && escapeGroup.parent) escapeGroup.parent.remove(escapeGroup);
    if (commsGroup && commsGroup.parent) commsGroup.parent.remove(commsGroup);
    if (shieldGroup && shieldGroup.parent) shieldGroup.parent.remove(shieldGroup);
    if (viewportGroup && viewportGroup.parent) viewportGroup.parent.remove(viewportGroup);

    objects = [];
    platformGroup = null;
    railgunGroup = null;
    targetingGroup = null;
    laserGroup = null;
    warphdGroup = null;
    controlGroup = null;
    satelliteGroup = null;
    crewGroup = null;
    engineGroup = null;
    medicalGroup = null;
    escapeGroup = null;
    commsGroup = null;
    shieldGroup = null;
    viewportGroup = null;
    scene = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
