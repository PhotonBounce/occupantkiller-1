window.BenbeculaDock = (function() {
  'use strict';

  var BenbeculaDock = function(scene) {
    this.scene = scene;
    this.world = new THREE.Vector3(1580, 0, 2140);
    this.structures = [];
  };

  BenbeculaDock.prototype.build = function() {
    this.tower();
    this.launcher();
    this.radar();
    this.causeway();
    this.vessel();
    this.facility();
    this.airstrip();
    this.cottage();
  };

  BenbeculaDock.prototype.tower = function() {
    var base = new THREE.Mesh(
      new THREE.BoxGeometry(3, 10, 3),
      new THREE.MeshLambertMaterial({ color: 0x404040 })
    );
    base.position.set(this.world.x, 5, this.world.z);
    this.scene.add(base);
    this.structures.push(base);

    var cab = new THREE.Mesh(
      new THREE.BoxGeometry(5, 3, 5),
      new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
    );
    cab.position.set(this.world.x, 11, this.world.z);
    this.scene.add(cab);
    this.structures.push(cab);
  };

  BenbeculaDock.prototype.launcher = function() {
    var rail = new THREE.Mesh(
      new THREE.BoxGeometry(15, 1, 2),
      new THREE.MeshLambertMaterial({ color: 0x808080 })
    );
    rail.position.set(this.world.x + 30, 1, this.world.z);
    this.scene.add(rail);
    this.structures.push(rail);

    var missile = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 4, 16),
      new THREE.MeshLambertMaterial({ color: 0xff6b6b })
    );
    missile.position.set(this.world.x + 30, 3, this.world.z);
    missile.rotation.z = Math.PI / 6;
    this.scene.add(missile);
    this.structures.push(missile);

    var pad = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.5, 10),
      new THREE.MeshLambertMaterial({ color: 0x505050 })
    );
    pad.position.set(this.world.x + 30, 0.25, this.world.z);
    this.scene.add(pad);
    this.structures.push(pad);
  };

  BenbeculaDock.prototype.radar = function() {
    var radome = new THREE.Mesh(
      new THREE.SphereGeometry(8, 32, 32),
      new THREE.MeshLambertMaterial({ color: 0xcccccc })
    );
    radome.position.set(this.world.x - 40, 8, this.world.z + 50);
    this.scene.add(radome);
    this.structures.push(radome);

    var plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(10, 12, 2, 32),
      new THREE.MeshLambertMaterial({ color: 0x606060 })
    );
    plinth.position.set(this.world.x - 40, 1, this.world.z + 50);
    this.scene.add(plinth);
    this.structures.push(plinth);
  };

  BenbeculaDock.prototype.causeway = function() {
    var road = new THREE.Mesh(
      new THREE.BoxGeometry(8, 1, 80),
      new THREE.MeshLambertMaterial({ color: 0x5a5a5a })
    );
    road.position.set(this.world.x - 80, 0.5, this.world.z + 40);
    this.scene.add(road);
    this.structures.push(road);

    var i;
    for (i = 0; i < 10; i++) {
      var pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 2, 3, 16),
        new THREE.MeshLambertMaterial({ color: 0x707070 })
      );
      pillar.position.set(this.world.x - 80, 1.5, this.world.z - 20 + (i * 9));
      this.scene.add(pillar);
      this.structures.push(pillar);
    }
  };

  BenbeculaDock.prototype.vessel = function() {
    var hull = new THREE.Mesh(
      new THREE.BoxGeometry(8, 4, 20),
      new THREE.MeshLambertMaterial({ color: 0x2d5016 })
    );
    hull.position.set(this.world.x + 60, 2, this.world.z - 50);
    this.scene.add(hull);
    this.structures.push(hull);

    var gun = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 6, 16),
      new THREE.MeshLambertMaterial({ color: 0x303030 })
    );
    gun.position.set(this.world.x + 60, 5, this.world.z - 50);
    gun.rotation.z = Math.PI / 4;
    this.scene.add(gun);
    this.structures.push(gun);
  };

  BenbeculaDock.prototype.facility = function() {
    var building = new THREE.Mesh(
      new THREE.BoxGeometry(12, 6, 5),
      new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
    );
    building.position.set(this.world.x - 50, 3, this.world.z - 40);
    this.scene.add(building);
    this.structures.push(building);
  };

  BenbeculaDock.prototype.airstrip = function() {
    var runway = new THREE.Mesh(
      new THREE.BoxGeometry(40, 1, 2),
      new THREE.MeshLambertMaterial({ color: 0x484848 })
    );
    runway.position.set(this.world.x + 100, 0.5, this.world.z + 80);
    this.scene.add(runway);
    this.structures.push(runway);

    var hangar = new THREE.Mesh(
      new THREE.BoxGeometry(15, 8, 12),
      new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
    );
    hangar.position.set(this.world.x + 120, 4, this.world.z + 100);
    this.scene.add(hangar);
    this.structures.push(hangar);
  };

  BenbeculaDock.prototype.cottage = function() {
    var walls = new THREE.Mesh(
      new THREE.BoxGeometry(5, 3, 3),
      new THREE.MeshLambertMaterial({ color: 0x6b5b4a })
    );
    walls.position.set(this.world.x - 100, 1.5, this.world.z + 60);
    this.scene.add(walls);
    this.structures.push(walls);
  };

  BenbeculaDock.prototype.remove = function() {
    var i;
    for (i = 0; i < this.structures.length; i++) {
      this.scene.remove(this.structures[i]);
    }
    this.structures = [];
  };

  return BenbeculaDock;
}());
