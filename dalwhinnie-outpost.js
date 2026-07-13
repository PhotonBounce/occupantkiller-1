window.DalwhinnieOutpost = (function() {
  'use strict';

  var BASE_X = 700;
  var BASE_Z = 820;
  var BASE_Y = 0;

  function create() {
    var group = new THREE.Group();

    buildDistillery(group);
    buildRoadBarrier(group);
    buildSnowplowDepot(group);
    buildWeatherStation(group);
    buildSurvivalBunker(group);
    buildLochGun(group);
    buildOverpass(group);
    buildHelicopterPad(group);

    return group;
  }

  function buildDistillery(group) {
    var distilleryGroup = new THREE.Group();
    distilleryGroup.position.set(BASE_X, BASE_Y, BASE_Z);

    var matWhite = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });

    var building1 = new THREE.Mesh(
      new THREE.BoxGeometry(30, 25, 40),
      matWhite
    );
    building1.position.set(-50, 12.5, -60);
    building1.castShadow = true;
    building1.receiveShadow = true;
    distilleryGroup.add(building1);

    var building2 = new THREE.Mesh(
      new THREE.BoxGeometry(35, 28, 50),
      matWhite
    );
    building2.position.set(40, 14, -40);
    building2.castShadow = true;
    building2.receiveShadow = true;
    distilleryGroup.add(building2);

    var matGray = new THREE.MeshLambertMaterial({ color: 0x888888 });

    var still1 = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 10, 35, 16),
      matGray
    );
    still1.position.set(-60, 17.5, -80);
    still1.castShadow = true;
    still1.receiveShadow = true;
    distilleryGroup.add(still1);

    var stillCap1 = new THREE.Mesh(
      new THREE.ConeGeometry(9, 12, 16),
      matGray
    );
    stillCap1.position.set(-60, 40, -80);
    stillCap1.castShadow = true;
    distilleryGroup.add(stillCap1);

    var still2 = new THREE.Mesh(
      new THREE.CylinderGeometry(7, 9, 32, 16),
      matGray
    );
    still2.position.set(70, 16, -50);
    still2.castShadow = true;
    still2.receiveShadow = true;
    distilleryGroup.add(still2);

    var stillCap2 = new THREE.Mesh(
      new THREE.ConeGeometry(8, 10, 16),
      matGray
    );
    stillCap2.position.set(70, 37, -50);
    stillCap2.castShadow = true;
    distilleryGroup.add(stillCap2);

    group.add(distilleryGroup);
  }

  function buildRoadBarrier(group) {
    var barrierGroup = new THREE.Group();
    barrierGroup.position.set(BASE_X, BASE_Y, BASE_Z + 150);

    var matDark = new THREE.MeshLambertMaterial({ color: 0x333333 });

    var barrier = new THREE.Mesh(
      new THREE.BoxGeometry(120, 8, 4),
      matDark
    );
    barrier.position.set(0, 4, 0);
    barrier.castShadow = true;
    barrier.receiveShadow = true;
    barrierGroup.add(barrier);

    var blockLeft = new THREE.Mesh(
      new THREE.BoxGeometry(12, 6, 6),
      matDark
    );
    blockLeft.position.set(-60, 3, 0);
    blockLeft.castShadow = true;
    barrierGroup.add(blockLeft);

    var blockRight = new THREE.Mesh(
      new THREE.BoxGeometry(12, 6, 6),
      matDark
    );
    blockRight.position.set(60, 3, 0);
    blockRight.castShadow = true;
    barrierGroup.add(blockRight);

    group.add(barrierGroup);
  }

  function buildSnowplowDepot(group) {
    var depotGroup = new THREE.Group();
    depotGroup.position.set(BASE_X + 200, BASE_Y, BASE_Z - 100);

    var matBrown = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

    var garage = new THREE.Mesh(
      new THREE.BoxGeometry(50, 20, 45),
      matBrown
    );
    garage.position.set(0, 10, 0);
    garage.castShadow = true;
    garage.receiveShadow = true;
    depotGroup.add(garage);

    var matOrange = new THREE.MeshLambertMaterial({ color: 0xFF6600 });

    var truck = new THREE.Mesh(
      new THREE.BoxGeometry(25, 12, 35),
      matOrange
    );
    truck.position.set(-35, 6, 25);
    truck.castShadow = true;
    truck.receiveShadow = true;
    depotGroup.add(truck);

    var plow = new THREE.Mesh(
      new THREE.BoxGeometry(28, 4, 6),
      matOrange
    );
    plow.position.set(-35, 4, 43);
    plow.castShadow = true;
    depotGroup.add(plow);

    group.add(depotGroup);
  }

  function buildWeatherStation(group) {
    var weatherGroup = new THREE.Group();
    weatherGroup.position.set(BASE_X - 150, BASE_Y, BASE_Z + 80);

    var matMetalDark = new THREE.MeshLambertMaterial({ color: 0x555555 });

    var pole = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 60, 8),
      matMetalDark
    );
    pole.position.set(0, 30, 0);
    pole.castShadow = true;
    pole.receiveShadow = true;
    weatherGroup.add(pole);

    var matRed = new THREE.MeshLambertMaterial({ color: 0xFF0000 });

    var sensor1 = new THREE.Mesh(
      new THREE.SphereGeometry(2, 8, 8),
      matRed
    );
    sensor1.position.set(0, 15, 0);
    sensor1.castShadow = true;
    weatherGroup.add(sensor1);

    var sensor2 = new THREE.Mesh(
      new THREE.SphereGeometry(2.5, 8, 8),
      matRed
    );
    sensor2.position.set(0, 35, 0);
    sensor2.castShadow = true;
    weatherGroup.add(sensor2);

    var sensor3 = new THREE.Mesh(
      new THREE.SphereGeometry(2, 8, 8),
      matRed
    );
    sensor3.position.set(0, 55, 0);
    sensor3.castShadow = true;
    weatherGroup.add(sensor3);

    group.add(weatherGroup);
  }

  function buildSurvivalBunker(group) {
    var bunkerGroup = new THREE.Group();
    bunkerGroup.position.set(BASE_X - 250, BASE_Y, BASE_Z);

    var matSnow = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });

    var bunker = new THREE.Mesh(
      new THREE.BoxGeometry(40, 18, 50),
      matSnow
    );
    bunker.position.set(0, 6, 0);
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    bunkerGroup.add(bunker);

    var door = new THREE.Mesh(
      new THREE.BoxGeometry(6, 10, 3),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    );
    door.position.set(-15, 5, -25.5);
    door.castShadow = true;
    bunkerGroup.add(door);

    group.add(bunkerGroup);
  }

  function buildLochGun(group) {
    var gunGroup = new THREE.Group();
    gunGroup.position.set(BASE_X - 400, BASE_Y, BASE_Z + 300);

    var matConcrete = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });

    var emplacement = new THREE.Mesh(
      new THREE.BoxGeometry(45, 12, 35),
      matConcrete
    );
    emplacement.position.set(0, 6, 0);
    emplacement.castShadow = true;
    emplacement.receiveShadow = true;
    gunGroup.add(emplacement);

    var matGunMetal = new THREE.MeshLambertMaterial({ color: 0x333333 });

    var barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 50, 12),
      matGunMetal
    );
    barrel.rotation.z = Math.PI / 6;
    barrel.position.set(0, 15, 30);
    barrel.castShadow = true;
    gunGroup.add(barrel);

    var breech = new THREE.Mesh(
      new THREE.SphereGeometry(5, 8, 8),
      matGunMetal
    );
    breech.position.set(0, 12, 0);
    breech.castShadow = true;
    gunGroup.add(breech);

    group.add(gunGroup);
  }

  function buildOverpass(group) {
    var overpassGroup = new THREE.Group();
    overpassGroup.position.set(BASE_X + 300, BASE_Y, BASE_Z - 200);

    var matConcrete = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });

    var platform = new THREE.Mesh(
      new THREE.BoxGeometry(100, 6, 50),
      matConcrete
    );
    platform.position.set(0, 25, 0);
    platform.castShadow = true;
    platform.receiveShadow = true;
    overpassGroup.add(platform);

    var matSteel = new THREE.MeshLambertMaterial({ color: 0x555555 });

    var pillarLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 8, 25, 8),
      matSteel
    );
    pillarLeft.position.set(-40, 12.5, -15);
    pillarLeft.castShadow = true;
    pillarLeft.receiveShadow = true;
    overpassGroup.add(pillarLeft);

    var pillarRight = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 8, 25, 8),
      matSteel
    );
    pillarRight.position.set(40, 12.5, 15);
    pillarRight.castShadow = true;
    pillarLeft.receiveShadow = true;
    overpassGroup.add(pillarRight);

    var pillarCenter = new THREE.Mesh(
      new THREE.CylinderGeometry(5, 7, 25, 8),
      matSteel
    );
    pillarCenter.position.set(0, 12.5, 0);
    pillarCenter.castShadow = true;
    pillarCenter.receiveShadow = true;
    overpassGroup.add(pillarCenter);

    group.add(overpassGroup);
  }

  function buildHelicopterPad(group) {
    var padGroup = new THREE.Group();
    padGroup.position.set(BASE_X + 100, BASE_Y, BASE_Z + 250);

    var matConcrete = new THREE.MeshLambertMaterial({ color: 0x666666 });

    var pad = new THREE.Mesh(
      new THREE.BoxGeometry(60, 2, 60),
      matConcrete
    );
    pad.position.set(0, 1, 0);
    pad.castShadow = true;
    pad.receiveShadow = true;
    padGroup.add(pad);

    var matYellow = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });

    var hLetter1 = new THREE.Mesh(
      new THREE.BoxGeometry(6, 2, 3),
      matYellow
    );
    hLetter1.position.set(-8, 1.5, 0);
    padGroup.add(hLetter1);

    var hLetter2 = new THREE.Mesh(
      new THREE.BoxGeometry(6, 2, 3),
      matYellow
    );
    hLetter2.position.set(8, 1.5, 0);
    padGroup.add(hLetter2);

    var hCross = new THREE.Mesh(
      new THREE.BoxGeometry(12, 2, 3),
      matYellow
    );
    hCross.position.set(0, 1.5, 0);
    padGroup.add(hCross);

    group.add(padGroup);
  }

  return {
    create: create
  };
}());
