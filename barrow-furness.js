window.BarrowFurness = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 22360;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMat(hex) {
        return new THREE.MeshLambertMaterial({ color: hex });
    }

    function makeBox(w, h, d, hex, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(hex);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCyl(rt, rb, h, segs, hex, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(hex);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, hex, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(hex);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, hex, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(hex);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeLines(points, hex, x, y, z) {
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.LineBasicMaterial({ color: hex });
        var line = new THREE.LineSegments(geo, mat);
        line.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        scene.add(line);
        objects.push(line);
        return line;
    }

    function buildDevonshireDockHall() {
        // The massive covered building slip — world's largest covered shipbuilding hall
        // Main shed body — enormous industrial shed
        makeBox(250, 60, 100, 0x555555, 0, 30, 0);
        // Roof ridge beam
        makeBox(252, 4, 4, 0x444444, 0, 62, 0);
        // Side walls lower darker band
        makeBox(250, 10, 102, 0x4a4a4a, 0, 5, 0);
        // Roof slope left
        makeBox(252, 6, 54, 0x4d4d4d, 0, 60, -27);
        // Roof slope right
        makeBox(252, 6, 54, 0x4d4d4d, 0, 60, 27);
        // End gable north
        makeBox(4, 60, 100, 0x505050, 127, 30, 0);
        // End gable south
        makeBox(4, 60, 100, 0x505050, -127, 30, 0);
        // Large roller doors north end
        makeBox(2, 40, 60, 0x333333, 128, 20, 0);
        // Second bay extension
        makeBox(120, 50, 80, 0x575757, 185, 25, 10);
        // Extension roof
        makeBox(122, 4, 82, 0x4a4a4a, 185, 51, 10);
    }

    function buildGantryCranes() {
        // Gantry crane 1 — tall overhead running crane
        // Left leg
        makeBox(4, 80, 4, 0x888888, -80, 40, -55);
        // Right leg
        makeBox(4, 80, 4, 0x888888, -80, 40, 55);
        // Cross beam
        makeBox(4, 4, 120, 0x888888, -80, 82, 0);
        // Trolley
        makeBox(10, 6, 10, 0x999999, -80, 79, 10);
        // Hoist cable
        makeBox(1, 30, 1, 0x666666, -80, 64, 10);
        // Hook
        makeCyl(2, 2, 4, 6, 0x777777, -80, 47, 10);

        // Gantry crane 2
        makeBox(4, 80, 4, 0x888888, 60, 40, -55);
        makeBox(4, 80, 4, 0x888888, 60, 40, 55);
        makeBox(4, 4, 120, 0x888888, 60, 82, 0);
        makeBox(10, 6, 10, 0x999999, 60, 79, -20);
        makeBox(1, 25, 1, 0x666666, 60, 66, -20);
        makeCyl(2, 2, 4, 6, 0x777777, 60, 52, -20);
    }

    function buildDryDock() {
        // Dry dock — long rectangular excavation represented by walls
        // North wall
        makeBox(200, 12, 6, 0x4a4a50, 20, 6, -70);
        // South wall
        makeBox(200, 12, 6, 0x4a4a50, 20, 6, 70);
        // West end wall
        makeBox(6, 12, 140, 0x4a4a50, -80, 6, 0);
        // East end wall (open to dock)
        makeBox(6, 12, 140, 0x4a4a50, 120, 6, 0);
        // Dock floor
        makeBox(200, 2, 130, 0x3a3a3a, 20, -1, 0);
        // Dock water/mud bottom visual
        makeBox(190, 1, 120, 0x1a3a4a, 20, 0, 0);
        // Keel blocks
        makeBox(180, 3, 6, 0x222222, 20, 1, 0);
    }

    function buildSubmarinHull() {
        // Nuclear submarine — long dark cigar shape in dry dock
        // Main pressure hull sections
        makeCyl(7, 7, 120, 16, 0x333333, 10, 8, 0);
        // Bow nose (tapered)
        makeCyl(0, 7, 20, 16, 0x2d2d2d, 70, 8, 0);
        // Stern section taper
        makeCyl(3, 7, 15, 16, 0x2d2d2d, -65, 8, 0);
        // Fin / sail (conning tower)
        makeBox(8, 14, 4, 0x2a2a2a, 15, 19, 0);
        // Sail top
        makeBox(6, 2, 3, 0x282828, 15, 26, 0);
        // Periscope/mast
        makeCyl(0.4, 0.4, 10, 6, 0x1a1a1a, 15, 31, 0);
        // Hydroplanes bow
        makeBox(2, 1, 24, 0x2e2e2e, 60, 8, 0);
        // Hydroplanes stern
        makeBox(2, 1, 20, 0x2e2e2e, -55, 8, 0);
        // Rudder
        makeBox(1, 12, 2, 0x2a2a2a, -60, 13, 0);
        // Propeller shroud (crude)
        makeCyl(5, 5, 4, 12, 0x252525, -72, 8, 0);
    }

    function buildBarrowDocks() {
        // Devonshire Dock water area
        makeBox(300, 2, 200, 0x006994, -250, -1, 150);
        // Dock entrance breakwater north
        makeBox(80, 4, 10, 0x5a5a5a, -320, 2, 60);
        // Dock entrance breakwater south
        makeBox(80, 4, 10, 0x5a5a5a, -320, 2, 240);

        // Buccleuch Dock
        makeBox(200, 2, 160, 0x4682B4, -300, -1, -200);
        // Buccleuch Dock walls
        makeBox(202, 8, 4, 0x555560, -300, 4, -120);
        makeBox(202, 8, 4, 0x555560, -300, 4, -280);
        makeBox(4, 8, 160, 0x555560, -200, 4, -200);
        makeBox(4, 8, 160, 0x555560, -400, 4, -200);

        // Timber wharves — long low platforms
        makeBox(120, 4, 20, 0x8B6914, -200, 2, -120);
        makeBox(120, 4, 20, 0x8B6914, -200, 2, -140);
        makeBox(100, 4, 20, 0x7a5c10, -350, 2, -120);

        // Warehouse along dock
        makeBox(80, 18, 30, 0x6a6a70, -160, 9, -115);
        makeBox(60, 15, 25, 0x6a6a70, -380, 9, -115);

        // Quayside bollards
        makeCyl(1, 1, 4, 6, 0x333333, -160, 2, -108);
        makeCyl(1, 1, 4, 6, 0x333333, -180, 2, -108);
        makeCyl(1, 1, 4, 6, 0x333333, -200, 2, -108);
        makeCyl(1, 1, 4, 6, 0x333333, -220, 2, -108);
    }

    function buildVickersCrane() {
        // Giant shipbuilding hammerhead crane — Barrow's iconic skyline feature
        // Main tower column
        makeBox(14, 120, 14, 0x888888, -100, 60, -200);
        // Tower base spread
        makeBox(30, 20, 30, 0x777777, -100, 10, -200);
        // Hammerhead top horizontal jib — extending both sides
        makeBox(160, 8, 8, 0x888888, -100, 124, -200);
        // Counter-jib weight block
        makeBox(20, 14, 14, 0x666666, -170, 122, -200);
        // Main jib tip
        makeBox(10, 6, 10, 0x888888, -20, 122, -200);
        // Trolley on jib
        makeBox(8, 5, 8, 0x999999, -50, 120, -200);
        // Hook cable
        makeBox(1, 40, 1, 0x666666, -50, 100, -200);
        // Hook block
        makeBox(4, 6, 4, 0x777777, -50, 79, -200);
        // Tower bracing diagonals represented as thin boxes
        makeBox(2, 60, 2, 0x777777, -107, 60, -207);
        makeBox(2, 60, 2, 0x777777, -93, 60, -193);
        // Secondary smaller crane nearby
        makeBox(8, 70, 8, 0x888888, -60, 35, -195);
        makeBox(80, 5, 5, 0x888888, -60, 72, -195);
    }

    function buildBarrowTown() {
        // Victorian planned town — grid of terraced streets
        // Town centre main street axis
        makeBox(200, 12, 20, 0xC8B89A, -150, 6, -380);
        makeBox(200, 12, 20, 0xC8B89A, -150, 6, -420);
        makeBox(200, 12, 20, 0xC8B89A, -150, 6, -460);
        // Cross streets
        makeBox(20, 12, 120, 0xC8B89A, -200, 6, -420);
        makeBox(20, 12, 120, 0xC8B89A, -100, 6, -420);
        makeBox(20, 12, 120, 0xC8B89A, 0, 6, -420);
        // Terrace blocks further north
        makeBox(180, 10, 18, 0xC0A890, -120, 5, -500);
        makeBox(180, 10, 18, 0xC0A890, -120, 5, -530);
        makeBox(18, 10, 80, 0xC0A890, -200, 5, -505);
        makeBox(18, 10, 80, 0xC0A890, -40, 5, -505);

        // Town Hall — civic centrepiece
        makeBox(40, 24, 30, 0xBBAA88, -130, 12, -370);
        // Town Hall portico columns
        makeCyl(2, 2, 24, 8, 0xCCBB99, -115, 12, -356);
        makeCyl(2, 2, 24, 8, 0xCCBB99, -125, 12, -356);
        makeCyl(2, 2, 24, 8, 0xCCBB99, -135, 12, -356);
        makeCyl(2, 2, 24, 8, 0xCCBB99, -145, 12, -356);
        // Clocktower
        makeBox(10, 40, 10, 0xBBAA88, -130, 32, -370);
        // Clock face box
        makeBox(10.5, 8, 2, 0xDDCCAA, -130, 44, -365);
        // Clocktower spire
        makeCone(5, 16, 4, 0xAA9966, -130, 56, -370);

        // St George's Church
        makeBox(24, 22, 18, 0xC8B89A, -60, 11, -390);
        // Church tower
        makeBox(8, 36, 8, 0xC8B89A, -48, 18, -390);
        makeCone(4, 12, 4, 0xAA9966, -48, 42, -390);

        // Market Hall
        makeBox(35, 16, 28, 0xC2B090, -180, 8, -395);
        // Market Hall roof ridge
        makeCone(18, 10, 4, 0xAA9870, -180, 21, -395);

        // Park square — open area with trees represented as spheres
        makeSphere(4, 6, 6, 0x3a7a3a, -100, 4, -450);
        makeSphere(4, 6, 6, 0x3a7a3a, -80, 4, -450);
        makeSphere(4, 6, 6, 0x3a7a3a, -120, 4, -450);
    }

    function buildFurnessAbbey() {
        // Red sandstone Cistercian abbey ruins — 2km north of town
        // Abbey church nave walls — roofless ruin
        makeBox(80, 18, 6, 0xC8A870, -80, 9, -2200);
        makeBox(80, 18, 6, 0xC8A870, -80, 9, -2260);
        // Transept walls
        makeBox(6, 18, 60, 0xC8A870, -110, 9, -2230);
        makeBox(6, 18, 60, 0xC8A870, -50, 9, -2230);
        // Crossing tower — largest standing ruin feature
        makeBox(16, 38, 16, 0xC8A870, -80, 19, -2230);
        // Tower window openings (dark boxes inset)
        makeBox(4, 8, 1, 0x5a3a20, -80, 30, -2222);
        makeBox(4, 8, 1, 0x5a3a20, -80, 30, -2238);
        // Chapter house walls
        makeBox(30, 12, 6, 0xBB9860, -30, 6, -2250);
        makeBox(6, 12, 30, 0xBB9860, -27, 6, -2240);
        // Cloister arcade pillars
        makeCyl(1, 1, 12, 6, 0xC8A870, -60, 6, -2245);
        makeCyl(1, 1, 12, 6, 0xC8A870, -55, 6, -2245);
        makeCyl(1, 1, 12, 6, 0xC8A870, -50, 6, -2245);
        makeCyl(1, 1, 12, 6, 0xC8A870, -60, 6, -2255);
        makeCyl(1, 1, 12, 6, 0xC8A870, -55, 6, -2255);
        makeCyl(1, 1, 12, 6, 0xC8A870, -50, 6, -2255);
        // Presbytery east end — three lancet arches suggestion
        makeBox(6, 22, 2, 0xC8A870, -60, 11, -2200);
        makeBox(6, 22, 2, 0xC8A870, -80, 11, -2200);
        makeBox(6, 22, 2, 0xC8A870, -100, 11, -2200);
        // Valley floor — green dell
        makeBox(200, 2, 200, 0x4a7a3a, -80, -1, -2230);
        // Wooded valley sides — tree spheres
        makeSphere(12, 6, 6, 0x2d6030, -160, 6, -2230);
        makeSphere(10, 6, 6, 0x336633, -150, 5, -2210);
        makeSphere(14, 6, 6, 0x2a5a2a, 0, 7, -2230);
        makeSphere(11, 6, 6, 0x2d6030, 10, 5, -2250);
    }

    function buildWalneyIsland() {
        // Walney Island — long barrier island to the west across Walney Channel
        makeBox(400, 4, 80, 0x8AB55A, -600, 2, 400);
        // Vegetation on island
        makeSphere(10, 6, 6, 0x6a9a40, -550, 6, 380);
        makeSphere(8, 6, 6, 0x5a8a30, -620, 5, 420);
        makeSphere(12, 6, 6, 0x6a9a40, -700, 6, 400);
        // North Walney nature reserve suggestion — low dunes
        makeBox(60, 6, 40, 0x9aaa70, -800, 3, 400);
        // Walney Channel between island and mainland
        makeBox(300, 2, 120, 0x006994, -450, -1, 350);
        // Road bridge linking Barrow to Walney
        makeBox(100, 4, 8, 0x888888, -400, 2, 350);
        // Bridge support piers
        makeCyl(3, 3, 10, 6, 0x777777, -370, 5, 350);
        makeCyl(3, 3, 10, 6, 0x777777, -400, 5, 350);
        makeCyl(3, 3, 10, 6, 0x777777, -430, 5, 350);
        // Vickerstown — residential settlement on Walney
        makeBox(80, 8, 40, 0xC8B89A, -600, 4, 370);
        makeBox(80, 8, 40, 0xC8B89A, -620, 4, 420);
        // Lighthouse at south Walney
        makeCyl(3, 4, 20, 8, 0xEEEEDD, -750, 10, 450);
        makeCone(3, 5, 8, 0xCC2222, -750, 22, 450);
    }

    function buildMorecambeBay() {
        // Vast shallow tidal bay to the south and east
        makeBox(600, 2, 400, 0x006994, 200, -1, 400);
        // Sandbanks — exposed at low tide
        makeBox(100, 1, 60, 0xD4C090, 300, 0, 450);
        makeBox(80, 1, 40, 0xD4C090, 450, 0, 500);
        makeBox(120, 1, 50, 0xD4C090, 200, 0, 600);
        // Rampside — small coastal settlement
        makeBox(30, 8, 20, 0xC8B89A, 200, 4, 400);
        makeCyl(2, 2, 14, 6, 0xDDCCAA, 200, 7, 390);
        // Causeway to Roa Island
        makeBox(80, 3, 6, 0x888888, 280, 1, 420);
        // Roa Island
        makeBox(40, 3, 30, 0x7a9a5a, 330, 1, 420);
    }

    function buildSteelworksGhost() {
        // Former ironworks and steelworks — now cleared but some remnants
        // Blast furnace footings
        makeCyl(12, 14, 6, 8, 0x888888, 280, 3, -100);
        makeCyl(10, 12, 6, 8, 0x888888, 310, 3, -100);
        // Old foundry shed ruin — partial walls
        makeBox(100, 8, 4, 0x888888, 250, 4, -140);
        makeBox(4, 8, 60, 0x888888, 200, 4, -110);
        makeBox(4, 8, 60, 0x888888, 300, 4, -110);
        // Chimney stacks — decommissioned
        makeCyl(3, 4, 40, 8, 0x888888, 220, 20, -100);
        makeCyl(3, 4, 50, 8, 0x888888, 260, 25, -120);
        // Slag heap suggestion
        makeCone(30, 20, 8, 0x777766, 350, 10, -80);
        // Cleared ground — rubble
        makeBox(150, 2, 100, 0x888888, 250, 1, -100);
    }

    function buildPielCastle() {
        // Ruined medieval castle on Piel Island — offshore
        // Piel Island itself
        makeBox(100, 3, 80, 0x8a9a60, 400, 1, 600);
        // Keep — main tower
        makeBox(18, 22, 18, 0xAAAAAA, 400, 11, 600);
        // Keep walls with battlements
        makeBox(20, 4, 2, 0xAAAAAA, 400, 23, 590);
        makeBox(20, 4, 2, 0xAAAAAA, 400, 23, 610);
        makeBox(2, 4, 20, 0xAAAAAA, 390, 23, 600);
        makeBox(2, 4, 20, 0xAAAAAA, 410, 23, 600);
        // Merlons on battlements
        makeBox(4, 3, 2, 0xAAAAAA, 394, 26, 590);
        makeBox(4, 3, 2, 0xAAAAAA, 404, 26, 590);
        makeBox(4, 3, 2, 0xAAAAAA, 394, 26, 610);
        makeBox(4, 3, 2, 0xAAAAAA, 404, 26, 610);
        // Outer ward curtain wall
        makeBox(50, 8, 3, 0xAAAAAA, 400, 4, 575);
        makeBox(50, 8, 3, 0xAAAAAA, 400, 4, 625);
        makeBox(3, 8, 50, 0xAAAAAA, 375, 4, 600);
        makeBox(3, 8, 50, 0xAAAAAA, 425, 4, 600);
        // Gatehouse tower
        makeBox(10, 16, 10, 0xBBBBBB, 425, 8, 600);
        // Surrounding sea
        makeBox(200, 2, 200, 0x006994, 400, -1, 600);
    }

    function buildGroundPlane() {
        // Base ground around the whole area
        makeBox(1200, 2, 1200, 0x4a5040, 0, -2, -500);
        // Road network — main arterial
        makeBox(600, 1, 12, 0x333333, -100, 0, -340);
        makeBox(12, 1, 400, 0x333333, -130, 0, -420);
        // Dock road
        makeBox(300, 1, 10, 0x333333, -100, 0, -300);
    }

    function buildWireframeAccents() {
        // Grid overlay on dry dock using LineSegments for visual detail
        var dockPoints = [
            new THREE.Vector3(-100, 12, -70), new THREE.Vector3(120, 12, -70),
            new THREE.Vector3(-100, 12, 70), new THREE.Vector3(120, 12, 70),
            new THREE.Vector3(-100, 12, -70), new THREE.Vector3(-100, 12, 70),
            new THREE.Vector3(120, 12, -70), new THREE.Vector3(120, 12, 70)
        ];
        makeLines(dockPoints, 0x666666, 0, 0, 0);

        // Crane rail lines on shed floor
        var railPoints = [
            new THREE.Vector3(-125, 1, -45), new THREE.Vector3(125, 1, -45),
            new THREE.Vector3(-125, 1, 45), new THREE.Vector3(125, 1, 45)
        ];
        makeLines(railPoints, 0x888888, 0, 0, 0);
    }

    function build() {
        buildGroundPlane();
        buildDryDock();
        buildDevonshireDockHall();
        buildGantryCranes();
        buildSubmarinHull();
        buildBarrowDocks();
        buildVickersCrane();
        buildBarrowTown();
        buildFurnessAbbey();
        buildWalneyIsland();
        buildMorecambeBay();
        buildSteelworksGhost();
        buildPielCastle();
        buildWireframeAccents();
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
