window.IslandBase = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var time = 0;
  var spawnPoints = [];

  var colors = {
    sand: 0xD4AF8C,
    khaki: 0x8B8B3D,
    oceanBlue: 0x1A7A5A,
    darkGray: 0x2A2A2A,
    white: 0xFFFFFF,
    green: 0x228B22,
    darkBrown: 0x654321,
    metalGray: 0x808080,
    yellow: 0xFFFF00,
    darkGreen: 0x1A4D2E
  };

  function addMesh(mesh) {
    meshes.push(mesh);
    scene.add(mesh);
    return mesh;
  }

  function createBeachTerrain() {
    var beachGroup = new THREE.Group();

    var sandWidth = 120;
    var sandDepth = 80;
    var sandGeom = new THREE.BoxGeometry(sandWidth, 0.5, sandDepth);
    var sandMat = new THREE.MeshLambertMaterial({ color: colors.sand });
    var beach = new THREE.Mesh(sandGeom, sandMat);
    beach.position.set(0, -0.25, 20);
    beach.name = 'beach';
    beachGroup.add(beach);
    addMesh(beach);

    var waterGeom = new THREE.BoxGeometry(200, 0.8, 200);
    var waterMat = new THREE.MeshLambertMaterial({ color: colors.oceanBlue });
    var water = new THREE.Mesh(waterGeom, waterMat);
    water.position.set(0, -2, 0);
    water.name = 'water';
    beachGroup.add(water);
    addMesh(water);

    return beachGroup;
  }

  function createPalmTree(x, z) {
    var treeGroup = new THREE.Group();
    treeGroup.position.set(x, 0, z);

    var trunkGeom = new THREE.CylinderGeometry(0.8, 1.2, 18, 8);
    var trunkMat = new THREE.MeshLambertMaterial({ color: colors.darkBrown });
    var trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.y = 9;
    treeGroup.add(trunk);
    addMesh(trunk);

    for (var i = 0; i < 5; i++) {
      var frondGeom = new THREE.ConeGeometry(8, 12, 16);
      var frondMat = new THREE.MeshLambertMaterial({ color: colors.green });
      var frond = new THREE.Mesh(frondGeom, frondMat);
      frond.position.y = 18;
      frond.rotation.z = (Math.PI * 2 * i / 5);
      frond.rotation.x = Math.PI / 6;
      treeGroup.add(frond);
      addMesh(frond);
    }

    return treeGroup;
  }

  function createBunkerComplex() {
    var bunkerGroup = new THREE.Group();
    bunkerGroup.position.set(-40, 0, 0);

    var mainWallGeom = new THREE.BoxGeometry(50, 12, 8);
    var bunkerMat = new THREE.MeshLambertMaterial({ color: colors.khaki });
    var mainWall = new THREE.Mesh(mainWallGeom, bunkerMat);
    mainWall.position.set(0, 6, 0);
    bunkerGroup.add(mainWall);
    addMesh(mainWall);

    var roofGeom = new THREE.BoxGeometry(55, 2, 10);
    var roofMat = new THREE.MeshLambertMaterial({ color: colors.darkGray });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(0, 13, 0);
    bunkerGroup.add(roof);
    addMesh(roof);

    for (var i = 0; i < 4; i++) {
      var slitGeom = new THREE.BoxGeometry(3, 2, 1);
      var slitMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
      var slit = new THREE.Mesh(slitGeom, slitMat);
      slit.position.set(-20 + i * 15, 8, -4);
      bunkerGroup.add(slit);
      addMesh(slit);
    }

    var entranceGeom = new THREE.BoxGeometry(6, 8, 2);
    var entranceMat = new THREE.MeshLambertMaterial({ color: colors.darkGray });
    var entrance = new THREE.Mesh(entranceGeom, entranceMat);
    entrance.position.set(18, 4, -5);
    bunkerGroup.add(entrance);
    addMesh(entrance);

    spawnPoints.push({ x: 18, y: 5, z: -15 });

    return bunkerGroup;
  }

  function createFuelDepot() {
    var depotGroup = new THREE.Group();
    depotGroup.position.set(30, 0, 0);

    var bermGeom = new THREE.BoxGeometry(25, 2, 20);
    var bermMat = new THREE.MeshLambertMaterial({ color: colors.darkGreen });
    var berm = new THREE.Mesh(bermGeom, bermMat);
    berm.position.set(0, 1, 0);
    depotGroup.add(berm);
    addMesh(berm);

    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 2; j++) {
        var tankGeom = new THREE.CylinderGeometry(3, 3, 10, 16);
        var tankMat = new THREE.MeshLambertMaterial({ color: colors.yellow });
        var tank = new THREE.Mesh(tankGeom, tankMat);
        tank.position.set(-8 + i * 8, 5, -6 + j * 10);
        tank.rotation.z = Math.PI / 2;
        depotGroup.add(tank);
        addMesh(tank);
      }
    }

    var crateGeom = new THREE.BoxGeometry(3, 3, 3);
    var crateMat = new THREE.MeshLambertMaterial({ color: colors.darkBrown });
    for (var k = 0; k < 4; k++) {
      var crate = new THREE.Mesh(crateGeom, crateMat);
      crate.position.set(-6 + k * 4, 2, 8);
      depotGroup.add(crate);
      addMesh(crate);
    }

    return depotGroup;
  }

  function createRadarStation() {
    var radarGroup = new THREE.Group();
    radarGroup.position.set(50, 0, -30);

    var baseGeom = new THREE.BoxGeometry(15, 8, 15);
    var baseMat = new THREE.MeshLambertMaterial({ color: colors.khaki });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.set(0, 4, 0);
    radarGroup.add(base);
    addMesh(base);

    var towerGeom = new THREE.CylinderGeometry(2, 2.5, 20, 12);
    var towerMat = new THREE.MeshLambertMaterial({ color: colors.metalGray });
    var tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.set(0, 18, 0);
    radarGroup.add(tower);
    addMesh(tower);

    var dishGeom = new THREE.CylinderGeometry(5, 5, 0.5, 32);
    var dishMat = new THREE.MeshLambertMaterial({ color: colors.metalGray });
    var dish = new THREE.Mesh(dishGeom, dishMat);
    dish.position.set(0, 28, 0);
    dish.name = 'radar_dish';
    radarGroup.add(dish);
    addMesh(dish);

    spawnPoints.push({ x: 50, y: 8, z: -30 });

    return radarGroup;
  }

  function createDockPier() {
    var dockGroup = new THREE.Group();
    dockGroup.position.set(-20, 0, 60);

    var pierGeom = new THREE.BoxGeometry(40, 1, 30);
    var pierMat = new THREE.MeshLambertMaterial({ color: colors.darkBrown });
    var pier = new THREE.Mesh(pierGeom, pierMat);
    pier.position.set(0, 1, 0);
    dockGroup.add(pier);
    addMesh(pier);

    for (var i = 0; i < 8; i++) {
      var pylonGeom = new THREE.CylinderGeometry(1.2, 1.5, 8, 8);
      var pylonMat = new THREE.MeshLambertMaterial({ color: colors.darkBrown });
      var pylon = new THREE.Mesh(pylonGeom, pylonMat);
      pylon.position.set(-15 + i * 5, -3, -10);
      dockGroup.add(pylon);
      addMesh(pylon);
    }

    spawnPoints.push({ x: -20, y: 3, z: 60 });

    return dockGroup;
  }

  function createPatrolBoat() {
    var boatGroup = new THREE.Group();
    boatGroup.position.set(0, 2, 85);
    boatGroup.name = 'patrol_boat';

    var hullGeom = new THREE.BoxGeometry(8, 3, 20, 4, 2, 4);
    var hullMat = new THREE.MeshLambertMaterial({ color: colors.darkGray });
    var hull = new THREE.Mesh(hullGeom, hullMat);
    hull.position.y = 0.5;
    boatGroup.add(hull);
    addMesh(hull);

    var cabinGeom = new THREE.BoxGeometry(5, 3, 8);
    var cabinMat = new THREE.MeshLambertMaterial({ color: colors.khaki });
    var cabin = new THREE.Mesh(cabinGeom, cabinMat);
    cabin.position.set(0, 3, -5);
    boatGroup.add(cabin);
    addMesh(cabin);

    var engineGeom = new THREE.CylinderGeometry(1, 1.5, 4, 8);
    var engineMat = new THREE.MeshLambertMaterial({ color: colors.metalGray });
    var engine = new THREE.Mesh(engineGeom, engineMat);
    engine.position.set(0, 2, 7);
    boatGroup.add(engine);
    addMesh(engine);

    return boatGroup;
  }

  function createVolcanicPeak() {
    var peakGroup = new THREE.Group();
    peakGroup.position.set(-60, 0, -80);

    var baseGeom = new THREE.ConeGeometry(40, 60, 16);
    var baseMat = new THREE.MeshLambertMaterial({ color: colors.darkGray });
    var basePeak = new THREE.Mesh(baseGeom, baseMat);
    basePeak.position.y = 30;
    peakGroup.add(basePeak);
    addMesh(basePeak);

    var topGeom = new THREE.ConeGeometry(15, 25, 12);
    var topMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
    var topPeak = new THREE.Mesh(topGeom, topMat);
    topPeak.position.y = 55;
    peakGroup.add(topPeak);
    addMesh(topPeak);

    return peakGroup;
  }

  function createBeachObstacles() {
    var obsGroup = new THREE.Group();
    obsGroup.position.set(0, 0, 5);

    for (var i = 0; i < 6; i++) {
      var hedgehogGeom = new THREE.BoxGeometry(2, 2, 2);
      var hedgehogMat = new THREE.MeshLambertMaterial({ color: colors.darkGray });
      var hedgehog = new THREE.Mesh(hedgehogGeom, hedgehogMat);
      hedgehog.position.set(-25 + i * 10, 1, 0);
      hedgehog.rotation.set(Math.random() * 0.3, Math.random() * 0.3, Math.random() * 0.3);
      obsGroup.add(hedgehog);
      addMesh(hedgehog);
    }

    var wireGeom = new THREE.BufferGeometry();
    var wirePositions = new Float32Array([
      -30, 2, 0, 30, 2, 0,
      -30, 2, -3, 30, 2, -3
    ]);
    wireGeom.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
    var wireMat = new THREE.LineBasicMaterial({ color: 0x888888 });
    var wire = new THREE.LineSegments(wireGeom, wireMat);
    obsGroup.add(wire);
    addMesh(wire);

    return obsGroup;
  }

  function createAmmoDump() {
    var dumpGroup = new THREE.Group();
    dumpGroup.position.set(-70, 0, 20);

    var earthGeom = new THREE.BoxGeometry(20, 2, 15);
    var earthMat = new THREE.MeshLambertMaterial({ color: colors.darkGreen });
    var earth = new THREE.Mesh(earthGeom, earthMat);
    earth.position.y = 1;
    dumpGroup.add(earth);
    addMesh(earth);

    for (var i = 0; i < 8; i++) {
      var crateGeom = new THREE.BoxGeometry(2.5, 2.5, 2.5);
      var crateMat = new THREE.MeshLambertMaterial({ color: colors.darkBrown });
      var crate = new THREE.Mesh(crateGeom, crateMat);
      crate.position.set(-7 + (i % 4) * 4, 3, -4 + Math.floor(i / 4) * 6);
      dumpGroup.add(crate);
      addMesh(crate);
    }

    spawnPoints.push({ x: -70, y: 4, z: 20 });

    return dumpGroup;
  }

  function createJungleVegetation() {
    var jungleGroup = new THREE.Group();

    var bushPositions = [
      { x: -80, z: 40 }, { x: -75, z: 50 }, { x: -85, z: 55 },
      { x: 70, z: 45 }, { x: 75, z: 35 }, { x: 68, z: 50 },
      { x: 40, z: -60 }, { x: 50, z: -65 }, { x: 45, z: -55 }
    ];

    for (var i = 0; i < bushPositions.length; i++) {
      var bushGeom = new THREE.SphereGeometry(6, 8, 6);
      var bushMat = new THREE.MeshLambertMaterial({ color: colors.green });
      var bush = new THREE.Mesh(bushGeom, bushMat);
      bush.position.set(bushPositions[i].x, 3, bushPositions[i].z);
      jungleGroup.add(bush);
      addMesh(bush);
    }

    spawnPoints.push({ x: -85, y: 5, z: 55 });

    return jungleGroup;
  }

  function createSignalBonfire() {
    var bonfireGroup = new THREE.Group();
    bonfireGroup.position.set(30, 0, -50);
    bonfireGroup.name = 'signal_bonfire';

    var baseGeom = new THREE.BoxGeometry(5, 1, 5);
    var baseMat = new THREE.MeshLambertMaterial({ color: colors.darkGray });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0.5;
    bonfireGroup.add(base);
    addMesh(base);

    var flameGeom = new THREE.SphereGeometry(3, 8, 6);
    var flameMat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
    var flame = new THREE.Mesh(flameGeom, flameMat);
    flame.position.y = 4;
    flame.name = 'bonfire_flame';
    bonfireGroup.add(flame);
    addMesh(flame);

    return bonfireGroup;
  }

  function createWatchtower() {
    var towerGroup = new THREE.Group();
    towerGroup.position.set(-50, 0, -50);
    towerGroup.name = 'watchtower';

    var baseGeom = new THREE.BoxGeometry(6, 20, 6);
    var baseMat = new THREE.MeshLambertMaterial({ color: colors.khaki });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 10;
    towerGroup.add(base);
    addMesh(base);

    var platformGeom = new THREE.BoxGeometry(8, 1, 8);
    var platformMat = new THREE.MeshLambertMaterial({ color: colors.darkBrown });
    var platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.y = 20;
    towerGroup.add(platform);
    addMesh(platform);

    var railGeom = new THREE.BoxGeometry(8, 1.5, 0.3);
    var railMat = new THREE.MeshLambertMaterial({ color: colors.metalGray });
    var rail = new THREE.Mesh(railGeom, railMat);
    rail.position.set(0, 20.75, 4);
    towerGroup.add(rail);
    addMesh(rail);

    var spotGeom = new THREE.CylinderGeometry(1, 1.2, 8, 12);
    var spotMat = new THREE.MeshLambertMaterial({ color: colors.metalGray });
    var spotlight = new THREE.Mesh(spotGeom, spotMat);
    spotlight.position.set(0, 22, 0);
    spotlight.name = 'searchlight';
    towerGroup.add(spotlight);
    addMesh(spotlight);

    spawnPoints.push({ x: -50, y: 22, z: -50 });

    return towerGroup;
  }

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    spawnPoints = [];
    time = 0;

    var beachTerrain = createBeachTerrain();
    scene.add(beachTerrain);

    var palmPositions = [
      { x: -30, z: 35 }, { x: -20, z: 40 }, { x: -10, z: 35 },
      { x: 10, z: 38 }, { x: 25, z: 40 }, { x: -40, z: 50 }
    ];

    for (var i = 0; i < palmPositions.length; i++) {
      var palm = createPalmTree(palmPositions[i].x, palmPositions[i].z);
      scene.add(palm);
    }

    var bunker = createBunkerComplex();
    scene.add(bunker);

    var fuel = createFuelDepot();
    scene.add(fuel);

    var radar = createRadarStation();
    scene.add(radar);

    var dock = createDockPier();
    scene.add(dock);

    var boat = createPatrolBoat();
    scene.add(boat);

    var peak = createVolcanicPeak();
    scene.add(peak);

    var obstacles = createBeachObstacles();
    scene.add(obstacles);

    var ammo = createAmmoDump();
    scene.add(ammo);

    var jungle = createJungleVegetation();
    scene.add(jungle);

    var bonfire = createSignalBonfire();
    scene.add(bonfire);

    var watchtower = createWatchtower();
    scene.add(watchtower);

    spawnPoints.push({ x: -10, y: 2, z: 15 });

    return true;
  };

  var update = function(delta) {
    time += delta;

    for (var i = 0; i < meshes.length; i++) {
      var mesh = meshes[i];

      if (mesh.name && mesh.name.indexOf('frond') === -1 && mesh.parent && mesh.parent.name === undefined) {
        if (mesh.parent.children.length > 1 && mesh !== mesh.parent.children[0]) {
          var sway = Math.sin(time * 1.5 + i) * 0.02;
          var originalRot = mesh.rotation.z || 0;
          if (mesh.name && mesh.name.indexOf('Cone') === -1) {
            mesh.rotation.z = originalRot + sway;
          }
        }
      }
    }

    for (var j = 0; j < meshes.length; j++) {
      if (meshes[j].name === 'patrol_boat') {
        var boatParent = meshes[j];
        boatParent.position.y = 2 + Math.sin(time * 0.8) * 0.5;
        boatParent.rotation.z = Math.sin(time * 0.6) * 0.05;
      }
    }

    for (var k = 0; k < meshes.length; k++) {
      if (meshes[k].name === 'radar_dish') {
        meshes[k].rotation.z += delta * 0.5;
      }
    }

    for (var l = 0; l < meshes.length; l++) {
      if (meshes[l].name === 'bonfire_flame') {
        var scale = 1 + Math.sin(time * 3.5) * 0.2;
        meshes[l].scale.set(scale, scale, scale);
        meshes[l].position.y = 4 + Math.sin(time * 2.8) * 0.3;
      }
    }

    for (var m = 0; m < meshes.length; m++) {
      if (meshes[m].name === 'water') {
        var wave = Math.sin(time * 1.2 + meshes[m].position.x * 0.1) * 0.1;
        meshes[m].position.y = -2 + wave;
      }
    }

    for (var n = 0; n < meshes.length; n++) {
      if (meshes[n].name === 'searchlight') {
        var angle = (time * 1.2) % (Math.PI * 2);
        meshes[n].rotation.y = angle;
      }
    }
  };

  var reset = function() {
    for (var i = meshes.length - 1; i >= 0; i--) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    spawnPoints = [];
    time = 0;
  };

  var getSpawnPoints = function() {
    return spawnPoints;
  };

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: getSpawnPoints
  };
}());
