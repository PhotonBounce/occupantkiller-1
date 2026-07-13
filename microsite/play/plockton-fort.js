window.PlocktonFort = (function() { 'use strict';

var baseX = 1240;
var baseZ = 1630;

function createCottages() {
  var group = new THREE.Group();
  var cottageCount = 5;
  var radius = 25;

  for (var i = 0; i < cottageCount; i++) {
    var angle = (i / cottageCount) * Math.PI;
    var x = baseX + Math.cos(angle) * radius;
    var z = baseZ + Math.sin(angle) * radius;

    var body = new THREE.Mesh(
      new THREE.BoxGeometry(3, 3, 4),
      new THREE.MeshLambertMaterial({ color: 0xF5F5F5 })
    );
    body.position.set(x, 1.5, z);
    body.rotation.y = angle;
    group.add(body);

    var roof = new THREE.Mesh(
      new THREE.ConeGeometry(2.2, 2, 4),
      new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    roof.position.set(x, 4, z);
    roof.rotation.y = angle;
    group.add(roof);
  }

  return group;
}

function createPalmTrees() {
  var group = new THREE.Group();
  var palmCount = 5;

  for (var i = 0; i < palmCount; i++) {
    var x = baseX - 15 + (i * 8);
    var z = baseZ - 20;

    var trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.8, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x654321 })
    );
    trunk.position.set(x, 4, z);
    group.add(trunk);

    var crown = new THREE.Mesh(
      new THREE.ConeGeometry(3, 4, 8),
      new THREE.MeshLambertMaterial({ color: 0x228B22 })
    );
    crown.position.set(x, 9, z);
    group.add(crown);
  }

  return group;
}

function createPoliceStation() {
  var group = new THREE.Group();

  var building = new THREE.Mesh(
    new THREE.BoxGeometry(5, 4, 4),
    new THREE.MeshLambertMaterial({ color: 0xF5F5F5 })
  );
  building.position.set(baseX + 40, 2, baseZ - 15);
  group.add(building);

  var light = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 1, 16),
    new THREE.MeshLambertMaterial({ color: 0x0000FF })
  );
  light.position.set(baseX + 40, 6, baseZ - 15);
  group.add(light);

  return group;
}

function createPier() {
  var group = new THREE.Group();

  var pier = new THREE.Mesh(
    new THREE.BoxGeometry(15, 1, 3),
    new THREE.MeshLambertMaterial({ color: 0x8B7355 })
  );
  pier.position.set(baseX + 35, 0.5, baseZ + 25);
  group.add(pier);

  for (var i = 0; i < 3; i++) {
    var boat = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 1.5),
      new THREE.MeshLambertMaterial({ color: 0xDC143C })
    );
    boat.position.set(baseX + 25 + (i * 8), 1.5, baseZ + 30);
    group.add(boat);
  }

  return group;
}

function createBoathouse() {
  var group = new THREE.Group();

  var boathouse = new THREE.Mesh(
    new THREE.BoxGeometry(6, 3.5, 5),
    new THREE.MeshLambertMaterial({ color: 0x696969 })
  );
  boathouse.position.set(baseX - 35, 1.75, baseZ + 20);
  group.add(boathouse);

  var gear = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1, 1),
    new THREE.MeshLambertMaterial({ color: 0x000000 })
  );
  gear.position.set(baseX - 35, 1.5, baseZ + 20);
  group.add(gear);

  return group;
}

function createSonarStation() {
  var group = new THREE.Group();

  var mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 12, 8),
    new THREE.MeshLambertMaterial({ color: 0x696969 })
  );
  mast.position.set(baseX + 50, 6, baseZ + 35);
  group.add(mast);

  var cabin = new THREE.Mesh(
    new THREE.BoxGeometry(4, 3, 4),
    new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
  );
  cabin.position.set(baseX + 50, 1.5, baseZ + 40);
  group.add(cabin);

  return group;
}

function createDefensiveRocks() {
  var group = new THREE.Group();
  var rockPositions = [
    [baseX + 60, baseZ + 45],
    [baseX + 65, baseZ + 50],
    [baseX + 55, baseZ + 55],
    [baseX + 70, baseZ + 48],
    [baseX + 62, baseZ + 40]
  ];

  for (var i = 0; i < rockPositions.length; i++) {
    var rock = new THREE.Mesh(
      new THREE.BoxGeometry(
        2 + Math.random() * 1.5,
        1.5 + Math.random() * 1,
        2 + Math.random() * 1.5
      ),
      new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
    );
    rock.position.set(rockPositions[i][0], 0.8, rockPositions[i][1]);
    rock.rotation.x = Math.random() * 0.5;
    rock.rotation.z = Math.random() * 0.5;
    group.add(rock);
  }

  return group;
}

function createHelipad() {
  var group = new THREE.Group();

  var pad = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.2, 12),
    new THREE.MeshLambertMaterial({ color: 0xFFFF00 })
  );
  pad.position.set(baseX - 50, 0, baseZ - 40);
  group.add(pad);

  var corners = [
    [-6, -6],
    [6, -6],
    [6, 6],
    [-6, 6]
  ];

  for (var i = 0; i < corners.length; i++) {
    var marker = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 1.5, 8),
      new THREE.MeshLambertMaterial({ color: 0xFF6347 })
    );
    marker.position.set(
      baseX - 50 + corners[i][0],
      0.75,
      baseZ - 40 + corners[i][1]
    );
    group.add(marker);
  }

  return group;
}

function build() {
  var environment = new THREE.Group();

  environment.add(createCottages());
  environment.add(createPalmTrees());
  environment.add(createPoliceStation());
  environment.add(createPier());
  environment.add(createBoathouse());
  environment.add(createSonarStation());
  environment.add(createDefensiveRocks());
  environment.add(createHelipad());

  return environment;
}

return {
  build: build
};

}());
