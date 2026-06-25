window.BombShelter = (function() {
  'use strict';

  var scene = null;
  var objects = [];
  var materials = {};

  function setupMaterials() {
    materials.concrete = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8 });
    materials.steel = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.9 });
    materials.rust = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
    materials.wood = new THREE.MeshStandardMaterial({ color: 0x4a3f35, roughness: 0.7 });
    materials.yellow = new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.6 });
  }

  function buildTunnelArches() {
    var archHeight = 8;
    var archLength = 15;
    var archThickness = 0.8;
    var archSpacing = 16;

    for (var i = 0; i < 5; i++) {
      var archGeom = new THREE.BoxGeometry(archLength, archHeight, archThickness);
      var arch = new THREE.Mesh(archGeom, materials.concrete);
      arch.position.z = -i * archSpacing;
      arch.castShadow = true;
      arch.receiveShadow = true;
      scene.add(arch);
      objects.push(arch);

      var wallLeft = new THREE.Mesh(
        new THREE.BoxGeometry(archThickness, archHeight, archThickness),
        materials.concrete
      );
      wallLeft.position.set(-archLength / 2, 0, -i * archSpacing);
      wallLeft.castShadow = true;
      scene.add(wallLeft);
      objects.push(wallLeft);

      var wallRight = new THREE.Mesh(
        new THREE.BoxGeometry(archThickness, archHeight, archThickness),
        materials.concrete
      );
      wallRight.position.set(archLength / 2, 0, -i * archSpacing);
      wallRight.castShadow = true;
      scene.add(wallRight);
      objects.push(wallRight);
    }
  }

  function buildBlastDoor() {
    var doorGeom = new THREE.BoxGeometry(6, 4, 0.8);
    var door = new THREE.Mesh(doorGeom, materials.steel);
    door.position.set(0, 2, 8);
    door.castShadow = true;
    door.receiveShadow = true;
    scene.add(door);
    objects.push(door);

    var frameTop = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.6, 1),
      materials.steel
    );
    frameTop.position.set(0, 4.3, 8);
    scene.add(frameTop);
    objects.push(frameTop);

    var frameBottom = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.6, 1),
      materials.steel
    );
    frameBottom.position.set(0, -0.3, 8);
    scene.add(frameBottom);
    objects.push(frameBottom);
  }

  function buildBunkBeds() {
    var bedLength = 2;
    var bedWidth = 1;
    var bedHeight = 0.4;
    var rowSpacing = 3;
    var sideSpacing = 4;

    for (var side = -1; side <= 1; side += 2) {
      for (var row = 0; row < 4; row++) {
        for (var level = 0; level < 2; level++) {
          var bedGeom = new THREE.BoxGeometry(bedWidth, bedHeight, bedLength);
          var bed = new THREE.Mesh(bedGeom, materials.wood);
          bed.position.set(side * sideSpacing, 1.5 + level * 2, -row * rowSpacing);
          bed.castShadow = true;
          scene.add(bed);
          objects.push(bed);

          var legGeom = new THREE.BoxGeometry(0.15, 1.5 + level * 2, 0.15);
          var leg = new THREE.Mesh(legGeom, materials.steel);
          leg.position.set(side * sideSpacing - 0.3, 0.75 + level * 2, -row * rowSpacing - 0.8);
          scene.add(leg);
          objects.push(leg);
        }
      }
    }
  }

  function buildWaterTanks() {
    var tankRadius = 1.2;
    var tankHeight = 4;

    for (var i = 0; i < 3; i++) {
      var tankGeom = new THREE.CylinderGeometry(tankRadius, tankRadius, tankHeight, 16);
      var tank = new THREE.Mesh(tankGeom, materials.rust);
      tank.position.set(-8 + i * 4, tankHeight / 2, -12);
      tank.castShadow = true;
      tank.receiveShadow = true;
      scene.add(tank);
      objects.push(tank);

      var capGeom = new THREE.CylinderGeometry(tankRadius * 0.9, tankRadius, 0.3, 16);
      var cap = new THREE.Mesh(capGeom, materials.steel);
      cap.position.set(-8 + i * 4, tankHeight + 0.3, -12);
      scene.add(cap);
      objects.push(cap);
    }
  }

  function buildFoodShelves() {
    var shelfWidth = 3;
    var shelfHeight = 0.3;
    var shelfDepth = 1.5;
    var cabinetHeight = 5;

    for (var shelf = 0; shelf < 4; shelf++) {
      var shelfGeom = new THREE.BoxGeometry(shelfWidth, shelfHeight, shelfDepth);
      var shelfMesh = new THREE.Mesh(shelfGeom, materials.steel);
      shelfMesh.position.set(8, 1 + shelf * 1.3, -8);
      shelfMesh.castShadow = true;
      scene.add(shelfMesh);
      objects.push(shelfMesh);

      for (var box = 0; box < 3; box++) {
        var boxGeom = new THREE.BoxGeometry(0.6, 0.5, 0.6);
        var boxMesh = new THREE.Mesh(boxGeom, materials.yellow);
        boxMesh.position.set(7.2 + box * 0.8, 1.3 + shelf * 1.3, -8);
        scene.add(boxMesh);
        objects.push(boxMesh);
      }
    }
  }

  function buildMedicalStation() {
    var tableGeom = new THREE.BoxGeometry(3, 0.4, 1.5);
    var table = new THREE.Mesh(tableGeom, materials.steel);
    table.position.set(-9, 1, -15);
    table.castShadow = true;
    scene.add(table);
    objects.push(table);

    for (var leg = 0; leg < 4; leg++) {
      var legGeom = new THREE.BoxGeometry(0.2, 1, 0.2);
      var legMesh = new THREE.Mesh(legGeom, materials.steel);
      var xOff = leg % 2 === 0 ? -1.3 : 1.3;
      var zOff = leg < 2 ? -0.6 : 0.6;
      legMesh.position.set(-9 + xOff, 0.5, -15 + zOff);
      scene.add(legMesh);
      objects.push(legMesh);
    }

    var cabinetGeom = new THREE.CylinderGeometry(0.6, 0.6, 2, 12);
    var cabinet = new THREE.Mesh(cabinetGeom, materials.rust);
    cabinet.position.set(-10.5, 1.2, -15);
    scene.add(cabinet);
    objects.push(cabinet);
  }

  function buildRadioRoom() {
    var roomGeom = new THREE.BoxGeometry(4, 3, 3);
    var room = new THREE.Mesh(roomGeom, materials.concrete);
    room.position.set(9, 1.5, -20);
    room.castShadow = true;
    scene.add(room);
    objects.push(room);

    var antennaPoles = [];
    for (var pole = 0; pole < 3; pole++) {
      var poleGeom = new THREE.CylinderGeometry(0.15, 0.15, 4 + pole * 1.5, 8);
      var poleMesh = new THREE.Mesh(poleGeom, materials.steel);
      poleMesh.position.set(8 + pole * 0.6, 3.5 + pole * 0.75, -20);
      scene.add(poleMesh);
      objects.push(poleMesh);
      antennaPoles.push(poleMesh);
    }

    var wireGeom = new THREE.BufferGeometry();
    var wirePositions = new Float32Array([
      8, 4, -20,  8.6, 3.5, -20,
      8.6, 3.5, -20,  9.2, 2.5, -20,
      9.2, 2.5, -20,  8, 4, -20
    ]);
    wireGeom.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
    var wire = new THREE.LineSegments(wireGeom, new THREE.LineBasicMaterial({ color: 0xFF0000 }));
    scene.add(wire);
    objects.push(wire);
  }

  function buildWeaponCaches() {
    for (var cache = 0; cache < 2; cache++) {
      var crateGeom = new THREE.BoxGeometry(2, 2, 1.5);
      var crate = new THREE.Mesh(crateGeom, materials.yellow);
      crate.position.set(-6 + cache * 6, 1, -18);
      crate.castShadow = true;
      scene.add(crate);
      objects.push(crate);

      var barrelGeom = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 12);
      var barrel = new THREE.Mesh(barrelGeom, materials.rust);
      barrel.position.set(-6 + cache * 6, 1.2, -17.5);
      scene.add(barrel);
      objects.push(barrel);
    }
  }

  function buildExitStairs() {
    var stairCount = 8;
    var stairWidth = 4;
    var stairDepth = 0.8;
    var stairHeight = 0.5;

    for (var s = 0; s < stairCount; s++) {
      var stairGeom = new THREE.BoxGeometry(stairWidth, stairHeight, stairDepth);
      var stair = new THREE.Mesh(stairGeom, materials.concrete);
      stair.position.set(0, stairHeight / 2 + s * stairHeight, 12 + s * stairDepth);
      stair.castShadow = true;
      stair.receiveShadow = true;
      scene.add(stair);
      objects.push(stair);

      var railGeom = new THREE.BoxGeometry(0.15, 1.5, stairDepth);
      var railLeft = new THREE.Mesh(railGeom, materials.steel);
      railLeft.position.set(-stairWidth / 2, 1.5 + s * stairHeight, 12 + s * stairDepth);
      scene.add(railLeft);
      objects.push(railLeft);

      var railRight = new THREE.Mesh(railGeom, materials.steel);
      railRight.position.set(stairWidth / 2, 1.5 + s * stairHeight, 12 + s * stairDepth);
      scene.add(railRight);
      objects.push(railRight);
    }
  }

  function buildFloor() {
    var floorGeom = new THREE.BoxGeometry(20, 0.3, 80);
    var floor = new THREE.Mesh(floorGeom, materials.concrete);
    floor.position.set(0, -0.2, -15);
    floor.receiveShadow = true;
    scene.add(floor);
    objects.push(floor);
  }

  function init(sceneRef, camera) {
    scene = sceneRef;
    objects = [];
    setupMaterials();

    var light = new THREE.DirectionalLight(0xFFFFFF, 1);
    light.position.set(10, 20, 5);
    light.castShadow = true;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    scene.add(light);

    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambientLight);

    buildFloor();
    buildTunnelArches();
    buildBlastDoor();
    buildBunkBeds();
    buildWaterTanks();
    buildFoodShelves();
    buildMedicalStation();
    buildRadioRoom();
    buildWeaponCaches();
    buildExitStairs();

    scene.fog = new THREE.Fog(0x000000, 80, 150);
  }

  function update(delta) {
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].rotation) {
        if (i % 7 === 0) {
          objects[i].rotation.y += delta * 0.3;
        }
      }
    }
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];
    materials = {};
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
