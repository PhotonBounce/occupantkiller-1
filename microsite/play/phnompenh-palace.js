window.PhnompenhPalace = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 24600;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(geo, mat, x, y, z, sx, sy, sz, rx, ry, rz) {
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + (x || 0), OY + (y || 0), OZ + (z || 0));
        if (sx !== undefined) mesh.scale.set(sx, sy !== undefined ? sy : 1, sz !== undefined ? sz : 1);
        if (rx !== undefined) mesh.rotation.x = rx;
        if (ry !== undefined) mesh.rotation.y = ry;
        if (rz !== undefined) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function mat(color, opts) {
        var params = { color: color };
        if (opts) {
            if (opts.transparent) params.transparent = true;
            if (opts.opacity !== undefined) params.opacity = opts.opacity;
            if (opts.side !== undefined) params.side = opts.side;
        }
        return new THREE.MeshLambertMaterial(params);
    }

    function build() {
        buildGround();
        buildMekongRiver();
        buildRoyalPalace();
        buildAngkorWatSilhouette();
        buildPhnomHill();
        buildIndependenceMonument();
        buildNationalMuseum();
        buildCentralMarket();
        buildRussianMarket();
        buildPreahAngDuongHospital();
        buildTonleSapFloatingVillages();
        buildPaddleBoats();
        buildRiverMarket();
        buildTrees();
        buildCityBlocks();
    }

    function buildGround() {
        // Ground base platform (using BoxGeometry instead of PlaneGeometry)
        addMesh(new THREE.BoxGeometry(1200, 1, 1200), mat(0x4A7A3A), 0, -0.5, 0);
        // Sandy riverbank
        addMesh(new THREE.BoxGeometry(300, 0.8, 1200), mat(0xD4C89A), 280, -0.4, 0);
        // Road surface Sisowath Quay
        addMesh(new THREE.BoxGeometry(20, 0.5, 600), mat(0x888880), 220, 0.2, 0);
    }

    // ── MEKONG RIVER / TONLE SAP CONFLUENCE ─────────────────────────────────
    function buildMekongRiver() {
        var riverMat = mat(0x2A5A7A);
        // Main Mekong channel
        addMesh(new THREE.BoxGeometry(400, 1, 1200), mat(0x2A5A7A), 500, -1, 0);
        // Tonle Sap tributary
        addMesh(new THREE.BoxGeometry(1200, 1, 200), mat(0x2A607A), 0, -1, -450);
        // River confluence patch
        addMesh(new THREE.BoxGeometry(400, 1, 300), mat(0x2A556E), 350, -1, -300);
        // Water shimmer highlight strips
        addMesh(new THREE.BoxGeometry(380, 0.3, 6), mat(0x4A8AAA), 500, 0, 50);
        addMesh(new THREE.BoxGeometry(380, 0.3, 6), mat(0x4A8AAA), 500, 0, -80);
        addMesh(new THREE.BoxGeometry(380, 0.3, 6), mat(0x4A8AAA), 500, 0, 120);
    }

    // ── ROYAL PALACE COMPLEX ──────────────────────────────────────────────────
    function buildRoyalPalace() {
        var palaceYellow = mat(0xF5EE32);
        var palaceGold = mat(0xE8D820);
        var palaceWhite = mat(0xF0F0E8);
        var roofOrange = mat(0xE8640A);
        var silverMat = mat(0xC8C8C8);
        var wallMat = mat(0xF0ECD0);

        // ── Palace Compound Wall ──
        // North wall
        addMesh(new THREE.BoxGeometry(200, 8, 4), wallMat, 0, 4, -80);
        // South wall
        addMesh(new THREE.BoxGeometry(200, 8, 4), wallMat, 0, 4, 80);
        // East wall
        addMesh(new THREE.BoxGeometry(4, 8, 160), wallMat, 100, 4, 0);
        // West wall
        addMesh(new THREE.BoxGeometry(4, 8, 160), wallMat, -100, 4, 0);

        // ── Throne Hall (Preah Tineang Tevea Vinichhay) ──
        // Main hall base
        addMesh(new THREE.BoxGeometry(60, 10, 30), palaceYellow, 0, 5, 0);
        // Elevated platform / plinth
        addMesh(new THREE.BoxGeometry(66, 3, 36), palaceGold, 0, 1.5, 0);
        // Roof tier 1 (widest)
        addMesh(new THREE.BoxGeometry(66, 4, 36), roofOrange, 0, 13, 0);
        // Roof tier 2
        addMesh(new THREE.BoxGeometry(54, 4, 26), roofOrange, 0, 17, 0);
        // Roof tier 3
        addMesh(new THREE.BoxGeometry(42, 4, 18), roofOrange, 0, 21, 0);
        // Central spire / prasat
        addMesh(new THREE.CylinderGeometry(1.5, 3, 12, 8), palaceGold, 0, 29, 0);
        addMesh(new THREE.ConeGeometry(1.5, 6, 8), palaceGold, 0, 38, 0);
        // Corner spirelets on roof
        addMesh(new THREE.ConeGeometry(1, 5, 6), roofOrange, -28, 23, -14);
        addMesh(new THREE.ConeGeometry(1, 5, 6), roofOrange, 28, 23, -14);
        addMesh(new THREE.ConeGeometry(1, 5, 6), roofOrange, -28, 23, 14);
        addMesh(new THREE.ConeGeometry(1, 5, 6), roofOrange, 28, 23, 14);
        // Entrance portico columns
        addMesh(new THREE.CylinderGeometry(1, 1, 10, 8), palaceWhite, -12, 5, 16);
        addMesh(new THREE.CylinderGeometry(1, 1, 10, 8), palaceWhite, -4, 5, 16);
        addMesh(new THREE.CylinderGeometry(1, 1, 10, 8), palaceWhite, 4, 5, 16);
        addMesh(new THREE.CylinderGeometry(1, 1, 10, 8), palaceWhite, 12, 5, 16);
        // Portico roof
        addMesh(new THREE.BoxGeometry(32, 2, 6), roofOrange, 0, 11, 16);

        // ── Silver Pagoda (Wat Preah Keo) ──
        // Silver tile floor
        addMesh(new THREE.BoxGeometry(40, 0.5, 25), silverMat, -10, 0.2, -50);
        // Main pagoda building
        addMesh(new THREE.BoxGeometry(30, 8, 18), palaceYellow, -10, 4, -50);
        // Pagoda roof tier 1
        addMesh(new THREE.BoxGeometry(34, 3, 22), roofOrange, -10, 10, -50);
        // Pagoda roof tier 2
        addMesh(new THREE.BoxGeometry(26, 3, 16), roofOrange, -10, 13, -50);
        // Pagoda spire
        addMesh(new THREE.CylinderGeometry(0.8, 2, 8, 8), palaceGold, -10, 20, -50);
        addMesh(new THREE.ConeGeometry(0.8, 4, 8), palaceGold, -10, 26, -50);

        // ── Napoleon III Pavilion ──
        // French-style octagonal pavilion
        addMesh(new THREE.CylinderGeometry(8, 8, 8, 8), palaceWhite, 55, 4, -30);
        addMesh(new THREE.ConeGeometry(9, 5, 8), mat(0x7A8A70), 55, 12, -30);
        // Pavilion columns
        addMesh(new THREE.CylinderGeometry(0.5, 0.5, 8, 6), palaceWhite, 47, 4, -30);
        addMesh(new THREE.CylinderGeometry(0.5, 0.5, 8, 6), palaceWhite, 63, 4, -30);
        addMesh(new THREE.CylinderGeometry(0.5, 0.5, 8, 6), palaceWhite, 55, 4, -22);
        addMesh(new THREE.CylinderGeometry(0.5, 0.5, 8, 6), palaceWhite, 55, 4, -38);

        // ── Chan Chaya Pavilion (Moonlight Pavilion) ──
        addMesh(new THREE.BoxGeometry(24, 6, 12), palaceYellow, 40, 3, 40);
        addMesh(new THREE.BoxGeometry(28, 3, 16), roofOrange, 40, 8, 40);
        addMesh(new THREE.BoxGeometry(22, 3, 11), roofOrange, 40, 11, 40);
        addMesh(new THREE.CylinderGeometry(0.6, 1.2, 8, 6), palaceGold, 40, 17, 40);

        // Palace grounds nagas (serpent balustrades)
        addMesh(new THREE.BoxGeometry(40, 2, 2), mat(0xD4A020), 0, 1, 82);
        addMesh(new THREE.SphereGeometry(2, 6, 4), mat(0xD4A020), -20, 2.5, 82);
        addMesh(new THREE.SphereGeometry(2, 6, 4), mat(0xD4A020), 20, 2.5, 82);
    }

    // ── ANGKOR WAT SILHOUETTE ON HORIZON ─────────────────────────────────────
    function buildAngkorWatSilhouette() {
        var templeMat = mat(0x888877);
        var darkMat = mat(0x665566);

        // Horizon base
        addMesh(new THREE.BoxGeometry(400, 20, 40), templeMat, 0, 10, -550);

        // Central tower (tallest)
        addMesh(new THREE.BoxGeometry(30, 80, 30), templeMat, 0, 40, -550);
        addMesh(new THREE.BoxGeometry(22, 20, 22), templeMat, 0, 90, -550);
        addMesh(new THREE.ConeGeometry(12, 40, 4), templeMat, 0, 120, -550);

        // Inner corner towers (4)
        addMesh(new THREE.BoxGeometry(20, 55, 20), templeMat, -55, 27, -550);
        addMesh(new THREE.ConeGeometry(9, 28, 4), templeMat, -55, 82, -550);
        addMesh(new THREE.BoxGeometry(20, 55, 20), templeMat, 55, 27, -550);
        addMesh(new THREE.ConeGeometry(9, 28, 4), templeMat, 55, 82, -550);
        addMesh(new THREE.BoxGeometry(16, 42, 16), templeMat, -110, 21, -550);
        addMesh(new THREE.ConeGeometry(7, 22, 4), templeMat, -110, 62, -550);
        addMesh(new THREE.BoxGeometry(16, 42, 16), templeMat, 110, 21, -550);
        addMesh(new THREE.ConeGeometry(7, 22, 4), templeMat, 110, 62, -550);

        // Moat (water)
        addMesh(new THREE.BoxGeometry(500, 2, 60), mat(0x2A4A6A), 0, -1, -510);

        // Causeway (road across moat)
        addMesh(new THREE.BoxGeometry(20, 1, 60), mat(0xAAA890), 0, 0.5, -510);

        // Gallery walls
        addMesh(new THREE.BoxGeometry(260, 12, 8), templeMat, 0, 6, -534);
        addMesh(new THREE.BoxGeometry(260, 12, 8), templeMat, 0, 6, -566);
        addMesh(new THREE.BoxGeometry(8, 12, 40), templeMat, -130, 6, -550);
        addMesh(new THREE.BoxGeometry(8, 12, 40), templeMat, 130, 6, -550);
    }

    // ── PHNOM (HILL) WITH WAT PHNOM ──────────────────────────────────────────
    function buildPhnomHill() {
        var hillMat = mat(0xD4A850);
        var grassMat = mat(0x5A8A40);
        var pagodaMat = mat(0xF5EE32);
        var stupaMat = mat(0xD4A870);

        // The hill itself — truncated cone
        addMesh(new THREE.CylinderGeometry(30, 60, 25, 12), hillMat, -180, 12, -100);
        // Greenery cap
        addMesh(new THREE.CylinderGeometry(32, 35, 5, 12), grassMat, -180, 26, -100);

        // Staircase east side
        addMesh(new THREE.BoxGeometry(8, 25, 30), mat(0xB89060), -155, 12, -100);

        // Wat Phnom pagoda
        addMesh(new THREE.BoxGeometry(18, 8, 14), pagodaMat, -180, 29, -100);
        addMesh(new THREE.BoxGeometry(22, 3, 18), mat(0xE8640A), -180, 35, -100);
        addMesh(new THREE.BoxGeometry(16, 3, 12), mat(0xE8640A), -180, 38, -100);
        addMesh(new THREE.CylinderGeometry(1, 2.5, 10, 8), stupaMat, -180, 46, -100);
        addMesh(new THREE.SphereGeometry(1.5, 8, 6), stupaMat, -180, 53, -100);
        addMesh(new THREE.CylinderGeometry(0.3, 0.8, 6, 6), mat(0xF5EE32), -180, 57, -100);

        // Stupa with ashes of King Ponhea Yat
        addMesh(new THREE.CylinderGeometry(5, 7, 10, 8), stupaMat, -165, 28, -110);
        addMesh(new THREE.SphereGeometry(5, 8, 6), stupaMat, -165, 38, -110);
        addMesh(new THREE.CylinderGeometry(0.8, 1.5, 8, 6), stupaMat, -165, 47, -110);
        addMesh(new THREE.ConeGeometry(0.8, 4, 6), stupaMat, -165, 53, -110);
    }

    // ── INDEPENDENCE MONUMENT ─────────────────────────────────────────────────
    function buildIndependenceMonument() {
        var monMat = mat(0xD4A870);
        var nagaMat = mat(0xC89050);

        // Five-tier base
        addMesh(new THREE.CylinderGeometry(12, 14, 3, 12), monMat, -80, 1.5, 60);
        addMesh(new THREE.CylinderGeometry(10, 12, 3, 12), monMat, -80, 4.5, 60);
        addMesh(new THREE.CylinderGeometry(8, 10, 3, 12), monMat, -80, 7.5, 60);
        addMesh(new THREE.CylinderGeometry(6, 8, 3, 12), monMat, -80, 10.5, 60);
        addMesh(new THREE.CylinderGeometry(4, 6, 3, 12), monMat, -80, 13.5, 60);
        // Lotus bud stupa
        addMesh(new THREE.CylinderGeometry(3, 4, 8, 10), monMat, -80, 19, 60);
        addMesh(new THREE.SphereGeometry(3, 10, 8), monMat, -80, 26, 60);
        addMesh(new THREE.CylinderGeometry(0.8, 2, 6, 8), monMat, -80, 32, 60);
        addMesh(new THREE.ConeGeometry(0.8, 4, 8), mat(0xF5EE32), -80, 37, 60);

        // Naga serpent decorations at base
        addMesh(new THREE.SphereGeometry(2, 6, 4), nagaMat, -67, 3, 60);
        addMesh(new THREE.SphereGeometry(2, 6, 4), nagaMat, -93, 3, 60);
        addMesh(new THREE.SphereGeometry(2, 6, 4), nagaMat, -80, 3, 47);
        addMesh(new THREE.SphereGeometry(2, 6, 4), nagaMat, -80, 3, 73);

        // Surrounding park platform
        addMesh(new THREE.BoxGeometry(60, 0.5, 60), mat(0xC8C0A0), -80, 0.2, 60);
    }

    // ── NATIONAL MUSEUM OF CAMBODIA ───────────────────────────────────────────
    function buildNationalMuseum() {
        var terracotta = mat(0xCC6644);
        var roofMat = mat(0xAA4422);

        // Main building quadrangle
        addMesh(new THREE.BoxGeometry(50, 12, 40), terracotta, -50, 6, -30);
        // Khmer-style roof
        addMesh(new THREE.BoxGeometry(54, 5, 44), roofMat, -50, 14.5, -30);
        addMesh(new THREE.BoxGeometry(46, 5, 36), roofMat, -50, 19.5, -30);
        // Central tower
        addMesh(new THREE.CylinderGeometry(4, 6, 14, 8), terracotta, -50, 27, -30);
        addMesh(new THREE.ConeGeometry(4, 8, 8), roofMat, -50, 38, -30);
        // Corner towers (4)
        addMesh(new THREE.CylinderGeometry(2, 3, 8, 8), terracotta, -76, 16, -51);
        addMesh(new THREE.ConeGeometry(2, 4, 8), roofMat, -76, 24, -51);
        addMesh(new THREE.CylinderGeometry(2, 3, 8, 8), terracotta, -24, 16, -51);
        addMesh(new THREE.ConeGeometry(2, 4, 8), roofMat, -24, 16, -51);
        // Courtyard interior (sunken)
        addMesh(new THREE.BoxGeometry(30, 0.5, 22), mat(0xD4C8A8), -50, 0.2, -30);
    }

    // ── CENTRAL MARKET (PSAR THMEI) ───────────────────────────────────────────
    function buildCentralMarket() {
        var domeYellow = mat(0xD4C8A0);
        var wingMat = mat(0xC8BC94);

        // Central Art Deco dome
        addMesh(new THREE.SphereGeometry(18, 12, 8), domeYellow, 80, 15, 80);
        // Dome drum/base
        addMesh(new THREE.CylinderGeometry(18, 20, 10, 12), domeYellow, 80, 5, 80);

        // Four wings radiating outward (N, S, E, W)
        addMesh(new THREE.BoxGeometry(80, 8, 16), wingMat, 120, 4, 80);   // east
        addMesh(new THREE.BoxGeometry(80, 8, 16), wingMat, 40, 4, 80);    // west
        addMesh(new THREE.BoxGeometry(16, 8, 80), wingMat, 80, 4, 120);   // south
        addMesh(new THREE.BoxGeometry(16, 8, 80), wingMat, 80, 4, 40);    // north

        // Wing roofs
        addMesh(new THREE.BoxGeometry(84, 3, 18), mat(0xB8AC88), 120, 10, 80);
        addMesh(new THREE.BoxGeometry(84, 3, 18), mat(0xB8AC88), 40, 4, 80);
        addMesh(new THREE.BoxGeometry(18, 3, 84), mat(0xB8AC88), 80, 10, 120);
        addMesh(new THREE.BoxGeometry(18, 3, 84), mat(0xB8AC88), 80, 10, 40);
    }

    // ── RUSSIAN MARKET (TUOL TOM POUNG) ──────────────────────────────────────
    function buildRussianMarket() {
        var stallMat = mat(0xC8A870);
        var roofTin = mat(0x909080);

        // Market hall structure
        addMesh(new THREE.BoxGeometry(60, 5, 50), stallMat, 100, 2.5, -80);
        // Tin roof
        addMesh(new THREE.BoxGeometry(64, 3, 54), roofTin, 100, 6.5, -80);
        // Interior stall rows (dense packing)
        addMesh(new THREE.BoxGeometry(55, 3, 4), stallMat, 100, 1.5, -68);
        addMesh(new THREE.BoxGeometry(55, 3, 4), stallMat, 100, 1.5, -78);
        addMesh(new THREE.BoxGeometry(55, 3, 4), stallMat, 100, 1.5, -88);
        addMesh(new THREE.BoxGeometry(55, 3, 4), stallMat, 100, 1.5, -98);
        // Entrance arch
        addMesh(new THREE.BoxGeometry(14, 8, 3), stallMat, 100, 4, -57);
        addMesh(new THREE.SphereGeometry(3, 6, 4), roofTin, 100, 9, -57);
    }

    // ── PREAH ANG DUONG HOSPITAL (FRENCH COLONIAL) ───────────────────────────
    function buildPreahAngDuongHospital() {
        var colonialMat = mat(0xCCCCBB);
        var shutterMat = mat(0x6A8A5A);

        // Main colonial building
        addMesh(new THREE.BoxGeometry(60, 12, 20), colonialMat, -120, 6, 80);
        // Pitched roof
        addMesh(new THREE.BoxGeometry(64, 5, 24), mat(0x887766), -120, 15, 80);
        addMesh(new THREE.BoxGeometry(56, 5, 18), mat(0x887766), -120, 20, 80);
        // Colonnaded verandah
        addMesh(new THREE.BoxGeometry(60, 10, 5), colonialMat, -120, 5, 92);
        addMesh(new THREE.BoxGeometry(64, 2, 7), mat(0xBBBBAA), -120, 10.5, 92);
        // Verandah columns
        addMesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 8), colonialMat, -96, 5, 93);
        addMesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 8), colonialMat, -108, 5, 93);
        addMesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 8), colonialMat, -120, 5, 93);
        addMesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 8), colonialMat, -132, 5, 93);
        addMesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 8), colonialMat, -144, 5, 93);
    }

    // ── TONLE SAP FLOATING VILLAGES ───────────────────────────────────────────
    function buildTonleSapFloatingVillages() {
        var woodMat = mat(0x8A6A30);
        var thatched = mat(0xB8962A);
        var waterMat = mat(0x2A5070);

        // Floating village water patch
        addMesh(new THREE.BoxGeometry(200, 0.5, 100), waterMat, -200, -0.5, -300);

        // House on stilts / boat cluster 1
        addMesh(new THREE.BoxGeometry(10, 5, 6), woodMat, -160, 2.5, -280);
        addMesh(new THREE.BoxGeometry(12, 2, 8), thatched, -160, 6, -280);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 6), woodMat, -157, -1, -277);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 6), woodMat, -157, -1, -283);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 6), woodMat, -163, -1, -277);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 6), woodMat, -163, -1, -283);

        // House cluster 2
        addMesh(new THREE.BoxGeometry(10, 5, 6), woodMat, -200, 2.5, -290);
        addMesh(new THREE.BoxGeometry(12, 2, 8), thatched, -200, 6, -290);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 6), woodMat, -197, -1, -287);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 6), woodMat, -197, -1, -293);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 6), woodMat, -203, -1, -287);

        // House cluster 3
        addMesh(new THREE.BoxGeometry(10, 5, 6), woodMat, -230, 2.5, -310);
        addMesh(new THREE.BoxGeometry(12, 2, 8), thatched, -230, 6, -310);

        // Floating platform / dock
        addMesh(new THREE.BoxGeometry(30, 1, 10), woodMat, -185, 0.5, -320);

        // Fishermen's net poles
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 10, 6), woodMat, -175, 5, -315);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 10, 6), woodMat, -170, 5, -320);
    }

    // ── PADDLE BOATS AND RIVER MARKET ─────────────────────────────────────────
    function buildPaddleBoats() {
        var boatMat = mat(0x8A5020);
        var sailMat = mat(0xF0E8C8);
        var canopyMat = mat(0xC83020);

        // Paddle boat 1
        addMesh(new THREE.BoxGeometry(12, 2, 4), boatMat, 320, 0, -50);
        addMesh(new THREE.BoxGeometry(10, 3, 3), canopyMat, 320, 3, -50);
        // Paddle wheel (side cylinder)
        addMesh(new THREE.CylinderGeometry(2, 2, 1.5, 8), boatMat, 326, 0, -50);

        // Paddle boat 2
        addMesh(new THREE.BoxGeometry(12, 2, 4), boatMat, 380, 0, 80);
        addMesh(new THREE.BoxGeometry(10, 3, 3), mat(0x204080), 380, 3, 80);

        // Traditional wooden boat
        addMesh(new THREE.BoxGeometry(16, 1.5, 3), mat(0x6A4010), 350, 0, 30);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 14, 6), mat(0x5A3A10), 350, 7, 30);
        addMesh(new THREE.BoxGeometry(10, 0.3, 8), sailMat, 350, 9, 30);
    }

    function buildRiverMarket() {
        var marketMat = mat(0xC8A050);
        var awningMat = mat(0xC83020);

        // River market pontoon stalls
        addMesh(new THREE.BoxGeometry(40, 2, 15), mat(0x7A5820), 290, 1, -150);
        addMesh(new THREE.BoxGeometry(10, 4, 8), marketMat, 276, 3, -150);
        addMesh(new THREE.BoxGeometry(12, 1, 10), awningMat, 276, 5.5, -150);
        addMesh(new THREE.BoxGeometry(10, 4, 8), marketMat, 290, 3, -150);
        addMesh(new THREE.BoxGeometry(12, 1, 10), awningMat, 290, 5.5, -150);
        addMesh(new THREE.BoxGeometry(10, 4, 8), marketMat, 304, 3, -150);
        addMesh(new THREE.BoxGeometry(12, 1, 10), mat(0x204890), 304, 5.5, -150);
    }

    // ── PALM TREES AND VEGETATION ─────────────────────────────────────────────
    function buildTrees() {
        var trunkMat = mat(0x7A5A20);
        var frondMat = mat(0x3A7A20);
        var darkGreen = mat(0x2A6010);

        var treePositions = [
            [-30, 0, -90], [30, 0, -90], [70, 0, -90],
            [-70, 0, 50], [-60, 0, -50], [50, 0, -20],
            [-190, 0, -80], [-210, 0, -120], [-170, 0, -130],
            [150, 0, 30], [160, 0, -10], [140, 0, 60],
            [190, 0, 100], [60, 0, 100], [-50, 0, 100]
        ];

        for (var i = 0; i < treePositions.length; i++) {
            var tp = treePositions[i];
            // Trunk
            addMesh(new THREE.CylinderGeometry(0.5, 0.8, 10, 6), trunkMat, tp[0], 5, tp[2]);
            // Canopy
            addMesh(new THREE.SphereGeometry(4, 6, 4), frondMat, tp[0], 12, tp[2]);
        }

        // Banyan trees near palace
        addMesh(new THREE.CylinderGeometry(1.5, 2, 8, 8), trunkMat, -95, 4, -60);
        addMesh(new THREE.SphereGeometry(7, 6, 4), darkGreen, -95, 12, -60);
        addMesh(new THREE.CylinderGeometry(1.5, 2, 8, 8), trunkMat, 95, 4, -60);
        addMesh(new THREE.SphereGeometry(7, 6, 4), darkGreen, 95, 12, -60);
    }

    // ── CITY BLOCKS (background buildings) ───────────────────────────────────
    function buildCityBlocks() {
        var buildingMat = mat(0xD4C8B0);
        var building2 = mat(0xC0B4A0);
        var building3 = mat(0xBAAA94);

        // Phnom Penh city block silhouettes
        addMesh(new THREE.BoxGeometry(20, 18, 15), buildingMat, 140, 9, -80);
        addMesh(new THREE.BoxGeometry(18, 24, 12), building2, 165, 12, -70);
        addMesh(new THREE.BoxGeometry(15, 14, 14), building3, 150, 7, -100);
        addMesh(new THREE.BoxGeometry(22, 20, 16), buildingMat, -130, 10, -160);
        addMesh(new THREE.BoxGeometry(16, 16, 14), building2, -145, 8, -180);
        addMesh(new THREE.BoxGeometry(20, 12, 18), building3, -115, 6, -175);
        addMesh(new THREE.BoxGeometry(18, 22, 13), buildingMat, 50, 11, 140);
        addMesh(new THREE.BoxGeometry(14, 18, 12), building2, 70, 9, 155);
        addMesh(new THREE.BoxGeometry(22, 14, 16), building3, -40, 7, 145);
    }

    function update(delta) {
        // Future: animate river, boats, flags
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
