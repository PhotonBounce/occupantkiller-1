window.LochinverDock = (function() {
  'use strict';

  var baseX = 1100;
  var baseZ = 1420;

  function create() {
    var group = new THREE.Group();
    group.position.set(baseX, 0, baseZ);

    var suilvenMountain = buildSuilven();
    group.add(suilvenMountain);

    var harbour = buildHarbour();
    group.add(harbour);

    var pier = buildPier();
    group.add(pier);

    var factory = buildFactory();
    group.add(factory);

    var submarinePen = buildSubmarinePen();
    group.add(submarinePen);

    var township = buildTownship();
    group.add(township);

    var broch = buildBroch();
    group.add(broch);

    var radar = buildRadar();
    group.add(radar);

    return group;
  }

  function buildSuilven() {
    var group = new THREE.Group();

    var grayMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });

    var peak1Geom = new THREE.BoxGeometry(15, 35, 12);
    var peak1 = new THREE.Mesh(peak1Geom, grayMaterial);
    peak1.position.set(-12, 18, 0);
    peak1.rotation.z = 0.3;
    group.add(peak1);

    var peak2Geom = new THREE.BoxGeometry(18, 45, 14);
    var peak2 = new THREE.Mesh(peak2Geom, grayMaterial);
    peak2.position.set(0, 23, 2);
    peak2.rotation.z = -0.1;
    group.add(peak2);

    var peak3Geom = new THREE.BoxGeometry(16, 38, 11);
    var peak3 = new THREE.Mesh(peak3Geom, grayMaterial);
    peak3.position.set(14, 20, -1);
    peak3.rotation.z = -0.25;
    group.add(peak3);

    var baseGeom = new THREE.BoxGeometry(50, 12, 40);
    var baseMesh = new THREE.Mesh(baseGeom, grayMaterial);
    baseMesh.position.set(0, 6, 0);
    group.add(baseMesh);

    group.position.set(-40, 0, 80);

    return group;
  }

  function buildHarbour() {
    var group = new THREE.Group();

    var maroonMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    var metalMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

    var mainShedGeom = new THREE.BoxGeometry(14, 5, 5);
    var mainShed = new THREE.Mesh(mainShedGeom, maroonMaterial);
    mainShed.position.set(0, 2.5, 0);
    group.add(mainShed);

    var roofGeom = new THREE.BoxGeometry(15, 1, 6);
    var roof = new THREE.Mesh(roofGeom, metalMaterial);
    roof.position.set(0, 5.5, 0);
    group.add(roof);

    var doorGeom = new THREE.BoxGeometry(2, 3, 0.5);
    var door = new THREE.Mesh(doorGeom, new THREE.MeshLambertMaterial({ color: 0x333333 }));
    door.position.set(-5, 2.5, 2.6);
    group.add(door);

    group.position.set(20, 0, -30);

    return group;
  }

  function buildPier() {
    var group = new THREE.Group();

    var woodMaterial = new THREE.MeshLambertMaterial({ color: 0x704030 });
    var hullMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3a52 });

    var pierGeom = new THREE.BoxGeometry(25, 2, 4);
    var pier = new THREE.Mesh(pierGeom, woodMaterial);
    pier.position.set(0, 1, 0);
    group.add(pier);

    var boat1Geom = new THREE.BoxGeometry(8, 3, 3);
    var boat1 = new THREE.Mesh(boat1Geom, hullMaterial);
    boat1.position.set(-8, 2.5, 3);
    group.add(boat1);

    var boat2Geom = new THREE.BoxGeometry(6, 2.5, 2.5);
    var boat2 = new THREE.Mesh(boat2Geom, hullMaterial);
    boat2.position.set(0, 2, 4);
    group.add(boat2);

    var boat3Geom = new THREE.BoxGeometry(10, 3.5, 3);
    var boat3 = new THREE.Mesh(boat3Geom, hullMaterial);
    boat3.position.set(9, 2.7, 3);
    group.add(boat3);

    group.position.set(35, 0, 10);

    return group;
  }

  function buildFactory() {
    var group = new THREE.Group();

    var factoryMaterial = new THREE.MeshLambertMaterial({ color: 0x999999 });
    var blackMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

    var mainBuildingGeom = new THREE.BoxGeometry(10, 4, 6);
    var mainBuilding = new THREE.Mesh(mainBuildingGeom, factoryMaterial);
    mainBuilding.position.set(0, 2, 0);
    group.add(mainBuilding);

    var chimneyGeom = new THREE.CylinderGeometry(1.2, 1.5, 8, 8);
    var chimney = new THREE.Mesh(chimneyGeom, blackMaterial);
    chimney.position.set(3, 6, 1.5);
    group.add(chimney);

    var ventGeom = new THREE.CylinderGeometry(0.8, 1, 6, 8);
    var vent = new THREE.Mesh(ventGeom, blackMaterial);
    vent.position.set(-2, 5, -1);
    group.add(vent);

    var platformGeom = new THREE.BoxGeometry(12, 0.5, 7);
    var platform = new THREE.Mesh(platformGeom, factoryMaterial);
    platform.position.set(0, 4, 0);
    group.add(platform);

    group.position.set(-50, 0, -40);

    return group;
  }

  function buildSubmarinePen() {
    var group = new THREE.Group();

    var concreteMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
    var darkMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });

    var penGeom = new THREE.BoxGeometry(20, 5, 8);
    var pen = new THREE.Mesh(penGeom, concreteMaterial);
    pen.position.set(0, 2.5, 0);
    group.add(pen);

    var roofGeom = new THREE.BoxGeometry(21, 1, 9);
    var roof = new THREE.Mesh(roofGeom, darkMaterial);
    roof.position.set(0, 5, 0);
    group.add(roof);

    var doorLeftGeom = new THREE.BoxGeometry(1, 4, 0.5);
    var doorLeft = new THREE.Mesh(doorLeftGeom, darkMaterial);
    doorLeft.position.set(-8, 2.5, 4.1);
    group.add(doorLeft);

    var doorRightGeom = new THREE.BoxGeometry(1, 4, 0.5);
    var doorRight = new THREE.Mesh(doorRightGeom, darkMaterial);
    doorRight.position.set(8, 2.5, 4.1);
    group.add(doorRight);

    group.position.set(60, 0, 50);

    return group;
  }

  function buildTownship() {
    var group = new THREE.Group();

    var whiteMaterial = new THREE.MeshLambertMaterial({ color: 0xf5f5dc });
    var redMaterial = new THREE.MeshLambertMaterial({ color: 0xcc3333 });
    var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

    var cottage1Geom = new THREE.BoxGeometry(5, 3.5, 4);
    var cottage1 = new THREE.Mesh(cottage1Geom, whiteMaterial);
    cottage1.position.set(-8, 1.75, -5);
    group.add(cottage1);

    var roof1Geom = new THREE.BoxGeometry(5.5, 1.5, 4.5);
    var roof1 = new THREE.Mesh(roof1Geom, redMaterial);
    roof1.position.set(-8, 3.5, -5);
    group.add(roof1);

    var cottage2Geom = new THREE.BoxGeometry(5, 3.5, 4);
    var cottage2 = new THREE.Mesh(cottage2Geom, whiteMaterial);
    cottage2.position.set(0, 1.75, 6);
    group.add(cottage2);

    var roof2Geom = new THREE.BoxGeometry(5.5, 1.5, 4.5);
    var roof2 = new THREE.Mesh(roof2Geom, redMaterial);
    roof2.position.set(0, 3.5, 6);
    group.add(roof2);

    var cottage3Geom = new THREE.BoxGeometry(5, 3.5, 4);
    var cottage3 = new THREE.Mesh(cottage3Geom, whiteMaterial);
    cottage3.position.set(9, 1.75, -3);
    group.add(cottage3);

    var roof3Geom = new THREE.BoxGeometry(5.5, 1.5, 4.5);
    var roof3 = new THREE.Mesh(roof3Geom, redMaterial);
    roof3.position.set(9, 3.5, -3);
    group.add(roof3);

    group.position.set(-60, 0, 20);

    return group;
  }

  function buildBroch() {
    var group = new THREE.Group();

    var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

    var outerWallGeom = new THREE.CylinderGeometry(5, 5, 6, 16);
    var outerWall = new THREE.Mesh(outerWallGeom, stoneMaterial);
    outerWall.position.set(0, 3, 0);
    group.add(outerWall);

    var innerWallGeom = new THREE.CylinderGeometry(2.5, 2.5, 6, 16);
    var innerWall = new THREE.Mesh(innerWallGeom, new THREE.MeshLambertMaterial({ color: 0x333333 }));
    innerWall.position.set(0, 3, 0);
    group.add(innerWall);

    var roofGeom = new THREE.ConeGeometry(5.5, 2, 16);
    var roof = new THREE.Mesh(roofGeom, stoneMaterial);
    roof.position.set(0, 6.5, 0);
    group.add(roof);

    group.position.set(25, 0, -60);

    return group;
  }

  function buildRadar() {
    var group = new THREE.Group();

    var whiteMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    var metalMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    var blackMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });

    var domeGeom = new THREE.SphereGeometry(3, 16, 12);
    var dome = new THREE.Mesh(domeGeom, whiteMaterial);
    dome.position.set(0, 3.5, 0);
    group.add(dome);

    var mastGeom = new THREE.CylinderGeometry(0.4, 0.5, 8, 8);
    var mast = new THREE.Mesh(mastGeom, metalMaterial);
    mast.position.set(0, 4.5, 0);
    group.add(mast);

    var baseGeom = new THREE.CylinderGeometry(2, 2.5, 1, 8);
    var base = new THREE.Mesh(baseGeom, metalMaterial);
    base.position.set(0, 0.5, 0);
    group.add(base);

    var antennaGeom = new THREE.CylinderGeometry(0.15, 0.15, 3, 6);
    var antenna = new THREE.Mesh(antennaGeom, blackMaterial);
    antenna.position.set(0, 8.5, 0);
    group.add(antenna);

    group.position.set(-80, 30, -100);

    return group;
  }

  return {
    create: create
  };
}());
