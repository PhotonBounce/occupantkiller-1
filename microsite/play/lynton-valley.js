var LyntonValley = (function () {
  var OX = 7720;
  var OZ = 0;

  function group() {
    return new THREE.Group();
  }

  function box(w, h, d, color) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function cylinder(rt, rb, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function sphere(r, ws, hs, color) {
    var geo = new THREE.SphereGeometry(r, ws, hs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function cone(r, h, segs, color) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function place(mesh, x, y, z) {
    mesh.position.set(OX + x, y, OZ + z);
    return mesh;
  }

  function railway(scene) {
    var g = group();

    var ramp = box(2, 30, 2, 0x8B6914);
    ramp.rotation.z = Math.PI / 5;
    ramp.position.set(OX + 0, 12, OZ + 0);
    scene.add(ramp);

    var car1 = box(3, 2, 2, 0x8B6914);
    car1.position.set(OX + -3, 6, OZ + 0);
    scene.add(car1);

    var car2 = box(3, 2, 2, 0x8B6914);
    car2.position.set(OX + 3, 18, OZ + 0);
    scene.add(car2);

    var stationBottom = box(5, 4, 4, 0x996633);
    stationBottom.position.set(OX + -5, 2, OZ + 0);
    scene.add(stationBottom);

    var roofBottom = box(5, 1, 4, 0x664422);
    roofBottom.position.set(OX + -5, 4.5, OZ + 0);
    scene.add(roofBottom);

    var stationTop = box(5, 4, 4, 0x996633);
    stationTop.position.set(OX + 5, 22, OZ + 0);
    scene.add(stationTop);

    var roofTop = box(5, 1, 4, 0x664422);
    roofTop.position.set(OX + 5, 24.5, OZ + 0);
    scene.add(roofTop);
  }

  function rocks(scene) {
    var configs = [
      { x: 30, z: -20, blocks: [{ h: 8,  y: 4  }, { h: 5,  y: 10.5 }, { h: 3,  y: 15 }] },
      { x: 45, z: -10, blocks: [{ h: 10, y: 5  }, { h: 6,  y: 13  }, { h: 4,  y: 19 }] },
      { x: 55, z: -30, blocks: [{ h: 12, y: 6  }, { h: 7,  y: 14.5 }, { h: 4,  y: 21 }] },
      { x: 35, z: -45, blocks: [{ h: 9,  y: 4.5}, { h: 5,  y: 12  }] },
      { x: 60, z: -50, blocks: [{ h: 14, y: 7  }, { h: 8,  y: 17  }, { h: 3,  y: 23 }] }
    ];

    for (var i = 0; i < configs.length; i++) {
      var cfg = configs[i];
      for (var j = 0; j < cfg.blocks.length; j++) {
        var b = cfg.blocks[j];
        var w = 4 - j * 0.5;
        var d = 4 - j * 0.5;
        var rock = box(w, b.h, d, 0x777766);
        rock.position.set(OX + cfg.x, b.y, OZ + cfg.z);
        scene.add(rock);
      }
    }
  }

  function harbour(scene) {
    var wall1 = box(3, 2, 20, 0xAA9988);
    wall1.position.set(OX + -20, 1, OZ + 60);
    scene.add(wall1);

    var wall2 = box(3, 2, 20, 0xAA9988);
    wall2.position.set(OX + -30, 1, OZ + 60);
    scene.add(wall2);

    var boatData = [
      { x: -23, z: 50 },
      { x: -23, z: 55 },
      { x: -27, z: 50 },
      { x: -27, z: 55 }
    ];

    for (var i = 0; i < boatData.length; i++) {
      var bd = boatData[i];
      var hull = box(3, 1, 5, 0x553311);
      hull.position.set(OX + bd.x, 0.5, OZ + bd.z);
      scene.add(hull);

      var cabin = box(1.5, 1, 2, 0xDDCC99);
      cabin.position.set(OX + bd.x, 1.5, OZ + bd.z);
      scene.add(cabin);
    }
  }

  function town(scene) {
    var buildingData = [
      { x: -50, z: -10, color: 0xF0EDE0 },
      { x: -60, z: -10, color: 0xF0EDE0 },
      { x: -70, z: -10, color: 0xF0EDE0 },
      { x: -80, z: -10, color: 0x885533 },
      { x: -50, z: -20, color: 0x885533 },
      { x: -60, z: -20, color: 0xF0EDE0 },
      { x: -70, z: -20, color: 0xF0EDE0 },
      { x: -80, z: -20, color: 0xF0EDE0 }
    ];

    for (var i = 0; i < buildingData.length; i++) {
      var bd = buildingData[i];
      var bld = box(6, 7, 8, bd.color);
      bld.position.set(OX + bd.x, 3.5, OZ + bd.z);
      scene.add(bld);

      var roof = box(6, 1.5, 8, 0x664422);
      roof.position.set(OX + bd.x, 7.75, OZ + bd.z);
      scene.add(roof);
    }

    var hotel = box(15, 10, 8, 0xF0EDE0);
    hotel.position.set(OX + -65, 5, OZ + -35);
    scene.add(hotel);

    var hotelRoof = box(15, 2, 8, 0x664422);
    hotelRoof.position.set(OX + -65, 11, OZ + -35);
    scene.add(hotelRoof);

    var sign = box(8, 1, 0.2, 0x885533);
    sign.position.set(OX + -65, 8, OZ + -31);
    scene.add(sign);
  }

  function gorge(scene) {
    var wallLeft = box(2, 20, 2, 0x665544);
    wallLeft.position.set(OX + -100, 10, OZ + 10);
    scene.add(wallLeft);

    var wallRight = box(2, 20, 2, 0x665544);
    wallRight.position.set(OX + -110, 10, OZ + 10);
    scene.add(wallRight);

    var wallLeft2 = box(2, 20, 2, 0x665544);
    wallLeft2.position.set(OX + -100, 10, OZ + 20);
    scene.add(wallLeft2);

    var wallRight2 = box(2, 20, 2, 0x665544);
    wallRight2.position.set(OX + -110, 10, OZ + 20);
    scene.add(wallRight2);

    var wallLeft3 = box(2, 20, 2, 0x665544);
    wallLeft3.position.set(OX + -100, 10, OZ + 30);
    scene.add(wallLeft3);

    var wallRight3 = box(2, 20, 2, 0x665544);
    wallRight3.position.set(OX + -110, 10, OZ + 30);
    scene.add(wallRight3);

    var river = box(40, 0.3, 4, 0x4477AA);
    river.position.set(OX + -105, 0.15, OZ + 20);
    scene.add(river);
  }

  function memorial(scene) {
    var floodWall = box(15, 0.3, 4, 0xBBAA88);
    floodWall.position.set(OX + -130, 0.15, OZ + 40);
    scene.add(floodWall);

    var obelisk = box(1, 8, 1, 0x998877);
    obelisk.position.set(OX + -130, 4, OZ + 38);
    scene.add(obelisk);

    var cap = box(1.5, 0.5, 1.5, 0x998877);
    cap.position.set(OX + -130, 8.25, OZ + 38);
    scene.add(cap);
  }

  function build(scene) {
    railway(scene);
    rocks(scene);
    harbour(scene);
    town(scene);
    gorge(scene);
    memorial(scene);
  }

  return { build: build };
})();

if (typeof module !== 'undefined') { module.exports = LyntonValley; }
