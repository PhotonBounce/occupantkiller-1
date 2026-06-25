window.LisbonBelem = (function() {
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
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function build() {
        buildTagusRiver();
        buildBelemTower();
        buildJeronimoMonastery();
        buildMonumentDiscoveries();
        build25DeAbrilBridge();
        buildChristKingStatue();
        buildAlfamaDistrict();
        buildPracaDoComercio();
        buildTrams();
        buildCityscape();
    }

    // ─── TAGUS RIVER ─────────────────────────────────────────────────────────────
    function buildTagusRiver() {
        // Main river body — wide flat estuary
        makeBox(6000, 2, 3000, 0x006994, 22600, -1, 600);
        // River shimmer highlights — lighter patches
        makeBox(1200, 2, 500, 0x1A7DB5, 22200, -0.5, 200);
        makeBox(900, 2, 400, 0x1A7DB5, 23100, -0.5, 700);
        makeBox(1500, 2, 350, 0x0D5F80, 22600, -0.5, 400);

        // Ferry — small boxy vessel
        makeBox(60, 14, 24, 0xFFFFFF, 22350, 6, 120);
        makeBox(55, 6, 20, 0x1155AA, 22350, 16, 120);
        makeCyl(3, 3, 20, 8, 0x333333, 22350, 26, 120);

        // Cargo ship — long hull
        makeBox(180, 18, 40, 0x444444, 22900, 8, 300);
        makeBox(160, 10, 36, 0x882222, 22900, 22, 300);
        makeCyl(5, 5, 30, 8, 0x222222, 22860, 37, 295);
        makeCyl(5, 5, 30, 8, 0x222222, 22940, 37, 305);

        // Sailing boat
        makeBox(30, 8, 10, 0xCCCCCC, 22500, 3, 500);
        makeCyl(1, 1, 40, 6, 0x884400, 22500, 23, 500);
        makeBox(1, 30, 14, 0xFFFFEE, 22500, 23, 500);
    }

    // ─── BELÉM TOWER ─────────────────────────────────────────────────────────────
    function buildBelemTower() {
        var bx = 22600;
        var by = 0;
        var bz = -120;
        var cream = 0xF5F5DC;
        var stone = 0xDDDDBB;

        // Base platform / lower bastion (hexagonal approximated with box)
        makeBox(70, 8, 60, stone, bx, by + 4, bz);
        // Bastion corner turrets (4 small round towers at corners of bastion)
        makeCyl(6, 6, 18, 8, cream, bx - 28, by + 9, bz - 22);
        makeCyl(6, 6, 18, 8, cream, bx + 28, by + 9, bz - 22);
        makeCyl(6, 6, 18, 8, cream, bx - 28, by + 9, bz + 22);
        makeCyl(6, 6, 18, 8, cream, bx + 28, by + 9, bz + 22);
        // Bastion turret conical caps
        makeCone(7, 12, 8, stone, bx - 28, by + 24, bz - 22);
        makeCone(7, 12, 8, stone, bx + 28, by + 24, bz - 22);
        makeCone(7, 12, 8, stone, bx - 28, by + 24, bz + 22);
        makeCone(7, 12, 8, stone, bx + 28, by + 24, bz + 22);

        // Main tower body — 4 storeys
        makeBox(30, 20, 28, cream, bx, by + 18, bz);  // 1st storey
        makeBox(28, 20, 26, cream, bx, by + 38, bz);  // 2nd storey
        makeBox(26, 20, 24, cream, bx, by + 58, bz);  // 3rd storey
        makeBox(24, 20, 22, cream, bx, by + 78, bz);  // 4th storey / top

        // Balcony / loggia — protruding ledge on south face
        makeBox(32, 4, 4, cream, bx, by + 44, bz + 15);
        makeBox(32, 4, 4, cream, bx, by + 64, bz + 15);
        // Balustrade pillars on balcony
        makeCyl(1, 1, 6, 6, stone, bx - 12, by + 47, bz + 17);
        makeCyl(1, 1, 6, 6, stone, bx - 4, by + 47, bz + 17);
        makeCyl(1, 1, 6, 6, stone, bx + 4, by + 47, bz + 17);
        makeCyl(1, 1, 6, 6, stone, bx + 12, by + 47, bz + 17);
        makeCyl(1, 1, 6, 6, stone, bx - 12, by + 67, bz + 17);
        makeCyl(1, 1, 6, 6, stone, bx - 4, by + 67, bz + 17);
        makeCyl(1, 1, 6, 6, stone, bx + 4, by + 67, bz + 17);
        makeCyl(1, 1, 6, 6, stone, bx + 12, by + 67, bz + 17);

        // Battlements / merlons on top
        makeBox(4, 6, 22, cream, bx - 14, by + 92, bz);
        makeBox(4, 6, 22, cream, bx + 14, by + 92, bz);
        makeBox(24, 6, 4, cream, bx, by + 92, bz - 12);
        makeBox(24, 6, 4, cream, bx, by + 92, bz + 12);

        // Corner turrets on main tower
        makeCyl(5, 5, 40, 8, cream, bx - 13, by + 68, bz - 12);
        makeCyl(5, 5, 40, 8, cream, bx + 13, by + 68, bz - 12);
        makeCyl(5, 5, 40, 8, cream, bx - 13, by + 68, bz + 12);
        makeCyl(5, 5, 40, 8, cream, bx + 13, by + 68, bz + 12);
        // Conical caps on corner turrets
        makeCone(6, 10, 8, stone, bx - 13, by + 94, bz - 12);
        makeCone(6, 10, 8, stone, bx + 13, by + 94, bz - 12);
        makeCone(6, 10, 8, stone, bx - 13, by + 94, bz + 12);
        makeCone(6, 10, 8, stone, bx + 13, by + 94, bz + 12);

        // Main tower pyramidal roof
        makeCone(16, 22, 8, stone, bx, by + 102, bz);

        // Rhinoceros gargoyle approximation (small box protrusion)
        makeBox(6, 4, 8, stone, bx - 18, by + 30, bz + 14);
        makeCone(2, 5, 4, stone, bx - 18, by + 34, bz + 18);

        // Ornate window frames (decorative boxes on facade)
        makeBox(8, 10, 2, 0xCCCCAA, bx - 6, by + 28, bz + 15);
        makeBox(8, 10, 2, 0xCCCCAA, bx + 6, by + 28, bz + 15);
        makeBox(8, 10, 2, 0xCCCCAA, bx, by + 48, bz + 14);
        makeBox(8, 10, 2, 0xCCCCAA, bx, by + 68, bz + 14);
    }

    // ─── JERÓNIMOS MONASTERY ─────────────────────────────────────────────────────
    function buildJeronimoMonastery() {
        var mx = 22300;
        var my = 0;
        var mz = -350;
        var cream = 0xF5F5DC;
        var stone = 0xDDDDBB;

        // Long south facade — main body
        makeBox(300, 40, 30, cream, mx, my + 20, mz);
        // Facade second level / clerestory
        makeBox(280, 20, 24, cream, mx, my + 50, mz);

        // Main south portal — ornate entrance (central projection)
        makeBox(30, 50, 10, stone, mx, my + 25, mz + 16);
        makeBox(28, 8, 8, 0xCCCCAA, mx, my + 52, mz + 18);
        // Portal arch
        makeCyl(14, 14, 6, 12, stone, mx, my + 54, mz + 16);

        // West tower
        makeCyl(18, 18, 80, 8, cream, mx - 158, my + 40, mz);
        makeCone(20, 28, 8, stone, mx - 158, my + 94, mz);
        // Dome on west tower
        makeSphere(16, 10, 8, cream, mx - 158, my + 82, mz);

        // East tower
        makeCyl(18, 18, 80, 8, cream, mx + 158, my + 40, mz);
        makeCone(20, 28, 8, stone, mx + 158, my + 94, mz);
        makeSphere(16, 10, 8, cream, mx + 158, my + 82, mz);

        // Church nave behind south facade
        makeBox(60, 60, 120, cream, mx, my + 30, mz - 75);
        // Church crossing dome
        makeSphere(28, 12, 10, cream, mx, my + 76, mz - 75);
        makeCyl(8, 8, 20, 10, cream, mx, my + 60, mz - 75);

        // Cloister (north side of church) — two-storey square arcade
        makeBox(120, 16, 6, stone, mx - 57, my + 8, mz - 140);   // south cloister wall
        makeBox(120, 16, 6, stone, mx - 57, my + 8, mz - 200);   // north cloister wall
        makeBox(6, 16, 60, stone, mx - 117, my + 8, mz - 170);   // west cloister wall
        makeBox(6, 16, 60, stone, mx + 3, my + 8, mz - 170);     // east cloister wall
        // Upper cloister gallery
        makeBox(120, 10, 5, stone, mx - 57, my + 22, mz - 140);
        makeBox(120, 10, 5, stone, mx - 57, my + 22, mz - 200);
        makeBox(5, 10, 60, stone, mx - 117, my + 22, mz - 170);
        makeBox(5, 10, 60, stone, mx + 3, my + 22, mz - 170);

        // Cloister columns
        makeCyl(2, 2, 16, 6, stone, mx - 90, my + 8, mz - 143);
        makeCyl(2, 2, 16, 6, stone, mx - 70, my + 8, mz - 143);
        makeCyl(2, 2, 16, 6, stone, mx - 50, my + 8, mz - 143);
        makeCyl(2, 2, 16, 6, stone, mx - 30, my + 8, mz - 143);
        makeCyl(2, 2, 16, 6, stone, mx - 90, my + 8, mz - 197);
        makeCyl(2, 2, 16, 6, stone, mx - 70, my + 8, mz - 197);
        makeCyl(2, 2, 16, 6, stone, mx - 50, my + 8, mz - 197);
        makeCyl(2, 2, 16, 6, stone, mx - 30, my + 8, mz - 197);

        // Decorative pinnacles / spires on facade
        makeCone(3, 18, 6, stone, mx - 120, my + 58, mz + 2);
        makeCone(3, 18, 6, stone, mx - 60, my + 58, mz + 2);
        makeCone(3, 18, 6, stone, mx, my + 62, mz + 2);
        makeCone(3, 18, 6, stone, mx + 60, my + 58, mz + 2);
        makeCone(3, 18, 6, stone, mx + 120, my + 58, mz + 2);
    }

    // ─── MONUMENT TO DISCOVERIES ─────────────────────────────────────────────────
    function buildMonumentDiscoveries() {
        var px = 22600;
        var py = 0;
        var pz = -240;
        var grey = 0xD3D3D3;
        var darkGrey = 0xA9A9A9;

        // Base plinth / stepped platform
        makeBox(40, 6, 20, darkGrey, px, py + 3, pz);
        makeBox(30, 4, 16, grey, px, py + 8, pz);

        // Main prow / sail-shaped body — tall tapered slab
        makeBox(10, 80, 16, grey, px, py + 45, pz);
        // Prow tapered top
        makeCone(8, 30, 4, grey, px, py + 99, pz);

        // Henry the Navigator figure at front
        makeBox(6, 18, 6, grey, px, py + 12, pz + 10);
        makeSphere(3, 8, 6, grey, px, py + 23, pz + 10);
        // Arms holding sphere/gift — small box
        makeBox(10, 3, 3, grey, px, py + 18, pz + 10);

        // Explorers arranged behind in two rows on sloping sides
        // Left side figures
        makeBox(4, 14, 4, darkGrey, px - 6, py + 8, pz + 2);
        makeSphere(2, 6, 5, darkGrey, px - 6, py + 16, pz + 2);
        makeBox(4, 14, 4, darkGrey, px - 12, py + 8, pz - 2);
        makeSphere(2, 6, 5, darkGrey, px - 12, py + 16, pz - 2);
        makeBox(4, 14, 4, darkGrey, px - 18, py + 8, pz - 4);
        makeSphere(2, 6, 5, darkGrey, px - 18, py + 16, pz - 4);

        // Right side figures
        makeBox(4, 14, 4, darkGrey, px + 6, py + 8, pz + 2);
        makeSphere(2, 6, 5, darkGrey, px + 6, py + 16, pz + 2);
        makeBox(4, 14, 4, darkGrey, px + 12, py + 8, pz - 2);
        makeSphere(2, 6, 5, darkGrey, px + 12, py + 16, pz - 2);
        makeBox(4, 14, 4, darkGrey, px + 18, py + 8, pz - 4);
        makeSphere(2, 6, 5, darkGrey, px + 18, py + 16, pz - 4);

        // Rose compass on ground in front
        makeBox(30, 1, 30, 0xCCBBAA, px, py + 0.5, pz + 30);
    }

    // ─── 25 DE ABRIL BRIDGE ──────────────────────────────────────────────────────
    function build25DeAbrilBridge() {
        var bx = 22600;
        var by = 0;
        var bz = 700;
        var red = 0xCC2200;
        var grey = 0x666666;

        // Bridge deck — long span
        makeBox(1800, 6, 22, red, bx, by + 70, bz);
        // Bridge deck continuation
        makeBox(400, 6, 22, red, bx - 1100, by + 50, bz);
        makeBox(400, 6, 22, red, bx + 1100, by + 50, bz);

        // North main tower (two pylons)
        makeBox(12, 180, 12, red, bx - 300, by + 90, bz - 10);
        makeBox(12, 180, 12, red, bx - 300, by + 90, bz + 10);
        // Cross beam between north pylons
        makeBox(12, 12, 32, red, bx - 300, by + 170, bz);

        // South main tower
        makeBox(12, 180, 12, red, bx + 300, by + 90, bz - 10);
        makeBox(12, 180, 12, red, bx + 300, by + 90, bz + 10);
        makeBox(12, 12, 32, red, bx + 300, by + 170, bz);

        // Suspension cables — diagonal boxes from towers to deck
        makeBox(320, 4, 3, grey, bx - 140, by + 120, bz - 10);
        makeBox(320, 4, 3, grey, bx - 140, by + 120, bz + 10);
        makeBox(320, 4, 3, grey, bx + 140, by + 120, bz - 10);
        makeBox(320, 4, 3, grey, bx + 140, by + 120, bz + 10);

        // Anchor / approach piers
        makeCyl(10, 12, 60, 8, grey, bx - 700, by + 30, bz);
        makeCyl(10, 12, 60, 8, grey, bx + 700, by + 30, bz);
        makeCyl(8, 10, 40, 8, grey, bx - 500, by + 20, bz);
        makeCyl(8, 10, 40, 8, grey, bx + 500, by + 20, bz);
    }

    // ─── CHRIST THE KING STATUE ──────────────────────────────────────────────────
    function buildChristKingStatue() {
        var cx = 23200;
        var cy = 0;
        var cz = 900;
        var cream = 0xF5F5DC;
        var stone = 0xDDDDBB;

        // Hill / pedestal base on south bank
        makeCyl(60, 80, 50, 0x88AA66, cx, cy + 25, cz);
        // Tall pedestal
        makeBox(30, 100, 30, stone, cx, cy + 100, cz);
        makeBox(24, 20, 24, stone, cx, cy + 158, cz);

        // Statue body
        makeBox(10, 40, 8, cream, cx, cy + 188, cz);
        // Outstretched arms
        makeBox(60, 6, 6, cream, cx, cy + 198, cz);
        // Head
        makeSphere(6, 8, 6, cream, cx, cy + 214, cz);
    }

    // ─── ALFAMA DISTRICT ─────────────────────────────────────────────────────────
    function buildAlfamaDistrict() {
        var ax = 22900;
        var ay = 0;
        var az = -500;
        var orange = 0xCC7722;
        var tile = 0x3366AA;
        var terracotta = 0xCC5533;

        // Hillside — sloped terrain approximation
        makeBox(300, 20, 200, 0x998855, ax, ay + 10, az);

        // Alfama houses — irregular cluster
        makeBox(30, 24, 20, orange, ax - 80, ay + 12, az - 20);
        makeBox(25, 28, 18, 0xBB6611, ax - 50, ay + 14, az + 10);
        makeBox(28, 20, 22, terracotta, ax - 20, ay + 10, az - 30);
        makeBox(32, 26, 20, orange, ax + 10, ay + 13, az + 5);
        makeBox(24, 22, 18, 0xAA6622, ax + 40, ay + 11, az - 15);
        makeBox(30, 30, 22, terracotta, ax + 70, ay + 15, az + 20);
        makeBox(26, 24, 20, orange, ax - 100, ay + 12, az + 30);
        makeBox(22, 18, 16, 0xBB7733, ax + 100, ay + 9, az - 10);
        makeBox(28, 26, 20, terracotta, ax - 60, ay + 13, az + 50);
        makeBox(30, 22, 18, orange, ax + 60, ay + 11, az + 45);

        // Azulejo tile accents on house fronts (blue boxes)
        makeBox(26, 16, 2, tile, ax - 80, ay + 16, az - 9);
        makeBox(22, 16, 2, tile, ax - 50, ay + 18, az + 19);
        makeBox(24, 16, 2, tile, ax + 10, ay + 17, az + 15);
        makeBox(20, 14, 2, tile, ax + 70, ay + 19, az + 30);

        // São Jorge Castle on hilltop
        makeBox(80, 10, 60, 0xAA9966, ax, ay + 50, az - 60);
        makeBox(6, 20, 6, 0xAA9966, ax - 35, ay + 55, az - 30);
        makeBox(6, 20, 6, 0xAA9966, ax + 35, ay + 55, az - 30);
        makeBox(6, 20, 6, 0xAA9966, ax - 35, ay + 55, az - 90);
        makeBox(6, 20, 6, 0xAA9966, ax + 35, ay + 55, az - 90);
        // Castle keep
        makeCyl(12, 12, 36, 8, 0xAA9966, ax, ay + 68, az - 60);
        makeCone(13, 14, 8, 0x997744, ax, ay + 90, az - 60);

        // Narrow cobblestone streets (dark paths between buildings)
        makeBox(8, 1, 80, 0x776655, ax - 30, ay + 0.5, az + 10);
        makeBox(60, 1, 8, 0x776655, ax, ay + 0.5, az + 20);
    }

    // ─── PRAÇA DO COMÉRCIO ───────────────────────────────────────────────────────
    function buildPracaDoComercio() {
        var px = 22800;
        var py = 0;
        var pz = -180;
        var cream = 0xF5F0E8;
        var yellow = 0xDDAA44;
        var bronze = 0x8B6914;

        // Grand plaza paving
        makeBox(200, 2, 160, cream, px, py + 1, pz);

        // Arcaded buildings on three sides
        // North building (rear)
        makeBox(200, 35, 30, 0xE8D8C0, px, py + 17, pz - 80);
        // East wing
        makeBox(30, 35, 160, 0xE8D8C0, px + 115, py + 17, pz);
        // West wing
        makeBox(30, 35, 160, 0xE8D8C0, px - 115, py + 17, pz);

        // Arcade columns on north building
        makeCyl(3, 3, 22, 8, 0xDDCCBB, px - 80, py + 11, pz - 65);
        makeCyl(3, 3, 22, 8, 0xDDCCBB, px - 40, py + 11, pz - 65);
        makeCyl(3, 3, 22, 8, 0xDDCCBB, px, py + 11, pz - 65);
        makeCyl(3, 3, 22, 8, 0xDDCCBB, px + 40, py + 11, pz - 65);
        makeCyl(3, 3, 22, 8, 0xDDCCBB, px + 80, py + 11, pz - 65);

        // Triumphal arch — central arch on north building
        makeBox(30, 50, 12, 0xE8D8C0, px, py + 25, pz - 80);
        makeCyl(13, 13, 10, 12, 0xE8D8C0, px, py + 56, pz - 80);
        makeBox(30, 10, 12, cream, px, py + 65, pz - 80);
        // Arch sculptures on top
        makeBox(8, 12, 8, bronze, px - 10, py + 72, pz - 80);
        makeSphere(4, 6, 5, bronze, px - 10, py + 80, pz - 80);
        makeBox(8, 12, 8, bronze, px + 10, py + 72, pz - 80);
        makeSphere(4, 6, 5, bronze, px + 10, py + 80, pz - 80);

        // Equestrian statue of King José I (central to the plaza)
        makeBox(10, 8, 20, 0x996633, px, py + 4, pz);  // horse body
        makeSphere(4, 6, 5, 0x996633, px, py + 14, pz - 6); // horse head
        makeBox(5, 14, 5, bronze, px, py + 14, pz);   // rider
        makeSphere(3, 6, 5, bronze, px, py + 22, pz); // rider head
        // Pedestal
        makeBox(16, 8, 16, 0x887755, px, py + 0, pz);

        // Waterfront steps leading to Tagus
        makeBox(200, 3, 10, 0xCCBBAA, px, py + 1.5, pz + 85);
        makeBox(200, 3, 10, 0xCCBBAA, px, py + 3, pz + 92);
    }

    // ─── TRAMS ────────────────────────────────────────────────────────────────────
    function buildTrams() {
        var yellow = 0xFFCC00;
        var cream = 0xFFEECC;
        var dark = 0x443300;

        // Tram 28 — on Alfama hill street
        makeBox(18, 10, 7, yellow, 22820, 5, -430);
        makeBox(16, 4, 5, cream, 22820, 12, -430);
        makeCyl(2, 2, 7, 6, dark, 22813, 0, -430);
        makeCyl(2, 2, 7, 6, dark, 22827, 0, -430);

        // Second tram on waterfront road
        makeBox(18, 10, 7, yellow, 22700, 5, -200);
        makeBox(16, 4, 5, cream, 22700, 12, -200);
        makeCyl(2, 2, 7, 6, dark, 22693, 0, -200);
        makeCyl(2, 2, 7, 6, dark, 22707, 0, -200);

        // Tram tracks (dark lines on road surface)
        makeBox(200, 1, 2, 0x333333, 22750, 0.5, -200);
        makeBox(200, 1, 2, 0x333333, 22750, 0.5, -196);
    }

    // ─── WIDER CITYSCAPE ─────────────────────────────────────────────────────────
    function buildCityscape() {
        var terracotta = 0xCC7744;
        var tan = 0xD2B48C;
        var white = 0xF0EEE8;

        // Baixa Pombalina grid buildings (city centre — rebuilt after 1755 earthquake)
        makeBox(40, 32, 30, white, 22700, 16, -310);
        makeBox(40, 36, 30, tan, 22740, 18, -310);
        makeBox(40, 30, 30, white, 22780, 15, -310);
        makeBox(40, 34, 30, tan, 22820, 17, -310);
        makeBox(40, 28, 30, 0xEEDDCC, 22860, 14, -310);

        // Second row of downtown buildings
        makeBox(40, 38, 30, white, 22700, 19, -350);
        makeBox(40, 40, 30, tan, 22740, 20, -350);
        makeBox(40, 36, 30, white, 22780, 18, -350);
        makeBox(40, 34, 30, tan, 22820, 17, -350);

        // Chiado / Bairro Alto on hilltop
        makeBox(60, 30, 40, terracotta, 22550, 15, -450);
        makeBox(55, 35, 38, 0xBB7755, 22620, 17, -460);
        makeBox(58, 28, 36, terracotta, 22690, 14, -445);

        // Elevador de Santa Justa (neo-Gothic lift tower)
        makeCyl(8, 8, 60, 8, 0x997744, 22650, 30, -380);
        makeBox(20, 10, 20, 0x885533, 22650, 64, -380);
        makeCyl(7, 7, 8, 8, 0x997744, 22650, 73, -380);
        makeCone(8, 12, 8, 0x775522, 22650, 81, -380);

        // Parque das Nações / Expo area in distance
        makeBox(30, 50, 30, 0xCCDDEE, 23100, 25, -600);
        makeBox(25, 60, 25, 0xBBCCDD, 23150, 30, -630);
        makeBox(20, 44, 20, 0xDDEEFF, 23080, 22, -650);
        // Vasco da Gama Tower (tall modern)
        makeBox(14, 130, 14, 0xCCCCCC, 23200, 65, -620);
        makeBox(30, 10, 30, 0xBBBBBB, 23200, 134, -620);

        // Rua Augusta street (main pedestrian street in Baixa)
        makeBox(20, 1, 200, 0xCCBBAA, 22760, 0.5, -250);

        // Waterfront promenade (Ribeira das Naus)
        makeBox(500, 2, 30, 0xBBAAA0, 22700, 1, -155);
        // Benches and lamp posts along promenade
        makeBox(6, 4, 2, 0x776655, 22650, 3, -162);
        makeBox(6, 4, 2, 0x776655, 22700, 3, -162);
        makeBox(6, 4, 2, 0x776655, 22750, 3, -162);
        makeCyl(1, 1, 14, 6, 0x444444, 22670, 8, -165);
        makeCyl(1, 1, 14, 6, 0x444444, 22720, 8, -165);
        makeSphere(2, 6, 5, 0xFFFF99, 22670, 16, -165);
        makeSphere(2, 6, 5, 0xFFFF99, 22720, 16, -165);

        // Trees along waterfront (green spheres on brown cylinders)
        makeCyl(2, 3, 12, 6, 0x664422, 22640, 6, -175);
        makeSphere(7, 7, 6, 0x336622, 22640, 16, -175);
        makeCyl(2, 3, 12, 6, 0x664422, 22680, 6, -175);
        makeSphere(7, 7, 6, 0x447733, 22680, 16, -175);
        makeCyl(2, 3, 12, 6, 0x664422, 22720, 6, -175);
        makeSphere(7, 7, 6, 0x336622, 22720, 16, -175);
        makeCyl(2, 3, 12, 6, 0x664422, 22760, 6, -175);
        makeSphere(7, 7, 6, 0x447733, 22760, 16, -175);
        makeCyl(2, 3, 12, 6, 0x664422, 22800, 6, -175);
        makeSphere(7, 7, 6, 0x336622, 22800, 16, -175);
    }

    function update(delta) { }

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
