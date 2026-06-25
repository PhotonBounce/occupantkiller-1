window.TehranAzadi = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 24000;
    var BASE_Y = 0;
    var BASE_Z = 0;

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

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function build() {
        buildAzadiTower();
        buildMiladTower();
        buildGrandBazaar();
        buildGolestanPalace();
        buildDamavand();
        buildAlborzRange();
        buildEmamMosque();
        buildNiavaranPalace();
        buildTabiatBridge();
        buildSaadabadComplex();
        buildGroundPlate();
        buildCityBlocks();
    }

    // ── AZADI TOWER ─────────────────────────────────────────────────────────────
    // Iconic inverted-Y-arch gateway, ~45m tall, white marble 0xF0EDE8
    function buildAzadiTower() {
        var col = 0xF0EDE8;
        var tile = 0x2255AA; // blue tile geometric accent

        // Central top block (keystone where arch meets)
        makeBox(22, 10, 10, col, 0, 45, 0);

        // Left arch leg — angled outward-bottom, represented as rotated box
        var leftLeg = new THREE.Mesh(
            new THREE.BoxGeometry(6, 40, 8),
            makeMat(col)
        );
        leftLeg.position.set(BASE_X - 10, BASE_Y + 22, BASE_Z + 0);
        leftLeg.rotation.z = 0.32;
        scene.add(leftLeg);
        objects.push(leftLeg);

        // Right arch leg
        var rightLeg = new THREE.Mesh(
            new THREE.BoxGeometry(6, 40, 8),
            makeMat(col)
        );
        rightLeg.position.set(BASE_X + 10, BASE_Y + 22, BASE_Z + 0);
        rightLeg.rotation.z = -0.32;
        scene.add(rightLeg);
        objects.push(rightLeg);

        // Rear left leg (Y-shape third arm going back)
        var rearLeg = new THREE.Mesh(
            new THREE.BoxGeometry(6, 36, 8),
            makeMat(col)
        );
        rearLeg.position.set(BASE_X + 0, BASE_Y + 18, BASE_Z + 10);
        rearLeg.rotation.x = -0.35;
        scene.add(rearLeg);
        objects.push(rearLeg);

        // Blue tile accent band across top
        makeBox(24, 3, 11, tile, 0, 52, 0);

        // Blue tile stripe on arch faces
        makeBox(3, 26, 3, tile, -12, 26, 3);
        makeBox(3, 26, 3, tile, 12, 26, 3);

        // Base platform
        makeBox(40, 4, 30, col, 0, 2, 0);

        // Decorative side fins
        makeBox(2, 10, 10, tile, -18, 10, 0);
        makeBox(2, 10, 10, tile, 18, 10, 0);

        // Small dome cap on top
        makeSphere(6, 8, 6, col, 0, 52, 0);

        // Ground steps
        makeBox(50, 2, 40, 0xDDDAD5, 0, 1, 0);
        makeBox(60, 1, 50, 0xDDDAD5, 0, 0, 0);
    }

    // ── MILAD TOWER ─────────────────────────────────────────────────────────────
    // 435m telecom tower, 12-sided obs deck, 0xCCCCCC
    function buildMiladTower() {
        var col = 0xCCCCCC;
        var ox = 400;
        var oz = 80;

        // Tapered concrete shaft — wide base to narrow top in segments
        makeCyl(18, 28, 80, 12, col, ox, 40, oz);
        makeCyl(14, 18, 80, 12, col, ox, 120, oz);
        makeCyl(10, 14, 80, 12, col, ox, 200, oz);
        makeCyl(7, 10, 80, 12, col, ox, 280, oz);
        makeCyl(5, 7, 60, 12, col, ox, 350, oz);

        // Observation deck pod — wide 12-sided disc
        makeCyl(35, 35, 30, 12, 0xBBBBBB, ox, 385, oz);
        makeCyl(38, 38, 6, 12, 0xAAAAAA, ox, 372, oz);
        makeCyl(38, 38, 6, 12, 0xAAAAAA, ox, 400, oz);

        // Windows ring on obs deck
        makeCyl(40, 40, 4, 12, 0x334455, ox, 386, oz);

        // Antenna shaft
        makeCyl(1.5, 2, 80, 6, 0x999999, ox, 460, oz);
        makeCyl(0.5, 1.5, 40, 6, 0x888888, ox, 515, oz);

        // Base building complex
        makeBox(120, 20, 120, 0xBBBBBB, ox, 10, oz);
        makeBox(80, 15, 80, 0xCCCCCC, ox, 17, oz + 20);

        // Podium floors
        makeBox(200, 8, 160, 0xAAAAAA, ox, 4, oz);
    }

    // ── TEHRAN GRAND BAZAAR ─────────────────────────────────────────────────────
    // Vast covered market, vaulted brick lanes, 0xC8B880
    function buildGrandBazaar() {
        var col = 0xC8B880;
        var bx = -300;
        var bz = 200;

        // Main vaulted hall — central spine
        makeBox(300, 16, 30, col, bx, 8, bz);

        // Vault ribs across main hall
        var i;
        for (i = 0; i < 8; i++) {
            makeCyl(15, 15, 30, 8, 0xB8A870, bx - 120 + i * 36, 22, bz);
        }

        // Cross lanes — perpendicular bazaar alleys
        makeBox(30, 14, 200, col, bx - 80, 7, bz + 50);
        makeBox(30, 14, 200, col, bx + 80, 7, bz + 50);
        makeBox(30, 14, 200, col, bx, 7, bz + 100);

        // Gold bazaar wing
        makeBox(80, 12, 60, 0xC8A840, bx - 160, 6, bz + 80);
        makeBox(80, 12, 60, 0xD4B850, bx + 160, 6, bz + 80);

        // Carpet bazaar — larger wing
        makeBox(120, 14, 80, 0xB09060, bx, 7, bz + 160);

        // Caravanserai courtyards
        makeBox(60, 10, 60, col, bx - 180, 5, bz - 40);
        makeBox(60, 10, 60, col, bx + 180, 5, bz - 40);

        // Central dome over caravanserai
        makeSphere(20, 8, 6, 0xBBAA70, bx - 180, 20, bz - 40);
        makeSphere(20, 8, 6, 0xBBAA70, bx + 180, 20, bz - 40);

        // Entry gate / gatehouse
        makeBox(30, 20, 10, col, bx, 10, bz - 110);
        makeCyl(5, 5, 20, 8, col, bx - 15, 18, bz - 110);
        makeCyl(5, 5, 20, 8, col, bx + 15, 18, bz - 110);
        makeCone(6, 8, 8, 0xAA9060, bx - 15, 30, bz - 110);
        makeCone(6, 8, 8, 0xAA9060, bx + 15, 30, bz - 110);

        // Outer bazaar walls
        makeBox(400, 10, 6, 0xBBAA70, bx, 5, bz - 120);
        makeBox(400, 10, 6, 0xBBAA70, bx, 5, bz + 240);
        makeBox(6, 10, 360, 0xBBAA70, bx - 200, 5, bz + 60);
        makeBox(6, 10, 360, 0xBBAA70, bx + 200, 5, bz + 60);
    }

    // ── GOLESTAN PALACE ─────────────────────────────────────────────────────────
    // Qajar royal palace, Mirror Hall, ornate garden, 0xD4A850
    function buildGolestanPalace() {
        var col = 0xD4A850;
        var px = -500;
        var pz = -200;

        // Main palace hall — Mirror Hall
        makeBox(80, 18, 40, col, px, 9, pz);
        // Mirror/tile decorative bands
        makeBox(82, 3, 42, 0xEEDDAA, px, 19, pz);
        makeBox(82, 3, 42, 0xFFEEBB, px, 5, pz);

        // Ornate iwan (arched portal) facade
        makeBox(20, 24, 6, 0xDD9930, px, 12, pz - 23);
        makeCyl(7, 7, 24, 8, 0xCC8820, px, 12, pz - 23);
        makeSphere(8, 8, 6, col, px, 26, pz - 23);

        // Side wings
        makeBox(30, 14, 40, col, px - 55, 7, pz);
        makeBox(30, 14, 40, col, px + 55, 7, pz);

        // Corner towers
        makeCyl(5, 5, 20, 8, 0xCC9940, px - 65, 10, pz - 25);
        makeCyl(5, 5, 20, 8, 0xCC9940, px + 65, 10, pz - 25);
        makeCyl(5, 5, 20, 8, 0xCC9940, px - 65, 10, pz + 25);
        makeCyl(5, 5, 20, 8, 0xCC9940, px + 65, 10, pz + 25);
        makeCone(6, 8, 8, 0xBB8830, px - 65, 24, pz - 25);
        makeCone(6, 8, 8, 0xBB8830, px + 65, 24, pz - 25);
        makeCone(6, 8, 8, 0xBB8830, px - 65, 24, pz + 25);
        makeCone(6, 8, 8, 0xBB8830, px + 65, 24, pz + 25);

        // Garden courtyard with marble pool
        makeBox(100, 1, 80, 0x88AA88, px, 0, pz + 80);
        makeBox(30, 1.5, 20, 0x6699BB, px, 0.5, pz + 80); // pool water
        makeBox(34, 2, 24, 0xDDCCAA, px, 0.3, pz + 80);   // pool surround

        // Garden ornamental trees (spheres)
        makeSphere(5, 6, 5, 0x336633, px - 30, 8, pz + 60);
        makeSphere(5, 6, 5, 0x336633, px + 30, 8, pz + 60);
        makeSphere(5, 6, 5, 0x336633, px - 30, 8, pz + 100);
        makeSphere(5, 6, 5, 0x336633, px + 30, 8, pz + 100);
    }

    // ── MOUNT DAMAVAND ──────────────────────────────────────────────────────────
    // 5610m dormant volcano, snow-capped, visible north, 0xFFFFFF
    function buildDamavand() {
        var mx = 200;
        var mz = -1800;

        // Lower volcanic base — wide brown cone
        makeCone(800, 1400, 8, 0x998877, mx, 700, mz);
        // Upper mid section
        makeCone(400, 1200, 8, 0xBBAA99, mx, 1800, mz);
        // Snow-capped peak zone
        makeCone(200, 600, 8, 0xDDCCBB, mx, 2700, mz);
        // Summit snow cap
        makeCone(100, 400, 8, 0xFFFFFF, mx, 3200, mz);
        // Pure white tip
        makeCone(40, 200, 6, 0xFFFFFF, mx, 3560, mz);

        // Sulfur vents / secondary cone
        makeCone(60, 120, 6, 0xEEEEDD, mx + 80, 1410, mz + 60);
    }

    // ── ALBORZ MOUNTAIN RANGE ───────────────────────────────────────────────────
    // Snow-capped range, Tochal gondola, 0x8899AA
    function buildAlborzRange() {
        var az = -900;
        var col = 0x8899AA;
        var snow = 0xDDEEFF;

        // Range of peaks spread east-west
        makeCone(300, 700, 6, col, -600, 350, az);
        makeCone(240, 580, 6, col, -300, 290, az - 80);
        makeCone(280, 640, 6, col, 0, 320, az + 40);
        makeCone(260, 600, 6, col, 300, 310, az - 60);
        makeCone(320, 720, 6, col, 600, 360, az);
        makeCone(200, 480, 6, col, 900, 240, az - 40);

        // Snow caps on each peak
        makeCone(100, 200, 6, snow, -600, 770, az);
        makeCone(80, 160, 6, snow, -300, 640, az - 80);
        makeCone(90, 180, 6, snow, 0, 700, az + 40);
        makeCone(85, 170, 6, snow, 300, 670, az - 60);
        makeCone(110, 220, 6, snow, 600, 790, az);
        makeCone(70, 140, 6, snow, 900, 530, az - 40);

        // Tochal gondola pylons (CylinderGeometry)
        makeCyl(2, 2, 40, 4, 0x999999, -120, 20, az + 50);
        makeCyl(2, 2, 60, 4, 0x999999, -80, 30, az + 30);
        makeCyl(2, 2, 80, 4, 0x999999, -40, 40, az + 10);

        // Gondola stations
        makeBox(20, 10, 15, 0xAABBCC, -140, 10, az + 60);
        makeBox(20, 10, 15, 0xAABBCC, 0, 300, az - 20);
    }

    // ── IMAM KHOMEINI MOSQUE ────────────────────────────────────────────────────
    // Large blue-tiled mosque, four minarets, large dome, 0x4466AA
    function buildEmamMosque() {
        var col = 0x4466AA;
        var mx = 200;
        var mz = 300;

        // Main prayer hall body
        makeBox(100, 20, 80, col, mx, 10, mz);

        // Large central dome
        makeSphere(28, 10, 8, 0x3355AA, mx, 38, mz);
        // Dome drum
        makeCyl(22, 22, 12, 12, col, mx, 26, mz);

        // Four minarets at corners
        makeCyl(5, 5, 60, 8, col, mx - 55, 30, mz - 45);
        makeCyl(5, 5, 60, 8, col, mx + 55, 30, mz - 45);
        makeCyl(5, 5, 60, 8, col, mx - 55, 30, mz + 45);
        makeCyl(5, 5, 60, 8, col, mx + 55, 30, mz + 45);
        // Minaret caps
        makeCone(7, 14, 8, 0x2244AA, mx - 55, 64, mz - 45);
        makeCone(7, 14, 8, 0x2244AA, mx + 55, 64, mz - 45);
        makeCone(7, 14, 8, 0x2244AA, mx - 55, 64, mz + 45);
        makeCone(7, 14, 8, 0x2244AA, mx + 55, 64, mz + 45);

        // Iwan portal entry
        makeBox(30, 28, 8, 0x3355AA, mx, 14, mz - 44);
        makeSphere(14, 8, 6, 0x2244BB, mx, 30, mz - 44);

        // Courtyard
        makeBox(160, 1, 120, 0x998877, mx, 0, mz + 80);
        // Ablution fountain
        makeCyl(8, 8, 3, 8, 0x4477AA, mx, 1.5, mz + 100);
        makeSphere(5, 8, 6, 0x3366BB, mx, 4, mz + 100);

        // Surrounding wall
        makeBox(180, 6, 4, col, mx, 3, mz - 60);
        makeBox(4, 6, 200, col, mx - 90, 3, mz + 40);
        makeBox(4, 6, 200, col, mx + 90, 3, mz + 40);
    }

    // ── NIAVARAN PALACE ─────────────────────────────────────────────────────────
    // Last Shah's palace, modern + traditional, park, 0xD4C8B0
    function buildNiavaranPalace() {
        var col = 0xD4C8B0;
        var nx = 500;
        var nz = -300;

        // Main modern palace building
        makeBox(80, 16, 50, col, nx, 8, nz);
        // Flat modernist roof overhang
        makeBox(90, 2, 60, 0xC4B8A0, nx, 17, nz);

        // Traditional pavilion adjacent
        makeBox(40, 14, 30, 0xDDD0B0, nx - 70, 7, nz + 20);
        makeSphere(14, 8, 6, 0xCCC0A0, nx - 70, 22, nz + 20);

        // Library / Jahan Nama building
        makeBox(30, 12, 25, 0xE0D4BA, nx + 65, 6, nz - 20);
        makeBox(32, 2, 27, 0xD0C4AA, nx + 65, 13, nz - 20);

        // Park grounds — green area
        makeBox(220, 1, 160, 0x5D8A5D, nx, 0, nz + 30);

        // Tree clusters
        makeCyl(3, 3, 12, 6, 0x5C3317, nx - 90, 6, nz + 40);
        makeSphere(10, 6, 5, 0x336633, nx - 90, 18, nz + 40);
        makeCyl(3, 3, 12, 6, 0x5C3317, nx + 90, 6, nz + 60);
        makeSphere(10, 6, 5, 0x336633, nx + 90, 18, nz + 60);
        makeCyl(3, 3, 12, 6, 0x5C3317, nx, 6, nz + 80);
        makeSphere(10, 6, 5, 0x336633, nx, 18, nz + 80);

        // Entry gate pillars
        makeCyl(4, 4, 14, 6, 0xCCBB99, nx - 45, 7, nz - 45);
        makeCyl(4, 4, 14, 6, 0xCCBB99, nx + 45, 7, nz - 45);
        makeCone(5, 8, 6, 0xBBAA88, nx - 45, 18, nz - 45);
        makeCone(5, 8, 6, 0xBBAA88, nx + 45, 18, nz - 45);
    }

    // ── TABIAT BRIDGE ───────────────────────────────────────────────────────────
    // 3-level pedestrian bridge, tree-top walking paths, 0x888888
    function buildTabiatBridge() {
        var col = 0x888888;
        var bx = -150;
        var bz = -500;

        // Bridge span — 3 levels of deck
        makeBox(200, 3, 12, col, bx, 18, bz);
        makeBox(200, 3, 10, col, bx, 26, bz + 4);
        makeBox(180, 3, 8, col, bx, 34, bz - 2);

        // Support pylons — Y-shaped represented as angled boxes
        var p1x = bx - 60;
        var p2x = bx + 60;

        makeCyl(4, 6, 36, 6, col, p1x, 18, bz);
        makeCyl(4, 6, 36, 6, col, p2x, 18, bz);

        // Diagonal strut arms
        var strut1 = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 28, 6),
            makeMat(col)
        );
        strut1.position.set(BASE_X + p1x - 10, BASE_Y + 22, BASE_Z + bz);
        strut1.rotation.z = 0.45;
        scene.add(strut1);
        objects.push(strut1);

        var strut2 = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 28, 6),
            makeMat(col)
        );
        strut2.position.set(BASE_X + p1x + 10, BASE_Y + 22, BASE_Z + bz);
        strut2.rotation.z = -0.45;
        scene.add(strut2);
        objects.push(strut2);

        // Green garden boxes on bridge decks
        makeBox(180, 3, 6, 0x448844, bx, 22, bz);
        makeBox(160, 3, 4, 0x336633, bx, 30, bz);

        // Anchor parks at each end
        makeBox(80, 1, 80, 0x557755, bx - 140, 0, bz);
        makeBox(80, 1, 80, 0x557755, bx + 140, 0, bz);
    }

    // ── SA'DABAD PALACE COMPLEX ─────────────────────────────────────────────────
    // Multiple palaces, forests, mountain backdrop, 0x4CAF50
    function buildSaadabadComplex() {
        var gx = 700;
        var gz = -500;

        // Green forested grounds
        makeBox(400, 1, 300, 0x4CAF50, gx, 0, gz);

        // White Palace (main)
        makeBox(60, 14, 40, 0xF5F5F5, gx, 7, gz - 60);
        makeBox(64, 2, 44, 0xEEEEEE, gx, 15, gz - 60);
        // White palace columns
        makeCyl(2, 2, 14, 6, 0xFFFFFF, gx - 25, 7, gz - 82);
        makeCyl(2, 2, 14, 6, 0xFFFFFF, gx - 10, 7, gz - 82);
        makeCyl(2, 2, 14, 6, 0xFFFFFF, gx + 10, 7, gz - 82);
        makeCyl(2, 2, 14, 6, 0xFFFFFF, gx + 25, 7, gz - 82);

        // Green Palace (Sahebqaraniyeh)
        makeBox(50, 12, 35, 0x4CAF50, gx - 120, 6, gz + 20);
        makeSphere(16, 8, 6, 0x388E3C, gx - 120, 22, gz + 20);

        // Black Palace (Museum of Fine Arts) - actually called Abyaz but locally black
        makeBox(45, 10, 30, 0x333333, gx + 120, 5, gz + 30);
        makeBox(47, 2, 32, 0x222222, gx + 120, 11, gz + 30);

        // Forest tree clusters
        makeCyl(4, 4, 16, 6, 0x5C3317, gx - 60, 8, gz + 80);
        makeSphere(14, 6, 5, 0x2E7D32, gx - 60, 22, gz + 80);
        makeCyl(4, 4, 16, 6, 0x5C3317, gx + 60, 8, gz + 80);
        makeSphere(14, 6, 5, 0x2E7D32, gx + 60, 22, gz + 80);
        makeCyl(4, 4, 16, 6, 0x5C3317, gx, 8, gz + 100);
        makeSphere(14, 6, 5, 0x2E7D32, gx, 22, gz + 100);
        makeCyl(4, 4, 18, 6, 0x5C3317, gx - 160, 9, gz - 40);
        makeSphere(16, 6, 5, 0x2E7D32, gx - 160, 24, gz - 40);
        makeCyl(4, 4, 18, 6, 0x5C3317, gx + 160, 9, gz - 40);
        makeSphere(16, 6, 5, 0x2E7D32, gx + 160, 24, gz - 40);

        // Waterfall stream feature
        makeBox(6, 20, 6, 0x4488BB, gx, 10, gz - 110);
        makeBox(20, 2, 8, 0x5599CC, gx, 1, gz - 100);
    }

    // ── GROUND PLATE ────────────────────────────────────────────────────────────
    function buildGroundPlate() {
        // City ground — large flat box
        makeBox(4000, 2, 3000, 0x666655, 0, -1, 0);
        // Road surface hints
        makeBox(20, 0.5, 1000, 0x444444, 0, 0, -200);
        makeBox(1000, 0.5, 20, 0x444444, 0, 0, 0);
        makeBox(20, 0.5, 1000, 0x444444, 200, 0, -200);
    }

    // ── GENERIC CITY BLOCKS ──────────────────────────────────────────────────────
    function buildCityBlocks() {
        var i;
        var positions = [
            [-100, 30, -80],
            [100, 20, -100],
            [-200, 25, 100],
            [300, 35, -150],
            [-350, 18, -200],
            [250, 22, 200],
            [-80, 28, 250],
            [180, 40, -250],
            [-250, 15, 350],
            [350, 20, 300],
            [-400, 32, 0],
            [50, 18, -350],
            [-50, 24, 400],
            [450, 16, -100],
            [-450, 28, 100]
        ];

        for (i = 0; i < positions.length; i++) {
            var p = positions[i];
            makeBox(28, p[1], 28, 0x778888, p[0], p[1] / 2, p[2]);
        }
    }

    function update(delta) {
        // static environment — no per-frame logic needed
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
