window.SolarForge = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var moltenStreams = [];
  var solarArrays = [];
  var forgeFires = [];
  var time = 0;

  function createMaterial(color, emissive, intensity) {
    var mat = new THREE.MeshPhongMaterial({
      color: color,
      emissive: emissive || 0x000000,
      metalness: 0.6,
      roughness: 0.4
    });
    return mat;
  }

  function addToScene(mesh) {
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildBlastFurnace() {
    var cylinderGeo = new THREE.CylinderGeometry(15, 18, 40, 32);
    var metalMat = createMaterial(0x333333, 0xFF6600, 0.8);
    var furnace = new THREE.Mesh(cylinderGeo, metalMat);
    furnace.position.set(0, 20, -30);
    furnace.castShadow = true;
    furnace.receiveShadow = true;
    addToScene(furnace);

    var coneGeo = new THREE.ConeGeometry(16, 12, 32);
    var cone = new THREE.Mesh(coneGeo, createMaterial(0x222222));
    cone.position.set(0, 41, -30);
    cone.castShadow = true;
    addToScene(cone);

    var glow = new THREE.PointLight(0xFF6600, 2, 80);
    glow.position.set(0, 20, -30);
    scene.add(glow);
  }

  function buildSolarArrays() {
    for (var i = 0; i < 4; i++) {
      var panelGeo = new THREE.BoxGeometry(20, 0.5, 15);
      var panelMat = createMaterial(0x1a1aff, 0x0066ff, 1);
      var panel = new THREE.Mesh(panelGeo, panelMat);

      var angle = (Math.PI / 2) * i;
      panel.position.set(Math.cos(angle) * 50, 25, Math.sin(angle) * 50);
      panel.rotation.x = 0.4;
      panel.castShadow = true;

      addToScene(panel);
      solarArrays.push(panel);
    }
  }

  function buildMoltenRivers() {
    for (var i = 0; i < 3; i++) {
      var riverGeo = new THREE.CylinderGeometry(1.5, 1.5, 60, 16);
      var riverMat = createMaterial(0xFF8800, 0xFF4400, 1);
      var river = new THREE.Mesh(riverGeo, riverMat);

      river.rotation.z = Math.PI / 2;
      river.position.set(i * 20 - 20, 1, 0);
      river.castShadow = true;

      addToScene(river);
      moltenStreams.push({
        mesh: river,
        offset: i * 0.1,
        baseY: 1
      });
    }
  }

  function buildCatwalks() {
    for (var i = 0; i < 2; i++) {
      var walkGeo = new THREE.BoxGeometry(8, 0.4, 40);
      var walkMat = createMaterial(0x444444, 0x000000, 0);
      var walk = new THREE.Mesh(walkGeo, walkMat);

      walk.position.set(-15 + i * 30, 3, 0);
      walk.castShadow = true;
      walk.receiveShadow = true;
      addToScene(walk);

      var railGeo = new THREE.BoxGeometry(0.3, 1.2, 40);
      var rail1 = new THREE.Mesh(railGeo, createMaterial(0x222222));
      rail1.position.set(walk.position.x - 4, 4, 0);
      addToScene(rail1);

      var rail2 = new THREE.Mesh(railGeo, createMaterial(0x222222));
      rail2.position.set(walk.position.x + 4, 4, 0);
      addToScene(rail2);
    }
  }

  function buildCoolingTowers() {
    for (var i = 0; i < 2; i++) {
      var towerGeo = new THREE.CylinderGeometry(8, 10, 30, 24);
      var towerMat = createMaterial(0x555555, 0x000000, 0);
      var tower = new THREE.Mesh(towerGeo, towerMat);

      tower.position.set(-40 + i * 80, 15, 35);
      tower.castShadow = true;
      tower.receiveShadow = true;
      addToScene(tower);

      var topGeo = new THREE.ConeGeometry(9, 5, 24);
      var top = new THREE.Mesh(topGeo, createMaterial(0x333333));
      top.position.set(tower.position.x, 32.5, tower.position.z);
      addToScene(top);
    }
  }

  function buildIndustrialCranes() {
    for (var i = 0; i < 2; i++) {
      var baseGeo = new THREE.BoxGeometry(4, 35, 4);
      var baseMat = createMaterial(0x222222);
      var base = new THREE.Mesh(baseGeo, baseMat);

      base.position.set(-35 + i * 70, 17.5, -25);
      base.castShadow = true;
      addToScene(base);

      var boomGeo = new THREE.BoxGeometry(40, 2, 2);
      var boom = new THREE.Mesh(boomGeo, baseMat);
      boom.position.set(base.position.x, 36, base.position.z);
      boom.castShadow = true;
      addToScene(boom);

      var hookGeo = new THREE.SphereGeometry(1.5, 16, 16);
      var hook = new THREE.Mesh(hookGeo, createMaterial(0x111111));
      hook.position.set(base.position.x + 15, 28, base.position.z);
      addToScene(hook);
    }
  }

  function buildForgeFirePits() {
    for (var i = 0; i < 4; i++) {
      var pitGeo = new THREE.CylinderGeometry(5, 6, 2, 20);
      var pitMat = createMaterial(0x1a1a1a);
      var pit = new THREE.Mesh(pitGeo, pitMat);

      var angle = (Math.PI / 2) * i;
      pit.position.set(Math.cos(angle) * 30, 1, Math.sin(angle) * 30);
      pit.castShadow = true;
      addToScene(pit);

      var fireLight = new THREE.PointLight(0xFF5500, 1.5, 60);
      fireLight.position.copy(pit.position);
      fireLight.position.y = 10;
      scene.add(fireLight);

      forgeFires.push({
        light: fireLight,
        baseIntensity: 1.5,
        offset: i * 0.3
      });
    }
  }

  function buildWallsAndFloor() {
    var floorGeo = new THREE.BoxGeometry(200, 0.5, 200);
    var floorMat = createMaterial(0xCC6600, 0x000000, 0);
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = 0;
    floor.receiveShadow = true;
    addToScene(floor);

    for (var i = 0; i < 4; i++) {
      var wallGeo = new THREE.BoxGeometry(200, 25, 2);
      var wallMat = createMaterial(0x444444);
      var wall = new THREE.Mesh(wallGeo, wallMat);

      if (i < 2) {
        wall.position.z = (i === 0) ? -100 : 100;
      } else {
        wall.rotation.y = Math.PI / 2;
        wall.position.x = (i === 2) ? -100 : 100;
      }
      wall.position.y = 12.5;
      wall.receiveShadow = true;
      addToScene(wall);
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    moltenStreams = [];
    solarArrays = [];
    forgeFires = [];
    time = 0;

    var ambientLight = new THREE.AmbientLight(0x666666);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFEEDD, 1);
    directionalLight.position.set(50, 80, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    buildWallsAndFloor();
    buildBlastFurnace();
    buildSolarArrays();
    buildMoltenRivers();
    buildCatwalks();
    buildCoolingTowers();
    buildIndustrialCranes();
    buildForgeFirePits();
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < solarArrays.length; i++) {
      solarArrays[i].rotation.z += delta * 0.3;
    }

    for (var j = 0; j < moltenStreams.length; j++) {
      var stream = moltenStreams[j];
      var wave = Math.sin(time * 2 + stream.offset) * 0.3;
      stream.mesh.position.y = stream.baseY + wave;
    }

    for (var k = 0; k < forgeFires.length; k++) {
      var fire = forgeFires[k];
      var flicker = 0.8 + Math.sin(time * 8 + fire.offset) * 0.2;
      fire.light.intensity = fire.baseIntensity * flicker;
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }

    var lights = scene.children.filter(function(child) {
      return child instanceof THREE.Light && !(child instanceof THREE.AmbientLight && child instanceof THREE.DirectionalLight);
    });
    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }

    objects = [];
    moltenStreams = [];
    solarArrays = [];
    forgeFires = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
