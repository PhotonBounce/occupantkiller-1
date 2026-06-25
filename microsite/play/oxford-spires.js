window.OxfordSpires = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function buildGround() {
        makeBox(400, 1, 400, 0x6b7a5c, 12600, -0.5, 0);
    }

    function buildRadcliffCamera() {
        var ox = 12600;
        var oz = -60;
        // Stone base platform
        makeCyl(18, 20, 4, 16, 0xc8b89a, ox, 2, oz);
        // Lower drum
        makeCyl(16, 16, 8, 16, 0xd4c4a0, ox, 8, oz);
        // Upper drum with arched window suggestion (slightly narrower)
        makeCyl(14, 14, 10, 16, 0xcbbf98, ox, 18, oz);
        // Drum cornice ring
        makeCyl(15, 15, 1.5, 16, 0xb8a880, ox, 23.5, oz);
        // Lead dome base
        makCylDome(ox, oz);
        // Lantern on top of dome
        makeCyl(3, 3, 5, 8, 0x8899aa, ox, 42, oz);
        // Lantern cap
        makeCone(3.5, 3, 8, 0x7788aa, ox, 46, oz);
        // Finial
        makeCyl(0.4, 0.4, 3, 6, 0x9988bb, ox, 49, oz);
        // Arched window pillars around drum (8 small boxes)
        var i;
        for (i = 0; i < 8; i++) {
            var ang = (i / 8) * Math.PI * 2;
            var wx = ox + Math.cos(ang) * 13.5;
            var wz = oz + Math.sin(ang) * 13.5;
            makeBox(1.5, 9, 1.5, 0xb0a07a, wx, 18, wz);
        }
        // Buttresses around base
        for (i = 0; i < 8; i++) {
            var ba = (i / 8) * Math.PI * 2;
            var bx = ox + Math.cos(ba) * 17;
            var bz = oz + Math.sin(ba) * 17;
            makeBox(2, 5, 2, 0xb8a880, bx, 3.5, bz);
        }
    }

    function makCylDome(ox, oz) {
        // Simulate dome with stacked shrinking cylinders
        makeCyl(14, 12, 4, 16, 0x9aaa99, ox, 26, oz);
        makeCyl(12, 10, 4, 16, 0x8a9a88, ox, 30, oz);
        makeCyl(10, 7, 4, 16, 0x7a8a78, ox, 34, oz);
        makeCyl(7, 4, 4, 16, 0x6a7a68, ox, 38, oz);
        makeCyl(4, 3, 2, 16, 0x5a6a58, ox, 42, oz);
    }

    function buildBodleian() {
        var ox = 12600;
        var oz = 20;
        // Old Schools Quad: four sides of gothic stone walls
        // North wing
        makeBox(60, 18, 5, 0xc0aa80, ox, 9, oz - 27.5);
        // South wing
        makeBox(60, 18, 5, 0xc0aa80, ox, 9, oz + 27.5);
        // East wing
        makeBox(5, 18, 50, 0xb8a278, ox + 27.5, 9, oz);
        // West wing
        makeBox(5, 18, 50, 0xb8a278, ox - 27.5, 9, oz);

        // Tower of the Five Orders (central tower, east side)
        makeBox(10, 40, 10, 0xc8b48a, ox + 27.5, 20, oz);
        // Tower top: four pinnacles
        makeCone(1.5, 6, 4, 0xb0a070, ox + 24, 42, oz - 3);
        makeCone(1.5, 6, 4, 0xb0a070, ox + 31, 42, oz - 3);
        makeCone(1.5, 6, 4, 0xb0a070, ox + 24, 42, oz + 3);
        makeCone(1.5, 6, 4, 0xb0a070, ox + 31, 42, oz + 3);
        // Tower battlements
        makeBox(12, 3, 12, 0xb8a880, ox + 27.5, 41.5, oz);

        // Corner towers on quad
        makeBox(6, 22, 6, 0xb8a880, ox - 27.5, 11, oz - 27.5);
        makeBox(6, 22, 6, 0xb8a880, ox + 27.5, 11, oz - 27.5);
        makeBox(6, 22, 6, 0xb8a880, ox - 27.5, 11, oz + 27.5);

        // Cobbled quad floor
        makeBox(50, 0.5, 50, 0x888070, ox, 0.25, oz);

        // Buttresses on outer walls
        var j;
        for (j = 0; j < 4; j++) {
            makeBox(3, 18, 4, 0xa89870, ox - 20 + j * 13, 9, oz - 30);
            makeBox(3, 18, 4, 0xa89870, ox - 20 + j * 13, 9, oz + 30);
        }

        // Crenellations on north and south wings
        for (j = 0; j < 8; j++) {
            makeBox(3, 3, 2, 0xb8a880, ox - 26 + j * 7.5, 19.5, oz - 27.5);
            makeBox(3, 3, 2, 0xb8a880, ox - 26 + j * 7.5, 19.5, oz + 27.5);
        }
    }

    function buildSheldonianTheatre() {
        var ox = 12600 - 30;
        var oz = -30;
        // Main semicircular stone building (approximate with box + cylinder half)
        makeBox(34, 14, 28, 0xd0c090, ox, 7, oz);
        // The curved rear (south) approximated with cylinder segment
        makeCyl(17, 17, 14, 8, 0xc8b888, ox, 7, oz + 10);
        // Roof / cupola
        makeCyl(8, 10, 4, 12, 0xb0a870, ox, 15.5, oz);
        makeSphere(8, 12, 8, 0x9a9a80, ox, 19, oz);
        // Lantern tower on cupola
        makeCyl(3, 3, 6, 8, 0xaaa890, ox, 25, oz);
        makeCone(3.5, 4, 8, 0x9a9870, ox, 30, oz);
        // Stone emperor busts on railings (8 sphere heads on box posts)
        var k;
        for (k = 0; k < 8; k++) {
            var ba2 = (k / 8) * Math.PI;
            var bx2 = ox + Math.cos(ba2) * 16;
            var bz2 = oz - 8 + Math.sin(ba2) * 8;
            makeCyl(0.4, 0.4, 4, 6, 0xb8a878, bx2, 16, bz2);
            makeSphere(1, 6, 6, 0xc8b888, bx2, 19, bz2);
        }
        // Entrance portico pillars
        makeBox(2, 12, 2, 0xd0c090, ox - 8, 6, oz - 14);
        makeBox(2, 12, 2, 0xd0c090, ox - 3, 6, oz - 14);
        makeBox(2, 12, 2, 0xd0c090, ox + 3, 6, oz - 14);
        makeBox(2, 12, 2, 0xd0c090, ox + 8, 6, oz - 14);
        // Portico roof
        makeBox(22, 2, 4, 0xc8b880, ox, 12.5, oz - 14);
        // Steps
        makeBox(22, 1.5, 3, 0xd0c8a0, ox, 0.75, oz - 16);
    }

    function buildCarfaxTower() {
        var ox = 12600 + 40;
        var oz = 30;
        // Main medieval stone tower
        makeBox(10, 35, 10, 0xb8a870, ox, 17.5, oz);
        // Clock face boxes (four sides)
        makeBox(8, 4, 0.5, 0xe0d8c0, ox, 24, oz - 5.1);
        makeBox(8, 4, 0.5, 0xe0d8c0, ox, 24, oz + 5.1);
        makeBox(0.5, 4, 8, 0xe0d8c0, ox - 5.1, 24, oz);
        makeBox(0.5, 4, 8, 0xe0d8c0, ox + 5.1, 24, oz);
        // Parapet / battlements
        makeBox(12, 4, 12, 0xb0a060, ox, 36.5, oz);
        // Four corner pinnacles
        makeCone(1.5, 6, 4, 0xa09050, ox - 5, 42, oz - 5);
        makeCone(1.5, 6, 4, 0xa09050, ox + 5, 42, oz - 5);
        makeCone(1.5, 6, 4, 0xa09050, ox - 5, 42, oz + 5);
        makeCone(1.5, 6, 4, 0xa09050, ox + 5, 42, oz + 5);
        // Crossroads streets (flat boxes)
        makeBox(120, 0.2, 10, 0x555555, ox, 0.1, oz);
        makeBox(10, 0.2, 120, 0x555555, ox, 0.1, oz);
        // Bell / quarter-boys suggestion on clock
        makeSphere(1.2, 6, 6, 0xd4a020, ox - 3, 30, oz - 5.5);
        makeSphere(1.2, 6, 6, 0xd4a020, ox + 3, 30, oz - 5.5);
    }

    function buildChristChurch() {
        var ox = 12600 - 50;
        var oz = 60;
        // Tom Tower base: large gateway structure
        makeBox(20, 20, 10, 0xc8b480, ox, 10, oz);
        // Tom Tower octagonal mid-section
        makeCyl(8, 9, 15, 8, 0xc0ac78, ox, 28, oz);
        // Wren's octagonal lantern top
        makeCyl(6, 7, 10, 8, 0xb8a070, ox, 40, oz);
        // Onion dome / baroque cap on lantern
        makeSphere(6, 10, 8, 0x9a9870, ox, 48, oz);
        makeCone(2, 4, 8, 0x8a8860, ox, 53, oz);
        // Gateway arch suggestion
        makeBox(8, 10, 1, 0x604000, ox, 5, oz - 5.1);
        // Meadow building (great hall)
        makeBox(40, 14, 25, 0xc0aa78, ox - 30, 7, oz + 30);
        // Great hall roof
        makeBox(42, 4, 27, 0xa09060, ox - 30, 15, oz + 30);
        // Hall battlements
        var m;
        for (m = 0; m < 6; m++) {
            makeBox(4, 3, 2, 0xb0a060, ox - 48 + m * 10, 18.5, oz + 17);
            makeBox(4, 3, 2, 0xb0a060, ox - 48 + m * 10, 18.5, oz + 43);
        }
        // Cloister pillars around inner quad
        for (m = 0; m < 5; m++) {
            makeBox(1.5, 10, 1.5, 0xc0b080, ox - 50 + m * 10, 5, oz + 12);
            makeBox(1.5, 10, 1.5, 0xc0b080, ox - 50 + m * 10, 5, oz + 48);
            makeBox(1.5, 10, 1.5, 0xc0b080, ox - 10, 5, oz + 15 + m * 7);
        }
        // Meadow flat grass
        makeBox(80, 0.3, 60, 0x559944, ox - 20, 0.15, oz + 70);
    }

    function buildCherwell() {
        var ox = 12600 + 60;
        var oz = 80;
        // River channel
        makeBox(200, 0.5, 18, 0x3366aa, ox, 0.25, oz);
        // Magdalen Bridge
        makeBox(22, 3, 18, 0xc8b880, ox, 2.5, oz);
        // Bridge parapet walls
        makeBox(22, 2, 1.5, 0xb8a870, ox, 4.5, oz - 8.25);
        makeBox(22, 2, 1.5, 0xb8a870, ox, 4.5, oz + 8.25);
        // Bridge arch piers
        makeBox(4, 5, 16, 0xb0a060, ox - 6, 2.5, oz);
        makeBox(4, 5, 16, 0xb0a060, ox + 6, 2.5, oz);

        // Punt 1
        buildPunt(12600 + 80, 0.5, oz - 3, 0);
        // Punt 2
        buildPunt(12600 + 95, 0.5, oz + 3, 0.3);
        // Punt 3
        buildPunt(12600 + 50, 0.5, oz - 2, -0.2);

        // Weeping willows along bank
        buildWillow(ox - 40, oz - 15);
        buildWillow(ox + 30, oz - 15);
        buildWillow(ox + 80, oz + 14);
        buildWillow(ox - 70, oz + 14);
    }

    function buildPunt(px, py, pz, rotY) {
        var geo = new THREE.BoxGeometry(7, 0.6, 2.5);
        var mat = makeMat(0x8b5a2b);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(px, py, pz);
        mesh.rotation.y = rotY;
        scene.add(mesh);
        objects.push(mesh);
        // Punt prow (tapered look using two small wedge boxes)
        makeBox(1.5, 0.5, 2, 0x7a4a1b, px + 4 * Math.cos(rotY), py, pz + 4 * Math.sin(rotY));
        // Pole
        makeCyl(0.15, 0.15, 6, 5, 0x5a3010, px, py + 3, pz);
        // Punter suggestion
        makeCyl(0.5, 0.5, 2.5, 6, 0x3344aa, px, py + 1.55, pz);
        makeSphere(0.7, 6, 6, 0xffcc99, px, py + 3.2, pz);
    }

    function buildWillow(wx, wz) {
        // Trunk
        makeCyl(0.5, 0.8, 10, 6, 0x5a3a10, wx, 5, wz);
        // Drooping canopy spheres
        makeSphere(5, 8, 6, 0x336622, wx, 12, wz);
        makeSphere(3, 6, 5, 0x2d5a1e, wx - 3, 9, wz - 2);
        makeSphere(3, 6, 5, 0x2d5a1e, wx + 2, 8, wz + 2);
        makeSphere(3, 6, 5, 0x2d5a1e, wx, 8, wz - 3);
        // Hanging branch suggestions (thin vertical boxes)
        makeBox(0.2, 4, 0.2, 0x224411, wx - 4, 8, wz - 1);
        makeBox(0.2, 4, 0.2, 0x224411, wx + 3, 7.5, wz + 1);
        makeBox(0.2, 3.5, 0.2, 0x224411, wx - 1, 7, wz + 3);
    }

    function buildStreetLamps() {
        var positions = [
            [12600 + 35, 70], [12600 - 15, 70],
            [12600 + 35, -70], [12600 - 15, -70],
            [12600 + 65, 15], [12600 + 65, 45],
            [12600 - 55, 15], [12600 - 55, -15]
        ];
        var p;
        for (p = 0; p < positions.length; p++) {
            makeCyl(0.2, 0.2, 8, 6, 0x444444, positions[p][0], 4, positions[p][1]);
            makeSphere(0.6, 6, 6, 0xffffcc, positions[p][0], 8.5, positions[p][1]);
        }
    }

    function buildSurroundingBuildings() {
        var ox = 12600;
        // Generic college/city buildings filling in the area
        var bldgs = [
            [ox - 80, 0x888,   12,  8, 0xc8b888],
            [ox + 80, -20, 15, 10, 0xbba880],
            [ox - 70, -50,  10, 12, 0xc0b090],
            [ox + 70, 50,   14, 10, 0xb8a878],
            [ox - 90, 30,   18, 10, 0xc0b888],
            [ox + 90, -40,  12,  8, 0xb0a060]
        ];
        var b;
        for (b = 0; b < bldgs.length; b++) {
            var bd = bldgs[b];
            makeBox(bd[2], bd[3], bd[2], bd[4], bd[0], bd[3] / 2, bd[1]);
        }
    }

    function build() {
        buildGround();
        buildRadcliffCamera();
        buildBodleian();
        buildSheldonianTheatre();
        buildCarfaxTower();
        buildChristChurch();
        buildCherwell();
        buildStreetLamps();
        buildSurroundingBuildings();
    }

    function update(delta) {
        // Static environment — no per-frame updates needed
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
