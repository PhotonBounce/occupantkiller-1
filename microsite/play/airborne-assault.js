window.AirborneAssault = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var dzObjects = [];
  var parachuteCanopies = [];
  var fireParticles = [];
  var tracerParticles = [];
  var swayingObjects = [];
  var driftingObjects = [];

  var baseTime = 0;

  function init(inputScene, inputCamera) {
    scene = inputScene;
    camera = inputCamera;
    dzObjects = [];
    parachuteCanopies = [];
    fireParticles = [];
    tracerParticles = [];
    swayingObjects = [];
    driftingObjects = [];
    baseTime = 0;

    // Terrain: farmland base layer
    var terrainGeometry = new THREE.BoxGeometry(300, 0.5, 300);
    var terrainMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a4a3a,
      roughness: 0.9,
      metalness: 0.0
    });
    var terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.receiveShadow = true;
    scene.add(terrain);
    dzObjects.push(terrain);

    // Farmland field patches
    for (var i = 0; i < 6; i++) {
      var fieldGeometry = new THREE.BoxGeometry(80, 0.3, 100);
      var fieldMaterial = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x3d7a2f : 0x4a8a3f,
        roughness: 0.95,
        metalness: 0.0
      });
      var field = new THREE.Mesh(fieldGeometry, fieldMaterial);
      field.position.set((i % 3) * 100 - 100, 0.1, Math.floor(i / 3) * 120 - 100);
      field.receiveShadow = true;
      scene.add(field);
      dzObjects.push(field);
    }

    // Deployed parachute canopies on ground
    for (var p = 0; p < 4; p++) {
      var parachuteX = Math.cos(p * Math.PI / 2) * 60;
      var parachuteZ = Math.sin(p * Math.PI / 2) * 60;

      // Canopy dome (hemisphere)
      var canopyGeometry = new THREE.SphereGeometry(8, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      var canopyMaterial = new THREE.MeshStandardMaterial({
        color: p % 2 === 0 ? 0xff4444 : 0xcccccc,
        roughness: 0.6,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
      canopy.position.set(parachuteX, 0.5, parachuteZ);
      canopy.castShadow = true;
      canopy.receiveShadow = true;
      scene.add(canopy);
      dzObjects.push(canopy);
      parachuteCanopies.push({ mesh: canopy, baseX: parachuteX, baseZ: parachuteZ });

      // Shroud lines (LineSegments)
      var shroudPoints = [];
      for (var s = 0; s < 8; s++) {
        var angle = s * Math.PI / 4;
        var sx = parachuteX + Math.cos(angle) * 8;
        var sz = parachuteZ + Math.sin(angle) * 8;
        shroudPoints.push(new THREE.Vector3(sx, 8.5, sz));
        shroudPoints.push(new THREE.Vector3(sx, 0, sz));
      }
      var shroudGeometry = new THREE.BufferGeometry().setFromPoints(shroudPoints);
      var shroudMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 1 });
      var shroudLines = new THREE.LineSegments(shroudGeometry, shroudMaterial);
      scene.add(shroudLines);
      dzObjects.push(shroudLines);
    }

    // Equipment air-drop containers (horizontal cylinders)
    var containerPositions = [
      { x: -40, z: -50 },
      { x: 30, z: 40 },
      { x: -60, z: 20 }
    ];
    for (var c = 0; c < containerPositions.length; c++) {
      var containerGeometry = new THREE.CylinderGeometry(3, 3, 15, 8, 4);
      var containerMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.7,
        metalness: 0.8
      });
      var container = new THREE.Mesh(containerGeometry, containerMaterial);
      container.rotation.z = Math.PI / 2;
      container.position.set(containerPositions[c].x, 1.5, containerPositions[c].z);
      container.castShadow = true;
      container.receiveShadow = true;
      scene.add(container);
      dzObjects.push(container);
    }

    // Weapons bundle crates
    var cratePositions = [
      { x: 50, z: -30 },
      { x: -80, z: 60 },
      { x: 20, z: 70 }
    ];
    for (var cr = 0; cr < cratePositions.length; cr++) {
      var crateGeometry = new THREE.BoxGeometry(4, 3, 4);
      var crateMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b6914,
        roughness: 0.8,
        metalness: 0.2
      });
      var crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(cratePositions[cr].x, 1.5, cratePositions[cr].z);
      crate.castShadow = true;
      crate.receiveShadow = true;
      scene.add(crate);
      dzObjects.push(crate);
    }

    // Burning aircraft fuselage section
    var fuselageGeometry = new THREE.BoxGeometry(8, 4, 25);
    var fuselageMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.9,
      metalness: 0.6
    });
    var fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
    fuselage.position.set(-90, 2, -80);
    fuselage.rotation.z = 0.3;
    fuselage.castShadow = true;
    fuselage.receiveShadow = true;
    scene.add(fuselage);
    dzObjects.push(fuselage);

    // Fire effect particles (explosions/burning debris)
    for (var f = 0; f < 12; f++) {
      var fireGeometry = new THREE.SphereGeometry(0.8, 4, 4);
      var fireColor = f % 3 === 0 ? 0xff4400 : (f % 3 === 1 ? 0xffaa00 : 0xffff00);
      var fireMaterial = new THREE.MeshStandardMaterial({
        color: fireColor,
        emissive: fireColor,
        emissiveIntensity: 0.8,
        roughness: 0.5
      });
      var fireMesh = new THREE.Mesh(fireGeometry, fireMaterial);
      var offsetX = (Math.random() - 0.5) * 6;
      var offsetZ = (Math.random() - 0.5) * 6;
      var offsetY = Math.random() * 4;
      fireMesh.position.set(-90 + offsetX, 2 + offsetY, -80 + offsetZ);
      fireMesh.castShadow = true;
      scene.add(fireMesh);
      dzObjects.push(fireMesh);
      fireParticles.push({
        mesh: fireMesh,
        baseX: -90 + offsetX,
        baseY: 2 + offsetY,
        baseZ: -80 + offsetZ,
        phase: Math.random() * Math.PI * 2
      });
    }

    // AA gun emplacement
    var emplacementGeometry = new THREE.BoxGeometry(20, 1, 20);
    var emplacementMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b5d47,
      roughness: 0.9
    });
    var emplacement = new THREE.Mesh(emplacementGeometry, emplacementMaterial);
    emplacement.position.set(100, 0.5, 80);
    emplacement.receiveShadow = true;
    scene.add(emplacement);
    dzObjects.push(emplacement);

    // AA gun barrel (cylinder)
    var barrelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
    var barrelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.4
    });
    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(100, 3, 80);
    barrel.rotation.z = 0.4;
    barrel.castShadow = true;
    scene.add(barrel);
    dzObjects.push(barrel);
    swayingObjects.push({ mesh: barrel, baseRotZ: 0.4, amplitude: 0.15 });

    // Enemy trench system
    var trenchGeometry = new THREE.BoxGeometry(60, 2, 3);
    var trenchMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3f35,
      roughness: 0.95
    });
    var trench = new THREE.Mesh(trenchGeometry, trenchMaterial);
    trench.position.set(70, 0.8, -100);
    trench.castShadow = true;
    trench.receiveShadow = true;
    scene.add(trench);
    dzObjects.push(trench);

    // Dirt berms
    for (var d = 0; d < 2; d++) {
      var bermGeometry = new THREE.BoxGeometry(60, 1.5, 2);
      var bermMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a4a3a,
        roughness: 0.95
      });
      var berm = new THREE.Mesh(bermGeometry, bermMaterial);
      berm.position.set(70, 0.8 + (d === 0 ? -3 : 3), -100);
      berm.castShadow = true;
      berm.receiveShadow = true;
      scene.add(berm);
      dzObjects.push(berm);
    }

    // Farm stone house
    var houseGeometry = new THREE.BoxGeometry(12, 8, 15);
    var houseMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7d6b,
      roughness: 0.8
    });
    var house = new THREE.Mesh(houseGeometry, houseMaterial);
    house.position.set(-120, 4, 40);
    house.castShadow = true;
    house.receiveShadow = true;
    scene.add(house);
    dzObjects.push(house);

    // Tile roof (cone)
    var roofGeometry = new THREE.ConeGeometry(9, 5, 4);
    var roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.7
    });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-120, 10, 40);
    roof.castShadow = true;
    scene.add(roof);
    dzObjects.push(roof);

    // Barn
    var barnGeometry = new THREE.BoxGeometry(25, 12, 20);
    var barnMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.85
    });
    var barn = new THREE.Mesh(barnGeometry, barnMaterial);
    barn.position.set(110, 6, 30);
    barn.castShadow = true;
    barn.receiveShadow = true;
    scene.add(barn);
    dzObjects.push(barn);

    // Hedgerow cover (low dense wall)
    var hedgeGeometry = new THREE.BoxGeometry(80, 2.5, 2);
    var hedgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5a2d,
      roughness: 0.9
    });
    var hedge = new THREE.Mesh(hedgeGeometry, hedgeMaterial);
    hedge.position.set(-40, 1.2, -120);
    hedge.castShadow = true;
    hedge.receiveShadow = true;
    scene.add(hedge);
    dzObjects.push(hedge);

    // Stone wall barriers
    for (var w = 0; w < 3; w++) {
      var wallGeometry = new THREE.BoxGeometry(25, 2, 1);
      var wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a5a5a,
        roughness: 0.95
      });
      var wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(-60 + w * 50, 1, 80);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
      dzObjects.push(wall);
    }

    // Signaling panel (bright orange flat)
    var panelGeometry = new THREE.BoxGeometry(8, 0.2, 8);
    var panelMaterial = new THREE.MeshStandardMaterial({
      color: 0xff8800,
      emissive: 0xff8800,
      emissiveIntensity: 0.3,
      roughness: 0.6
    });
    var panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(50, 0.5, -70);
    panel.castShadow = true;
    panel.receiveShadow = true;
    scene.add(panel);
    dzObjects.push(panel);

    // Medical collection point (tent + cross)
    var tentGeometry = new THREE.ConeGeometry(5, 6, 4);
    var tentMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.7
    });
    var tent = new THREE.Mesh(tentGeometry, tentMaterial);
    tent.position.set(-50, 3, 0);
    tent.castShadow = true;
    tent.receiveShadow = true;
    scene.add(tent);
    dzObjects.push(tent);

    // Medical cross marker (white cross)
    var crossH = new THREE.BoxGeometry(4, 0.3, 1);
    var crossMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.6
    });
    var crossHmesh = new THREE.Mesh(crossH, crossMaterial);
    crossHmesh.position.set(-50, 6.5, 0);
    scene.add(crossHmesh);
    dzObjects.push(crossHmesh);

    var crossV = new THREE.BoxGeometry(1, 0.3, 4);
    var crossVmesh = new THREE.Mesh(crossV, crossMaterial);
    crossVmesh.position.set(-50, 6.5, 0);
    scene.add(crossVmesh);
    dzObjects.push(crossVmesh);

    // Radio operator position (equipment box + antenna)
    var radioGeometry = new THREE.BoxGeometry(2, 1.5, 2);
    var radioMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.6,
      roughness: 0.6
    });
    var radio = new THREE.Mesh(radioGeometry, radioMaterial);
    radio.position.set(40, 0.8, 60);
    radio.castShadow = true;
    radio.receiveShadow = true;
    scene.add(radio);
    dzObjects.push(radio);

    // Radio antenna (cylinder)
    var antennaGeometry = new THREE.CylinderGeometry(0.2, 0.2, 8, 6);
    var antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.7
    });
    var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(40, 5, 60);
    antenna.castShadow = true;
    scene.add(antenna);
    dzObjects.push(antenna);
    swayingObjects.push({ mesh: antenna, baseRotZ: 0, amplitude: 0.08 });

    // Cratered impact holes
    for (var h = 0; h < 5; h++) {
      var craterGeometry = new THREE.SphereGeometry(5, 8, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
      var craterMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a3f35,
        roughness: 0.95
      });
      var crater = new THREE.Mesh(craterGeometry, craterMaterial);
      var craterX = (Math.random() - 0.5) * 200;
      var craterZ = (Math.random() - 0.5) * 200;
      crater.position.set(craterX, 0, craterZ);
      crater.castShadow = true;
      crater.receiveShadow = true;
      scene.add(crater);
      dzObjects.push(crater);
    }

    // Perimeter markers (stake flags)
    for (var m = 0; m < 8; m++) {
      var angle = m * Math.PI / 4;
      var markerX = Math.cos(angle) * 140;
      var markerZ = Math.sin(angle) * 140;

      var stakeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 4);
      var stakeMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a5a5a,
        metalness: 0.5
      });
      var stake = new THREE.Mesh(stakeGeometry, stakeMaterial);
      stake.position.set(markerX, 1.5, markerZ);
      stake.castShadow = true;
      scene.add(stake);
      dzObjects.push(stake);

      var flagGeometry = new THREE.BoxGeometry(2, 1, 0.2);
      var flagMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        roughness: 0.6
      });
      var flag = new THREE.Mesh(flagGeometry, flagMaterial);
      flag.position.set(markerX + 1.2, 3, markerZ);
      flag.castShadow = true;
      scene.add(flag);
      dzObjects.push(flag);
    }

    // Abandoned farm equipment
    var plowGeometry = new THREE.BoxGeometry(3, 1, 6);
    var plowMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.7,
      roughness: 0.5
    });
    var plow = new THREE.Mesh(plowGeometry, plowMaterial);
    plow.position.set(80, 0.7, -60);
    plow.rotation.y = 0.5;
    plow.castShadow = true;
    plow.receiveShadow = true;
    scene.add(plow);
    dzObjects.push(plow);

    var tractorGeometry = new THREE.BoxGeometry(4, 3, 8);
    var tractorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b0000,
      metalness: 0.6,
      roughness: 0.6
    });
    var tractor = new THREE.Mesh(tractorGeometry, tractorMaterial);
    tractor.position.set(-100, 1.5, -40);
    tractor.castShadow = true;
    tractor.receiveShadow = true;
    scene.add(tractor);
    dzObjects.push(tractor);

    // Initialize tracer fire particles
    for (var t = 0; t < 8; t++) {
      var tracerGeometry = new THREE.SphereGeometry(0.3, 3, 3);
      var tracerMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.9
      });
      var tracerMesh = new THREE.Mesh(tracerGeometry, tracerMaterial);
      tracerMesh.position.set(100, 10, 80);
      scene.add(tracerMesh);
      dzObjects.push(tracerMesh);
      tracerParticles.push({
        mesh: tracerMesh,
        startX: 100,
        startY: 10,
        startZ: 80,
        vx: (Math.random() - 0.5) * 80,
        vy: -40 - Math.random() * 30,
        vz: (Math.random() - 0.5) * 80,
        life: 0
      });
    }
  }

  function update(delta) {
    baseTime += delta;

    // Update parachute canopy gentle drift and settle
    for (var p = 0; p < parachuteCanopies.length; p++) {
      var para = parachuteCanopies[p];
      var driftAmount = Math.sin(baseTime + p) * 0.3;
      para.mesh.position.x = para.baseX + driftAmount;
      para.mesh.position.z = para.baseZ + Math.sin(baseTime * 0.7 + p * 0.5) * 0.2;
    }

    // Update fire flicker
    for (var f = 0; f < fireParticles.length; f++) {
      var fire = fireParticles[f];
      var flicker = 0.2 + Math.sin(baseTime * 3 + fire.phase) * 0.1;
      fire.mesh.position.y = fire.baseY + flicker;
      fire.mesh.scale.set(1 + Math.sin(baseTime * 2 + fire.phase) * 0.2, 1 + Math.sin(baseTime * 2 + fire.phase) * 0.2, 1);
    }

    // Update tracer fire particles
    for (var tr = 0; tr < tracerParticles.length; tr++) {
      var tracer = tracerParticles[tr];
      tracer.life += delta;

      if (tracer.life > 0.8) {
        tracer.life = 0;
        tracer.mesh.position.set(tracer.startX, tracer.startY, tracer.startZ);
      } else {
        tracer.mesh.position.x += tracer.vx * delta;
        tracer.mesh.position.y += tracer.vy * delta;
        tracer.mesh.position.z += tracer.vz * delta;
        var opacity = 1 - (tracer.life / 0.8);
        tracer.mesh.material.opacity = opacity;
      }
    }

    // Update swaying objects (antenna, AA barrel)
    for (var s = 0; s < swayingObjects.length; s++) {
      var sway = swayingObjects[s];
      sway.mesh.rotation.z = sway.baseRotZ + Math.sin(baseTime + s) * sway.amplitude;
    }
  }

  function reset() {
    baseTime = 0;
    for (var i = 0; i < dzObjects.length; i++) {
      scene.remove(dzObjects[i]);
    }
    dzObjects = [];
    parachuteCanopies = [];
    fireParticles = [];
    tracerParticles = [];
    swayingObjects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
