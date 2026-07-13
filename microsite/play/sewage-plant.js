window.SewagePlant = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animationFrames = 0;
  var hudVisible = true;
  var vatsDestroyed = 0;
  var nerveAgentProgress = 87;

  var keyPressed = {};
  var lastSKeyTime = 0;

  function init(s, c) {
    scene = s;
    camera = c;
    reset();

    createPrimaryClarifier();
    createSecondaryTreatmentPool();
    createSludgeDigesterTowers();
    createAerationBasin();
    createChemicalStorageTanks();
    createPipeGallery();
    createControlBuilding();
    createGritChamber();
    createBlowerBuilding();
    createUVDisinfectionChannel();
    createSludgeDryingBed();
    createMaintenanceCatwalk();
    createChemicalInjectionPoint();
    createLabTrailer();
    createEmergencyOverflowDrain();
    createToxicFog();
    createEnemyChemists();

    setupKeyBindings();
    updateHUD();
  }

  function createPrimaryClarifier() {
    var geometry = new THREE.CylinderGeometry(20, 20, 3, 32);
    var material = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-40, 0.5, -20);
    mesh.name = 'primaryClarifier';
    scene.add(mesh);
    objects.push(mesh);

    var waterGeometry = new THREE.CylinderGeometry(19.5, 19.5, 2.5, 32);
    var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a2a });
    var water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(-40, 1.5, -20);
    scene.add(water);
    objects.push(water);
  }

  function createSecondaryTreatmentPool() {
    var geometry = new THREE.CylinderGeometry(15, 15, 2, 32);
    var material = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0.5, -20);
    mesh.name = 'secondaryPool';
    scene.add(mesh);
    objects.push(mesh);

    var waterGeometry = new THREE.CylinderGeometry(14.5, 14.5, 1.8, 32);
    var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x6b7a2a });
    var water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(0, 1.2, -20);
    scene.add(water);
    objects.push(water);
  }

  function createSludgeDigesterTowers() {
    for (var i = 0; i < 3; i++) {
      var xPos = 30 + i * 15;
      var cylinderGeometry = new THREE.CylinderGeometry(5, 5, 18, 16);
      var cylinderMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
      var cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
      cylinder.position.set(xPos, 9, -20);
      cylinder.name = 'digesterTower' + i;
      scene.add(cylinder);
      objects.push(cylinder);

      var domeGeometry = new THREE.ConeGeometry(5, 4, 16);
      var domeMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      var dome = new THREE.Mesh(domeGeometry, domeMaterial);
      dome.position.set(xPos, 20, -20);
      scene.add(dome);
      objects.push(dome);

      var flameGeometry = new THREE.SphereGeometry(0.8, 8, 8);
      var flameMaterial = new THREE.MeshBasicMaterial({ color: 0xff8800 });
      var flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.position.set(xPos, 24, -20);
      flame.name = 'digesterFlame' + i;
      scene.add(flame);
      objects.push(flame);
    }
  }

  function createAerationBasin() {
    var boxGeometry = new THREE.BoxGeometry(25, 3, 20);
    var boxMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    var box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.set(0, 0.5, 10);
    box.name = 'aerationBasin';
    scene.add(box);
    objects.push(box);

    var waterGeometry = new THREE.BoxGeometry(24, 2.5, 19);
    var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a2a });
    var water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(0, 1.5, 10);
    scene.add(water);
    objects.push(water);

    var gateGeometry = new THREE.BoxGeometry(0.5, 2, 18);
    var gateMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    var gate = new THREE.Mesh(gateGeometry, gateMaterial);
    gate.position.set(0, 1.5, 10);
    scene.add(gate);
    objects.push(gate);

    for (var i = 0; i < 8; i++) {
      var bubbleGeometry = new THREE.SphereGeometry(0.3, 6, 6);
      var bubbleMaterial = new THREE.MeshBasicMaterial({ color: 0x88ccff });
      var bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
      bubble.position.set(-8 + i * 2.5, 2, 10);
      bubble.name = 'aerationBubble' + i;
      scene.add(bubble);
      objects.push(bubble);
    }
  }

  function createChemicalStorageTanks() {
    for (var i = 0; i < 4; i++) {
      var xPos = -45 + i * 10;
      var geometry = new THREE.CylinderGeometry(4, 4, 10, 16);
      var material = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(xPos, 5, 15);
      mesh.name = 'chemicalTank' + i;
      scene.add(mesh);
      objects.push(mesh);

      var topGeometry = new THREE.ConeGeometry(4, 2, 16);
      var topMaterial = new THREE.MeshLambertMaterial({ color: 0x6b3410 });
      var top = new THREE.Mesh(topGeometry, topMaterial);
      top.position.set(xPos, 11, 15);
      scene.add(top);
      objects.push(top);
    }
  }

  function createPipeGallery() {
    var corridorGeometry = new THREE.BoxGeometry(30, 4, 5);
    var corridorMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    var corridor = new THREE.Mesh(corridorGeometry, corridorMaterial);
    corridor.position.set(0, 2, 35);
    scene.add(corridor);
    objects.push(corridor);

    for (var i = 0; i < 6; i++) {
      var pipeGeometry = new THREE.CylinderGeometry(0.8, 0.8, 28, 12);
      var pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(0, 3.5 + i * 0.8, 35);
      scene.add(pipe);
      objects.push(pipe);
    }
  }

  function createControlBuilding() {
    var geometry = new THREE.BoxGeometry(12, 8, 10);
    var material = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-35, 4, 25);
    mesh.name = 'controlBuilding';
    scene.add(mesh);
    objects.push(mesh);
  }

  function createGritChamber() {
    var geometry = new THREE.BoxGeometry(15, 2.5, 12);
    var material = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(30, -0.75, 0);
    mesh.name = 'gritChamber';
    scene.add(mesh);
    objects.push(mesh);
  }

  function createBlowerBuilding() {
    var buildingGeometry = new THREE.BoxGeometry(10, 8, 8);
    var buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(50, 4, 20);
    scene.add(building);
    objects.push(building);

    for (var i = 0; i < 2; i++) {
      var stackGeometry = new THREE.CylinderGeometry(2, 2.5, 12, 12);
      var stackMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
      var stack = new THREE.Mesh(stackGeometry, stackMaterial);
      stack.position.set(45 + i * 10, 12, 20);
      stack.name = 'exhaustStack' + i;
      scene.add(stack);
      objects.push(stack);
    }
  }

  function createUVDisinfectionChannel() {
    var geometry = new THREE.BoxGeometry(8, 2, 40);
    var material = new THREE.MeshStandardMaterial({
      color: 0x4a8aff,
      emissive: 0x2a6aff,
      emissiveIntensity: 0.5
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(25, 1, -5);
    mesh.name = 'uvChannel';
    scene.add(mesh);
    objects.push(mesh);
  }

  function createSludgeDryingBed() {
    var bedGeometry = new THREE.BoxGeometry(18, 1, 12);
    var bedMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a3a });
    var bed = new THREE.Mesh(bedGeometry, bedMaterial);
    bed.position.set(-20, 0, 0);
    scene.add(bed);
    objects.push(bed);

    for (var i = 0; i < 5; i++) {
      var ribGeometry = new THREE.BoxGeometry(0.4, 0.2, 12);
      var ribMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a2a });
      var rib = new THREE.Mesh(ribGeometry, ribMaterial);
      rib.position.set(-20 + i * 4, 0.5, 0);
      scene.add(rib);
      objects.push(rib);
    }
  }

  function createMaintenanceCatwalk() {
    var walkwayGeometry = new THREE.BoxGeometry(2, 0.5, 25);
    var walkwayMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    var walkway = new THREE.Mesh(walkwayGeometry, walkwayMaterial);
    walkway.position.set(-15, 8, -5);
    scene.add(walkway);
    objects.push(walkway);

    var points = [
      new THREE.Vector3(-14.5, 7.5, 15),
      new THREE.Vector3(-14.5, 7.5, -20),
      new THREE.Vector3(-15.5, 7.5, -20),
      new THREE.Vector3(-15.5, 7.5, 15)
    ];

    for (var i = 0; i < points.length; i += 2) {
      var geometry = new THREE.BufferGeometry().setFromPoints([points[i], points[i + 1] || points[0]]);
      var material = new THREE.LineBasicMaterial({ color: 0x8a8a8a });
      var line = new THREE.LineSegments(geometry, material);
      scene.add(line);
      objects.push(line);
    }
  }

  function createChemicalInjectionPoint() {
    var cylinderGeometry = new THREE.CylinderGeometry(2, 2, 6, 12);
    var cylinderMaterial = new THREE.MeshLambertMaterial({ color: 0xaa6644 });
    var cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.position.set(0, 3, -40);
    cylinder.name = 'injectionPoint';
    scene.add(cylinder);
    objects.push(cylinder);

    var pipeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
    var pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
    var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(3, 3, -40);
    scene.add(pipe);
    objects.push(pipe);
  }

  function createLabTrailer() {
    var trailerGeometry = new THREE.BoxGeometry(8, 3, 15);
    var trailerMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    var trailer = new THREE.Mesh(trailerGeometry, trailerMaterial);
    trailer.position.set(-50, 1.5, 0);
    scene.add(trailer);
    objects.push(trailer);

    var doorGeometry = new THREE.BoxGeometry(2, 2, 0.3);
    var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(-50, 2, 8);
    scene.add(door);
    objects.push(door);
  }

  function createEmergencyOverflowDrain() {
    var drainGeometry = new THREE.CylinderGeometry(8, 8, 2, 32);
    var drainMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    var drain = new THREE.Mesh(drainGeometry, drainMaterial);
    drain.position.set(50, 0.5, -35);
    drain.name = 'overflowDrain';
    scene.add(drain);
    objects.push(drain);

    var openingGeometry = new THREE.CylinderGeometry(7, 7, 0.5, 32);
    var openingMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var opening = new THREE.Mesh(openingGeometry, openingMaterial);
    opening.position.set(50, 1.2, -35);
    scene.add(opening);
    objects.push(opening);
  }

  function createToxicFog() {
    var fogGeometry = new THREE.SphereGeometry(150, 16, 16);
    var fogMaterial = new THREE.MeshBasicMaterial({
      color: 0x4a7a2a,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    var fog = new THREE.Mesh(fogGeometry, fogMaterial);
    fog.name = 'toxicFog';
    scene.add(fog);
    objects.push(fog);
  }

  function createEnemyChemists() {
    for (var i = 0; i < 3; i++) {
      var bodyGeometry = new THREE.BoxGeometry(1.5, 2, 1);
      var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(-30 + i * 25, 1.5, 5);
      body.name = 'chemistBody' + i;
      scene.add(body);
      objects.push(body);

      var helmetGeometry = new THREE.SphereGeometry(1, 12, 12);
      var helmetMaterial = new THREE.MeshLambertMaterial({ color: 0xffff99 });
      var helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
      helmet.position.set(-30 + i * 25, 2.8, 5);
      scene.add(helmet);
      objects.push(helmet);
    }
  }

  function setupKeyBindings() {
    document.addEventListener('keydown', function(e) {
      var key = e.key.toLowerCase();
      keyPressed[key] = true;

      if (key === 's') {
        var now = Date.now();
        if (now - lastSKeyTime > 400) {
          lastSKeyTime = now;
        } else if (keyPressed['p']) {
          toggleHUD();
          lastSKeyTime = 0;
        }
      }
      if (key === 'p' && keyPressed['s']) {
        toggleHUD();
        lastSKeyTime = 0;
      }
    });

    document.addEventListener('keyup', function(e) {
      var key = e.key.toLowerCase();
      keyPressed[key] = false;
    });
  }

  function toggleHUD() {
    hudVisible = !hudVisible;
    updateHUD();
  }

  function updateHUD() {
    var hudElement = document.getElementById('sewagePlantHUD');
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'sewagePlantHUD';
      hudElement.style.position = 'fixed';
      hudElement.style.top = '20px';
      hudElement.style.left = '20px';
      hudElement.style.color = '#00ff00';
      hudElement.style.fontFamily = 'monospace';
      hudElement.style.fontSize = '14px';
      hudElement.style.zIndex = '1000';
      hudElement.style.textShadow = '0 0 10px #00ff00';
      document.body.appendChild(hudElement);
    }

    if (hudVisible) {
      hudElement.innerHTML =
        'NERVE AGENT BATCH: ' + nerveAgentProgress + '% COMPLETE<br>' +
        'VATS DESTROYED: ' + vatsDestroyed + '/3<br>' +
        'CONTAMINATION: CONTAINED<br>' +
        '<span style="font-size: 11px; color: #88ff88;">[S+P to toggle HUD]</span>';
    } else {
      hudElement.innerHTML = '';
    }
  }

  function animateObjects() {
    animationFrames += 1;

    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];

      if (obj.name === 'primaryClarifier') {
        obj.rotation.y += 0.0005;
      }

      if (obj.name && obj.name.indexOf('aerationBubble') === 0) {
        obj.position.y = 2 + Math.sin(animationFrames * 0.05 + i) * 0.8;
        obj.position.x -= 0.02;
        if (obj.position.x < -10) {
          obj.position.x = 8;
        }
      }

      if (obj.name && obj.name.indexOf('digesterFlame') === 0) {
        obj.scale.y = 1 + Math.sin(animationFrames * 0.1) * 0.3;
        obj.position.y = 24 + Math.cos(animationFrames * 0.08) * 0.5;
      }

      if (obj.name === 'uvChannel') {
        obj.material.emissiveIntensity = 0.5 + Math.sin(animationFrames * 0.05) * 0.3;
      }

      if (obj.name === 'injectionPoint') {
        obj.material.color.setHex(0xaa6644 + (Math.sin(animationFrames * 0.08) > 0 ? 0x110000 : 0));
      }
    }
  }

  function update(delta) {
    animateObjects();
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];
    vatsDestroyed = 0;
    nerveAgentProgress = 87;
    animationFrames = 0;
    updateHUD();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
