window.GlamisCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 20400;
    var CY = 0;
    var CZ = 0;

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
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildMainTower();
        buildNorthWing();
        buildSouthWing();
        buildCornerTurrets();
        buildRooftopSkyline();
        buildFormalAvenue();
        buildGatePiers();
        buildDutchGarden();
        buildItalianGarden();
        buildParklandTrees();
        buildGlamisVillage();
        buildCountryside();
        buildEstateBoundaryWalls();
    }

    function buildGround() {
        // Estate ground base - large flat boxes for terrain
        makeBox(2400, 2, 2400, 0x5a8a40, CX, CY - 1, CZ);
        // Lawn immediately around castle
        makeBox(600, 1, 600, 0x6a9a4a, CX, CY, CZ);
        // Forecourt gravel approach
        makeBox(160, 1, 300, 0xc8b89a, CX, CY + 0.5, CZ + 220);
    }

    function buildMainTower() {
        var sandstone = 0xCD5C5C;
        var darkStone = 0xaa4040;
        var windowGray = 0x8899aa;

        // Massive central tower body - L-plan tower house
        makeBox(60, 140, 55, sandstone, CX, CY + 70, CZ);

        // L-plan extension arm projecting east
        makeBox(30, 100, 40, sandstone, CX + 40, CY + 50, CZ - 5);

        // Central tower upper section - narrower as it rises
        makeBox(50, 40, 45, sandstone, CX, CY + 150, CZ);

        // Parapet / battlemented top of central tower
        makeBox(56, 8, 51, darkStone, CX, CY + 173, CZ);

        // Stair turret projecting from front face of main tower
        makeCylinder(7, 8, 120, 8, sandstone, CX - 22, CY + 60, CZ + 30);
        // Stair turret cap
        makeCone(8, 24, 8, darkStone, CX - 22, CY + 132, CZ + 30);

        // Secondary stair turret on rear
        makeCylinder(6, 7, 90, 8, sandstone, CX + 18, CY + 45, CZ - 30);
        makeCone(7, 20, 8, darkStone, CX + 18, CY + 95, CZ - 30);

        // Window slots on main tower front face
        makeBox(5, 9, 2, windowGray, CX - 15, CY + 40, CZ + 28);
        makeBox(5, 9, 2, windowGray, CX, CY + 40, CZ + 28);
        makeBox(5, 9, 2, windowGray, CX + 15, CY + 40, CZ + 28);
        makeBox(5, 9, 2, windowGray, CX - 15, CY + 70, CZ + 28);
        makeBox(5, 9, 2, windowGray, CX, CY + 70, CZ + 28);
        makeBox(5, 9, 2, windowGray, CX + 15, CY + 70, CZ + 28);
        makeBox(5, 9, 2, windowGray, CX - 15, CY + 100, CZ + 28);
        makeBox(5, 9, 2, windowGray, CX, CY + 100, CZ + 28);
        makeBox(5, 9, 2, windowGray, CX + 15, CY + 100, CZ + 28);
        makeBox(5, 9, 2, windowGray, CX - 10, CY + 130, CZ + 28);
        makeBox(5, 9, 2, windowGray, CX + 10, CY + 130, CZ + 28);

        // Window slots on east face of L-arm
        makeBox(2, 9, 5, windowGray, CX + 55, CY + 40, CZ);
        makeBox(2, 9, 5, windowGray, CX + 55, CY + 70, CZ);
        makeBox(2, 9, 5, windowGray, CX + 55, CY + 55, CZ - 14);

        // Corbelled bartizans - small corner turret overhangs at top of main tower
        makeCylinder(4, 4, 16, 8, sandstone, CX - 28, CY + 170, CZ + 26);
        makeCone(4, 12, 8, darkStone, CX - 28, CY + 186, CZ + 26);
        makeCylinder(4, 4, 16, 8, sandstone, CX + 28, CY + 170, CZ + 26);
        makeCone(4, 12, 8, darkStone, CX + 28, CY + 186, CZ + 26);
        makeCylinder(4, 4, 16, 8, sandstone, CX - 28, CY + 170, CZ - 26);
        makeCone(4, 12, 8, darkStone, CX - 28, CY + 186, CZ - 26);
        makeCylinder(4, 4, 16, 8, sandstone, CX + 28, CY + 170, CZ - 26);
        makeCone(4, 12, 8, darkStone, CX + 28, CY + 186, CZ - 26);
    }

    function buildNorthWing() {
        var sandstone = 0xCD5C5C;
        var darkStone = 0xaa4040;
        var windowGray = 0x8899aa;

        // North (left) wing - lower 17th century addition
        makeBox(120, 65, 45, sandstone, CX - 100, CY + 32, CZ);
        // North wing parapet
        makeBox(124, 7, 49, darkStone, CX - 100, CY + 67, CZ);
        // North wing end stair tower
        makeCylinder(8, 9, 75, 8, sandstone, CX - 162, CY + 37, CZ);
        makeCone(9, 22, 8, darkStone, CX - 162, CY + 82, CZ);
        // North wing windows
        makeBox(5, 8, 2, windowGray, CX - 80, CY + 30, CZ + 23);
        makeBox(5, 8, 2, windowGray, CX - 100, CY + 30, CZ + 23);
        makeBox(5, 8, 2, windowGray, CX - 120, CY + 30, CZ + 23);
        makeBox(5, 8, 2, windowGray, CX - 80, CY + 50, CZ + 23);
        makeBox(5, 8, 2, windowGray, CX - 100, CY + 50, CZ + 23);
        makeBox(5, 8, 2, windowGray, CX - 120, CY + 50, CZ + 23);
        // North wing connector link to main tower
        makeBox(18, 50, 30, sandstone, CX - 39, CY + 25, CZ);
    }

    function buildSouthWing() {
        var sandstone = 0xCD5C5C;
        var darkStone = 0xaa4040;
        var windowGray = 0x8899aa;

        // South (right) wing - matching north wing
        makeBox(120, 65, 45, sandstone, CX + 100, CY + 32, CZ);
        // South wing parapet
        makeBox(124, 7, 49, darkStone, CX + 100, CY + 67, CZ);
        // South wing end stair tower
        makeCylinder(8, 9, 75, 8, sandstone, CX + 162, CY + 37, CZ);
        makeCone(9, 22, 8, darkStone, CX + 162, CY + 82, CZ);
        // South wing windows
        makeBox(5, 8, 2, windowGray, CX + 80, CY + 30, CZ + 23);
        makeBox(5, 8, 2, windowGray, CX + 100, CY + 30, CZ + 23);
        makeBox(5, 8, 2, windowGray, CX + 120, CY + 30, CZ + 23);
        makeBox(5, 8, 2, windowGray, CX + 80, CY + 50, CZ + 23);
        makeBox(5, 8, 2, windowGray, CX + 100, CY + 50, CZ + 23);
        makeBox(5, 8, 2, windowGray, CX + 120, CY + 50, CZ + 23);
        // South wing connector link to main tower
        makeBox(18, 50, 30, sandstone, CX + 39, CY + 25, CZ);
    }

    function buildCornerTurrets() {
        var sandstone = 0xCD5C5C;
        var darkStone = 0xaa4040;
        var slatePurple = 0x5a5070;

        // Four main facade corner turrets — tall, soaring French-chateau style
        // Front-left
        makeCylinder(9, 10, 110, 10, sandstone, CX - 168, CY + 55, CZ + 24);
        makeCone(10, 38, 10, slatePurple, CX - 168, CY + 129, CZ + 24);

        // Front-right
        makeCylinder(9, 10, 110, 10, sandstone, CX + 168, CY + 55, CZ + 24);
        makeCone(10, 38, 10, slatePurple, CX + 168, CY + 129, CZ + 24);

        // Rear-left
        makeCylinder(9, 10, 100, 10, sandstone, CX - 168, CY + 50, CZ - 24);
        makeCone(10, 34, 10, slatePurple, CX - 168, CY + 117, CZ - 24);

        // Rear-right
        makeCylinder(9, 10, 100, 10, sandstone, CX + 168, CY + 50, CZ - 24);
        makeCone(10, 34, 10, slatePurple, CX + 168, CY + 117, CZ - 24);

        // Mid-facade turrets flanking main tower — smaller
        makeCylinder(6, 7, 80, 8, sandstone, CX - 40, CY + 40, CZ + 30);
        makeCone(7, 26, 8, slatePurple, CX - 40, CY + 93, CZ + 30);
        makeCylinder(6, 7, 80, 8, sandstone, CX + 40, CY + 40, CZ + 30);
        makeCone(7, 26, 8, slatePurple, CX + 40, CY + 93, CZ + 30);

        // Decorative dormers / lucarnes on wing roofs — box dormers
        makeBox(10, 14, 8, sandstone, CX - 90, CY + 74, CZ + 10);
        makeCone(5, 10, 4, darkStone, CX - 90, CY + 86, CZ + 10);
        makeBox(10, 14, 8, sandstone, CX - 115, CY + 74, CZ + 10);
        makeCone(5, 10, 4, darkStone, CX - 115, CY + 86, CZ + 10);
        makeBox(10, 14, 8, sandstone, CX + 90, CY + 74, CZ + 10);
        makeCone(5, 10, 4, darkStone, CX + 90, CY + 86, CZ + 10);
        makeBox(10, 14, 8, sandstone, CX + 115, CY + 74, CZ + 10);
        makeCone(5, 10, 4, darkStone, CX + 115, CY + 86, CZ + 10);
    }

    function buildRooftopSkyline() {
        var slatePurple = 0x5a5070;
        var darkStone = 0xaa4040;
        var sandstone = 0xCD5C5C;
        var chimneyGray = 0x777777;

        // Dense forest of chimneys on main tower roof
        makeCylinder(2, 2.5, 18, 6, chimneyGray, CX - 18, CY + 188, CZ - 8);
        makeCylinder(2, 2.5, 18, 6, chimneyGray, CX - 6, CY + 188, CZ - 8);
        makeCylinder(2, 2.5, 18, 6, chimneyGray, CX + 6, CY + 188, CZ - 8);
        makeCylinder(2, 2.5, 18, 6, chimneyGray, CX + 18, CY + 188, CZ - 8);
        makeCylinder(2, 2.5, 18, 6, chimneyGray, CX - 18, CY + 188, CZ + 8);
        makeCylinder(2, 2.5, 18, 6, chimneyGray, CX + 18, CY + 188, CZ + 8);

        // Chimneys on north wing
        makeCylinder(2, 2.5, 16, 6, chimneyGray, CX - 90, CY + 80, CZ - 10);
        makeCylinder(2, 2.5, 16, 6, chimneyGray, CX - 110, CY + 80, CZ - 10);
        makeCylinder(2, 2.5, 16, 6, chimneyGray, CX - 130, CY + 80, CZ - 10);

        // Chimneys on south wing
        makeCylinder(2, 2.5, 16, 6, chimneyGray, CX + 90, CY + 80, CZ - 10);
        makeCylinder(2, 2.5, 16, 6, chimneyGray, CX + 110, CY + 80, CZ - 10);
        makeCylinder(2, 2.5, 16, 6, chimneyGray, CX + 130, CY + 80, CZ - 10);

        // Chimney stacks — box-form grouped stacks
        makeBox(12, 12, 8, chimneyGray, CX, CY + 188, CZ);
        makeBox(10, 10, 8, chimneyGray, CX - 14, CY + 184, CZ + 5);
        makeBox(10, 10, 8, chimneyGray, CX + 14, CY + 184, CZ + 5);

        // Finials on main tower battlements
        makeCone(2, 10, 6, darkStone, CX - 26, CY + 180, CZ + 24);
        makeCone(2, 10, 6, darkStone, CX + 26, CY + 180, CZ + 24);
        makeCone(2, 10, 6, darkStone, CX - 26, CY + 180, CZ - 24);
        makeCone(2, 10, 6, darkStone, CX + 26, CY + 180, CZ - 24);
        makeCone(2, 8, 6, darkStone, CX, CY + 180, CZ + 24);
        makeCone(2, 8, 6, darkStone, CX, CY + 180, CZ - 24);

        // Slated roof sections on wings — pitched roof boxes
        makeBox(130, 12, 16, slatePurple, CX - 100, CY + 75, CZ);
        makeBox(130, 12, 16, slatePurple, CX + 100, CY + 75, CZ);
        // Main tower roof
        makeBox(64, 16, 58, slatePurple, CX, CY + 182, CZ);

        // Heraldic weather vane sphere on apex of main tower
        makeSphere(3, 8, 6, 0xffd700, CX, CY + 200, CZ);

        // Small decorative ball finials on wing turret apex
        makeSphere(2, 6, 4, 0xffd700, CX - 162, CY + 105, CZ);
        makeSphere(2, 6, 4, 0xffd700, CX + 162, CY + 105, CZ);
    }

    function buildFormalAvenue() {
        var grassGreen = 0x6a9a4a;
        var darkGrass = 0x2d6b2a;
        var pathGray = 0xb8a890;

        // The Mile — long straight avenue running south from castle gates
        makeBox(40, 1, 800, grassGreen, CX, CY + 0.5, CZ + 500);
        // Central carriage drive within the avenue
        makeBox(12, 1.5, 800, pathGray, CX, CY + 1, CZ + 500);

        // Avenue tree rows — pairs of deciduous trees lining the mile
        var i;
        for (i = 0; i < 16; i++) {
            var treeZ = CZ + 140 + i * 50;
            // Left row of avenue trees
            makeCylinder(1.5, 2, 18, 7, 0x5a3010, CX - 22, CY + 9, treeZ);
            makeSphere(9, 7, 5, darkGrass, CX - 22, CY + 22, treeZ);
            // Right row of avenue trees
            makeCylinder(1.5, 2, 18, 7, 0x5a3010, CX + 22, CY + 9, treeZ);
            makeSphere(9, 7, 5, darkGrass, CX + 22, CY + 22, treeZ);
        }
    }

    function buildGatePiers() {
        var sandstone = 0xCD5C5C;
        var darkStone = 0xaa4040;
        var ironBlack = 0x222222;

        // Main entrance gate piers — tall sandstone pillars
        makeBox(14, 55, 14, sandstone, CX - 30, CY + 27, CZ + 110);
        makeBox(14, 55, 14, sandstone, CX + 30, CY + 27, CZ + 110);

        // Pier caps / cornices
        makeBox(18, 5, 18, darkStone, CX - 30, CY + 57, CZ + 110);
        makeBox(18, 5, 18, darkStone, CX + 30, CY + 57, CZ + 110);

        // Heraldic beasts on top of gate piers (sphere as stylised beast)
        makeSphere(5, 8, 6, sandstone, CX - 30, CY + 65, CZ + 110);
        makeSphere(5, 8, 6, sandstone, CX + 30, CY + 65, CZ + 110);

        // Iron gate between piers — represented as flat dark slabs
        makeBox(18, 40, 2, ironBlack, CX - 15, CY + 22, CZ + 110);
        makeBox(18, 40, 2, ironBlack, CX + 15, CY + 22, CZ + 110);

        // Flanking lower lodge piers
        makeBox(10, 35, 10, sandstone, CX - 55, CY + 17, CZ + 110);
        makeBox(10, 35, 10, sandstone, CX + 55, CY + 17, CZ + 110);
        makeBox(13, 4, 13, darkStone, CX - 55, CY + 37, CZ + 110);
        makeBox(13, 4, 13, darkStone, CX + 55, CY + 37, CZ + 110);

        // Gate lodge cottages either side of gate
        makeBox(30, 22, 26, 0xCD5C5C, CX - 80, CY + 11, CZ + 110);
        makeBox(30, 22, 26, 0xCD5C5C, CX + 80, CY + 11, CZ + 110);
        // Lodge roofs
        makeBox(34, 8, 10, 0x5a5070, CX - 80, CY + 25, CZ + 110);
        makeBox(34, 8, 10, 0x5a5070, CX + 80, CY + 25, CZ + 110);
        // Lodge chimneys
        makeCylinder(1.5, 1.5, 10, 6, 0x777777, CX - 75, CY + 32, CZ + 110);
        makeCylinder(1.5, 1.5, 10, 6, 0x777777, CX + 75, CY + 32, CZ + 110);
    }

    function buildDutchGarden() {
        var wallStone = 0xCD5C5C;
        var hedgeGreen = 0x2d5a1a;
        var flowerPink = 0xdd88aa;
        var pathGray = 0xd4c8b0;

        // Dutch garden walled enclosure — west side of castle
        var gx = CX - 240;
        var gz = CZ - 80;

        // Garden boundary walls
        makeBox(160, 10, 4, wallStone, gx, CY + 5, gz + 80);
        makeBox(160, 10, 4, wallStone, gx, CY + 5, gz - 80);
        makeBox(4, 10, 160, wallStone, gx + 80, CY + 5, gz);
        makeBox(4, 10, 160, wallStone, gx - 80, CY + 5, gz);

        // Garden paths — cross pattern
        makeBox(160, 1, 8, pathGray, gx, CY + 1, gz);
        makeBox(8, 1, 160, pathGray, gx, CY + 1, gz);

        // Formal parterres — low clipped hedge boxes
        makeBox(60, 4, 60, hedgeGreen, gx - 40, CY + 2, gz + 40);
        makeBox(60, 4, 60, hedgeGreen, gx + 40, CY + 2, gz + 40);
        makeBox(60, 4, 60, hedgeGreen, gx - 40, CY + 2, gz - 40);
        makeBox(60, 4, 60, hedgeGreen, gx + 40, CY + 2, gz - 40);

        // Flower beds within parterres
        makeBox(44, 3, 44, flowerPink, gx - 40, CY + 2, gz + 40);
        makeBox(44, 3, 44, 0xffcc44, gx + 40, CY + 2, gz + 40);
        makeBox(44, 3, 44, 0xcc44ff, gx - 40, CY + 2, gz - 40);
        makeBox(44, 3, 44, flowerPink, gx + 40, CY + 2, gz - 40);

        // Central garden ornament — sundial on plinth
        makeBox(6, 8, 6, wallStone, gx, CY + 4, gz);
        makeCylinder(3, 3, 4, 8, 0x999999, gx, CY + 10, gz);
        makeCylinder(6, 4, 2, 8, 0x888888, gx, CY + 13, gz);
    }

    function buildItalianGarden() {
        var balustrade = 0xddd0b0;
        var hedgeGreen = 0x3a6a1a;
        var stonePath = 0xc8b89a;

        // Italian garden — east side of castle with terraces
        var ix = CX + 240;
        var iz = CZ - 60;

        // Terrace platform
        makeBox(200, 6, 140, stonePath, ix, CY + 3, iz);

        // Balustrade walls — series of box segments
        makeBox(200, 10, 4, balustrade, ix, CY + 8, iz + 70);
        makeBox(200, 10, 4, balustrade, ix, CY + 8, iz - 70);
        makeBox(4, 10, 140, balustrade, ix + 100, CY + 8, iz);
        makeBox(4, 10, 140, balustrade, ix - 100, CY + 8, iz);

        // Balustrade posts
        var j;
        for (j = 0; j < 10; j++) {
            makeCylinder(1.5, 1.5, 10, 6, balustrade, ix - 90 + j * 20, CY + 8, iz + 70);
            makeCylinder(1.5, 1.5, 10, 6, balustrade, ix - 90 + j * 20, CY + 8, iz - 70);
        }

        // Geometric topiary planting — cone-trimmed yews
        makeCone(8, 22, 8, hedgeGreen, ix - 70, CY + 11, iz + 40);
        makeCone(8, 22, 8, hedgeGreen, ix - 70, CY + 11, iz - 40);
        makeCone(8, 22, 8, hedgeGreen, ix + 70, CY + 11, iz + 40);
        makeCone(8, 22, 8, hedgeGreen, ix + 70, CY + 11, iz - 40);
        makeCone(6, 16, 8, hedgeGreen, ix, CY + 11, iz + 40);
        makeCone(6, 16, 8, hedgeGreen, ix, CY + 11, iz - 40);
        makeCone(6, 16, 8, hedgeGreen, ix - 40, CY + 11, iz);
        makeCone(6, 16, 8, hedgeGreen, ix + 40, CY + 11, iz);

        // Central fountain basin
        makeCylinder(20, 22, 4, stonePath, ix, CY + 2, iz);
        makeCylinder(3, 3, 16, 8, 0x8899bb, ix, CY + 10, iz);
        makeSphere(4, 8, 6, 0x8899bb, ix, CY + 19, iz);

        // Stone steps down from terrace
        makeBox(30, 3, 8, balustrade, ix - 100, CY + 1, iz);
        makeBox(30, 2, 6, balustrade, ix - 100, CY + 3, iz + 7);
    }

    function buildParklandTrees() {
        var trunkBrown = 0x5a3010;
        var leafDark = 0x2d6b2a;
        var leafMid = 0x3a7a30;
        var leafLight = 0x4a8a3a;

        // Parkland deciduous trees — scattered in estate grounds
        var treeData = [
            [-180, CZ + 80], [-220, CZ + 40], [-260, CZ - 30], [-200, CZ - 100],
            [-300, CZ + 120], [-350, CZ - 60], [-160, CZ - 180], [-280, CZ - 200],
            [180, CZ + 80], [220, CZ + 40], [260, CZ - 30], [200, CZ - 100],
            [300, CZ + 120], [350, CZ - 60], [160, CZ - 180], [280, CZ - 200],
            [0, CZ - 220], [80, CZ - 250], [-80, CZ - 250], [60, CZ + 50],
            [-60, CZ + 50], [140, CZ - 80], [-140, CZ - 80]
        ];
        var k;
        for (k = 0; k < treeData.length; k++) {
            var tx = CX + treeData[k][0];
            var tz = treeData[k][1];
            var th = 20 + (k % 5) * 6;
            var tc = (k % 3 === 0) ? leafDark : (k % 3 === 1) ? leafMid : leafLight;
            makeCylinder(1.2, 1.8, th, 7, trunkBrown, tx, CY + th * 0.5, tz);
            makeSphere(10 + (k % 4) * 2, 7, 5, tc, tx, CY + th + 8, tz);
        }
    }

    function buildGlamisVillage() {
        var cottageStone = 0xF5F0E8;
        var roofGray = 0x6a6a6a;
        var kirkStone = 0xddd5c0;
        var darkRoof = 0x444444;

        // Glamis village — south-east of estate along the avenue
        var vx = CX + 100;
        var vz = CZ + 780;

        // Estate worker cottages
        makeBox(32, 20, 22, cottageStone, vx - 80, CY + 10, vz);
        makeBox(36, 10, 10, roofGray, vx - 80, CY + 24, vz);
        makeCylinder(1.5, 1.5, 10, 6, 0x777777, vx - 74, CY + 31, vz);
        makeBox(5, 8, 2, 0x8899aa, vx - 80, CY + 10, vz + 11);

        makeBox(28, 18, 20, cottageStone, vx - 40, CY + 9, vz + 10);
        makeBox(32, 8, 8, roofGray, vx - 40, CY + 21, vz + 10);
        makeCylinder(1.5, 1.5, 8, 6, 0x777777, vx - 36, CY + 27, vz + 10);

        makeBox(30, 20, 22, cottageStone, vx + 20, CY + 10, vz);
        makeBox(34, 10, 10, roofGray, vx + 20, CY + 24, vz);
        makeCylinder(1.5, 1.5, 10, 6, 0x777777, vx + 26, CY + 31, vz);

        makeBox(28, 18, 20, cottageStone, vx + 60, CY + 9, vz + 5);
        makeBox(32, 8, 8, roofGray, vx + 60, CY + 21, vz + 5);
        makeCylinder(1.5, 1.5, 8, 6, 0x777777, vx + 66, CY + 27, vz + 5);

        // Village kirk (church)
        makeBox(28, 30, 22, kirkStone, vx, CY + 15, vz + 60);
        makeBox(32, 6, 26, darkRoof, vx, CY + 33, vz + 60);
        // Kirk tower
        makeBox(14, 50, 14, kirkStone, vx, CY + 25, vz + 74);
        makeBox(16, 5, 16, darkRoof, vx, CY + 53, vz + 74);
        // Kirk steeple
        makeCone(7, 28, 4, darkRoof, vx, CY + 70, vz + 74);
        // Kirk lancet windows
        makeBox(4, 12, 2, 0x8899aa, vx - 8, CY + 20, vz + 49);
        makeBox(4, 12, 2, 0x8899aa, vx + 8, CY + 20, vz + 49);
        makeBox(4, 12, 2, 0x8899aa, vx, CY + 20, vz + 49);
        // Churchyard wall
        makeBox(120, 8, 4, kirkStone, vx, CY + 4, vz + 100);
        makeBox(4, 8, 80, kirkStone, vx - 60, CY + 4, vz + 60);
        makeBox(4, 8, 80, kirkStone, vx + 60, CY + 4, vz + 60);
    }

    function buildCountryside() {
        var fieldGreen = 0x5a8a40;
        var fieldYellow = 0xc8b840;
        var fieldBrown = 0x8a6a2a;
        var hedgeGreen = 0x2d5a1a;

        // Agricultural fields — Angus farming countryside
        makeBox(400, 1, 300, fieldGreen, CX - 600, CY, CZ + 100);
        makeBox(350, 1, 280, fieldYellow, CX - 600, CY, CZ - 300);
        makeBox(380, 1, 260, fieldBrown, CX + 600, CY, CZ + 200);
        makeBox(400, 1, 320, fieldGreen, CX + 600, CY, CZ - 250);
        makeBox(300, 1, 350, fieldYellow, CX + 100, CY, CZ + 900);
        makeBox(350, 1, 280, fieldBrown, CX - 200, CY, CZ + 900);
        makeBox(450, 1, 200, fieldGreen, CX, CY, CZ - 700);
        makeBox(380, 1, 300, fieldYellow, CX - 400, CY, CZ - 600);

        // Field boundary hedgerows
        makeBox(400, 6, 5, hedgeGreen, CX - 600, CY + 3, CZ - 50);
        makeBox(5, 6, 300, hedgeGreen, CX - 400, CY + 3, CZ + 100);
        makeBox(400, 6, 5, hedgeGreen, CX + 600, CY + 3, CZ - 50);
        makeBox(5, 6, 320, hedgeGreen, CX + 400, CY + 3, CZ + 200);
        makeBox(350, 6, 5, hedgeGreen, CX - 200, CY + 3, CZ - 550);
        makeBox(300, 6, 5, hedgeGreen, CX + 100, CY + 3, CZ + 700);

        // Farm steadings — simple stone farm buildings
        makeBox(60, 16, 30, 0xd4c8b0, CX - 650, CY + 8, CZ + 50);
        makeBox(64, 8, 14, 0x777777, CX - 650, CY + 20, CZ + 50);
        makeBox(40, 14, 28, 0xd4c8b0, CX + 650, CY + 7, CZ + 150);
        makeBox(44, 7, 12, 0x777777, CX + 650, CY + 18, CZ + 150);

        // Scattered field trees — boundary trees
        makeCylinder(1.5, 2, 22, 7, 0x5a3010, CX - 420, CY + 11, CZ - 50);
        makeSphere(11, 7, 5, 0x2d6b2a, CX - 420, CY + 26, CZ - 50);
        makeCylinder(1.5, 2, 18, 7, 0x5a3010, CX + 420, CY + 9, CZ - 50);
        makeSphere(9, 7, 5, 0x3a7a30, CX + 420, CY + 22, CZ - 50);
        makeCylinder(1.5, 2, 24, 7, 0x5a3010, CX - 420, CY + 12, CZ + 300);
        makeSphere(12, 7, 5, 0x2d6b2a, CX - 420, CY + 28, CZ + 300);
        makeCylinder(1.5, 2, 20, 7, 0x5a3010, CX + 420, CY + 10, CZ - 300);
        makeSphere(10, 7, 5, 0x3a7a30, CX + 420, CY + 24, CZ - 300);
    }

    function buildEstateBoundaryWalls() {
        var wallStone = 0xCD5C5C;
        var darkerWall = 0xaa4444;

        // Estate outer boundary walls — low stone dykes
        makeBox(800, 12, 5, wallStone, CX, CY + 6, CZ + 300);
        makeBox(800, 12, 5, wallStone, CX, CY + 6, CZ - 400);
        makeBox(5, 12, 700, wallStone, CX - 400, CY + 6, CZ - 50);
        makeBox(5, 12, 700, wallStone, CX + 400, CY + 6, CZ - 50);

        // Ha-ha wall (sunken wall at garden boundary) — step box
        makeBox(200, 6, 4, darkerWall, CX, CY + 3, CZ - 100);

        // Kitchen garden walled enclosure — north of castle
        makeBox(120, 14, 4, wallStone, CX, CY + 7, CZ - 200);
        makeBox(4, 14, 100, wallStone, CX + 60, CY + 7, CZ - 250);
        makeBox(4, 14, 100, wallStone, CX - 60, CY + 7, CZ - 250);
        makeBox(120, 14, 4, wallStone, CX, CY + 7, CZ - 300);

        // Inner forecourt walls
        makeBox(80, 8, 4, wallStone, CX - 100, CY + 4, CZ + 95);
        makeBox(80, 8, 4, wallStone, CX + 100, CY + 4, CZ + 95);
        makeBox(4, 8, 30, wallStone, CX - 140, CY + 4, CZ + 82);
        makeBox(4, 8, 30, wallStone, CX + 140, CY + 4, CZ + 82);
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
