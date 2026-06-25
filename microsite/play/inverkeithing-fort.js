window.InverkeithinFort = (function() {
  'use strict';

  var module = {};

  module.objects = [];
  module.lights = [];

  function create(scene) {
    var geometry, material, mesh;

    // Medieval Townhouse (town hall)
    geometry = new THREE.BoxGeometry(10, 8, 8);
    material = new THREE.MeshLambertMaterial({ color: 0xCC9966 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-5, 4, 0);
    scene.add(mesh);
    module.objects.push(mesh);

    // Town hall tower
    geometry = new THREE.BoxGeometry(4, 10, 4);
    material = new THREE.MeshLambertMaterial({ color: 0xCC9966 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-3, 9, 2);
    scene.add(mesh);
    module.objects.push(mesh);

    // Franciscan Friary ruin walls
    geometry = new THREE.BoxGeometry(1, 6, 10);
    material = new THREE.MeshLambertMaterial({ color: 0x887766 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(15, 3, 10);
    scene.add(mesh);
    module.objects.push(mesh);

    // Friary ruin wall 2
    geometry = new THREE.BoxGeometry(1, 6, 10);
    material = new THREE.MeshLambertMaterial({ color: 0x887766 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(20, 3, 10);
    scene.add(mesh);
    module.objects.push(mesh);

    // Friary ruin wall 3
    geometry = new THREE.BoxGeometry(1, 6, 10);
    material = new THREE.MeshLambertMaterial({ color: 0x887766 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(17.5, 3, 0);
    scene.add(mesh);
    module.objects.push(mesh);

    // Ship-breaking yard
    geometry = new THREE.BoxGeometry(30, 4, 20);
    material = new THREE.MeshLambertMaterial({ color: 0x555566 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(5, 2, -20);
    scene.add(mesh);
    module.objects.push(mesh);

    // Ship hull being broken
    geometry = new THREE.BoxGeometry(16, 5, 8);
    material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(10, 4.5, -18);
    mesh.rotation.z = 0.2618;
    scene.add(mesh);
    module.objects.push(mesh);

    // Industrial cutting torch - cylinder
    geometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
    material = new THREE.MeshLambertMaterial({ color: 0x333333 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(12, 7.5, -18);
    scene.add(mesh);
    module.objects.push(mesh);

    // Cutting torch bright sphere (flame)
    geometry = new THREE.SphereGeometry(0.3, 8, 8);
    material = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(12, 9, -18);
    scene.add(mesh);
    module.objects.push(mesh);

    // Ship propeller - center sphere
    geometry = new THREE.SphereGeometry(2, 16, 16);
    material = new THREE.MeshLambertMaterial({ color: 0xB87333 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(8, 3, -16);
    scene.add(mesh);
    module.objects.push(mesh);

    // Propeller blade 1
    geometry = new THREE.BoxGeometry(4, 0.3, 1);
    material = new THREE.MeshLambertMaterial({ color: 0xB87333 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(8, 3, -16);
    scene.add(mesh);
    module.objects.push(mesh);

    // Propeller blade 2
    geometry = new THREE.BoxGeometry(4, 0.3, 1);
    material = new THREE.MeshLambertMaterial({ color: 0xB87333 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(8, 3, -16);
    mesh.rotation.z = 1.5708;
    scene.add(mesh);
    module.objects.push(mesh);

    // Propeller blade 3
    geometry = new THREE.BoxGeometry(4, 0.3, 1);
    material = new THREE.MeshLambertMaterial({ color: 0xB87333 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(8, 3, -16);
    mesh.rotation.z = 3.1416;
    scene.add(mesh);
    module.objects.push(mesh);

    // Propeller blade 4
    geometry = new THREE.BoxGeometry(4, 0.3, 1);
    material = new THREE.MeshLambertMaterial({ color: 0xB87333 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(8, 3, -16);
    mesh.rotation.z = 4.7124;
    scene.add(mesh);
    module.objects.push(mesh);

    // Harbour breakwater
    geometry = new THREE.BoxGeometry(30, 3, 4);
    material = new THREE.MeshLambertMaterial({ color: 0x888877 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(5, 1.5, -35);
    scene.add(mesh);
    module.objects.push(mesh);

    // Medieval market square
    geometry = new THREE.BoxGeometry(20, 0.3, 20);
    material = new THREE.MeshLambertMaterial({ color: 0x998877 });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-10, 0.15, -5);
    scene.add(mesh);
    module.objects.push(mesh);

    // Market square cross monument - vertical
    geometry = new THREE.BoxGeometry(1, 5, 1);
    material = new THREE.MeshLambertMaterial({ color: 0xCCAACC });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-10, 2.5, -5);
    scene.add(mesh);
    module.objects.push(mesh);

    // Market square cross monument - horizontal
    geometry = new THREE.BoxGeometry(4, 1, 1);
    material = new THREE.MeshLambertMaterial({ color: 0xCCAACC });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-10, 4, -5);
    scene.add(mesh);
    module.objects.push(mesh);

    // Ambient light - rust-and-salt
    var ambientLight = new THREE.AmbientLight(0xAA9988, 0.6);
    scene.add(ambientLight);
    module.lights.push(ambientLight);

    // Cutting torch fire light - bright orange point
    module.torchLight = new THREE.PointLight(0xFF6600, 1.5, 20);
    module.torchLight.position.set(12, 9, -18);
    scene.add(module.torchLight);
    module.lights.push(module.torchLight);

    // Harbour lights
    var harbourLight1 = new THREE.PointLight(0xFFFFFF, 0.8, 30);
    harbourLight1.position.set(0, 4, -35);
    scene.add(harbourLight1);
    module.lights.push(harbourLight1);

    var harbourLight2 = new THREE.PointLight(0xFFFFFF, 0.8, 30);
    harbourLight2.position.set(10, 4, -35);
    scene.add(harbourLight2);
    module.lights.push(harbourLight2);

    // Store propeller blades for rotation
    module.propellerBlades = [
      module.objects[12],
      module.objects[13],
      module.objects[14],
      module.objects[15]
    ];

    module.torchSphere = module.objects[11];
  }

  function update(delta) {
    if (module.torchLight) {
      module.torchLight.intensity = 1.5 + Math.sin(Date.now() * 0.01) * 0.5;
    }

    if (module.torchSphere) {
      module.torchSphere.rotation.y += delta * 2;
    }

    if (module.propellerBlades) {
      var i = 0;
      while (i < module.propellerBlades.length) {
        module.propellerBlades[i].rotation.x += delta * 3;
        i = i + 1;
      }
    }
  }

  function reset(scene) {
    var i = 0;
    while (i < module.objects.length) {
      scene.remove(module.objects[i]);
      i = i + 1;
    }
    module.objects = [];

    i = 0;
    while (i < module.lights.length) {
      scene.remove(module.lights[i]);
      i = i + 1;
    }
    module.lights = [];

    module.torchLight = null;
    module.torchSphere = null;
    module.propellerBlades = null;
  }

  module.create = create;
  module.update = update;
  module.reset = reset;

  return module;
}());
