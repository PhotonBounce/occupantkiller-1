window.DouneCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var BASE_X = 20360;
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

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildMotte();
        buildRiverTeith();
        buildGatehouseTower();
        buildKitchenTower();
        buildGreatHallRange();
        buildCurtainWalls();
        buildCourtyard();
        buildVillage();
        buildParishChurch();
        buildStirlingRoad();
        buildMotorMuseum();
        buildHighlandCattle();
        buildTrees();
        buildPistolManufactory();
    }

    function buildGround() {
        // Ground base - large flat terrain using box (thin)
        makeBox(600, 1, 600, 0x4a6741, 0, -0.5, 0);
        // Field patches around castle
        makeBox(120, 0.5, 100, 0x5a7a30, -80, 0, 60);
        makeBox(100, 0.5, 80, 0x5a7a30, 80, 0, -60);
    }

    function buildMotte() {
        // Grassy mound the castle sits on - truncated cone shape
        makeCylinder(28, 40, 6, 12, 0x5a7a30, 0, 3, 0);
        // Extra motte slope detail
        makeCylinder(32, 42, 3, 12, 0x527030, 0, 0.5, 0);
    }

    function buildRiverTeith() {
        // River on north side of castle
        makeBox(300, 1.5, 18, 0x006994, 0, 0.2, -55);
        // River on west side
        makeBox(18, 1.5, 120, 0x006994, -55, 0.2, 0);
        // River bend corner pool
        makeBox(20, 1.5, 20, 0x006994, -55, 0.2, -55);
        // River bank strips
        makeBox(300, 1, 4, 0x8a7a50, 0, 0.5, -64);
        makeBox(4, 1, 120, 0x8a7a50, -64, 0.5, 0);
    }

    function buildGatehouseTower() {
        // Main gatehouse tower base - massive square keep, 30m tall
        // Color: 0x8B7355 sandstone
        var gateColor = 0x8B7355;
        var gateX = 0;
        var gateZ = 12;

        // Main tower body lower section
        makeBox(22, 12, 20, gateColor, gateX, 12, gateZ);
        // Main tower body mid section (slightly inset)
        makeBox(20, 10, 18, gateColor, gateX, 23, gateZ);
        // Main tower body upper section
        makeBox(18, 10, 16, gateColor, gateX, 33, gateZ);

        // Gatehouse archway (dark tunnel through base)
        makeBox(5, 7, 20, 0x222222, gateX, 7, gateZ);

        // Great hall floor slab (upper floor of gatehouse)
        makeBox(20, 1, 18, 0x6e5f3e, gateX, 19, gateZ);
        // Lord's hall floor slab (top floor)
        makeBox(18, 1, 16, 0x6e5f3e, gateX, 29, gateZ);

        // Battlements on gatehouse top - north row
        makeBox(2, 2.5, 1.5, gateColor, gateX - 7, 39, gateZ - 7);
        makeBox(2, 2.5, 1.5, gateColor, gateX - 3, 39, gateZ - 7);
        makeBox(2, 2.5, 1.5, gateColor, gateX + 1, 39, gateZ - 7);
        makeBox(2, 2.5, 1.5, gateColor, gateX + 5, 39, gateZ - 7);
        // South battlements
        makeBox(2, 2.5, 1.5, gateColor, gateX - 7, 39, gateZ + 7);
        makeBox(2, 2.5, 1.5, gateColor, gateX - 3, 39, gateZ + 7);
        makeBox(2, 2.5, 1.5, gateColor, gateX + 1, 39, gateZ + 7);
        makeBox(2, 2.5, 1.5, gateColor, gateX + 5, 39, gateZ + 7);
        // East battlements
        makeBox(1.5, 2.5, 2, gateColor, gateX + 9, 39, gateZ - 3);
        makeBox(1.5, 2.5, 2, gateColor, gateX + 9, 39, gateZ + 1);
        makeBox(1.5, 2.5, 2, gateColor, gateX + 9, 39, gateZ + 5);
        // West battlements
        makeBox(1.5, 2.5, 2, gateColor, gateX - 9, 39, gateZ - 3);
        makeBox(1.5, 2.5, 2, gateColor, gateX - 9, 39, gateZ + 1);
        makeBox(1.5, 2.5, 2, gateColor, gateX - 9, 39, gateZ + 5);

        // Gatehouse roof walk parapet wall
        makeBox(20, 2, 1, gateColor, gateX, 38, gateZ - 8);
        makeBox(20, 2, 1, gateColor, gateX, 38, gateZ + 8);
        makeBox(1, 2, 18, gateColor, gateX + 10, 38, gateZ);
        makeBox(1, 2, 18, gateColor, gateX - 10, 38, gateZ);

        // Corner turrets on gatehouse
        makeCylinder(2, 2.5, 14, 8, gateColor, gateX - 9, 30, gateZ - 7);
        makeCylinder(2, 2.5, 14, 8, gateColor, gateX + 9, 30, gateZ - 7);
        makeCylinder(2, 2.5, 14, 8, gateColor, gateX - 9, 30, gateZ + 7);
        makeCylinder(2, 2.5, 14, 8, gateColor, gateX + 9, 30, gateZ + 7);

        // Corner turret conical roofs
        makeCone(2.5, 5, 8, 0x555544, gateX - 9, 38, gateZ - 7);
        makeCone(2.5, 5, 8, 0x555544, gateX + 9, 38, gateZ - 7);
        makeCone(2.5, 5, 8, 0x555544, gateX - 9, 38, gateZ + 7);
        makeCone(2.5, 5, 8, 0x555544, gateX + 9, 38, gateZ + 7);

        // Drawbridge pit (dark depression in front)
        makeBox(6, 2, 4, 0x1a1a1a, gateX, 5, gateZ - 14);

        // Gate portcullis housing box above arch
        makeBox(7, 3, 3, 0x6e5040, gateX, 13, gateZ - 8);
    }

    function buildKitchenTower() {
        // Separate kitchen tower to the east, joined by great hall
        var ktColor = 0x8B7355;
        var ktX = 28;
        var ktZ = -8;

        // Tower base
        makeBox(14, 8, 14, ktColor, ktX, 10, ktZ);
        // Tower mid
        makeBox(12, 8, 12, ktColor, ktX, 18, ktZ);
        // Tower upper
        makeBox(10, 8, 10, ktColor, ktX, 26, ktZ);

        // Kitchen tower battlements
        makeBox(2, 2, 1, ktColor, ktX - 4, 31, ktZ - 4.5);
        makeBox(2, 2, 1, ktColor, ktX, 31, ktZ - 4.5);
        makeBox(2, 2, 1, ktColor, ktX + 4, 31, ktZ - 4.5);
        makeBox(2, 2, 1, ktColor, ktX - 4, 31, ktZ + 4.5);
        makeBox(2, 2, 1, ktColor, ktX, 31, ktZ + 4.5);
        makeBox(2, 2, 1, ktColor, ktX + 4, 31, ktZ + 4.5);

        // Kitchen chimney stack
        makeBox(2.5, 6, 2.5, 0x7a6545, ktX - 3, 34, ktZ);
        makeBox(3, 1.5, 3, 0x666655, ktX - 3, 38, ktZ);
    }

    function buildGreatHallRange() {
        // Great hall range connecting gatehouse to kitchen tower
        var hallColor = 0x8B7355;

        // Long hall connecting structure
        makeBox(18, 14, 10, hallColor, 14, 13, 2);

        // Hall roof structure (pitched box approximation)
        makeBox(18, 3, 10, 0x7a6a50, 14, 21, 2);

        // Hall windows (dark recessed boxes)
        makeBox(2, 3, 0.5, 0x2a2a2a, 8, 15, -3);
        makeBox(2, 3, 0.5, 0x2a2a2a, 14, 15, -3);
        makeBox(2, 3, 0.5, 0x2a2a2a, 20, 15, -3);

        // Great hall fireplace chimney
        makeBox(3, 8, 3, 0x7a6545, 14, 26, 2);
        makeBox(3.5, 2, 3.5, 0x666655, 14, 31, 2);
    }

    function buildCurtainWalls() {
        // Curtain walls enclosing the inner ward
        var wallColor = 0x8B7355;
        var wallH = 8;
        var wallThick = 2;

        // North curtain wall
        makeBox(60, wallH, wallThick, wallColor, 0, wallH / 2 + 6, -18);
        // South curtain wall
        makeBox(50, wallH, wallThick, wallColor, -5, wallH / 2 + 6, 28);
        // East curtain wall
        makeBox(wallThick, wallH, 50, wallColor, 30, wallH / 2 + 6, 5);
        // West curtain wall
        makeBox(wallThick, wallH, 50, wallColor, -30, wallH / 2 + 6, 5);

        // Wall walk tops (thin slabs on top of curtain walls)
        makeBox(60, 1, 2.5, wallColor, 0, wallH + 7, -18);
        makeBox(50, 1, 2.5, wallColor, -5, wallH + 7, 28);
        makeBox(2.5, 1, 50, wallColor, 30, wallH + 7, 5);
        makeBox(2.5, 1, 50, wallColor, -30, wallH + 7, 5);

        // Merlons on north wall
        makeBox(2, 2, 1.5, wallColor, -20, wallH + 9, -18);
        makeBox(2, 2, 1.5, wallColor, -12, wallH + 9, -18);
        makeBox(2, 2, 1.5, wallColor, -4, wallH + 9, -18);
        makeBox(2, 2, 1.5, wallColor, 4, wallH + 9, -18);
        makeBox(2, 2, 1.5, wallColor, 12, wallH + 9, -18);
        makeBox(2, 2, 1.5, wallColor, 20, wallH + 9, -18);

        // Merlons on east wall
        makeBox(1.5, 2, 2, wallColor, 30, wallH + 9, -12);
        makeBox(1.5, 2, 2, wallColor, 30, wallH + 9, -4);
        makeBox(1.5, 2, 2, wallColor, 30, wallH + 9, 4);
        makeBox(1.5, 2, 2, wallColor, 30, wallH + 9, 12);

        // Wall towers (small round at corners)
        makeCylinder(3, 3.5, 12, 8, wallColor, -30, wallH / 2 + 6, -18);
        makeCylinder(3, 3.5, 12, 8, wallColor, 30, wallH / 2 + 6, -18);
        makeCylinder(3, 3.5, 10, 8, wallColor, -30, wallH / 2 + 5, 28);
        makeCylinder(3, 3.5, 10, 8, wallColor, 30, wallH / 2 + 5, 28);
    }

    function buildCourtyard() {
        // Inner ward ground surface
        makeBox(58, 0.8, 44, 0x9e8c6e, 0, 6.4, 4);
        // Cobblestone path near gate
        makeBox(6, 0.9, 20, 0x888070, 0, 6.4, 16);
        // Well in courtyard
        makeCylinder(1.5, 1.5, 3, 8, 0x888070, 10, 8, 5);
        makeCylinder(0.2, 0.2, 5, 6, 0x5a3a1a, 10, 10, 5);
        makeBox(4, 0.5, 0.2, 0x5a3a1a, 10, 12.5, 5);
    }

    function buildVillage() {
        // Doune village buildings to the south of the castle
        var houseColor = 0xF5F0E8;
        var roofColor = 0xCD5C5C;
        var stoneColor = 0xC8B89A;

        // Row of village houses along main street
        makeBox(8, 6, 7, houseColor, -50, 4, 60);
        makeCone(4.5, 4, 4, roofColor, -50, 10, 60);

        makeBox(9, 7, 8, houseColor, -38, 4.5, 58);
        makeCone(5, 4, 4, roofColor, -38, 11, 58);

        makeBox(7, 5, 7, houseColor, -26, 3.5, 62);
        makeCone(4, 3.5, 4, roofColor, -26, 9, 62);

        makeBox(10, 6, 8, stoneColor, -14, 4, 60);
        makeCone(5.5, 4, 4, 0xaa4444, -14, 10, 60);

        makeBox(8, 7, 7, houseColor, -2, 4.5, 62);
        makeCone(4.5, 5, 4, roofColor, -2, 11, 62);

        // Opposite side of street
        makeBox(9, 6, 7, houseColor, -46, 4, 78);
        makeCone(5, 4, 4, roofColor, -46, 10, 78);

        makeBox(8, 7, 8, stoneColor, -34, 4.5, 76);
        makeCone(4.5, 4.5, 4, 0xaa4444, -34, 11, 76);

        makeBox(7, 5, 7, houseColor, -20, 3.5, 80);
        makeCone(4, 3.5, 4, roofColor, -20, 9, 80);

        // Inn / tavern - larger building
        makeBox(14, 8, 10, houseColor, -60, 5, 72);
        makeBox(14, 2, 10, roofColor, -60, 10, 72);
        makeCone(7, 5, 4, 0xaa3333, -60, 13.5, 72);
        // Inn sign post
        makeBox(0.3, 5, 0.3, 0x5a3a1a, -52, 5, 67);
        makeBox(3, 0.3, 0.3, 0x5a3a1a, -52, 8, 67);
    }

    function buildPistolManufactory() {
        // Doune pistol manufactory - distinctive local industry
        var factColor = 0xB8A880;

        // Main factory building
        makeBox(18, 9, 12, factColor, 55, 5.5, 65);
        makeBox(18, 2, 12, 0x887755, 55, 11, 65);
        // Factory roof ridge
        makeBox(18, 3, 2, 0x777766, 55, 12.5, 65);
        // Chimney stack for forge
        makeBox(2, 10, 2, 0x666655, 50, 10, 62);
        makeBox(2.5, 2, 2.5, 0x555544, 50, 16, 62);
        makeBox(2, 10, 2, 0x666655, 60, 10, 62);
        makeBox(2.5, 2, 2.5, 0x555544, 60, 16, 62);

        // Smaller workshop annex
        makeBox(8, 6, 8, factColor, 68, 4, 65);
        makeBox(8, 2, 8, 0x887755, 68, 8, 65);
        makeCone(5, 4, 4, 0x777766, 68, 11, 65);
    }

    function buildParishChurch() {
        // Parish church with square tower
        var churchColor = 0xC8B89A;
        var cX = 55;
        var cZ = 20;

        // Church nave body
        makeBox(20, 9, 12, churchColor, cX, 5.5, cZ);
        // Church roof (pitched box)
        makeBox(20, 4, 4, 0x8B7355, cX, 11.5, cZ);

        // Square tower on west end of church
        makeBox(8, 18, 8, churchColor, cX - 14, 10, cZ);
        // Tower parapet
        makeBox(8, 2, 1, churchColor, cX - 14, 20, cZ - 3.5);
        makeBox(8, 2, 1, churchColor, cX - 14, 20, cZ + 3.5);
        makeBox(1, 2, 8, churchColor, cX - 17.5, 20, cZ);
        makeBox(1, 2, 8, churchColor, cX - 10.5, 20, cZ);

        // Bell tower top battlements
        makeBox(2, 2, 1, churchColor, cX - 17, 22, cZ - 3);
        makeBox(2, 2, 1, churchColor, cX - 11, 22, cZ - 3);
        makeBox(2, 2, 1, churchColor, cX - 17, 22, cZ + 3);
        makeBox(2, 2, 1, churchColor, cX - 11, 22, cZ + 3);

        // Church porch
        makeBox(5, 5, 4, churchColor, cX + 11, 3.5, cZ);
        makeCone(3, 3, 4, 0x8B7355, cX + 11, 7.5, cZ);

        // Graveyard enclosure wall
        makeBox(28, 2, 0.8, 0x9a9080, cX, 1.5, cZ - 14);
        makeBox(28, 2, 0.8, 0x9a9080, cX, 1.5, cZ + 14);
        makeBox(0.8, 2, 28, 0x9a9080, cX - 14, 1.5, cZ);
        makeBox(0.8, 2, 28, 0x9a9080, cX + 14, 1.5, cZ);
    }

    function buildStirlingRoad() {
        // Country road approaching castle from south-east
        makeBox(5, 0.5, 80, 0x8a7e6a, 40, 0.3, 45);
        makeBox(80, 0.5, 5, 0x8a7e6a, 0, 0.3, 82);
        // Road verge strips
        makeBox(5, 0.3, 80, 0x5a7030, 44, 0.1, 45);
        makeBox(5, 0.3, 80, 0x5a7030, 36, 0.1, 45);

        // Milestone stone
        makeBox(0.8, 1.5, 0.4, 0x9a8a78, 38, 0.8, 10);

        // Small bridge over a stream
        makeBox(6, 1, 8, 0x8a7a60, 40, 0.5, 5);
        makeBox(0.5, 2, 8, 0x9a8a70, 37, 1.5, 5);
        makeBox(0.5, 2, 8, 0x9a8a70, 43, 1.5, 5);
        // Stream under bridge
        makeBox(3, 0.8, 40, 0x006994, 40, 0.2, 20);
    }

    function buildMotorMuseum() {
        // Doune Motor Museum / visitor hub building
        var musColor = 0xD3D3D3;

        // Main museum building
        makeBox(25, 8, 15, musColor, -65, 5, 30);
        // Flat roof
        makeBox(25, 1, 15, 0xBBBBBB, -65, 9.5, 30);
        // Modern extension
        makeBox(12, 6, 10, musColor, -52, 4, 30);
        makeBox(12, 1, 10, 0xBBBBBB, -52, 7.5, 30);

        // Entrance canopy
        makeBox(8, 0.5, 5, 0xCCCCCC, -65, 8, 22);
        makeBox(0.3, 7, 0.3, 0x888888, -62, 4, 21);
        makeBox(0.3, 7, 0.3, 0x888888, -68, 4, 21);

        // Parked car silhouette (box bodies) near museum
        makeBox(4, 1.5, 2, 0x334455, -58, 1, 20);
        makeBox(4, 1.5, 2, 0x445533, -63, 1, 20);

        // Car wheel cylinders
        makeCylinder(0.5, 0.5, 0.3, 8, 0x222222, -57, 0.5, 19);
        makeCylinder(0.5, 0.5, 0.3, 8, 0x222222, -59, 0.5, 19);
        makeCylinder(0.5, 0.5, 0.3, 8, 0x222222, -62, 0.5, 19);
        makeCylinder(0.5, 0.5, 0.3, 8, 0x222222, -64, 0.5, 19);
    }

    function buildHighlandCattle() {
        // Highland cattle in fields - box body, sphere head, cylinder horns
        spawnCattle(-80, 0, 20);
        spawnCattle(-85, 0, 35);
        spawnCattle(-70, 0, 45);
        spawnCattle(65, 0, 50);
        spawnCattle(72, 0, 40);
        spawnCattle(78, 0, 55);
    }

    function spawnCattle(x, y, z) {
        var bodyColor = 0xCC8844;
        var hornColor = 0xEEDDAA;
        // Shaggy body
        makeBox(3.5, 2, 2, bodyColor, x, y + 2, z);
        // Head sphere
        makeSphere(0.8, 6, 6, bodyColor, x + 2.2, y + 2.5, z);
        // Long curved horns (cylinders at angle)
        var horn1 = makeCylinder(0.15, 0.1, 1.8, 6, hornColor, x + 2.4, y + 3.4, z - 0.8);
        horn1.rotation.z = 0.5;
        horn1.rotation.x = 0.3;
        var horn2 = makeCylinder(0.15, 0.1, 1.8, 6, hornColor, x + 2.4, y + 3.4, z + 0.8);
        horn2.rotation.z = 0.5;
        horn2.rotation.x = -0.3;
        // Legs
        makeCylinder(0.25, 0.25, 2, 6, 0xAA6622, x + 1.2, y + 0.8, z + 0.6);
        makeCylinder(0.25, 0.25, 2, 6, 0xAA6622, x + 1.2, y + 0.8, z - 0.6);
        makeCylinder(0.25, 0.25, 2, 6, 0xAA6622, x - 1.2, y + 0.8, z + 0.6);
        makeCylinder(0.25, 0.25, 2, 6, 0xAA6622, x - 1.2, y + 0.8, z - 0.6);
        // Tail
        makeCylinder(0.1, 0.05, 1.5, 6, bodyColor, x - 1.8, y + 2.2, z);
    }

    function buildTrees() {
        // Riverside willows along River Teith
        spawnWillow(-30, 0, -48);
        spawnWillow(-15, 0, -52);
        spawnWillow(5, 0, -54);
        spawnWillow(20, 0, -50);
        spawnWillow(35, 0, -47);

        // West river bank willows
        spawnWillow(-52, 0, -30);
        spawnWillow(-54, 0, -15);
        spawnWillow(-50, 0, 10);

        // Field oaks
        spawnOak(-75, 0, 10);
        spawnOak(-80, 0, -10);
        spawnOak(70, 0, 10);
        spawnOak(75, 0, -5);
        spawnOak(60, 0, -30);

        // Church graveyard yew trees
        spawnOak(44, 0, 10);
        spawnOak(44, 0, 30);
        spawnOak(66, 0, 10);
        spawnOak(66, 0, 30);
    }

    function spawnWillow(x, y, z) {
        var trunkColor = 0x5a4030;
        var leafColor = 0x2d6b2a;
        // Trunk
        makeCylinder(0.5, 0.7, 7, 7, trunkColor, x, y + 3.5, z);
        // Drooping canopy layers (stacked spheres slightly offset)
        makeSphere(4.5, 7, 6, leafColor, x, y + 9, z);
        makeSphere(3.5, 7, 6, 0x256020, x + 1.5, y + 7, z + 1);
        makeSphere(3, 7, 6, leafColor, x - 1.5, y + 7, z - 1);
    }

    function spawnOak(x, y, z) {
        var trunkColor = 0x5a4030;
        var leafColor = 0x2d6b2a;
        // Trunk
        makeCylinder(0.6, 0.8, 6, 7, trunkColor, x, y + 3, z);
        // Main canopy
        makeSphere(4, 7, 6, leafColor, x, y + 8.5, z);
        // Sub canopy blobs
        makeSphere(2.5, 6, 5, 0x256020, x + 2.5, y + 7, z);
        makeSphere(2.5, 6, 5, leafColor, x - 2, y + 7.5, z + 1.5);
    }

    function update(delta) {
        // Static environment - no per-frame updates needed
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
