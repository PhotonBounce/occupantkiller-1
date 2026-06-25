window.BrusselsGrandPlace = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 22680;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildGroundSquare();
        buildTownHall();
        buildKingsHouse();
        buildGuildHouses();
        buildMannekenPis();
        buildAtomium();
        buildMiniEurope();
        buildBerlaymont();
        buildCinquantenaire();
        buildStreetDetails();
    }

    // ── Grand Place cobblestone ground ──────────────────────────────────────
    function buildGroundSquare() {
        // Main square ground
        makeBox(120, 1, 100, 0xDEB887, 0, -0.5, 0);

        // Cobblestone pattern rows (dark mortar lines)
        var i;
        for (i = -45; i <= 45; i += 5) {
            makeBox(120, 0.3, 0.4, 0x8B7355, i, 0.3, 0);
        }
        for (i = -45; i <= 45; i += 5) {
            makeBox(0.4, 0.3, 100, 0x8B7355, 0, 0.3, i);
        }

        // Surrounding street
        makeBox(300, 0.8, 300, 0x9E9E8A, 0, -0.4, 0);
    }

    // ── Town Hall (Hôtel de Ville) — Gothic masterpiece ─────────────────────
    function buildTownHall() {
        // Main body — left wing (wider)
        makeBox(30, 20, 16, 0xD4C8A0, -18, 10, -58);
        // Main body — right wing (narrower, asymmetric)
        makeBox(20, 20, 16, 0xD4C8A0, 8, 10, -58);

        // Central tower base
        makeBox(10, 30, 10, 0xD4C8A0, -4, 15, -58);

        // Tower middle section
        makeBox(8, 25, 8, 0xC8BC90, -4, 42, -58);

        // Tower upper section
        makeBox(5, 20, 5, 0xBCAE80, -4, 62, -58);

        // Spire — 97m total, stepped
        makeCylinder(1.5, 2.5, 25, 8, 0xB8A870, -4, 84, -58);
        makeCone(1.5, 15, 8, 0xB0A060, -4, 104, -58);

        // St Michael golden statue at top
        makeCylinder(0.3, 0.3, 3, 6, 0xDAA520, -4, 113, -58);
        makeSphere(0.8, 8, 6, 0xDAA520, -4, 115, -58);
        // Wings of St Michael
        makeBox(2, 1.5, 0.3, 0xDAA520, -5.5, 115, -58);
        makeBox(2, 1.5, 0.3, 0xDAA520, -2.5, 115, -58);

        // Gothic window arches on facade (decorative boxes)
        var wx;
        for (wx = -28; wx <= -8; wx += 6) {
            makeBox(2, 5, 0.5, 0xA89060, wx, 8, -50);
            makeBox(1.5, 1.5, 0.5, 0xDAA520, wx, 12, -50);
        }
        for (wx = -4; wx <= 14; wx += 6) {
            makeBox(2, 5, 0.5, 0xA89060, wx, 8, -50);
            makeBox(1.5, 1.5, 0.5, 0xDAA520, wx, 12, -50);
        }

        // Rooftop battlements left wing
        var bx;
        for (bx = -30; bx <= -6; bx += 4) {
            makeBox(1.5, 2, 1.5, 0xC8BC90, bx, 21, -54);
        }
        // Rooftop battlements right wing
        for (bx = -2; bx <= 16; bx += 4) {
            makeBox(1.5, 2, 1.5, 0xC8BC90, bx, 21, -54);
        }

        // Entrance archway
        makeBox(6, 8, 2, 0x9E9060, -4, 4, -50);
        makeCylinder(2.5, 2.5, 0.5, 8, 0xB8A870, -4, 8.5, -50);

        // Small turrets on corners
        makeCylinder(1.5, 1.5, 12, 8, 0xC8BC90, -32, 16, -56);
        makeCone(1.5, 4, 8, 0xB0A060, -32, 23, -56);
        makeCylinder(1.5, 1.5, 12, 8, 0xC8BC90, 16, 16, -56);
        makeCone(1.5, 4, 8, 0xB0A060, 16, 23, -56);
    }

    // ── King's House (Maison du Roi) — Neo-Gothic ───────────────────────────
    function buildKingsHouse() {
        // Main facade
        makeBox(40, 18, 14, 0xF5F5DC, 0, 9, 58);

        // Central projecting section
        makeBox(14, 22, 16, 0xF0EDD0, 0, 11, 60);

        // Upper gallery arcade
        makeBox(40, 5, 3, 0xE8E4C0, 0, 22, 57);

        // Roof with gables
        makeBox(14, 8, 3, 0xE0DDB0, 0, 28, 60);
        makeCone(5, 10, 4, 0xD8D5A0, 0, 37, 60);

        // Side gables
        makeBox(8, 6, 2, 0xE0DDB0, -16, 20, 57);
        makeCone(3, 6, 4, 0xD8D5A0, -16, 26, 57);
        makeBox(8, 6, 2, 0xE0DDB0, 16, 20, 57);
        makeCone(3, 6, 4, 0xD8D5A0, 16, 26, 57);

        // Gothic window details
        var wx;
        for (wx = -16; wx <= 16; wx += 6) {
            makeBox(2.5, 6, 0.5, 0xDAA520, wx, 10, 65);
            makeCone(1.2, 2, 4, 0xDAA520, wx, 15, 65);
        }

        // Ground floor arches
        for (wx = -18; wx <= 18; wx += 6) {
            makeBox(3, 7, 1, 0xC8C4A0, wx, 4, 65);
        }

        // Corner turrets
        makeCylinder(1.8, 1.8, 14, 8, 0xECE8C8, -21, 9, 60);
        makeCone(1.8, 5, 8, 0xD8D5A0, -21, 18, 60);
        makeCylinder(1.8, 1.8, 14, 8, 0xECE8C8, 21, 9, 60);
        makeCone(1.8, 5, 8, 0xD8D5A0, 21, 18, 60);
    }

    // ── Guild Houses — ornate Baroque gilded facades ─────────────────────────
    function buildGuildHouses() {
        // West side guild houses (left of square)
        buildGuildHouse(-62, 0, -20, 0xDAA520, 0xC8A850, 12, 18);
        buildGuildHouse(-62, 0, -4,  0xC8A850, 0xDAA520, 10, 22);
        buildGuildHouse(-62, 0,  12, 0xDAA520, 0xB89640, 11, 20);
        buildGuildHouse(-62, 0,  26, 0xC8A850, 0xDAA520, 10, 17);

        // East side guild houses (right of square)
        buildGuildHouse(62, 0, -20, 0xDAA520, 0xC8A850, 12, 19);
        buildGuildHouse(62, 0,  -4, 0xC8A850, 0xDAA520, 11, 21);
        buildGuildHouse(62, 0,  12, 0xDAA520, 0xB89640, 10, 18);
        buildGuildHouse(62, 0,  28, 0xC8A850, 0xDAA520, 12, 20);

        // North side partial row
        buildGuildHouseNS(-20, 0, 62, 0xDAA520, 0xC8A850, 12, 17);
        buildGuildHouseNS(  0, 0, 62, 0xC8A850, 0xDAA520, 10, 19);
        buildGuildHouseNS( 20, 0, 62, 0xDAA520, 0xB89640, 11, 18);
    }

    function buildGuildHouse(x, y, z, colorBase, colorGold, w, h) {
        // Main body
        makeBox(w - 1, h, 12, colorBase, x, h / 2, z);
        // Gilded facade strip
        makeBox(w - 1, 3, 0.5, colorGold, x, h - 1, z + 6);
        // Stepped gable
        makeBox(w - 2, 4, 1, colorGold, x, h + 2, z + 6);
        makeBox(w - 4, 3, 1, colorGold, x, h + 5, z + 6);
        makeCone(2, 4, 4, colorGold, x, h + 9, z + 6);
        // Windows
        makeBox(2, 3, 0.5, 0xC8A040, x - 3, h / 2, z + 6);
        makeBox(2, 3, 0.5, 0xC8A040, x,     h / 2, z + 6);
        makeBox(2, 3, 0.5, 0xC8A040, x + 3, h / 2, z + 6);
        // Gold pilasters
        makeBox(0.5, h, 0.5, colorGold, x - (w / 2) + 1, h / 2, z + 6);
        makeBox(0.5, h, 0.5, colorGold, x + (w / 2) - 1, h / 2, z + 6);
    }

    function buildGuildHouseNS(x, y, z, colorBase, colorGold, w, h) {
        makeBox(w - 1, h, 12, colorBase, x, h / 2, z);
        makeBox(w - 1, 3, 0.5, colorGold, x + 6, h - 1, z);
        makeBox(w - 2, 4, 1, colorGold, x + 6, h + 2, z);
        makeBox(w - 4, 3, 1, colorGold, x + 6, h + 5, z);
        makeCone(2, 4, 4, colorGold, x + 6, h + 9, z);
        makeBox(0.5, h, 0.5, colorGold, x + 6, h / 2, z - (w / 2) + 1);
        makeBox(0.5, h, 0.5, colorGold, x + 6, h / 2, z + (w / 2) - 1);
    }

    // ── Manneken Pis — tiny bronze boy on ornate pillar ──────────────────────
    function buildMannekenPis() {
        // Ornate stone pillar
        makeBox(1.2, 0.5, 1.2, 0xD4C8A0, 70, 0.25, 70);
        makeCylinder(0.5, 0.7, 2, 8, 0xC8BC90, 70, 1.5, 70);
        makeBox(0.8, 0.5, 0.8, 0xC8BC90, 70, 2.75, 70);

        // The boy figure — 2m total
        makeCylinder(0.15, 0.15, 0.6, 6, 0xC8A850, 70, 3.3, 70);
        makeSphere(0.2, 8, 6, 0xC8A850, 70, 3.8, 70);
        // Arms
        makeBox(0.5, 0.1, 0.1, 0xC8A850, 70, 3.4, 70);
        // Legs
        makeCylinder(0.07, 0.07, 0.4, 6, 0xC8A850, 69.9, 3.0, 70);
        makeCylinder(0.07, 0.07, 0.4, 6, 0xC8A850, 70.1, 3.0, 70);

        // Water basin
        makeCylinder(0.6, 0.8, 0.3, 12, 0x888888, 70, 2.85, 70);
    }

    // ── Atomium — 9 interconnected steel spheres ──────────────────────────────
    function buildAtomium() {
        // Base at x=-200, z=-200 relative to square center
        var ax = -200;
        var az = -200;

        // Central connector column
        makeCylinder(2, 2, 70, 8, 0xD3D3D3, ax, 35, az);

        // Central sphere (top)
        makeSphere(8, 16, 12, 0xD3D3D3, ax, 90, az);

        // Top sphere
        makeSphere(8, 16, 12, 0xD3D3D3, ax, 110, az);
        makeCylinder(1.5, 1.5, 20, 8, 0xC0C0C0, ax, 100, az);

        // 6 outer spheres arranged around central at mid level (~60m)
        var i;
        var angle;
        var radius = 28;
        var midY = 60;
        for (i = 0; i < 6; i++) {
            angle = (i / 6) * Math.PI * 2;
            var sx = ax + Math.cos(angle) * radius;
            var sz = az + Math.sin(angle) * radius;
            makeSphere(8, 16, 12, 0xD3D3D3, sx - OX, midY, sz - OZ);
            // Connector tube to center (approximated with cylinder)
            var cx = ax + Math.cos(angle) * (radius / 2);
            var cz = az + Math.sin(angle) * (radius / 2);
            makeCylinder(1.5, 1.5, radius, 6, 0xC0C0C0, cx - OX, midY, cz - OZ);
        }

        // 2 corner spheres at lower level
        makeSphere(8, 16, 12, 0xD3D3D3, ax + 28 - OX, 20, az - OZ);
        makeSphere(8, 16, 12, 0xD3D3D3, ax - 28 - OX, 20, az - OZ);

        // Support legs
        makeCylinder(1, 1.5, 20, 6, 0xA8A8A8, ax - OX, 10, az - OZ);

        // Visitor center base structure
        makeBox(40, 4, 40, 0xAAAAAA, ax - OX, 2, az - OZ);
    }

    // ── Mini-Europe park ──────────────────────────────────────────────────────
    function buildMiniEurope() {
        var mx = -150;
        var mz = -120;

        // Park ground
        makeBox(80, 0.5, 60, 0x7DBF7D, mx, 0.25, mz);

        // Miniature Eiffel Tower
        makeCone(4, 12, 4, 0x888888, mx - 20, 6, mz - 10);
        makeBox(1, 8, 1, 0x888888, mx - 20, 4, mz - 10);

        // Miniature Big Ben
        makeBox(3, 10, 3, 0xF5F5DC, mx, 5, mz - 10);
        makeCone(1.5, 4, 4, 0x888888, mx, 12, mz - 10);

        // Miniature Colosseum
        makeCylinder(5, 5, 3, 12, 0xDEB887, mx + 20, 1.5, mz - 10);
        makeCylinder(3.5, 3.5, 3, 12, 0xC8A870, mx + 20, 1.5, mz - 10);

        // Miniature Sagrada Familia
        makeBox(3, 8, 3, 0xD4C8A0, mx - 10, 4, mz + 10);
        makeCone(1, 5, 6, 0xD4C8A0, mx - 10, 10, mz + 10);
        makeCone(0.8, 4, 6, 0xD4C8A0, mx - 7, 9, mz + 10);

        // Miniature Brandenburg Gate
        makeBox(8, 5, 1, 0xF5F5DC, mx + 15, 2.5, mz + 15);
        makeBox(1, 5, 1, 0xF5F5DC, mx + 11, 2.5, mz + 15);
        makeBox(1, 5, 1, 0xF5F5DC, mx + 19, 2.5, mz + 15);
        makeBox(8, 1.5, 1, 0xF5F5DC, mx + 15, 6, mz + 15);

        // Park fencing
        makeBox(80, 1.5, 0.3, 0x4A7C4A, mx, 0.75, mz + 31);
        makeBox(80, 1.5, 0.3, 0x4A7C4A, mx, 0.75, mz - 31);
        makeBox(0.3, 1.5, 60, 0x4A7C4A, mx + 41, 0.75, mz);
        makeBox(0.3, 1.5, 60, 0x4A7C4A, mx - 41, 0.75, mz);
    }

    // ── Berlaymont building — EU Commission star-shaped HQ ────────────────────
    function buildBerlaymont() {
        var bx = 200;
        var bz = -150;

        // Main cruciform/star body — approximated with overlapping boxes
        makeBox(60, 40, 20, 0x888888, bx, 20, bz);
        makeBox(20, 40, 60, 0x888888, bx, 20, bz);
        makeBox(40, 40, 40, 0x7A7A7A, bx, 20, bz);

        // Glass curtain wall tint strips
        var fl;
        for (fl = 0; fl < 10; fl++) {
            makeBox(62, 1, 22, 0x6699AA, bx, fl * 4 + 2, bz);
        }

        // Roof structure
        makeBox(65, 3, 25, 0x777777, bx, 41, bz);

        // EU flag pole
        makeCylinder(0.3, 0.3, 20, 4, 0xCCCCCC, bx, 51, bz);
        makeBox(4, 2.5, 0.2, 0x003399, bx + 2, 58, bz);

        // Entrance canopy
        makeBox(12, 1, 6, 0x9999A8, bx, 1, bz + 12);
        makeCylinder(0.4, 0.4, 4, 4, 0x888888, bx - 5, 2, bz + 12);
        makeCylinder(0.4, 0.4, 4, 4, 0x888888, bx + 5, 2, bz + 12);
    }

    // ── Cinquantenaire Arch — triumphal arch with dome ───────────────────────
    function buildCinquantenaire() {
        var cx = 180;
        var cz = 100;

        // Left pillar
        makeBox(18, 35, 14, 0xF5F5DC, cx - 25, 17.5, cz);
        // Right pillar
        makeBox(18, 35, 14, 0xF5F5DC, cx + 25, 17.5, cz);

        // Central arch span
        makeBox(50, 10, 14, 0xF0EDD0, cx, 35, cz);

        // Arch opening (approximated by darkening the void)
        makeBox(18, 20, 15, 0xE8E4C0, cx, 12, cz);

        // Entablature above arch
        makeBox(68, 5, 15, 0xE8E4C0, cx, 42, cz);

        // Attic story
        makeBox(68, 8, 13, 0xF5F5DC, cx, 48.5, cz);

        // Central dome on top
        makeCylinder(8, 10, 6, 12, 0xF0EDD0, cx, 55, cz);
        makeSphere(9, 16, 12, 0xECE8C8, cx, 62, cz);

        // Dome lantern
        makeCylinder(2, 2, 4, 8, 0xE8E4C0, cx, 71, cz);
        makeCone(2, 3, 8, 0xE0DDB0, cx, 74, cz);

        // Quadriga / sculpture group on top
        makeBox(14, 4, 4, 0xDAA520, cx, 53, cz);
        makeSphere(2, 8, 6, 0xDAA520, cx - 4, 56, cz);
        makeSphere(2, 8, 6, 0xDAA520, cx + 4, 56, cz);

        // Side wings extending from pillars
        makeBox(20, 22, 10, 0xF0EDD0, cx - 47, 11, cz);
        makeBox(20, 22, 10, 0xF0EDD0, cx + 47, 11, cz);

        // Decorative columns on wings
        makeCylinder(0.8, 0.8, 20, 8, 0xE8E4C0, cx - 41, 11, cz - 4);
        makeCylinder(0.8, 0.8, 20, 8, 0xE8E4C0, cx - 41, 11, cz + 4);
        makeCylinder(0.8, 0.8, 20, 8, 0xE8E4C0, cx + 41, 11, cz - 4);
        makeCylinder(0.8, 0.8, 20, 8, 0xE8E4C0, cx + 41, 11, cz + 4);

        // Steps base
        makeBox(75, 2, 18, 0xE0DDB0, cx, 1, cz);
        makeBox(70, 1, 16, 0xE8E4C0, cx, 2.5, cz);
    }

    // ── Street details — lampposts, bollards, benches ──────────────────────
    function buildStreetDetails() {
        // Lampposts around Grand Place
        var postPositions = [
            [-50, -40], [-50, 0], [-50, 40],
            [50, -40],  [50, 0],  [50, 40],
            [-20, -52], [0, -52], [20, -52],
            [-20, 52],  [0, 52],  [20, 52]
        ];

        var i;
        for (i = 0; i < postPositions.length; i++) {
            var px = postPositions[i][0];
            var pz = postPositions[i][1];
            // Post shaft
            makeCylinder(0.2, 0.2, 8, 6, 0x3A3A3A, px, 4, pz);
            // Lamp globe
            makeSphere(0.5, 6, 4, 0xFFFFCC, px, 8.3, pz);
            // Arm bracket
            makeBox(1.5, 0.15, 0.15, 0x3A3A3A, px + 0.75, 8, pz);
        }

        // Stone bollards around square perimeter
        var bpos = [
            [-52, -48], [-40, -48], [-28, -48], [-16, -48], [-4, -48],
            [8, -48], [20, -48], [32, -48], [44, -48],
            [-52, 48],  [-40, 48],  [-28, 48],  [-16, 48],  [-4, 48],
            [8, 48],  [20, 48],  [32, 48],  [44, 48]
        ];

        for (i = 0; i < bpos.length; i++) {
            makeCylinder(0.3, 0.4, 1.2, 6, 0xAAAAAA, bpos[i][0], 0.6, bpos[i][1]);
        }

        // Benches
        makeBox(3, 0.3, 0.8, 0x8B5E3C, -40, 0.9, 45);
        makeBox(3, 0.3, 0.8, 0x8B5E3C, -40, 0.9, -45);
        makeBox(3, 0.3, 0.8, 0x8B5E3C,  40, 0.9, 45);
        makeBox(3, 0.3, 0.8, 0x8B5E3C,  40, 0.9, -45);
        // Bench legs
        makeBox(0.2, 0.9, 0.8, 0x5A3E28, -41, 0.45, 45);
        makeBox(0.2, 0.9, 0.8, 0x5A3E28, -39, 0.45, 45);
        makeBox(0.2, 0.9, 0.8, 0x5A3E28,  39, 0.45, -45);
        makeBox(0.2, 0.9, 0.8, 0x5A3E28,  41, 0.45, -45);

        // Flower market stalls (Brussels Grand Place has a famous flower market)
        makeBox(4, 0.1, 2, 0x8B5E3C, -10, 1.1, 10);
        makeBox(4, 0.1, 2, 0x8B5E3C,  10, 1.1, 10);
        makeBox(4, 0.1, 2, 0x8B5E3C,   0, 1.1, -10);
        // Flower colors on stalls
        makeSphere(0.5, 6, 4, 0xFF4444, -11, 1.7, 10);
        makeSphere(0.5, 6, 4, 0xFF8800, -9,  1.7, 10);
        makeSphere(0.5, 6, 4, 0xFFFF00,  9,  1.7, 10);
        makeSphere(0.5, 6, 4, 0xFF66AA,  11, 1.7, 10);
        makeSphere(0.5, 6, 4, 0xCC44FF,  0,  1.7, -11);
        makeSphere(0.5, 6, 4, 0xFF4444,  0,  1.7, -9);
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
