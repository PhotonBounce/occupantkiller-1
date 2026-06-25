window.RathlinIsland = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 19640;
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

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
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
        buildSea();
        buildIslandLandmass();
        buildBasaltCliffs();
        buildWestLighthouse();
        buildPuffinColony();
        buildHarbour();
        buildManorHouse();
        buildRobertBruceCave();
        buildSeabirdColony();
        buildBullPoint();
        buildWaveSpray();
        buildVegetation();
    }

    function buildSea() {
        // Main sea body — large flat box (using BoxGeometry, not PlaneGeometry)
        makeBox(1800, 2, 1400, 0x1E6BA8, 0, -1, 0);
        // Deeper trench zones — darker patches
        makeBox(500, 2, 400, 0x155A8A, -500, -0.5, -300);
        makeBox(400, 2, 350, 0x124E7A, 400, -0.5, 300);
        // North Atlantic open water
        makeBox(1800, 2, 200, 0x17547E, 0, -0.5, -650);
    }

    function buildIslandLandmass() {
        // Rathlin is L-shaped: main east-west body + southern spur
        // Main body (east-west elongated)
        makeBox(700, 12, 180, 0x228B22, 0, 6, 0);
        // Southern spur (forming the L)
        makeBox(200, 12, 200, 0x228B22, -200, 6, 140);
        // Slight elevation variation — central ridge
        makeBox(500, 6, 80, 0x1E7A1E, 50, 12, -10);
        // Eastern lowland
        makeBox(180, 8, 120, 0x2D9E2D, 280, 4, 20);
        // Western upland near cliffs
        makeBox(150, 18, 100, 0x1A6B1A, -270, 9, -20);
        // Soil/heath patches
        makeBox(120, 4, 60, 0x8B6914, -100, 8, 60);
        makeBox(80, 4, 50, 0x7A5C10, 100, 8, -40);
    }

    function buildBasaltCliffs() {
        // West-facing basalt cliffs — dark dramatic columns
        // Main cliff face
        makeBox(20, 60, 160, 0x2F2F2F, -340, 30, 0);
        // Cliff sections with irregular heights
        makeBox(20, 50, 40, 0x2A2A2A, -340, 25, -80);
        makeBox(20, 70, 30, 0x323232, -340, 35, -50);
        makeBox(20, 45, 50, 0x2C2C2C, -340, 22, 60);
        makeBox(20, 55, 35, 0x2E2E2E, -340, 27, 90);
        // Cliff base — fallen basalt talus
        makeBox(40, 10, 160, 0x3A3A3A, -355, 5, 0);
        makeBox(15, 6, 80, 0x383838, -360, 3, 40);
        // South cliff
        makeBox(180, 40, 20, 0x2F2F2F, -160, 20, 170);
        makeBox(80, 30, 20, 0x2A2A2A, 60, 15, 165);
        // Columnar basalt detail — individual columns
        makeCyl(3, 3, 50, 6, 0x282828, -342, 25, -20);
        makeCyl(3, 3, 45, 6, 0x2A2A2A, -342, 22, 10);
        makeCyl(4, 4, 55, 6, 0x272727, -342, 27, -5);
        makeCyl(3, 3, 40, 6, 0x2B2B2B, -342, 20, 25);
        // Cliff ledge shelves
        makeBox(25, 4, 50, 0x3C3C3C, -338, 20, -30);
        makeBox(25, 4, 40, 0x3A3A3A, -338, 28, 20);
    }

    function buildWestLighthouse() {
        // West Light — Rathlin's famous INVERTED lighthouse
        // Perched on cliff edge — wide base platform
        makeBox(20, 6, 20, 0xE8E0D0, -345, 53, -40);
        // Tall tower going UP from platform (conventional base)
        makeCyl(4, 5, 40, 8, 0xF0EBE0, -345, 73, -40);
        // The lantern room is BELOW the tower base (inverted — shines DOWN on cliffs)
        makeCyl(7, 7, 8, 8, 0xD0C8B8, -345, 50, -40);
        // Lantern glass housing (below)
        makeCyl(5, 5, 6, 8, 0x88CCFF, -345, 44, -40);
        // Light cone pointing down
        makeCone(6, 8, 8, 0xFFFF88, -345, 38, -40);
        // Keeper's cottage beside lighthouse
        makeBox(14, 10, 10, 0xE8E0D0, -330, 58, -40);
        // Cottage roof
        makeCone(9, 6, 4, 0x8B6914, -330, 64, -40);
        // Access walkway to lighthouse
        makeBox(30, 2, 3, 0xC8C0B0, -332, 53, -40);
        // Railing posts
        makeCyl(0.5, 0.5, 4, 4, 0x808080, -320, 55, -40);
        makeCyl(0.5, 0.5, 4, 4, 0x808080, -325, 55, -40);
        makeCyl(0.5, 0.5, 4, 4, 0x808080, -335, 55, -40);
        makeCyl(0.5, 0.5, 4, 4, 0x808080, -340, 55, -40);
    }

    function buildPuffinColony() {
        // Puffins on west cliff ledges — dozens of black bodies + orange beaks
        var puffinData = [
            [-336, 22, -25], [-334, 22, -20], [-336, 22, -15],
            [-334, 24, -30], [-336, 26, -10], [-334, 22, -5],
            [-336, 22, 5],   [-334, 24, 10],  [-336, 22, 15],
            [-334, 22, 20],  [-336, 26, 25],  [-334, 22, 30],
            [-336, 30, -35], [-334, 30, -28], [-336, 30, 35],
            [-334, 30, 42],  [-336, 20, 50],  [-334, 20, 55],
            [-336, 20, 60],  [-334, 24, 65],  [-336, 22, -40],
            [-334, 22, -45], [-336, 26, -50], [-334, 22, -55]
        ];
        for (var i = 0; i < puffinData.length; i++) {
            var pd = puffinData[i];
            // Body — black sphere
            makeSphere(1.2, 6, 5, 0x1A1A1A, pd[0], pd[1], pd[2]);
            // Beak — orange cone pointing outward
            var beak = new THREE.Mesh(
                new THREE.ConeGeometry(0.4, 1.2, 5),
                new THREE.MeshLambertMaterial({ color: 0xFF6B35 })
            );
            beak.position.set(OX + pd[0] + 1.4, OY + pd[1] + 0.2, OZ + pd[2]);
            beak.rotation.z = -Math.PI / 2;
            scene.add(beak);
            objects.push(beak);
            // White belly patch
            makeSphere(0.7, 5, 4, 0xFFFFFF, pd[0] + 0.8, pd[1] - 0.3, pd[2]);
        }
    }

    function buildHarbour() {
        // East harbour — Church Bay area
        // Harbour water
        makeBox(120, 3, 80, 0x006994, 300, 1, 30);
        // Stone pier — north arm
        makeBox(80, 8, 10, 0x808070, 270, 4, -10);
        // Stone pier — south arm
        makeBox(60, 8, 10, 0x808070, 280, 4, 70);
        // Pier end bollards
        makeCyl(1, 1, 5, 5, 0x505050, 305, 7, -10);
        makeCyl(1, 1, 5, 5, 0x505050, 315, 7, -10);
        // Slipway
        makeBox(20, 4, 40, 0x909080, 250, 2, 30);
        // Fishing boats — simple blocky shapes
        // Boat 1
        makeBox(14, 4, 5, 0xCC3333, 285, 4, 10);
        makeCyl(0.6, 0.6, 12, 5, 0x8B6914, 285, 10, 10);
        // Boat 2
        makeBox(12, 3, 4, 0x2255AA, 290, 4, 20);
        makeCyl(0.6, 0.6, 10, 5, 0x8B6914, 290, 9, 20);
        // Boat 3 — smaller
        makeBox(8, 3, 3, 0xCC8833, 296, 4, 8);
        // Harbour wall / seawall
        makeBox(10, 10, 100, 0x707065, 330, 5, 30);
        // Harbour master hut
        makeBox(12, 8, 10, 0xD4C9A8, 255, 12, -20);
        makeCone(8, 5, 4, 0x8B4513, 255, 17, -20);
        // Lobster pot stacks
        makeCyl(2, 2, 3, 5, 0x8B6914, 258, 9, -10);
        makeCyl(2, 2, 3, 5, 0x7A5C10, 262, 9, -10);
        makeCyl(2, 2, 3, 5, 0x8B6914, 258, 9, -6);
    }

    function buildManorHouse() {
        // Rathlin Manor House (now Manor House Hotel) — Georgian style
        // Main building body
        makeBox(50, 20, 30, 0xF5F0E8, 80, 10, -60);
        // Central pediment / portico
        makeBox(20, 24, 8, 0xF0EBE0, 80, 12, -74);
        makeCone(12, 8, 4, 0xD4CDB8, 80, 22, -74);
        // Wing — left
        makeBox(20, 16, 20, 0xF5F0E8, 45, 8, -60);
        // Wing — right
        makeBox(20, 16, 20, 0xF5F0E8, 115, 8, -60);
        // Chimneys
        makeCyl(1.5, 1.5, 8, 4, 0xA09080, 70, 26, -58);
        makeCyl(1.5, 1.5, 8, 4, 0xA09080, 90, 26, -58);
        makeCyl(1.5, 1.5, 6, 4, 0xA09080, 48, 22, -58);
        // Formal garden in front
        makeBox(40, 2, 20, 0x2E7D32, 80, 1, -45);
        // Garden hedges
        makeBox(4, 4, 20, 0x1B5E20, 62, 3, -45);
        makeBox(4, 4, 20, 0x1B5E20, 98, 3, -45);
        makeBox(40, 4, 3, 0x1B5E20, 80, 3, -36);
        // Garden path
        makeBox(6, 2, 16, 0xC8B89A, 80, 1, -45);
        // Garden urn / feature
        makeCyl(2, 3, 4, 8, 0xD0C8B0, 80, 3, -38);
        makeSphere(1.5, 6, 5, 0x2E7D32, 80, 6, -38);
    }

    function buildRobertBruceCave() {
        // Robert the Bruce cave on west cliffs — where he watched the spider
        // Cave mouth — dark arch cut into cliff
        makeBox(12, 14, 8, 0x1A1A1A, -338, 14, 70);
        // Cave interior depth
        makeBox(8, 10, 20, 0x0D0D0D, -330, 13, 70);
        // Rock overhang above cave
        makeBox(20, 6, 12, 0x2F2F2F, -338, 22, 70);
        // Cave floor rubble
        makeBox(10, 3, 7, 0x3A3530, -333, 7, 70);
        // Spider web visual suggestion — thin crossed box beams
        makeBox(0.3, 8, 0.3, 0xDDDDCC, -332, 15, 68);
        makeBox(8, 0.3, 0.3, 0xDDDDCC, -332, 15, 68);
        // Historical marker stone
        makeBox(3, 5, 2, 0x606055, -325, 9, 68);
    }

    function buildSeabirdColony() {
        // Guillemots and razorbills on cliff ledges
        var seabirdData = [
            [-335, 35, -60], [-333, 35, -55], [-335, 35, -50],
            [-333, 37, -45], [-335, 32, -40], [-333, 35, -35],
            [-335, 38, -65], [-333, 32, -70], [-335, 28, -75],
            [-333, 28, -80], [-335, 40, -85], [-333, 40, -90],
            [-335, 36, 80],  [-333, 36, 85],  [-335, 32, 90],
            [-333, 40, 95],  [-335, 44, 100], [-333, 44, 105]
        ];
        for (var j = 0; j < seabirdData.length; j++) {
            var sd = seabirdData[j];
            // Body — dark sphere (guillemot/razorbill coloring)
            makeSphere(1.0, 6, 5, 0x1C1C1C, sd[0], sd[1], sd[2]);
            // White breast
            makeSphere(0.6, 5, 4, 0xEEEEEE, sd[0] + 0.8, sd[1] - 0.2, sd[2]);
            // Bill — small cone
            var bill = new THREE.Mesh(
                new THREE.ConeGeometry(0.25, 0.8, 4),
                new THREE.MeshLambertMaterial({ color: 0x222222 })
            );
            bill.position.set(OX + sd[0] + 1.1, OY + sd[1] + 0.3, OZ + sd[2]);
            bill.rotation.z = -Math.PI / 2;
            scene.add(bill);
            objects.push(bill);
        }
    }

    function buildBullPoint() {
        // Bull Point — northernmost tip with sea stacks and skerries
        // Main headland
        makeBox(60, 22, 40, 0x2F3A2F, -50, 11, -170);
        // Sea stacks — isolated basalt columns rising from sea
        makeCyl(6, 8, 35, 6, 0x2A2A2A, -80, 17, -195);
        makeCyl(4, 6, 28, 6, 0x282828, -60, 14, -210);
        makeCyl(5, 7, 22, 6, 0x2C2C2C, -30, 11, -205);
        makeCyl(3, 4, 18, 6, 0x2A2A2A, -100, 9, -200);
        // Skerries — low flat rocks just above water
        makeBox(20, 4, 15, 0x3A3A38, -120, 2, -185);
        makeBox(15, 3, 12, 0x383836, -130, 1, -195);
        makeBox(25, 5, 10, 0x3C3C3A, -90, 2, -215);
        makeBox(12, 3, 8, 0x363634, -70, 1, -220);
        // Headland cliff faces
        makeBox(20, 30, 60, 0x282828, -80, 15, -175);
        makeBox(20, 25, 40, 0x2A2A2A, -20, 12, -168);
        // Arch rock feature
        makeBox(16, 10, 5, 0x2C2C2C, -65, 20, -188);
        makeBox(4, 16, 5, 0x2A2A2A, -58, 16, -188);
        makeBox(4, 16, 5, 0x2A2A2A, -72, 16, -188);
    }

    function buildWaveSpray() {
        // White wave crests and spray around island
        makeSphere(8, 6, 4, 0xEEF4FF, -400, 3, -50);
        makeSphere(6, 6, 4, 0xF0F5FF, -410, 2, 30);
        makeSphere(7, 6, 4, 0xEEF4FF, -405, 3, 90);
        makeSphere(5, 5, 4, 0xF2F6FF, -395, 2, -100);
        // Foam at cliff base
        makeBox(80, 2, 10, 0xDDEEFF, -370, 1, 0);
        makeBox(60, 2, 8, 0xDDEEFF, -370, 1, 50);
        makeBox(50, 2, 8, 0xDDEEFF, -370, 1, -50);
        // Wave crests on open water
        makeBox(60, 1, 4, 0xCCDDFF, -450, 2, -100);
        makeBox(80, 1, 4, 0xCCDDFF, -420, 2, 80);
        makeBox(70, 1, 4, 0xCCDDFF, -480, 2, 20);
        // North Atlantic swells
        makeBox(200, 3, 20, 0x1A5F9A, 0, 0, -600);
        makeBox(200, 3, 20, 0x1C638F, -100, 0, -550);
        makeBox(200, 3, 20, 0x1E6BA8, 100, 0, -580);
    }

    function buildVegetation() {
        // Gorse and heather patches across island
        makeSphere(5, 5, 4, 0xFFCC00, -50, 14, 40);
        makeSphere(4, 5, 4, 0xFFBB00, -80, 13, 60);
        makeSphere(6, 5, 4, 0xFFCC00, 20, 13, -30);
        makeSphere(3, 5, 4, 0xFF9900, -120, 12, 20);
        // Heather — purple
        makeSphere(5, 5, 4, 0x9B59B6, 0, 13, 50);
        makeSphere(4, 5, 4, 0x8E44AD, 60, 13, 60);
        makeSphere(6, 5, 4, 0x7D3C98, -30, 14, -20);
        // Lone windswept trees (small)
        makeCyl(1, 2, 8, 5, 0x5C3A1E, 150, 12, -50);
        makeSphere(5, 5, 4, 0x1A5C1A, 150, 18, -50);
        makeCyl(1, 2, 7, 5, 0x5C3A1E, 170, 11, -40);
        makeSphere(4, 5, 4, 0x1A5C1A, 170, 16, -40);
        // Bog cotton / marsh patches
        makeSphere(2, 4, 3, 0xFFFFFF, -60, 12, 80);
        makeSphere(2, 4, 3, 0xFFFFFF, -65, 12, 75);
        makeSphere(2, 4, 3, 0xFFFFFF, -55, 12, 85);
        // Stone wall field boundaries (very common on Rathlin)
        makeBox(60, 3, 2, 0x808070, 50, 10, 0);
        makeBox(60, 3, 2, 0x808070, 50, 10, 40);
        makeBox(2, 3, 40, 0x808070, 20, 10, 20);
        makeBox(2, 3, 40, 0x808070, 80, 10, 20);
        // RSPB Rathlin West Light seabird centre building
        makeBox(18, 8, 12, 0xE0D8C8, -310, 56, -55);
        makeCone(10, 5, 4, 0x8B6914, -310, 61, -55);
        // Lookout platform
        makeBox(14, 2, 14, 0xC0B8A8, -310, 60, -55);
        // Road/track across island
        makeBox(300, 1, 5, 0x706860, 50, 7, 0);
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
