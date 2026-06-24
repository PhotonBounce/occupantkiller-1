window.BioDome = (function() {
  'use strict';

  var objects = [];
  var animatedObjects = [];
  var scene = null;

  function init(sceneRef, camera) {
    scene = sceneRef;
    objects = [];
    animatedObjects = [];

    var geometry;
    var material;
    var mesh;

    // 1. Dome Structure - Large sphere with glass material
    geometry = new THREE.SphereGeometry(80, 32, 32);
    material = new THREE.MeshStandardMaterial({
      color: 0x88AACC,
      emissive: 0x88AACC,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.15,
      wireframe: false
    });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 40, 0);
    mesh.scale.set(1, 1.2, 1);
    scene.add(mesh);
    objects.push(mesh);
    animatedObjects.push({
      mesh: mesh,
      type: 'dome_glow',
      material: material,
      baseIntensity: 0.3
    });

    // Geodesic frame lines for dome
    var domeFrameGeometry = new THREE.BufferGeometry();
    var linePositions = [];
    var segments = 16;
    var rings = 8;
    var radius = 80;
    for (var i = 0; i <= rings; i++) {
      var phi = (Math.PI * i) / rings;
      for (var j = 0; j < segments; j++) {
        var theta = (Math.PI * 2 * j) / segments;
        var x = radius * Math.sin(phi) * Math.cos(theta);
        var y = radius * Math.cos(phi);
        var z = radius * Math.sin(phi) * Math.sin(theta);
        linePositions.push(x, y + 40, z);
      }
    }
    domeFrameGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    var lineIndices = [];
    for (var i = 0; i < rings; i++) {
      for (var j = 0; j < segments; j++) {
        var current = i * (segments + 1) + j;
        var next = current + 1;
        if (j === segments - 1) next = i * (segments + 1);
        lineIndices.push(current, next);
        if (i < rings) {
          lineIndices.push(current, current + segments + 1);
        }
      }
    }
    domeFrameGeometry.setIndex(new THREE.BufferAttribute(new Uint16Array(lineIndices), 1));
    var frameMaterial = new THREE.LineBasicMaterial({ color: 0x00FF44, linewidth: 2 });
    var domeFrame = new THREE.LineSegments(domeFrameGeometry, frameMaterial);
    scene.add(domeFrame);
    objects.push(domeFrame);

    // 2. Giant Exotic Plants (5 plants)
    for (var p = 0; p < 5; p++) {
      var plantX = (p - 2) * 25;
      var plantZ = -30 + (p % 2) * 40;

      // Trunk
      geometry = new THREE.CylinderGeometry(2, 3, 20, 8);
      material = new THREE.MeshStandardMaterial({ color: 0x334422 });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(plantX, 10, plantZ);
      scene.add(mesh);
      objects.push(mesh);

      // Canopy
      geometry = new THREE.SphereGeometry(12, 16, 16);
      material = new THREE.MeshStandardMaterial({ color: 0x22AA44 });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(plantX, 30, plantZ);
      scene.add(mesh);
      objects.push(mesh);
      animatedObjects.push({
        mesh: mesh,
        type: 'plant',
        originalPosition: { x: plantX, y: 30, z: plantZ }
      });
    }

    // 3. Hydroponic Grow Trays (4 rows)
    for (var t = 0; t < 4; t++) {
      var trayZ = -40 + t * 30;
      geometry = new THREE.BoxGeometry(60, 1.5, 8);
      material = new THREE.MeshStandardMaterial({ color: 0x334422 });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 2, trayZ);
      scene.add(mesh);
      objects.push(mesh);

      // Emissive glow lights
      geometry = new THREE.BoxGeometry(58, 0.3, 6);
      material = new THREE.MeshStandardMaterial({
        color: 0x00FF44,
        emissive: 0x00FF44,
        emissiveIntensity: 0.4
      });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 3.2, trayZ);
      scene.add(mesh);
      objects.push(mesh);
      animatedObjects.push({
        mesh: mesh,
        type: 'hydro_light',
        material: material,
        baseIntensity: 0.4
      });
    }

    // 4. Automated Watering Robots (3 robots)
    for (var r = 0; r < 3; r++) {
      var botX = -30 + r * 30;
      // Body
      geometry = new THREE.BoxGeometry(4, 4, 4);
      material = new THREE.MeshStandardMaterial({ color: 0x446644 });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(botX, 3, 0);
      scene.add(mesh);
      objects.push(mesh);

      // Arm
      geometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 6);
      material = new THREE.MeshStandardMaterial({ color: 0x446644 });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(botX, 8, 0);
      mesh.rotation.z = 0;
      scene.add(mesh);
      objects.push(mesh);
      animatedObjects.push({
        mesh: mesh,
        type: 'robot_arm',
        basePosition: { x: botX, y: 8, z: 0 }
      });
    }

    // 5. Research Station
    geometry = new THREE.BoxGeometry(20, 16, 12);
    material = new THREE.MeshStandardMaterial({ color: 0x334455 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-50, 8, -50);
    scene.add(mesh);
    objects.push(mesh);

    // Emissive screens on research station
    geometry = new THREE.BoxGeometry(8, 8, 0.5);
    material = new THREE.MeshStandardMaterial({
      color: 0x00AAFF,
      emissive: 0x00AAFF,
      emissiveIntensity: 0.5
    });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-45, 12, -56.5);
    scene.add(mesh);
    objects.push(mesh);
    animatedObjects.push({
      mesh: mesh,
      type: 'research_screen',
      material: material,
      baseIntensity: 0.5
    });

    // 6. Specimen Storage Tanks (3 tanks)
    for (var s = 0; s < 3; s++) {
      var tankX = 30 + s * 15;
      // Tank body
      geometry = new THREE.CylinderGeometry(4, 4, 16, 12);
      material = new THREE.MeshStandardMaterial({
        color: 0x224422,
        emissive: 0x224422,
        emissiveIntensity: 0.2
      });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(tankX, 8, -40);
      scene.add(mesh);
      objects.push(mesh);
      animatedObjects.push({
        mesh: mesh,
        type: 'specimen_tank',
        material: material,
        baseIntensity: 0.2
      });

      // Specimen inside
      geometry = new THREE.SphereGeometry(2, 8, 8);
      material = new THREE.MeshStandardMaterial({
        color: 0x44FF44,
        emissive: 0x44FF44,
        emissiveIntensity: 0.3
      });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(tankX, 8, -40);
      scene.add(mesh);
      objects.push(mesh);
      animatedObjects.push({
        mesh: mesh,
        type: 'specimen_glow',
        material: material,
        baseIntensity: 0.3
      });
    }

    // 7. Contamination Airlock
    geometry = new THREE.BoxGeometry(14, 18, 10);
    material = new THREE.MeshStandardMaterial({ color: 0x445544 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 9, 60);
    scene.add(mesh);
    objects.push(mesh);

    // Airlock seals
    geometry = new THREE.BoxGeometry(14.5, 1, 10.5);
    material = new THREE.MeshStandardMaterial({ color: 0x334422 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 18.5, 60);
    scene.add(mesh);
    objects.push(mesh);

    // 8. Mutant Plant Experiment
    geometry = new THREE.SphereGeometry(10, 16, 16);
    material = new THREE.MeshStandardMaterial({ color: 0x226622 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 12, 30);
    scene.add(mesh);
    objects.push(mesh);
    animatedObjects.push({
      mesh: mesh,
      type: 'mutant_plant'
    });

    // Tentacles
    for (var tn = 0; tn < 4; tn++) {
      var tentAngle = (Math.PI * 2 * tn) / 4;
      geometry = new THREE.CylinderGeometry(1.5, 1.5, 12, 6);
      material = new THREE.MeshStandardMaterial({ color: 0x33AA33 });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(Math.cos(tentAngle) * 8, 18, Math.sin(tentAngle) * 8);
      mesh.rotation.z = Math.PI / 4;
      scene.add(mesh);
      objects.push(mesh);
      animatedObjects.push({
        mesh: mesh,
        type: 'tentacle',
        baseRotation: { x: 0, y: 0, z: Math.PI / 4 }
      });
    }

    // 9. Biohazard Containment Area
    geometry = new THREE.BoxGeometry(24, 16, 20);
    material = new THREE.MeshStandardMaterial({ color: 0x334422 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(50, 8, -30);
    scene.add(mesh);
    objects.push(mesh);

    // Warning markers
    geometry = new THREE.BoxGeometry(4, 4, 0.5);
    material = new THREE.MeshStandardMaterial({
      color: 0xFF6600,
      emissive: 0xFF6600,
      emissiveIntensity: 0.4
    });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(55, 12, -40.5);
    scene.add(mesh);
    objects.push(mesh);
    animatedObjects.push({
      mesh: mesh,
      type: 'biohazard_warning',
      material: material,
      baseIntensity: 0.4
    });

    // 10. Insect Drone Pollinators (6 drones orbiting)
    for (var d = 0; d < 6; d++) {
      geometry = new THREE.SphereGeometry(1.5, 8, 8);
      material = new THREE.MeshStandardMaterial({ color: 0x888822 });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 25, 0);
      scene.add(mesh);
      objects.push(mesh);
      animatedObjects.push({
        mesh: mesh,
        type: 'drone',
        angle: (Math.PI * 2 * d) / 6,
        radius: 30,
        height: 25 + (d % 2) * 5
      });
    }

    // 11. CO2 Generator
    geometry = new THREE.CylinderGeometry(5, 5, 12, 16);
    material = new THREE.MeshStandardMaterial({ color: 0x446633 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-60, 6, 40);
    scene.add(mesh);
    objects.push(mesh);

    // Pipes
    for (var pi = 0; pi < 3; pi++) {
      geometry = new THREE.CylinderGeometry(1, 1, 20, 6);
      material = new THREE.MeshStandardMaterial({ color: 0x446633 });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(-60 + pi * 8, 14, 40);
      mesh.rotation.z = Math.PI / 3;
      scene.add(mesh);
      objects.push(mesh);
    }

    // 12. Temperature Control Units (2 units)
    for (var tc = 0; tc < 2; tc++) {
      var tcZ = 20 + tc * 30;
      geometry = new THREE.BoxGeometry(8, 10, 6);
      material = new THREE.MeshStandardMaterial({ color: 0x334455 });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(60, 5, tcZ);
      scene.add(mesh);
      objects.push(mesh);

      // Emissive readouts
      geometry = new THREE.BoxGeometry(6, 3, 0.5);
      material = new THREE.MeshStandardMaterial({
        color: 0x00AAFF,
        emissive: 0x00AAFF,
        emissiveIntensity: 0.45
      });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(60, 9, tcZ - 3.5);
      scene.add(mesh);
      objects.push(mesh);
      animatedObjects.push({
        mesh: mesh,
        type: 'temp_readout',
        material: material,
        baseIntensity: 0.45
      });
    }

    // 13. Emergency Quarantine Pods (3 pods)
    for (var qp = 0; qp < 3; qp++) {
      var podX = -30 + qp * 25;
      geometry = new THREE.CylinderGeometry(3, 3, 14, 12);
      material = new THREE.MeshStandardMaterial({ color: 0x334455 });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(podX, 7, 50);
      scene.add(mesh);
      objects.push(mesh);
    }

    // 14. Vegetable/Fruit Harvest Bins (4 bins)
    for (var hb = 0; hb < 4; hb++) {
      var binX = -20 + hb * 15;
      geometry = new THREE.BoxGeometry(10, 8, 10);
      material = new THREE.MeshStandardMaterial({ color: 0x665533 });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(binX, 4, -60);
      scene.add(mesh);
      objects.push(mesh);
    }

    // 15. Additional structure - Water circulation system
    geometry = new THREE.CylinderGeometry(2, 2, 40, 8);
    material = new THREE.MeshStandardMaterial({ color: 0x335555 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-70, 10, 0);
    mesh.rotation.z = Math.PI / 3;
    scene.add(mesh);
    objects.push(mesh);
  }

  function update(delta) {
    var time = Date.now() * 0.001;

    for (var i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];

      if (obj.type === 'dome_glow') {
        var intensity = obj.baseIntensity + Math.sin(time * 1.5) * 0.15;
        obj.material.emissiveIntensity = Math.max(0, intensity);
      }

      if (obj.type === 'hydro_light') {
        var pulseIntensity = obj.baseIntensity + Math.sin(time * 2) * 0.2;
        obj.material.emissiveIntensity = Math.max(0, pulseIntensity);
      }

      if (obj.type === 'robot_arm') {
        obj.mesh.rotation.z = Math.sin(time * 1.2) * 0.6;
      }

      if (obj.type === 'plant') {
        var sway = Math.sin(time * 0.8 + i) * 1.5;
        obj.mesh.position.y = obj.originalPosition.y + sway;
      }

      if (obj.type === 'drone') {
        var newAngle = obj.angle + time * 0.5;
        obj.mesh.position.x = Math.cos(newAngle) * obj.radius;
        obj.mesh.position.z = Math.sin(newAngle) * obj.radius;
        obj.mesh.position.y = obj.height + Math.sin(time * 1.5) * 2;
      }

      if (obj.type === 'research_screen') {
        var screenIntensity = obj.baseIntensity + Math.sin(time * 1.8) * 0.25;
        obj.material.emissiveIntensity = Math.max(0, screenIntensity);
      }

      if (obj.type === 'specimen_tank') {
        var tankIntensity = obj.baseIntensity + Math.sin(time * 1.3 + i) * 0.15;
        obj.material.emissiveIntensity = Math.max(0, tankIntensity);
      }

      if (obj.type === 'specimen_glow') {
        var glowIntensity = obj.baseIntensity + Math.sin(time * 1.6 + i) * 0.2;
        obj.material.emissiveIntensity = Math.max(0, glowIntensity);
      }

      if (obj.type === 'biohazard_warning') {
        var warningIntensity = Math.sin(time * 3) > 0 ? obj.baseIntensity + 0.3 : obj.baseIntensity - 0.2;
        obj.material.emissiveIntensity = Math.max(0, warningIntensity);
      }

      if (obj.type === 'tentacle') {
        obj.mesh.rotation.z = obj.baseRotation.z + Math.sin(time * 1.1) * 0.4;
      }

      if (obj.type === 'temp_readout') {
        var readoutIntensity = obj.baseIntensity + Math.sin(time * 1.7) * 0.2;
        obj.material.emissiveIntensity = Math.max(0, readoutIntensity);
      }

      if (obj.type === 'mutant_plant') {
        obj.mesh.rotation.z = Math.sin(time * 0.9) * 0.3;
        obj.mesh.rotation.y += delta * 0.3;
      }
    }
  }

  function reset() {
    if (scene) {
      for (var i = objects.length - 1; i >= 0; i--) {
        scene.remove(objects[i]);
      }
    }
    objects = [];
    animatedObjects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
