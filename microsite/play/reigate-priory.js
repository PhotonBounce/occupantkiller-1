window.ReigatePriory = (function() {
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

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function buildPriory() {
        var bx = 13040;
        var bz = 0;
        // Main long two-storey mansion body
        makeBox(80, 14, 22, 0xc8a87a, bx, 7, bz);
        // Second storey central raised section
        makeBox(30, 5, 22, 0xbfa070, bx, 16.5, bz);
        // Roof main block
        makeBox(82, 3, 24, 0x8b5e3c, bx, 15, bz);
        // Central roof ridge
        makeCyl(1.5, 1.5, 82, 4, 0x7a4f2d, bx, 17.5, bz);

        // Central arch gateway - left pillar
        makeBox(4, 14, 5, 0xb09060, bx - 5, 7, bz - 8);
        // Central arch gateway - right pillar
        makeBox(4, 14, 5, 0xb09060, bx + 5, 7, bz - 8);
        // Arch lintel
        makeBox(14, 3, 5, 0xb09060, bx, 14.5, bz - 8);

        // East wing
        makeBox(24, 12, 18, 0xc0a070, bx + 52, 6, bz);
        makeBox(25, 2, 19, 0x8b5e3c, bx + 52, 13, bz);

        // West wing
        makeBox(24, 12, 18, 0xc0a070, bx - 52, 6, bz);
        makeBox(25, 2, 19, 0x8b5e3c, bx - 52, 13, bz);

        // Chimneys
        makeBox(3, 8, 3, 0x9a7050, bx - 20, 22, bz);
        makeBox(3, 8, 3, 0x9a7050, bx + 20, 22, bz);
        makeBox(3, 6, 3, 0x9a7050, bx - 45, 19, bz);
        makeBox(3, 6, 3, 0x9a7050, bx + 45, 19, bz);

        // Ornamental lake
        makeBox(50, 0.5, 20, 0x2255aa, bx + 10, 0.25, bz + 60);

        // Park lawn
        makeBox(160, 0.3, 140, 0x4a8a3a, bx, 0.15, bz + 70);

        // Large cedar trees around park
        buildCedar(bx - 40, bz + 40);
        buildCedar(bx + 60, bz + 40);
        buildCedar(bx - 70, bz + 80);
        buildCedar(bx + 75, bz + 80);
        buildCedar(bx - 30, bz + 110);
        buildCedar(bx + 40, bz + 110);
        buildCedar(bx - 60, bz + 130);
        buildCedar(bx + 60, bz + 130);

        // Stone boundary wall
        makeBox(160, 3, 2, 0xa09080, bx, 1.5, bz - 30);
        makeBox(2, 3, 130, 0xa09080, bx - 80, 1.5, bz + 35);
        makeBox(2, 3, 130, 0xa09080, bx + 80, 1.5, bz + 35);
    }

    function buildCedar(x, z) {
        makeCyl(0.8, 0.8, 18, 6, 0x5c3d1a, x, 9, z);
        makeCyl(8, 0.5, 22, 7, 0x1a4a1a, x, 22, z);
        makeCyl(5, 0.5, 14, 7, 0x1e5a1e, x, 30, z);
        makeCyl(3, 0.5, 10, 7, 0x226622, x, 37, z);
    }

    function buildCastle() {
        var cx = 13040 + 150;
        var cz = 80;
        // Norman motte - earthwork mound
        makeCyl(30, 40, 18, 16, 0x6b5a3a, cx, 9, cz);
        // Top of mound plateau
        makeCyl(22, 22, 3, 16, 0x7a6b45, cx, 19.5, cz);

        // Surrounding ditch ring (dark earth)
        makeCyl(50, 55, 4, 24, 0x3a2e1a, cx, 2, cz);
        // Outer earthwork bank
        makeCyl(62, 65, 5, 24, 0x5a4a2a, cx, 2.5, cz);

        // Ruined gatehouse arch - left post
        makeBox(3, 10, 4, 0x8a7a60, cx - 5, 5, cz - 28);
        // Right post
        makeBox(3, 10, 4, 0x8a7a60, cx + 5, 5, cz - 28);
        // Lintel
        makeBox(13, 2.5, 4, 0x8a7a60, cx, 11.25, cz - 28);
        // Ruined wall left fragment
        makeBox(2, 7, 4, 0x7a6a50, cx - 10, 3.5, cz - 28);
        // Ruined wall right fragment
        makeBox(2, 5, 4, 0x7a6a50, cx + 10, 2.5, cz - 28);

        // Town gardens - lawn area
        makeBox(100, 0.3, 80, 0x4a8a3a, cx, 0.15, cz + 50);

        // Garden benches
        makeBox(4, 1, 1.5, 0x8b6914, cx - 20, 0.5, cz + 30);
        makeBox(4, 1, 1.5, 0x8b6914, cx + 20, 0.5, cz + 30);

        // Garden shrubs
        makeSphere(4, 6, 5, 0x2d6b1a, cx - 35, 4, cz + 20);
        makeSphere(3, 6, 5, 0x2d6b1a, cx + 35, 3, cz + 25);
        makeSphere(4, 6, 5, 0x306a1a, cx - 35, 4, cz + 50);
        makeSphere(3, 6, 5, 0x306a1a, cx + 35, 3, cz + 50);
    }

    function buildNorthDowns() {
        var dx = 13040 - 200;
        var dz = -150;
        // Chalk escarpment main ridge body
        makeBox(300, 40, 60, 0xd4cfc0, dx, 20, dz);
        // Exposed chalk face (white)
        makeBox(300, 40, 8, 0xf5f0e8, dx, 20, dz - 26);
        // Ridge top
        makeBox(300, 6, 60, 0xc8c4b4, dx, 43, dz);

        // Beech woodland on top and behind ridge
        buildBeechWood(dx - 80, 48, dz + 20, 12);
        buildBeechWood(dx, 48, dz + 30, 10);
        buildBeechWood(dx + 80, 48, dz + 20, 11);
        buildBeechWood(dx - 120, 48, dz + 10, 9);
        buildBeechWood(dx + 120, 48, dz + 10, 10);

        // Viewpoint platform at escarpment edge
        makeBox(12, 1.5, 12, 0xb0a898, dx + 50, 44, dz - 18);
        // Viewpoint fence posts
        makeBox(1, 3, 1, 0x7a6a58, dx + 44, 46, dz - 22);
        makeBox(1, 3, 1, 0x7a6a58, dx + 56, 46, dz - 22);
        makeBox(1, 3, 1, 0x7a6a58, dx + 44, 46, dz - 14);
        makeBox(1, 3, 1, 0x7a6a58, dx + 56, 46, dz - 14);
    }

    function buildBeechWood(x, y, z, count) {
        var i;
        for (i = 0; i < count; i++) {
            var offx = (i * 13) % 40 - 20;
            var offz = Math.floor(i / 3) * 12 - 18;
            makeCyl(0.7, 1.0, 20, 5, 0x8b7355, x + offx, y + 10, z + offz);
            makeSphere(7, 7, 5, 0x2a5c14, x + offx, y + 24, z + offz);
        }
    }

    function buildReigateHill() {
        var hx = 13040 - 120;
        var hz = -250;
        // Hill terrain mound
        makeCyl(70, 90, 30, 16, 0x7a8a5a, hx, 15, hz);
        // Hill top plateau
        makeCyl(55, 55, 5, 16, 0x8a9a6a, hx, 32.5, hz);

        // Trig point pillar
        makeCyl(0.8, 1.2, 4, 4, 0xe8e0d0, hx + 5, 38, hz + 5);
        makeBox(2.5, 1, 2.5, 0xe8e0d0, hx + 5, 41, hz + 5);

        // Topograph orientation table - disc
        makeCyl(2.5, 2.5, 1.2, 12, 0xd0c8b8, hx, 36, hz);
        makeCyl(0.6, 0.6, 3, 6, 0xb0a898, hx, 33.5, hz);

        // Gliding club building
        makeBox(18, 4, 8, 0xd0c8b8, hx + 40, 34.5, hz - 10);
        makeBox(18, 1.5, 9, 0x7a6a58, hx + 40, 37, hz - 10);
        // Gliding club windsock pole
        makeCyl(0.3, 0.3, 10, 5, 0x888888, hx + 52, 40, hz - 10);
        makeCone(0.8, 3, 6, 0xff6622, hx + 52, 46, hz - 10);

        // Wooded slopes
        buildBeechWood(hx - 50, 16, hz - 30, 8);
        buildBeechWood(hx + 30, 16, hz + 30, 7);
        buildBeechWood(hx - 30, 16, hz + 40, 6);

        // Path up the hill
        makeBox(4, 0.4, 80, 0xb0a890, hx + 20, 16, hz + 40);
    }

    function buildReigateToWn() {
        var tx = 13040 + 80;
        var tz = 150;
        // Ground / town square base
        makeBox(200, 0.5, 100, 0x9a9090, tx, 0.25, tz);

        // Church with tower
        makeBox(20, 12, 14, 0xb0a898, tx - 50, 6, tz);
        makeBox(8, 22, 8, 0xb0a898, tx - 55, 11, tz - 3);
        // Church roof nave
        makeCone(12, 6, 4, 0x7a6a58, tx - 50, 18, tz);
        // Church tower battlements
        makeBox(10, 2.5, 10, 0xa09888, tx - 55, 24.5, tz - 3);
        // Weathervane
        makeCyl(0.2, 0.2, 5, 4, 0x888888, tx - 55, 28, tz - 3);

        // Bell Street shops row - terraced buildings
        makeBox(80, 10, 10, 0xc8a878, tx + 30, 5, tz - 20);
        makeBox(80, 3, 11, 0x8b5e3c, tx + 30, 11.5, tz - 20);
        // Shop front windows row
        makeBox(78, 3, 1, 0x88aacc, tx + 30, 4, tz - 25);
        // Shop doors
        makeBox(3, 5, 1, 0x6b4a2a, tx + 10, 2.5, tz - 25.5);
        makeBox(3, 5, 1, 0x6b4a2a, tx + 30, 2.5, tz - 25.5);
        makeBox(3, 5, 1, 0x6b4a2a, tx + 50, 2.5, tz - 25.5);

        // Market stalls area
        makeBox(10, 0.3, 6, 0xddcc88, tx - 10, 0.15, tz + 20);
        makeBox(10, 3, 0.4, 0xee8833, tx - 10, 1.5, tz + 17);
        makeBox(10, 0.3, 6, 0xddcc88, tx + 10, 0.15, tz + 20);
        makeBox(10, 3, 0.4, 0xee6633, tx + 10, 1.5, tz + 17);
        makeBox(10, 0.3, 6, 0xddcc88, tx + 30, 0.15, tz + 20);
        makeBox(10, 3, 0.4, 0x33aaee, tx + 30, 1.5, tz + 17);

        // Priory grounds park
        makeBox(80, 0.3, 50, 0x4a8a3a, tx - 60, 0.15, tz + 40);
        // Park trees
        buildCedar(tx - 80, tz + 40);
        buildCedar(tx - 40, tz + 55);
        makeSphere(5, 7, 5, 0x2a5c14, tx - 70, 5, tz + 30);
        makeSphere(4, 7, 5, 0x306a1a, tx - 50, 4, tz + 60);

        // Road
        makeBox(200, 0.4, 8, 0x555555, tx, 0.2, tz - 30);
    }

    function buildHolmwood() {
        var hx = 13040 + 250;
        var hz = 50;
        // Open heathland base
        makeBox(250, 0.5, 200, 0x7a9a5a, hx, 0.25, hz);

        // Gorse bushes scattered
        buildGorse(hx - 80, hz - 60);
        buildGorse(hx - 50, hz - 80);
        buildGorse(hx + 20, hz - 70);
        buildGorse(hx - 30, hz + 50);
        buildGorse(hx + 60, hz + 60);
        buildGorse(hx - 90, hz + 30);
        buildGorse(hx + 90, hz - 30);
        buildGorse(hx + 40, hz - 90);
        buildGorse(hx - 70, hz + 80);
        buildGorse(hx + 80, hz + 80);

        // Cricket ground outfield
        makeCyl(40, 40, 0.4, 24, 0x5aaa4a, hx - 30, 0.7, hz + 60);
        // Cricket pitch strip
        makeBox(5, 0.5, 22, 0xd4c896, hx - 30, 0.75, hz + 60);
        // Cricket stumps
        makeCyl(0.15, 0.15, 1.5, 4, 0xf5f0e0, hx - 30, 1.25, hz + 49);
        makeCyl(0.15, 0.15, 1.5, 4, 0xf5f0e0, hx - 30, 1.25, hz + 71);

        // Cricket pavilion
        makeBox(18, 5, 10, 0xf0ece0, hx - 30, 2.5, hz + 90);
        makeBox(20, 2, 12, 0x8b5e3c, hx - 30, 6, hz + 90);
        // Pavilion veranda posts
        makeCyl(0.4, 0.4, 5, 4, 0xe8e4d8, hx - 38, 2.5, hz + 85);
        makeCyl(0.4, 0.4, 5, 4, 0xe8e4d8, hx - 22, 2.5, hz + 85);

        // Village hall
        makeBox(20, 7, 14, 0xd0c8b0, hx + 80, 3.5, hz + 70);
        makeBox(22, 2.5, 16, 0x8b5e3c, hx + 80, 8.75, hz + 70);
        // Village hall entrance porch
        makeBox(5, 5, 4, 0xc8c0a8, hx + 80, 2.5, hz + 63);
        makeCone(3, 3, 4, 0x8b5e3c, hx + 80, 6, hz + 63);

        // Pond
        makeCyl(18, 18, 0.6, 16, 0x2255aa, hx + 30, 0.3, hz - 60);
        makeCyl(21, 21, 0.3, 16, 0x5a8a5a, hx + 30, 0.15, hz - 60);

        // Heath trees along edges
        buildBeechWood(hx + 110, 0, hz, 6);
        buildBeechWood(hx - 110, 0, hz + 20, 5);
        makeSphere(6, 7, 5, 0x2a5c14, hx + 20, 6, hz - 80);
        makeSphere(5, 7, 5, 0x306a1a, hx - 20, 5, hz - 70);
    }

    function buildGorse(x, z) {
        makeSphere(3.5, 6, 4, 0x8a7a22, x, 3.5, z);
        makeSphere(2.5, 6, 4, 0x9a8c2a, x + 3, 2.5, z + 2);
        makeSphere(2, 6, 4, 0x807020, x - 2, 2, z - 2);
    }

    function buildGround() {
        // Base terrain
        makeBox(800, 1, 700, 0x6a8a5a, 13040, 0, 0);
    }

    function build() {
        buildGround();
        buildPriory();
        buildCastle();
        buildNorthDowns();
        buildReigateHill();
        buildReigateToWn();
        buildHolmwood();
    }

    function update(delta) {
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
