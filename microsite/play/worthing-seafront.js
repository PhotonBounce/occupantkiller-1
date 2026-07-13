window.WorthingSeafront = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 13200;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addObject(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObject(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObject(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObject(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObject(mesh);
    }

    function makeLineBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var line = new THREE.LineSegments(edges, mat);
        line.position.set(x, y, z);
        return addObject(line);
    }

    function buildBeach() {
        // Shingle beach — dark grey
        makeBox(1200, 2, 300, 0x888880, X_OFFSET, 0, 150);
        // Seafront promenade road
        makeBox(1200, 2, 20, 0x555555, X_OFFSET, 1, -20);
        // Sea (blue plane)
        makeBox(2000, 1, 600, 0x1a5276, X_OFFSET, -1, 600);
    }

    function buildBeachHuts() {
        var colors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xe67e22, 0xc0392b];
        var startX = X_OFFSET - 300;
        for (var i = 0; i < 16; i++) {
            var cx = startX + i * 40;
            var col = colors[i % colors.length];
            // Hut body
            makeBox(14, 20, 14, col, cx, 11, 60);
            // Hut roof
            makeCone(11, 10, 4, 0xffffff, cx, 25, 60);
            // Hut door
            makeBox(5, 10, 1, 0x4a2c17, cx, 6, 53);
        }
    }

    function buildGroynes() {
        var startX = X_OFFSET - 400;
        for (var g = 0; g < 10; g++) {
            var gx = startX + g * 100;
            // Groyne — row of posts into sea
            for (var p = 0; p < 12; p++) {
                makeCylinder(1.5, 1.5, 18, 6, 0x4a2c17, gx, 9, 80 + p * 40);
            }
        }
    }

    function buildPier() {
        var px = X_OFFSET + 100;
        var pz = 0;

        // Pier deck — long narrow walkway
        makeBox(30, 3, 600, 0x8B6914, px, 3, pz + 300);

        // Pier support legs
        for (var leg = 0; leg < 20; leg++) {
            var lz = pz + leg * 30;
            makeCylinder(1.5, 1.5, 12, 6, 0x666655, px - 12, 6, lz);
            makeCylinder(1.5, 1.5, 12, 6, 0x666655, px + 12, 6, lz);
        }

        // Pier entrance tollbooths
        makeBox(8, 18, 8, 0xd4c5a9, px - 20, 9, pz + 10);
        makeBox(8, 18, 8, 0xd4c5a9, px + 20, 9, pz + 10);
        makeCone(6, 8, 4, 0x8B3A3A, px - 20, 22, pz + 10);
        makeCone(6, 8, 4, 0x8B3A3A, px + 20, 22, pz + 10);

        // Pier entrance archway
        makeBox(44, 25, 5, 0xc8b89a, px, 12, pz + 5);

        // Amusement arcade building (mid-pier)
        makeBox(36, 22, 40, 0xd4c5a9, px, 12, pz + 200);
        makeBox(38, 5, 42, 0x8B3A3A, px, 24, pz + 200);
        // Arcade roof lanterns
        makeCylinder(4, 4, 8, 8, 0xd4c5a9, px - 12, 32, pz + 200);
        makeCylinder(4, 4, 8, 8, 0xd4c5a9, px + 12, 32, pz + 200);
        makeCone(5, 6, 8, 0x8B3A3A, px - 12, 39, pz + 200);
        makeCone(5, 6, 8, 0x8B3A3A, px + 12, 39, pz + 200);

        // Pier head pavilion
        makeBox(60, 28, 60, 0xe8dcc8, px, 15, pz + 540);
        makeBox(64, 8, 64, 0x8B3A3A, px, 32, pz + 540);
        // Pavilion dome
        makeSphere(18, 12, 8, 0x7a9e7e, px, 40, pz + 540);
        // Pavilion corner turrets
        makeCylinder(5, 5, 30, 8, 0xd4c5a9, px - 28, 15, pz + 512);
        makeCylinder(5, 5, 30, 8, 0xd4c5a9, px + 28, 15, pz + 512);
        makeCylinder(5, 5, 30, 8, 0xd4c5a9, px - 28, 15, pz + 568);
        makeCylinder(5, 5, 30, 8, 0xd4c5a9, px + 28, 15, pz + 568);
        makeCone(6, 12, 8, 0x8B3A3A, px - 28, 34, pz + 512);
        makeCone(6, 12, 8, 0x8B3A3A, px + 28, 34, pz + 512);
        makeCone(6, 12, 8, 0x8B3A3A, px - 28, 34, pz + 568);
        makeCone(6, 12, 8, 0x8B3A3A, px + 28, 34, pz + 568);

        // Lifeboat station (side of pier head)
        makeBox(25, 20, 30, 0xe8e8e8, px + 55, 10, pz + 550);
        makeBox(26, 4, 32, 0xcc3333, px + 55, 22, pz + 550);
        // Lifeboat ramp
        makeBox(12, 2, 40, 0x8B6914, px + 55, 4, pz + 590);

        // Decorative ironwork railings (simplified as low walls)
        makeBox(4, 6, 600, 0x333333, px - 17, 6, pz + 300);
        makeBox(4, 6, 600, 0x333333, px + 17, 6, pz + 300);

        // Railing detail posts
        for (var rp = 0; rp < 30; rp++) {
            var rpz = pz + rp * 20;
            makeCylinder(0.8, 0.8, 8, 4, 0x222222, px - 17, 8, rpz);
            makeCylinder(0.8, 0.8, 8, 4, 0x222222, px + 17, 8, rpz);
        }
    }

    function buildDomeCinema() {
        var cx = X_OFFSET - 180;
        var cz = -80;

        // Main cinema building — Edwardian brick
        makeBox(50, 28, 40, 0x8B4513, cx, 14, cz);
        // Ornate facade front
        makeBox(52, 32, 6, 0x9c5a20, cx, 16, cz - 23);
        // Arched windows suggestion
        makeBox(8, 14, 2, 0xd4c5a9, cx - 14, 16, cz - 26);
        makeBox(8, 14, 2, 0xd4c5a9, cx, 16, cz - 26);
        makeBox(8, 14, 2, 0xd4c5a9, cx + 14, 16, cz - 26);
        // Decorative cornice
        makeBox(56, 4, 8, 0xd4c5a9, cx, 31, cz - 20);

        // The famous onion dome — CylinderGeometry + SphereGeometry layered
        // Drum base
        makeCylinder(14, 16, 12, 12, 0x7a9e7e, cx, 42, cz);
        // Onion dome body (sphere squashed)
        makeSphere(15, 12, 10, 0x4a7a5a, cx, 54, cz);
        // Dome lantern
        makeCylinder(3, 3, 8, 8, 0x7a9e7e, cx, 68, cz);
        makeCone(3, 6, 8, 0x4a5a3a, cx, 75, cz);

        // Side wings
        makeBox(16, 20, 40, 0x8B4513, cx - 33, 10, cz);
        makeBox(16, 20, 40, 0x8B4513, cx + 33, 10, cz);
        makeCone(9, 12, 4, 0x9c5a20, cx - 33, 26, cz);
        makeCone(9, 12, 4, 0x9c5a20, cx + 33, 26, cz);
    }

    function buildWorthingTownCentre() {
        var tx = X_OFFSET - 300;
        var tz = -200;

        // The Guildbourne Centre — large shopping centre
        makeBox(160, 30, 100, 0xccccbb, tx, 15, tz);
        makeBox(162, 5, 102, 0xbbbbaa, tx, 32, tz);

        // Chapel Road — paved area
        makeBox(200, 1, 20, 0x999999, tx, 1, tz - 60);

        // Worthing Museum — Jacobean style
        var mx = X_OFFSET - 100;
        var mz = -280;
        makeBox(60, 35, 50, 0xc8a882, mx, 17, mz);
        // Jacobean stepped gables
        makeBox(62, 8, 6, 0xb89872, mx, 40, mz - 28);
        makeBox(20, 12, 6, 0xb89872, mx - 15, 44, mz - 28);
        makeBox(20, 12, 6, 0xb89872, mx + 15, 44, mz - 28);
        // Museum tower
        makeCylinder(8, 8, 50, 8, 0xc8a882, mx + 25, 25, mz - 20);
        makeCone(10, 15, 8, 0x8B3A3A, mx + 25, 55, mz - 20);
        // Museum entrance
        makeBox(20, 20, 6, 0xd4b896, mx, 10, mz - 28);

        // Worthing Town Hall
        var thx = X_OFFSET + 80;
        var thz = -250;
        makeBox(70, 40, 50, 0xd4c5a9, thx, 20, thz);
        makeBox(72, 6, 52, 0xc8b89a, thx, 44, thz);
        // Town hall clock tower
        makeCylinder(7, 7, 55, 8, 0xd4c5a9, thx, 27, thz - 20);
        makeBox(16, 10, 16, 0xc8b89a, thx, 60, thz - 20);
        makeCone(9, 16, 4, 0x8B3A3A, thx, 73, thz - 20);
        // Clock face suggestion
        makeBox(8, 8, 2, 0xf5f5dc, thx, 62, thz - 29);
    }

    function buildLancingCollegeChapel() {
        // On the South Downs — far north, elevated
        var lx = X_OFFSET + 600;
        var lz = -1200;
        var groundY = 80; // elevated on downs

        // Chapel nave — long French Gothic building
        makeBox(40, 70, 200, 0xe8dcc8, lx, groundY + 35, lz);
        // Nave clerestory
        makeBox(24, 20, 202, 0xf0e8d8, lx, groundY + 80, lz);

        // The great west tower
        makeBox(30, 110, 30, 0xe0d4c0, lx, groundY + 55, lz - 105);
        // Tower parapet
        makeBox(34, 8, 34, 0xd4c8b0, lx, groundY + 115, lz - 105);
        // Corner pinnacles on tower
        makeCylinder(2, 2, 20, 4, 0xe0d4c0, lx - 14, groundY + 122, lz - 119);
        makeCylinder(2, 2, 20, 4, 0xe0d4c0, lx + 14, groundY + 122, lz - 119);
        makeCylinder(2, 2, 20, 4, 0xe0d4c0, lx - 14, groundY + 122, lz - 91);
        makeCylinder(2, 2, 20, 4, 0xe0d4c0, lx + 14, groundY + 122, lz - 91);
        makeCone(3, 8, 4, 0xc8bca8, lx - 14, groundY + 133, lz - 119);
        makeCone(3, 8, 4, 0xc8bca8, lx + 14, groundY + 133, lz - 119);
        makeCone(3, 8, 4, 0xc8bca8, lx - 14, groundY + 133, lz - 91);
        makeCone(3, 8, 4, 0xc8bca8, lx + 14, groundY + 133, lz - 91);

        // Massive rose window — circular suggestion on west face
        makeCylinder(16, 16, 3, 16, 0x6699aa, lx, groundY + 65, lz - 106);
        // Rose window tracery ring
        makeCylinder(18, 18, 2, 16, 0xe0d4c0, lx, groundY + 65, lz - 105);

        // Flying buttresses — pairs along nave
        for (var fb = 0; fb < 6; fb++) {
            var fbz = lz - 60 + fb * 30;
            makeBox(20, 4, 4, 0xd4c8b0, lx - 32, groundY + 50 - fb * 2, fbz);
            makeBox(20, 4, 4, 0xd4c8b0, lx + 32, groundY + 50 - fb * 2, fbz);
        }

        // Side aisles
        makeBox(58, 45, 200, 0xddd0bc, lx, groundY + 22, lz);
        // Apse (east end, rounded suggestion)
        makeCylinder(22, 22, 65, 10, 0xe8dcc8, lx, groundY + 32, lz + 105);
        makeCone(24, 20, 10, 0xd4c8b0, lx, groundY + 68, lz + 105);

        // Roof ridges
        makeCone(22, 25, 4, 0xc8bca8, lx, groundY + 100, lz);

        // Downs hillside
        makeBox(400, 20, 400, 0x5a8a3a, lx, groundY - 10, lz);
    }

    function buildBroadwaterVillage() {
        var bx = X_OFFSET - 600;
        var bz = -500;

        // Village green
        makeBox(120, 1, 100, 0x4a8a2a, bx, 0.5, bz);

        // Norman church — St Mary's Broadwater
        // Nave
        makeBox(30, 25, 50, 0xb0a090, bx, 12, bz);
        // Norman tower — square with battlement top
        makeBox(18, 45, 18, 0xa09080, bx - 20, 22, bz - 28);
        // Tower battlements
        makeBox(20, 5, 20, 0xa09080, bx - 20, 47, bz - 28);
        // Tower corner caps
        makeCylinder(2, 2, 8, 4, 0x908070, bx - 27, 52, bz - 35);
        makeCylinder(2, 2, 8, 4, 0x908070, bx - 13, 52, bz - 35);
        makeCylinder(2, 2, 8, 4, 0x908070, bx - 27, 52, bz - 21);
        makeCylinder(2, 2, 8, 4, 0x908070, bx - 13, 52, bz - 21);
        // Church chancel
        makeBox(20, 20, 30, 0xb0a090, bx + 5, 10, bz + 35);
        // Church roof (pitched)
        makeCone(18, 15, 4, 0x907060, bx, 32, bz);
        makeCone(12, 12, 4, 0x907060, bx + 5, 26, bz + 35);

        // Flint walls around churchyard
        makeBox(130, 8, 4, 0x888880, bx, 4, bz - 60);
        makeBox(130, 8, 4, 0x888880, bx, 4, bz + 60);
        makeBox(4, 8, 120, 0x888880, bx - 65, 4, bz);
        makeBox(4, 8, 120, 0x888880, bx + 65, 4, bz);

        // Village pub
        makeBox(30, 18, 25, 0xc8a882, bx + 60, 9, bz - 30);
        makeCone(18, 10, 4, 0x8B3A3A, bx + 60, 23, bz - 30);

        // Village cottages
        makeBox(20, 14, 18, 0xd4c5a9, bx + 80, 7, bz + 20);
        makeCone(12, 8, 4, 0xc87050, bx + 80, 19, bz + 20);
        makeBox(20, 14, 18, 0xd4c5a9, bx + 80, 7, bz + 45);
        makeCone(12, 8, 4, 0xc87050, bx + 80, 19, bz + 45);
        makeBox(20, 14, 18, 0xc8a882, bx - 80, 7, bz + 20);
        makeCone(12, 8, 4, 0x8B6914, bx - 80, 19, bz + 20);
    }

    function buildSeafrontPromenade() {
        // Bandstand
        var bsx = X_OFFSET - 50;
        makeCylinder(18, 18, 3, 10, 0x888880, bsx, 1, -40);
        makeCylinder(2, 2, 16, 8, 0x555555, bsx - 14, 10, -40);
        makeCylinder(2, 2, 16, 8, 0x555555, bsx + 14, 10, -40);
        makeCylinder(2, 2, 16, 8, 0x555555, bsx, 10, -54);
        makeCylinder(2, 2, 16, 8, 0x555555, bsx, 10, -26);
        makeCone(22, 12, 10, 0x4a7a9a, bsx, 22, -40);

        // Seafront shelter/benches
        for (var sh = 0; sh < 5; sh++) {
            var shx = X_OFFSET - 500 + sh * 180;
            makeBox(30, 8, 8, 0x888880, shx, 4, -30);
            makeBox(2, 14, 2, 0x666666, shx - 12, 7, -30);
            makeBox(2, 14, 2, 0x666666, shx + 12, 7, -30);
        }

        // Lamp posts along prom
        for (var lp = 0; lp < 20; lp++) {
            var lpx = X_OFFSET - 500 + lp * 55;
            makeCylinder(1, 1, 22, 6, 0x333333, lpx, 11, -18);
            makeSphere(3, 6, 4, 0xffffcc, lpx, 23, -18);
        }

        // Seafront road (A259)
        makeBox(1200, 2, 16, 0x444444, X_OFFSET, 1, -35);
        // Road markings suggestion
        makeBox(1200, 0.5, 1, 0xffffff, X_OFFSET, 2, -35);
    }

    function build() {
        buildBeach();
        buildGroynes();
        buildBeachHuts();
        buildPier();
        buildDomeCinema();
        buildWorthingTownCentre();
        buildLancingCollegeChapel();
        buildBroadwaterVillage();
        buildSeafrontPromenade();
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
