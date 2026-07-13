window.DesertLab = (function() {
  'use strict';

  var objects = [];
  var glowMaterials = [];
  var animatedObjects = [];
  var radarDish = null;

  function addObject(obj) {
    objects.push(obj);
    return obj;
  }

  function createSurfaceEnvironment(scene) {
    // Desert sand terrain
    var sandGeometry = new THREE.BoxGeometry(80, 2, 80);
    var sandMaterial = new THREE.MeshPhongMaterial({ color: 0xDEB887 });
    var sandTerrain = addObject(new THREE.Mesh(sandGeometry, sandMaterial));
    sandTerrain.position.y = -1;
    scene.add(sandTerrain);

    // Rock formations scattered across surface
    for (var i = 0; i < 12; i++) {
      var rockGeometry = new THREE.BoxGeometry(
        2 + Math.random() * 4,
        1 + Math.random() * 3,
        2 + Math.random() * 4
      );
      var rockMaterial = new THREE.MeshPhongMaterial({ color: 0xA0826D });
      var rock = addObject(new THREE.Mesh(rockGeometry, rockMaterial));
      rock.position.x = (Math.random() - 0.5) * 70;
      rock.position.y = Math.random() * 1;
      rock.position.z = (Math.random() - 0.5) * 70;
      rock.rotation.x = Math.random() * 0.3;
      rock.rotation.z = Math.random() * 0.3;
      scene.add(rock);
    }

    // Hidden entrance hatch
    var hatchGeometry = new THREE.BoxGeometry(6, 0.5, 6);
    var hatchMaterial = new THREE.MeshPhongMaterial({ color: 0x8B7355 });
    var hatch = addObject(new THREE.Mesh(hatchGeometry, hatchMaterial));
    hatch.position.set(-15, 0.25, -15);
    scene.add(hatch);

    // Hatch frame
    var frameGeometry = new THREE.BoxGeometry(6.5, 0.3, 6.5);
    var frameMaterial = new THREE.MeshPhongMaterial({ color: 0x556B2F });
    var frame = addObject(new THREE.Mesh(frameGeometry, frameMaterial));
    frame.position.set(-15, -0.2, -15);
    scene.add(frame);

    // Ramp leading down
    var rampGeometry = new THREE.BoxGeometry(6, 0.5, 12);
    var rampMaterial = new THREE.MeshPhongMaterial({ color: 0x8B7355 });
    var ramp = addObject(new THREE.Mesh(rampGeometry, rampMaterial));
    ramp.position.set(-15, -2, -21);
    ramp.rotation.z = Math.PI / 8;
    scene.add(ramp);

    // Radar dish stand
    var standGeometry = new THREE.BoxGeometry(2, 8, 2);
    var standMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });
    var stand = addObject(new THREE.Mesh(standGeometry, standMaterial));
    stand.position.set(25, 4, 25);
    scene.add(stand);

    // Radar dish
    var dishGeometry = new THREE.ConeGeometry(6, 0.5, 32);
    var dishMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
    radarDish = addObject(new THREE.Mesh(dishGeometry, dishMaterial));
    radarDish.position.set(25, 9, 25);
    radarDish.rotation.x = Math.PI / 3;
    scene.add(radarDish);
    animatedObjects.push({ object: radarDish, type: 'radar' });
  }

  function createUndergroundStructure(scene) {
    // Main bunker floor
    var floorGeometry = new THREE.BoxGeometry(60, 0.5, 60);
    var floorMaterial = new THREE.MeshPhongMaterial({ color: 0xE8E8E8 });
    var floor = addObject(new THREE.Mesh(floorGeometry, floorMaterial));
    floor.position.y = -10;
    scene.add(floor);

    // Main bunker ceiling
    var ceilingGeometry = new THREE.BoxGeometry(60, 0.5, 60);
    var ceilingMaterial = new THREE.MeshPhongMaterial({ color: 0xD3D3D3 });
    var ceiling = addObject(new THREE.Mesh(ceilingGeometry, ceilingMaterial));
    ceiling.position.y = 0;
    scene.add(ceiling);

    // Ceiling supports - grid pattern
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        var supportGeometry = new THREE.CylinderGeometry(0.8, 0.8, 10, 12);
        var supportMaterial = new THREE.MeshPhongMaterial({ color: 0xA9A9A9 });
        var support = addObject(new THREE.Mesh(supportGeometry, supportMaterial));
        support.position.set(-20 + i * 20, -5, -20 + j * 20);
        scene.add(support);
      }
    }

    // Bunker walls
    var wallMaterial = new THREE.MeshPhongMaterial({ color: 0xF5F5F5 });

    // North wall
    var northWallGeometry = new THREE.BoxGeometry(60, 10, 0.5);
    var northWall = addObject(new THREE.Mesh(northWallGeometry, wallMaterial));
    northWall.position.set(0, -5, -30);
    scene.add(northWall);

    // South wall
    var southWallGeometry = new THREE.BoxGeometry(60, 10, 0.5);
    var southWall = addObject(new THREE.Mesh(southWallGeometry, wallMaterial));
    southWall.position.set(0, -5, 30);
    scene.add(southWall);

    // East wall
    var eastWallGeometry = new THREE.BoxGeometry(0.5, 10, 60);
    var eastWall = addObject(new THREE.Mesh(eastWallGeometry, wallMaterial));
    eastWall.position.set(30, -5, 0);
    scene.add(eastWall);

    // West wall
    var westWallGeometry = new THREE.BoxGeometry(0.5, 10, 60);
    var westWall = addObject(new THREE.Mesh(westWallGeometry, wallMaterial));
    westWall.position.set(-30, -5, 0);
    scene.add(westWall);
  }

  function createResearchStations(scene) {
    // Research station workbenches - 3 rows
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 4; col++) {
        // Workbench table
        var benchGeometry = new THREE.BoxGeometry(4, 1, 2);
        var benchMaterial = new THREE.MeshPhongMaterial({ color: 0xCCCCCC });
        var bench = addObject(new THREE.Mesh(benchGeometry, benchMaterial));
        bench.position.set(-18 + col * 10, -9.5, -12 + row * 8);
        scene.add(bench);

        // Equipment on bench - spheres and boxes
        var equipGeometry1 = new THREE.SphereGeometry(0.4, 16, 16);
        var equipMaterial1 = new THREE.MeshPhongMaterial({ color: 0xFF6B6B });
        var equip1 = addObject(new THREE.Mesh(equipGeometry1, equipMaterial1));
        equip1.position.set(-19 + col * 10, -8.5, -12 + row * 8);
        scene.add(equip1);

        var equipGeometry2 = new THREE.BoxGeometry(0.6, 0.8, 0.6);
        var equipMaterial2 = new THREE.MeshPhongMaterial({ color: 0x4169E1 });
        var equip2 = addObject(new THREE.Mesh(equipGeometry2, equipMaterial2));
        equip2.position.set(-17 + col * 10, -8.3, -12 + row * 8);
        scene.add(equip2);

        var equipGeometry3 = new THREE.SphereGeometry(0.3, 16, 16);
        var equipMaterial3 = new THREE.MeshPhongMaterial({ color: 0x32CD32 });
        var equip3 = addObject(new THREE.Mesh(equipGeometry3, equipMaterial3));
        equip3.position.set(-18 + col * 10, -8.2, -11 + row * 8);
        scene.add(equip3);
      }
    }
  }

  function createSpecimenContainment(scene) {
    // Specimen containment tanks - cylindrical
    for (var i = 0; i < 6; i++) {
      var tankGeometry = new THREE.CylinderGeometry(1.5, 1.5, 3, 16);
      var tankMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a3a3a,
        emissive: 0x00AA44,
        emissiveIntensity: 0.3
      });
      var tank = addObject(new THREE.Mesh(tankGeometry, tankMaterial));
      tank.position.set(-20 + i * 8, -7, 12);
      scene.add(tank);
      glowMaterials.push(tankMaterial);
      animatedObjects.push({ object: tank, type: 'glow', material: tankMaterial });

      // Tank cap
      var capGeometry = new THREE.CylinderGeometry(1.6, 1.5, 0.3, 16);
      var capMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
      var cap = addObject(new THREE.Mesh(capGeometry, capMaterial));
      cap.position.set(-20 + i * 8, -5.8, 12);
      scene.add(cap);
    }
  }

  function createCleanRoom(scene) {
    // Clean room chamber
    var cleanRoomGeometry = new THREE.BoxGeometry(12, 8, 10);
    var cleanRoomMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
    var cleanRoom = addObject(new THREE.Mesh(cleanRoomGeometry, cleanRoomMaterial));
    cleanRoom.position.set(15, -6, -8);
    scene.add(cleanRoom);

    // Outer airlock door 1
    var door1Geometry = new THREE.BoxGeometry(4, 6, 0.3);
    var doorMaterial = new THREE.MeshPhongMaterial({ color: 0xCCCCCC });
    var door1 = addObject(new THREE.Mesh(door1Geometry, doorMaterial));
    door1.position.set(9.5, -6, -8);
    scene.add(door1);

    // Inner airlock door 2
    var door2Geometry = new THREE.BoxGeometry(4, 6, 0.3);
    var door2 = addObject(new THREE.Mesh(door2Geometry, doorMaterial));
    door2.position.set(20.5, -6, -8);
    scene.add(door2);

    // Airlock corridor between doors
    var airlockGeometry = new THREE.BoxGeometry(2, 6, 8);
    var airlockMaterial = new THREE.MeshPhongMaterial({ color: 0xE0E0E0 });
    var airlock = addObject(new THREE.Mesh(airlockGeometry, airlockMaterial));
    airlock.position.set(15, -6, -8);
    scene.add(airlock);
  }

  function createPowerRoom(scene) {
    // Main generator boxes
    for (var i = 0; i < 3; i++) {
      var generatorGeometry = new THREE.BoxGeometry(5, 6, 4);
      var generatorMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });
      var generator = addObject(new THREE.Mesh(generatorGeometry, generatorMaterial));
      generator.position.set(-15 + i * 10, -6, 18);
      scene.add(generator);

      // Turbine on generator
      var turbineGeometry = new THREE.CylinderGeometry(1, 1, 6, 12);
      var turbineMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
      var turbine = addObject(new THREE.Mesh(turbineGeometry, turbineMaterial));
      turbine.position.set(-15 + i * 10, -3, 18);
      turbine.rotation.z = Math.PI / 2;
      scene.add(turbine);
      animatedObjects.push({ object: turbine, type: 'spin' });
    }

    // Power conduits
    for (var j = 0; j < 4; j++) {
      var conduitGeometry = new THREE.CylinderGeometry(0.3, 0.3, 30, 8);
      var conduitMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
      var conduit = addObject(new THREE.Mesh(conduitGeometry, conduitMaterial));
      conduit.position.set(-10 + j * 7, 0, 0);
      conduit.rotation.z = Math.PI / 2;
      scene.add(conduit);
    }
  }

  function createServerFarm(scene) {
    // Server towers in grid
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 4; col++) {
        var towerGeometry = new THREE.BoxGeometry(1.5, 5, 1);
        var towerMaterial = new THREE.MeshPhongMaterial({ color: 0x2F4F4F });
        var tower = addObject(new THREE.Mesh(towerGeometry, towerMaterial));
        tower.position.set(2 + col * 3, -7, -18 + row * 5);
        scene.add(tower);

        // Status lights on tower
        for (var light = 0; light < 4; light++) {
          var lightGeometry = new THREE.SphereGeometry(0.25, 8, 8);
          var lightColor = [0x00FF00, 0xFF0000, 0xFFFF00, 0x0000FF][light];
          var lightMaterial = new THREE.MeshPhongMaterial({
            color: lightColor,
            emissive: lightColor,
            emissiveIntensity: 0.5
          });
          var statusLight = addObject(new THREE.Mesh(lightGeometry, lightMaterial));
          statusLight.position.set(2 + col * 3, -5 + light * 1, -18 + row * 5);
          scene.add(statusLight);
        }
      }
    }
  }

  function createMedicalBay(scene) {
    // Operating tables
    for (var i = 0; i < 2; i++) {
      var tableGeometry = new THREE.BoxGeometry(3, 1, 1.5);
      var tableMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
      var table = addObject(new THREE.Mesh(tableGeometry, tableMaterial));
      table.position.set(-10 + i * 8, -9, 0);
      scene.add(table);

      // Overhead light
      var lightGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 12);
      var lightMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFFF99,
        emissive: 0xFFFF99,
        emissiveIntensity: 0.7
      });
      var light = addObject(new THREE.Mesh(lightGeometry, lightMaterial));
      light.position.set(-10 + i * 8, -5, 0);
      scene.add(light);

      // Light fixture base
      var fixtureGeometry = new THREE.SphereGeometry(0.4, 12, 12);
      var fixtureMaterial = new THREE.MeshPhongMaterial({ color: 0xD3D3D3 });
      var fixture = addObject(new THREE.Mesh(fixtureGeometry, fixtureMaterial));
      fixture.position.set(-10 + i * 8, -5.8, 0);
      scene.add(fixture);
    }
  }

  function createSecurityCheckpoint(scene) {
    // Guard post
    var guardPostGeometry = new THREE.BoxGeometry(8, 3, 3);
    var guardPostMaterial = new THREE.MeshPhongMaterial({ color: 0xA9A9A9 });
    var guardPost = addObject(new THREE.Mesh(guardPostGeometry, guardPostMaterial));
    guardPost.position.set(0, -8.5, -25);
    scene.add(guardPost);

    // Scanner arch - cylinder posts
    var archLeftGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 12);
    var archMaterial = new THREE.MeshPhongMaterial({ color: 0x556B2F });
    var archLeft = addObject(new THREE.Mesh(archLeftGeometry, archMaterial));
    archLeft.position.set(-3, -7, -25);
    scene.add(archLeft);

    var archRight = addObject(new THREE.Mesh(archLeftGeometry, archMaterial));
    archRight.position.set(3, -7, -25);
    scene.add(archRight);

    // Arch connectors - LineSegments
    var archGeometry = new THREE.BufferGeometry();
    var vertices = new Float32Array([
      -3, -3, -25,   3, -3, -25,
      -3, -3, -25,   -2.5, -2, -25,
      -2.5, -2, -25, -2, -1, -25,
      -2, -1, -25,   2, -1, -25,
      2, -1, -25,    2.5, -2, -25,
      2.5, -2, -25,  3, -3, -25
    ]);
    archGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    var archLineMaterial = new THREE.LineBasicMaterial({ color: 0x00FF00, linewidth: 2 });
    var archLine = addObject(new THREE.LineSegments(archGeometry, archLineMaterial));
    scene.add(archLine);

    // Control panel
    var panelGeometry = new THREE.BoxGeometry(2, 2, 0.3);
    var panelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var panel = addObject(new THREE.Mesh(panelGeometry, panelMaterial));
    panel.position.set(-4, -8, -25);
    scene.add(panel);

    // Panel buttons
    for (var btn = 0; btn < 4; btn++) {
      var buttonGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      var buttonMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
      var button = addObject(new THREE.Mesh(buttonGeometry, buttonMaterial));
      button.position.set(-3.5 + btn * 0.5, -7.5, -24.8);
      scene.add(button);
    }
  }

  function createEscapeShaft(scene) {
    // Vertical shaft
    var shaftGeometry = new THREE.CylinderGeometry(2, 2, 25, 16);
    var shaftMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var shaft = addObject(new THREE.Mesh(shaftGeometry, shaftMaterial));
    shaft.position.set(20, -5, 20);
    scene.add(shaft);

    // Ladder rungs - BoxGeometry
    for (var rung = 0; rung < 20; rung++) {
      var rungGeometry = new THREE.BoxGeometry(3, 0.2, 0.3);
      var rungMaterial = new THREE.MeshPhongMaterial({ color: 0xC0C0C0 });
      var ladderRung = addObject(new THREE.Mesh(rungGeometry, rungMaterial));
      ladderRung.position.set(20, -10 + rung * 1.25, 20);
      scene.add(ladderRung);
    }

    // Ladder rails
    for (var rail = 0; rail < 2; rail++) {
      var railGeometry = new THREE.CylinderGeometry(0.15, 0.15, 25, 8);
      var railMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
      var ladderRail = addObject(new THREE.Mesh(railGeometry, railMaterial));
      ladderRail.position.set(17.5 + rail * 5, -5, 20);
      scene.add(ladderRail);
    }
  }

  function init(scene, camera) {
    objects = [];
    glowMaterials = [];
    animatedObjects = [];

    createSurfaceEnvironment(scene);
    createUndergroundStructure(scene);
    createResearchStations(scene);
    createSpecimenContainment(scene);
    createCleanRoom(scene);
    createPowerRoom(scene);
    createServerFarm(scene);
    createMedicalBay(scene);
    createSecurityCheckpoint(scene);
    createEscapeShaft(scene);
  }

  function update(delta) {
    var time = Date.now() * 0.001;

    for (var i = 0; i < animatedObjects.length; i++) {
      var item = animatedObjects[i];

      if (item.type === 'glow') {
        var glowIntensity = 0.3 + Math.sin(time * 2) * 0.2;
        item.material.emissiveIntensity = glowIntensity;
      } else if (item.type === 'spin') {
        item.object.rotation.z += delta * 3;
      } else if (item.type === 'radar') {
        item.object.rotation.y += delta * 0.5;
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          for (var j = 0; j < obj.material.length; j++) {
            obj.material[j].dispose();
          }
        } else {
          obj.material.dispose();
        }
      }
    }
    objects = [];
    glowMaterials = [];
    animatedObjects = [];
    radarDish = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
