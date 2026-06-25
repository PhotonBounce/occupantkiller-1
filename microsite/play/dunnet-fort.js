window.DunnetFort = (function() {
  'use strict';

  var baseX = 980;
  var baseZ = 1240;

  function lighthouse(scene) {
    var towerGeo = new THREE.CylinderGeometry(2, 2.2, 16, 32);
    var whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var tower = new THREE.Mesh(towerGeo, whiteMat);
    tower.position.set(baseX - 40, 8, baseZ - 50);
    scene.add(tower);

    var capGeo = new THREE.ConeGeometry(2.3, 3, 32);
    var redMat = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
    var cap = new THREE.Mesh(capGeo, redMat);
    cap.position.set(baseX - 40, 18.5, baseZ - 50);
    scene.add(cap);

    var lanternGeo = new THREE.SphereGeometry(1.5, 32, 32);
    var yellowMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    var lantern = new THREE.Mesh(lanternGeo, yellowMat);
    lantern.position.set(baseX - 40, 20.5, baseZ - 50);
    scene.add(lantern);
  }

  function gunEmplacement(scene) {
    var platformGeo = new THREE.BoxGeometry(12, 1, 8);
    var concreteMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
    var platform = new THREE.Mesh(platformGeo, concreteMat);
    platform.position.set(baseX + 30, 2, baseZ - 80);
    scene.add(platform);

    var gunGeo = new THREE.CylinderGeometry(0.6, 0.7, 8, 24);
    var steelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

    var gun1 = new THREE.Mesh(gunGeo, steelMat);
    gun1.rotation.z = Math.PI / 6;
    gun1.position.set(baseX + 25, 3.5, baseZ - 82);
    scene.add(gun1);

    var gun2 = new THREE.Mesh(gunGeo, steelMat);
    gun2.rotation.z = Math.PI / 6;
    gun2.position.set(baseX + 35, 3.5, baseZ - 78);
    scene.add(gun2);
  }

  function radarStation(scene) {
    var plinthGeo = new THREE.CylinderGeometry(3, 3.2, 2, 32);
    var concreteMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
    var plinth = new THREE.Mesh(plinthGeo, concreteMat);
    plinth.position.set(baseX - 60, 1, baseZ + 40);
    scene.add(plinth);

    var radomeGeo = new THREE.SphereGeometry(6, 32, 32);
    var radomeColor = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    var radome = new THREE.Mesh(radomeGeo, radomeColor);
    radome.position.set(baseX - 60, 8, baseZ + 40);
    scene.add(radome);
  }

  function observationPost(scene) {
    var towerGeo = new THREE.CylinderGeometry(1.8, 1.8, 14, 24);
    var stoneMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    var tower = new THREE.Mesh(towerGeo, stoneMat);
    tower.position.set(baseX + 70, 7, baseZ + 60);
    scene.add(tower);

    var roofGeo = new THREE.ConeGeometry(2.2, 2, 24);
    var redMat = new THREE.MeshLambertMaterial({ color: 0xaa0000 });
    var roof = new THREE.Mesh(roofGeo, redMat);
    roof.position.set(baseX + 70, 15, baseZ + 60);
    scene.add(roof);
  }

  function mineBoat(scene) {
    var hullGeo = new THREE.BoxGeometry(6, 2, 3);
    var steelMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    var hull = new THREE.Mesh(hullGeo, steelMat);
    hull.position.set(baseX - 100, 1, baseZ + 100);
    scene.add(hull);

    var gunGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 20);
    var gunMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var gun = new THREE.Mesh(gunGeo, gunMat);
    gun.rotation.z = Math.PI / 8;
    gun.position.set(baseX - 100, 3, baseZ + 100);
    scene.add(gun);

    var railGeo = new THREE.CylinderGeometry(0.15, 0.15, 12, 12);
    var railMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var rail = new THREE.Mesh(railGeo, railMat);
    rail.rotation.x = Math.PI / 16;
    rail.position.set(baseX - 100, 0.5, baseZ + 106);
    scene.add(rail);
  }

  function flagpole(scene) {
    var poleGeo = new THREE.CylinderGeometry(0.3, 0.3, 12, 16);
    var metalMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var pole = new THREE.Mesh(poleGeo, metalMat);
    pole.position.set(baseX + 50, 6, baseZ - 20);
    scene.add(pole);

    var flagGeo = new THREE.BoxGeometry(3, 2, 0.1);
    var redMat = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
    var redSection = new THREE.Mesh(flagGeo, redMat);
    redSection.position.set(baseX + 52.5, 10, baseZ - 20);
    scene.add(redSection);

    var whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var whiteSec = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 0.1), whiteMat);
    whiteSec.position.set(baseX + 52.5, 10, baseZ - 20.05);
    scene.add(whiteSec);

    var blueMat = new THREE.MeshLambertMaterial({ color: 0x0033cc });
    var blueSec = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 0.1), blueMat);
    blueSec.position.set(baseX + 52.5, 10, baseZ - 19.95);
    scene.add(blueSec);
  }

  function emergencyBunker(scene) {
    var bunkerGeo = new THREE.BoxGeometry(10, 4, 8);
    var stoneMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    var bunker = new THREE.Mesh(bunkerGeo, stoneMat);
    bunker.position.set(baseX - 20, 0.5, baseZ - 120);
    scene.add(bunker);

    var ventGeo = new THREE.CylinderGeometry(0.8, 0.8, 6, 16);
    var metalMat = new THREE.MeshLambertMaterial({ color: 0x444444 });

    var vent1 = new THREE.Mesh(ventGeo, metalMat);
    vent1.position.set(baseX - 25, 4, baseZ - 125);
    scene.add(vent1);

    var vent2 = new THREE.Mesh(ventGeo, metalMat);
    vent2.position.set(baseX - 15, 4, baseZ - 115);
    scene.add(vent2);
  }

  function windTurbine(scene) {
    var towerGeo = new THREE.CylinderGeometry(1.5, 1.6, 20, 28);
    var whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var tower = new THREE.Mesh(towerGeo, whiteMat);
    tower.position.set(baseX - 80, 10, baseZ - 10);
    scene.add(tower);

    var hubGeo = new THREE.SphereGeometry(1.2, 24, 24);
    var hubMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    var hub = new THREE.Mesh(hubGeo, hubMat);
    hub.position.set(baseX - 80, 21, baseZ - 10);
    scene.add(hub);

    var bladeGeo = new THREE.BoxGeometry(2, 10, 0.4);
    var bladeMat = new THREE.MeshLambertMaterial({ color: 0xfafafa });

    var blade1 = new THREE.Mesh(bladeGeo, bladeMat);
    blade1.rotation.z = 0;
    blade1.position.set(baseX - 80, 21, baseZ - 10);
    scene.add(blade1);

    var blade2 = new THREE.Mesh(bladeGeo, bladeMat);
    blade2.rotation.z = Math.PI * 0.6667;
    blade2.position.set(baseX - 80, 21, baseZ - 10);
    scene.add(blade2);

    var blade3 = new THREE.Mesh(bladeGeo, bladeMat);
    blade3.rotation.z = Math.PI * 1.3333;
    blade3.position.set(baseX - 80, 21, baseZ - 10);
    scene.add(blade3);
  }

  function build(scene) {
    lighthouse(scene);
    gunEmplacement(scene);
    radarStation(scene);
    observationPost(scene);
    mineBoat(scene);
    flagpole(scene);
    emergencyBunker(scene);
    windTurbine(scene);
  }

  return {
    build: build
  };
}());
