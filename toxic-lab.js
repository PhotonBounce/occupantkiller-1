window.ToxicLab = (function() {
  'use strict';

  var scene;
  var camera;
  var meshes = [];
  var dynamicElements = [];
  var time = 0;

  var config = {
    areaWidth: 80,
    areaLength: 80,
    baseFloor: -10
  };

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    meshes = [];
    dynamicElements = [];
    time = 0;

    scene.background = new THREE.Color(0x0a0f0a);
    scene.fog = new THREE.Fog(0x1a3a1a, 40, 120);

    buildFloors();
    buildWalls();
    buildContainmentStructures();
    buildHazmatEquipment();
    buildChemicalDrums();
    buildBlastDoors();
    buildVentilationShafts();
    buildLighting();
    buildBiohazardBarriers();
    buildDecorations();
    buildToxicPools();
    buildGasVents();
  }

  function buildFloors() {
    var floorMaterial = new THREE.MeshLambertMaterial({ color: 0x2d2d2d });

    var basement = new THREE.Mesh(
      new THREE.BoxGeometry(config.areaWidth, 3, config.areaLength),
      floorMaterial
    );
    basement.position.set(0, config.baseFloor - 1.5, 0);
    basement.castShadow = true;
    basement.receiveShadow = true;
    scene.add(basement);
    meshes.push(basement);

    var groundFloor = new THREE.Mesh(
      new THREE.BoxGeometry(config.areaWidth, 3, config.areaLength),
      floorMaterial
    );
    groundFloor.position.set(0, 0, 0);
    groundFloor.castShadow = true;
    groundFloor.receiveShadow = true;
    scene.add(groundFloor);
    meshes.push(groundFloor);

    var upperFloor = new THREE.Mesh(
      new THREE.BoxGeometry(config.areaWidth * 0.6, 3, config.areaLength * 0.6),
      floorMaterial
    );
    upperFloor.position.set(10, 6, -10);
    upperFloor.castShadow = true;
    upperFloor.receiveShadow = true;
    scene.add(upperFloor);
    meshes.push(upperFloor);
  }

  function buildWalls() {
    var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var damagedWallMaterial = new THREE.MeshLambertMaterial({ color: 0x2d4a2d });

    var northWall = new THREE.Mesh(
      new THREE.BoxGeometry(config.areaWidth, 12, 1),
      wallMaterial
    );
    northWall.position.set(0, 3, -config.areaLength / 2);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    scene.add(northWall);
    meshes.push(northWall);

    var southWall = new THREE.Mesh(
      new THREE.BoxGeometry(config.areaWidth, 12, 1),
      wallMaterial
    );
    southWall.position.set(0, 3, config.areaLength / 2);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    scene.add(southWall);
    meshes.push(southWall);

    var eastWall = new THREE.Mesh(
      new THREE.BoxGeometry(1, 12, config.areaLength),
      damagedWallMaterial
    );
    eastWall.position.set(config.areaWidth / 2, 3, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    scene.add(eastWall);
    meshes.push(eastWall);

    var westWall = new THREE.Mesh(
      new THREE.BoxGeometry(1, 12, config.areaLength),
      wallMaterial
    );
    westWall.position.set(-config.areaWidth / 2, 3, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    scene.add(westWall);
    meshes.push(westWall);

    var basementWall = new THREE.Mesh(
      new THREE.BoxGeometry(config.areaWidth, 8, 1),
      wallMaterial
    );
    basementWall.position.set(0, config.baseFloor + 1, -config.areaLength / 2);
    basementWall.castShadow = true;
    basementWall.receiveShadow = true;
    scene.add(basementWall);
    meshes.push(basementWall);
  }

  function buildContainmentStructures() {
    var tankMaterial = new THREE.MeshLambertMaterial({ color: 0x4d9966 });
    var shatteredMaterial = new THREE.MeshPhongMaterial({ color: 0x2d6644, emissive: 0x1a4d33 });

    var tank1 = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 4, 8, 16),
      tankMaterial
    );
    tank1.position.set(-20, 4, -15);
    tank1.castShadow = true;
    tank1.receiveShadow = true;
    scene.add(tank1);
    meshes.push(tank1);

    var tank1Cap = new THREE.Mesh(
      new THREE.SphereGeometry(4.2, 16, 8),
      shatteredMaterial
    );
    tank1Cap.position.set(-20, 8.5, -15);
    tank1Cap.scale.y = 0.5;
    tank1Cap.castShadow = true;
    tank1Cap.receiveShadow = true;
    scene.add(tank1Cap);
    meshes.push(tank1Cap);

    var tank2 = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 3.5, 7, 16),
      shatteredMaterial
    );
    tank2.position.set(-20, 3.5, 10);
    tank2.rotation.z = Math.PI * 0.15;
    tank2.castShadow = true;
    tank2.receiveShadow = true;
    scene.add(tank2);
    meshes.push(tank2);

    var tank3 = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 6, 12),
      tankMaterial
    );
    tank3.position.set(15, 3, 20);
    tank3.castShadow = true;
    tank3.receiveShadow = true;
    scene.add(tank3);
    meshes.push(tank3);

    var fracturedTank = new THREE.Mesh(
      new THREE.SphereGeometry(3, 12, 12),
      shatteredMaterial
    );
    fracturedTank.position.set(25, 2, -18);
    fracturedTank.scale.set(1.2, 0.8, 1.1);
    fracturedTank.castShadow = true;
    fracturedTank.receiveShadow = true;
    scene.add(fracturedTank);
    meshes.push(fracturedTank);

    dynamicElements.push({
      mesh: tank1Cap,
      type: 'glow',
      intensity: 0.3
    });
  }

  function buildHazmatEquipment() {
    var equipMaterial = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
    var hatMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    var suit1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 3, 8),
      equipMaterial
    );
    suit1.position.set(-30, 6, 5);
    suit1.castShadow = true;
    suit1.receiveShadow = true;
    scene.add(suit1);
    meshes.push(suit1);

    var helmet1 = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 8),
      hatMaterial
    );
    helmet1.position.set(-30, 9.5, 5);
    helmet1.castShadow = true;
    helmet1.receiveShadow = true;
    scene.add(helmet1);
    meshes.push(helmet1);

    var suit2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 2.8, 8),
      equipMaterial
    );
    suit2.position.set(-28, 6, 8);
    suit2.rotation.z = Math.PI * 0.2;
    suit2.castShadow = true;
    suit2.receiveShadow = true;
    scene.add(suit2);
    meshes.push(suit2);

    var suit3 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.75, 3.2, 8),
      equipMaterial
    );
    suit3.position.set(-32, 6, 3);
    suit3.castShadow = true;
    suit3.receiveShadow = true;
    scene.add(suit3);
    meshes.push(suit3);

    var rackBase = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.5, 1),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    rackBase.position.set(-30, 3, 6);
    rackBase.castShadow = true;
    rackBase.receiveShadow = true;
    scene.add(rackBase);
    meshes.push(rackBase);
  }

  function buildChemicalDrums() {
    var drumMaterial = new THREE.MeshLambertMaterial({ color: 0xcc3333 });
    var warnMaterial = new THREE.MeshLambertMaterial({ color: 0xffcc00 });

    var drum1 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 2.5, 12),
      drumMaterial
    );
    drum1.position.set(10, 1.25, -25);
    drum1.castShadow = true;
    drum1.receiveShadow = true;
    scene.add(drum1);
    meshes.push(drum1);

    var drum2 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 2.5, 12),
      drumMaterial
    );
    drum2.position.set(12, 1, -22);
    drum2.rotation.z = Math.PI * 0.25;
    drum2.castShadow = true;
    drum2.receiveShadow = true;
    scene.add(drum2);
    meshes.push(drum2);

    var drum3 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 2.5, 12),
      warnMaterial
    );
    drum3.position.set(14, 1.2, -24);
    drum3.castShadow = true;
    drum3.receiveShadow = true;
    scene.add(drum3);
    meshes.push(drum3);

    var drum4 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 2.3, 12),
      drumMaterial
    );
    drum4.position.set(30, 1.15, 15);
    drum4.castShadow = true;
    drum4.receiveShadow = true;
    scene.add(drum4);
    meshes.push(drum4);
  }

  function buildBlastDoors() {
    var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    var frameMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });

    var door1 = new THREE.Mesh(
      new THREE.BoxGeometry(3, 5, 0.3),
      doorMaterial
    );
    door1.position.set(-35, 2.5, 0);
    door1.castShadow = true;
    door1.receiveShadow = true;
    scene.add(door1);
    meshes.push(door1);

    var frame1 = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 5.4, 0.2),
      frameMaterial
    );
    frame1.position.set(-35, 2.5, -0.15);
    frame1.castShadow = true;
    frame1.receiveShadow = true;
    scene.add(frame1);
    meshes.push(frame1);

    var door2 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 6, 0.3),
      doorMaterial
    );
    door2.position.set(35, 3, -20);
    door2.castShadow = true;
    door2.receiveShadow = true;
    scene.add(door2);
    meshes.push(door2);

    var frame2 = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 6.4, 0.2),
      frameMaterial
    );
    frame2.position.set(35, 3, -20.15);
    frame2.castShadow = true;
    frame2.receiveShadow = true;
    scene.add(frame2);
    meshes.push(frame2);
  }

  function buildVentilationShafts() {
    var shaftMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var inletMaterial = new THREE.MeshLambertMaterial({ color: 0x33aa33 });

    var shaft1 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 10, 12),
      shaftMaterial
    );
    shaft1.position.set(-25, 8, -20);
    shaft1.castShadow = true;
    shaft1.receiveShadow = true;
    scene.add(shaft1);
    meshes.push(shaft1);

    var inlet1 = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 8, 8),
      inletMaterial
    );
    inlet1.position.set(-25, 13, -20);
    inlet1.scale.set(1, 0.6, 1);
    inlet1.castShadow = true;
    inlet1.receiveShadow = true;
    scene.add(inlet1);
    meshes.push(inlet1);

    var shaft2 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 1.8, 12, 12),
      shaftMaterial
    );
    shaft2.position.set(28, 7, 18);
    shaft2.castShadow = true;
    shaft2.receiveShadow = true;
    scene.add(shaft2);
    meshes.push(shaft2);

    var inlet2 = new THREE.Mesh(
      new THREE.SphereGeometry(1.9, 8, 8),
      inletMaterial
    );
    inlet2.position.set(28, 13, 18);
    inlet2.scale.set(1, 0.6, 1);
    inlet2.castShadow = true;
    inlet2.receiveShadow = true;
    scene.add(inlet2);
    meshes.push(inlet2);

    dynamicElements.push({
      mesh: inlet1,
      type: 'pulsing',
      frequency: 2
    });

    dynamicElements.push({
      mesh: inlet2,
      type: 'pulsing',
      frequency: 2.5
    });
  }

  function buildLighting() {
    var lightMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00, emissive: 0xffff00 });
    var alertMaterial = new THREE.MeshLambertMaterial({ color: 0xff3333, emissive: 0xff1111 });

    var light1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8),
      lightMaterial
    );
    light1.position.set(-15, 10, -18);
    light1.castShadow = true;
    light1.receiveShadow = true;
    scene.add(light1);
    meshes.push(light1);

    var light2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8),
      alertMaterial
    );
    light2.position.set(20, 10, 15);
    light2.castShadow = true;
    light2.receiveShadow = true;
    scene.add(light2);
    meshes.push(light2);

    var light3 = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8),
      alertMaterial
    );
    light3.position.set(-5, 9.5, 22);
    light3.castShadow = true;
    light3.receiveShadow = true;
    scene.add(light3);
    meshes.push(light3);

    dynamicElements.push({
      mesh: light1,
      type: 'pulsing',
      frequency: 3,
      material: lightMaterial
    });

    dynamicElements.push({
      mesh: light2,
      type: 'pulsing',
      frequency: 2,
      material: alertMaterial
    });

    dynamicElements.push({
      mesh: light3,
      type: 'pulsing',
      frequency: 1.8,
      material: alertMaterial
    });

    var lamp1Base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8),
      new THREE.MeshLambertMaterial({ color: 0x666666 })
    );
    lamp1Base.position.set(-15, 10.7, -18);
    scene.add(lamp1Base);
    meshes.push(lamp1Base);

    var lamp2Base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8),
      new THREE.MeshLambertMaterial({ color: 0x666666 })
    );
    lamp2Base.position.set(20, 10.7, 15);
    scene.add(lamp2Base);
    meshes.push(lamp2Base);
  }

  function buildBiohazardBarriers() {
    var barrierMaterial = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
    var stripeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });

    var barrier1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 2, 6),
      barrierMaterial
    );
    barrier1.position.set(0, 1, 28);
    barrier1.castShadow = true;
    barrier1.receiveShadow = true;
    scene.add(barrier1);
    meshes.push(barrier1);

    var stripe1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.3, 6),
      stripeMaterial
    );
    stripe1.position.set(0, 1.5, 28);
    scene.add(stripe1);
    meshes.push(stripe1);

    var barrier2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 2, 8),
      barrierMaterial
    );
    barrier2.position.set(-32, 1, 10);
    barrier2.rotation.y = Math.PI * 0.25;
    barrier2.castShadow = true;
    barrier2.receiveShadow = true;
    scene.add(barrier2);
    meshes.push(barrier2);

    var stripe2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.3, 8),
      stripeMaterial
    );
    stripe2.position.set(-32, 1.5, 10);
    stripe2.rotation.y = Math.PI * 0.25;
    scene.add(stripe2);
    meshes.push(stripe2);

    var barrier3 = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.8, 5),
      barrierMaterial
    );
    barrier3.position.set(38, 0.9, -15);
    barrier3.castShadow = true;
    barrier3.receiveShadow = true;
    scene.add(barrier3);
    meshes.push(barrier3);
  }

  function buildDecorations() {
    var equipMaterial = new THREE.MeshLambertMaterial({ color: 0xaa6633 });
    var metalMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

    var workbench1 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.2, 2),
      equipMaterial
    );
    workbench1.position.set(5, 3.6, -8);
    workbench1.castShadow = true;
    workbench1.receiveShadow = true;
    scene.add(workbench1);
    meshes.push(workbench1);

    var workbench2 = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 1, 2),
      equipMaterial
    );
    workbench2.position.set(-8, 3.5, 12);
    workbench2.castShadow = true;
    workbench2.receiveShadow = true;
    scene.add(workbench2);
    meshes.push(workbench2);

    var column1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 9, 8),
      metalMaterial
    );
    column1.position.set(15, 4.5, 5);
    column1.castShadow = true;
    column1.receiveShadow = true;
    scene.add(column1);
    meshes.push(column1);

    var column2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 9, 8),
      metalMaterial
    );
    column2.position.set(-18, 4.5, -10);
    column2.castShadow = true;
    column2.receiveShadow = true;
    scene.add(column2);
    meshes.push(column2);

    var cone1 = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 2, 8),
      new THREE.MeshLambertMaterial({ color: 0xff6600 })
    );
    cone1.position.set(25, 2, 8);
    cone1.castShadow = true;
    cone1.receiveShadow = true;
    scene.add(cone1);
    meshes.push(cone1);

    var cone2 = new THREE.Mesh(
      new THREE.ConeGeometry(0.7, 1.8, 8),
      new THREE.MeshLambertMaterial({ color: 0xff6600 })
    );
    cone2.position.set(28, 1.9, 5);
    cone2.castShadow = true;
    cone2.receiveShadow = true;
    scene.add(cone2);
    meshes.push(cone2);
  }

  function buildToxicPools() {
    var poolMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ff00,
      emissive: 0x00aa00,
      shininess: 100
    });

    var pool1 = new THREE.Mesh(
      new THREE.SphereGeometry(3, 12, 12),
      poolMaterial
    );
    pool1.position.set(-15, 0.3, 30);
    pool1.scale.set(1, 0.3, 1);
    pool1.receiveShadow = true;
    scene.add(pool1);
    meshes.push(pool1);

    var pool2 = new THREE.Mesh(
      new THREE.SphereGeometry(2.5, 10, 10),
      poolMaterial
    );
    pool2.position.set(30, 0.25, -18);
    pool2.scale.set(1, 0.25, 1);
    pool2.receiveShadow = true;
    scene.add(pool2);
    meshes.push(pool2);

    dynamicElements.push({
      mesh: pool1,
      type: 'bubbling',
      frequency: 1.5,
      amplitude: 0.15
    });

    dynamicElements.push({
      mesh: pool2,
      type: 'bubbling',
      frequency: 2,
      amplitude: 0.12
    });
  }

  function buildGasVents() {
    var ventMaterial = new THREE.MeshLambertMaterial({ color: 0x33ff33, emissive: 0x1a8c1a });

    var vent1 = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 0.5, 8),
      ventMaterial
    );
    vent1.position.set(10, 0.3, -30);
    vent1.receiveShadow = true;
    scene.add(vent1);
    meshes.push(vent1);

    var vent2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.4, 8),
      ventMaterial
    );
    vent2.position.set(-25, 0.2, 25);
    vent2.receiveShadow = true;
    scene.add(vent2);
    meshes.push(vent2);

    var vent3 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 0.6, 8),
      ventMaterial
    );
    vent3.position.set(35, 0.35, 10);
    vent3.receiveShadow = true;
    scene.add(vent3);
    meshes.push(vent3);

    dynamicElements.push({
      mesh: vent1,
      type: 'swirl',
      frequency: 1,
      amplitude: 0.4
    });

    dynamicElements.push({
      mesh: vent2,
      type: 'swirl',
      frequency: 1.3,
      amplitude: 0.3
    });

    dynamicElements.push({
      mesh: vent3,
      type: 'swirl',
      frequency: 0.9,
      amplitude: 0.45
    });
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < dynamicElements.length; i++) {
      var element = dynamicElements[i];

      if (element.type === 'pulsing') {
        var pulse = Math.sin(time * element.frequency) * 0.5 + 0.5;
        var baseScale = 0.5;
        element.mesh.scale.set(baseScale + pulse * 0.5, baseScale + pulse * 0.5, baseScale + pulse * 0.5);

        if (element.material) {
          var pulseIntensity = Math.sin(time * element.frequency) * 0.3 + 0.7;
          element.material.emissive.multiplyScalar(pulseIntensity);
        }
      } else if (element.type === 'bubbling') {
        var bubble = Math.sin(time * element.frequency * 2) * element.amplitude;
        element.mesh.position.y += bubble * delta;
        element.mesh.scale.y = 0.3 + Math.sin(time * element.frequency) * 0.05;
      } else if (element.type === 'swirl') {
        element.mesh.rotation.y = time * element.frequency * 2;
        var swirl = Math.sin(time * element.frequency) * element.amplitude;
        element.mesh.position.x += swirl * delta * 0.1;
      } else if (element.type === 'glow') {
        var glow = Math.sin(time * 2) * 0.2 + 0.8;
        element.mesh.scale.set(glow, glow, glow);
      }
    }
  }

  function reset() {
    time = 0;

    for (var i = meshes.length - 1; i >= 0; i--) {
      scene.remove(meshes[i]);
    }

    meshes = [];
    dynamicElements = [];

    init(scene, camera);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
