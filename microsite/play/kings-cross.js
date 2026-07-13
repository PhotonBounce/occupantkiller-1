window.KingsCross = (function() {
  'use strict';

  var OX = 5080;
  var OZ = 2200;
  var objects = [];
  var scene = null;

  function makebox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function makecylinder(rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function makecone(r, h, segs, color, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(OX + x, y, OZ + z);
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function buildground() {
    makebox(200, 0.5, 200, 0x556B2F, 0, -0.25, 0);
  }

  function buildstpancras() {
    // Main hotel building
    makebox(40, 16, 12, 0x8B3A3A, 0, 8, -20);
    // Clock tower base
    makebox(6, 20, 6, 0x8B3A3A, -15, 10, -20);
    // Clock tower spire
    makecone(3, 8, 8, 0x5C2B2B, -15, 24, -20);
    // Facade arch detail left
    makebox(4, 10, 1, 0x7A3030, -14, 5, -14);
    // Facade arch detail center
    makebox(4, 10, 1, 0x7A3030, -7, 5, -14);
    // Facade arch detail right
    makebox(4, 10, 1, 0x7A3030, 0, 5, -14);
    // Facade arch detail far right
    makebox(4, 10, 1, 0x7A3030, 7, 5, -14);
    // Gothic pinnacle left
    makecone(1, 5, 6, 0x6B2828, -19, 21, -17);
    // Gothic pinnacle right
    makecone(1, 5, 6, 0x6B2828, -11, 21, -17);
    // Gothic pinnacle far right
    makecone(1, 5, 6, 0x6B2828, -3, 21, -17);
    // Gothic pinnacle east
    makecone(1, 5, 6, 0x6B2828, 5, 21, -17);
    // Pointed arch window band
    makebox(38, 3, 0.5, 0x9B4A4A, 0, 14, -14);
    // Side wing east
    makebox(10, 12, 10, 0x8B3A3A, 20, 6, -20);
    // Side wing east pinnacle
    makecone(1.5, 6, 6, 0x6B2828, 20, 15, -15);
  }

  function buildshed() {
    // Train shed wide barrel vault suggestion
    makebox(50, 10, 20, 0xC0C0C0, 5, 5, 0);
    // Shed end wall north
    makebox(50, 10, 1, 0xA8A8A8, 5, 5, -10);
    // Shed end wall south
    makebox(50, 10, 1, 0xA8A8A8, 5, 5, 10);
    // Internal column left
    makecylinder(0.5, 0.5, 10, 8, 0x909090, -15, 5, 0);
    // Internal column right
    makecylinder(0.5, 0.5, 10, 8, 0x909090, 25, 5, 0);
    // Platform surface
    makebox(48, 0.5, 18, 0x8B8682, 5, 0.25, 0);
  }

  function buildkingscross() {
    // Main body
    makebox(30, 10, 8, 0xFFF8DC, 60, 5, -20);
    // Left bay
    makebox(12, 9, 2, 0xEEE8C4, 50, 4.5, -16);
    // Right bay
    makebox(12, 9, 2, 0xEEE8C4, 70, 4.5, -16);
    // Central tower
    makebox(6, 13, 6, 0xFFF8DC, 60, 6.5, -20);
    // Clock face north
    makebox(3, 3, 0.3, 0xFFFFFF, 60, 12, -17);
    // Clock face south
    makebox(3, 3, 0.3, 0xFFFFFF, 60, 12, -23);
    // Roof parapet
    makebox(30, 1.5, 8, 0xE0D8B0, 60, 10.75, -20);
    // Side wings
    makebox(5, 8, 6, 0xFFF8DC, 44, 4, -20);
    makebox(5, 8, 6, 0xFFF8DC, 76, 4, -20);
  }

  function buildplatform9() {
    // Brick wall section
    makebox(6, 4, 1, 0x8B3A3A, 70, 2, 10);
    // Luggage trolley base
    makebox(2, 0.4, 1, 0x888888, 70, 0.4, 10);
    // Luggage trolley handle
    makebox(0.1, 1, 1, 0x888888, 71, 0.9, 10);
    // Trolley wheel left
    makecylinder(0.2, 0.2, 0.15, 8, 0x333333, 69.3, 0.25, 9.7);
    // Trolley wheel right
    makecylinder(0.2, 0.2, 0.15, 8, 0x333333, 70.7, 0.25, 9.7);
    // Sign post
    makecylinder(0.1, 0.1, 3, 6, 0xCCCCCC, 72, 1.5, 10);
    // Sign board
    makebox(2, 0.8, 0.1, 0x8B0000, 72, 3.2, 10);
    // Wall header box
    makebox(6, 0.5, 1, 0x7A3030, 70, 4.25, 10);
  }

  function buildkingscrosssquare() {
    // Paved square
    makebox(30, 0.3, 20, 0x808080, 55, 0.15, 30);
    // Fountain column
    makecylinder(0.5, 0.8, 4, 10, 0xAAAAAA, 55, 2, 30);
    // Fountain basin
    makecylinder(3, 3.2, 0.5, 16, 0x999999, 55, 0.35, 30);
    // Fountain top cap
    makecylinder(1, 0.2, 1, 8, 0xBBBBBB, 55, 4.75, 30);
    // Bench left
    makebox(3, 0.3, 0.8, 0x8B6914, 45, 0.45, 28);
    // Bench right
    makebox(3, 0.3, 0.8, 0x8B6914, 65, 0.45, 28);
    // Bench back left
    makebox(3, 1, 0.1, 0x8B6914, 45, 0.9, 28.4);
    // Bench back right
    makebox(3, 1, 0.1, 0x8B6914, 65, 0.9, 28.4);
  }

  function buildcoaldropsyard() {
    // Main industrial block north
    makebox(20, 10, 8, 0x5C3317, -40, 5, 30);
    // Main industrial block south
    makebox(20, 10, 8, 0x5C3317, -40, 5, 50);
    // Cast-iron column row north 1
    makecylinder(0.4, 0.4, 10, 8, 0x2F2F2F, -31, 5, 26);
    // Cast-iron column row north 2
    makecylinder(0.4, 0.4, 10, 8, 0x2F2F2F, -37, 5, 26);
    // Cast-iron column row north 3
    makecylinder(0.4, 0.4, 10, 8, 0x2F2F2F, -43, 5, 26);
    // Cast-iron column row north 4
    makecylinder(0.4, 0.4, 10, 8, 0x2F2F2F, -49, 5, 26);
    // Cast-iron column row south 1
    makecylinder(0.4, 0.4, 10, 8, 0x2F2F2F, -31, 5, 54);
    // Cast-iron column row south 2
    makecylinder(0.4, 0.4, 10, 8, 0x2F2F2F, -37, 5, 54);
    // Cast-iron column row south 3
    makecylinder(0.4, 0.4, 10, 8, 0x2F2F2F, -43, 5, 54);
    // Cast-iron column row south 4
    makecylinder(0.4, 0.4, 10, 8, 0x2F2F2F, -49, 5, 54);
    // New roof kissing structure north side
    makebox(22, 1, 10, 0x888888, -40, 10.5, 30);
    // New roof kissing structure south side
    makebox(22, 1, 10, 0x888888, -40, 10.5, 50);
    // Connecting arched roof center
    makebox(22, 3, 6, 0x777777, -40, 12, 40);
  }

  function buildregentscanal() {
    // Canal water strip
    makebox(120, 0.4, 8, 0x4169E1, -10, 0.2, 65);
    // Towpath north
    makebox(120, 0.3, 3, 0x9B8B6A, -10, 0.15, 58);
    // Towpath south
    makebox(120, 0.3, 3, 0x9B8B6A, -10, 0.15, 73);
    // Canal boat 1 hull
    makebox(12, 1.2, 2.5, 0x8B2222, -20, 0.8, 65);
    // Canal boat 1 cabin
    makebox(8, 1.5, 2, 0x228B22, -20, 2, 65);
    // Canal boat 2 hull
    makebox(10, 1.2, 2.5, 0x00008B, 10, 0.8, 65);
    // Canal boat 2 cabin
    makebox(6, 1.5, 2, 0xFFD700, 10, 2, 65);
    // Canal boat 3 hull
    makebox(14, 1.2, 2.5, 0x2F4F4F, 40, 0.8, 65);
    // Canal boat 3 cabin
    makebox(10, 1.5, 2, 0xB8860B, 40, 2, 65);
    // Bridge over canal
    makebox(12, 1, 10, 0x888880, 30, 1.5, 65);
    // Bridge parapet left
    makebox(12, 1.5, 0.5, 0x777770, 30, 2.75, 60.5);
    // Bridge parapet right
    makebox(12, 1.5, 0.5, 0x777770, 30, 2.75, 69.5);
  }

  function buildgasholders() {
    // Gas holder 1 frame cylinder outer
    makecylinder(8, 8, 10, 16, 0x7A7A6A, -70, 5, 30);
    // Gas holder 1 ring detail lower
    makebox(18, 0.5, 18, 0x6A6A5A, -70, 1, 30);
    // Gas holder 1 ring detail upper
    makebox(18, 0.5, 18, 0x6A6A5A, -70, 8, 30);
    // Gas holder 1 interior
    makecylinder(7, 7, 9, 12, 0xD2D2C2, -70, 5, 30);
    // Gas holder 2 frame cylinder
    makecylinder(8, 8, 10, 16, 0x7A7A6A, -55, 5, 45);
    // Gas holder 2 ring lower
    makebox(18, 0.5, 18, 0x6A6A5A, -55, 1, 45);
    // Gas holder 2 ring upper
    makebox(18, 0.5, 18, 0x6A6A5A, -55, 8, 45);
    // Gas holder 2 interior
    makecylinder(7, 7, 9, 12, 0xD2D2C2, -55, 5, 45);
    // Gas holder 3 frame cylinder
    makecylinder(8, 8, 10, 16, 0x7A7A6A, -85, 5, 45);
    // Gas holder 3 ring lower
    makebox(18, 0.5, 18, 0x6A6A5A, -85, 1, 45);
    // Gas holder 3 ring upper
    makebox(18, 0.5, 18, 0x6A6A5A, -85, 8, 45);
    // Gas holder 3 interior
    makecylinder(7, 7, 9, 12, 0xD2D2C2, -85, 5, 45);
  }

  function buildguardianhq() {
    // Main modern box building
    makebox(20, 14, 12, 0xE8E8E8, -60, 7, -10);
    // Glass facade panels lower
    makebox(18, 6, 0.3, 0xB0C8D8, -60, 4, -4);
    // Glass facade panels upper
    makebox(18, 6, 0.3, 0xA0B8C8, -60, 10, -4);
    // Building top cap
    makebox(20, 1, 12, 0xD0D0D0, -60, 14.5, -10);
    // Entrance canopy
    makebox(8, 0.4, 3, 0xC8C8C8, -60, 2.2, -4);
    // Entrance door
    makebox(3, 3, 0.2, 0x90B0C0, -60, 1.5, -4);
  }

  function buildgranarysquare() {
    // Main plaza surface
    makebox(30, 0.3, 20, 0x808080, -20, 0.15, 80);
    // Fountain jet 1
    makebox(0.3, 2, 0.3, 0x88AACC, -25, 1.3, 80);
    // Fountain jet 2
    makebox(0.3, 2.5, 0.3, 0x88AACC, -22, 1.55, 80);
    // Fountain jet 3
    makebox(0.3, 1.8, 0.3, 0x88AACC, -19, 1.2, 80);
    // Fountain jet 4
    makebox(0.3, 2.2, 0.3, 0x88AACC, -16, 1.4, 80);
    // Fountain jet 5
    makebox(0.3, 1.6, 0.3, 0x88AACC, -13, 1.1, 80);
    // Fountain basin area
    makebox(16, 0.2, 4, 0x9999BB, -19, 0.25, 80);
    // Cafe building left
    makebox(6, 3, 4, 0xCC9966, -32, 1.5, 78);
    // Cafe building right
    makebox(6, 3, 4, 0xCC9966, -8, 1.5, 78);
    // Cafe awning left
    makebox(7, 0.2, 3, 0xAA3333, -32, 3.1, 76);
    // Cafe awning right
    makebox(7, 0.2, 3, 0xAA3333, -8, 3.1, 76);
    // Barge moored 1 hull
    makebox(14, 1, 3, 0x884400, -20, 0.7, 90);
    // Barge moored 1 cabin
    makebox(9, 1.2, 2.5, 0x993300, -20, 1.9, 90);
    // Barge moored 2 hull
    makebox(12, 1, 3, 0x005588, -3, 0.7, 90);
    // Barge moored 2 cabin
    makebox(8, 1.2, 2.5, 0x0044AA, -3, 1.9, 90);
    // Mooring post 1
    makecylinder(0.2, 0.2, 2, 6, 0x444444, -27, 1, 87);
    // Mooring post 2
    makecylinder(0.2, 0.2, 2, 6, 0x444444, -13, 1, 87);
    // Mooring post 3
    makecylinder(0.2, 0.2, 2, 6, 0x444444, -9, 1, 87);
    // Mooring post 4
    makecylinder(0.2, 0.2, 2, 6, 0x444444, 4, 1, 87);
    // Lamp post 1
    makecylinder(0.1, 0.1, 5, 6, 0x333333, -30, 2.5, 74);
    // Lamp post 2
    makecylinder(0.1, 0.1, 5, 6, 0x333333, -10, 2.5, 74);
    // Lamp top 1
    makebox(0.6, 0.6, 0.6, 0xFFFF88, -30, 5.3, 74);
    // Lamp top 2
    makebox(0.6, 0.6, 0.6, 0xFFFF88, -10, 5.3, 74);
  }

  function buildroads() {
    // Main road running east-west in front of stations
    makebox(120, 0.2, 6, 0x333333, 20, 0.1, -6);
    // Road markings center line
    makebox(120, 0.21, 0.3, 0xFFFF00, 20, 0.105, -6);
    // Side road north
    makebox(6, 0.2, 40, 0x333333, 80, 0.1, 10);
    // Pavement strip front
    makebox(120, 0.25, 4, 0xBBBBBB, 20, 0.125, -10);
  }

  function buildlamps() {
    // Lamp post A
    makecylinder(0.15, 0.15, 6, 6, 0x222222, 40, 3, -9);
    makebox(0.8, 0.8, 0.8, 0xFFFF88, 40, 6.4, -9);
    // Lamp post B
    makecylinder(0.15, 0.15, 6, 6, 0x222222, 55, 3, -9);
    makebox(0.8, 0.8, 0.8, 0xFFFF88, 55, 6.4, -9);
    // Lamp post C
    makecylinder(0.15, 0.15, 6, 6, 0x222222, 70, 3, -9);
    makebox(0.8, 0.8, 0.8, 0xFFFF88, 70, 6.4, -9);
    // Lamp post D
    makecylinder(0.15, 0.15, 6, 6, 0x222222, -10, 3, -9);
    makebox(0.8, 0.8, 0.8, 0xFFFF88, -10, 6.4, -9);
  }

  function init(sceneref) {
    scene = sceneref;
    objects = [];
    buildground();
    buildstpancras();
    buildshed();
    buildkingscross();
    buildplatform9();
    buildkingscrosssquare();
    buildcoaldropsyard();
    buildregentscanal();
    buildgasholders();
    buildguardianhq();
    buildgranarysquare();
    buildroads();
    buildlamps();
  }

  function update(delta) {
    // static environment — no per-frame updates needed
  }

  function reset() {
    var i;
    for (i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
      if (objects[i].material) {
        objects[i].material.dispose();
      }
    }
    objects = [];
    scene = null;
  }

  return { init: init, update: update, reset: reset };
}());
