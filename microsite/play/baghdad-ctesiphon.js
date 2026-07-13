window.BaghdadCtesiphon = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 24040;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function makeMesh(geo, color, x, y, z, rx, ry, rz, sx, sy, sz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x || 0, y || 0, z || 0);
        if (rx || ry || rz) mesh.rotation.set(rx || 0, ry || 0, rz || 0);
        if (sx || sy || sz) mesh.scale.set(sx || 1, sy || 1, sz || 1);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z, rx, ry, rz) {
        return makeMesh(new THREE.BoxGeometry(w, h, d), color, x, y, z, rx, ry, rz);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z, rx, ry, rz) {
        return makeMesh(new THREE.CylinderGeometry(rt, rb, h, segs), color, x, y, z, rx, ry, rz);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        return makeMesh(new THREE.SphereGeometry(r, ws, hs), color, x, y, z);
    }

    function makeCone(r, h, segs, color, x, y, z, rx, ry, rz) {
        return makeMesh(new THREE.ConeGeometry(r, h, segs), color, x, y, z, rx, ry, rz);
    }

    function buildCtesiphon() {
        var cx = BASE_X + 0;
        var cz = BASE_Z + 0;
        var archColor = 0xD4A870;
        var ruinColor = 0xBF8F5A;

        // Left wing wall
        makeBox(18, 28, 6, archColor, cx - 20, 14, cz);
        // Right wing wall
        makeBox(18, 28, 6, archColor, cx + 20, 14, cz);
        // Left inner wall section
        makeBox(6, 35, 5, archColor, cx - 10, 17.5, cz);
        // Right inner wall section
        makeBox(6, 35, 5, archColor, cx + 10, 17.5, cz);

        // Arch voussoirs (approximated as stacked cylinders leaning inward)
        // Left arch leg bottom
        makeBox(8, 8, 5, archColor, cx - 7, 35, cz);
        // Right arch leg bottom
        makeBox(8, 8, 5, archColor, cx + 7, 35, cz);
        // Left arch leg mid
        makeBox(6, 8, 5, archColor, cx - 5, 43, cz, 0.18, 0, 0);
        // Right arch leg mid
        makeBox(6, 8, 5, archColor, cx + 5, 43, cz, -0.18, 0, 0);
        // Arch crown keystone
        makeBox(10, 6, 5, archColor, cx, 50, cz);

        // Crumbling upper brickwork — left
        makeBox(4, 5, 4, ruinColor, cx - 13, 30, cz, 0, 0, 0.15);
        makeBox(3, 4, 3, ruinColor, cx - 16, 32, cz, 0, 0, 0.25);
        // Crumbling upper brickwork — right
        makeBox(4, 5, 4, ruinColor, cx + 13, 30, cz, 0, 0, -0.15);
        makeBox(3, 4, 3, ruinColor, cx + 16, 32, cz, 0, 0, -0.25);

        // Ground rubble blocks
        makeBox(3, 2, 3, ruinColor, cx - 25, 1, cz + 5);
        makeBox(2, 1.5, 2, ruinColor, cx - 28, 0.75, cz - 4);
        makeBox(4, 2, 2, ruinColor, cx + 24, 1, cz + 6, 0, 0.3, 0);
        makeBox(2, 1, 3, ruinColor, cx + 28, 0.5, cz - 3, 0, 0.6, 0);

        // Rear facade wall
        makeBox(50, 20, 4, archColor, cx, 10, cz + 12);
        // Rear upper section
        makeBox(30, 10, 4, ruinColor, cx, 25, cz + 12);
    }

    function buildAlMustansiriya() {
        var mx = BASE_X + 120;
        var mz = BASE_Z + 30;
        var brickColor = 0xC8A858;
        var darkBrick = 0xA88A3C;

        // Outer perimeter walls
        makeBox(50, 12, 3, brickColor, mx, 6, mz - 24);
        makeBox(50, 12, 3, brickColor, mx, 6, mz + 24);
        makeBox(3, 12, 48, brickColor, mx - 24, 6, mz);
        makeBox(3, 12, 48, brickColor, mx + 24, 6, mz);

        // Corner towers
        makeBox(5, 14, 5, darkBrick, mx - 24, 7, mz - 24);
        makeBox(5, 14, 5, darkBrick, mx + 24, 7, mz - 24);
        makeBox(5, 14, 5, darkBrick, mx - 24, 7, mz + 24);
        makeBox(5, 14, 5, darkBrick, mx + 24, 7, mz + 24);

        // North iwan (vaulted hall)
        makeBox(16, 14, 3, brickColor, mx, 7, mz - 18);
        makeBox(16, 4, 3, brickColor, mx, 16, mz - 18);
        makeCyl(5, 5, 3, 6, darkBrick, mx, 14, mz - 18, Math.PI / 2, 0, 0);

        // South iwan
        makeBox(16, 14, 3, brickColor, mx, 7, mz + 18);
        makeBox(16, 4, 3, brickColor, mx, 16, mz + 18);
        makeCyl(5, 5, 3, 6, darkBrick, mx, 14, mz + 18, Math.PI / 2, 0, 0);

        // East iwan
        makeBox(3, 14, 16, brickColor, mx + 18, 7, mz);
        makeCyl(5, 5, 3, 6, darkBrick, mx + 18, 14, mz, Math.PI / 2, Math.PI / 2, 0);

        // West iwan
        makeBox(3, 14, 16, brickColor, mx - 18, 7, mz);
        makeCyl(5, 5, 3, 6, darkBrick, mx - 18, 14, mz, Math.PI / 2, Math.PI / 2, 0);

        // Central courtyard pool
        makeCyl(4, 4, 0.5, 8, 0x2A5A7A, mx, 0.25, mz);

        // Decorative merlon battlements along top of walls
        for (var mi = 0; mi < 5; mi++) {
            makeBox(2, 2, 2, brickColor, mx - 16 + mi * 8, 13, mz - 24);
            makeBox(2, 2, 2, brickColor, mx - 16 + mi * 8, 13, mz + 24);
        }
    }

    function buildTigrisRiver() {
        var rx = BASE_X + 260;
        var rz = BASE_Z + 0;
        var waterColor = 0x2A5A7A;
        var bankColor = 0x8B7355;
        var greenColor = 0x4A7A2A;
        var concreteColor = 0x888888;

        // Main river channel — wide flat box
        makeBox(80, 1, 400, waterColor, rx, -0.5, rz);

        // West bank
        makeBox(30, 3, 400, bankColor, rx - 55, 1, rz);
        // East bank
        makeBox(30, 3, 400, bankColor, rx + 55, 1, rz);

        // Green island mid-river north
        makeBox(12, 1.5, 28, greenColor, rx - 5, 0.75, rz - 80);
        makeCyl(1, 1, 4, 6, 0x2A6010, rx - 3, 2.5, rz - 78);
        makeCone(2, 3, 6, 0x2A8010, rx - 3, 5.5, rz - 78);
        makeCyl(1, 1, 4, 6, 0x2A6010, rx + 3, 2.5, rz - 85);
        makeCone(2, 3, 6, 0x2A8010, rx + 3, 5.5, rz - 85);

        // Green island mid-river south
        makeBox(10, 1.5, 20, greenColor, rx + 6, 0.75, rz + 70);

        // Bridge 1 — north
        makeBox(80, 3, 6, concreteColor, rx, 2, rz - 60);
        // Bridge 1 support pylons
        makeCyl(1.5, 2, 6, 6, concreteColor, rx - 15, -2, rz - 60);
        makeCyl(1.5, 2, 6, 6, concreteColor, rx + 15, -2, rz - 60);

        // Bridge 2 — south
        makeBox(80, 3, 6, concreteColor, rx, 2, rz + 60);
        makeCyl(1.5, 2, 6, 6, concreteColor, rx - 15, -2, rz + 60);
        makeCyl(1.5, 2, 6, 6, concreteColor, rx + 15, -2, rz + 60);

        // Riverside promenade — west bank
        makeBox(8, 1, 200, 0xC8C0B0, rx - 45, 1.5, rz);
        // Riverside promenade palm trees
        makeCyl(0.5, 0.7, 6, 6, 0x8B5E3C, rx - 44, 4, rz - 30);
        makeCone(3, 4, 6, 0x3A7A1A, rx - 44, 9, rz - 30);
        makeCyl(0.5, 0.7, 6, 6, 0x8B5E3C, rx - 44, 4, rz);
        makeCone(3, 4, 6, 0x3A7A1A, rx - 44, 9, rz);
        makeCyl(0.5, 0.7, 6, 6, 0x8B5E3C, rx - 44, 4, rz + 30);
        makeCone(3, 4, 6, 0x3A7A1A, rx - 44, 9, rz + 30);
    }

    function buildUnknownSoldierMonument() {
        var ux = BASE_X + 200;
        var uz = BASE_Z - 80;
        var concreteColor = 0x888899;

        // Tilted disc — main flying saucer shape
        makeCyl(15, 15, 2, 16, concreteColor, ux, 12, uz, 0.45, 0, 0);
        // Underside support
        makeCyl(4, 4, 12, 8, concreteColor, ux, 6, uz);
        // Tomb base below
        makeBox(20, 3, 20, concreteColor, ux, 1.5, uz);
        // Tomb chamber
        makeBox(8, 2, 8, 0x666677, ux, 3.5, uz);
        // Outer plaza
        makeBox(40, 0.5, 40, 0xB0A898, ux, 0, uz);
        // Flag pole
        makeCyl(0.3, 0.3, 20, 6, 0x666666, ux + 18, 10, uz);
    }

    function buildAbbasidPalace() {
        var ax = BASE_X - 60;
        var az = BASE_Z + 100;
        var palColor = 0xD4A870;
        var archColor = 0xBF8F50;

        // Main facade
        makeBox(40, 20, 5, palColor, ax, 10, az);
        // Upper tier
        makeBox(30, 12, 4, palColor, ax, 26, az);

        // Pointed arch doorway left
        makeBox(6, 14, 3, archColor, ax - 10, 7, az + 2);
        makeCone(3.5, 5, 4, archColor, ax - 10, 16.5, az + 2);

        // Pointed arch doorway right
        makeBox(6, 14, 3, archColor, ax + 10, 7, az + 2);
        makeCone(3.5, 5, 4, archColor, ax + 10, 16.5, az + 2);

        // Central muqarnas niche
        makeCyl(4, 6, 8, 8, palColor, ax, 12, az + 2.5);
        makeSphere(4, 8, 8, archColor, ax, 17, az + 2.5);

        // Side wings
        makeBox(12, 14, 5, palColor, ax - 26, 7, az);
        makeBox(12, 14, 5, palColor, ax + 26, 7, az);

        // Stucco decoration panels
        makeBox(8, 6, 1, 0xE0C898, ax - 10, 22, az - 1.5);
        makeBox(8, 6, 1, 0xE0C898, ax + 10, 22, az - 1.5);
        makeBox(10, 5, 1, 0xE0C898, ax, 22, az - 1.5);

        // Corner minarets
        makeCyl(1.5, 2, 20, 8, palColor, ax - 22, 10, az);
        makeCone(1.5, 4, 8, archColor, ax - 22, 22, az);
        makeCyl(1.5, 2, 20, 8, palColor, ax + 22, 10, az);
        makeCone(1.5, 4, 8, archColor, ax + 22, 22, az);

        // Rear courtyard wall
        makeBox(40, 8, 3, palColor, ax, 4, az - 16);
    }

    function buildIraqiMuseum() {
        var imx = BASE_X + 50;
        var imz = BASE_Z - 120;
        var museumColor = 0xD4C8B0;
        var accentColor = 0xC4A870;

        // Main building block
        makeBox(50, 14, 30, museumColor, imx, 7, imz);
        // Entrance portico
        makeBox(20, 12, 8, museumColor, imx, 6, imz - 18);
        // Portico columns
        makeCyl(1, 1, 10, 8, accentColor, imx - 7, 5, imz - 21);
        makeCyl(1, 1, 10, 8, accentColor, imx, 5, imz - 21);
        makeCyl(1, 1, 10, 8, accentColor, imx + 7, 5, imz - 21);
        // Portico pediment
        makeBox(22, 3, 4, accentColor, imx, 13, imz - 20);

        // Assyrian bull statues (simplified as box + sphere)
        makeBox(3, 5, 6, 0xD4B878, imx - 12, 2.5, imz - 22);
        makeSphere(2.5, 8, 8, 0xD4B878, imx - 12, 7, imz - 22);
        makeBox(3, 5, 6, 0xD4B878, imx + 12, 2.5, imz - 22);
        makeSphere(2.5, 8, 8, 0xD4B878, imx + 12, 7, imz - 22);

        // Museum roof parapet
        makeBox(52, 2, 32, accentColor, imx, 14.5, imz);

        // Ziggurat stepped display outside
        makeBox(10, 2, 10, 0xC8A870, imx + 28, 1, imz);
        makeBox(7, 2, 7, 0xB89860, imx + 28, 3, imz);
        makeBox(4, 2, 4, 0xA88850, imx + 28, 5, imz);

        // Signage block
        makeBox(16, 3, 1, 0xE8D0A0, imx, 16, imz - 14);
    }

    function buildCrossedSwords() {
        var sx = BASE_X + 170;
        var sz = BASE_Z - 40;
        var swordColor = 0x888888;
        var bronzeColor = 0x8B7340;

        // Left arm — forearm angled holding sword
        makeBox(3, 3, 30, bronzeColor, sx - 18, 20, sz, -0.5, 0, -0.4);
        // Left sword blade
        makeBox(1.5, 1.5, 45, swordColor, sx - 6, 35, sz - 5, -0.6, 0, -0.3);

        // Right arm
        makeBox(3, 3, 30, bronzeColor, sx + 18, 20, sz, -0.5, 0, 0.4);
        // Right sword blade
        makeBox(1.5, 1.5, 45, swordColor, sx + 6, 35, sz - 5, -0.6, 0, 0.3);

        // Crossed point in sky
        makeSphere(2, 6, 6, swordColor, sx, 45, sz - 15);

        // Left base pedestal
        makeBox(6, 3, 6, 0x666666, sx - 20, 1.5, sz);
        // Right base pedestal
        makeBox(6, 3, 6, 0x666666, sx + 20, 1.5, sz);

        // Helmets at base (cones)
        makeCone(3, 4, 8, bronzeColor, sx - 20, 5, sz);
        makeCone(3, 4, 8, bronzeColor, sx + 20, 5, sz);

        // Scattered helmet pile (smaller spheres)
        makeSphere(1.5, 6, 6, 0x666666, sx - 22, 1.5, sz + 4);
        makeSphere(1.2, 6, 6, 0x666666, sx + 22, 1.5, sz - 3);
        makeSphere(1.0, 6, 6, 0x666666, sx - 18, 1.5, sz - 5);

        // Parade road markers
        makeBox(60, 1, 8, 0xAAAAAA, sx, 0.5, sz + 20);
    }

    function buildAlShaheedMonument() {
        var shx = BASE_X + 230;
        var shz = BASE_Z + 100;
        var domeColor = 0x4466AA;
        var turquoise = 0x48A8A0;
        var concreteBase = 0x999999;

        // Base platform
        makeBox(40, 3, 40, concreteBase, shx, 1.5, shz);
        // Circular reflecting pool
        makeCyl(12, 12, 1, 16, 0x2A5A7A, shx, 3.5, shz);

        // Left dome half
        makeCyl(10, 0, 18, 12, turquoise, shx - 6, 12, shz, 0, 0, 0.4);
        // Right dome half
        makeCyl(10, 0, 18, 12, turquoise, shx + 6, 12, shz, 0, 0, -0.4);

        // Gap between dome halves — eternal flame pedestal
        makeCyl(1, 1, 6, 8, 0xDDDDDD, shx, 6, shz);
        // Flame (cone)
        makeCone(1.5, 4, 8, 0xFF6600, shx, 11, shz);

        // Outer ring of pillars
        makeCyl(0.8, 0.8, 8, 6, concreteBase, shx - 16, 4, shz - 16);
        makeCyl(0.8, 0.8, 8, 6, concreteBase, shx + 16, 4, shz - 16);
        makeCyl(0.8, 0.8, 8, 6, concreteBase, shx - 16, 4, shz + 16);
        makeCyl(0.8, 0.8, 8, 6, concreteBase, shx + 16, 4, shz + 16);

        // Steps up to platform
        makeBox(16, 1, 4, concreteBase, shx, 0.5, shz - 22);
        makeBox(14, 1, 4, concreteBase, shx, 1.5, shz - 18);
    }

    function buildRashidStreet() {
        var rsx = BASE_X - 120;
        var rsz = BASE_Z + 0;
        var streetColor = 0xC8C0B0;
        var buildingColor = 0xC4B090;
        var mosqueColor = 0xC8A858;

        // Street surface
        makeBox(12, 0.5, 200, streetColor, rsx, 0, rsz);

        // Ottoman-era hotel — left side
        makeBox(20, 18, 8, buildingColor, rsx - 20, 9, rsz - 40);
        makeBox(20, 3, 8, 0xB09070, rsx - 20, 19.5, rsz - 40);
        // Balconies
        makeBox(18, 1, 2, buildingColor, rsx - 20, 9, rsz - 35);
        makeBox(18, 1, 2, buildingColor, rsx - 20, 14, rsz - 35);

        // Old merchant house — right side
        makeBox(18, 15, 8, buildingColor, rsx + 20, 7.5, rsz + 20);
        // Mashrabiya screen (wooden lattice, approximated)
        makeBox(6, 5, 1, 0xAA8844, rsx + 20, 11, rsz + 16);

        // Small mosque along street
        makeBox(16, 12, 14, mosqueColor, rsx - 20, 6, rsz + 50);
        makeCyl(2, 2, 16, 8, mosqueColor, rsx - 26, 8, rsz + 50);
        makeCone(1.5, 4, 8, 0xB89030, rsx - 26, 18, rsz + 50);
        makeSphere(5, 10, 10, mosqueColor, rsx - 20, 14, rsz + 50);

        // Street lamp posts
        makeCyl(0.3, 0.3, 7, 6, 0x444444, rsx, 3.5, rsz - 60);
        makeSphere(0.8, 6, 6, 0xFFEE88, rsx, 7.5, rsz - 60);
        makeCyl(0.3, 0.3, 7, 6, 0x444444, rsx, 3.5, rsz + 60);
        makeSphere(0.8, 6, 6, 0xFFEE88, rsx, 7.5, rsz + 60);
    }

    function buildGreenZone() {
        var gx = BASE_X + 320;
        var gz = BASE_Z - 60;
        var wallColor = 0x888888;
        var greenColor = 0x3D7A32;
        var barrierColor = 0x777777;

        // T-wall concrete blast barriers — perimeter
        makeBox(3, 5, 80, wallColor, gx - 30, 2.5, gz);
        makeBox(3, 5, 80, wallColor, gx + 30, 2.5, gz);
        makeBox(60, 5, 3, wallColor, gx, 2.5, gz - 40);
        makeBox(60, 5, 3, wallColor, gx, 2.5, gz + 40);

        // Inner compound buildings
        makeBox(20, 8, 16, 0xC8C0A8, gx - 10, 4, gz - 15);
        makeBox(16, 6, 14, 0xD0C8B0, gx + 12, 3, gz + 10);

        // Checkpoint guardhouse north gate
        makeBox(4, 4, 4, 0x888888, gx, 2, gz - 38);
        // Checkpoint boom gate
        makeBox(10, 0.5, 0.5, 0xCC0000, gx + 5, 4, gz - 38);

        // Concertina wire approximated as small boxes along top of walls
        makeBox(60, 1, 1, 0xAAAAAA, gx, 5.5, gz - 40);
        makeBox(60, 1, 1, 0xAAAAAA, gx, 5.5, gz + 40);

        // Green lawn area inside
        makeBox(40, 0.5, 50, greenColor, gx, 0, gz);

        // Flag pole
        makeCyl(0.3, 0.3, 16, 6, 0xAAAAAA, gx + 5, 8, gz - 20);

        // Jersey barriers at gate
        makeBox(2, 2, 6, barrierColor, gx - 8, 1, gz - 35);
        makeBox(2, 2, 6, barrierColor, gx + 8, 1, gz - 35);

        // Helicopter pad circle
        makeCyl(6, 6, 0.3, 12, 0x555555, gx + 15, 0.15, gz - 10);
    }

    function buildGroundPlane() {
        // Large ground terrain around area
        makeBox(600, 1, 600, 0xB8A878, BASE_X, -0.5, BASE_Z);
        // Desert patches
        makeBox(80, 0.6, 60, 0xC8B888, BASE_X - 200, -0.2, BASE_Z + 150);
        makeBox(60, 0.6, 80, 0xD0C090, BASE_X + 150, -0.2, BASE_Z - 150);
    }

    function build() {
        buildGroundPlane();
        buildCtesiphon();
        buildAlMustansiriya();
        buildTigrisRiver();
        buildUnknownSoldierMonument();
        buildAbbasidPalace();
        buildIraqiMuseum();
        buildCrossedSwords();
        buildAlShaheedMonument();
        buildRashidStreet();
        buildGreenZone();
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
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
