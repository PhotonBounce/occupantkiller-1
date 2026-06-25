window.HauntedBay = (function() {
  'use strict';

  var scene;
  var camera;
  var objects = [];
  var lights = [];
  var animationState = {
    fogHornTime: 0,
    lightPulseTime: 0,
    buoyDriftTime: 0
  };

  var materials = {
    ghostGray: new THREE.MeshStandardMaterial({ color: 0x8899AA, metalness: 0.6, roughness: 0.4 }),
    rustBrown: new THREE.MeshStandardMaterial({ color: 0x8B4513, metalness: 0.3, roughness: 0.8 }),
    darkWater: new THREE.MeshStandardMaterial({ color: 0x1a2a3a, metalness: 0.8, roughness: 0.2 }),
    metalGray: new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.7, roughness: 0.5 }),
    spectralBlue: new THREE.MeshBasicMaterial({ color: 0x00CCFF, emissive: 0x0088DD })
  };

  function createFogHorn() {
    var group = new THREE.Group();
    var base = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 1, 16), materials.rustBrown);
    base.position.y = 0.5;
    group.add(base);

    var tower = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 12, 16), materials.metalGray);
    tower.position.y = 7;
    group.add(tower);

    var horn = new THREE.Mesh(new THREE.ConeGeometry(2.5, 4, 16), materials.ghostGray);
    horn.position.y = 14;
    horn.rotation.z = Math.PI / 6;
    group.add(horn);

    group.hornLight = new THREE.PointLight(0xFF8800, 1, 30);
    group.hornLight.position.set(3, 15, 0);
    group.add(group.hornLight);

    return group;
  }

  function createGhostShip() {
    var group = new THREE.Group();

    var hull = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 20), materials.rustBrown);
    hull.position.y = 0;
    group.add(hull);

    var mast1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 18, 8), materials.metalGray);
    mast1.position.set(-2, 10, 0);
    group.add(mast1);

    var mast2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 15, 8), materials.metalGray);
    mast2.position.set(2, 9, 5);
    group.add(mast2);

    var cabin = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 6), materials.ghostGray);
    cabin.position.set(0, 2, -5);
    group.add(cabin);

    var port1 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), materials.spectralBlue);
    port1.position.set(-4.5, 2, -3);
    group.add(port1);

    var port2 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), materials.spectralBlue);
    port2.position.set(4.5, 2, -3);
    group.add(port2);

    var port3 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), materials.spectralBlue);
    port3.position.set(-4.5, 3, 5);
    group.add(port3);

    group.ghostPorts = [port1, port2, port3];
    group.isShip = true;

    return group;
  }

  function createNavalMine() {
    var group = new THREE.Group();

    var sphere = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 12), materials.metalGray);
    sphere.position.y = 0;
    group.add(sphere);

    var spike1 = new THREE.Mesh(new THREE.ConeGeometry(0.3, 2, 8), materials.rustBrown);
    spike1.position.set(1.8, 0, 0);
    group.add(spike1);

    var spike2 = new THREE.Mesh(new THREE.ConeGeometry(0.3, 2, 8), materials.rustBrown);
    spike2.position.set(-1.8, 0, 0);
    group.add(spike2);

    var spike3 = new THREE.Mesh(new THREE.ConeGeometry(0.3, 2, 8), materials.rustBrown);
    spike3.position.set(0, 1.8, 0);
    group.add(spike3);

    var spike4 = new THREE.Mesh(new THREE.ConeGeometry(0.3, 2, 8), materials.rustBrown);
    spike4.position.set(0, -1.8, 0);
    group.add(spike4);

    group.isMine = true;

    return group;
  }

  function createWarningBuoy() {
    var group = new THREE.Group();

    var buoy = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.2, 2.5, 12), materials.rustBrown);
    buoy.position.y = 1.25;
    group.add(buoy);

    var top = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.5, 12), materials.ghostGray);
    top.position.y = 3.5;
    group.add(top);

    var warning = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.2), materials.spectralBlue);
    warning.position.set(0, 2, 1.2);
    group.add(warning);

    group.buoyLight = new THREE.PointLight(0xFF3300, 0.8, 15);
    group.buoyLight.position.set(0, 2.5, 0);
    group.add(group.buoyLight);

    group.isBuoy = true;
    group.driftPhase = Math.random() * Math.PI * 2;

    return group;
  }

  function createLighthouse() {
    var group = new THREE.Group();

    var base = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 6), materials.rustBrown);
    base.position.y = 1;
    group.add(base);

    var tower = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 20, 16), materials.ghostGray);
    tower.position.y = 12;
    group.add(tower);

    var lantern = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 3, 16), materials.metalGray);
    lantern.position.y = 23;
    group.add(lantern);

    var lens = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 16), materials.spectralBlue);
    lens.position.y = 23;
    group.add(lens);

    group.lighthouseLight = new THREE.SpotLight(0xFFFFFF, 2, 100, Math.PI / 6, 0.5, 1);
    group.lighthouseLight.position.set(0, 24, 0);
    group.lighthouseLight.target.position.set(20, 0, 0);
    group.add(group.lighthouseLight);
    group.add(group.lighthouseLight.target);

    group.isLighthouse = true;

    return group;
  }

  function createCoastalBattery() {
    var group = new THREE.Group();

    var platform = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 8), materials.metalGray);
    platform.position.y = 0.5;
    group.add(platform);

    var wall = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 1.5), materials.rustBrown);
    wall.position.set(0, 2, 3.5);
    group.add(wall);

    var cannon1 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 4, 12), materials.metalGray);
    cannon1.rotation.z = Math.PI / 8;
    cannon1.position.set(-3, 2.5, 2);
    group.add(cannon1);

    var cannon2 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 4, 12), materials.metalGray);
    cannon2.rotation.z = Math.PI / 8;
    cannon2.position.set(3, 2.5, 2);
    group.add(cannon2);

    var ammoStack = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 1), materials.rustBrown);
    ammoStack.position.set(0, 1.5, -3);
    group.add(ammoStack);

    group.isBattery = true;

    return group;
  }

  function createRockFormation() {
    var group = new THREE.Group();

    var rock1 = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 5), materials.ghostGray);
    rock1.position.set(0, 1.5, 0);
    rock1.rotation.set(0.2, 0.3, 0.1);
    group.add(rock1);

    var rock2 = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 8), materials.metalGray);
    rock2.position.set(3, 2, -2);
    group.add(rock2);

    var rock3 = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 4), materials.rustBrown);
    rock3.position.set(-3, 1.2, 2);
    rock3.rotation.set(0.1, -0.2, 0.15);
    group.add(rock3);

    group.isRock = true;

    return group;
  }

  function createDiversStagingArea() {
    var group = new THREE.Group();

    var platform = new THREE.Mesh(new THREE.BoxGeometry(8, 0.8, 6), materials.metalGray);
    platform.position.y = 0.4;
    group.add(platform);

    var equipment = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), materials.rustBrown);
    equipment.position.set(-2, 1.5, 0);
    group.add(equipment);

    var tank1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 3, 12), materials.metalGray);
    tank1.position.set(2, 1.5, -1.5);
    group.add(tank1);

    var tank2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 3, 12), materials.metalGray);
    tank2.position.set(2, 1.5, 1.5);
    group.add(tank2);

    var rope = createLineMesh(new THREE.Vector3(0, 2, 0), new THREE.Vector3(0, 5, 0), 0xCCCCCC);
    group.add(rope);

    group.isDiversArea = true;

    return group;
  }

  function createLineMesh(start, end, color) {
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      start.x, start.y, start.z,
      end.x, end.y, end.z
    ]), 3));

    var material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    var line = new THREE.LineSegments(geometry, material);

    return line;
  }

  function createSpectralBeamMesh() {
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array([
      0, 0, 0,
      15, 0, 0,
      0, 0, 0,
      0, 15, 0,
      0, 0, 0,
      0, 0, 15
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    var material = new THREE.LineBasicMaterial({ color: 0x00CCFF, linewidth: 1, transparent: true, opacity: 0.4 });
    var lines = new THREE.LineSegments(geometry, material);

    return lines;
  }

  function createHullSection() {
    var group = new THREE.Group();

    var section = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 3), materials.rustBrown);
    section.position.y = 2;
    group.add(section);

    var ribs1 = createLineMesh(new THREE.Vector3(-3, 2, 0), new THREE.Vector3(3, 2, 0), 0x654321);
    group.add(ribs1);

    var ribs2 = createLineMesh(new THREE.Vector3(-3, 4, 0), new THREE.Vector3(3, 4, 0), 0x654321);
    group.add(ribs2);

    group.isHull = true;

    return group;
  }

  function createUnderwaterStructure() {
    var group = new THREE.Group();

    var frame1 = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 4), materials.metalGray);
    frame1.position.set(0, -2, 0);
    group.add(frame1);

    var frame2 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 6, 12), materials.ghostGray);
    frame2.position.set(0, -4, 0);
    group.add(frame2);

    var support1 = createLineMesh(new THREE.Vector3(-2.5, 0, 0), new THREE.Vector3(-2.5, -2, 0), 0x888888);
    group.add(support1);

    var support2 = createLineMesh(new THREE.Vector3(2.5, 0, 0), new THREE.Vector3(2.5, -2, 0), 0x888888);
    group.add(support2);

    group.isUnderwater = true;

    return group;
  }

  function createWaterColumn() {
    var group = new THREE.Group();

    var surface = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 0.5, 32), materials.darkWater);
    surface.position.y = 0.25;
    group.add(surface);

    group.isWater = true;

    return group;
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    scene.fog = new THREE.Fog(0x1a2a3a, 40, 100);
    scene.background = new THREE.Color(0x0d1520);

    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.3);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    directionalLight.position.set(30, 40, 30);
    scene.add(directionalLight);

    var waterColumn = createWaterColumn();
    waterColumn.position.set(0, -3, 0);
    scene.add(waterColumn);
    objects.push(waterColumn);

    var fogHorn1 = createFogHorn();
    fogHorn1.position.set(-35, 0, -35);
    scene.add(fogHorn1);
    objects.push(fogHorn1);
    lights.push(fogHorn1.hornLight);

    var ghostShip1 = createGhostShip();
    ghostShip1.position.set(-20, -5, 10);
    ghostShip1.rotation.y = Math.PI / 4;
    scene.add(ghostShip1);
    objects.push(ghostShip1);

    var ghostShip2 = createGhostShip();
    ghostShip2.position.set(15, -8, -25);
    ghostShip2.rotation.y = -Math.PI / 3;
    ghostShip2.scale.set(0.8, 0.8, 0.8);
    scene.add(ghostShip2);
    objects.push(ghostShip2);

    var mine1 = createNavalMine();
    mine1.position.set(-15, -6, 20);
    scene.add(mine1);
    objects.push(mine1);

    var mine2 = createNavalMine();
    mine2.position.set(10, -7, -15);
    scene.add(mine2);
    objects.push(mine2);

    var mine3 = createNavalMine();
    mine3.position.set(25, -5, 5);
    scene.add(mine3);
    objects.push(mine3);

    var buoy1 = createWarningBuoy();
    buoy1.position.set(-10, -2, 30);
    buoy1.driftPhase = 0;
    scene.add(buoy1);
    objects.push(buoy1);
    lights.push(buoy1.buoyLight);

    var buoy2 = createWarningBuoy();
    buoy2.position.set(20, -1, -30);
    buoy2.driftPhase = Math.PI;
    scene.add(buoy2);
    objects.push(buoy2);
    lights.push(buoy2.buoyLight);

    var buoy3 = createWarningBuoy();
    buoy3.position.set(30, -2, 10);
    buoy3.driftPhase = Math.PI / 2;
    scene.add(buoy3);
    objects.push(buoy3);
    lights.push(buoy3.buoyLight);

    var lighthouse = createLighthouse();
    lighthouse.position.set(35, 12, -30);
    scene.add(lighthouse);
    objects.push(lighthouse);
    lights.push(lighthouse.lighthouseLight);

    var battery = createCoastalBattery();
    battery.position.set(-30, 2, 25);
    battery.rotation.y = Math.PI / 6;
    scene.add(battery);
    objects.push(battery);

    var rocks1 = createRockFormation();
    rocks1.position.set(20, 3, 30);
    scene.add(rocks1);
    objects.push(rocks1);

    var rocks2 = createRockFormation();
    rocks2.position.set(-25, 2, -25);
    rocks2.scale.set(1.2, 1.2, 1.2);
    scene.add(rocks2);
    objects.push(rocks2);

    var diversArea = createDiversStagingArea();
    diversArea.position.set(-35, 5, 0);
    scene.add(diversArea);
    objects.push(diversArea);

    var hullSection1 = createHullSection();
    hullSection1.position.set(10, 1, 25);
    hullSection1.rotation.y = Math.PI / 3;
    scene.add(hullSection1);
    objects.push(hullSection1);

    var hullSection2 = createHullSection();
    hullSection2.position.set(-20, 2, -30);
    hullSection2.rotation.y = -Math.PI / 4;
    hullSection2.scale.set(0.9, 0.9, 0.9);
    scene.add(hullSection2);
    objects.push(hullSection2);

    var underwater = createUnderwaterStructure();
    underwater.position.set(0, -8, -10);
    scene.add(underwater);
    objects.push(underwater);

    var spectralBeam1 = createSpectralBeamMesh();
    spectralBeam1.position.set(25, 10, -20);
    scene.add(spectralBeam1);
    objects.push(spectralBeam1);

    var spectralBeam2 = createSpectralBeamMesh();
    spectralBeam2.position.set(-30, 15, 20);
    scene.add(spectralBeam2);
    objects.push(spectralBeam2);

    var fogHorn2 = createFogHorn();
    fogHorn2.position.set(35, 0, 35);
    scene.add(fogHorn2);
    objects.push(fogHorn2);
    lights.push(fogHorn2.hornLight);

    return true;
  }

  function update(delta) {
    animationState.fogHornTime += delta;
    animationState.lightPulseTime += delta;
    animationState.buoyDriftTime += delta;

    var fogHornCycle = Math.sin(animationState.fogHornTime * 0.8) * 0.5 + 0.5;

    for (var i = 0; i < objects.length; i++) {
      var obj = objects[i];

      if (obj.isBuoy) {
        var driftX = Math.sin(animationState.buoyDriftTime * 0.3 + obj.driftPhase) * 2;
        var driftZ = Math.cos(animationState.buoyDriftTime * 0.25 + obj.driftPhase) * 1.5;
        obj.position.x += driftX * delta * 0.1;
        obj.position.z += driftZ * delta * 0.1;

        if (obj.buoyLight) {
          obj.buoyLight.intensity = Math.sin(animationState.lightPulseTime * 2) * 0.3 + 0.8;
        }
      }

      if (obj.isShip) {
        var bobbing = Math.sin(animationState.lightPulseTime * 0.5) * 0.3;
        obj.position.y += bobbing * delta * 0.05;

        if (obj.ghostPorts) {
          var portBrightness = Math.sin(animationState.lightPulseTime * 1.5 + i) * 0.4 + 0.6;
          for (var p = 0; p < obj.ghostPorts.length; p++) {
            obj.ghostPorts[p].material.emissiveIntensity = portBrightness;
          }
        }
      }

      if (obj.isLighthouse) {
        var lighthouseSweep = animationState.fogHornTime * 0.7;
        if (obj.lighthouseLight) {
          obj.lighthouseLight.target.position.x = Math.cos(lighthouseSweep) * 50;
          obj.lighthouseLight.target.position.z = Math.sin(lighthouseSweep) * 50;
        }
      }
    }

    for (var l = 0; l < lights.length; l++) {
      var light = lights[l];
      if (light.isFogHornLight) {
        light.intensity = fogHornCycle * 0.8 + 0.2;
      }
    }

    return true;
  }

  function reset() {
    animationState.fogHornTime = 0;
    animationState.lightPulseTime = 0;
    animationState.buoyDriftTime = 0;

    return true;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
