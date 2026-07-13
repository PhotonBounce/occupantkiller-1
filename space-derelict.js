window.SpaceDerelict = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animatedObjects = [];
  var time = 0;

  // Helper function to create a box geometry
  function createBox(w, h, d, color) {
    var geometry = new THREE.BoxGeometry(w, h, d);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  // Helper function to create a cylinder geometry
  function createCylinder(radiusTop, radiusBottom, height, segments, color, emissive) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
    var materialConfig = { color: color };
    if (emissive !== undefined) {
      materialConfig.emissive = emissive;
      materialConfig.emissiveIntensity = 0.5;
    }
    var material = new THREE.MeshStandardMaterial(materialConfig);
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  // Helper function to create a sphere geometry
  function createSphere(radius, segments, color, emissive) {
    var geometry = new THREE.SphereGeometry(radius, segments, segments);
    var materialConfig = { color: color };
    if (emissive !== undefined) {
      materialConfig.emissive = emissive;
      materialConfig.emissiveIntensity = 0.3;
    }
    var material = new THREE.MeshStandardMaterial(materialConfig);
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  // Helper function to create a cone geometry
  function createCone(radius, height, segments, color) {
    var geometry = new THREE.ConeGeometry(radius, height, segments);
    var material = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }

  // Helper function to create wiring conduits
  function createWiringConduit(length, position) {
    var group = new THREE.Group();

    // Main conduit
    var conduit = createCylinder(0.3, 0.3, length, 8, 0xFFAA00);
    conduit.position.copy(position);
    group.add(conduit);

    // Sparking effect with smaller emissive spheres
    var spark1 = createSphere(0.15, 4, 0xFFCC00, 0xFFCC00);
    spark1.position.set(position.x + 0.5, position.y, position.z);
    group.add(spark1);

    var spark2 = createSphere(0.1, 4, 0xFF9900, 0xFF9900);
    spark2.position.set(position.x - 0.5, position.y + 0.3, position.z);
    group.add(spark2);

    group.animatedParts = [spark1, spark2];
    group.animationType = 'spark';

    return group;
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];
    animatedObjects = [];
    time = 0;

    // Main ship hull sections - large dark metal boxes
    var hull1 = createBox(40, 30, 50, 0x333333);
    hull1.position.set(0, 0, 0);
    scene.add(hull1);
    objects.push(hull1);

    var hull2 = createBox(35, 25, 40, 0x333333);
    hull2.position.set(50, 5, -30);
    scene.add(hull2);
    objects.push(hull2);

    var hull3 = createBox(30, 35, 45, 0x333333);
    hull3.position.set(-45, -8, 25);
    scene.add(hull3);
    objects.push(hull3);

    // Depressurized corridors with paneling
    var corridor1 = createBox(8, 10, 60, 0x222222);
    corridor1.position.set(20, 0, 0);
    scene.add(corridor1);
    objects.push(corridor1);

    var corridor2 = createBox(6, 8, 50, 0x444444);
    corridor2.position.set(-25, 10, 15);
    scene.add(corridor2);
    objects.push(corridor2);

    // Cargo bay with floating debris
    var cargoBay = createBox(45, 30, 50, 0x222222);
    cargoBay.position.set(0, -20, -60);
    scene.add(cargoBay);
    objects.push(cargoBay);

    // Floating debris chunks - slowly drifting
    var debris1 = createSphere(2.5, 8, 0x555555);
    debris1.position.set(-5, -15, -55);
    debris1.driftVelocity = { x: 0.05, y: 0.03, z: -0.02 };
    scene.add(debris1);
    animatedObjects.push(debris1);
    objects.push(debris1);

    var debris2 = createSphere(1.8, 8, 0x555555);
    debris2.position.set(8, -18, -65);
    debris2.driftVelocity = { x: -0.04, y: 0.02, z: 0.03 };
    scene.add(debris2);
    animatedObjects.push(debris2);
    objects.push(debris2);

    var debris3 = createSphere(3.2, 8, 0x555555);
    debris3.position.set(-15, -25, -50);
    debris3.driftVelocity = { x: 0.03, y: -0.01, z: 0.04 };
    scene.add(debris3);
    animatedObjects.push(debris3);
    objects.push(debris3);

    // Emergency stasis pods - CylinderGeometry with glass tint
    var pod1 = createCylinder(2, 2, 8, 16, 0x2244AA);
    pod1.position.set(-15, 5, 10);
    scene.add(pod1);
    objects.push(pod1);

    var pod2 = createCylinder(2, 2, 8, 16, 0x2244AA);
    pod2.position.set(-10, 5, 10);
    scene.add(pod2);
    objects.push(pod2);

    var pod3 = createCylinder(2, 2, 8, 16, 0x2244AA);
    pod3.position.set(-5, 5, 10);
    scene.add(pod3);
    objects.push(pod3);

    // Alien infestation growths - organic pulsing emissive
    var growthCluster1 = createSphere(4, 12, 0x1A3A1A, 0x00AA00);
    growthCluster1.position.set(35, 8, -20);
    growthCluster1.pulseIntensity = 0.3;
    scene.add(growthCluster1);
    animatedObjects.push(growthCluster1);
    objects.push(growthCluster1);

    var growthCluster2 = createSphere(3.5, 12, 0x1A3A1A, 0x00AA00);
    growthCluster2.position.set(40, 12, -15);
    growthCluster2.pulseIntensity = 0.3;
    scene.add(growthCluster2);
    animatedObjects.push(growthCluster2);
    objects.push(growthCluster2);

    // Reactor core - large glowing sphere
    var reactorCore = createSphere(8, 16, 0x0066FF, 0x0066FF);
    reactorCore.position.set(-40, 0, 0);
    reactorCore.glowIntensity = 0.4;
    scene.add(reactorCore);
    animatedObjects.push(reactorCore);
    objects.push(reactorCore);

    // Exposed wiring conduits
    var wiring1 = createWiringConduit(25, new THREE.Vector3(15, 10, 30));
    scene.add(wiring1);
    animatedObjects.push(wiring1);
    objects.push(wiring1);

    var wiring2 = createWiringConduit(20, new THREE.Vector3(-30, -5, 20));
    scene.add(wiring2);
    animatedObjects.push(wiring2);
    objects.push(wiring2);

    // Airlock doors - heavy partially open
    var airlockDoor1 = createBox(3, 15, 12, 0x555555);
    airlockDoor1.position.set(30, 0, 35);
    airlockDoor1.rotation.z = 0.3;
    scene.add(airlockDoor1);
    objects.push(airlockDoor1);

    var airlockDoor2 = createBox(3, 15, 12, 0x555555);
    airlockDoor2.position.set(-35, 0, -30);
    airlockDoor2.rotation.z = -0.25;
    scene.add(airlockDoor2);
    objects.push(airlockDoor2);

    // Computer terminals - emissive flickering screens
    var terminal1 = createBox(4, 8, 2, 0x00AAFF);
    terminal1.position.set(25, 5, 0);
    terminal1.material.emissive = new THREE.Color(0x00AAFF);
    terminal1.material.emissiveIntensity = 0.5;
    terminal1.screenFlicker = Math.random();
    scene.add(terminal1);
    animatedObjects.push(terminal1);
    objects.push(terminal1);

    var terminal2 = createBox(4, 8, 2, 0x00AAFF);
    terminal2.position.set(-25, 5, 0);
    terminal2.material.emissive = new THREE.Color(0x00AAFF);
    terminal2.material.emissiveIntensity = 0.5;
    terminal2.screenFlicker = Math.random();
    scene.add(terminal2);
    animatedObjects.push(terminal2);
    objects.push(terminal2);

    // Escape pod bay - grouped cylinders
    var escapePod1 = createCylinder(2.5, 2.5, 7, 16, 0x884400);
    escapePod1.position.set(0, 15, -40);
    scene.add(escapePod1);
    objects.push(escapePod1);

    var escapePod2 = createCylinder(2.5, 2.5, 7, 16, 0x884400);
    escapePod2.position.set(5, 15, -40);
    scene.add(escapePod2);
    objects.push(escapePod2);

    var escapePod3 = createCylinder(2.5, 2.5, 7, 16, 0x884400);
    escapePod3.position.set(-5, 15, -40);
    scene.add(escapePod3);
    objects.push(escapePod3);

    // Breach hull sections - irregular openings
    var breachHull1 = createBox(25, 20, 15, 0x333333);
    breachHull1.position.set(-50, 20, 50);
    breachHull1.scale.set(1, 0.8, 0.6);
    scene.add(breachHull1);
    objects.push(breachHull1);

    var breachHull2 = createBox(20, 18, 12, 0x333333);
    breachHull2.position.set(55, 15, -50);
    breachHull2.scale.set(0.9, 0.7, 0.5);
    scene.add(breachHull2);
    objects.push(breachHull2);

    // Emergency lighting strips - alternating red emissive
    var lightStrip1 = createBox(1, 0.5, 30, 0xFF0000);
    lightStrip1.position.set(-38, 14, 0);
    lightStrip1.material.emissive = new THREE.Color(0xFF0000);
    lightStrip1.material.emissiveIntensity = 0.6;
    lightStrip1.lightFlicker = 0;
    scene.add(lightStrip1);
    animatedObjects.push(lightStrip1);
    objects.push(lightStrip1);

    var lightStrip2 = createBox(1, 0.5, 30, 0xFF0000);
    lightStrip2.position.set(38, 14, 0);
    lightStrip2.material.emissive = new THREE.Color(0xFF0000);
    lightStrip2.material.emissiveIntensity = 0.6;
    lightStrip2.lightFlicker = 1;
    scene.add(lightStrip2);
    animatedObjects.push(lightStrip2);
    objects.push(lightStrip2);

    // Xenomorph nest areas - organic shapes
    var nestArea1 = createSphere(5, 12, 0x1A2A1A, 0x003300);
    nestArea1.position.set(45, -10, 40);
    nestArea1.pulseIntensity = 0.4;
    scene.add(nestArea1);
    animatedObjects.push(nestArea1);
    objects.push(nestArea1);

    var nestArea2 = createSphere(4.5, 12, 0x1A2A1A, 0x003300);
    nestArea2.position.set(-45, -15, -40);
    nestArea2.pulseIntensity = 0.35;
    scene.add(nestArea2);
    animatedObjects.push(nestArea2);
    objects.push(nestArea2);

    return objects.length;
  }

  function update(delta) {
    time += delta;

    for (var i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];

      // Floating debris - drift and rotate
      if (obj.driftVelocity) {
        obj.position.x += obj.driftVelocity.x;
        obj.position.y += obj.driftVelocity.y;
        obj.position.z += obj.driftVelocity.z;
        obj.rotation.x += 0.005;
        obj.rotation.y += 0.008;
        obj.rotation.z += 0.003;
      }

      // Alien growths - pulse emissive intensity
      if (obj.pulseIntensity !== undefined) {
        var pulseFactor = Math.sin(time * 1.5 + i) * 0.5 + 0.5;
        obj.material.emissiveIntensity = obj.pulseIntensity * pulseFactor;
      }

      // Reactor core - glow brighter/dimmer
      if (obj.glowIntensity !== undefined) {
        var glowFactor = Math.sin(time * 0.8) * 0.5 + 0.7;
        obj.material.emissiveIntensity = obj.glowIntensity * glowFactor;
      }

      // Wiring conduits - spark flicker
      if (obj.animationType === 'spark' && obj.animatedParts) {
        for (var j = 0; j < obj.animatedParts.length; j++) {
          var spark = obj.animatedParts[j];
          var flicker = Math.sin(time * 5 + i * j) * 0.5 + 0.5;
          spark.material.emissiveIntensity = 0.5 + flicker * 0.5;
          spark.scale.set(0.8 + flicker * 0.4, 0.8 + flicker * 0.4, 0.8 + flicker * 0.4);
        }
      }

      // Computer terminal screens - flicker
      if (obj.screenFlicker !== undefined) {
        var screenFlicker = Math.random();
        if (screenFlicker > 0.85) {
          obj.material.emissiveIntensity = 0.2;
        } else {
          obj.material.emissiveIntensity = 0.5;
        }
      }

      // Emergency lights - strobe
      if (obj.lightFlicker !== undefined) {
        var strobePhase = (time * 3 + obj.lightFlicker * Math.PI) % (2 * Math.PI);
        var strobeIntensity = Math.sin(strobePhase) > 0 ? 0.6 : 0.1;
        obj.material.emissiveIntensity = strobeIntensity;
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    animatedObjects = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
