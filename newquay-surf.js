var NewquaySurf = (function () {
  var OFFSET_X = 8040;
  var OFFSET_Z = 0;

  function init(scene) {
    beach(scene);
    ocean(scene);
    tower(scene);
    harbour(scene);
    hotel(scene);
    shops(scene);
    watergateDay(scene);
    aquarium(scene);
    surfers(scene);
  }

  function mesh(geo, mat) {
    return new THREE.Mesh(geo, mat);
  }

  function lambert(color) {
    return new THREE.MeshLambertMaterial({ color: color });
  }

  function place(obj, x, y, z) {
    obj.position.set(OFFSET_X + x, y, OFFSET_Z + z);
    return obj;
  }

  function beach(scene) {
    var geo = new THREE.BoxGeometry(80, 0.3, 30);
    var mat = lambert(0xF4E0A0);
    var m = mesh(geo, mat);
    scene.add(place(m, 0, 0, 0));
  }

  function ocean(scene) {
    var geo = new THREE.BoxGeometry(80, 0.3, 40);
    var mat = lambert(0x3377BB);
    var m = mesh(geo, mat);
    scene.add(place(m, 0, 0, -35));
  }

  function tower(scene) {
    var postGeo = new THREE.CylinderGeometry(1, 1, 8, 8);
    var mat = lambert(0xFFCC00);
    var post = mesh(postGeo, mat);
    scene.add(place(post, 10, 4, 5));

    var platGeo = new THREE.BoxGeometry(4, 1, 4);
    var plat = mesh(platGeo, mat);
    scene.add(place(plat, 10, 8.5, 5));
  }

  function harbour(scene) {
    var wallMat = lambert(0xAA9988);

    var wall1Geo = new THREE.BoxGeometry(4, 2, 25);
    var w1 = mesh(wall1Geo, wallMat);
    scene.add(place(w1, -50, 1, 20));

    var wall2Geo = new THREE.BoxGeometry(4, 2, 25);
    var w2 = mesh(wall2Geo, wallMat);
    scene.add(place(w2, -60, 1, 20));

    var boatMat = lambert(0xCCCCCC);
    var i;
    for (i = 0; i < 5; i++) {
      var hullGeo = new THREE.BoxGeometry(2, 1, 5);
      var hull = mesh(hullGeo, boatMat);
      scene.add(place(hull, -54 + i * 1, 0.5, 10 + i * 4));

      var mastGeo = new THREE.CylinderGeometry(0.1, 0.1, 4, 4);
      var mastMat = lambert(0x884422);
      var mast = mesh(mastGeo, mastMat);
      scene.add(place(mast, -54 + i * 1, 3, 10 + i * 4));
    }
  }

  function hotel(scene) {
    var bodyMat = lambert(0x9B3A2A);

    var bodyGeo = new THREE.BoxGeometry(35, 20, 12);
    var body = mesh(bodyGeo, bodyMat);
    scene.add(place(body, 30, 10, -15));

    var turretMat = lambert(0x9B3A2A);

    var t1Geo = new THREE.CylinderGeometry(2, 2, 14, 8);
    var t1 = mesh(t1Geo, turretMat);
    scene.add(place(t1, 14, 7, -15));

    var t2Geo = new THREE.CylinderGeometry(2, 2, 14, 8);
    var t2 = mesh(t2Geo, turretMat);
    scene.add(place(t2, 46, 7, -15));
  }

  function shops(scene) {
    var colors = [0xFF6633, 0x3366FF, 0x33CC33, 0xFF6633, 0x3366FF, 0x33CC33, 0xFF6633, 0x3366FF];
    var i;
    for (i = 0; i < 8; i++) {
      var geo = new THREE.BoxGeometry(4, 5, 5);
      var mat = lambert(colors[i]);
      var m = mesh(geo, mat);
      scene.add(place(m, -30 + i * 6, 2.5, 20));
    }
  }

  function watergateDay(scene) {
    var geo = new THREE.BoxGeometry(60, 0.3, 20);
    var mat = lambert(0xF4E0A0);
    var m = mesh(geo, mat);
    scene.add(place(m, 60, 0, 10));
  }

  function aquarium(scene) {
    var geo = new THREE.BoxGeometry(20, 15, 7);
    var mat = lambert(0x336688);
    var m = mesh(geo, mat);
    scene.add(place(m, 50, 7.5, 20));
  }

  function surfers(scene) {
    var mat = lambert(0x8B5E3C);
    var i;
    for (i = 0; i < 8; i++) {
      var geo = new THREE.SphereGeometry(0.4, 8, 8);
      var m = mesh(geo, mat);
      scene.add(place(m, -30 + i * 10, 0.3, -20));
    }
  }

  return { init: init };
})();

if (typeof module !== 'undefined') { module.exports = NewquaySurf; }
