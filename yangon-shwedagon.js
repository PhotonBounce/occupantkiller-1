window.YangonShwedagon = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 24520;
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

    function makeMat(color, opts) {
        var params = { color: color };
        if (opts) {
            if (opts.emissive !== undefined) params.emissive = opts.emissive;
            if (opts.emissiveIntensity !== undefined) params.emissiveIntensity = opts.emissiveIntensity;
        }
        return new THREE.MeshLambertMaterial(params);
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
        buildShwedagon();
        buildSulePagoda();
        buildCityHall();
        buildStrandHotel();
        buildBogyokeMarket();
        buildInyaLake();
        buildNationalMuseum();
        buildIndependenceMonument();
        buildColonialGrid();
        buildHluttaw();
        buildGroundTerrain();
    }

    // ----------------------------------------------------------------
    // SHWEDAGON PAGODA — offset: x=0, z=0, on Singuttara Hill
    // ----------------------------------------------------------------
    function buildShwedagon() {
        var ox = 0;
        var oz = 0;
        var hillBase = 0;

        // Singuttara Hill — terraced marble platform on hilltop
        // Hill base (large cylinder)
        makeCyl(60, 70, 18, 16, 0x888877, ox, hillBase + 9, oz);
        // Upper hill tier
        makeCyl(52, 58, 8, 16, 0x999988, ox, hillBase + 21, oz);
        // Marble platform base — wide octagonal approximated as cylinder
        makeCyl(50, 54, 6, 8, 0xF0EDE8, ox, hillBase + 28, oz);
        // Upper marble terrace
        makeCyl(44, 48, 3, 8, 0xF5F2EE, ox, hillBase + 32, oz);

        // Gilded terrace ring
        makeCyl(42, 44, 2, 8, 0xFFD700, ox, hillBase + 34, oz);

        // Main stupa base — bell-shaped lower section (wide cylinder)
        makeCyl(30, 36, 8, 16, 0xFFD700, ox, hillBase + 36, oz);
        // Bell section middle
        makeCyl(22, 30, 10, 16, 0xFFD700, ox, hillBase + 44, oz);
        // Inverted bowl / banana bud section
        makeCyl(16, 22, 8, 16, 0xFFD700, ox, hillBase + 52, oz);
        // Turban rings — narrow tapered cylinder
        makeCyl(12, 16, 6, 16, 0xFFD700, ox, hillBase + 59, oz);
        // Main tapering cone spire — 98m total, most of height here
        makeCone(10, 44, 16, 0xFFD700, ox, hillBase + 83, oz);
        // Hti (jewelled umbrella) rings — stacked narrow cylinders
        makeCyl(5, 5, 3, 12, 0xFFD700, ox, hillBase + 107, oz);
        makeCyl(3.5, 5, 2, 12, 0xFFD700, ox, hillBase + 110, oz);
        makeCyl(2.5, 3.5, 2, 12, 0xFFD700, ox, hillBase + 112, oz);
        // Diamond bud apex — sphere encrusted with diamonds and rubies
        makeSphere(3, 16, 16, 0xFFFFFF, ox, hillBase + 116, oz);
        // Diamond bud tip ruby glow
        makeSphere(1.2, 8, 8, 0xFF2222, ox, hillBase + 119.5, oz);

        // 4 Smaller stupas at cardinal points (N, S, E, W) on the platform
        var cardDist = 34;
        var cardH = hillBase + 33;
        var smallStupaPositions = [
            [ox, cardH, oz - cardDist],
            [ox, cardH, oz + cardDist],
            [ox - cardDist, cardH, oz],
            [ox + cardDist, cardH, oz]
        ];
        for (var ci = 0; ci < smallStupaPositions.length; ci++) {
            var cp = smallStupaPositions[ci];
            // Small stupa base
            makeCyl(5, 6, 4, 8, 0xFFD700, cp[0] - BASE_X, cp[1] - BASE_Y + 2, cp[2] - BASE_Z);
            // Small stupa bell
            makeCyl(4, 5, 5, 8, 0xFFD700, cp[0] - BASE_X, cp[1] - BASE_Y + 7, cp[2] - BASE_Z);
            // Small stupa spire
            makeCone(3, 12, 8, 0xFFD700, cp[0] - BASE_X, cp[1] - BASE_Y + 18, cp[2] - BASE_Z);
            // Small stupa finial
            makeSphere(0.8, 8, 8, 0xFFFFFF, cp[0] - BASE_X, cp[1] - BASE_Y + 25, cp[2] - BASE_Z);
        }

        // 64 smaller pagodas in ring around main stupa on outer terrace
        var ringR = 44;
        for (var pi = 0; pi < 16; pi++) {
            var angle = (pi / 16) * Math.PI * 2;
            var px = ox + Math.cos(angle) * ringR;
            var pz = oz + Math.sin(angle) * ringR;
            var py = hillBase + 33;
            // Tiny pagoda base
            makeCyl(1.5, 2, 2, 6, 0xFFD700, px, py + 1, pz);
            // Tiny pagoda spire
            makeCone(1.2, 5, 6, 0xFFD700, px, py + 6, pz);
        }

        // Perimeter wall on hilltop — 4 sides approximated as boxes
        makeBox(110, 2, 2, 0xDDCCBB, ox, hillBase + 32, oz - 54);
        makeBox(110, 2, 2, 0xDDCCBB, ox, hillBase + 32, oz + 54);
        makeBox(2, 2, 110, 0xDDCCBB, ox - 54, hillBase + 32, oz);
        makeBox(2, 2, 110, 0xDDCCBB, ox + 54, hillBase + 32, oz);

        // Covered walkways / zugaungs (staircases) — 4 entry points
        makeBox(8, 4, 20, 0xCCBBAA, ox, hillBase + 27, oz - 65);
        makeBox(8, 4, 20, 0xCCBBAA, ox, hillBase + 27, oz + 65);
        makeBox(20, 4, 8, 0xCCBBAA, ox - 65, hillBase + 27, oz);
        makeBox(20, 4, 8, 0xCCBBAA, ox + 65, hillBase + 27, oz);
    }

    // ----------------------------------------------------------------
    // SULE PAGODA — octagonal gold stupa, downtown, offset x=-180, z=120
    // ----------------------------------------------------------------
    function buildSulePagoda() {
        var ox = -180;
        var oz = 120;
        var base = 0;

        // Traffic roundabout road surface — ring of boxes
        for (var ri = 0; ri < 12; ri++) {
            var ra = (ri / 12) * Math.PI * 2;
            var rx = ox + Math.cos(ra) * 28;
            var rz = oz + Math.sin(ra) * 28;
            makeBox(8, 0.3, 8, 0x555555, rx, base + 0.15, rz);
        }

        // Octagonal base platform — approximated as 8-segment cylinder
        makeCyl(18, 20, 3, 8, 0xCCBBAA, ox, base + 1.5, oz);
        // Upper octagonal plinth
        makeCyl(15, 18, 3, 8, 0xDDCC99, ox, base + 4.5, oz);
        // Lower bell
        makeCyl(12, 15, 8, 8, 0xFFD700, ox, base + 10, oz);
        // Mid bell
        makeCyl(9, 12, 8, 8, 0xFFD700, ox, base + 18, oz);
        // Upper tapered tower
        makeCyl(6, 9, 10, 8, 0xFFD700, ox, base + 26, oz);
        // Spire cone
        makeCone(5, 16, 8, 0xFFD700, ox, base + 38, oz);
        // Hti finial ring
        makeCyl(2, 2, 2, 8, 0xFFD700, ox, base + 45, oz);
        // Diamond bud
        makeSphere(1.5, 8, 8, 0xFFFFFF, ox, base + 47, oz);

        // Surrounding shrine buildings (4 small structures)
        makeBox(6, 4, 6, 0xCCBBAA, ox - 20, base + 2, oz);
        makeBox(6, 4, 6, 0xCCBBAA, ox + 20, base + 2, oz);
        makeBox(6, 4, 6, 0xCCBBAA, ox, base + 2, oz - 20);
        makeBox(6, 4, 6, 0xCCBBAA, ox, base + 2, oz + 20);

        // Perimeter iron fence posts approximated as thin boxes
        for (var fi = 0; fi < 16; fi++) {
            var fa = (fi / 16) * Math.PI * 2;
            var fx = ox + Math.cos(fa) * 22;
            var fz = oz + Math.sin(fa) * 22;
            makeBox(0.4, 2.5, 0.4, 0x333333, fx, base + 1.25, fz);
        }
    }

    // ----------------------------------------------------------------
    // YANGON CITY HALL — colonial neo-classical, offset x=-200, z=-60
    // ----------------------------------------------------------------
    function buildCityHall() {
        var ox = -200;
        var oz = -60;
        var base = 0;

        // Main building body
        makeBox(40, 16, 24, 0xF5F5F5, ox, base + 8, oz);
        // Red-tiled roof
        makeBox(44, 3, 28, 0xAA3333, ox, base + 17.5, oz);
        // Roof ridge
        makeCyl(1, 1, 44, 4, 0x882222, ox, base + 20, oz);

        // Colonnaded portico — front columns
        for (var co = 0; co < 8; co++) {
            makeBox(1.2, 14, 1.2, 0xEEEEEE, ox - 18 + co * 5.2, base + 7, oz - 13);
        }
        // Portico entablature
        makeBox(44, 2, 3, 0xDDDDDD, ox, base + 15, oz - 13);

        // Central clock tower
        makeBox(8, 28, 8, 0xF0F0F0, ox, base + 14, oz);
        // Clock tower roof
        makeCone(5, 8, 4, 0xAA3333, ox, base + 34, oz);
        // Clock face (sphere)
        makeSphere(2, 8, 8, 0xEEEECC, ox, base + 26, oz - 4.5);

        // Side wings
        makeBox(12, 12, 24, 0xF0F0F0, ox - 26, base + 6, oz);
        makeBox(12, 12, 24, 0xF0F0F0, ox + 26, base + 6, oz);

        // Front steps
        makeBox(44, 1, 4, 0xDDDDDD, ox, base + 0.5, oz - 14);
        makeBox(44, 1, 3, 0xDDDDDD, ox, base + 1.5, oz - 12);
    }

    // ----------------------------------------------------------------
    // STRAND HOTEL — Edwardian 1901, arcaded, offset x=-170, z=-100
    // ----------------------------------------------------------------
    function buildStrandHotel() {
        var ox = -170;
        var oz = -100;
        var base = 0;

        // Main building — long 3-storey block
        makeBox(50, 18, 20, 0xCCCCAA, ox, base + 9, oz);
        // Roof parapet
        makeBox(52, 2, 22, 0xBBBB99, ox, base + 19, oz);

        // Ground floor arcade — series of arched openings (boxes)
        for (var ai = 0; ai < 10; ai++) {
            makeBox(3, 6, 2, 0xBBBB88, ox - 22 + ai * 5, base + 3, oz - 11);
        }
        // Arcade ceiling strip
        makeBox(50, 1.5, 2, 0xCCCC99, ox, base + 6.75, oz - 11);

        // Second floor balcony rail
        makeBox(52, 0.8, 1, 0xDDDDBB, ox, base + 13.4, oz - 11);

        // Corner towers / pavilions
        makeBox(8, 20, 8, 0xCCCCAA, ox - 27, base + 10, oz);
        makeBox(8, 20, 8, 0xCCCCAA, ox + 27, base + 10, oz);
        // Corner tower roofs
        makeCone(5, 6, 4, 0xAA9977, ox - 27, base + 22, oz);
        makeCone(5, 6, 4, 0xAA9977, ox + 27, base + 22, oz);

        // Entrance canopy
        makeBox(12, 1.5, 6, 0xBBBB88, ox, base + 8, oz - 14);

        // Grand entrance pillars
        makeBox(1, 8, 1, 0xDDDDCC, ox - 4, base + 4, oz - 11);
        makeBox(1, 8, 1, 0xDDDDCC, ox + 4, base + 4, oz - 11);
    }

    // ----------------------------------------------------------------
    // BOGYOKE AUNG SAN MARKET — colonial covered market, offset x=-240, z=20
    // ----------------------------------------------------------------
    function buildBogyokeMarket() {
        var ox = -240;
        var oz = 20;
        var base = 0;

        // Main market building
        makeBox(60, 10, 30, 0xCCBB99, ox, base + 5, oz);

        // Roof structure — series of ridges (gabled)
        for (var mi = 0; mi < 6; mi++) {
            makeCyl(1, 1, 30, 4, 0xAA8866, ox - 25 + mi * 10, base + 11, oz);
        }
        // Roof panels between ridges
        makeBox(64, 2, 32, 0xBBAA88, ox, base + 10.5, oz);

        // Front entrance portico
        makeBox(20, 12, 6, 0xCCBB99, ox, base + 6, oz - 18);
        makeCone(10, 4, 4, 0xAA8866, ox, base + 14, oz - 18);

        // Side wings
        makeBox(10, 8, 30, 0xCCBB99, ox - 35, base + 4, oz);
        makeBox(10, 8, 30, 0xCCBB99, ox + 35, base + 4, oz);

        // Market stall rows inside (represented as low box rows)
        makeBox(50, 2.5, 4, 0xDDCCAA, ox, base + 1.25, oz - 8);
        makeBox(50, 2.5, 4, 0xDDCCAA, ox, base + 1.25, oz);
        makeBox(50, 2.5, 4, 0xDDCCAA, ox, base + 1.25, oz + 8);

        // Perimeter wall
        makeBox(64, 3, 1.5, 0xBBAA88, ox, base + 1.5, oz - 16);
        makeBox(64, 3, 1.5, 0xBBAA88, ox, base + 1.5, oz + 16);
    }

    // ----------------------------------------------------------------
    // INYA LAKE — north of city, offset x=80, z=-280
    // ----------------------------------------------------------------
    function buildInyaLake() {
        var ox = 80;
        var oz = -280;
        var waterY = -0.4;

        // Lake water surface — large flat box (blue)
        makeBox(180, 0.5, 120, 0x2A5A8A, ox, waterY, oz);

        // Lake bed visible rim / banks
        makeBox(190, 1.5, 5, 0x7B6B55, ox, -0.25, oz - 62);
        makeBox(190, 1.5, 5, 0x7B6B55, ox, -0.25, oz + 62);
        makeBox(5, 1.5, 130, 0x7B6B55, ox - 93, -0.25, oz);
        makeBox(5, 1.5, 130, 0x7B6B55, ox + 93, -0.25, oz);

        // Rowing boats (small thin boxes on water)
        makeBox(4, 0.6, 1.5, 0x885533, ox - 30, waterY + 0.4, oz - 20);
        makeBox(4, 0.6, 1.5, 0x885533, ox + 20, waterY + 0.4, oz + 15);
        makeBox(4, 0.6, 1.5, 0x664422, ox - 10, waterY + 0.4, oz + 30);
        // Oars
        makeBox(5, 0.2, 0.2, 0x774422, ox - 30, waterY + 0.8, oz - 20);
        makeBox(5, 0.2, 0.2, 0x774422, ox + 20, waterY + 0.8, oz + 15);

        // Inya Lake Hotel on south shore
        makeBox(40, 14, 20, 0xEEDDCC, ox + 60, 7, oz + 50);
        // Hotel wings
        makeBox(12, 10, 20, 0xEEDDCC, ox + 46, 5, oz + 50);
        makeBox(12, 10, 20, 0xEEDDCC, ox + 74, 5, oz + 50);
        // Hotel roof
        makeBox(44, 2, 24, 0xCC9966, ox + 60, 15, oz + 50);
        // Hotel entrance columns
        makeBox(1, 10, 1, 0xDDCCBB, ox + 52, 5, oz + 39);
        makeBox(1, 10, 1, 0xDDCCBB, ox + 60, 5, oz + 39);
        makeBox(1, 10, 1, 0xDDCCBB, ox + 68, 5, oz + 39);

        // Jetty / dock
        makeBox(20, 0.5, 3, 0x996644, ox - 60, waterY + 0.5, oz + 55);

        // Shoreline trees (cylinders as trunks, cones as foliage)
        var treePositions = [
            [ox - 80, oz + 55], [ox - 70, oz + 58], [ox - 85, oz + 48],
            [ox + 30, oz + 62], [ox + 40, oz + 60]
        ];
        for (var ti = 0; ti < treePositions.length; ti++) {
            var tp = treePositions[ti];
            makeCyl(0.4, 0.4, 4, 6, 0x554422, tp[0] - BASE_X, 2, tp[1] - BASE_Z);
            makeCone(2, 6, 6, 0x336622, tp[0] - BASE_X, 7, tp[1] - BASE_Z);
        }
    }

    // ----------------------------------------------------------------
    // NATIONAL MUSEUM OF MYANMAR — offset x=-100, z=-80
    // ----------------------------------------------------------------
    function buildNationalMuseum() {
        var ox = -100;
        var oz = -80;
        var base = 0;

        // Main museum building
        makeBox(36, 16, 24, 0xD4C8B0, ox, base + 8, oz);
        // Roof
        makeBox(38, 2, 26, 0xC0B49C, ox, base + 17, oz);
        // Tiered roof detail
        makeBox(30, 2, 18, 0xBBA888, ox, base + 19.5, oz);

        // Front columns
        for (var nc = 0; nc < 6; nc++) {
            makeBox(1.2, 12, 1.2, 0xDDD0BC, ox - 12 + nc * 5, base + 6, oz - 13);
        }
        // Pediment
        makeCone(18, 5, 4, 0xC0B49C, ox, base + 21, oz - 13);

        // Side wings
        makeBox(8, 12, 24, 0xD4C8B0, ox - 22, base + 6, oz);
        makeBox(8, 12, 24, 0xD4C8B0, ox + 22, base + 6, oz);

        // Regalia exhibition hall sign slab (flat box above entrance)
        makeBox(20, 1, 4, 0xEEE0CC, ox, base + 13.5, oz - 13);

        // Display plinth for Regalia Throne inside (visible through entrance)
        makeBox(6, 2, 4, 0x996633, ox, base + 1, oz);
        makeCone(2, 3, 8, 0xFFD700, ox, base + 4.5, oz);
    }

    // ----------------------------------------------------------------
    // INDEPENDENCE MONUMENT — obelisk, octagonal pool, offset x=-150, z=60
    // ----------------------------------------------------------------
    function buildIndependenceMonument() {
        var ox = -150;
        var oz = 60;
        var base = 0;

        // Octagonal reflecting pool — ring of water boxes
        for (var pi = 0; pi < 8; pi++) {
            var pa = (pi / 8) * Math.PI * 2;
            var px = ox + Math.cos(pa) * 18;
            var pz = oz + Math.sin(pa) * 18;
            makeBox(10, 0.5, 4, 0x2A6A9A, px, base + 0.25, pz);
        }

        // Pool walls
        for (var pw = 0; pw < 8; pw++) {
            var pwa = (pw / 8) * Math.PI * 2;
            var pwx = ox + Math.cos(pwa) * 20;
            var pwz = oz + Math.sin(pwa) * 20;
            makeBox(8, 1, 1, 0xCCCCCC, pwx, base + 0.5, pwz);
        }

        // Obelisk base plinth — stepped
        makeBox(10, 2, 10, 0xDDDDDD, ox, base + 1, oz);
        makeBox(7, 2, 7, 0xDDDDDD, ox, base + 3, oz);
        makeBox(5, 2, 5, 0xCCCCCC, ox, base + 5, oz);

        // Obelisk shaft — tall tapered box
        makeBox(3, 36, 3, 0xCCCCCC, ox, base + 24, oz);
        // Obelisk narrowing upper
        makeBox(2, 8, 2, 0xCCCCCC, ox, base + 46, oz);
        // Pyramidion apex
        makeCone(1.8, 4, 4, 0xCCCCCC, ox, base + 52, oz);
        // Gold star at top
        makeSphere(0.8, 6, 6, 0xFFD700, ox, base + 55, oz);

        // Independence park — 4 lamp posts
        makeCyl(0.2, 0.2, 6, 6, 0x444444, ox - 10, base + 3, oz - 10);
        makeSphere(0.5, 6, 6, 0xFFFFAA, ox - 10, base + 6.5, oz - 10);
        makeCyl(0.2, 0.2, 6, 6, 0x444444, ox + 10, base + 3, oz - 10);
        makeSphere(0.5, 6, 6, 0xFFFFAA, ox + 10, base + 6.5, oz - 10);
        makeCyl(0.2, 0.2, 6, 6, 0x444444, ox - 10, base + 3, oz + 10);
        makeSphere(0.5, 6, 6, 0xFFFFAA, ox - 10, base + 6.5, oz + 10);
        makeCyl(0.2, 0.2, 6, 6, 0x444444, ox + 10, base + 3, oz + 10);
        makeSphere(0.5, 6, 6, 0xFFFFAA, ox + 10, base + 6.5, oz + 10);
    }

    // ----------------------------------------------------------------
    // COLONIAL GRID — downtown Victorian brick buildings
    // ----------------------------------------------------------------
    function buildColonialGrid() {
        // Grid of colonial buildings around Sule Pagoda area
        // Row 1 — north street
        var buildingData = [
            [-250, -20, 18, 10, 14, 0x888877],
            [-225, -20, 14, 8, 14, 0x887766],
            [-205, -20, 12, 9, 14, 0x998877],
            [-155, -20, 16, 11, 14, 0x887766],
            [-130, -20, 14, 10, 14, 0x888877],
            // Row 2 — south street
            [-250, 50, 16, 8, 14, 0x887766],
            [-228, 50, 12, 10, 14, 0x888877],
            [-208, 50, 14, 9, 14, 0x776655],
            [-160, 50, 16, 10, 14, 0x887766],
            [-135, 50, 12, 8, 14, 0x888877],
            // Row 3 — east side
            [-80, 10, 12, 10, 18, 0x887766],
            [-80, 35, 12, 9, 16, 0x776655],
            [-80, -10, 12, 11, 15, 0x888877]
        ];

        for (var bi = 0; bi < buildingData.length; bi++) {
            var bd = buildingData[bi];
            var bx = bd[0];
            var bz = bd[1];
            var bw = bd[2];
            var bh = bd[3];
            var bd2 = bd[4];
            var bc = bd[5];
            // Main building body
            makeBox(bw, bh * 2, bd2, bc, bx, bh, bz);
            // Arcade strip at ground level (front face)
            makeBox(bw, 3, 2, 0x776655, bx, 1.5, bz - bd2 / 2 - 1);
            // Parapet on roof
            makeBox(bw + 1, 1, bd2 + 1, 0x999988, bx, bh * 2 + 0.5, bz);
        }

        // Road surfaces — main downtown streets (grey flat boxes)
        makeBox(200, 0.2, 12, 0x444444, -170, 0.1, -5);
        makeBox(200, 0.2, 12, 0x444444, -170, 0.1, 30);
        makeBox(12, 0.2, 100, 0x444444, -120, 0.1, 15);
        makeBox(12, 0.2, 100, 0x444444, -220, 0.1, 15);

        // Pavement / sidewalk strips
        makeBox(200, 0.15, 4, 0x888888, -170, 0.15, -12);
        makeBox(200, 0.15, 4, 0x888888, -170, 0.15, 36);
    }

    // ----------------------------------------------------------------
    // HLUTTAW (PARLIAMENT) — Naypyidaw, distant on horizon, offset x=300, z=-400
    // ----------------------------------------------------------------
    function buildHluttaw() {
        var ox = 300;
        var oz = -400;
        var base = 0;

        // Vast parliament complex — main central building
        makeBox(80, 22, 50, 0xCCCCBB, ox, base + 11, oz);
        // Tiered roof
        makeBox(84, 3, 54, 0xBBBBAA, ox, base + 23, oz);
        makeBox(70, 4, 40, 0xBBBBAA, ox, base + 27, oz);
        makeBox(56, 5, 26, 0xCCCCBB, ox, base + 32, oz);

        // Central spire / rotunda
        makeCyl(8, 10, 20, 16, 0xCCCCBB, ox, base + 33, oz);
        makeCone(7, 12, 16, 0xBBBBAA, ox, base + 49, oz);

        // Left wing
        makeBox(30, 18, 50, 0xCCCCBB, ox - 55, base + 9, oz);
        makeBox(32, 2, 52, 0xBBBBAA, ox - 55, base + 19, oz);
        // Right wing
        makeBox(30, 18, 50, 0xCCCCBB, ox + 55, base + 9, oz);
        makeBox(32, 2, 52, 0xBBBBAA, ox + 55, base + 19, oz);

        // Wing spires
        makeCone(5, 10, 8, 0xBBBBAA, ox - 55, base + 22, oz);
        makeCone(5, 10, 8, 0xBBBBAA, ox + 55, base + 22, oz);

        // Outer ceremonial gates
        makeBox(4, 14, 4, 0xDDDDCC, ox - 90, base + 7, oz - 30);
        makeBox(4, 14, 4, 0xDDDDCC, ox - 90, base + 7, oz + 30);
        makeBox(4, 14, 4, 0xDDDDCC, ox + 90, base + 7, oz - 30);
        makeBox(4, 14, 4, 0xDDDDCC, ox + 90, base + 7, oz + 30);

        // Grand approach road
        makeBox(20, 0.2, 200, 0x555555, ox, 0.1, oz + 200);

        // Distant supporting ministry buildings
        makeBox(20, 16, 30, 0xCCCCBB, ox - 130, base + 8, oz);
        makeBox(20, 16, 30, 0xCCCCBB, ox + 130, base + 8, oz);
        makeBox(18, 14, 30, 0xCCCCBB, ox - 160, base + 7, oz);
        makeBox(18, 14, 30, 0xCCCCBB, ox + 160, base + 7, oz);
    }

    // ----------------------------------------------------------------
    // GROUND TERRAIN — flat ground plane approximated as large grid of boxes
    // ----------------------------------------------------------------
    function buildGroundTerrain() {
        // Large ground tiles covering the area
        makeBox(600, 0.5, 600, 0x556644, 0, -0.25, -100);
        // Hilltop for Shwedagon — raised earth mound
        makeCyl(75, 85, 5, 16, 0x556644, 0, -2.5, 0);
        // Green park areas
        makeBox(80, 0.3, 60, 0x336633, -150, 0.15, 60);
        makeBox(60, 0.3, 40, 0x336633, -100, 0.15, -50);
    }

    function update(delta) {
        // Static environment — no per-frame animation needed
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
