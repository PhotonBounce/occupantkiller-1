window.LagganBase = (function() {
  'use strict';

  var objects = [];
  var lights = [];

  var create = function(scene) {
    // Main dam wall (40x18x6 box, reinforced concrete 0x888888)
    var damWallGeom = new THREE.BoxGeometry(40, 18, 6);
    var damWallMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var damWall = new THREE.Mesh(damWallGeom, damWallMat);
    damWall.position.set(0, 9, 0);
    scene.add(damWall);
    objects.push(damWall);

    // Dam face buttresses (8 box ribs 2x18x3 along dam face)
    var buttressPositions = [-16, -10, -4, 2, 8, 14, 20, 26];
    var buttressGeom = new THREE.BoxGeometry(2, 18, 3);
    var buttressMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
    for (var i = 0; i < buttressPositions.length; i++) {
      var buttress = new THREE.Mesh(buttressGeom, buttressMat);
      buttress.position.set(buttressPositions[i], 9, -4);
      scene.add(buttress);
      objects.push(buttress);
    }

    // Powerhouse building (20x8x12, industrial 0x667788)
    var powerhouseGeom = new THREE.BoxGeometry(20, 8, 12);
    var powerhouseMat = new THREE.MeshLambertMaterial({ color: 0x667788 });
    var powerhouse = new THREE.Mesh(powerhouseGeom, powerhouseMat);
    powerhouse.position.set(15, 4, -15);
    scene.add(powerhouse);
    objects.push(powerhouse);

    // Surge tower (cylinder 3 radius height 20, concrete 0x888888)
    var surgeGeom = new THREE.CylinderGeometry(3, 3, 20, 16);
    var surgeMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var surgeTower = new THREE.Mesh(surgeGeom, surgeMat);
    surgeTower.position.set(-12, 10, 8);
    scene.add(surgeTower);
    objects.push(surgeTower);

    // Pipeline intake (cylinder 2.5 radius height 30 angled down hillside)
    var pipelineGeom = new THREE.CylinderGeometry(2.5, 2.5, 30, 16);
    var pipelineMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var pipeline = new THREE.Mesh(pipelineGeom, pipelineMat);
    pipeline.position.set(-18, 5, 20);
    pipeline.rotation.z = 0.4;
    scene.add(pipeline);
    objects.push(pipeline);

    // Loch reservoir markers (4 orange sphere buoys at water level)
    var buoyGeom = new THREE.SphereGeometry(1, 12, 12);
    var buoyMat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
    var buoyPositions = [[-25, 0, 25], [25, 0, 30], [-30, 0, -20], [28, 0, -25]];
    for (var i = 0; i < buoyPositions.length; i++) {
      var buoy = new THREE.Mesh(buoyGeom, buoyMat);
      buoy.position.set(buoyPositions[i][0], buoyPositions[i][1], buoyPositions[i][2]);
      scene.add(buoy);
      objects.push(buoy);
    }

    // Security perimeter fence posts (0.3x3x0.3)
    var fencePostGeom = new THREE.BoxGeometry(0.3, 3, 0.3);
    var fencePostMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var fencePostPositions = [[-20, 1.5, 35], [0, 1.5, 35], [20, 1.5, 35], [35, 1.5, 15], [35, 1.5, -15], [20, 1.5, -35], [0, 1.5, -35], [-20, 1.5, -35], [-35, 1.5, -15], [-35, 1.5, 15]];
    for (var i = 0; i < fencePostPositions.length; i++) {
      var post = new THREE.Mesh(fencePostGeom, fencePostMat);
      post.position.set(fencePostPositions[i][0], fencePostPositions[i][1], fencePostPositions[i][2]);
      scene.add(post);
      objects.push(post);
    }

    // Security fence wire along dam top using LineSegments
    var fenceWireGeom = new THREE.BufferGeometry();
    var fencePoints = [];
    for (var i = 0; i < fencePostPositions.length; i++) {
      var currIdx = i;
      var nextIdx = (i + 1) % fencePostPositions.length;
      fencePoints.push(fencePostPositions[currIdx][0], fencePostPositions[currIdx][1] + 1.5, fencePostPositions[currIdx][2]);
      fencePoints.push(fencePostPositions[nextIdx][0], fencePostPositions[nextIdx][1] + 1.5, fencePostPositions[nextIdx][2]);
    }
    fenceWireGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fencePoints), 3));
    var fenceWireMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
    var fenceWire = new THREE.LineSegments(fenceWireGeom, fenceWireMat);
    scene.add(fenceWire);
    objects.push(fenceWire);

    // Gatehouse (6x5x5, concrete 0x888877)
    var gatehouseGeom = new THREE.BoxGeometry(6, 5, 5);
    var gatehouseMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
    var gatehouse = new THREE.Mesh(gatehouseGeom, gatehouseMat);
    gatehouse.position.set(30, 2.5, 0);
    scene.add(gatehouse);
    objects.push(gatehouse);

    // Barrier arm (red/white box on gatehouse)
    var barrierGeom = new THREE.BoxGeometry(0.5, 0.4, 8);
    var barrierMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    var barrier = new THREE.Mesh(barrierGeom, barrierMat);
    barrier.position.set(35, 3, 0);
    barrier.rotation.z = 0.1;
    scene.add(barrier);
    objects.push(barrier);

    // Anti-aircraft gun mount on dam top
    var aaBaseGeom = new THREE.BoxGeometry(3, 1, 3);
    var aaBaseMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var aaBase = new THREE.Mesh(aaBaseGeom, aaBaseMat);
    aaBase.position.set(-8, 19, 3);
    aaBase.name = 'aaBase';
    scene.add(aaBase);
    objects.push(aaBase);

    // AA gun barrel (cylinder)
    var barrelGeom = new THREE.CylinderGeometry(0.6, 0.6, 8, 12);
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var barrel = new THREE.Mesh(barrelGeom, barrelMat);
    barrel.position.set(-8, 23, 3);
    barrel.name = 'aaBarrel';
    barrel.rotation.z = -0.3;
    scene.add(barrel);
    objects.push(barrel);

    // Industrial floodlights (3 positions, white 0xFFFFFF, intensity 1.3)
    var floodlightPositions = [[20, 15, -18], [-15, 15, -12], [8, 18, 15]];
    for (var i = 0; i < floodlightPositions.length; i++) {
      var floodlight = new THREE.PointLight(0xFFFFFF, 1.3, 50);
      floodlight.position.set(floodlightPositions[i][0], floodlightPositions[i][1], floodlightPositions[i][2]);
      scene.add(floodlight);
      lights.push(floodlight);
    }

    // Red danger light on surge tower (pulsing)
    var dangerLight = new THREE.PointLight(0xFF0000, 1.5, 40);
    dangerLight.position.set(-12, 25, 8);
    dangerLight.name = 'dangerLight';
    scene.add(dangerLight);
    lights.push(dangerLight);
  };

  var update = function(delta) {
    // Pulse the red danger light
    var dangerLights = lights.filter(function(light) { return light.name === 'dangerLight'; });
    for (var i = 0; i < dangerLights.length; i++) {
      dangerLights[i].intensity = 1.5 + 0.5 * Math.sin(Date.now() * 0.004);
    }

    // Rotate the AA gun slowly
    var aaBarrels = objects.filter(function(obj) { return obj.name === 'aaBarrel'; });
    for (var i = 0; i < aaBarrels.length; i++) {
      aaBarrels[i].rotation.y += delta * 0.1;
    }
  };

  var reset = function(scene) {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];

    for (var i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
    }
    lights = [];
  };

  return {
    create: create,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
