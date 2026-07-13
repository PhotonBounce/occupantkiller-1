window.RadarDome = (function() {
  'use strict';

  var radarDomeGroup = null;
  var scene = null;
  var radarDish = null;
  var warningLights = [];
  var vaporClouds = [];
  var phaseArrayPanels = [];
  var radarRotationAngle = 0;
  var warningLightBlink = 0;
  var vaporPulse = 0;
  var phaseArrayPulse = 0;
  var coolingTowerVapor = [];

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    radarDomeGroup = new THREE.Group();
    radarDomeGroup.name = 'RadarDome';
    scene.add(radarDomeGroup);

    // Main radome sphere - giant white geodesic dome
    var radomeGeometry = new THREE.SphereGeometry(120, 32, 24);
    var radomeMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0x222222,
      shininess: 20,
      wireframe: false,
      transparent: true,
      opacity: 0.85
    });
    var radomeMesh = new THREE.Mesh(radomeGeometry, radomeMaterial);
    radomeMesh.position.y = 60;
    radomeMesh.castShadow = true;
    radomeMesh.receiveShadow = true;
    radomeDomeGroup.add(radomeMesh);

    // Geodesic dome grid pattern with LineSegments
    var lineGeometry = new THREE.BufferGeometry();
    var linePositions = [];
    var latSegments = 16;
    var lonSegments = 32;
    var radius = 120;
    for (var lat = 0; lat <= latSegments; lat++) {
      var theta = (lat / latSegments) * Math.PI;
      for (var lon = 0; lon < lonSegments; lon++) {
        var phi = (lon / lonSegments) * Math.PI * 2;
        var x = radius * Math.sin(theta) * Math.cos(phi);
        var y = radius * Math.cos(theta);
        var z = radius * Math.sin(theta) * Math.sin(phi);
        linePositions.push(x, y + 60, z);
      }
    }
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    var lineMaterial = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 1 });
    var domeLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    radarDomeGroup.add(domeLines);

    // Main radar dish - rotating phased array inside dome
    var dishPedestalGeometry = new THREE.CylinderGeometry(15, 20, 8, 16);
    var pedestalMaterial = new THREE.MeshPhongMaterial({ color: 0x444444, emissive: 0x111111 });
    var dishPedestal = new THREE.Mesh(dishPedestalGeometry, pedestalMaterial);
    dishPedestal.position.set(0, 15, 0);
    dishPedestal.castShadow = true;
    dishPedestal.receiveShadow = true;
    radarDomeGroup.add(dishPedestal);

    // Dish array panels - rotating group
    radarDish = new THREE.Group();
    radarDish.position.set(0, 25, 0);
    for (var d = 0; d < 12; d++) {
      var panelGeometry = new THREE.BoxGeometry(8, 0.5, 14);
      var panelMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        emissive: 0x0066ff,
        shininess: 100
      });
      var panel = new THREE.Mesh(panelGeometry, panelMaterial);
      var angle = (d / 12) * Math.PI * 2;
      panel.position.set(Math.cos(angle) * 22, 0, Math.sin(angle) * 22);
      panel.rotation.z = angle;
      panel.castShadow = true;
      panel.receiveShadow = true;
      radarDish.add(panel);
    }
    radarDomeGroup.add(radarDish);

    // Support building complex - main operations building
    var buildingGeometry = new THREE.BoxGeometry(60, 35, 40);
    var buildingMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc, emissive: 0x333333 });
    var supportBuilding = new THREE.Mesh(buildingGeometry, buildingMaterial);
    supportBuilding.position.set(-100, 17.5, -80);
    supportBuilding.castShadow = true;
    supportBuilding.receiveShadow = true;
    radarDomeGroup.add(supportBuilding);

    // Building annex
    var annexGeometry = new THREE.BoxGeometry(40, 25, 50);
    var annexMaterial = new THREE.MeshPhongMaterial({ color: 0xb0b0b0, emissive: 0x222222 });
    var annex = new THREE.Mesh(annexGeometry, annexMaterial);
    annex.position.set(-70, 12.5, -140);
    annex.castShadow = true;
    annex.receiveShadow = true;
    radarDomeGroup.add(annex);

    // Cooling towers - large cylindrical structures with vapor
    for (var ct = 0; ct < 3; ct++) {
      var towerGeometry = new THREE.CylinderGeometry(18, 20, 50, 16);
      var towerMaterial = new THREE.MeshPhongMaterial({ color: 0x888888, emissive: 0x222222 });
      var tower = new THREE.Mesh(towerGeometry, towerMaterial);
      tower.position.set(-150 + (ct * 50), 25, 100);
      tower.castShadow = true;
      tower.receiveShadow = true;
      radarDomeGroup.add(tower);
      coolingTowerVapor.push({ tower: tower, position: tower.position.clone(), phase: ct * 1.2 });
    }

    // Vapor puffs above cooling towers
    for (var vp = 0; vp < 9; vp++) {
      var vaporGeometry = new THREE.SphereGeometry(8, 8, 8);
      var vaporMaterial = new THREE.MeshPhongMaterial({
        color: 0xdddddd,
        transparent: true,
        opacity: 0.4,
        emissive: 0x999999
      });
      var vaporCloud = new THREE.Mesh(vaporGeometry, vaporMaterial);
      var towerIdx = Math.floor(vp / 3);
      vaporCloud.position.set(-150 + (towerIdx * 50), 80 + Math.random() * 20, 100 + (Math.random() - 0.5) * 30);
      vaporCloud.scale.set(1 + Math.random() * 0.5, 0.8 + Math.random() * 0.4, 1 + Math.random() * 0.5);
      radarDomeGroup.add(vaporCloud);
      vaporClouds.push({ mesh: vaporCloud, baseY: vaporCloud.position.y, offset: vp });
    }

    // Buried cable trench network
    var trenchGeometry = new THREE.BoxGeometry(8, 1.5, 150);
    var trenchMaterial = new THREE.MeshPhongMaterial({ color: 0x444444, emissive: 0x111111 });
    var trench1 = new THREE.Mesh(trenchGeometry, trenchMaterial);
    trench1.position.set(-40, 0.75, -20);
    trench1.castShadow = true;
    trench1.receiveShadow = true;
    radarDomeGroup.add(trench1);

    var trench2Geometry = new THREE.BoxGeometry(150, 1.5, 8);
    var trench2 = new THREE.Mesh(trench2Geometry, trenchMaterial);
    trench2.position.set(-20, 0.75, -80);
    trench2.castShadow = true;
    trench2.receiveShadow = true;
    radarDomeGroup.add(trench2);

    // Cable visualization in trenches
    var cableGeom = new THREE.BufferGeometry();
    var cablePositions = new Float32Array([
      -40, 1, -20, -40, 1, 100,
      -40, 1.2, -20, -40, 1.2, 100,
      -40, 1.4, -20, -40, 1.4, 100,
      -200, 1, -80, 100, 1, -80
    ]);
    cableGeom.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
    var cableMaterial = new THREE.LineBasicMaterial({ color: 0xff6600, linewidth: 2 });
    var cables = new THREE.LineSegments(cableGeom, cableMaterial);
    radarDomeGroup.add(cables);

    // Perimeter anti-tank ditch
    var ditchGeometry = new THREE.BoxGeometry(400, 3, 400);
    var ditchMaterial = new THREE.MeshPhongMaterial({ color: 0x333333, emissive: 0x0a0a0a });
    var ditch = new THREE.Mesh(ditchGeometry, ditchMaterial);
    ditch.position.set(0, -1.5, 0);
    ditch.receiveShadow = true;
    radarDomeGroup.add(ditch);

    // Guard towers at perimeter corners
    var guardTowerPositions = [
      { x: -200, z: -200 },
      { x: 200, z: -200 },
      { x: -200, z: 200 },
      { x: 200, z: 200 }
    ];
    for (var gt = 0; gt < guardTowerPositions.length; gt++) {
      var towerBaseGeometry = new THREE.BoxGeometry(12, 5, 12);
      var towerBaseMaterial = new THREE.MeshPhongMaterial({ color: 0x666666, emissive: 0x111111 });
      var towerBase = new THREE.Mesh(towerBaseGeometry, towerBaseMaterial);
      towerBase.position.set(guardTowerPositions[gt].x, 2.5, guardTowerPositions[gt].z);
      towerBase.castShadow = true;
      towerBase.receiveShadow = true;
      radarDomeGroup.add(towerBase);

      var towerPoleGeometry = new THREE.CylinderGeometry(1.5, 1.5, 25, 8);
      var towerPoleMaterial = new THREE.MeshPhongMaterial({ color: 0x333333, emissive: 0x000000 });
      var towerPole = new THREE.Mesh(towerPoleGeometry, towerPoleMaterial);
      towerPole.position.set(guardTowerPositions[gt].x, 15, guardTowerPositions[gt].z);
      towerPole.castShadow = true;
      towerPole.receiveShadow = true;
      radarDomeGroup.add(towerPole);

      var platformGeometry = new THREE.BoxGeometry(14, 1, 14);
      var platformMaterial = new THREE.MeshPhongMaterial({ color: 0x555555, emissive: 0x0a0a0a });
      var platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(guardTowerPositions[gt].x, 25, guardTowerPositions[gt].z);
      platform.castShadow = true;
      platform.receiveShadow = true;
      radarDomeGroup.add(platform);

      // Searchlight on platform
      var lightGeometry = new THREE.CylinderGeometry(2, 2, 1, 8);
      var lightMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00, emissive: 0x666600 });
      var searchLight = new THREE.Mesh(lightGeometry, lightMaterial);
      searchLight.position.set(guardTowerPositions[gt].x, 26, guardTowerPositions[gt].z);
      radarDomeGroup.add(searchLight);
    }

    // Vehicle garage - large fortified building
    var garageGeometry = new THREE.BoxGeometry(80, 22, 50);
    var garageMaterial = new THREE.MeshPhongMaterial({ color: 0x8b8b7a, emissive: 0x1a1a14 });
    var garage = new THREE.Mesh(garageGeometry, garageMaterial);
    garage.position.set(120, 11, -100);
    garage.castShadow = true;
    garage.receiveShadow = true;
    radarDomeGroup.add(garage);

    // Generator farm - compound of generators with stacks
    for (var gf = 0; gf < 4; gf++) {
      var genGeometry = new THREE.BoxGeometry(15, 8, 12);
      var genMaterial = new THREE.MeshPhongMaterial({ color: 0x6b6b5b, emissive: 0x0f0f0a });
      var generator = new THREE.Mesh(genGeometry, genMaterial);
      generator.position.set(50 + (gf % 2) * 30, 4, -150 + Math.floor(gf / 2) * 30);
      generator.castShadow = true;
      generator.receiveShadow = true;
      radarDomeGroup.add(generator);

      // Exhaust stack
      var stackGeometry = new THREE.CylinderGeometry(2.5, 3, 15, 8);
      var stackMaterial = new THREE.MeshPhongMaterial({ color: 0x3a3a3a, emissive: 0x050505 });
      var stack = new THREE.Mesh(stackGeometry, stackMaterial);
      stack.position.set(50 + (gf % 2) * 30, 15, -150 + Math.floor(gf / 2) * 30);
      stack.castShadow = true;
      stack.receiveShadow = true;
      radarDomeGroup.add(stack);
    }

    // Fire suppression foam system - overhead pipes and heads
    var pipeGeometry = new THREE.CylinderGeometry(0.8, 0.8, 60, 6);
    var pipeMaterial = new THREE.MeshPhongMaterial({ color: 0xc0c0c0, emissive: 0x303030 });
    var pipe1 = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe1.rotation.z = Math.PI / 2;
    pipe1.position.set(-50, 35, -80);
    pipe1.castShadow = true;
    radarDomeGroup.add(pipe1);

    // Foam dispersion heads
    for (var fd = 0; fd < 6; fd++) {
      var foamHeadGeometry = new THREE.SphereGeometry(3, 8, 8);
      var foamHeadMaterial = new THREE.MeshPhongMaterial({ color: 0xffff99, emissive: 0x666633 });
      var foamHead = new THREE.Mesh(foamHeadGeometry, foamHeadMaterial);
      foamHead.position.set(-80 + (fd * 20), 35, -80);
      foamHead.castShadow = true;
      radarDomeGroup.add(foamHead);
    }

    // Blast-hardened entry - thick concrete bunker door
    var doorFrameGeometry = new THREE.BoxGeometry(14, 18, 2);
    var doorMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a, emissive: 0x0f0f0f });
    var doorFrame = new THREE.Mesh(doorFrameGeometry, doorMaterial);
    doorFrame.position.set(-100, 9, -45);
    doorFrame.castShadow = true;
    doorFrame.receiveShadow = true;
    radarDomeGroup.add(doorFrame);

    var doorGeometry = new THREE.BoxGeometry(12, 16, 1);
    var doorColorMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a, emissive: 0x0a0a0a });
    var door = new THREE.Mesh(doorGeometry, doorColorMaterial);
    door.position.set(-100, 9, -44);
    door.castShadow = true;
    radarDomeGroup.add(door);

    // Underground cable vault passage - reinforced tunnel
    var vaultGeometry = new THREE.BoxGeometry(20, 12, 80);
    var vaultMaterial = new THREE.MeshPhongMaterial({ color: 0x5a5a4a, emissive: 0x0d0d0a });
    var vault = new THREE.Mesh(vaultGeometry, vaultMaterial);
    vault.position.set(0, -7, 150);
    vault.receiveShadow = true;
    radarDomeGroup.add(vault);

    // Phased array panel sections - emissive panels at dome base
    var arrayGroup = new THREE.Group();
    arrayGroup.position.set(0, 0, 0);
    for (var ap = 0; ap < 32; ap++) {
      var panelSegGeometry = new THREE.BoxGeometry(12, 0.3, 12);
      var panelSegMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a3a4a,
        emissive: 0x0066cc,
        shininess: 150
      });
      var panelSegment = new THREE.Mesh(panelSegGeometry, panelSegMaterial);
      var angle = (ap / 32) * Math.PI * 2;
      var radius = 95;
      panelSegment.position.set(
        Math.cos(angle) * radius,
        5,
        Math.sin(angle) * radius
      );
      panelSegment.rotation.y = angle;
      panelSegment.castShadow = true;
      panelSegment.receiveShadow = true;
      arrayGroup.add(panelSegment);
      phaseArrayPanels.push(panelSegment);
    }
    radarDomeGroup.add(arrayGroup);

    // Aircraft warning lights - blinking red lights on dome surface
    for (var aw = 0; aw < 8; aw++) {
      var lightGeometry = new THREE.SphereGeometry(3, 8, 8);
      var lightMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        shininess: 100
      });
      var warningLight = new THREE.Mesh(lightGeometry, lightMaterial);
      var lightAngle = (aw / 8) * Math.PI * 2;
      var lightHeight = 40 + Math.random() * 60;
      warningLight.position.set(
        Math.cos(lightAngle) * 110 * Math.cos(lightHeight / 180 * Math.PI),
        60 + Math.sin(lightHeight / 180 * Math.PI) * 110,
        Math.sin(lightAngle) * 110 * Math.cos(lightHeight / 180 * Math.PI)
      );
      warningLight.castShadow = true;
      radarDomeGroup.add(warningLight);
      warningLights.push(warningLight);
    }

    // Maintenance catwalks - elevated walkways
    var catwalkGeometry = new THREE.BoxGeometry(100, 1.5, 6);
    var catwalkMaterial = new THREE.MeshPhongMaterial({ color: 0x7a7a6a, emissive: 0x1a1a14 });
    var catwalk1 = new THREE.Mesh(catwalkGeometry, catwalkMaterial);
    catwalk1.position.set(-30, 45, 0);
    catwalk1.castShadow = true;
    catwalk1.receiveShadow = true;
    radarDomeGroup.add(catwalk1);

    var catwalk2Geometry = new THREE.BoxGeometry(6, 1.5, 80);
    var catwalk2 = new THREE.Mesh(catwalk2Geometry, catwalkMaterial);
    catwalk2.position.set(40, 35, 0);
    catwalk2.castShadow = true;
    catwalk2.receiveShadow = true;
    radarDomeGroup.add(catwalk2);

    // Transformer yard - large electrical transformers
    for (var tf = 0; tf < 6; tf++) {
      var transGeometry = new THREE.BoxGeometry(12, 16, 10);
      var transMaterial = new THREE.MeshPhongMaterial({ color: 0x3a3a2a, emissive: 0x0a0a05 });
      var transformer = new THREE.Mesh(transGeometry, transMaterial);
      transformer.position.set(140 + (tf % 3) * 25, 8, 80 + Math.floor(tf / 3) * 30);
      transformer.castShadow = true;
      transformer.receiveShadow = true;
      radarDomeGroup.add(transformer);
    }

    // Power transmission lines above transformer yard
    var powerLineGeom = new THREE.BufferGeometry();
    var powerLinePositions = new Float32Array([
      120, 50, 80, 220, 50, 80,
      120, 50, 110, 220, 50, 110,
      120, 50, 140, 220, 50, 140
    ]);
    powerLineGeom.setAttribute('position', new THREE.BufferAttribute(powerLinePositions, 3));
    var powerLineMaterial = new THREE.LineBasicMaterial({ color: 0xffaa00, linewidth: 3 });
    var powerLines = new THREE.LineSegments(powerLineGeom, powerLineMaterial);
    radarDomeGroup.add(powerLines);

    // Support posts for power lines
    for (var pl = 0; pl < 3; pl++) {
      var postGeometry = new THREE.CylinderGeometry(1, 1, 50, 6);
      var postMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a3a, emissive: 0x0a0a05 });
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(120 + (pl * 50), 25, 80);
      post.castShadow = true;
      post.receiveShadow = true;
      radarDomeGroup.add(post);
    }

    return radarDomeGroup;
  };

  var update = function(delta) {
    if (!radarDomeGroup) return;

    // Rotate main radar dish
    if (radarDish) {
      radarRotationAngle += delta * 0.5;
      radarDish.rotation.y = radarRotationAngle;
    }

    // Blink aircraft warning lights
    warningLightBlink += delta;
    if (warningLightBlink > 1.5) {
      warningLightBlink = 0;
    }
    var blinkIntensity = warningLightBlink < 0.3 ? 1.0 : (warningLightBlink < 0.6 ? 0.2 : 0.0);
    for (var w = 0; w < warningLights.length; w++) {
      warningLights[w].material.emissive.setScalar(blinkIntensity);
      warningLights[w].visible = blinkIntensity > 0.1;
    }

    // Cooling tower vapor puff animation
    vaporPulse += delta;
    for (var vc = 0; vc < vaporClouds.length; vc++) {
      var vapor = vaporClouds[vc];
      var vaporCycle = (vaporPulse * 0.3 + vapor.offset * 0.5) % (Math.PI * 2);
      vapor.mesh.position.y = vapor.baseY + Math.sin(vaporCycle) * 8;
      vapor.mesh.scale.y = 0.8 + Math.sin(vaporCycle) * 0.3;
      vapor.mesh.material.opacity = 0.4 + Math.sin(vaporCycle) * 0.2;
    }

    // Phased array panel pulse sequence
    phaseArrayPulse += delta;
    for (var pp = 0; pp < phaseArrayPanels.length; pp++) {
      var panel = phaseArrayPanels[pp];
      var panelPhase = (phaseArrayPulse * 2.0 + (pp / phaseArrayPanels.length) * Math.PI * 2) % (Math.PI * 2);
      var panelBrightness = 0.5 + Math.sin(panelPhase) * 0.5;
      panel.material.emissive.setScalar(panelBrightness);
      panel.material.color.setHex(Math.random() > 0.7 ? 0x0099ff : 0x1a3a4a);
    }
  };

  var reset = function() {
    radarRotationAngle = 0;
    warningLightBlink = 0;
    vaporPulse = 0;
    phaseArrayPulse = 0;
    if (radarDish) {
      radarDish.rotation.y = 0;
    }
    for (var w = 0; w < warningLights.length; w++) {
      warningLights[w].material.emissive.setScalar(0);
    }
    for (var vc = 0; vc < vaporClouds.length; vc++) {
      vaporClouds[vc].mesh.position.y = vaporClouds[vc].baseY;
      vaporClouds[vc].mesh.scale.y = 0.8;
      vaporClouds[vc].mesh.material.opacity = 0.4;
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
