var PooleweCamp = (function() {
  'use strict';

  var group = new THREE.Group();
  group.position.set(1280, 0, 1690);

  function build() {
    destroyer();
    boom();
    conservatory();
    signalstation();
    depthcharges();
    briefinghut();
    aabattery();
    buoy();
    return group;
  }

  function destroyer() {
    var hull = new THREE.Mesh(
      new THREE.BoxGeometry(20, 3, 4),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    hull.position.set(-40, 2, 0);
    group.add(hull);

    var bridge = new THREE.Mesh(
      new THREE.BoxGeometry(6, 4, 3),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    );
    bridge.position.set(-35, 6, 0);
    group.add(bridge);

    var gunL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    gunL.rotation.z = Math.PI / 2;
    gunL.position.set(-35, 7, 2);
    group.add(gunL);

    var gunR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    gunR.rotation.z = Math.PI / 2;
    gunR.position.set(-35, 7, -2);
    group.add(gunR);
  }

  function boom() {
    var points = [
      new THREE.Vector3(-30, 1, -20),
      new THREE.Vector3(30, 1, -20),
      new THREE.Vector3(30, 1, 20),
      new THREE.Vector3(-30, 1, 20)
    ];

    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var chain = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 3 })
    );
    group.add(chain);

    var sections = [
      new THREE.Vector3(-15, 0.5, 0),
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(15, 0.5, 0)
    ];

    sections.forEach(function(pos) {
      var section = new THREE.Mesh(
        new THREE.BoxGeometry(8, 1, 4),
        new THREE.MeshLambertMaterial({ color: 0x666666 })
      );
      section.position.copy(pos);
      group.add(section);
    });
  }

  function conservatory() {
    var glass = new THREE.Mesh(
      new THREE.BoxGeometry(10, 5, 4),
      new THREE.MeshLambertMaterial({ color: 0x00AA44, transparent: true, opacity: 0.6 })
    );
    glass.position.set(50, 3, 10);
    group.add(glass);
  }

  function signalstation() {
    var tower = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1.2, 12, 8),
      new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    tower.position.set(0, 6, 40);
    group.add(tower);

    var lamp = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 16, 16),
      new THREE.MeshLambertMaterial({ color: 0xFFFF00 })
    );
    lamp.position.set(0, 14, 40);
    group.add(lamp);
  }

  function depthcharges() {
    var rack = new THREE.Mesh(
      new THREE.BoxGeometry(16, 1, 3),
      new THREE.MeshLambertMaterial({ color: 0x555555 })
    );
    rack.position.set(30, 1, -40);
    group.add(rack);

    var positions = [
      new THREE.Vector3(22, 2, -40),
      new THREE.Vector3(26, 2, -40),
      new THREE.Vector3(30, 2, -40),
      new THREE.Vector3(34, 2, -40),
      new THREE.Vector3(38, 2, -40),
      new THREE.Vector3(42, 2, -40)
    ];

    positions.forEach(function(pos) {
      var charge = new THREE.Mesh(
        new THREE.SphereGeometry(1, 12, 12),
        new THREE.MeshLambertMaterial({ color: 0x333333 })
      );
      charge.position.copy(pos);
      group.add(charge);
    });
  }

  function briefinghut() {
    var hut = new THREE.Mesh(
      new THREE.BoxGeometry(8, 4, 3),
      new THREE.MeshLambertMaterial({ color: 0xAA8844 })
    );
    hut.position.set(-60, 2, 30);
    group.add(hut);
  }

  function aabattery() {
    var platform = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 0.5, 32),
      new THREE.MeshLambertMaterial({ color: 0x555555 })
    );
    platform.position.set(60, 0.5, -30);
    group.add(platform);

    var angles = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];

    angles.forEach(function(angle) {
      var gun = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 6, 8),
        new THREE.MeshLambertMaterial({ color: 0x222222 })
      );
      gun.rotation.z = Math.PI / 3;
      gun.position.x = 60 + 5 * Math.cos(angle);
      gun.position.y = 3;
      gun.position.z = -30 + 5 * Math.sin(angle);
      group.add(gun);
    });
  }

  function buoy() {
    var post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 5, 8),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    post.position.set(-20, 2.5, -60);
    group.add(post);

    var sphere = new THREE.Mesh(
      new THREE.SphereGeometry(2, 16, 16),
      new THREE.MeshLambertMaterial({ color: 0xFF6600 })
    );
    sphere.position.set(-20, 6, -60);
    group.add(sphere);
  }

  return {
    build: build
  };
}());
