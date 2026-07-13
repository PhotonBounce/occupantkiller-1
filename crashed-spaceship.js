window.CrashedSpaceship = (function() {
  'use strict';

  var objects = [];
  var animatedObjects = [];

  function init(scene, camera) {
    objects = [];
    animatedObjects = [];

    // Main fuselage hull sections
    var fuselage1 = new THREE.Mesh(
      new THREE.BoxGeometry(40, 20, 120),
      new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.8, roughness: 0.3 })
    );
    fuselage1.rotation.z = 0.3;
    fuselage1.position.set(0, 10, 0);
    scene.add(fuselage1);
    objects.push(fuselage1);

    var fuselage2 = new THREE.Mesh(
      new THREE.BoxGeometry(35, 18, 80),
      new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.8, roughness: 0.3 })
    );
    fuselage2.rotation.z = -0.25;
    fuselage2.position.set(50, 5, 40);
    scene.add(fuselage2);
    objects.push(fuselage2);

    // Broken wing sections
    var wing1 = new THREE.Mesh(
      new THREE.BoxGeometry(80, 8, 25),
      new THREE.MeshStandardMaterial({ color: 0x445566, metalness: 0.7, roughness: 0.4 })
    );
    wing1.rotation.z = 0.5;
    wing1.position.set(-60, 15, 20);
    scene.add(wing1);
    objects.push(wing1);

    var wing2 = new THREE.Mesh(
      new THREE.BoxGeometry(70, 7, 23),
      new THREE.MeshStandardMaterial({ color: 0x445566, metalness: 0.7, roughness: 0.4 })
    );
    wing2.rotation.z = -0.6;
    wing2.position.set(65, 12, -30);
    scene.add(wing2);
    objects.push(wing2);

    // Engine nacelles with fire
    var nacelle1 = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 35, 16),
      new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.85, roughness: 0.2 })
    );
    nacelle1.rotation.z = 0.4;
    nacelle1.position.set(-45, 8, 60);
    scene.add(nacelle1);
    objects.push(nacelle1);
    animatedObjects.push({ obj: nacelle1, type: 'fire' });

    var nacelle2 = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 35, 16),
      new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.85, roughness: 0.2 })
    );
    nacelle2.rotation.z = -0.35;
    nacelle2.position.set(45, 6, 55);
    scene.add(nacelle2);
    objects.push(nacelle2);
    animatedObjects.push({ obj: nacelle2, type: 'fire' });

    // Alien engine core (spinning and pulsing)
    var coreGeom = new THREE.SphereGeometry(6, 32, 32);
    var coreMat = new THREE.MeshStandardMaterial({
      color: 0x0088FF,
      emissive: 0x0066FF,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1
    });
    var coreObj = new THREE.Mesh(coreGeom, coreMat);
    coreObj.position.set(0, 20, 50);
    scene.add(coreObj);
    objects.push(coreObj);
    animatedObjects.push({ obj: coreObj, type: 'spin' });

    // Impact crater rim
    var crater = new THREE.Mesh(
      new THREE.CylinderGeometry(100, 100, 5, 32),
      new THREE.MeshStandardMaterial({ color: 0x554433, metalness: 0.3, roughness: 0.7 })
    );
    crater.position.set(0, -25, 0);
    scene.add(crater);
    objects.push(crater);

    // Scattered hull debris field
    for (var i = 0; i < 8; i++) {
      var debrisSize = 4 + Math.random() * 6;
      var debris = new THREE.Mesh(
        new THREE.BoxGeometry(debrisSize, debrisSize * 0.6, debrisSize * 1.2),
        new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.6, roughness: 0.5 })
      );
      debris.position.set(
        (Math.random() - 0.5) * 150,
        2 + Math.random() * 8,
        (Math.random() - 0.5) * 150
      );
      debris.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
      scene.add(debris);
      objects.push(debris);
      animatedObjects.push({ obj: debris, type: 'tumble' });
    }

    // Alien technology consoles
    var console1 = new THREE.Mesh(
      new THREE.BoxGeometry(12, 18, 4),
      new THREE.MeshStandardMaterial({ color: 0x002244, metalness: 0.8, roughness: 0.3 })
    );
    console1.position.set(-30, 8, 30);
    scene.add(console1);
    objects.push(console1);
    var screen1 = new THREE.Mesh(
      new THREE.BoxGeometry(10, 14, 1),
      new THREE.MeshStandardMaterial({
        color: 0x002244,
        emissive: 0x00AAFF,
        emissiveIntensity: 0.6,
        metalness: 0.7,
        roughness: 0.4
      })
    );
    screen1.position.set(-30, 8, 32.5);
    scene.add(screen1);
    objects.push(screen1);
    animatedObjects.push({ obj: screen1, type: 'flicker' });

    var console2 = new THREE.Mesh(
      new THREE.BoxGeometry(12, 18, 4),
      new THREE.MeshStandardMaterial({ color: 0x002244, metalness: 0.8, roughness: 0.3 })
    );
    console2.position.set(35, 7, 45);
    scene.add(console2);
    objects.push(console2);
    var screen2 = new THREE.Mesh(
      new THREE.BoxGeometry(10, 14, 1),
      new THREE.MeshStandardMaterial({
        color: 0x002244,
        emissive: 0x00AAFF,
        emissiveIntensity: 0.6,
        metalness: 0.7,
        roughness: 0.4
      })
    );
    screen2.position.set(35, 7, 47.5);
    scene.add(screen2);
    objects.push(screen2);
    animatedObjects.push({ obj: screen2, type: 'flicker' });

    // Escape pod debris
    var pod1 = new THREE.Mesh(
      new THREE.CylinderGeometry(5, 5, 15, 12),
      new THREE.MeshStandardMaterial({ color: 0x445544, metalness: 0.7, roughness: 0.4 })
    );
    pod1.position.set(-70, 5, 15);
    pod1.rotation.z = 0.7;
    scene.add(pod1);
    objects.push(pod1);

    var pod2 = new THREE.Mesh(
      new THREE.CylinderGeometry(5, 5, 15, 12),
      new THREE.MeshStandardMaterial({ color: 0x445544, metalness: 0.7, roughness: 0.4 })
    );
    pod2.position.set(75, 3, 25);
    pod2.rotation.z = -0.8;
    scene.add(pod2);
    objects.push(pod2);

    // Fuel explosion craters
    var crater1 = new THREE.Mesh(
      new THREE.SphereGeometry(15, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x221111, metalness: 0.2, roughness: 0.9 })
    );
    crater1.position.set(-50, -5, -40);
    scene.add(crater1);
    objects.push(crater1);

    var crater2 = new THREE.Mesh(
      new THREE.SphereGeometry(12, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x221111, metalness: 0.2, roughness: 0.9 })
    );
    crater2.position.set(55, -6, -35);
    scene.add(crater2);
    objects.push(crater2);

    // Alien life support tubes with green glow
    var lifeSupport1 = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 40, 12),
      new THREE.MeshStandardMaterial({
        color: 0x224422,
        emissive: 0x00FF44,
        emissiveIntensity: 0.5,
        metalness: 0.6,
        roughness: 0.4
      })
    );
    lifeSupport1.position.set(-25, 15, 70);
    lifeSupport1.rotation.z = 0.2;
    scene.add(lifeSupport1);
    objects.push(lifeSupport1);
    animatedObjects.push({ obj: lifeSupport1, type: 'pulse' });

    var lifeSupport2 = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 40, 12),
      new THREE.MeshStandardMaterial({
        color: 0x224422,
        emissive: 0x00FF44,
        emissiveIntensity: 0.5,
        metalness: 0.6,
        roughness: 0.4
      })
    );
    lifeSupport2.position.set(20, 14, 75);
    lifeSupport2.rotation.z = -0.15;
    scene.add(lifeSupport2);
    objects.push(lifeSupport2);
    animatedObjects.push({ obj: lifeSupport2, type: 'pulse' });

    // Damaged weapon arrays (melted turrets)
    var weapon1 = new THREE.Mesh(
      new THREE.BoxGeometry(8, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.65, roughness: 0.6 })
    );
    weapon1.position.set(-80, 12, 10);
    weapon1.rotation.y = 0.5;
    scene.add(weapon1);
    objects.push(weapon1);

    var weapon2 = new THREE.Mesh(
      new THREE.BoxGeometry(8, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0x444455, metalness: 0.65, roughness: 0.6 })
    );
    weapon2.position.set(85, 10, 5);
    weapon2.rotation.y = -0.4;
    scene.add(weapon2);
    objects.push(weapon2);

    // Communication antenna field
    var antenna1 = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 30, 8),
      new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.2 })
    );
    antenna1.position.set(-90, 20, -50);
    scene.add(antenna1);
    objects.push(antenna1);

    var dish1 = new THREE.Mesh(
      new THREE.SphereGeometry(4, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.85, roughness: 0.15 })
    );
    dish1.position.set(-90, 35, -50);
    scene.add(dish1);
    objects.push(dish1);

    var antenna2 = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 28, 8),
      new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.2 })
    );
    antenna2.position.set(95, 18, -45);
    scene.add(antenna2);
    objects.push(antenna2);

    var dish2 = new THREE.Mesh(
      new THREE.SphereGeometry(4, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.85, roughness: 0.15 })
    );
    dish2.position.set(95, 32, -45);
    scene.add(dish2);
    objects.push(dish2);

    // Military investigation perimeter barriers
    var barrier1 = new THREE.Mesh(
      new THREE.BoxGeometry(60, 3, 2),
      new THREE.MeshStandardMaterial({ color: 0x666644, metalness: 0.5, roughness: 0.6 })
    );
    barrier1.position.set(-60, 1, -100);
    scene.add(barrier1);
    objects.push(barrier1);

    var barrier2 = new THREE.Mesh(
      new THREE.BoxGeometry(60, 3, 2),
      new THREE.MeshStandardMaterial({ color: 0x666644, metalness: 0.5, roughness: 0.6 })
    );
    barrier2.position.set(60, 1, -100);
    scene.add(barrier2);
    objects.push(barrier2);

    // Perimeter warning lights
    var light1 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 4, 12),
      new THREE.MeshStandardMaterial({
        color: 0xFF6600,
        emissive: 0xFF3300,
        emissiveIntensity: 0.7,
        metalness: 0.7,
        roughness: 0.3
      })
    );
    light1.position.set(-100, 5, -100);
    scene.add(light1);
    objects.push(light1);
    animatedObjects.push({ obj: light1, type: 'flicker' });

    var light2 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 4, 12),
      new THREE.MeshStandardMaterial({
        color: 0xFF6600,
        emissive: 0xFF3300,
        emissiveIntensity: 0.7,
        metalness: 0.7,
        roughness: 0.3
      })
    );
    light2.position.set(100, 5, -100);
    scene.add(light2);
    objects.push(light2);
    animatedObjects.push({ obj: light2, type: 'flicker' });

    // Specimen containers with glow
    var specimen1 = new THREE.Mesh(
      new THREE.BoxGeometry(10, 12, 10),
      new THREE.MeshStandardMaterial({
        color: 0x003322,
        emissive: 0x00FF44,
        emissiveIntensity: 0.4,
        metalness: 0.8,
        roughness: 0.3
      })
    );
    specimen1.position.set(-40, 8, -20);
    scene.add(specimen1);
    objects.push(specimen1);
    animatedObjects.push({ obj: specimen1, type: 'glow' });

    var specimen2 = new THREE.Mesh(
      new THREE.BoxGeometry(10, 12, 10),
      new THREE.MeshStandardMaterial({
        color: 0x003322,
        emissive: 0x00FF44,
        emissiveIntensity: 0.4,
        metalness: 0.8,
        roughness: 0.3
      })
    );
    specimen2.position.set(45, 7, -15);
    scene.add(specimen2);
    objects.push(specimen2);
    animatedObjects.push({ obj: specimen2, type: 'glow' });
  }

  function update(delta) {
    for (var i = 0; i < animatedObjects.length; i++) {
      var anim = animatedObjects[i];
      var obj = anim.obj;

      if (anim.type === 'spin') {
        obj.rotation.x += delta * 0.3;
        obj.rotation.y += delta * 0.5;
        obj.scale.x = 1 + Math.sin(Date.now() * 0.003) * 0.1;
        obj.scale.y = 1 + Math.sin(Date.now() * 0.003) * 0.1;
        obj.scale.z = 1 + Math.sin(Date.now() * 0.003) * 0.1;
      } else if (anim.type === 'fire') {
        obj.material.emissiveIntensity = 0.3 + Math.random() * 0.4;
      } else if (anim.type === 'flicker') {
        obj.material.emissiveIntensity = 0.4 + Math.random() * 0.4;
      } else if (anim.type === 'pulse') {
        var intensity = 0.5 + Math.sin(Date.now() * 0.002) * 0.3;
        obj.material.emissiveIntensity = Math.max(0.2, intensity);
      } else if (anim.type === 'glow') {
        var glowIntensity = 0.4 + Math.sin(Date.now() * 0.0025) * 0.3;
        obj.material.emissiveIntensity = Math.max(0.1, glowIntensity);
      } else if (anim.type === 'tumble') {
        obj.rotation.x += delta * 0.2;
        obj.rotation.y += delta * 0.15;
        obj.rotation.z += delta * 0.25;
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      var scene = objects[i].parent;
      if (scene) {
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
