window.SubmarinePen = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var time = 0;
  var hudVisible = true;
  var lastKeyPress = null;
  var sKeyTime = null;

  var gameState = {
    submarinesDisabled: 0,
    torpedoStockDestroyed: 0,
    crewEliminated: 0
  };

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    time = 0;
    gameState.submarinesDisabled = 0;
    gameState.torpedoStockDestroyed = 0;
    gameState.crewEliminated = 0;

    createEnvironment();
    setupKeyBindings();
  }

  function createEnvironment() {
    // 1. Massive concrete pen roof (huge flat box overhead)
    var roofGeometry = new THREE.BoxGeometry(200, 8, 120);
    var roofMaterial = new THREE.MeshPhongMaterial({ color: 0x6b6b6b });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 50;
    roof.position.z = 0;
    scene.add(roof);
    sceneObjects.push(roof);

    // 2. Submarine hull (elongated box with cylinder conning tower, torpedo bow sphere)
    var submarineGroup1 = new THREE.Group();

    var hullGeometry = new THREE.BoxGeometry(50, 12, 15);
    var hullMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.z = 0;
    submarineGroup1.add(hull);

    var conningTowerGeometry = new THREE.CylinderGeometry(4, 4, 8, 16);
    var conningTowerMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
    var conningTower = new THREE.Mesh(conningTowerGeometry, conningTowerMaterial);
    conningTower.position.set(10, 8, 0);
    submarineGroup1.add(conningTower);

    var torpedoBowGeometry = new THREE.SphereGeometry(5, 16, 16);
    var torpedoBowMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var torpedoBow = new THREE.Mesh(torpedoBowGeometry, torpedoBowMaterial);
    torpedoBow.position.set(-27, 0, 0);
    submarineGroup1.add(torpedoBow);

    submarineGroup1.position.set(-30, 5, -20);
    scene.add(submarineGroup1);
    sceneObjects.push(submarineGroup1);

    // 3. Submarine #2 (partially submerged — lower Y position)
    var submarineGroup2 = new THREE.Group();

    var hull2Geometry = new THREE.BoxGeometry(50, 12, 15);
    var hull2Material = new THREE.MeshPhongMaterial({ color: 0x0d0d0d });
    var hull2 = new THREE.Mesh(hull2Geometry, hull2Material);
    submarineGroup2.add(hull2);

    var conningTower2Geometry = new THREE.CylinderGeometry(4, 4, 8, 16);
    var conningTower2 = new THREE.Mesh(conningTower2Geometry, conningTowerMaterial);
    conningTower2.position.set(10, 8, 0);
    submarineGroup2.add(conningTower2);

    var torpedoBow2Geometry = new THREE.SphereGeometry(5, 16, 16);
    var torpedoBow2 = new THREE.Mesh(torpedoBow2Geometry, torpedoBowMaterial);
    torpedoBow2.position.set(-27, 0, 0);
    submarineGroup2.add(torpedoBow2);

    submarineGroup2.position.set(30, 2, 20);
    scene.add(submarineGroup2);
    sceneObjects.push(submarineGroup2);

    // 4. Dock platform (flat box with LineSegments edge markings)
    var dockGeometry = new THREE.BoxGeometry(180, 2, 40);
    var dockMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
    var dock = new THREE.Mesh(dockGeometry, dockMaterial);
    dock.position.y = 0;
    scene.add(dock);
    sceneObjects.push(dock);

    // Dock edge markings
    var dockEdgePoints = [
      new THREE.Vector3(-90, 2, -20),
      new THREE.Vector3(90, 2, -20),
      new THREE.Vector3(90, 2, 20),
      new THREE.Vector3(-90, 2, 20),
      new THREE.Vector3(-90, 2, -20)
    ];
    var dockEdgeGeometry = new THREE.BufferGeometry().setFromPoints(dockEdgePoints);
    var dockEdgeLinesMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
    var dockEdgesLines = new THREE.LineSegments(dockEdgeGeometry, dockEdgeLinesMaterial);
    scene.add(dockEdgesLines);
    sceneObjects.push(dockEdgesLines);

    // 5. Torpedo loading crane (box arm + cylinder cable + LineSegments structure)
    var craneGroup = new THREE.Group();
    craneGroup.name = 'crane';

    var craneBaseGeometry = new THREE.BoxGeometry(6, 30, 6);
    var craneMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
    var craneBase = new THREE.Mesh(craneBaseGeometry, craneMaterial);
    craneBase.position.y = 15;
    craneGroup.add(craneBase);

    var craneArmGeometry = new THREE.BoxGeometry(60, 3, 3);
    var craneArm = new THREE.Mesh(craneArmGeometry, craneMaterial);
    craneArm.position.set(25, 32, 0);
    craneArm.name = 'craneArm';
    craneGroup.add(craneArm);

    var cableCylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 8);
    var cableMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var cableCylinder = new THREE.Mesh(cableCylinderGeometry, cableMaterial);
    cableCylinder.position.set(55, 15, 0);
    craneGroup.add(cableCylinder);

    var craneStructurePoints = [
      new THREE.Vector3(0, 32, 0),
      new THREE.Vector3(-30, 0, 0),
      new THREE.Vector3(0, 32, 0),
      new THREE.Vector3(30, 0, 0)
    ];
    var craneStructureGeometry = new THREE.BufferGeometry().setFromPoints(craneStructurePoints);
    var craneLinesMaterial = new THREE.LineBasicMaterial({ color: 0x8b4513 });
    var craneStructureLines = new THREE.LineSegments(craneStructureGeometry, craneLinesMaterial);
    craneGroup.add(craneStructureLines);

    craneGroup.position.set(-60, 5, 0);
    scene.add(craneGroup);
    sceneObjects.push(craneGroup);

    // 6. Torpedo rack (row of cylinder torpedoes)
    var torpedoRackGroup = new THREE.Group();

    for (var i = 0; i < 8; i++) {
      var torpedoGeometry = new THREE.CylinderGeometry(2, 2, 20, 16);
      var torpedoMaterial = new THREE.MeshPhongMaterial({ color: 0xff6347 });
      var torpedo = new THREE.Mesh(torpedoGeometry, torpedoMaterial);
      torpedo.rotation.z = Math.PI / 2;
      torpedo.position.set(60, 12 + i * 5, -30 + i * 8);
      torpedoRackGroup.add(torpedo);
    }

    scene.add(torpedoRackGroup);
    sceneObjects.push(torpedoRackGroup);

    // 7. Fuel/ballast pipe system (interconnected CylinderGeometry pipes)
    var pipeSystemGroup = new THREE.Group();
    var pipeMaterial = new THREE.MeshPhongMaterial({ color: 0x505050 });

    var pipe1Geometry = new THREE.CylinderGeometry(1.5, 1.5, 60, 16);
    var pipe1 = new THREE.Mesh(pipe1Geometry, pipeMaterial);
    pipe1.rotation.z = Math.PI / 2;
    pipe1.position.set(0, 8, -35);
    pipeSystemGroup.add(pipe1);

    var pipe2Geometry = new THREE.CylinderGeometry(1.5, 1.5, 80, 16);
    var pipe2 = new THREE.Mesh(pipe2Geometry, pipeMaterial);
    pipe2.rotation.z = Math.PI / 2;
    pipe2.position.set(0, 15, 35);
    pipeSystemGroup.add(pipe2);

    var pipe3Geometry = new THREE.CylinderGeometry(1, 1, 30, 16);
    var pipe3 = new THREE.Mesh(pipe3Geometry, pipeMaterial);
    pipe3.rotation.x = Math.PI / 2;
    pipe3.position.set(-40, 12, 0);
    pipeSystemGroup.add(pipe3);

    scene.add(pipeSystemGroup);
    sceneObjects.push(pipeSystemGroup);

    // 8. Control room bunker (box building inside pen)
    var bunkerGeometry = new THREE.BoxGeometry(40, 20, 30);
    var bunkerMaterial = new THREE.MeshPhongMaterial({ color: 0x5a5a5a });
    var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
    bunker.position.set(80, 12, -40);
    scene.add(bunker);
    sceneObjects.push(bunker);

    // 9. Anti-aircraft gun emplacement (cylinder barrel on box mount)
    var aaGunGroup = new THREE.Group();
    aaGunGroup.name = 'aaGun';

    var aaGunMountGeometry = new THREE.BoxGeometry(15, 8, 15);
    var aaGunMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
    var aaGunMount = new THREE.Mesh(aaGunMountGeometry, aaGunMaterial);
    aaGunMount.position.y = 4;
    aaGunGroup.add(aaGunMount);

    var aaGunBarrelGeometry = new THREE.CylinderGeometry(1.5, 1.5, 25, 16);
    var aaGunBarrel = new THREE.Mesh(aaGunBarrelGeometry, aaGunMaterial);
    aaGunBarrel.position.set(0, 12, 0);
    aaGunBarrel.rotation.x = Math.PI / 6;
    aaGunBarrel.name = 'aaGunBarrel';
    aaGunGroup.add(aaGunBarrel);

    aaGunGroup.position.set(-70, 5, 45);
    scene.add(aaGunGroup);
    sceneObjects.push(aaGunGroup);

    // 10. Water channel between docks (implied by gap, LineSegments guide rails)
    var waterChannelPoints = [
      new THREE.Vector3(-100, 0, -10),
      new THREE.Vector3(100, 0, -10),
      new THREE.Vector3(-100, 0, 10),
      new THREE.Vector3(100, 0, 10)
    ];
    var waterChannelGeometry = new THREE.BufferGeometry().setFromPoints(waterChannelPoints);
    var waterChannelLinesMaterial = new THREE.LineBasicMaterial({ color: 0x4a90e2 });
    var waterChannelLines = new THREE.LineSegments(waterChannelGeometry, waterChannelLinesMaterial);
    scene.add(waterChannelLines);
    sceneObjects.push(waterChannelLines);

    // 11. Ventilation shaft towers (tall cylinder stacks on roof)
    var ventilationGroup = new THREE.Group();
    var ventMaterial = new THREE.MeshPhongMaterial({ color: 0x707070 });

    for (var v = 0; v < 3; v++) {
      var ventGeometry = new THREE.CylinderGeometry(3, 3, 35, 16);
      var vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.position.set(-80 + v * 80, 60, 40);
      vent.name = 'vent';
      ventilationGroup.add(vent);
    }

    scene.add(ventilationGroup);
    sceneObjects.push(ventilationGroup);

    // 12. Sailor crew figures (box torso + sphere head + box legs, 6 crew)
    var crewGroup = new THREE.Group();

    for (var c = 0; c < 6; c++) {
      var sailorGroup = new THREE.Group();
      sailorGroup.name = 'sailor' + c;

      var torsoGeometry = new THREE.BoxGeometry(2, 5, 2);
      var torsoMaterial = new THREE.MeshPhongMaterial({ color: 0xff8c00 });
      var torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
      torso.position.y = 3;
      sailorGroup.add(torso);

      var headGeometry = new THREE.SphereGeometry(1.2, 16, 16);
      var headMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 7.5;
      sailorGroup.add(head);

      var legsGeometry = new THREE.BoxGeometry(1.5, 4, 1.5);
      var legsMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
      var legs = new THREE.Mesh(legsGeometry, legsMaterial);
      legs.position.y = 0.5;
      sailorGroup.add(legs);

      sailorGroup.position.set(-40 + c * 25, 2, -45 + Math.random() * 10);
      crewGroup.add(sailorGroup);
    }

    scene.add(crewGroup);
    sceneObjects.push(crewGroup);

    // 13. Mooring bollards (short fat cylinders)
    var bollardGroup = new THREE.Group();
    var bollardMaterial = new THREE.MeshPhongMaterial({ color: 0x3a3a3a });

    for (var b = 0; b < 4; b++) {
      var bollardGeometry = new THREE.CylinderGeometry(2.5, 2.5, 5, 16);
      var bollard = new THREE.Mesh(bollardGeometry, bollardMaterial);
      bollard.position.set(-80 + b * 55, 2.5, -25);
      bollardGroup.add(bollard);
    }

    scene.add(bollardGroup);
    sceneObjects.push(bollardGroup);

    // 14. Emergency periscope array (thin cylinders at angles)
    var periscopeGroup = new THREE.Group();
    var periscopeMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });

    for (var p = 0; p < 3; p++) {
      var periscopeGeometry = new THREE.CylinderGeometry(0.8, 0.8, 18, 16);
      var periscope = new THREE.Mesh(periscopeGeometry, periscopeMaterial);
      periscope.rotation.z = 0.3 + p * 0.2;
      periscope.position.set(-20 + p * 30, 10, 35);
      periscopeGroup.add(periscope);
    }

    scene.add(periscopeGroup);
    sceneObjects.push(periscopeGroup);

    // 15. Depth charge rack (box rack + sphere charges)
    var depthChargeGroup = new THREE.Group();

    var rackGeometry = new THREE.BoxGeometry(20, 15, 8);
    var rackMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
    var rack = new THREE.Mesh(rackGeometry, rackMaterial);
    rack.position.set(50, 10, 50);
    depthChargeGroup.add(rack);

    var chargesMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    for (var d = 0; d < 6; d++) {
      var chargeGeometry = new THREE.SphereGeometry(2, 16, 16);
      var charge = new THREE.Mesh(chargeGeometry, chargesMaterial);
      charge.position.set(50 - 8 + d * 3, 10 + 4, 50);
      depthChargeGroup.add(charge);
    }

    scene.add(depthChargeGroup);
    sceneObjects.push(depthChargeGroup);

    // 16. Radio mast (tall thin cylinder + LineSegments antenna wires)
    var mastGroup = new THREE.Group();

    var mastGeometry = new THREE.CylinderGeometry(0.6, 0.6, 40, 16);
    var mastMaterial = new THREE.MeshPhongMaterial({ color: 0x505050 });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.set(90, 25, 50);
    mastGroup.add(mast);

    var antennaPoints = [
      new THREE.Vector3(90, 45, 50),
      new THREE.Vector3(95, 35, 45),
      new THREE.Vector3(90, 45, 50),
      new THREE.Vector3(85, 35, 55)
    ];
    var antennaGeometry = new THREE.BufferGeometry().setFromPoints(antennaPoints);
    var antennaLinesMaterial = new THREE.LineBasicMaterial({ color: 0x505050 });
    var antennaLines = new THREE.LineSegments(antennaGeometry, antennaLinesMaterial);
    mastGroup.add(antennaLines);

    scene.add(mastGroup);
    sceneObjects.push(mastGroup);

    // 17. Debris/damage from recent airstrike (scattered box rubble)
    var debrisGroup = new THREE.Group();
    var debrisMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });

    for (var r = 0; r < 8; r++) {
      var debrisGeometry = new THREE.BoxGeometry(8 + Math.random() * 6, 4 + Math.random() * 3, 6 + Math.random() * 4);
      var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
      debris.position.set(-90 + Math.random() * 50, 3 + Math.random() * 2, -50 + Math.random() * 30);
      debris.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
      debrisGroup.add(debris);
    }

    scene.add(debrisGroup);
    sceneObjects.push(debrisGroup);

    // Add ambient lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    sceneObjects.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 80, 50);
    scene.add(directionalLight);
    sceneObjects.push(directionalLight);
  }

  function setupKeyBindings() {
    document.addEventListener('keydown', function(event) {
      if (event.key === 's' || event.key === 'S') {
        if (sKeyTime === null) {
          sKeyTime = Date.now();
        } else {
          var timeDiff = Date.now() - sKeyTime;
          if (timeDiff < 400) {
            sKeyTime = null;
          } else {
            sKeyTime = Date.now();
          }
        }
      } else if (event.key === 'b' || event.key === 'B') {
        if (sKeyTime !== null && (Date.now() - sKeyTime) < 400) {
          hudVisible = !hudVisible;
          sKeyTime = null;
        }
      } else {
        sKeyTime = null;
      }
    });

    window.addEventListener('blur', function() {
      sKeyTime = null;
    });
  }

  function update(delta) {
    time += delta;

    // Animate torpedo loading crane arm rotation
    var crane = scene.getObjectByName('crane');
    if (crane) {
      var craneArm = crane.getObjectByName('craneArm');
      if (craneArm) {
        craneArm.rotation.z = Math.sin(time * 0.3) * 0.3;
      }
    }

    // Animate ventilation fans spin
    scene.traverse(function(child) {
      if (child.name === 'vent') {
        child.rotation.y += 0.05;
      }
    });

    // Animate AA gun barrel tracking
    var aaGun = scene.getObjectByName('aaGun');
    if (aaGun) {
      var aaGunBarrel = aaGun.getObjectByName('aaGunBarrel');
      if (aaGunBarrel) {
        aaGunBarrel.rotation.y += 0.02;
      }
    }

    // Animate one sailor patrol walking back and forth
    var sailor0 = scene.getObjectByPropertyName('sailor0');
    scene.traverse(function(child) {
      if (child.name === 'sailor0') {
        child.position.x = -40 + Math.sin(time * 1.5) * 20;
      }
    });

    // Update HUD
    updateHUD();
  }

  function updateHUD() {
    if (!hudVisible) return;

    var canvas = document.getElementById('gameHUD');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'gameHUD';
      canvas.width = 400;
      canvas.height = 150;
      canvas.style.position = 'fixed';
      canvas.style.top = '10px';
      canvas.style.left = '10px';
      canvas.style.fontFamily = 'monospace';
      canvas.style.zIndex = '1000';
      canvas.style.pointerEvents = 'none';
      document.body.appendChild(canvas);
    }

    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('SUBMARINES DISABLED: ' + gameState.submarinesDisabled + '/2', 10, 30);
    ctx.fillText('TORPEDO STOCK DESTROYED: ' + gameState.torpedoStockDestroyed + '/8', 10, 60);
    ctx.fillText('CREW ELIMINATED: ' + gameState.crewEliminated + '/6', 10, 90);
    ctx.fillStyle = '#ffff00';
    ctx.font = '12px monospace';
    ctx.fillText('Press S+B to toggle HUD', 10, 120);
  }

  function reset() {
    // Remove all scene objects
    for (var i = 0; i < sceneObjects.length; i++) {
      var obj = sceneObjects[i];
      if (obj && obj.parent) {
        obj.parent.remove(obj);
      }
    }

    // Dispose geometries and materials
    scene.traverse(function(child) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          for (var m = 0; m < child.material.length; m++) {
            child.material[m].dispose();
          }
        } else {
          child.material.dispose();
        }
      }
    });

    sceneObjects = [];
    time = 0;
    sKeyTime = null;
    gameState.submarinesDisabled = 0;
    gameState.torpedoStockDestroyed = 0;
    gameState.crewEliminated = 0;

    var hudCanvas = document.getElementById('gameHUD');
    if (hudCanvas) {
      hudCanvas.parentNode.removeChild(hudCanvas);
    }

    createEnvironment();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
