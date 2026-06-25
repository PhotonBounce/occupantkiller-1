var window;
window.BroraBase = (function() {
  'use strict';

  var BASE_X = 900;
  var BASE_Z = 1120;

  function build() {
    var group = new THREE.Group();

    colliery(group);
    conveyor(group);
    distillery(group);
    wagons(group);
    salmon(group);
    guns(group);
    bunker(group);
    fence(group);

    return group;
  }

  function colliery(parent) {
    var material = new THREE.MeshLambertMaterial({ color: 0x222222 });

    var tower = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 40, 16),
      material
    );
    tower.position.set(BASE_X, 20, BASE_Z);
    parent.add(tower);

    var engine = new THREE.Mesh(
      new THREE.BoxGeometry(20, 15, 12),
      material
    );
    engine.position.set(BASE_X - 25, 7.5, BASE_Z);
    parent.add(engine);

    var cap = new THREE.Mesh(
      new THREE.CylinderGeometry(10, 8, 4, 16),
      material
    );
    cap.position.set(BASE_X, 42, BASE_Z);
    parent.add(cap);
  }

  function conveyor(parent) {
    var material = new THREE.MeshLambertMaterial({ color: 0x444444 });

    var frames = [
      { x: 0, z: 0, h: 8 },
      { x: 15, z: 8, h: 16 },
      { x: 30, z: 16, h: 24 }
    ];

    var i;
    for (i = 0; i < frames.length; i++) {
      var frame = new THREE.Mesh(
        new THREE.BoxGeometry(6, frames[i].h, 6),
        material
      );
      frame.position.set(BASE_X + frames[i].x, frames[i].h / 2, BASE_Z + frames[i].z);
      parent.add(frame);
    }
  }

  function distillery(parent) {
    var building = new THREE.Mesh(
      new THREE.BoxGeometry(30, 25, 20),
      new THREE.MeshLambertMaterial({ color: 0xCC7700 })
    );
    building.position.set(BASE_X + 60, 12.5, BASE_Z + 40);
    parent.add(building);

    var still1 = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 4, 20, 12),
      new THREE.MeshLambertMaterial({ color: 0xDDDD00 })
    );
    still1.position.set(BASE_X + 45, 10, BASE_Z + 35);
    parent.add(still1);

    var still2 = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 4, 20, 12),
      new THREE.MeshLambertMaterial({ color: 0xDDDD00 })
    );
    still2.position.set(BASE_X + 75, 10, BASE_Z + 45);
    parent.add(still2);
  }

  function wagons(parent) {
    var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

    var positions = [
      { x: -40, z: -30 },
      { x: -20, z: -30 },
      { x: 0, z: -30 },
      { x: 20, z: -30 }
    ];

    var j;
    for (j = 0; j < positions.length; j++) {
      var body = new THREE.Mesh(
        new THREE.BoxGeometry(12, 8, 8),
        bodyMaterial
      );
      body.position.set(BASE_X + positions[j].x, 4, BASE_Z + positions[j].z);
      parent.add(body);

      var axle = new THREE.Mesh(
        new THREE.CylinderGeometry(3, 3, 15, 8),
        wheelMaterial
      );
      axle.rotation.z = Math.PI / 2;
      axle.position.set(BASE_X + positions[j].x, 2, BASE_Z + positions[j].z);
      parent.add(axle);
    }
  }

  function salmon(parent) {
    var material = new THREE.MeshLambertMaterial({ color: 0x556655 });

    var steps = [
      { y: 2, z: -60 },
      { y: 4, z: -45 },
      { y: 6, z: -30 }
    ];

    var k;
    for (k = 0; k < steps.length; k++) {
      var step = new THREE.Mesh(
        new THREE.BoxGeometry(25, 2, 15),
        material
      );
      step.position.set(BASE_X, steps[k].y, BASE_Z + steps[k].z);
      parent.add(step);
    }
  }

  function guns(parent) {
    var platform = new THREE.Mesh(
      new THREE.BoxGeometry(40, 2, 40),
      new THREE.MeshLambertMaterial({ color: 0x999999 })
    );
    platform.position.set(BASE_X - 80, 1, BASE_Z + 60);
    parent.add(platform);

    var gunMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });

    var barrels = [
      { x: -10, z: -10 },
      { x: 10, z: -10 },
      { x: -10, z: 10 },
      { x: 10, z: 10 }
    ];

    var m;
    for (m = 0; m < barrels.length; m++) {
      var barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 16, 8),
        gunMaterial
      );
      barrel.rotation.z = Math.PI / 3;
      barrel.position.set(BASE_X - 80 + barrels[m].x, 10, BASE_Z + 60 + barrels[m].z);
      parent.add(barrel);
    }
  }

  function bunker(parent) {
    var portal = new THREE.Mesh(
      new THREE.BoxGeometry(8, 10, 6),
      new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
    );
    portal.position.set(BASE_X + 100, 5, BASE_Z - 50);
    parent.add(portal);

    var frame = new THREE.Mesh(
      new THREE.BoxGeometry(12, 14, 2),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    frame.position.set(BASE_X + 100, 7, BASE_Z - 49);
    parent.add(frame);
  }

  function fence(parent) {
    var fenceGeom = new THREE.BufferGeometry();
    var fencePos = [];

    var posts = 8;
    var radius = 50;
    var n;
    for (n = 0; n < posts; n++) {
      var angle = (n / posts) * Math.PI * 2;
      var px = Math.cos(angle) * radius;
      var pz = Math.sin(angle) * radius;

      fencePos.push(BASE_X + px, 0, BASE_Z + pz);
      fencePos.push(BASE_X + px, 3, BASE_Z + pz);

      var next = (n + 1) % posts;
      var angleNext = (next / posts) * Math.PI * 2;
      var pxNext = Math.cos(angleNext) * radius;
      var pzNext = Math.sin(angleNext) * radius;

      fencePos.push(BASE_X + px, 1.5, BASE_Z + pz);
      fencePos.push(BASE_X + pxNext, 1.5, BASE_Z + pzNext);
    }

    fenceGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fencePos), 3));

    var fenceLines = new THREE.LineSegments(
      fenceGeom,
      new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 })
    );
    parent.add(fenceLines);

    var gate = new THREE.Mesh(
      new THREE.BoxGeometry(10, 3, 1),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    );
    gate.position.set(BASE_X + radius, 1.5, BASE_Z);
    parent.add(gate);
  }

  return {
    build: build
  };
}());
