window.AirshipBattle = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var spawnPoints = [];
  var propellerMeshes = [];
  var cloudWisps = [];
  var searchlight = null;
  var searchlightAngle = 0;
  var bombBayDoors = [];
  var grappleRopes = [];
  var enemyFigure = null;
  var envelopeScale = 1.0;
  var envelopeScaleDir = 0.001;
  var bombBayOpen = false;

  function createMaterial(color, shininess) {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.6,
      metalness: shininess || 0.2
    });
  }

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    meshes = [];
    spawnPoints = [];
    propellerMeshes = [];
    cloudWisps = [];
    grappleRopes = [];
    searchlightAngle = 0;
    envelopeScale = 1.0;
    bombBayOpen = false;

    var khaki = createMaterial(0xB8A040, 0.3);
    var darkWood = createMaterial(0x4A3000, 0.1);
    var brass = createMaterial(0xD4AF37, 0.8);
    var engineBlack = createMaterial(0x1a1a1a, 0.2);
    var cloudWhite = createMaterial(0xF5F5F5, 0.05);

    // Main hull gondola - cigar shaped body
    var hullGeom = new THREE.BoxGeometry(60, 8, 8);
    var hull = new THREE.Mesh(hullGeom, khaki);
    hull.position.set(0, 0, 0);
    hull.castShadow = true;
    hull.receiveShadow = true;
    scene.add(hull);
    meshes.push(hull);

    // Curved nose section
    var noseGeom = new THREE.BoxGeometry(8, 8, 8);
    var nose = new THREE.Mesh(noseGeom, khaki);
    nose.position.set(34, 0, 0);
    nose.castShadow = true;
    nose.receiveShadow = true;
    scene.add(nose);
    meshes.push(nose);

    // Hydrogen envelope - large elongated sphere above
    var envelopeGeom = new THREE.SphereGeometry(15, 32, 24);
    envelopeGeom.scale(2.2, 1.0, 0.8);
    searchlight = new THREE.Mesh(envelopeGeom, createMaterial(0xE8E8E8, 0.15));
    searchlight.position.set(0, 28, 0);
    searchlight.castShadow = true;
    searchlight.receiveShadow = true;
    scene.add(searchlight);
    meshes.push(searchlight);

    // Port engine nacelle
    var portEngineGeom = new THREE.CylinderGeometry(4, 4, 14, 16);
    var portEngine = new THREE.Mesh(portEngineGeom, engineBlack);
    portEngine.position.set(-12, 4, -8);
    portEngine.rotationZ = Math.PI / 2;
    portEngine.castShadow = true;
    portEngine.receiveShadow = true;
    scene.add(portEngine);
    meshes.push(portEngine);

    // Starboard engine nacelle
    var starboardEngineGeom = new THREE.CylinderGeometry(4, 4, 14, 16);
    var starboardEngine = new THREE.Mesh(starboardEngineGeom, engineBlack);
    starboardEngine.position.set(-12, 4, 8);
    starboardEngine.rotationZ = Math.PI / 2;
    starboardEngine.castShadow = true;
    starboardEngine.receiveShadow = true;
    scene.add(starboardEngine);
    meshes.push(starboardEngine);

    // Port propeller blades
    var propGeom = new THREE.BoxGeometry(0.8, 12, 0.2);
    var portProp1 = new THREE.Mesh(propGeom, engineBlack);
    portProp1.position.set(-20, 4, -8);
    portProp1.castShadow = true;
    portProp1.receiveShadow = true;
    scene.add(portProp1);
    meshes.push(portProp1);
    propellerMeshes.push({ mesh: portProp1, speed: 0.15 });

    var portProp2 = new THREE.Mesh(propGeom, engineBlack);
    portProp2.position.set(-20, 4, -8);
    portProp2.rotationZ = Math.PI / 2;
    portProp2.castShadow = true;
    portProp2.receiveShadow = true;
    scene.add(portProp2);
    meshes.push(portProp2);
    propellerMeshes.push({ mesh: portProp2, speed: 0.15 });

    // Starboard propeller blades
    var starboardProp1 = new THREE.Mesh(propGeom, engineBlack);
    starboardProp1.position.set(-20, 4, 8);
    starboardProp1.castShadow = true;
    starboardProp1.receiveShadow = true;
    scene.add(starboardProp1);
    meshes.push(starboardProp1);
    propellerMeshes.push({ mesh: starboardProp1, speed: 0.15 });

    var starboardProp2 = new THREE.Mesh(propGeom, engineBlack);
    starboardProp2.position.set(-20, 4, 8);
    starboardProp2.rotationZ = Math.PI / 2;
    starboardProp2.castShadow = true;
    starboardProp2.receiveShadow = true;
    scene.add(starboardProp2);
    meshes.push(starboardProp2);
    propellerMeshes.push({ mesh: starboardProp2, speed: 0.15 });

    // Observation deck railings (forward section)
    var railGeom = new THREE.BoxGeometry(12, 0.5, 0.3);
    var railing1 = new THREE.Mesh(railGeom, brass);
    railing1.position.set(20, 5.5, 6);
    railing1.castShadow = true;
    railing1.receiveShadow = true;
    scene.add(railing1);
    meshes.push(railing1);

    var railing2 = new THREE.Mesh(railGeom, brass);
    railing2.position.set(20, 5.5, -6);
    railing2.castShadow = true;
    railing2.receiveShadow = true;
    scene.add(railing2);
    meshes.push(railing2);

    // Railing posts (LineSegments)
    var railPostGeom = new THREE.BufferGeometry();
    var railPostPositions = new Float32Array([
      20, 4, 6,    20, 5.5, 6,
      20, 4, -6,   20, 5.5, -6,
      16, 4, 6,    16, 5.5, 6,
      16, 4, -6,   16, 5.5, -6
    ]);
    railPostGeom.setAttribute('position', new THREE.BufferAttribute(railPostPositions, 3));
    var railLines = new THREE.LineSegments(railPostGeom, new THREE.LineBasicMaterial({ color: 0xD4AF37, linewidth: 2 }));
    scene.add(railLines);
    meshes.push(railLines);

    // Crew quarters compartments
    var crewGeom = new THREE.BoxGeometry(8, 5, 6);
    var crewQuarters = new THREE.Mesh(crewGeom, darkWood);
    crewQuarters.position.set(10, 2, 0);
    crewQuarters.castShadow = true;
    crewQuarters.receiveShadow = true;
    scene.add(crewQuarters);
    meshes.push(crewQuarters);

    // Cargo hold
    var cargoGeom = new THREE.BoxGeometry(18, 6, 10);
    var cargoHold = new THREE.Mesh(cargoGeom, darkWood);
    cargoHold.position.set(-8, -2, 0);
    cargoHold.castShadow = true;
    cargoHold.receiveShadow = true;
    scene.add(cargoHold);
    meshes.push(cargoHold);

    // Cargo crates
    var crateGeom = new THREE.BoxGeometry(3, 3, 3);
    var crate1 = new THREE.Mesh(crateGeom, khaki);
    crate1.position.set(-4, -1, 2);
    crate1.castShadow = true;
    crate1.receiveShadow = true;
    scene.add(crate1);
    meshes.push(crate1);

    var crate2 = new THREE.Mesh(crateGeom, khaki);
    crate2.position.set(-10, -1, -2);
    crate2.castShadow = true;
    crate2.receiveShadow = true;
    scene.add(crate2);
    meshes.push(crate2);

    // Bridge control room
    var bridgeGeom = new THREE.BoxGeometry(8, 6, 6);
    var bridge = new THREE.Mesh(bridgeGeom, createMaterial(0x2C1810, 0.1));
    bridge.position.set(28, 4, 0);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    scene.add(bridge);
    meshes.push(bridge);

    // Instrument panel
    var panelGeom = new THREE.BoxGeometry(6, 4, 0.5);
    var panel = new THREE.Mesh(panelGeom, createMaterial(0x1a1a1a, 0.3));
    panel.position.set(28, 3, 3);
    panel.castShadow = true;
    panel.receiveShadow = true;
    scene.add(panel);
    meshes.push(panel);

    // Mooring rope cleats
    var cleatGeom = new THREE.CylinderGeometry(0.8, 0.8, 2, 8);
    var cleat1 = new THREE.Mesh(cleatGeom, brass);
    cleat1.position.set(15, -3, 8);
    cleat1.castShadow = true;
    cleat1.receiveShadow = true;
    scene.add(cleat1);
    meshes.push(cleat1);

    var cleat2 = new THREE.Mesh(cleatGeom, brass);
    cleat2.position.set(0, -3, -8);
    cleat2.castShadow = true;
    cleat2.receiveShadow = true;
    scene.add(cleat2);
    meshes.push(cleat2);

    // Mooring ropes (LineSegments)
    var ropeGeom = new THREE.BufferGeometry();
    var ropePositions = new Float32Array([
      15, -3, 8,      10, -15, 8,
      0, -3, -8,      -5, -15, -8
    ]);
    ropeGeom.setAttribute('position', new THREE.BufferAttribute(ropePositions, 3));
    var ropes = new THREE.LineSegments(ropeGeom, new THREE.LineBasicMaterial({ color: 0x8B7355, linewidth: 3 }));
    scene.add(ropes);
    meshes.push(ropes);

    // Boarding grapple hooks
    var hookGeom = new THREE.CylinderGeometry(0.6, 0.6, 3, 8);
    var hook1 = new THREE.Mesh(hookGeom, brass);
    hook1.position.set(5, 12, 10);
    hook1.rotationZ = Math.PI / 4;
    hook1.castShadow = true;
    hook1.receiveShadow = true;
    scene.add(hook1);
    meshes.push(hook1);

    var hook2 = new THREE.Mesh(hookGeom, brass);
    hook2.position.set(-10, 15, -10);
    hook2.rotationZ = Math.PI / 3;
    hook2.castShadow = true;
    hook2.receiveShadow = true;
    scene.add(hook2);
    meshes.push(hook2);

    // Grapple ropes (LineSegments)
    var grappleGeom = new THREE.BufferGeometry();
    var grapplePositions = new Float32Array([
      5, 12, 10,      5, 25, 10,
      -10, 15, -10,   -10, 28, -10
    ]);
    grappleGeom.setAttribute('position', new THREE.BufferAttribute(grapplePositions, 3));
    var grappleLines = new THREE.LineSegments(grappleGeom, new THREE.LineBasicMaterial({ color: 0x696969, linewidth: 2 }));
    scene.add(grappleLines);
    meshes.push(grappleLines);
    grappleRopes.push({ mesh: grappleLines, swingAngle: 0, swingSpeed: 0.03 });

    // Anti-aircraft gun mount
    var gunBaseGeom = new THREE.BoxGeometry(4, 2, 4);
    var gunBase = new THREE.Mesh(gunBaseGeom, brass);
    gunBase.position.set(-25, 6, 0);
    gunBase.castShadow = true;
    gunBase.receiveShadow = true;
    scene.add(gunBase);
    meshes.push(gunBase);

    var barrelGeom = new THREE.CylinderGeometry(0.8, 0.8, 12, 12);
    var barrel = new THREE.Mesh(barrelGeom, engineBlack);
    barrel.position.set(-25, 10, 0);
    barrel.rotationZ = Math.PI / 6;
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    scene.add(barrel);
    meshes.push(barrel);

    // Gas valve control wheels
    var wheelGeom = new THREE.CylinderGeometry(2, 2, 0.8, 12);
    var valve1 = new THREE.Mesh(wheelGeom, brass);
    valve1.position.set(-5, 6, 4);
    valve1.rotationZ = Math.PI / 2;
    valve1.castShadow = true;
    valve1.receiveShadow = true;
    scene.add(valve1);
    meshes.push(valve1);

    var valve2 = new THREE.Mesh(wheelGeom, brass);
    valve2.position.set(5, 6, -4);
    valve2.rotationZ = Math.PI / 2;
    valve2.castShadow = true;
    valve2.receiveShadow = true;
    scene.add(valve2);
    meshes.push(valve2);

    // Cloud wisps (passing by)
    for (var i = 0; i < 4; i++) {
      var cloudGeom = new THREE.SphereGeometry(4, 8, 8);
      cloudGeom.scale(2, 0.8, 2);
      var cloud = new THREE.Mesh(cloudGeom, cloudWhite);
      cloud.position.set(-40 - i * 25, 5 + i * 3, 15 - i * 5);
      cloud.castShadow = true;
      cloud.receiveShadow = true;
      scene.add(cloud);
      meshes.push(cloud);
      cloudWisps.push({
        mesh: cloud,
        speed: 0.02 + i * 0.005,
        startX: cloud.position.x
      });
    }

    // Searchlight beam (sphere for illumination effect)
    var beamGeom = new THREE.SphereGeometry(2, 16, 16);
    var beam = new THREE.Mesh(beamGeom, new THREE.MeshStandardMaterial({
      color: 0xFFFF99,
      emissive: 0xFFFF66,
      roughness: 0.5,
      metalness: 0.0
    }));
    beam.position.set(25, 8, 10);
    beam.castShadow = true;
    beam.receiveShadow = true;
    scene.add(beam);
    meshes.push(beam);

    // Bomb bay doors (opening panels)
    var doorGeom = new THREE.BoxGeometry(10, 6, 0.4);
    var doorLeft = new THREE.Mesh(doorGeom, khaki);
    doorLeft.position.set(-10, -5, -6);
    doorLeft.castShadow = true;
    doorLeft.receiveShadow = true;
    scene.add(doorLeft);
    meshes.push(doorLeft);
    bombBayDoors.push({ mesh: doorLeft, isLeft: true });

    var doorRight = new THREE.Mesh(doorGeom, khaki);
    doorRight.position.set(-10, -5, 6);
    doorRight.castShadow = true;
    doorRight.receiveShadow = true;
    scene.add(doorRight);
    meshes.push(doorRight);
    bombBayDoors.push({ mesh: doorRight, isLeft: false });

    // Enemy boarding figure (SphereGeometry)
    var headGeom = new THREE.SphereGeometry(1.5, 16, 16);
    var head = new THREE.Mesh(headGeom, createMaterial(0xE0AA7E, 0.1));
    head.position.set(8, 20, 8);
    head.castShadow = true;
    head.receiveShadow = true;
    scene.add(head);
    meshes.push(head);
    enemyFigure = head;

    var bodyGeom = new THREE.BoxGeometry(2, 4, 1.5);
    var body = new THREE.Mesh(bodyGeom, createMaterial(0x333333, 0.2));
    body.position.set(8, 16, 8);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    meshes.push(body);

    // Spawn points
    spawnPoints = [
      { name: 'deck', pos: new THREE.Vector3(10, 6, 0) },
      { name: 'bridge', pos: new THREE.Vector3(28, 6, 0) },
      { name: 'cargo', pos: new THREE.Vector3(-8, 2, 0) },
      { name: 'engine', pos: new THREE.Vector3(-12, 6, 8) },
      { name: 'observation', pos: new THREE.Vector3(20, 8, 0) }
    ];
  }

  function update(delta) {
    // Rotate propellers
    for (var i = 0; i < propellerMeshes.length; i++) {
      propellerMeshes[i].mesh.rotationX += propellerMeshes[i].speed;
    }

    // Drift cloud wisps
    for (var i = 0; i < cloudWisps.length; i++) {
      var cloud = cloudWisps[i];
      cloud.mesh.position.x += cloud.speed;
      if (cloud.mesh.position.x > 50) {
        cloud.mesh.position.x = -60;
      }
    }

    // Rotate searchlight beam
    if (searchlight) {
      searchlightAngle += 0.005;
      var beamRadius = 12;
      var beamMeshes = scene.children.filter(function(obj) {
        return obj.geometry && obj.geometry.type === 'SphereGeometry' && obj.position.y === 8;
      });
      for (var i = 0; i < beamMeshes.length; i++) {
        if (beamMeshes[i] !== searchlight && beamMeshes[i].position.z > 5) {
          beamMeshes[i].position.x = 25 + Math.cos(searchlightAngle) * beamRadius;
          beamMeshes[i].position.z = 10 + Math.sin(searchlightAngle) * beamRadius;
        }
      }
    }

    // Open/close bomb bay doors
    bombBayOpen = (Math.floor(performance.now() / 2000) % 2) === 0;
    for (var i = 0; i < bombBayDoors.length; i++) {
      var door = bombBayDoors[i];
      if (bombBayOpen) {
        if (door.isLeft) {
          door.mesh.position.z -= 0.05;
        } else {
          door.mesh.position.z += 0.05;
        }
      } else {
        if (door.isLeft) {
          door.mesh.position.z = -6;
        } else {
          door.mesh.position.z = 6;
        }
      }
    }

    // Sway grapple ropes
    for (var i = 0; i < grappleRopes.length; i++) {
      var rope = grappleRopes[i];
      rope.swingAngle += rope.swingSpeed;
      if (rope.mesh.geometry.attributes.position) {
        var positions = rope.mesh.geometry.attributes.position.array;
        if (i === 0) {
          positions[3] = 5 + Math.sin(rope.swingAngle) * 2;
        } else {
          positions[3] = -10 + Math.sin(rope.swingAngle) * 2;
        }
        rope.mesh.geometry.attributes.position.needsUpdate = true;
      }
    }

    // Swell hydrogen envelope
    envelopeScale += envelopeScaleDir;
    if (envelopeScale > 1.05 || envelopeScale < 0.95) {
      envelopeScaleDir *= -1;
    }
    if (searchlight) {
      searchlight.scale.set(envelopeScale, envelopeScale, envelopeScale);
    }

    // Swing enemy figure on rope
    if (enemyFigure) {
      var swingAmount = Math.sin(performance.now() / 1000) * 3;
      enemyFigure.position.x = 8 + swingAmount;
    }

    // Rotate valve wheels
    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh.geometry && mesh.geometry.type === 'CylinderGeometry' &&
          (mesh.position.x === -5 || mesh.position.x === 5) &&
          mesh.position.y === 6) {
        mesh.rotationX += 0.02;
      }
    }
  }

  function reset() {
    for (var i = 0; i < meshes.length; i++) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    spawnPoints = [];
    propellerMeshes = [];
    cloudWisps = [];
    grappleRopes = [];
    bombBayDoors = [];
    enemyFigure = null;
    searchlight = null;
    searchlightAngle = 0;
    envelopeScale = 1.0;
    envelopeScaleDir = 0.001;
    bombBayOpen = false;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() { return spawnPoints; }
  };
}());
