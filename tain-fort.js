var TainFort = (function() {
  'use strict';

  var tainGroup = new THREE.Group();
  var baseX = 840;
  var baseZ = 1030;

  function addstduthuschapl() {
    var geo = new THREE.BoxGeometry(8, 4, 5);
    var mat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
    var chapel = new THREE.Mesh(geo, mat);
    chapel.position.set(baseX - 30, 2, baseZ - 40);
    chapel.castShadow = true;
    chapel.receiveShadow = true;
    tainGroup.add(chapel);
  }

  function addchurch() {
    var naveGeo = new THREE.BoxGeometry(10, 8, 20);
    var naveMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
    var nave = new THREE.Mesh(naveGeo, naveMat);
    nave.position.set(baseX, 4, baseZ + 20);
    nave.castShadow = true;
    nave.receiveShadow = true;
    tainGroup.add(nave);

    var towerGeo = new THREE.CylinderGeometry(3, 3, 12, 8);
    var towerMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
    var tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(baseX + 8, 6, baseZ + 20);
    tower.castShadow = true;
    tower.receiveShadow = true;
    tainGroup.add(tower);
  }

  function addtollbooth() {
    var mainGeo = new THREE.BoxGeometry(6, 6, 4);
    var stoneMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
    var main = new THREE.Mesh(mainGeo, stoneMat);
    main.position.set(baseX + 20, 3, baseZ - 10);
    main.castShadow = true;
    main.receiveShadow = true;
    tainGroup.add(main);

    var stairGeo = new THREE.CylinderGeometry(2, 2, 8, 6);
    var stairMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
    var stair = new THREE.Mesh(stairGeo, stairMat);
    stair.position.set(baseX + 20, 4, baseZ - 10);
    stair.castShadow = true;
    stair.receiveShadow = true;
    tainGroup.add(stair);
  }

  function adddistillery() {
    var shed1Geo = new THREE.BoxGeometry(12, 5, 8);
    var shedMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    var shed1 = new THREE.Mesh(shed1Geo, shedMat);
    shed1.position.set(baseX - 40, 2.5, baseZ + 35);
    shed1.castShadow = true;
    shed1.receiveShadow = true;
    tainGroup.add(shed1);

    var shed2Geo = new THREE.BoxGeometry(12, 5, 8);
    var shed2 = new THREE.Mesh(shed2Geo, shedMat);
    shed2.position.set(baseX - 40, 2.5, baseZ + 50);
    shed2.castShadow = true;
    shed2.receiveShadow = true;
    tainGroup.add(shed2);

    var still1Geo = new THREE.CylinderGeometry(1.5, 1.5, 6, 8);
    var stillMat = new THREE.MeshLambertMaterial({ color: 0xAA8C55 });
    var still1 = new THREE.Mesh(still1Geo, stillMat);
    still1.position.set(baseX - 45, 3, baseZ + 35);
    still1.castShadow = true;
    still1.receiveShadow = true;
    tainGroup.add(still1);

    var still2Geo = new THREE.CylinderGeometry(1.5, 1.5, 6, 8);
    var still2 = new THREE.Mesh(still2Geo, stillMat);
    still2.position.set(baseX - 35, 3, baseZ + 35);
    still2.castShadow = true;
    still2.receiveShadow = true;
    tainGroup.add(still2);

    var still3Geo = new THREE.CylinderGeometry(1.5, 1.5, 6, 8);
    var still3 = new THREE.Mesh(still3Geo, stillMat);
    still3.position.set(baseX - 40, 3, baseZ + 45);
    still3.castShadow = true;
    still3.receiveShadow = true;
    tainGroup.add(still3);
  }

  function addartillery() {
    var batteryGeo = new THREE.BoxGeometry(14, 3, 6);
    var batteryMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
    var battery = new THREE.Mesh(batteryGeo, batteryMat);
    battery.position.set(baseX - 60, 1.5, baseZ - 50);
    battery.castShadow = true;
    battery.receiveShadow = true;
    tainGroup.add(battery);

    var barrel1Geo = new THREE.CylinderGeometry(0.8, 0.8, 10, 6);
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
    var barrel1 = new THREE.Mesh(barrel1Geo, barrelMat);
    barrel1.rotation.z = Math.PI / 6;
    barrel1.position.set(baseX - 65, 3, baseZ - 50);
    barrel1.castShadow = true;
    barrel1.receiveShadow = true;
    tainGroup.add(barrel1);

    var barrel2Geo = new THREE.CylinderGeometry(0.8, 0.8, 10, 6);
    var barrel2 = new THREE.Mesh(barrel2Geo, barrelMat);
    barrel2.rotation.z = Math.PI / 6;
    barrel2.position.set(baseX - 60, 3, baseZ - 50);
    barrel2.castShadow = true;
    barrel2.receiveShadow = true;
    tainGroup.add(barrel2);

    var barrel3Geo = new THREE.CylinderGeometry(0.8, 0.8, 10, 6);
    var barrel3 = new THREE.Mesh(barrel3Geo, barrelMat);
    barrel3.rotation.z = Math.PI / 6;
    barrel3.position.set(baseX - 55, 3, baseZ - 50);
    barrel3.castShadow = true;
    barrel3.receiveShadow = true;
    tainGroup.add(barrel3);
  }

  function addgate() {
    var tower1Geo = new THREE.BoxGeometry(4, 8, 4);
    var gateMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
    var tower1 = new THREE.Mesh(tower1Geo, gateMat);
    tower1.position.set(baseX - 80, 4, baseZ + 10);
    tower1.castShadow = true;
    tower1.receiveShadow = true;
    tainGroup.add(tower1);

    var tower2Geo = new THREE.BoxGeometry(4, 8, 4);
    var tower2 = new THREE.Mesh(tower2Geo, gateMat);
    tower2.position.set(baseX - 80, 4, baseZ + 25);
    tower2.castShadow = true;
    tower2.receiveShadow = true;
    tainGroup.add(tower2);

    var archGeo = new THREE.BoxGeometry(4, 6, 15);
    var arch = new THREE.Mesh(archGeo, gateMat);
    arch.position.set(baseX - 80, 3, baseZ + 17.5);
    arch.castShadow = true;
    arch.receiveShadow = true;
    tainGroup.add(arch);
  }

  function addcheckpoint() {
    var barrierGeo = new THREE.BoxGeometry(10, 2, 1);
    var barrierMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
    var barrier = new THREE.Mesh(barrierGeo, barrierMat);
    barrier.position.set(baseX + 50, 1, baseZ - 70);
    barrier.castShadow = true;
    barrier.receiveShadow = true;
    tainGroup.add(barrier);

    var guardGeo = new THREE.BoxGeometry(3, 4, 3);
    var guardMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
    var guard = new THREE.Mesh(guardGeo, guardMat);
    guard.position.set(baseX + 50, 2, baseZ - 60);
    guard.castShadow = true;
    guard.receiveShadow = true;
    tainGroup.add(guard);
  }

  function addcarts() {
    var cart1Geo = new THREE.BoxGeometry(3, 2, 5);
    var cartMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    var cart1 = new THREE.Mesh(cart1Geo, cartMat);
    cart1.position.set(baseX + 10, 1, baseZ - 25);
    cart1.castShadow = true;
    cart1.receiveShadow = true;
    tainGroup.add(cart1);

    var cart2Geo = new THREE.BoxGeometry(3, 2, 5);
    var cart2 = new THREE.Mesh(cart2Geo, cartMat);
    cart2.position.set(baseX + 20, 1, baseZ - 25);
    cart2.castShadow = true;
    cart2.receiveShadow = true;
    tainGroup.add(cart2);

    var cart3Geo = new THREE.BoxGeometry(3, 2, 5);
    var cart3 = new THREE.Mesh(cart3Geo, cartMat);
    cart3.position.set(baseX + 30, 1, baseZ - 25);
    cart3.castShadow = true;
    cart3.receiveShadow = true;
    tainGroup.add(cart3);
  }

  function build() {
    addstduthuschapl();
    addchurch();
    addtollbooth();
    adddistillery();
    addartillery();
    addgate();
    addcheckpoint();
    addcarts();
  }

  function getgroup() {
    return tainGroup;
  }

  function getposition() {
    return {
      x: baseX,
      z: baseZ
    };
  }

  build();

  return {
    group: getgroup(),
    position: getposition(),
    scene: tainGroup
  };
}());
