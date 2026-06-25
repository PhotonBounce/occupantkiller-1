window.LincolnCathedral = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 21320;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function placeBox(w, h, d, x, y, z, color) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var m = makeMesh(geo, color);
        m.position.set(OX + x, OY + y, OZ + z);
        return m;
    }

    function placeCyl(rTop, rBot, h, segs, x, y, z, color) {
        var geo = new THREE.CylinderGeometry(rTop, rBot, h, segs);
        var m = makeMesh(geo, color);
        m.position.set(OX + x, OY + y, OZ + z);
        return m;
    }

    function placeCone(r, h, segs, x, y, z, color) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var m = makeMesh(geo, color);
        m.position.set(OX + x, OY + y, OZ + z);
        return m;
    }

    function placeSphere(r, ws, hs, x, y, z, color) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var m = makeMesh(geo, color);
        m.position.set(OX + x, OY + y, OZ + z);
        return m;
    }

    function build() {
        buildGround();
        buildCathedral();
        buildCastle();
        buildSteepHillArea();
        buildJewsHouse();
        buildNewportArch();
        buildHighBridge();
        buildRiverWitham();
        buildBrayfordPool();
        buildMagnaCarta();
    }

    // ─── GROUND PLANE (cliff platform) ───────────────────────────────────────
    function buildGround() {
        // Lincoln Cliff high-ground platform
        placeBox(600, 4, 400, 0, -2, 0, 0x7A6A50);
        // Lower town ground
        placeBox(600, 4, 300, 0, -2, 330, 0x6A7A50);
    }

    // ─── LINCOLN CATHEDRAL ───────────────────────────────────────────────────
    function buildCathedral() {
        var stone = 0xD4C9B0;
        var darkStone = 0xB0A890;
        var roofColor = 0x5A6B5A;

        // --- Nave (main body) ---
        placeBox(60, 20, 120, 0, 10, -40, stone);

        // Nave roof (pitched)
        var naveRoof = new THREE.CylinderGeometry(0, 32, 12, 4);
        var nrMesh = makeMesh(naveRoof, roofColor);
        nrMesh.position.set(OX + 0, OY + 26, OZ - 40);
        nrMesh.rotation.y = Math.PI / 4;

        // Nave side aisles
        placeBox(20, 13, 120, -40, 6, -40, darkStone);
        placeBox(20, 13, 120, 40, 6, -40, darkStone);

        // Nave arcade pillars (south side)
        for (var i = 0; i < 6; i++) {
            placeCyl(1.2, 1.2, 18, 8, -14, 9, -10 - i * 18, darkStone);
        }
        // Nave arcade pillars (north side)
        for (var j = 0; j < 6; j++) {
            placeCyl(1.2, 1.2, 18, 8, 14, 9, -10 - j * 18, darkStone);
        }

        // --- West Front (elaborate Early English facade) ---
        placeBox(70, 28, 6, 0, 14, 50, stone);
        // West front blind arcading tier 1
        placeBox(66, 6, 2, 0, 5, 53, darkStone);
        // West front blind arcading tier 2
        placeBox(66, 6, 2, 0, 16, 53, darkStone);
        // Central west door arch
        placeBox(8, 12, 3, 0, 6, 54, 0x8B7A60);
        // West door arch top (semi-circular)
        placeCyl(4, 4, 3, 16, 0, 13, 53, 0x8B7A60);

        // --- West Towers (flanking) ---
        // Left (south) west tower
        placeBox(22, 50, 22, -30, 25, 42, stone);
        // Left west tower spire
        placeCone(11, 30, 8, -30, 65, 42, darkStone);
        // Left tower battlements
        for (var k = 0; k < 4; k++) {
            placeBox(3, 4, 3, -38 + k * 6, 52, 34, stone);
            placeBox(3, 4, 3, -38 + k * 6, 52, 50, stone);
        }

        // Right (north) west tower
        placeBox(22, 50, 22, 30, 25, 42, stone);
        // Right west tower spire
        placeCone(11, 30, 8, 30, 65, 42, darkStone);
        // Right tower battlements
        for (var l = 0; l < 4; l++) {
            placeBox(3, 4, 3, 22 + l * 6, 52, 34, stone);
            placeBox(3, 4, 3, 22 + l * 6, 52, 50, stone);
        }

        // --- Central Tower (tallest — was world's tallest spire 1311-1549) ---
        placeBox(28, 70, 28, 0, 35, -10, stone);
        // Central tower lantern section
        placeBox(24, 20, 24, 0, 82, -10, darkStone);
        // Central tower spire
        placeCone(13, 55, 8, 0, 112, -10, darkStone);
        // Central tower windows
        placeBox(4, 10, 2, -14, 65, -24, 0x8B7A60);
        placeBox(4, 10, 2, 14, 65, -24, 0x8B7A60);
        placeBox(4, 10, 2, -14, 65, 4, 0x8B7A60);
        placeBox(4, 10, 2, 14, 65, 4, 0x8B7A60);

        // --- Transepts ---
        // North transept
        placeBox(30, 22, 50, 45, 11, -10, stone);
        var ntRoof = new THREE.CylinderGeometry(0, 16, 10, 4);
        var ntMesh = makeMesh(ntRoof, roofColor);
        ntMesh.position.set(OX + 45, OY + 28, OZ - 10);
        ntMesh.rotation.y = Math.PI / 4;

        // South transept
        placeBox(30, 22, 50, -45, 11, -10, stone);
        var stRoof = new THREE.CylinderGeometry(0, 16, 10, 4);
        var stMesh = makeMesh(stRoof, roofColor);
        stMesh.position.set(OX - 45, OY + 28, OZ - 10);
        stMesh.rotation.y = Math.PI / 4;

        // --- Angel Choir (east end, 13th century) ---
        placeBox(55, 22, 40, 0, 11, -110, stone);
        // Angel choir roof
        var acRoof = new THREE.CylinderGeometry(0, 28, 12, 4);
        var acMesh = makeMesh(acRoof, roofColor);
        acMesh.position.set(OX + 0, OY + 29, OZ - 110);
        acMesh.rotation.y = Math.PI / 4;
        // East window (great window)
        placeBox(14, 16, 3, 0, 14, -131, 0x8B7A60);
        placeCyl(7, 7, 3, 16, 0, 23, -131, 0x8B7A60);
        // Angel choir side aisles
        placeBox(14, 14, 40, -34, 7, -110, darkStone);
        placeBox(14, 14, 40, 34, 7, -110, darkStone);

        // --- Chapter House (polygonal) ---
        placeCyl(18, 18, 20, 10, 10, -60, stone);
        placeCone(18, 14, 10, 0, 27, -60, roofColor);

        // --- Flying Buttresses (decorative boxes) ---
        for (var b = 0; b < 5; b++) {
            placeBox(12, 3, 3, -36, 14 - b * 2, -20 - b * 20, darkStone);
            placeBox(12, 3, 3, 36, 14 - b * 2, -20 - b * 20, darkStone);
        }

        // --- Cathedral Close Wall ---
        placeBox(200, 6, 3, 0, 3, 80, darkStone);
        placeBox(3, 6, 220, -100, 3, -30, darkStone);
        placeBox(3, 6, 220, 100, 3, -30, darkStone);
    }

    // ─── LINCOLN CASTLE ──────────────────────────────────────────────────────
    function buildCastle() {
        var castleStone = 0x8B7355;
        var darkCastle = 0x6B5335;

        // Castle curtain walls
        placeBox(130, 10, 5, -200, 5, 60, castleStone);   // north wall
        placeBox(130, 10, 5, -200, 5, -60, castleStone);  // south wall
        placeBox(5, 10, 120, -265, 5, 0, castleStone);    // west wall
        placeBox(5, 10, 120, -135, 5, 0, castleStone);    // east wall

        // --- Norman Gatehouse (east gate) ---
        placeBox(20, 18, 14, -135, 9, 0, darkCastle);
        // Gatehouse arch passage
        placeBox(6, 10, 14, -135, 5, 0, 0x2A1A0A);
        // Gatehouse battlements
        for (var g = 0; g < 5; g++) {
            placeBox(3, 4, 3, -143 + g * 6, 20, -7, castleStone);
            placeBox(3, 4, 3, -143 + g * 6, 20, 7, castleStone);
        }
        // Gatehouse flanking towers
        placeBox(10, 22, 10, -145, 11, -12, castleStone);
        placeBox(10, 22, 10, -145, 11, 12, castleStone);

        // --- Lucy Tower (western motte — shell keep) ---
        placeCyl(20, 24, 8, 12, -250, 4, -30, castleStone);  // motte mound
        placeCyl(16, 16, 12, 12, -250, 14, -30, darkCastle); // shell keep walls
        placeCyl(3, 3, 16, 8, -238, 8, -20, castleStone);    // tower
        placeCyl(3, 3, 16, 8, -262, 8, -20, castleStone);
        placeCyl(3, 3, 16, 8, -238, 8, -40, castleStone);
        placeCyl(3, 3, 16, 8, -262, 8, -40, castleStone);
        // Lucy Tower battlements cap
        placeBox(34, 3, 34, -250, 21, -30, darkCastle);

        // --- Observatory Tower (eastern motte) ---
        placeCyl(14, 18, 6, 12, -160, 3, -45, castleStone); // motte mound
        placeBox(14, 22, 14, -160, 13, -45, darkCastle);    // tower block
        placeCone(7, 8, 4, -160, 30, -45, 0x4A3A25);        // tower roof
        // Observatory tower battlements
        for (var ob = 0; ob < 4; ob++) {
            placeBox(3, 3, 3, -167 + ob * 4, 25, -52, castleStone);
            placeBox(3, 3, 3, -167 + ob * 4, 25, -38, castleStone);
        }

        // --- Victorian Prison Chapel (separate angled building) ---
        placeBox(28, 12, 18, -210, 6, 20, 0x9A8060);
        // Chapel roof
        var chapRoof = new THREE.CylinderGeometry(0, 15, 8, 4);
        var chapMesh = makeMesh(chapRoof, 0x5A4A30);
        chapMesh.position.set(OX - 210, OY + 16, OZ + 20);
        chapMesh.rotation.y = Math.PI / 4;
        // Chapel windows (radial layout)
        placeBox(3, 5, 2, -210, 8, 30, 0x6B5A3A);
        placeBox(3, 5, 2, -210, 8, 10, 0x6B5A3A);
        placeBox(2, 5, 3, -197, 8, 20, 0x6B5A3A);
        placeBox(2, 5, 3, -223, 8, 20, 0x6B5A3A);

        // --- Wall Walk (walkway along curtain wall) ---
        placeBox(130, 2, 4, -200, 11, 62, darkCastle);  // north wall walk
        placeBox(130, 2, 4, -200, 11, -62, darkCastle); // south wall walk

        // Corner towers on curtain wall
        placeBox(10, 14, 10, -265, 7, 60, darkCastle);
        placeBox(10, 14, 10, -265, 7, -60, darkCastle);
        placeBox(10, 14, 10, -135, 7, 60, darkCastle);
        placeBox(10, 14, 10, -135, 7, -60, darkCastle);
    }

    // ─── STEEP HILL / THE STRAIT ─────────────────────────────────────────────
    function buildSteepHillArea() {
        var medStone = 0xD4C9B0;
        var roofTile = 0x8B3A2A;

        // The Strait — steep medieval street (stepped terrain)
        placeBox(14, 3, 20, 120, 1, 80, 0x9A8A70);
        placeBox(14, 3, 20, 120, -1, 100, 0x9A8A70);
        placeBox(14, 3, 20, 120, -3, 120, 0x9A8A70);
        placeBox(14, 3, 20, 120, -5, 140, 0x9A8A70);
        placeBox(14, 3, 20, 120, -7, 160, 0x9A8A70);

        // Medieval timber-framed buildings along Steep Hill
        // Building 1
        placeBox(12, 14, 10, 110, 7, 90, medStone);
        var r1 = new THREE.CylinderGeometry(0, 7, 6, 4);
        var r1m = makeMesh(r1, roofTile);
        r1m.position.set(OX + 110, OY + 17, OZ + 90);
        r1m.rotation.y = Math.PI / 4;
        // Building 2
        placeBox(12, 12, 10, 130, 6, 110, medStone);
        var r2 = new THREE.CylinderGeometry(0, 7, 5, 4);
        var r2m = makeMesh(r2, roofTile);
        r2m.position.set(OX + 130, OY + 15, OZ + 110);
        r2m.rotation.y = Math.PI / 4;
        // Building 3
        placeBox(10, 10, 10, 110, 5, 130, medStone);
        var r3 = new THREE.CylinderGeometry(0, 6, 5, 4);
        var r3m = makeMesh(r3, roofTile);
        r3m.position.set(OX + 110, OY + 13, OZ + 130);
        r3m.rotation.y = Math.PI / 4;
        // Building 4
        placeBox(14, 12, 10, 130, 5, 150, medStone);
        var r4 = new THREE.CylinderGeometry(0, 8, 5, 4);
        var r4m = makeMesh(r4, roofTile);
        r4m.position.set(OX + 130, OY + 14, OZ + 150);
        r4m.rotation.y = Math.PI / 4;
    }

    // ─── JEWS' HOUSE (12th-century Norman merchant house) ────────────────────
    function buildJewsHouse() {
        var normStone = 0xD4C9B0;
        var darkNorm = 0xB0A070;

        // Main house body (two storeys)
        placeBox(14, 16, 12, 125, 8, 170, normStone);
        // Norman doorway arch
        placeBox(4, 6, 2, 125, 3, 177, darkNorm);
        placeCyl(2, 2, 2, 12, 125, 8, 177, darkNorm);
        // First floor windows (round-headed Norman)
        placeBox(3, 4, 2, 119, 11, 177, darkNorm);
        placeBox(3, 4, 2, 131, 11, 177, darkNorm);
        // Round window above door
        placeSphere(1.5, 8, 6, 125, 15, 177, darkNorm);
        // Stone roof
        var jhRoof = new THREE.CylinderGeometry(0, 8, 5, 4);
        var jhMesh = makeMesh(jhRoof, 0x6A5A40);
        jhMesh.position.set(OX + 125, OY + 21, OZ + 170);
        jhMesh.rotation.y = Math.PI / 4;
        // Chimney stacks
        placeCyl(0.8, 0.8, 5, 6, 121, 22, 166, 0x7A6A50);
        placeCyl(0.8, 0.8, 5, 6, 129, 22, 166, 0x7A6A50);
    }

    // ─── NEWPORT ARCH (Roman gate) ────────────────────────────────────────────
    function buildNewportArch() {
        var romanStone = 0xD4C9B0;
        var archVoid = 0x1A1A1A;

        // Left pier
        placeBox(4, 20, 6, 108, 10, -100, romanStone);
        // Right pier
        placeBox(4, 20, 6, 116, 10, -100, romanStone);
        // Arch lintel / voussoir block
        placeBox(16, 6, 6, 112, 22, -100, romanStone);
        // Arch void (dark box to suggest opening)
        placeBox(7, 11, 7, 112, 10, -100, archVoid);
        // Arch top rounded crown
        placeCyl(3.5, 3.5, 6, 16, 112, 19, -100, romanStone);
        // Remaining Roman wall stubs
        placeBox(20, 14, 4, 96, 7, -100, romanStone);
        placeBox(20, 14, 4, 128, 7, -100, romanStone);
        // Roman road surface through arch
        placeBox(10, 1, 40, 112, 1, -100, 0xB0A080);
    }

    // ─── HIGH BRIDGE (medieval bridge with shops) ────────────────────────────
    function buildHighBridge() {
        var bridgeStone = 0xC8B89A;
        var shopColor = 0xD4B896;
        var waterColor = 0x006994;

        // Bridge deck
        placeBox(24, 4, 30, 80, 2, 260, bridgeStone);
        // Left arch pier
        placeBox(5, 8, 30, 72, 4, 260, bridgeStone);
        // Right arch pier
        placeBox(5, 8, 30, 88, 4, 260, bridgeStone);
        // Bridge arch void (suggests water passage below)
        placeBox(16, 5, 30, 80, 0, 260, waterColor);
        // Shops on bridge — left side
        placeBox(10, 10, 28, 74, 10, 260, shopColor);
        var shopRoof1 = new THREE.CylinderGeometry(0, 6, 5, 4);
        var sr1 = makeMesh(shopRoof1, 0x7A3A2A);
        sr1.position.set(OX + 74, OY + 17, OZ + 260);
        sr1.rotation.y = Math.PI / 4;
        // Shops on bridge — right side
        placeBox(10, 10, 28, 86, 10, 260, shopColor);
        var shopRoof2 = new THREE.CylinderGeometry(0, 6, 5, 4);
        var sr2 = makeMesh(shopRoof2, 0x7A3A2A);
        sr2.position.set(OX + 86, OY + 17, OZ + 260);
        sr2.rotation.y = Math.PI / 4;
        // Stonebow (nearby medieval gateway arch)
        placeBox(30, 16, 8, 80, 8, 240, bridgeStone);
        placeBox(10, 10, 8, 80, 5, 240, 0x1A1A1A);
        placeBox(4, 4, 3, 70, 18, 240, bridgeStone);
        placeBox(4, 4, 3, 90, 18, 240, bridgeStone);
    }

    // ─── RIVER WITHAM ────────────────────────────────────────────────────────
    function buildRiverWitham() {
        var waterColor = 0x006994;
        var bankColor = 0x5A6A40;

        // River channel
        placeBox(22, 2, 280, 80, -1, 230, waterColor);
        // North river bank
        placeBox(30, 3, 280, 60, 0, 230, bankColor);
        // South river bank
        placeBox(30, 3, 280, 100, 0, 230, bankColor);

        // Riverbank buildings (warehouses)
        placeBox(18, 10, 12, 55, 5, 200, 0xB09070);
        placeBox(18, 10, 12, 55, 5, 220, 0x9A8060);
        placeBox(18, 10, 12, 55, 5, 240, 0xB09070);
    }

    // ─── BRAYFORD POOL (Roman harbour / modern marina) ────────────────────────
    function buildBrayfordPool() {
        var waterColor = 0x006994;
        var quayColor = 0xB0A080;
        var uniColor = 0xD0C0A0;

        // Pool water (large basin)
        placeBox(120, 2, 100, 0, -1, 320, waterColor);
        // Quayside north
        placeBox(130, 3, 10, 0, 1, 270, quayColor);
        // Quayside south
        placeBox(130, 3, 10, 0, 1, 370, quayColor);
        // Quayside west
        placeBox(10, 3, 100, -65, 1, 320, quayColor);
        // Quayside east
        placeBox(10, 3, 100, 65, 1, 320, quayColor);

        // Lincoln University buildings (modern, simplified as boxes)
        // Main campus building
        placeBox(50, 16, 24, -20, 8, 400, uniColor);
        var uniRoof = new THREE.CylinderGeometry(0, 26, 6, 4);
        var urm = makeMesh(uniRoof, 0x5A6A7A);
        urm.position.set(OX - 20, OY + 19, OZ + 400);
        urm.rotation.y = Math.PI / 4;
        // Library
        placeBox(30, 20, 20, 30, 10, 400, 0xC8C0B0);
        // Student union
        placeBox(24, 12, 20, -55, 6, 400, uniColor);

        // Moored boats / marina pontoons
        placeBox(20, 2, 8, -30, 1, 295, 0x8B7050);
        placeBox(20, 2, 8, 10, 1, 295, 0x8B7050);
        // Boat hulls
        placeCyl(3, 4, 8, 8, -30, 3, 295, 0xE8DCC8);
        placeCyl(3, 4, 8, 8, 10, 3, 295, 0xD8CCC0);
        // Boat masts
        placeCyl(0.3, 0.3, 14, 6, -30, 10, 295, 0xF0E0C8);
        placeCyl(0.3, 0.3, 14, 6, 10, 10, 295, 0xE8D8C0);
    }

    // ─── MAGNA CARTA VAULT ───────────────────────────────────────────────────
    function buildMagnaCarta() {
        var vaultStone = 0x8B7355;
        var goldColor = 0xD4A820;

        // Vault chamber within castle (attached to Victorian prison block)
        placeBox(16, 10, 14, -195, 5, -20, vaultStone);
        // Vault roof (barrel vault approximated by cylinder)
        placeCyl(7, 7, 16, 16, -195, 12, -20, 0x6B5335);
        // Heavy iron door (dark box)
        placeBox(4, 6, 2, -195, 3, -27, 0x2A2A2A);
        // Display case pedestal inside (gold-tinted)
        placeBox(3, 4, 3, -195, 4, -18, goldColor);
        // Small illuminated sphere above display (ambient light reference)
        placeSphere(1, 8, 6, -195, 8, -18, 0xF8F0C8);
        // Security cage around vault
        placeBox(18, 12, 1, -195, 6, -14, 0x3A3A3A);
        placeBox(1, 12, 16, -186, 6, -20, 0x3A3A3A);
        placeBox(1, 12, 16, -204, 6, -20, 0x3A3A3A);
    }

    function update(delta) {
        // Static environment — no animation needed
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
