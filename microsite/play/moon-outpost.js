window.MoonOutpost = (function() {
  'use strict';

  var objects = [];
  var animationData = {};

  function init(scene, camera) {
    // Clear any existing objects
    objects = [];
    animationData = {};

    // 1. Pressurized Habitat Dome (large sphere)
    var habitatGeometry = new THREE.SphereGeometry(12, 16, 16);
    var habitatMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a90e2,
      metalness: 0.6,
      roughness: 0.3
    });
    var habitatDome = new THREE.Mesh(habitatGeometry, habitatMaterial);
    habitatDome.position.set(0, 8, -30);
    habitatDome.scale.set(1, 0.8, 1);
    scene.add(habitatDome);
    objects.push(habitatDome);
    animationData.habitatDome = { baseY: 8, bobAmount: 0.3, bobSpeed: 0.5 };

    // 2. Airlock Chamber (cylinder + box)
    var airlockCylinderGeometry = new THREE.CylinderGeometry(4, 4, 6, 8);
    var airlockMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c3e50,
      metalness: 0.8,
      roughness: 0.2
    });
    var airlockCylinder = new THREE.Mesh(airlockCylinderGeometry, airlockMaterial);
    airlockCylinder.position.set(20, 2, -15);
    scene.add(airlockCylinder);
    objects.push(airlockCylinder);

    // Airlock door (box)
    var airlockDoorGeometry = new THREE.BoxGeometry(8, 6, 0.5);
    var airlockDoor = new THREE.Mesh(airlockDoorGeometry, airlockMaterial);
    airlockDoor.position.set(20, 2, -11);
    scene.add(airlockDoor);
    objects.push(airlockDoor);
    animationData.airlockDoor = { baseZ: -11, slideAmount: 2, slideSpeed: 1.2 };

    // 3. Crater Edge Fortifications (stacked boxes)
    var fortGeometry = new THREE.BoxGeometry(3, 3, 12);
    var fortMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      metalness: 0.4,
      roughness: 0.6
    });
    for (var i = 0; i < 5; i++) {
      var fort = new THREE.Mesh(fortGeometry, fortMaterial);
      fort.position.set(-25 + i * 8, 1.5, 20);
      scene.add(fort);
      objects.push(fort);
    }

    // 4. Rail-mounted Artillery (cylinder on rail)
    var artilleryBaseGeometry = new THREE.CylinderGeometry(3, 3.5, 1, 12);
    var artilleryMaterial = new THREE.MeshStandardMaterial({
      color: 0x34495e,
      metalness: 0.9,
      roughness: 0.1
    });
    var artilleryBase = new THREE.Mesh(artilleryBaseGeometry, artilleryMaterial);
    artilleryBase.position.set(-35, 3, 0);
    scene.add(artilleryBase);
    objects.push(artilleryBase);

    // Artillery barrel (cylinder)
    var barrelGeometry = new THREE.CylinderGeometry(1, 1, 15, 8);
    var barrelMesh = new THREE.Mesh(barrelGeometry, artilleryMaterial);
    barrelMesh.rotation.z = Math.PI / 6;
    barrelMesh.position.set(-35, 7, 0);
    scene.add(barrelMesh);
    objects.push(barrelMesh);
    animationData.artillery = { baseRotZ: Math.PI / 6, rotAmount: 0.3, rotSpeed: 0.8 };

    // 5. Helium-3 Mining Rigs (cone + cylinder pairs)
    for (var j = 0; j < 3; j++) {
      var rigConeGeometry = new THREE.ConeGeometry(2, 4, 8);
      var rigMaterial = new THREE.MeshStandardMaterial({
        color: 0xe74c3c,
        metalness: 0.5,
        roughness: 0.4
      });
      var rigCone = new THREE.Mesh(rigConeGeometry, rigMaterial);
      rigCone.position.set(10 + j * 12, 3, 35);
      scene.add(rigCone);
      objects.push(rigCone);
      animationData['rig' + j] = { baseY: 3, bobAmount: 0.5, bobSpeed: 1.5 + j * 0.3 };

      // Rig drill shaft (cylinder)
      var drillGeometry = new THREE.CylinderGeometry(0.8, 0.8, 8, 6);
      var drillMesh = new THREE.Mesh(drillGeometry, rigMaterial);
      drillMesh.position.set(10 + j * 12, -2, 35);
      scene.add(drillMesh);
      objects.push(drillMesh);
      animationData['drill' + j] = { baseRotX: 0, rotAmount: Math.PI / 4, rotSpeed: 2.5 + j * 0.2 };
    }

    // 6. Solar Panel Arrays (flat boxes)
    var panelMaterial = new THREE.MeshStandardMaterial({
      color: 0xf39c12,
      metalness: 0.7,
      roughness: 0.25
    });
    for (var k = 0; k < 4; k++) {
      var panelGeometry = new THREE.BoxGeometry(8, 0.3, 6);
      var panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(-15 - k * 10, 5 + k * 0.5, 15);
      panel.rotation.z = (k * 0.2) + 0.3;
      scene.add(panel);
      objects.push(panel);
      animationData['panel' + k] = { baseRotZ: (k * 0.2) + 0.3, trackSpeed: 0.4 };
    }

    // 7. Communications Relay Tower (tall cylinder + sphere)
    var towerGeometry = new THREE.CylinderGeometry(1.5, 2, 20, 8);
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: 0x95a5a6,
      metalness: 0.8,
      roughness: 0.2
    });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(40, 5, -25);
    scene.add(tower);
    objects.push(tower);

    // Tower antenna (sphere on top)
    var antennaGeometry = new THREE.SphereGeometry(1.5, 8, 8);
    var antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0xe74c3c,
      metalness: 0.9,
      roughness: 0.05
    });
    var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(40, 17, -25);
    scene.add(antenna);
    objects.push(antenna);
    animationData.antenna = { baseY: 17, pulseAmount: 0.4, pulseSpeed: 3.0 };

    // 8. Lunar Rovers (box + cylinder wheels)
    var roverBodyGeometry = new THREE.BoxGeometry(4, 2, 6);
    var roverMaterial = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      metalness: 0.6,
      roughness: 0.4
    });
    for (var m = 0; m < 2; m++) {
      var roverBody = new THREE.Mesh(roverBodyGeometry, roverMaterial);
      roverBody.position.set(-50 + m * 25, 1.5, -35);
      scene.add(roverBody);
      objects.push(roverBody);
      animationData['rover' + m] = { baseX: -50 + m * 25, moveAmount: 8, moveSpeed: 0.6 + m * 0.1 };

      // Rover wheels (4 cylinders)
      for (var w = 0; w < 4; w++) {
        var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 3, 8);
        var wheelMaterial = new THREE.MeshStandardMaterial({
          color: 0x2c3e50,
          metalness: 0.7,
          roughness: 0.3
        });
        var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(-50 + m * 25 + (w % 2 === 0 ? -2 : 2), 0.8, -35 + (w < 2 ? -2 : 2));
        scene.add(wheel);
        objects.push(wheel);
        animationData['wheel' + m + '_' + w] = { baseRotX: 0, rotAmount: Math.PI * 2, rotSpeed: 2.0 };
      }
    }

    // 9. Impact Craters (sphere depressions - inverted)
    var craterMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a4a42,
      metalness: 0.3,
      roughness: 0.8
    });
    for (var c = 0; c < 4; c++) {
      var craterGeometry = new THREE.SphereGeometry(6, 12, 12);
      var crater = new THREE.Mesh(craterGeometry, craterMaterial);
      crater.scale.y = 0.3;
      crater.position.set(-60 + c * 30, -3, 40 - c * 20);
      scene.add(crater);
      objects.push(crater);
    }

    // 10. Earthrise Viewport (large sphere - representation)
    var earthGeometry = new THREE.SphereGeometry(15, 16, 16);
    var earthMaterial = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      metalness: 0.4,
      roughness: 0.5
    });
    var earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(80, 20, -50);
    scene.add(earth);
    objects.push(earth);
    animationData.earth = { baseY: 20, bobAmount: 0.8, bobSpeed: 0.3 };

    // 11. Dust Particle Storm System (multiple small spheres)
    var dustMaterial = new THREE.MeshStandardMaterial({
      color: 0xc0a080,
      metalness: 0.2,
      roughness: 0.9
    });
    animationData.dustParticles = [];
    for (var d = 0; d < 20; d++) {
      var dustGeometry = new THREE.SphereGeometry(0.3, 4, 4);
      var dust = new THREE.Mesh(dustGeometry, dustMaterial);
      var rx = (Math.random() - 0.5) * 60;
      var rz = (Math.random() - 0.5) * 60;
      dust.position.set(rx, 2 + Math.random() * 8, rz);
      scene.add(dust);
      objects.push(dust);
      animationData.dustParticles.push({
        mesh: dust,
        vx: (Math.random() - 0.5) * 0.02,
        vz: (Math.random() - 0.5) * 0.02,
        vy: -0.01
      });
    }

    // 12. Warning Lights (pulsing spheres)
    var warningMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xff0000,
      emissiveIntensity: 0.8
    });
    for (var w = 0; w < 6; w++) {
      var warningGeometry = new THREE.SphereGeometry(0.8, 6, 6);
      var warning = new THREE.Mesh(warningGeometry, warningMaterial);
      warning.position.set(-20 + w * 15, 12, -30);
      scene.add(warning);
      objects.push(warning);
      animationData['warning' + w] = { baseScale: 1, pulseAmount: 0.3, pulseSpeed: 2.0 + w * 0.1 };
    }

    // 13. Pressurized Habitat Secondary Structure (box)
    var habStructGeometry = new THREE.BoxGeometry(10, 8, 10);
    var habStructMaterial = new THREE.MeshStandardMaterial({
      color: 0x16a085,
      metalness: 0.5,
      roughness: 0.4
    });
    var habStruct = new THREE.Mesh(habStructGeometry, habStructMaterial);
    habStruct.position.set(0, 3, 5);
    scene.add(habStruct);
    objects.push(habStruct);

    // 14. Power Generator Station (tall cylinder)
    var genGeometry = new THREE.CylinderGeometry(2.5, 3, 12, 10);
    var genMaterial = new THREE.MeshStandardMaterial({
      color: 0x27ae60,
      metalness: 0.6,
      roughness: 0.3
    });
    var generator = new THREE.Mesh(genGeometry, genMaterial);
    generator.position.set(-40, 4, 25);
    scene.add(generator);
    objects.push(generator);
    animationData.generator = { baseY: 4, hum: 0.15, humSpeed: 1.8 };

    // 15. Fuel Storage Tank (sphere)
    var fuelGeometry = new THREE.SphereGeometry(5, 12, 12);
    var fuelMaterial = new THREE.MeshStandardMaterial({
      color: 0x8e44ad,
      metalness: 0.7,
      roughness: 0.25
    });
    var fuelTank = new THREE.Mesh(fuelGeometry, fuelMaterial);
    fuelTank.position.set(25, 5, 10);
    scene.add(fuelTank);
    objects.push(fuelTank);
    animationData.fuelTank = { baseY: 5, bobAmount: 0.4, bobSpeed: 0.7 };

    // 16. Structural Support Frame (lines)
    var frameGeometry = new THREE.BufferGeometry();
    var frameVertices = new Float32Array([
      -30, 0, 0,  30, 0, 0,
      0, 0, -30,  0, 0, 30,
      -30, 10, 0,  30, 10, 0,
      0, 10, -30,  0, 10, 30
    ]);
    frameGeometry.setAttribute('position', new THREE.BufferAttribute(frameVertices, 3));
    var frameMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
    var frameLines = new THREE.LineSegments(frameGeometry, frameMaterial);
    frameLines.position.set(5, 0, -5);
    scene.add(frameLines);
    objects.push(frameLines);
  }

  function update(delta) {
    // Update habitat dome bobbing
    if (animationData.habitatDome) {
      var data = animationData.habitatDome;
      var time = performance.now() * 0.001;
      var domeObj = objects[0];
      if (domeObj) {
        domeObj.position.y = data.baseY + Math.sin(time * data.bobSpeed) * data.bobAmount;
      }
    }

    // Update airlock door sliding
    if (animationData.airlockDoor) {
      var doorData = animationData.airlockDoor;
      var time = performance.now() * 0.001;
      var doorIdx = objects.findIndex(function(obj) {
        return obj.geometry instanceof THREE.BoxGeometry && obj.position.z < -10;
      });
      if (doorIdx >= 0) {
        objects[doorIdx].position.z = doorData.baseZ + Math.sin(time * doorData.slideSpeed) * doorData.slideAmount;
      }
    }

    // Update artillery rotation
    if (animationData.artillery) {
      var artData = animationData.artillery;
      var time = performance.now() * 0.001;
      var artIdx = objects.findIndex(function(obj) {
        return obj.geometry instanceof THREE.CylinderGeometry && obj.position.x < -30 && obj.position.y > 5;
      });
      if (artIdx >= 0) {
        objects[artIdx].rotation.z = artData.baseRotZ + Math.sin(time * artData.rotSpeed) * artData.rotAmount;
      }
    }

    // Update mining rigs
    for (var j = 0; j < 3; j++) {
      if (animationData['rig' + j]) {
        var rigData = animationData['rig' + j];
        var time = performance.now() * 0.001;
        var rigIdx = objects.findIndex(function(obj) {
          return obj.geometry instanceof THREE.ConeGeometry && obj.position.x > 10 && obj.position.x < 40;
        });
        if (rigIdx >= 0) {
          objects[rigIdx].position.y = rigData.baseY + Math.sin(time * rigData.bobSpeed + j) * rigData.bobAmount;
        }
      }

      if (animationData['drill' + j]) {
        var drillData = animationData['drill' + j];
        var time = performance.now() * 0.001;
        var drillIdx = objects.findIndex(function(obj) {
          return obj.geometry instanceof THREE.CylinderGeometry && obj.position.y < 0;
        });
        if (drillIdx >= 0) {
          objects[drillIdx].rotation.x += drillData.rotAmount * 0.01;
        }
      }
    }

    // Update solar panels
    for (var k = 0; k < 4; k++) {
      if (animationData['panel' + k]) {
        var panelData = animationData['panel' + k];
        var time = performance.now() * 0.001;
        var panelIdx = objects.findIndex(function(obj) {
          return obj.geometry instanceof THREE.BoxGeometry && obj.position.x < -15;
        });
        if (panelIdx >= 0) {
          objects[panelIdx].rotation.z = panelData.baseRotZ + Math.sin(time * panelData.trackSpeed) * 0.2;
        }
      }
    }

    // Update antenna pulsing
    if (animationData.antenna) {
      var antData = animationData.antenna;
      var time = performance.now() * 0.001;
      var antIdx = objects.findIndex(function(obj) {
        return obj.geometry instanceof THREE.SphereGeometry && obj.position.x > 35;
      });
      if (antIdx >= 0) {
        objects[antIdx].position.y = antData.baseY + Math.sin(time * antData.pulseSpeed) * antData.pulseAmount;
      }
    }

    // Update rovers
    for (var m = 0; m < 2; m++) {
      if (animationData['rover' + m]) {
        var roverData = animationData['rover' + m];
        var time = performance.now() * 0.001;
        var roverIdx = objects.findIndex(function(obj) {
          return obj.geometry instanceof THREE.BoxGeometry && obj.position.y > 1 && obj.position.z < -30;
        });
        if (roverIdx >= 0) {
          objects[roverIdx].position.x = roverData.baseX + Math.sin(time * roverData.moveSpeed) * roverData.moveAmount;
        }
      }

      // Update rover wheels
      for (var w = 0; w < 4; w++) {
        if (animationData['wheel' + m + '_' + w]) {
          var wheelData = animationData['wheel' + m + '_' + w];
          var wheelIdx = objects.findIndex(function(obj) {
            return obj.geometry instanceof THREE.CylinderGeometry && obj.position.y < 1;
          });
          if (wheelIdx >= 0) {
            objects[wheelIdx].rotation.x += wheelData.rotAmount * 0.005;
          }
        }
      }
    }

    // Update earth bobbing
    if (animationData.earth) {
      var earthData = animationData.earth;
      var time = performance.now() * 0.001;
      var earthIdx = objects.findIndex(function(obj) {
        return obj.geometry instanceof THREE.SphereGeometry && obj.position.x > 70;
      });
      if (earthIdx >= 0) {
        objects[earthIdx].position.y = earthData.baseY + Math.sin(time * earthData.bobSpeed) * earthData.bobAmount;
      }
    }

    // Update dust particles
    if (animationData.dustParticles && animationData.dustParticles.length > 0) {
      for (var d = 0; d < animationData.dustParticles.length; d++) {
        var particle = animationData.dustParticles[d];
        particle.mesh.position.x += particle.vx;
        particle.mesh.position.z += particle.vz;
        particle.mesh.position.y += particle.vy;

        // Wrap around
        if (particle.mesh.position.x > 50) {
          particle.mesh.position.x = -50;
        }
        if (particle.mesh.position.x < -50) {
          particle.mesh.position.x = 50;
        }
        if (particle.mesh.position.z > 50) {
          particle.mesh.position.z = -50;
        }
        if (particle.mesh.position.z < -50) {
          particle.mesh.position.z = 50;
        }
        if (particle.mesh.position.y < 0) {
          particle.mesh.position.y = 10;
        }

        particle.mesh.rotation.x += 0.01;
        particle.mesh.rotation.y += 0.01;
      }
    }

    // Update warning lights
    for (var w = 0; w < 6; w++) {
      if (animationData['warning' + w]) {
        var warningData = animationData['warning' + w];
        var time = performance.now() * 0.001;
        var warningIdx = objects.findIndex(function(obj) {
          return obj.geometry instanceof THREE.SphereGeometry && obj.position.y > 10;
        });
        if (warningIdx >= 0) {
          var scale = warningData.baseScale + Math.sin(time * warningData.pulseSpeed) * warningData.pulseAmount;
          objects[warningIdx].scale.set(scale, scale, scale);
        }
      }
    }

    // Update generator humming
    if (animationData.generator) {
      var genData = animationData.generator;
      var time = performance.now() * 0.001;
      var genIdx = objects.findIndex(function(obj) {
        return obj.geometry instanceof THREE.CylinderGeometry && obj.position.x < -35;
      });
      if (genIdx >= 0) {
        objects[genIdx].position.y = genData.baseY + Math.sin(time * genData.humSpeed) * genData.hum;
      }
    }

    // Update fuel tank
    if (animationData.fuelTank) {
      var fuelData = animationData.fuelTank;
      var time = performance.now() * 0.001;
      var fuelIdx = objects.findIndex(function(obj) {
        return obj.geometry instanceof THREE.SphereGeometry && obj.position.x > 20 && obj.position.y > 4;
      });
      if (fuelIdx >= 0) {
        objects[fuelIdx].position.y = fuelData.baseY + Math.sin(time * fuelData.bobSpeed) * fuelData.bobAmount;
      }
    }
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      var obj = objects[i];
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          for (var m = 0; m < obj.material.length; m++) {
            obj.material[m].dispose();
          }
        } else {
          obj.material.dispose();
        }
      }
      var parent = obj.parent;
      if (parent) {
        parent.remove(obj);
      }
    }
    objects = [];
    animationData = {};
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
