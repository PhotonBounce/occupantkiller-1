window.TriageZone = (function() {
  'use strict';

  var scene, camera;
  var animatedObjects = [];
  var pickupItems = [];

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    animatedObjects = [];
    pickupItems = [];

    buildTerrain();
    buildMedicalTents();
    buildStretchers();
    buildPlasmaHangers();
    buildAmbulanceBarricades();
    buildSurgeryStation();
    buildMorphineCrates();
    buildScatterPacks();
  }

  function buildTerrain() {
    var groundGeom = new THREE.BoxGeometry(100, 0.5, 100);
    var groundMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 });
    var ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.y = -0.25;
    ground.castShadow = true;
    ground.receiveShadow = true;
    scene.add(ground);

    var rubbleCount = 8;
    for (var i = 0; i < rubbleCount; i++) {
      var rubbleGeom = new THREE.BoxGeometry(
        2 + Math.random() * 3,
        1 + Math.random() * 2,
        2 + Math.random() * 3
      );
      var rubbleMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.9 });
      var rubble = new THREE.Mesh(rubbleGeom, rubbleMat);
      rubble.position.set(
        (Math.random() - 0.5) * 80,
        0.75,
        (Math.random() - 0.5) * 80
      );
      rubble.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
      rubble.castShadow = true;
      rubble.receiveShadow = true;
      scene.add(rubble);
    }
  }

  function buildMedicalTents() {
    var tentCount = 4;
    var positions = [
      [-20, 0, -20],
      [20, 0, -20],
      [-20, 0, 20],
      [20, 0, 20]
    ];

    for (var i = 0; i < tentCount; i++) {
      var pos = positions[i];
      createTentFrame(pos[0], pos[1], pos[2]);
    }
  }

  function createTentFrame(x, y, z) {
    var points = [
      new THREE.Vector3(-6, 0, -6),
      new THREE.Vector3(6, 0, -6),
      new THREE.Vector3(6, 0, 6),
      new THREE.Vector3(-6, 0, 6),
      new THREE.Vector3(-6, 4, -4),
      new THREE.Vector3(6, 4, -4),
      new THREE.Vector3(6, 4, 4),
      new THREE.Vector3(-6, 4, 4),
      new THREE.Vector3(0, 6, 0)
    ];

    var lineGeom = new THREE.BufferGeometry().setFromPoints(points);
    var lineMat = new THREE.LineBasicMaterial({ color: 0xff6600, linewidth: 2 });
    var lines = new THREE.LineSegments(lineGeom, lineMat);

    var indices = [
      0, 1, 1, 2, 2, 3, 3, 0,
      4, 5, 5, 6, 6, 7, 7, 4,
      0, 4, 1, 5, 2, 6, 3, 7,
      4, 8, 5, 8, 6, 8, 7, 8
    ];

    var indexedGeom = new THREE.BufferGeometry();
    indexedGeom.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array(points.flatMap(p => [p.x, p.y, p.z])),
      3
    ));
    indexedGeom.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));

    var tentFrame = new THREE.LineSegments(indexedGeom, lineMat);
    tentFrame.position.set(x, y, z);
    scene.add(tentFrame);
  }

  function buildStretchers() {
    var stretcherCount = 6;
    for (var i = 0; i < stretcherCount; i++) {
      var stretcher = new THREE.Group();
      var legGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.5, 8);
      var legMat = new THREE.MeshStandardMaterial({ color: 0x444444 });

      var leg1 = new THREE.Mesh(legGeom, legMat);
      leg1.position.set(-2, 0.25, -1);
      leg1.castShadow = true;
      leg1.receiveShadow = true;
      stretcher.add(leg1);

      var leg2 = new THREE.Mesh(legGeom, legMat);
      leg2.position.set(2, 0.25, -1);
      leg2.castShadow = true;
      leg2.receiveShadow = true;
      stretcher.add(leg2);

      var leg3 = new THREE.Mesh(legGeom, legMat);
      leg3.position.set(-2, 0.25, 1);
      leg3.castShadow = true;
      leg3.receiveShadow = true;
      stretcher.add(leg3);

      var leg4 = new THREE.Mesh(legGeom, legMat);
      leg4.position.set(2, 0.25, 1);
      leg4.castShadow = true;
      leg4.receiveShadow = true;
      stretcher.add(leg4);

      var bedGeom = new THREE.BoxGeometry(4.5, 0.2, 2, 1, 1, 1);
      var bedMat = new THREE.MeshStandardMaterial({ color: 0xff9999 });
      var bed = new THREE.Mesh(bedGeom, bedMat);
      bed.position.y = 0.6;
      bed.castShadow = true;
      bed.receiveShadow = true;
      stretcher.add(bed);

      stretcher.position.set(
        (Math.random() - 0.5) * 40,
        0,
        (Math.random() - 0.5) * 40
      );
      scene.add(stretcher);
    }
  }

  function buildPlasmaHangers() {
    var poleCount = 4;
    for (var i = 0; i < poleCount; i++) {
      var pole = new THREE.Group();
      var poleGeom = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
      var poleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
      var poleMesh = new THREE.Mesh(poleGeom, poleMat);
      poleMesh.position.y = 1.5;
      poleMesh.castShadow = true;
      poleMesh.receiveShadow = true;
      pole.add(poleMesh);

      for (var j = 0; j < 3; j++) {
        var bagGeom = new THREE.SphereGeometry(0.4, 8, 8);
        var bagMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x440000 });
        var bag = new THREE.Mesh(bagGeom, bagMat);
        bag.position.set(-1 + j * 0.8, 2.8 - j * 0.3, 0);
        bag.castShadow = true;
        bag.receiveShadow = true;
        pole.add(bag);
      }

      pole.position.set(
        -30 + i * 20,
        0,
        -25 + (i % 2) * 30
      );
      scene.add(pole);
    }
  }

  function buildAmbulanceBarricades() {
    var ambulanceGeom = new THREE.BoxGeometry(2.5, 1.8, 5, 1, 1, 1);
    var ambulanceMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3 });

    var ambulance1 = new THREE.Mesh(ambulanceGeom, ambulanceMat);
    ambulance1.position.set(-15, 0.9, 35);
    ambulance1.rotation.z = 0.3;
    ambulance1.castShadow = true;
    ambulance1.receiveShadow = true;
    scene.add(ambulance1);

    var ambulance2 = new THREE.Mesh(ambulanceGeom, ambulanceMat);
    ambulance2.position.set(15, 0.9, -35);
    ambulance2.rotation.z = -0.4;
    ambulance2.castShadow = true;
    ambulance2.receiveShadow = true;
    scene.add(ambulance2);
  }

  function buildSurgeryStation() {
    var surgeryBase = new THREE.Group();

    var tableGeom = new THREE.BoxGeometry(3, 1, 2, 1, 1, 1);
    var tableMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
    var table = new THREE.Mesh(tableGeom, tableMat);
    table.position.y = 0.5;
    table.castShadow = true;
    table.receiveShadow = true;
    surgeryBase.add(table);

    var poleGeom = new THREE.CylinderGeometry(0.2, 0.2, 4, 8);
    var poleMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var pole1 = new THREE.Mesh(poleGeom, poleMat);
    pole1.position.set(-1.2, 2, -0.8);
    pole1.castShadow = true;
    pole1.receiveShadow = true;
    surgeryBase.add(pole1);

    var pole2 = new THREE.Mesh(poleGeom, poleMat);
    pole2.position.set(1.2, 2, -0.8);
    pole2.castShadow = true;
    pole2.receiveShadow = true;
    surgeryBase.add(pole2);

    var lampGeom = new THREE.SphereGeometry(0.8, 16, 16);
    var lampMat = new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffff00, intensity: 2 });
    var lamp = new THREE.Mesh(lampGeom, lampMat);
    lamp.position.set(0, 4.2, 0);
    lamp.castShadow = true;
    lamp.receiveShadow = true;
    surgeryBase.add(lamp);

    var lampLight = new THREE.PointLight(0xffff99, 2, 40);
    lampLight.position.set(0, 4.2, 0);
    lampLight.castShadow = true;
    surgeryBase.add(lampLight);
    animatedObjects.push({ object: lamp, type: 'glow' });

    surgeryBase.position.set(0, 0, 0);
    scene.add(surgeryBase);
  }

  function buildMorphineCrates() {
    var crateCount = 3;
    for (var i = 0; i < crateCount; i++) {
      var crateGeom = new THREE.BoxGeometry(1.2, 1.2, 1.2, 1, 1, 1);
      var crateMat = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
      var crate = new THREE.Mesh(crateGeom, crateMat);
      crate.position.set(
        -35 + i * 30,
        0.6,
        25 + Math.random() * 5
      );
      crate.castShadow = true;
      crate.receiveShadow = true;
      scene.add(crate);
    }
  }

  function buildScatterPacks() {
    var packCount = 12;
    for (var i = 0; i < packCount; i++) {
      var packGeom = new THREE.BoxGeometry(0.6, 0.4, 0.8, 1, 1, 1);
      var packMat = new THREE.MeshStandardMaterial({ color: 0x00cc00, emissive: 0x003300 });
      var pack = new THREE.Mesh(packGeom, packMat);
      pack.position.set(
        (Math.random() - 0.5) * 60,
        0.2,
        (Math.random() - 0.5) * 60
      );
      pack.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.3);
      pack.castShadow = true;
      pack.receiveShadow = true;
      scene.add(pack);

      pickupItems.push({
        mesh: pack,
        collected: false
      });

      animatedObjects.push({
        object: pack,
        type: 'bob',
        offset: Math.random() * Math.PI * 2,
        baseY: pack.position.y
      });
    }
  }

  function update(delta) {
    for (var i = 0; i < animatedObjects.length; i++) {
      var anim = animatedObjects[i];

      if (anim.type === 'bob') {
        anim.baseY = anim.object.position.y;
        anim.object.position.y = anim.baseY + Math.sin(Date.now() * 0.001 + anim.offset) * 0.2;
      } else if (anim.type === 'glow') {
        var intensity = 1.5 + Math.sin(Date.now() * 0.005) * 0.5;
        anim.object.material.emissiveIntensity = intensity;
      }
    }
  }

  function reset() {
    for (var i = 0; i < pickupItems.length; i++) {
      pickupItems[i].collected = false;
      pickupItems[i].mesh.visible = true;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
