window.UniversityRaid = (function() {
  'use strict';

  var THREE = window.THREE;

  // State
  var state = {
    professorExtracted: false,
    researchSecured: false,
    militiaDown: 0,
    maxMilitia: 15,
    sceneObjects: [],
    enemies: [],
    clock: { rotation: 0 },
    fountain: { phase: 0 },
    sprinkler: { active: false, timer: 0 },
    libraryLights: [],
    professsor: null,
    keybindBuffer: [],
    lastKeyTime: 0,
    enabled: true
  };

  var materials = {
    redBrick: null,
    concretegrey: null,
    grassGreen: null,
    ivyGreen: null,
    fogWhite: null,
    darkHood: null,
    skin: null,
    emissive: null
  };

  var hudElements = {
    professorStatus: null,
    researchStatus: null,
    militiaCount: null
  };

  function createMaterials() {
    materials.redBrick = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    materials.concretegrey = new THREE.MeshStandardMaterial({ color: 0x696969 });
    materials.grassGreen = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    materials.ivyGreen = new THREE.MeshStandardMaterial({ color: 0x3D7E3D });
    materials.fogWhite = new THREE.MeshStandardMaterial({ color: 0xE8E8E8 });
    materials.darkHood = new THREE.MeshStandardMaterial({ color: 0x1A1A1A });
    materials.skin = new THREE.MeshStandardMaterial({ color: 0xF4A460 });
    materials.emissive = new THREE.MeshStandardMaterial({ color: 0x00FF00, emissive: 0x00AA00 });
  }

  function trackObject(obj) {
    state.sceneObjects.push(obj);
    return obj;
  }

  function addToScene(scene, obj) {
    scene.add(obj);
    return trackObject(obj);
  }

  function createMainAcademicHall(scene) {
    var group = new THREE.Group();

    // Main building body - tall classical box
    var hallGeom = new THREE.BoxGeometry(40, 50, 30);
    var hallMesh = new THREE.Mesh(hallGeom, materials.redBrick);
    hallMesh.position.set(0, 25, -60);
    group.add(hallMesh);

    // Cylinder columns (classical)
    for (var i = -1; i <= 1; i++) {
      var colGeom = new THREE.CylinderGeometry(2, 2, 50, 16);
      var colMesh = new THREE.Mesh(colGeom, materials.concretegrey);
      colMesh.position.set(i * 15, 25, -45);
      group.add(colMesh);
    }

    // Box pediment on top
    var pedGeom = new THREE.BoxGeometry(44, 6, 32);
    var pedMesh = new THREE.Mesh(pedGeom, materials.redBrick);
    pedMesh.position.set(0, 53, -60);
    group.add(pedMesh);

    addToScene(scene, group);
  }

  function createCampusQuadLawn(scene) {
    var quadGeom = new THREE.BoxGeometry(100, 0.5, 100);
    var quadMesh = new THREE.Mesh(quadGeom, materials.grassGreen);
    quadMesh.position.set(0, -0.25, 0);
    addToScene(scene, quadMesh);
  }

  function createLibraryWing(scene) {
    var group = new THREE.Group();

    // Main library box - large and flat
    var libGeom = new THREE.BoxGeometry(50, 30, 15);
    var libMesh = new THREE.Mesh(libGeom, materials.redBrick);
    libMesh.position.set(-45, 15, -20);
    group.add(libMesh);

    // Box pillar facade elements
    for (var i = 0; i < 4; i++) {
      var pillarGeom = new THREE.BoxGeometry(3, 30, 2);
      var pillarMesh = new THREE.Mesh(pillarGeom, materials.concretegrey);
      pillarMesh.position.set(-40 + i * 12, 15, -27);
      group.add(pillarMesh);
    }

    // Window lights (flickering)
    for (var j = 0; j < 6; j++) {
      var winGeom = new THREE.BoxGeometry(4, 4, 0.5);
      var winMesh = new THREE.Mesh(winGeom, materials.fogWhite);
      winMesh.position.set(-40 + j * 8, 20, -27.5);
      winMesh.userData.flicker = true;
      state.libraryLights.push(winMesh);
      group.add(winMesh);
    }

    addToScene(scene, group);
  }

  function createScienceLabBuilding(scene) {
    var group = new THREE.Group();

    // Modern box building
    var labGeom = new THREE.BoxGeometry(35, 25, 25);
    var labMesh = new THREE.Mesh(labGeom, materials.concretegrey);
    labMesh.position.set(50, 12.5, -50);
    group.add(labMesh);

    // Glass panel boxes (modern aesthetic)
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 2; j++) {
        var panelGeom = new THREE.BoxGeometry(8, 10, 0.5);
        var panelMat = new THREE.MeshStandardMaterial({ color: 0x87CEEB, transparent: true, opacity: 0.6 });
        var panelMesh = new THREE.Mesh(panelGeom, panelMat);
        panelMesh.position.set(45 + i * 12, 15 + j * 12, -62.5);
        group.add(panelMesh);
      }
    }

    addToScene(scene, group);
  }

  function createLectureTheatre(scene) {
    // Circular box building
    var theatreGeom = new THREE.BoxGeometry(30, 20, 30);
    var theatreMesh = new THREE.Mesh(theatreGeom, materials.redBrick);
    theatreMesh.position.set(-50, 10, 40);
    addToScene(scene, theatreMesh);
  }

  function createClockTower(scene) {
    var group = new THREE.Group();

    // Tall cylinder tower
    var towerGeom = new THREE.CylinderGeometry(4, 4, 60, 16);
    var towerMesh = new THREE.Mesh(towerGeom, materials.concretegrey);
    towerMesh.position.set(30, 30, 20);
    group.add(towerMesh);

    // Box clock face
    var faceGeom = new THREE.BoxGeometry(10, 10, 1);
    var faceMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    var faceMesh = new THREE.Mesh(faceGeom, faceMat);
    faceMesh.position.set(30, 58, 24);
    faceMesh.userData.isClockFace = true;
    group.add(faceMesh);

    // Clock hands (will rotate)
    var handMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    var hourHandGeom = new THREE.BoxGeometry(0.5, 3, 0.2);
    var hourHand = new THREE.Mesh(hourHandGeom, handMat);
    hourHand.position.set(30, 58, 25);
    hourHand.userData.isHourHand = true;
    group.add(hourHand);

    var minHandGeom = new THREE.BoxGeometry(0.3, 4.5, 0.2);
    var minHand = new THREE.Mesh(minHandGeom, handMat);
    minHand.position.set(30, 58, 25);
    minHand.userData.isMinHand = true;
    group.add(minHand);

    addToScene(scene, group);
  }

  function createCampusFountain(scene) {
    var group = new THREE.Group();

    // Cylinder base
    var baseGeom = new THREE.CylinderGeometry(8, 8, 2, 16);
    var baseMesh = new THREE.Mesh(baseGeom, materials.concretegrey);
    baseMesh.position.set(0, 1, 30);
    group.add(baseMesh);

    // Sphere arcs for water effect
    for (var i = 0; i < 4; i++) {
      var arcGeom = new THREE.SphereGeometry(3, 8, 8);
      var arcMat = new THREE.MeshStandardMaterial({ color: 0x4169E1, transparent: true, opacity: 0.7 });
      var arcMesh = new THREE.Mesh(arcGeom, arcMat);
      arcMesh.position.set(5 * Math.cos(i * Math.PI / 2), 5, 30 + 5 * Math.sin(i * Math.PI / 2));
      arcMesh.userData.fountainArc = true;
      arcMesh.userData.arcIndex = i;
      group.add(arcMesh);
    }

    addToScene(scene, group);
  }

  function createBicycleRacks(scene) {
    // LineSegments grid for bicycle racks
    var points = [];
    for (var x = -20; x <= 20; x += 10) {
      for (var z = 50; z <= 70; z += 10) {
        points.push(new THREE.Vector3(x, 0, z));
        points.push(new THREE.Vector3(x, 3, z));
      }
    }
    var geom = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
    var racks = new THREE.LineSegments(geom, mat);
    addToScene(scene, racks);
  }

  function createDormitoryBlock(scene) {
    // Long box dormitory
    var dormGeom = new THREE.BoxGeometry(60, 35, 12);
    var dormMesh = new THREE.Mesh(dormGeom, materials.redBrick);
    dormMesh.position.set(30, 17.5, 60);
    addToScene(scene, dormMesh);
  }

  function createStudentUnionBuilding(scene) {
    var group = new THREE.Group();

    // Main union box
    var unionGeom = new THREE.BoxGeometry(40, 20, 35);
    var unionMesh = new THREE.Mesh(unionGeom, materials.concretegrey);
    unionMesh.position.set(-40, 10, 50);
    group.add(unionMesh);

    // Box canopy structure
    var canopyGeom = new THREE.BoxGeometry(45, 3, 40);
    var canopyMesh = new THREE.Mesh(canopyGeom, materials.redBrick);
    canopyMesh.position.set(-40, 23, 50);
    group.add(canopyMesh);

    addToScene(scene, group);
  }

  function createFireHydrantCluster(scene) {
    for (var i = 0; i < 3; i++) {
      var hydGeom = new THREE.CylinderGeometry(0.5, 0.6, 1.5, 8);
      var hydMesh = new THREE.Mesh(hydGeom, new THREE.MeshStandardMaterial({ color: 0xFF0000 }));
      hydMesh.position.set(-30 + i * 3, 0.75, 20);
      addToScene(scene, hydMesh);
    }
  }

  function createCampusStatue(scene) {
    var group = new THREE.Group();

    // Pedestal - box
    var pedGeom = new THREE.BoxGeometry(4, 5, 4);
    var pedMesh = new THREE.Mesh(pedGeom, materials.concretegrey);
    pedMesh.position.set(-70, 2.5, -30);
    group.add(pedMesh);

    // Figure - box representing a person
    var figGeom = new THREE.BoxGeometry(2, 6, 2);
    var figMesh = new THREE.Mesh(figGeom, materials.concretegrey);
    figMesh.position.set(-70, 8, -30);
    group.add(figMesh);

    addToScene(scene, group);
  }

  function createPhysicsLabEquipment(scene) {
    // Particle accelerator ring section - emissive box
    var ringGeom = new THREE.BoxGeometry(20, 3, 20);
    var ringMesh = new THREE.Mesh(ringGeom, materials.emissive);
    ringMesh.position.set(60, 2, 20);
    addToScene(scene, ringMesh);
  }

  function createResearchServerRacks(scene) {
    for (var i = 0; i < 3; i++) {
      var rackGeom = new THREE.BoxGeometry(4, 12, 3);
      var rackMesh = new THREE.Mesh(rackGeom, materials.emissive);
      rackMesh.position.set(55 + i * 6, 6, -40);
      addToScene(scene, rackMesh);
    }
  }

  function createProfessorBarricade(scene) {
    var group = new THREE.Group();

    // Desk box turned on side
    var deskGeom = new THREE.BoxGeometry(8, 2, 4);
    var deskMesh = new THREE.Mesh(deskGeom, materials.redBrick);
    deskMesh.rotation.z = Math.PI / 4;
    deskMesh.position.set(-60, 1, -40);
    group.add(deskMesh);

    // Professor figure crouching - box
    var profGeom = new THREE.BoxGeometry(2, 2.5, 2);
    var profMesh = new THREE.Mesh(profGeom, materials.skin);
    profMesh.position.set(-58, 2, -40);
    profMesh.userData.isProfessor = true;
    state.professor = profMesh;
    group.add(profMesh);

    addToScene(scene, group);
  }

  function createSprinklerSystem(scene) {
    // Sprinkler base - short cylinder
    var baseGeom = new THREE.CylinderGeometry(1, 1, 0.5, 8);
    var baseMesh = new THREE.Mesh(baseGeom, materials.concretegrey);
    baseMesh.position.set(-20, 0.25, 15);
    addToScene(scene, baseMesh);

    // Sprinkler head - sphere
    var headGeom = new THREE.SphereGeometry(1.5, 8, 8);
    var headMat = new THREE.MeshStandardMaterial({ color: 0x87CEEB, transparent: true, opacity: 0.6 });
    var headMesh = new THREE.Mesh(headGeom, headMat);
    headMesh.position.set(-20, 1.5, 15);
    headMesh.userData.isSprinkler = true;
    addToScene(scene, headMesh);
  }

  function createEnemies(scene) {
    // Create 15 militia enemies scattered around campus
    var positions = [
      { x: 0, y: 1.5, z: -80 },
      { x: 20, y: 1.5, z: -70 },
      { x: -20, y: 1.5, z: -60 },
      { x: 40, y: 1.5, z: -50 },
      { x: -40, y: 1.5, z: -40 },
      { x: 50, y: 1.5, z: -20 },
      { x: -50, y: 1.5, z: 0 },
      { x: 30, y: 1.5, z: 30 },
      { x: -30, y: 1.5, z: 40 },
      { x: 60, y: 1.5, z: 50 },
      { x: -60, y: 1.5, z: 60 },
      { x: 0, y: 1.5, z: 70 },
      { x: 40, y: 1.5, z: 80 },
      { x: -40, y: 1.5, z: -85 },
      { x: 20, y: 1.5, z: 90 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var enemyGroup = new THREE.Group();

      // Body - box
      var bodyGeom = new THREE.BoxGeometry(2, 4, 1.5);
      var bodyMesh = new THREE.Mesh(bodyGeom, materials.darkHood);
      bodyMesh.position.y = 2;
      enemyGroup.add(bodyMesh);

      // Head - box
      var headGeom = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      var headMesh = new THREE.Mesh(headGeom, materials.skin);
      headMesh.position.y = 5;
      enemyGroup.add(headMesh);

      // Arm for weapon - box
      var armGeom = new THREE.BoxGeometry(0.5, 2, 0.5);
      var armMesh = new THREE.Mesh(armGeom, materials.skin);
      armMesh.position.set(1.5, 3, 0);
      enemyGroup.add(armMesh);

      enemyGroup.position.copy(positions[i]);
      enemyGroup.userData.isEnemy = true;
      enemyGroup.userData.health = 1;
      state.enemies.push(enemyGroup);
      addToScene(scene, enemyGroup);
    }
  }

  function setupHUD(camera) {
    // Create simple HUD using canvas texture
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#00FF00';
    ctx.font = 'Bold 24px Arial';
    ctx.fillText('PROFESSOR EXTRACTED: NO', 20, 50);
    ctx.fillText('RESEARCH SECURED: NO', 20, 100);
    ctx.fillText('MILITIA DOWN: 0/15', 20, 150);

    var texture = new THREE.CanvasTexture(canvas);
    var geom = new THREE.PlaneGeometry(10, 5);
    var mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    var hud = new THREE.Mesh(geom, mat);
    hud.position.set(0, 0, -15);

    return { canvas: canvas, texture: texture, mesh: hud, ctx: ctx };
  }

  function updateHUD(hudData) {
    var canvas = hudData.canvas;
    var ctx = hudData.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#00FF00';
    ctx.font = 'Bold 24px Arial';
    ctx.fillText('PROFESSOR EXTRACTED: ' + (state.professorExtracted ? 'YES' : 'NO'), 20, 50);
    ctx.fillText('RESEARCH SECURED: ' + (state.researchSecured ? 'YES' : 'NO'), 20, 100);
    ctx.fillText('MILITIA DOWN: ' + state.militiaDown + '/15', 20, 150);
    hudData.texture.needsUpdate = true;
  }

  function animateClockTower(scene) {
    state.clock.rotation += 0.01;
    var children = scene.children;
    for (var i = 0; i < children.length; i++) {
      var obj = children[i];
      if (obj.children) {
        for (var j = 0; j < obj.children.length; j++) {
          var child = obj.children[j];
          if (child.userData && child.userData.isHourHand) {
            child.rotation.z = state.clock.rotation * 0.1;
          } else if (child.userData && child.userData.isMinHand) {
            child.rotation.z = state.clock.rotation;
          }
        }
      }
    }
  }

  function animateFountain(scene, delta) {
    state.fountain.phase += delta * 2;
    var children = scene.children;
    for (var i = 0; i < children.length; i++) {
      var obj = children[i];
      if (obj.children) {
        for (var j = 0; j < obj.children.length; j++) {
          var child = obj.children[j];
          if (child.userData && child.userData.fountainArc) {
            var idx = child.userData.arcIndex;
            var offsetY = Math.sin(state.fountain.phase + idx) * 2;
            child.position.y = 5 + offsetY;
          }
        }
      }
    }
  }

  function animateLibraryLights(delta) {
    for (var i = 0; i < state.libraryLights.length; i++) {
      var light = state.libraryLights[i];
      if (Math.random() > 0.98) {
        light.material.color.setHex(Math.random() > 0.5 ? 0xFFFFFF : 0x333333);
      }
    }
  }

  function animateEnemies(delta) {
    for (var i = 0; i < state.enemies.length; i++) {
      var enemy = state.enemies[i];
      if (enemy.userData.health > 0) {
        // Simple patrol - wander
        enemy.position.x += Math.sin(Date.now() * 0.0001 + i) * 0.01;
        enemy.position.z += Math.cos(Date.now() * 0.0001 + i) * 0.01;

        // Rotate arms
        if (enemy.children.length > 2) {
          enemy.children[2].rotation.x = Math.sin(Date.now() * 0.002) * 0.3;
        }
      }
    }
  }

  function animateProfessor(delta) {
    if (state.professor) {
      // Crouching animation
      state.professor.scale.y = 0.7 + Math.sin(Date.now() * 0.002) * 0.1;
    }
  }

  function handleKeybind(key) {
    state.keybindBuffer.push(key);
    var now = Date.now();

    // Clear old buffer entries
    if (now - state.lastKeyTime > 400) {
      state.keybindBuffer = [key];
    }
    state.lastKeyTime = now;

    // Check for U+R sequence
    if (state.keybindBuffer.length >= 2) {
      var last = state.keybindBuffer.slice(-2);
      if (last[0] === 'U' && last[1] === 'R') {
        state.enabled = !state.enabled;
        console.log('UniversityRaid ' + (state.enabled ? 'ENABLED' : 'DISABLED'));
        state.keybindBuffer = [];
      }
    }
  }

  var hudData = null;

  function init(scene, camera) {
    createMaterials();

    // Create all structures
    createCampusQuadLawn(scene);
    createMainAcademicHall(scene);
    createLibraryWing(scene);
    createScienceLabBuilding(scene);
    createLectureTheatre(scene);
    createClockTower(scene);
    createCampusFountain(scene);
    createBicycleRacks(scene);
    createDormitoryBlock(scene);
    createStudentUnionBuilding(scene);
    createFireHydrantCluster(scene);
    createCampusStatue(scene);
    createPhysicsLabEquipment(scene);
    createResearchServerRacks(scene);
    createProfessorBarricade(scene);
    createSprinklerSystem(scene);
    createEnemies(scene);

    // Setup HUD
    hudData = setupHUD(camera);
    scene.add(hudData.mesh);

    // Fog for atmospheric effect
    scene.fog = new THREE.Fog(0xCCCCCC, 150, 300);
    scene.background = new THREE.Color(0x87CEEB);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(50, 60, 50);
    scene.add(directionalLight);

    // Setup keybind listener
    document.addEventListener('keydown', function(e) {
      if (e.key.toUpperCase() === 'U' || e.key.toUpperCase() === 'R') {
        handleKeybind(e.key.toUpperCase());
      }
    });

    console.log('UniversityRaid initialized - Press U+R to toggle');
  }

  function update(delta) {
    if (!state.enabled) return;

    animateClockTower(scene);
    animateFountain(scene, delta);
    animateLibraryLights(delta);
    animateEnemies(delta);
    animateProfessor(delta);

    if (hudData) {
      updateHUD(hudData);
    }
  }

  function reset() {
    for (var i = 0; i < state.sceneObjects.length; i++) {
      var obj = state.sceneObjects[i];
      if (obj.parent) {
        obj.parent.remove(obj);
      }
    }
    state.sceneObjects = [];
    state.enemies = [];
    state.libraryLights = [];
    state.professor = null;
    state.professorExtracted = false;
    state.researchSecured = false;
    state.militiaDown = 0;
    state.keybindBuffer = [];

    if (hudData && hudData.mesh.parent) {
      hudData.mesh.parent.remove(hudData.mesh);
    }
    hudData = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
