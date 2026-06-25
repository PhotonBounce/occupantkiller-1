window.IsleOfManPeel = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 22480;
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

    function makeMaterial(color, opts) {
        var params = { color: color };
        if (opts && opts.wireframe) params.wireframe = opts.wireframe;
        return new THREE.MeshLambertMaterial(params);
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildIrishSea();
        buildIslandBase();
        buildPeelCastle();
        buildPeelTown();
        buildCastleRushen();
        buildTTCircuit();
        buildSnaefell();
        buildDouglasPromenade();
        buildTynwaldHill();
        buildLaxeyWheel();
        buildCalfOfMan();
    }

    // -------------------------------------------------------
    // IRISH SEA — surrounding waters
    // -------------------------------------------------------
    function buildIrishSea() {
        // large flat sea blocks on all sides
        makeBox(2000, 2, 2000, 0x006994, 0, -2, 0);
        // sea shimmer/depth layer
        makeBox(1800, 1, 1800, 0x005580, 0, -3, 0);
        // waves hint — thin slab strips
        makeBox(2000, 1, 40, 0x0077AA, 0, -1, -600);
        makeBox(2000, 1, 40, 0x0077AA, 0, -1, 600);
        makeBox(40, 1, 2000, 0x0077AA, -800, -1, 0);
        makeBox(40, 1, 2000, 0x0077AA, 800, -1, 0);
    }

    // -------------------------------------------------------
    // ISLAND BASE — Isle of Man landmass
    // -------------------------------------------------------
    function buildIslandBase() {
        // main island body (rough elongated shape)
        makeBox(400, 4, 800, 0x7A9E5F, 0, -1, 0);
        // rolling interior terrain bumps
        makeBox(180, 6, 300, 0x6B8F50, -40, 1, -100);
        makeBox(200, 5, 250, 0x7A9E5F, 60, 0, 150);
        // northern tip
        makeBox(120, 3, 100, 0x7A9E5F, 10, -1, -380);
        // southern tip
        makeBox(100, 3, 80, 0x7A9E5F, -5, -1, 390);
        // St Patrick's Isle tidal islet (Peel)
        makeBox(80, 3, 80, 0x9E9E7A, -180, -1, -200);
        // causeway connecting Peel to St Patrick's Isle
        makeBox(60, 2, 12, 0x8A8A6A, -140, -1, -200);
    }

    // -------------------------------------------------------
    // PEEL CASTLE — dramatic ruined Viking castle
    // -------------------------------------------------------
    function buildPeelCastle() {
        var wallColor = 0xAAAAAA;
        var ruinColor = 0x999988;
        var towerColor = 0xB8B8B8;

        // CURTAIN WALLS — outer perimeter (partial ruin)
        // north wall segment
        makeBox(80, 12, 4, wallColor, -180, 5, -240);
        // north wall ruined top (jagged)
        makeBox(20, 4, 4, ruinColor, -160, 14, -240);
        makeBox(15, 3, 4, ruinColor, -195, 13, -240);

        // south wall
        makeBox(70, 10, 4, wallColor, -180, 4, -162);
        makeBox(18, 3, 4, ruinColor, -165, 12, -162);

        // east wall
        makeBox(4, 11, 78, wallColor, -142, 4, -200);
        makeBox(4, 4, 20, ruinColor, -142, 13, -180);

        // west wall (partial ruin, missing sections)
        makeBox(4, 9, 30, wallColor, -218, 3, -230);
        makeBox(4, 7, 20, ruinColor, -218, 2, -200);
        makeBox(4, 10, 15, wallColor, -218, 3, -170);

        // ROUND TOWER of Cathedral of St German — tall dramatic cylinder
        makeCylinder(5, 6, 28, 10, towerColor, -158, 13, -240);
        // tower cap — ruined top (cone stub)
        makeCone(5, 6, 10, 0x887766, -158, 28, -240);
        // tower base buttress
        makeCylinder(7, 8, 4, 10, 0x999999, -158, 1, -240);

        // CATHEDRAL OF ST GERMAN RUINS
        // nave walls — long hall
        makeBox(4, 8, 50, wallColor, -170, 3, -205);
        makeBox(4, 8, 50, wallColor, -190, 3, -205);
        // east gable (partial)
        makeBox(24, 10, 4, wallColor, -180, 4, -180);
        // west gable (partial ruin)
        makeBox(14, 6, 4, ruinColor, -176, 2, -230);
        // chancel arch remnant
        makeBox(4, 12, 4, wallColor, -173, 5, -198);
        makeBox(4, 12, 4, wallColor, -187, 5, -198);
        // arch lintel
        makeBox(18, 3, 4, ruinColor, -180, 12, -198);
        // fallen wall rubble blocks
        makeBox(5, 3, 5, ruinColor, -165, 0, -210);
        makeBox(4, 2, 6, ruinColor, -192, 0, -215);
        makeBox(6, 2, 4, ruinColor, -185, 0, -220);

        // GATEHOUSE — main entrance
        makeBox(20, 14, 8, wallColor, -160, 6, -200);
        // gatehouse flanking towers
        makeCylinder(4, 4, 16, 8, towerColor, -152, 7, -200);
        makeCylinder(4, 4, 16, 8, towerColor, -168, 7, -200);
        // gatehouse arch void (dark box)
        makeBox(6, 7, 8, 0x222222, -160, 4, -200);
        // battlements on gatehouse
        makeBox(20, 3, 3, wallColor, -160, 16, -196);
        makeBox(4, 3, 3, 0x999999, -152, 16, -196);

        // CORNER TOWERS
        // NW tower
        makeCylinder(5, 6, 14, 8, towerColor, -218, 6, -240);
        makeCone(5, 4, 8, 0x887766, -218, 15, -240);
        // NE tower
        makeCylinder(4, 5, 12, 8, towerColor, -142, 5, -240);
        // SE tower (ruined stump)
        makeCylinder(4, 4, 8, 8, ruinColor, -142, 3, -162);
        // SW tower (more intact)
        makeCylinder(5, 5, 12, 8, towerColor, -218, 5, -162);

        // INNER WARD / GREAT HALL remains
        makeBox(30, 6, 20, ruinColor, -185, 2, -208);
        // inner hall walls stubs
        makeBox(4, 5, 20, 0x999999, -170, 1, -208);
        makeBox(4, 5, 20, 0x999999, -200, 1, -208);

        // RED SANDSTONE ACCENT (cathedral was red sandstone)
        makeBox(24, 2, 50, 0xCC7755, -180, -1, -205);
    }

    // -------------------------------------------------------
    // PEEL TOWN — fishing village, red sandstone buildings
    // -------------------------------------------------------
    function buildPeelTown() {
        var stoneColor = 0xC8B89A;
        var roofColor = 0x884422;
        var darkRoof = 0x552200;

        // harbour quay wall
        makeBox(120, 6, 8, 0xAA9977, -100, 2, -190);
        makeBox(8, 6, 60, 0xAA9977, -40, 2, -160);

        // fishing cottages row 1
        makeBox(12, 8, 10, stoneColor, -110, 3, -170);
        makeBox(12, 3, 10, roofColor, -110, 9, -170);
        makeBox(12, 8, 10, stoneColor, -125, 3, -170);
        makeBox(12, 3, 10, darkRoof, -125, 9, -170);
        makeBox(12, 8, 10, stoneColor, -140, 3, -170);
        makeBox(12, 3, 10, roofColor, -140, 9, -170);

        // fishing cottages row 2 (seafront)
        makeBox(10, 7, 10, stoneColor, -115, 2, -195);
        makeBox(10, 3, 10, roofColor, -115, 7, -195);
        makeBox(10, 7, 10, stoneColor, -130, 2, -195);
        makeBox(10, 3, 10, darkRoof, -130, 7, -195);

        // harbour boats (simple box hulls)
        makeBox(14, 3, 5, 0x4455AA, -70, 0, -185);
        makeBox(12, 3, 4, 0xCC3322, -85, 0, -188);
        makeBox(10, 2, 4, 0x226644, -65, 0, -195);
        // boat masts
        makeCylinder(0.4, 0.4, 14, 5, 0x553311, -70, 8, -185);
        makeCylinder(0.4, 0.4, 12, 5, 0x553311, -85, 7, -188);
        makeCylinder(0.4, 0.4, 10, 5, 0x553311, -65, 6, -195);

        // pub / inn building
        makeBox(18, 10, 14, stoneColor, -95, 4, -172);
        makeBox(18, 4, 14, roofColor, -95, 12, -172);
        // chimney
        makeCylinder(1, 1, 5, 6, 0x886655, -90, 16, -172);

        // market square paving
        makeBox(50, 1, 40, 0xBBAA99, -120, -1, -180);
    }

    // -------------------------------------------------------
    // CASTLE RUSHEN — best preserved, multiple wards
    // -------------------------------------------------------
    function buildCastleRushen() {
        var stoneColor = 0x888888;
        var lightStone = 0x999999;
        var darkStone = 0x777777;

        // base offset: south of island, Castletown
        var bx = 50;
        var bz = 300;

        // OUTER WARD WALLS
        makeBox(70, 10, 5, stoneColor, bx, 4, bz - 35);
        makeBox(70, 10, 5, stoneColor, bx, 4, bz + 35);
        makeBox(5, 10, 70, stoneColor, bx - 35, 4, bz);
        makeBox(5, 10, 70, stoneColor, bx + 35, 4, bz);

        // INNER WARD WALLS
        makeBox(40, 12, 4, lightStone, bx, 5, bz - 20);
        makeBox(40, 12, 4, lightStone, bx, 5, bz + 20);
        makeBox(4, 12, 40, lightStone, bx - 20, 5, bz);
        makeBox(4, 12, 40, lightStone, bx + 20, 5, bz);

        // CENTRAL KEEP — tall square tower
        makeBox(20, 22, 20, stoneColor, bx, 10, bz);
        makeBox(20, 4, 20, darkStone, bx, 23, bz);
        // keep battlements
        makeBox(22, 2, 2, lightStone, bx, 26, bz - 10);
        makeBox(22, 2, 2, lightStone, bx, 26, bz + 10);
        makeBox(2, 2, 20, lightStone, bx - 11, 26, bz);
        makeBox(2, 2, 20, lightStone, bx + 11, 26, bz);

        // CORNER TOWERS — outer ward
        makeCylinder(5, 6, 14, 8, lightStone, bx - 35, 6, bz - 35);
        makeCylinder(5, 6, 14, 8, lightStone, bx + 35, 6, bz - 35);
        makeCylinder(5, 6, 14, 8, lightStone, bx - 35, 6, bz + 35);
        makeCylinder(5, 6, 14, 8, lightStone, bx + 35, 6, bz + 35);
        // corner tower cones
        makeCone(5, 5, 8, 0x666666, bx - 35, 15, bz - 35);
        makeCone(5, 5, 8, 0x666666, bx + 35, 15, bz - 35);
        makeCone(5, 5, 8, 0x666666, bx - 35, 15, bz + 35);
        makeCone(5, 5, 8, 0x666666, bx + 35, 15, bz + 35);

        // GATEHOUSE
        makeBox(16, 14, 8, stoneColor, bx, 6, bz + 35);
        makeCylinder(4, 4, 16, 8, lightStone, bx - 8, 7, bz + 36);
        makeCylinder(4, 4, 16, 8, lightStone, bx + 8, 7, bz + 36);
        // gate arch void
        makeBox(5, 7, 8, 0x222222, bx, 3, bz + 35);

        // GREAT HALL — inner ward building
        makeBox(18, 8, 12, darkStone, bx - 5, 3, bz - 5);
        makeBox(18, 3, 12, 0x666666, bx - 5, 9, bz - 5);

        // town of Castletown around castle
        makeBox(14, 7, 10, 0xAA9977, bx + 50, 2, bz - 10);
        makeBox(14, 3, 10, 0x884422, bx + 50, 7, bz - 10);
        makeBox(12, 7, 10, 0xBBAA88, bx + 68, 2, bz - 15);
        makeBox(12, 3, 10, 0x774422, bx + 68, 7, bz - 15);
    }

    // -------------------------------------------------------
    // TT CIRCUIT — Snaefell Mountain Course road
    // -------------------------------------------------------
    function buildTTCircuit() {
        var roadColor = 0x555555;
        var lineColor = 0xFFFFFF;
        var barrierColor = 0xEE3311;

        // approximate key sections of the 37.73 mile circuit
        // Start/Finish at Douglas
        makeBox(40, 1, 8, roadColor, 80, 0, 20);
        makeBox(40, 2, 1, lineColor, 80, 0, 20);

        // Bray Hill section
        makeBox(8, 1, 60, roadColor, 60, 0, 80);

        // Quarter Bridge
        makeBox(8, 1, 80, roadColor, 40, 0, 140);
        makeBox(30, 1, 8, roadColor, 25, 0, 180);

        // Ballacraine junction
        makeBox(8, 1, 60, roadColor, -10, 0, 200);
        makeBox(60, 1, 8, roadColor, -40, 0, 230);

        // Glen Helen section
        makeBox(8, 1, 80, roadColor, -90, 1, 220);

        // Ramsey climb / mountain section
        makeBox(8, 1, 100, roadColor, -120, 2, 100);
        makeBox(8, 1, 80, roadColor, -100, 4, -20);
        makeBox(8, 3, 8, roadColor, -80, 5, -80);

        // Mountain section near Snaefell
        makeBox(100, 2, 8, roadColor, -60, 8, -120);

        // Signage box — start/finish gantry
        makeBox(2, 10, 1, 0xCC2200, 70, 4, 20);
        makeBox(2, 10, 1, 0xCC2200, 90, 4, 20);
        makeBox(20, 2, 1, 0xFFFFFF, 80, 10, 20);

        // pit lane boxes
        makeBox(60, 4, 8, 0x444444, 80, 1, 30);
        makeBox(10, 4, 8, 0x993322, 90, 1, 30);
        makeBox(10, 4, 8, 0x224499, 70, 1, 30);

        // Grandstand seating
        makeBox(40, 6, 10, 0xCC9900, 80, 2, 40);
        makeBox(40, 8, 2, 0xBB8800, 80, 3, 44);

        // safety barriers along key sections
        makeBox(1, 2, 60, barrierColor, 55, 0, 80);
        makeBox(1, 2, 80, barrierColor, 36, 0, 140);
    }

    // -------------------------------------------------------
    // SNAEFELL — 620m, only mountain, summit railway
    // -------------------------------------------------------
    function buildSnaefell() {
        var mountainColor = 0x8B7355;
        var snowColor = 0xEEEEEE;
        var rockColor = 0x7A6645;

        // main mountain body — large sphere flattened
        makeSphere(90, 16, 12, mountainColor, -100, -30, -100);
        // lower skirts
        makeSphere(70, 12, 8, 0x7A8B60, -100, -60, -100);
        // rocky upper section
        makeSphere(40, 12, 8, rockColor, -100, 15, -100);
        // summit cap
        makeSphere(20, 10, 8, snowColor, -100, 50, -100);
        // snow patches
        makeSphere(10, 8, 6, snowColor, -85, 40, -115);
        makeSphere(8, 8, 6, snowColor, -115, 38, -90);

        // SNAEFELL MOUNTAIN RAILWAY
        // railway track (thin boxes going up slope)
        makeBox(2, 1, 40, 0x553311, -90, 5, -70);
        makeBox(2, 3, 40, 0x553311, -95, 12, -90);
        makeBox(2, 6, 30, 0x553311, -97, 22, -95);
        // summit station building
        makeBox(12, 6, 8, 0xCCBB99, -100, 55, -100);
        makeBox(12, 2, 8, 0xAA8855, -100, 59, -100);
        // railway car on slope
        makeBox(5, 4, 8, 0x4477BB, -93, 15, -87);

        // lower foothills
        makeBox(80, 15, 80, 0x8A9E6A, -80, -10, -70);
        makeBox(60, 10, 60, 0x7A9060, -110, -12, -120);
    }

    // -------------------------------------------------------
    // DOUGLAS PROMENADE — Victorian seafront, horse trams
    // -------------------------------------------------------
    function buildDouglasPromenade() {
        var promColor = 0xD3D3D3;
        var buildingColor = 0xE8E0D0;
        var tramColor = 0xCC8800;
        var darkBuild = 0xC8C0B0;

        // PROMENADE WALKWAY — curved seafront
        makeBox(200, 1, 20, promColor, 80, 0, -10);
        // seafront road
        makeBox(200, 1, 12, 0x888888, 80, 0, 5);

        // VICTORIAN HOTELS AND BUILDINGS — grand terrace
        makeBox(30, 18, 16, buildingColor, 20, 8, -20);
        makeBox(30, 4, 16, 0xAA9977, 20, 20, -20);
        makeBox(30, 18, 16, darkBuild, 55, 8, -20);
        makeBox(30, 4, 16, 0x9A8866, 55, 20, -20);
        makeBox(30, 18, 16, buildingColor, 90, 8, -20);
        makeBox(30, 4, 16, 0xAA9977, 90, 20, -20);
        makeBox(30, 18, 16, darkBuild, 125, 8, -20);
        makeBox(30, 4, 16, 0x9A8866, 125, 20, -20);
        makeBox(30, 20, 16, buildingColor, 160, 9, -20);
        makeBox(30, 4, 16, 0xBBAA88, 160, 21, -20);

        // chimney stacks on hotels
        makeCylinder(1, 1, 5, 6, 0x887766, 15, 24, -20);
        makeCylinder(1, 1, 5, 6, 0x887766, 25, 24, -20);
        makeCylinder(1, 1, 5, 6, 0x887766, 60, 24, -20);
        makeCylinder(1, 1, 5, 6, 0x887766, 155, 25, -20);
        makeCylinder(1, 1, 5, 6, 0x887766, 165, 25, -20);

        // HORSE TRAM — on promenade
        makeBox(8, 4, 4, tramColor, 100, 1, 0);
        makeBox(8, 1, 4, 0x885500, 100, 3, 0);
        // tram wheels
        makeCylinder(1, 1, 1, 8, 0x333333, 96, 0, -2);
        makeCylinder(1, 1, 1, 8, 0x333333, 104, 0, -2);
        makeCylinder(1, 1, 1, 8, 0x333333, 96, 0, 2);
        makeCylinder(1, 1, 1, 8, 0x333333, 104, 0, 2);
        // horse (simple box shapes)
        makeBox(6, 5, 2, 0x8B6914, 112, 1, 0);
        makeBox(2, 3, 2, 0x8B6914, 116, 4, 0);

        // DOUGLAS BAY TERMINAL BUILDING
        makeBox(40, 12, 20, buildingColor, -20, 5, -15);
        makeBox(40, 3, 20, 0x9A8866, -20, 12, -15);
        // terminal clock tower
        makeCylinder(3, 3, 18, 8, 0xCCBBAA, -10, 8, -15);
        makeCone(3, 4, 8, 0x885544, -10, 18, -15);

        // DOUGLAS HARBOUR
        makeBox(100, 4, 10, 0xBBAA88, -10, 1, 30);
        makeBox(10, 4, 80, 0xBBAA88, 40, 1, 70);
        // harbour boats
        makeBox(16, 4, 6, 0x2244AA, 10, 1, 35);
        makeBox(14, 3, 5, 0xCC2200, 30, 0, 35);
        makeBox(20, 5, 7, 0x448833, 50, 1, 40);
        // ferry vessel (larger)
        makeBox(40, 8, 12, 0xFFFFFF, -30, 3, 50);
        makeBox(40, 4, 12, 0x4488CC, -30, 8, 50);
        makeBox(6, 8, 6, 0xCCCCCC, -20, 12, 50);
        // ferry funnel
        makeCylinder(2, 3, 8, 8, 0xFF4400, -15, 16, 50);
    }

    // -------------------------------------------------------
    // TYNWALD HILL — ancient parliament mound
    // -------------------------------------------------------
    function buildTynwaldHill() {
        var hillColor = 0x4CAF50;
        var darkGrass = 0x388E3C;
        var stoneColor = 0xBBAA88;

        // offset: St Johns, centre of island
        var bx = -30;
        var bz = 30;

        // TYNWALD HILL — tiered mound (4 tiers traditional)
        makeCylinder(18, 20, 3, 16, hillColor, bx, 1, bz);
        makeCylinder(14, 16, 3, 16, darkGrass, bx, 4, bz);
        makeCylinder(10, 12, 3, 16, hillColor, bx, 7, bz);
        makeCylinder(6, 8, 3, 16, darkGrass, bx, 10, bz);
        // flat top summit
        makeCylinder(5, 6, 1, 16, 0x33AA33, bx, 12, bz);

        // flagpole on top
        makeCylinder(0.3, 0.3, 10, 6, 0xCCCC88, bx, 17, bz);
        // Manx flag representation (small box)
        makeBox(4, 2, 1, 0xCC0000, bx + 2, 21, bz);

        // PROCESSIONAL PATH — royal road
        makeBox(80, 1, 4, stoneColor, bx + 40, 0, bz);

        // TYNWALD CHURCH of St Johns
        makeBox(20, 10, 30, 0xCCBBAA, bx - 50, 4, bz);
        makeBox(20, 3, 30, 0xAA9977, bx - 50, 12, bz);
        // church tower
        makeBox(8, 16, 8, 0xBBAA99, bx - 55, 7, bz - 5);
        makeCone(4, 5, 6, 0x997755, bx - 55, 16, bz - 5);

        // parliament building
        makeBox(30, 8, 20, 0xCCBB99, bx + 10, 3, bz - 50);
        makeBox(30, 2, 20, 0x998866, bx + 10, 8, bz - 50);
    }

    // -------------------------------------------------------
    // LAXEY WHEEL (Lady Isabella) — 22m diameter, red
    // -------------------------------------------------------
    function buildLaxeyWheel() {
        var wheelColor = 0xC87020;
        var spokenColor = 0xAA5510;
        var structureColor = 0xBB7722;
        var stoneColor = 0x999988;

        // offset: Laxey valley, east coast
        var bx = 150;
        var bz = -80;

        // WHEEL HUB — central axle cylinder
        makeCylinder(3, 3, 8, 12, structureColor, bx, 11, bz);

        // WHEEL RIM — large outer ring represented by cylinders
        // The wheel is 22m (72ft) diameter — scale 1:2 roughly = 11m radius
        // Represent as segmented arc cylinders around rim
        makeCylinder(1, 1, 14, 8, wheelColor, bx, 11, bz - 11);
        makeCylinder(1, 1, 14, 8, wheelColor, bx, 11, bz + 11);
        makeCylinder(1, 1, 14, 8, wheelColor, bx - 11, 11, bz);
        makeCylinder(1, 1, 14, 8, wheelColor, bx + 11, 11, bz);
        // diagonal rim segments
        makeCylinder(1, 1, 14, 8, wheelColor, bx - 8, 11, bz - 8);
        makeCylinder(1, 1, 14, 8, wheelColor, bx + 8, 11, bz - 8);
        makeCylinder(1, 1, 14, 8, wheelColor, bx - 8, 11, bz + 8);
        makeCylinder(1, 1, 14, 8, wheelColor, bx + 8, 11, bz + 8);

        // SPOKES — radiating from hub
        makeBox(22, 1, 1, spokenColor, bx, 11, bz);
        makeBox(1, 1, 22, spokenColor, bx, 11, bz);
        makeBox(16, 1, 16, 0x00000000, bx, 11, bz); // diagonal spoke proxy
        makeCylinder(0.8, 0.8, 20, 6, spokenColor, bx - 5, 11, bz);
        makeCylinder(0.8, 0.8, 20, 6, spokenColor, bx + 5, 11, bz);
        makeCylinder(0.8, 0.8, 20, 6, spokenColor, bx, 11, bz - 5);
        makeCylinder(0.8, 0.8, 20, 6, spokenColor, bx, 11, bz + 5);

        // WHEEL TOWER / SUPPORT STRUCTURE
        makeBox(6, 24, 4, stoneColor, bx, 11, bz - 4);
        makeBox(6, 24, 4, stoneColor, bx, 11, bz + 4);
        makeBox(6, 4, 8, stoneColor, bx, 22, bz);

        // stone engine house
        makeBox(16, 10, 12, stoneColor, bx - 15, 4, bz);
        makeBox(16, 3, 12, 0x887766, bx - 15, 11, bz);
        // chimney stack
        makeCylinder(1.5, 2, 12, 8, 0x776655, bx - 18, 10, bz);

        // access steps / path
        makeBox(4, 1, 20, 0xBBAACC, bx - 8, 0, bz);

        // laxey village nearby
        makeBox(12, 7, 10, 0xCCBBAA, bx - 40, 2, bz - 20);
        makeBox(12, 3, 10, 0x884422, bx - 40, 7, bz - 20);
        makeBox(10, 7, 10, 0xBBAA99, bx - 55, 2, bz - 25);
        makeBox(10, 3, 10, 0x774422, bx - 55, 7, bz - 25);
    }

    // -------------------------------------------------------
    // CALF OF MAN — small island, bird sanctuary
    // -------------------------------------------------------
    function buildCalfOfMan() {
        var islandColor = 0x8AB55A;
        var cliffColor = 0x887755;
        var lightColor = 0xFFFFEE;

        // calf of man landmass — south tip of island
        makeSphere(40, 10, 6, islandColor, -20, -20, 450);
        makeBox(60, 8, 70, islandColor, -20, -4, 450);
        // cliffs on western edge
        makeBox(8, 20, 70, cliffColor, -50, 5, 450);
        makeBox(60, 10, 8, cliffColor, -20, 5, 420);
        // sound (channel) between Calf and main island
        makeBox(60, 1, 30, 0x006994, -20, -2, 415);

        // CALF OF MAN LIGHTHOUSE
        makeCylinder(3, 4, 20, 10, lightColor, -20, 9, 445);
        makeCone(3, 4, 10, 0xCC2200, -20, 20, 445);
        // lighthouse keeper's cottage
        makeBox(10, 6, 8, lightColor, -30, 2, 445);
        makeBox(10, 3, 8, 0xCC2200, -30, 7, 445);

        // bird colony markers (small spheres on cliffs)
        makeSphere(2, 6, 4, 0xFFFFFF, -45, 12, 440);
        makeSphere(2, 6, 4, 0xFFFFFF, -48, 14, 445);
        makeSphere(1, 6, 4, 0xFFFFFF, -44, 10, 450);

        // ruined calf sound watch house
        makeBox(8, 5, 6, cliffColor, -10, 1, 430);
        makeBox(8, 2, 6, 0x776644, -10, 5, 430);

        // Kitterland islet (tiny rock between Calf and IoM)
        makeBox(10, 3, 10, 0x777766, -5, -1, 420);
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
