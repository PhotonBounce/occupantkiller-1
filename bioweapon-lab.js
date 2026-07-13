window.BioweaponLab = (function() {
  'use strict';

  var sceneObjects = [];

  var init = function(scene, camera) {
    // 1. Main containment chamber walls (BoxGeometry)
    var chamberGeometry = new THREE.BoxGeometry(20, 15, 30);
    var chamberMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.6,
      roughness: 0.4
    });
    var chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
    chamber.position.set(0, 0, -10);
    chamber.scale.set(1, 1, 1);
    scene.add(chamber);
    sceneObjects.push(chamber);

    // 2. Bioreactor vat 1 (CylinderGeometry with liquid inside)
    var bioReactorGeometry = new THREE.CylinderGeometry(1.5, 1.5, 4, 16);
    var bioReactorMaterial = new THREE.MeshStandardMaterial({
      color: 0x004400,
      metalness: 0.8,
      roughness: 0.2
    });
    var bioReactor1 = new THREE.Mesh(bioReactorGeometry, bioReactorMaterial);
    bioReactor1.position.set(-8, 1, -5);
    scene.add(bioReactor1);
    sceneObjects.push(bioReactor1);

    // 3. Bioreactor liquid (SphereGeometry for bubbles effect)
    var liquidGeometry = new THREE.SphereGeometry(1.2, 12, 12);
    var liquidMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff44,
      metalness: 0.5,
      roughness: 0.3,
      emissive: 0x00aa00
    });
    var liquid1 = new THREE.Mesh(liquidGeometry, liquidMaterial);
    liquid1.position.set(-8, 1, -5);
    scene.add(liquid1);
    sceneObjects.push(liquid1);

    // 4. Bioreactor vat 2
    var bioReactor2 = new THREE.Mesh(bioReactorGeometry, bioReactorMaterial);
    bioReactor2.position.set(-4, 1, -5);
    scene.add(bioReactor2);
    sceneObjects.push(bioReactor2);

    // 5. Bioreactor liquid 2
    var liquid2 = new THREE.Mesh(liquidGeometry, liquidMaterial);
    liquid2.position.set(-4, 1, -5);
    scene.add(liquid2);
    sceneObjects.push(liquid2);

    // 6. HEPA air filtration stack (stacked CylinderGeometry)
    var filterGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 8);
    var filterMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.7,
      roughness: 0.3
    });
    var filter1 = new THREE.Mesh(filterGeometry, filterMaterial);
    filter1.position.set(8, 5, -8);
    scene.add(filter1);
    sceneObjects.push(filter1);

    var filter2 = new THREE.Mesh(filterGeometry, filterMaterial);
    filter2.position.set(8, 7, -8);
    scene.add(filter2);
    sceneObjects.push(filter2);

    var filter3 = new THREE.Mesh(filterGeometry, filterMaterial);
    filter3.position.set(8, 9, -8);
    scene.add(filter3);
    sceneObjects.push(filter3);

    // 7. Centrifuge array base (CylinderGeometry)
    var centrifugeGeometry = new THREE.CylinderGeometry(1.2, 1.2, 2, 12);
    var centrifugeMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.9,
      roughness: 0.2
    });
    var centrifuge1 = new THREE.Mesh(centrifugeGeometry, centrifugeMaterial);
    centrifuge1.position.set(0, 0.5, -15);
    scene.add(centrifuge1);
    sceneObjects.push(centrifuge1);

    // 8. Centrifuge rotor (ConeGeometry)
    var rotorGeometry = new THREE.ConeGeometry(1, 1.5, 8);
    var rotorMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      metalness: 0.6,
      roughness: 0.4
    });
    var rotor1 = new THREE.Mesh(rotorGeometry, rotorMaterial);
    rotor1.position.set(0, 1.5, -15);
    scene.add(rotor1);
    sceneObjects.push(rotor1);

    // 9. Centrifuge array second unit
    var centrifuge2 = new THREE.Mesh(centrifugeGeometry, centrifugeMaterial);
    centrifuge2.position.set(4, 0.5, -15);
    scene.add(centrifuge2);
    sceneObjects.push(centrifuge2);

    // 10. Centrifuge rotor 2
    var rotor2 = new THREE.Mesh(rotorGeometry, rotorMaterial);
    rotor2.position.set(4, 1.5, -15);
    scene.add(rotor2);
    sceneObjects.push(rotor2);

    // 11. Viral sample freezer bank (BoxGeometry drawers)
    var freezerDrawerGeometry = new THREE.BoxGeometry(2, 0.6, 1.5);
    var freezerMaterial = new THREE.MeshStandardMaterial({
      color: 0x4488ff,
      metalness: 0.8,
      roughness: 0.3
    });
    var freezerDrawer1 = new THREE.Mesh(freezerDrawerGeometry, freezerMaterial);
    freezerDrawer1.position.set(-6, 4, 8);
    scene.add(freezerDrawer1);
    sceneObjects.push(freezerDrawer1);

    var freezerDrawer2 = new THREE.Mesh(freezerDrawerGeometry, freezerMaterial);
    freezerDrawer2.position.set(-6, 5, 8);
    scene.add(freezerDrawer2);
    sceneObjects.push(freezerDrawer2);

    var freezerDrawer3 = new THREE.Mesh(freezerDrawerGeometry, freezerMaterial);
    freezerDrawer3.position.set(-6, 6, 8);
    scene.add(freezerDrawer3);
    sceneObjects.push(freezerDrawer3);

    // 12. Incineration chamber (ConeGeometry)
    var incineratorGeometry = new THREE.ConeGeometry(1.5, 3.5, 16);
    var incineratorMaterial = new THREE.MeshStandardMaterial({
      color: 0xff2200,
      metalness: 0.7,
      roughness: 0.5,
      emissive: 0xff5500
    });
    var incinerator = new THREE.Mesh(incineratorGeometry, incineratorMaterial);
    incinerator.position.set(6, 3, 10);
    scene.add(incinerator);
    sceneObjects.push(incinerator);

    // 13. Hazmat suit storage rack (BoxGeometry)
    var rackGeometry = new THREE.BoxGeometry(1, 3, 0.8);
    var rackMaterial = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      metalness: 0.5,
      roughness: 0.4
    });
    var rack = new THREE.Mesh(rackGeometry, rackMaterial);
    rack.position.set(-10, 2, 5);
    scene.add(rack);
    sceneObjects.push(rack);

    // 14. Decontamination shower head (SphereGeometry)
    var showerHeadGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    var showerMaterial = new THREE.MeshStandardMaterial({
      color: 0x0088ff,
      metalness: 0.9,
      roughness: 0.1
    });
    var showerHead = new THREE.Mesh(showerHeadGeometry, showerMaterial);
    showerHead.position.set(-12, 5, -5);
    scene.add(showerHead);
    sceneObjects.push(showerHead);

    // 15. Infected test subject holding cell door (BoxGeometry)
    var cellDoorGeometry = new THREE.BoxGeometry(2.5, 3, 0.3);
    var cellMaterial = new THREE.MeshStandardMaterial({
      color: 0x660000,
      metalness: 0.6,
      roughness: 0.4
    });
    var cellDoor = new THREE.Mesh(cellDoorGeometry, cellMaterial);
    cellDoor.position.set(10, 2, 0);
    scene.add(cellDoor);
    sceneObjects.push(cellDoor);

    // 16. Pressure-sealed corridor reinforcement rings (TorusGeometry using LineSegments)
    var ringGeometry = new THREE.BufferGeometry();
    var ringPositions = new Float32Array([
      -15, 2, 0,   15, 2, 0,
      -15, 4, 0,   15, 4, 0,
      -15, 6, 0,   15, 6, 0
    ]);
    ringGeometry.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
    var ringMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });
    var corridorRings = new THREE.LineSegments(ringGeometry, ringMaterial);
    scene.add(corridorRings);
    sceneObjects.push(corridorRings);

    // 17. Additional sample storage pod (SphereGeometry)
    var podGeometry = new THREE.SphereGeometry(0.9, 10, 10);
    var podMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ccff,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0x0066aa
    });
    var storagePod = new THREE.Mesh(podGeometry, podMaterial);
    storagePod.position.set(2, 5, -10);
    scene.add(storagePod);
    sceneObjects.push(storagePod);
  };

  var update = function(delta) {
    // Animate bioreactors (bubbling - oscillate vertically)
    if (sceneObjects.length > 2) {
      var liquid1 = sceneObjects[3];
      var liquid2 = sceneObjects[5];
      liquid1.scale.y = 1 + Math.sin(Date.now() * 0.005) * 0.15;
      liquid2.scale.y = 1 + Math.cos(Date.now() * 0.005) * 0.15;
    }

    // Spin centrifuges (rotor 1 and rotor 2)
    if (sceneObjects.length > 9) {
      var rotor1 = sceneObjects[8];
      var rotor2 = sceneObjects[10];
      rotor1.rotation.y += delta * 3;
      rotor2.rotation.y += delta * 3;
    }

    // Cycle decontamination shower lights
    if (sceneObjects.length > 13) {
      var showerHead = sceneObjects[13];
      var intensity = 0.5 + Math.sin(Date.now() * 0.003) * 0.5;
      showerHead.material.emissive.setHSL(0.6, 1, intensity * 0.4);
    }

    // Open/close freezer doors (oscillate X position)
    if (sceneObjects.length > 11) {
      var freezerDrawer1 = sceneObjects[11];
      var freezerDrawer2 = sceneObjects[12];
      var freezerDrawer3 = sceneObjects[13];
      var offset = Math.sin(Date.now() * 0.002) * 0.5;
      freezerDrawer1.position.x = -6 + offset;
      freezerDrawer2.position.x = -6 + offset * 0.7;
      freezerDrawer3.position.x = -6 + offset * 0.4;
    }

    // Incineration chamber flickers (color intensity)
    if (sceneObjects.length > 12) {
      var incinerator = sceneObjects[12];
      var flicker = 0.3 + Math.random() * 0.7;
      incinerator.material.emissive.setHSL(0.05, 1, flicker * 0.5);
    }

    // Storage pod pulsates (scale oscillation)
    if (sceneObjects.length > 16) {
      var storagePod = sceneObjects[16];
      var pulse = 1 + Math.sin(Date.now() * 0.004) * 0.1;
      storagePod.scale.set(pulse, pulse, pulse);
    }
  };

  var reset = function() {
    for (var i = sceneObjects.length - 1; i >= 0; i--) {
      var obj = sceneObjects[i];
      if (obj.parent) {
        obj.parent.remove(obj);
      }
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
    sceneObjects = [];
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
