window.KingsLynn = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 21720;
    var OY = 0;
    var OZ = 0;

    function makeMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        return makeMesh(geo, color, x, y, z);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        return makeMesh(geo, color, x, y, z);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        return makeMesh(geo, color, x, y, z);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        return makeMesh(geo, color, x, y, z);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function build() {
        buildFenGround();
        buildTheWash();
        buildRiverGreatOuse();
        buildTuesdayMarketPlace();
        buildStMargaretsPriory();
        buildTheGuildhall();
        buildHamptonCourt();
        buildKingsLynnDocks();
        buildSouthGate();
        buildSandringkhamEstate();
        buildMerchantHouses();
        buildFenDitches();
        buildTownWallRemnants();
    }

    function buildFenGround() {
        // Main fen ground plane built from boxes
        makeBox(1200, 2, 1200, 0x7B9E5A, 0, -1, 0);
        // Eastern fen extension
        makeBox(600, 2, 800, 0x6E8F50, 350, -1, -200);
        // Southern fen
        makeBox(500, 2, 400, 0x7B9E5A, -100, -1, 300);
        // Peat ground patches darker
        makeBox(200, 1, 150, 0x5C7A40, 80, -0.5, 120);
        makeBox(180, 1, 130, 0x5C7A40, -90, -0.5, -80);
        makeBox(160, 1, 200, 0x4A6330, 200, -0.5, 50);
    }

    function buildTheWash() {
        // The Wash — shallow bay, large flat water body to the NW
        makeBox(500, 1, 700, 0x006994, -350, -0.8, -150);
        // Mudflats — sandy/muddy shallows
        makeBox(200, 1, 300, 0x8B7355, -220, -0.6, -100);
        makeBox(150, 1, 200, 0x9C8B6A, -180, -0.5, 50);
        makeBox(120, 1, 180, 0x8B7355, -260, -0.5, 80);
        // Outer deeper water
        makeBox(300, 1, 400, 0x005580, -480, -1, -200);
        // Sandbars
        makeBox(80, 1, 40, 0xC8B88A, -300, -0.3, -180);
        makeBox(60, 1, 30, 0xC8B88A, -320, -0.3, -50);
    }

    function buildRiverGreatOuse() {
        // Great Ouse river running N-S through the town — wide tidal river
        makeBox(80, 1, 600, 0x4682B4, -80, -0.5, 0);
        // Wider tidal section near docks
        makeBox(120, 1, 200, 0x4682B4, -90, -0.5, -180);
        // Quayside — historic merchant quay along the east bank
        makeBox(20, 2, 600, 0x8B7355, -30, 1, 0);
        // West bank lower quay
        makeBox(15, 2, 400, 0x7A6548, -140, 1, 50);
        // Moored barge — flat hull
        makeBox(30, 4, 12, 0x444444, -75, 2, -80);
        // Barge cabin
        makeBox(10, 3, 8, 0x333333, -72, 5, -80);
        // Second barge
        makeBox(28, 4, 10, 0x3D3D3D, -85, 2, 30);
        // Barge cabin 2
        makeBox(8, 3, 6, 0x2A2A2A, -82, 5, 30);
    }

    function buildTuesdayMarketPlace() {
        // Tuesday Market Place — one of England's finest medieval market squares
        // Large paved square
        makeBox(120, 1, 120, 0xDEB887, 50, 0.5, -20);
        // Cobblestone centre pattern (slightly raised)
        makeBox(60, 1, 60, 0xD2A679, 50, 1, -20);
        // Market cross / central feature
        makeCylinder(2, 3, 8, 8, 0xC8A870, 50, 4, -20);
        makeCone(4, 5, 8, 0x8B6914, 50, 11, -20);

        // Georgian buildings N side of square
        makeBox(25, 18, 12, 0xDEB887, 10, 9, -80);
        makeBox(3, 20, 12, 0xC8A870, 35, 10, -80);
        makeBox(28, 16, 12, 0xDEB887, 65, 8, -80);
        // Georgian windows suggestion (darker recessed strips)
        makeBox(2, 14, 1, 0xBB9966, 10, 9, -74);
        makeBox(2, 14, 1, 0xBB9966, 18, 9, -74);
        makeBox(2, 14, 1, 0xBB9966, 65, 8, -74);
        makeBox(2, 14, 1, 0xBB9966, 73, 8, -74);
        // Rooflines
        makeBox(25, 3, 14, 0x8B6914, 10, 19, -80);
        makeBox(28, 3, 14, 0x8B6914, 65, 17, -80);

        // Medieval buildings E side
        makeBox(12, 14, 30, 0xC8A870, 110, 7, -30);
        makeBox(12, 12, 25, 0xBB9966, 110, 6, 10);
        // E side roofs
        makeCone(8, 6, 4, 0x8B6914, 110, 18, -30);
        makeCone(7, 5, 4, 0x7A5C14, 110, 16, 10);

        // S side buildings
        makeBox(30, 15, 12, 0xD4B896, 30, 7.5, 40);
        makeBox(22, 13, 12, 0xDEB887, 75, 6.5, 40);
        // Inn sign post
        makeCylinder(0.5, 0.5, 12, 6, 0x5C3A1E, 85, 6, 36);
        makeBox(4, 2, 1, 0x8B4513, 85, 12, 36);

        // W side — older medieval building
        makeBox(12, 16, 40, 0xC4A882, -10, 8, -15);
        makeBox(2, 16, 2, 0xB09870, -10, 8, -35);
        makeBox(2, 16, 2, 0xB09870, -10, 8, 5);
    }

    function buildStMargaretsPriory() {
        // St Margaret's Priory (Minster) — twin-towered Norman minster
        // Main nave body
        makeBox(24, 22, 70, 0xD4C8A0, -150, 11, 50);
        // Massive west front
        makeBox(30, 30, 8, 0xD4C8A0, -150, 15, 88);
        // Twin towers on west front
        makeBox(10, 45, 10, 0xC8BC94, -162, 22.5, 88);
        makeBox(10, 45, 10, 0xC8BC94, -138, 22.5, 88);
        // Tower caps / battlements
        makeBox(12, 3, 12, 0xBCB088, -162, 46, 88);
        makeBox(12, 3, 12, 0xBCB088, -138, 46, 88);
        // Tower spirelets
        makeCone(3, 12, 4, 0xB0A47C, -162, 52, 88);
        makeCone(3, 12, 4, 0xB0A47C, -138, 52, 88);
        // Chancel E end
        makeBox(18, 20, 14, 0xD4C8A0, -150, 10, -12);
        // Transepts
        makeBox(50, 18, 12, 0xD0C49C, -150, 9, 30);
        // Crossing tower
        makeBox(12, 35, 12, 0xC8BC94, -150, 17.5, 50);
        makeCone(5, 15, 4, 0xB8AC88, -150, 42, 50);
        // Great window tracery suggestion
        makeBox(14, 18, 2, 0xE8E0C0, -150, 15, 92);
        // Churchyard wall
        makeBox(120, 3, 3, 0xB0A888, -150, 1.5, 100);
        makeBox(3, 3, 80, 0xB0A888, -195, 1.5, 55);
        makeBox(3, 3, 80, 0xB0A888, -105, 1.5, 55);
    }

    function buildTheGuildhall() {
        // The Guildhall — unique chequerboard flint-and-stone pattern
        // Main block
        makeBox(28, 16, 18, 0xF5F0E8, 30, 8, 80);
        // Chequer pattern — alternating flint dark squares
        makeBox(4, 4, 1, 0x555555, 20, 12, 89);
        makeBox(4, 4, 1, 0xF5F0E8, 26, 12, 89);
        makeBox(4, 4, 1, 0x555555, 32, 12, 89);
        makeBox(4, 4, 1, 0xF5F0E8, 38, 12, 89);
        makeBox(4, 4, 1, 0xF5F0E8, 20, 6, 89);
        makeBox(4, 4, 1, 0x555555, 26, 6, 89);
        makeBox(4, 4, 1, 0xF5F0E8, 32, 6, 89);
        makeBox(4, 4, 1, 0x555555, 38, 6, 89);
        // Upper gable
        makeCone(16, 10, 4, 0xE8E0D0, 30, 23, 80);
        // Entrance porch
        makeBox(8, 10, 6, 0xF0EAD8, 30, 5, 92);
        makeCone(5, 5, 4, 0xD8D0B8, 30, 14, 92);
        // Side annex (gaol wing)
        makeBox(12, 12, 14, 0xE8E0D0, 52, 6, 80);
    }

    function buildHamptonCourt() {
        // Hampton Court — 15th century merchant's courtyard complex
        // Main range
        makeBox(40, 14, 12, 0xC8B89A, 160, 7, 80);
        // N wing
        makeBox(12, 14, 35, 0xC0B090, 183, 7, 62);
        // S wing
        makeBox(12, 14, 35, 0xC0B090, 137, 7, 62);
        // Courtyard surface
        makeBox(30, 1, 24, 0xB8A880, 160, 0.5, 68);
        // Gate arch tower
        makeBox(8, 18, 8, 0xBBA888, 160, 9, 86);
        makeCone(5, 8, 4, 0x8B7355, 160, 21, 86);
        // Merchant warehouse
        makeBox(22, 10, 18, 0xC4B494, 140, 5, 55);
        // Undercroft arches suggestion
        makeBox(20, 4, 16, 0xB0A07A, 140, 2, 55);
        // Roof lines
        makeBox(42, 3, 14, 0x8B7355, 160, 16, 80);
        makeBox(14, 3, 37, 0x8B7355, 183, 16, 62);
        makeBox(14, 3, 37, 0x8B7355, 137, 16, 62);
        // Chimney stacks
        makeCylinder(1, 1, 6, 6, 0x8B7355, 168, 19, 80);
        makeCylinder(1, 1, 6, 6, 0x8B7355, 150, 19, 80);
    }

    function buildKingsLynnDocks() {
        // King's Lynn Docks — working port on Great Ouse
        // Dock basin (recessed water area)
        makeBox(150, 1, 120, 0x3A6E8C, -60, -0.3, -220);
        // Quay walls
        makeBox(150, 4, 5, 0x555555, -60, 2, -160);
        makeBox(150, 4, 5, 0x555555, -60, 2, -280);
        makeBox(5, 4, 120, 0x555555, 15, 2, -220);
        // Container terminal — stacked containers
        makeBox(18, 8, 10, 0xCC3333, -20, 4, -200);
        makeBox(18, 8, 10, 0x3333CC, -20, 4, -215);
        makeBox(18, 8, 10, 0x33CC33, -40, 4, -200);
        makeBox(18, 8, 10, 0xCCCC33, -40, 4, -215);
        makeBox(18, 8, 10, 0xCC3333, -20, 12, -200);
        makeBox(18, 8, 10, 0x3333CC, -40, 12, -215);
        // Grain silos — tall cylinders
        makeCylinder(8, 8, 50, 12, 0xD8D0C0, -90, 25, -210);
        makeCylinder(8, 8, 50, 12, 0xD0C8B8, -108, 25, -210);
        makeCylinder(8, 8, 50, 12, 0xD8D0C0, -126, 25, -210);
        // Silo tops
        makeCone(9, 6, 12, 0xC0B8A8, -90, 52, -210);
        makeCone(9, 6, 12, 0xC0B8A8, -108, 52, -210);
        makeCone(9, 6, 12, 0xC0B8A8, -126, 52, -210);
        // Port cranes — tall tower + horizontal jib
        makeCylinder(2, 3, 40, 6, 0xFFAA00, -50, 20, -175);
        makeBox(35, 3, 3, 0xFFAA00, -32, 41, -175);
        makeCylinder(1, 1, 30, 6, 0xFFAA00, -14, 15, -175);
        // Second crane
        makeCylinder(2, 3, 35, 6, 0xFFAA00, -70, 17.5, -175);
        makeBox(30, 3, 3, 0xFFAA00, -55, 36, -175);
        // Warehouse sheds
        makeBox(60, 12, 25, 0x666666, -60, 6, -260);
        makeBox(3, 14, 25, 0x555555, -30, 7, -260);
        // Dock office building
        makeBox(16, 10, 12, 0x888888, 0, 5, -170);
    }

    function buildSouthGate() {
        // South Gate — last surviving medieval town gate
        // Main gate tower
        makeBox(16, 28, 12, 0xAAAAAA, 40, 14, 200);
        // Battlements top
        makeBox(18, 4, 14, 0x999999, 40, 30, 200);
        // Merlons (battlements)
        makeBox(3, 4, 2, 0xAAAAAA, 33, 33, 200);
        makeBox(3, 4, 2, 0xAAAAAA, 39, 33, 200);
        makeBox(3, 4, 2, 0xAAAAAA, 45, 33, 200);
        // Gate arch void (dark fill to suggest arch)
        makeBox(6, 10, 14, 0x333333, 40, 5, 200);
        // Flanking turrets
        makeCylinder(4, 4, 30, 8, 0xB0B0B0, 32, 15, 200);
        makeCylinder(4, 4, 30, 8, 0xB0B0B0, 48, 15, 200);
        // Turret caps
        makeCone(5, 8, 8, 0x888888, 32, 32, 200);
        makeCone(5, 8, 8, 0x888888, 48, 32, 200);
        // Flanking wall remnants
        makeBox(30, 10, 3, 0xA0A0A0, 10, 5, 200);
        makeBox(30, 10, 3, 0xA0A0A0, 70, 5, 200);
        // Drawbridge approach
        makeBox(8, 1, 20, 0x8B7355, 40, 0.5, 212);
    }

    function buildSandringkhamEstate() {
        // Sandringham Estate — NE of town through pinewoods
        // Pine woodland (cone trees) to the NE
        makeCone(8, 20, 6, 0x2D5A1B, 200, 10, -300);
        makeCone(7, 18, 6, 0x336622, 220, 9, -320);
        makeCone(9, 22, 6, 0x2A4F18, 240, 11, -310);
        makeCone(7, 17, 6, 0x336622, 215, 8.5, -340);
        makeCone(8, 20, 6, 0x2D5A1B, 260, 10, -330);
        makeCone(6, 15, 6, 0x3A7020, 250, 7.5, -360);
        makeCone(9, 22, 6, 0x2A4F18, 280, 11, -350);
        makeCone(7, 18, 6, 0x2D5A1B, 300, 9, -330);
        // Sandringham House — Victorian mock-Jacobethan house
        makeBox(40, 16, 25, 0xF5F5DC, 260, 8, -280);
        // Wings
        makeBox(14, 12, 14, 0xF0F0D8, 238, 6, -280);
        makeBox(14, 12, 14, 0xF0F0D8, 282, 6, -280);
        // Gabled roofline
        makeCone(22, 8, 4, 0xC8B88A, 260, 21, -280);
        // Tower feature
        makeCylinder(4, 4, 24, 8, 0xECECD0, 278, 12, -270);
        makeCone(5, 8, 8, 0xB4A47A, 278, 26, -270);
        // Estate wall
        makeBox(100, 3, 3, 0xC8C0A0, 260, 1.5, -255);
        // Gatehouse
        makeBox(8, 10, 6, 0xD8D0B0, 260, 5, -252);
        makeCone(5, 6, 4, 0xB0A880, 260, 14, -252);
        // Estate parkland
        makeBox(160, 1, 120, 0x5C8A3C, 260, -0.5, -310);
        // Ornamental lake
        makeBox(40, 1, 20, 0x4682B4, 240, -0.3, -295);
    }

    function buildMerchantHouses() {
        // Historic merchant houses along the quayside
        makeBox(10, 14, 10, 0xC8A870, -20, 7, -60);
        makeBox(10, 12, 10, 0xBB9955, -10, 6, -60);
        makeBox(10, 16, 10, 0xD4B896, 0, 8, -60);
        makeBox(10, 13, 10, 0xC8A870, 10, 6.5, -60);
        // Stepped gables (Dutch influence at Lynn)
        makeBox(10, 3, 2, 0xBB9955, -20, 15, -55);
        makeBox(8, 3, 2, 0xBB9955, -20, 18, -55);
        makeBox(6, 3, 2, 0xBB9955, -20, 20, -55);
        makeBox(10, 3, 2, 0xD4B896, 0, 17, -55);
        makeBox(8, 3, 2, 0xD4B896, 0, 20, -55);
        // Further merchant row N quay
        makeBox(12, 13, 10, 0xC4A07A, -20, 6.5, -120);
        makeBox(12, 11, 10, 0xBB9955, -8, 5.5, -120);
        makeBox(12, 15, 10, 0xD0B088, 4, 7.5, -120);
    }

    function buildFenDitches() {
        // Drainage ditches — characteristic of Norfolk fens
        makeBox(3, 1, 400, 0x3A6080, 100, -0.2, 100);
        makeBox(3, 1, 300, 0x3A6080, 200, -0.2, 50);
        makeBox(300, 1, 3, 0x3A6080, 200, -0.2, 200);
        makeBox(200, 1, 3, 0x3A6080, 100, -0.2, 280);
        // Pumping station (windmill-like structure)
        makeCylinder(5, 6, 20, 8, 0x8B7355, 150, 10, 180);
        makeCone(6, 8, 8, 0x5C3A1E, 150, 24, 180);
        // Windmill sails suggestion
        makeBox(40, 2, 2, 0x8B7355, 150, 22, 180);
        makeBox(2, 40, 2, 0x8B7355, 150, 22, 180);
    }

    function buildTownWallRemnants() {
        // Remaining fragments of medieval town wall
        makeBox(3, 6, 60, 0xA0A090, -200, 3, 100);
        makeBox(60, 6, 3, 0xA0A090, -170, 3, 130);
        makeBox(3, 8, 40, 0x989888, -200, 4, -20);
        // Wall tower remnant
        makeCylinder(5, 6, 10, 8, 0xA8A898, -200, 5, 70);
        makeBox(12, 2, 12, 0x989888, -200, 10, 70);
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
