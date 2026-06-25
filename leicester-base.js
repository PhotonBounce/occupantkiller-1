window.LeicesterBase = (function() {
    'use strict';

    var WORLD_X = 2980;
    var WORLD_Z = 2200;

    function createMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function createBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = createMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function createCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = createMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function createCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = createMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function buildCathedral(scene) {
        var bx = WORLD_X - 30;
        var bz = WORLD_Z - 20;

        // Main nave body
        var nave = createBox(22, 14, 10, 0xD4A97A, bx, 7, bz);
        scene.add(nave);

        // Crossing tower
        var tower = createBox(6, 18, 6, 0xD4A97A, bx, 9, bz);
        scene.add(tower);

        // Needle spire on crossing tower
        var spire = createCone(1.5, 22, 4, 0xC09070, bx, 28, bz);
        scene.add(spire);

        // West front / entrance block
        var westFront = createBox(8, 12, 4, 0xC49060, bx - 11, 6, bz);
        scene.add(westFront);

        // West towers flanking entrance
        var wtLeft = createBox(3, 14, 3, 0xC49060, bx - 14.5, 7, bz - 3.5);
        scene.add(wtLeft);
        var wtRight = createBox(3, 14, 3, 0xC49060, bx - 14.5, 7, bz + 3.5);
        scene.add(wtRight);

        // West tower spirelets
        var wsLeft = createCone(0.8, 8, 4, 0xB08050, bx - 14.5, 19, bz - 3.5);
        scene.add(wsLeft);
        var wsRight = createCone(0.8, 8, 4, 0xB08050, bx - 14.5, 19, bz + 3.5);
        scene.add(wsRight);

        // Transepts
        var transeptN = createBox(6, 12, 8, 0xD4A97A, bx + 2, 6, bz - 9);
        scene.add(transeptN);
        var transeptS = createBox(6, 12, 8, 0xD4A97A, bx + 2, 6, bz + 9);
        scene.add(transeptS);

        // Chancel / choir east end
        var chancel = createBox(10, 11, 8, 0xCC9E72, bx + 12, 5.5, bz);
        scene.add(chancel);

        // Richard III interment chapel addition (modern stone)
        var chapel = createBox(8, 6, 6, 0x9A9A8A, bx + 18, 3, bz + 5);
        scene.add(chapel);

        // Chapel entrance
        var chapelDoor = createBox(2, 4, 1, 0x7A7A7A, bx + 14.5, 2, bz + 5);
        scene.add(chapelDoor);

        // Chapel roof cap
        var chapelRoof = createBox(8.4, 1, 6.4, 0x888880, bx + 18, 6.5, bz + 5);
        scene.add(chapelRoof);

        // Buttresses on nave
        var butt1 = createBox(1.5, 10, 1.5, 0xC09060, bx - 6, 5, bz - 5.5);
        scene.add(butt1);
        var butt2 = createBox(1.5, 10, 1.5, 0xC09060, bx + 0, 5, bz - 5.5);
        scene.add(butt2);
        var butt3 = createBox(1.5, 10, 1.5, 0xC09060, bx - 6, 5, bz + 5.5);
        scene.add(butt3);
        var butt4 = createBox(1.5, 10, 1.5, 0xC09060, bx + 0, 5, bz + 5.5);
        scene.add(butt4);

        // Richard III tomb inside cathedral (alabaster chest)
        var tomb = createBox(6, 2, 3, 0xD4C090, bx + 10, 1, bz);
        scene.add(tomb);

        // Effigy detail — head block
        var effHead = createBox(1.2, 1, 1, 0xCCB880, bx + 12.4, 2.5, bz);
        scene.add(effHead);

        // Effigy body block
        var effBody = createBox(3, 0.6, 1.2, 0xC8A870, bx + 10, 2.3, bz);
        scene.add(effBody);

        // Heraldic detail ridge on tomb sides
        var tombRidge = createBox(6.2, 0.3, 0.3, 0xBCA060, bx + 10, 2.1, bz - 1.6);
        scene.add(tombRidge);
        var tombRidge2 = createBox(6.2, 0.3, 0.3, 0xBCA060, bx + 10, 2.1, bz + 1.6);
        scene.add(tombRidge2);

        // Cathedral footings / plinth
        var plinth = createBox(26, 1, 14, 0xB89060, bx, 0.5, bz);
        scene.add(plinth);
    }

    function buildJewryWall(scene) {
        var bx = WORLD_X + 40;
        var bz = WORLD_Z - 40;

        // Main Roman wall — tallest standing Roman structure in England
        var wall = createBox(2, 9, 18, 0x9A8A78, bx, 4.5, bz);
        scene.add(wall);

        // Roman wall detail courses — horizontal banding
        var course1 = createBox(2.2, 0.5, 18.2, 0x7A6A58, bx, 3, bz);
        scene.add(course1);
        var course2 = createBox(2.2, 0.5, 18.2, 0x7A6A58, bx, 6, bz);
        scene.add(course2);

        // Wall buttress piers
        var pier1 = createBox(1.5, 9, 2, 0x9A8A78, bx - 1.75, 4.5, bz - 6);
        scene.add(pier1);
        var pier2 = createBox(1.5, 9, 2, 0x9A8A78, bx - 1.75, 4.5, bz);
        scene.add(pier2);
        var pier3 = createBox(1.5, 9, 2, 0x9A8A78, bx - 1.75, 4.5, bz + 6);
        scene.add(pier3);

        // Arched window openings (recessed dark boxes to simulate niches)
        var arch1 = createBox(0.5, 3, 2.5, 0x4A3A28, bx - 1.1, 5, bz - 3);
        scene.add(arch1);
        var arch2 = createBox(0.5, 3, 2.5, 0x4A3A28, bx - 1.1, 5, bz + 3);
        scene.add(arch2);

        // Modern museum adjacent box
        var museum = createBox(16, 7, 10, 0xAAAAAA, bx + 12, 3.5, bz);
        scene.add(museum);

        // Museum entrance canopy
        var canopy = createBox(4, 0.5, 3, 0x888888, bx + 4.5, 3.5, bz);
        scene.add(canopy);

        // Museum roof
        var museumRoof = createBox(16.5, 0.6, 10.5, 0x999999, bx + 12, 7.3, bz);
        scene.add(museumRoof);

        // Roman bath ruins floor slabs
        var slab1 = createBox(6, 0.3, 4, 0x8A7A68, bx + 4, 0.15, bz - 2);
        scene.add(slab1);
        var slab2 = createBox(6, 0.3, 4, 0x8A7A68, bx + 4, 0.15, bz + 2);
        scene.add(slab2);

        // Information pillar
        var infoPillar = createCylinder(0.3, 0.3, 2.5, 6, 0x888888, bx + 2, 1.25, bz + 5);
        scene.add(infoPillar);
    }

    function buildKingPowerStadium(scene) {
        var bx = WORLD_X + 60;
        var bz = WORLD_Z + 60;

        // Four stands around the pitch — North, South, East, West
        // North stand (back of pitch, long side)
        var northStand = createBox(40, 10, 8, 0x2A3A8A, bx, 5, bz - 24);
        scene.add(northStand);

        // South stand
        var southStand = createBox(40, 10, 8, 0x2A3A8A, bx, 5, bz + 24);
        scene.add(southStand);

        // East stand (short end)
        var eastStand = createBox(8, 10, 40, 0x2A3A8A, bx + 24, 5, bz);
        scene.add(eastStand);

        // West stand (main stand, short end)
        var westStand = createBox(8, 10, 40, 0x2A3A8A, bx - 24, 5, bz);
        scene.add(westStand);

        // Stand roofs (lighter)
        var nRoof = createBox(40, 1, 8, 0x3A4A9A, bx, 10.5, bz - 24);
        scene.add(nRoof);
        var sRoof = createBox(40, 1, 8, 0x3A4A9A, bx, 10.5, bz + 24);
        scene.add(sRoof);
        var eRoof = createBox(8, 1, 40, 0x3A4A9A, bx + 24, 10.5, bz);
        scene.add(eRoof);
        var wRoof = createBox(8, 1, 40, 0x3A4A9A, bx - 24, 10.5, bz);
        scene.add(wRoof);

        // Corner pieces linking stands
        var corner1 = createBox(8, 8, 8, 0x253080, bx + 24, 4, bz - 24);
        scene.add(corner1);
        var corner2 = createBox(8, 8, 8, 0x253080, bx + 24, 4, bz + 24);
        scene.add(corner2);
        var corner3 = createBox(8, 8, 8, 0x253080, bx - 24, 4, bz - 24);
        scene.add(corner3);
        var corner4 = createBox(8, 8, 8, 0x253080, bx - 24, 4, bz + 24);
        scene.add(corner4);

        // Pitch surface
        var pitch = createBox(38, 0.3, 26, 0x1A7A1A, bx, 0.15, bz);
        scene.add(pitch);

        // Pitch markings (centre circle suggestion — white box strip)
        var centreSpot = createBox(0.5, 0.1, 0.5, 0xEEEEEE, bx, 0.35, bz);
        scene.add(centreSpot);
        var halfwayLine = createBox(38, 0.1, 0.3, 0xEEEEEE, bx, 0.35, bz);
        scene.add(halfwayLine);

        // Floodlight pylons at corners
        var fl1 = createCylinder(0.2, 0.3, 18, 4, 0xAAAAAA, bx + 28, 9, bz - 28);
        scene.add(fl1);
        var fl2 = createCylinder(0.2, 0.3, 18, 4, 0xAAAAAA, bx + 28, 9, bz + 28);
        scene.add(fl2);
        var fl3 = createCylinder(0.2, 0.3, 18, 4, 0xAAAAAA, bx - 28, 9, bz - 28);
        scene.add(fl3);
        var fl4 = createCylinder(0.2, 0.3, 18, 4, 0xAAAAAA, bx - 28, 9, bz + 28);
        scene.add(fl4);

        // Floodlight heads
        var flh1 = createBox(3, 0.5, 2, 0xDDDDDD, bx + 28, 18.5, bz - 28);
        scene.add(flh1);
        var flh2 = createBox(3, 0.5, 2, 0xDDDDDD, bx + 28, 18.5, bz + 28);
        scene.add(flh2);
        var flh3 = createBox(3, 0.5, 2, 0xDDDDDD, bx - 28, 18.5, bz - 28);
        scene.add(flh3);
        var flh4 = createBox(3, 0.5, 2, 0xDDDDDD, bx - 28, 18.5, bz + 28);
        scene.add(flh4);

        // Foxes mascot sculpture — stylised fox body (box form)
        var foxBody = createBox(2, 2, 3, 0xCC6600, bx - 30, 1, bz);
        scene.add(foxBody);

        // Fox head
        var foxHead = createBox(1.5, 1.5, 1.5, 0xCC6600, bx - 30, 2.75, bz - 0.5);
        scene.add(foxHead);

        // Fox ears (cone spikes)
        var foxEarL = createCone(0.3, 1, 4, 0xCC5500, bx - 30.4, 3.8, bz - 0.4);
        scene.add(foxEarL);
        var foxEarR = createCone(0.3, 1, 4, 0xCC5500, bx - 29.6, 3.8, bz - 0.4);
        scene.add(foxEarR);

        // Fox tail
        var foxTail = createBox(0.6, 0.6, 2, 0xCC5500, bx - 30, 1.3, bz + 2.5);
        scene.add(foxTail);

        // Stadium entrance gate
        var gate = createBox(6, 5, 1, 0x1A2870, bx - 24, 2.5, bz - 15);
        scene.add(gate);
    }

    function buildLeicesterCastle(scene) {
        var bx = WORLD_X - 20;
        var bz = WORLD_Z + 50;

        // Great Hall — main medieval hall
        var hall = createBox(24, 10, 12, 0x9A8A78, bx, 5, bz);
        scene.add(hall);

        // Hall roof ridge
        var hallRoof = createBox(24.4, 2, 12.4, 0x8A7A68, bx, 11, bz);
        scene.add(hallRoof);

        // Hall entrance porch
        var porch = createBox(4, 7, 3, 0x8A7A68, bx - 12, 3.5, bz);
        scene.add(porch);

        // Porch pediment
        var pediment = createCone(2, 3, 4, 0x7A6A58, bx - 12, 8.5, bz);
        scene.add(pediment);

        // Motte (earthen mound — modelled as stacked cylinders)
        var motteBase = createCylinder(10, 12, 4, 8, 0x5A6A40, bx + 24, 2, bz);
        scene.add(motteBase);
        var motteTop = createCylinder(6, 10, 3, 8, 0x5A6A40, bx + 24, 5.5, bz);
        scene.add(motteTop);

        // Keep on top of motte
        var keep = createBox(8, 10, 8, 0x8A8070, bx + 24, 11, bz);
        scene.add(keep);

        // Keep corner turrets
        var kt1 = createBox(2, 11, 2, 0x7A7060, bx + 20, 10.5, bz - 4);
        scene.add(kt1);
        var kt2 = createBox(2, 11, 2, 0x7A7060, bx + 28, 10.5, bz - 4);
        scene.add(kt2);
        var kt3 = createBox(2, 11, 2, 0x7A7060, bx + 20, 10.5, bz + 4);
        scene.add(kt3);
        var kt4 = createBox(2, 11, 2, 0x7A7060, bx + 28, 10.5, bz + 4);
        scene.add(kt4);

        // Keep battlements
        var batt1 = createBox(8, 1.5, 1, 0x8A8070, bx + 24, 16.75, bz - 4);
        scene.add(batt1);
        var batt2 = createBox(8, 1.5, 1, 0x8A8070, bx + 24, 16.75, bz + 4);
        scene.add(batt2);

        // Castle gate tower
        var gateTower = createBox(5, 12, 5, 0x8A8070, bx - 16, 6, bz);
        scene.add(gateTower);
        var gateTowerTop = createBox(6, 2, 6, 0x7A7060, bx - 16, 13, bz);
        scene.add(gateTowerTop);

        // Curtain wall stretches
        var wallN = createBox(18, 8, 1.5, 0x9A9080, bx + 4, 4, bz - 7);
        scene.add(wallN);
        var wallS = createBox(18, 8, 1.5, 0x9A9080, bx + 4, 4, bz + 7);
        scene.add(wallS);

        // Historic plaque / sign box
        var plaque = createBox(2, 1.2, 0.2, 0xC8A040, bx - 14, 2, bz - 2);
        scene.add(plaque);
    }

    function buildRiverSoar(scene) {
        var bx = WORLD_X;
        var bz = WORLD_Z + 20;

        // River channel — elongated water boxes
        var river1 = createBox(80, 0.4, 6, 0x1A6B8A, bx, 0.2, bz);
        scene.add(river1);
        var river2 = createBox(60, 0.4, 6, 0x1A6B8A, bx + 10, 0.2, bz + 8);
        scene.add(river2);
        var river3 = createBox(40, 0.4, 6, 0x1A6B8A, bx - 20, 0.2, bz - 8);
        scene.add(river3);

        // Slight depth illusion — darker under-water layer
        var riverDeep = createBox(80, 0.3, 4, 0x0A4A6A, bx, 0.05, bz);
        scene.add(riverDeep);

        // Victorian bridge — stone piers
        var pier1 = createBox(2, 4, 3, 0x9A8878, bx - 10, 2, bz);
        scene.add(pier1);
        var pier2 = createBox(2, 4, 3, 0x9A8878, bx - 10 + 6, 2, bz);
        scene.add(pier2);

        // Bridge deck spanning between piers
        var deck = createBox(10, 0.8, 7, 0x8A7868, bx - 7, 4.4, bz);
        scene.add(deck);

        // Bridge parapets
        var paraLeft = createBox(10, 1, 0.5, 0x9A8878, bx - 7, 5.2, bz - 3);
        scene.add(paraLeft);
        var paraRight = createBox(10, 1, 0.5, 0x9A8878, bx - 7, 5.2, bz + 3);
        scene.add(paraRight);

        // Lamp posts on bridge
        var lamp1 = createCylinder(0.1, 0.15, 3, 5, 0x888888, bx - 11, 5.5, bz - 2.5);
        scene.add(lamp1);
        var lamp2 = createCylinder(0.1, 0.15, 3, 5, 0x888888, bx - 11, 5.5, bz + 2.5);
        scene.add(lamp2);
        var lamp3 = createCylinder(0.1, 0.15, 3, 5, 0x888888, bx - 3, 5.5, bz - 2.5);
        scene.add(lamp3);
        var lamp4 = createCylinder(0.1, 0.15, 3, 5, 0x888888, bx - 3, 5.5, bz + 2.5);
        scene.add(lamp4);

        // Lamp globes
        var lg1 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 4), createMaterial(0xFFFFCC));
        lg1.position.set(bx - 11, 7.1, bz - 2.5);
        scene.add(lg1);
        var lg2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 4), createMaterial(0xFFFFCC));
        lg2.position.set(bx - 11, 7.1, bz + 2.5);
        scene.add(lg2);
        var lg3 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 4), createMaterial(0xFFFFCC));
        lg3.position.set(bx - 3, 7.1, bz - 2.5);
        scene.add(lg3);
        var lg4 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 4), createMaterial(0xFFFFCC));
        lg4.position.set(bx - 3, 7.1, bz + 2.5);
        scene.add(lg4);

        // Riverbank vegetation clumps (dark green boxes)
        var bush1 = createBox(2, 1.5, 2, 0x1A4A0A, bx + 15, 0.75, bz - 5);
        scene.add(bush1);
        var bush2 = createBox(3, 2, 2, 0x1A4A0A, bx - 20, 1, bz + 5);
        scene.add(bush2);
        var bush3 = createBox(2, 1.8, 2, 0x2A5A1A, bx + 30, 0.9, bz - 4);
        scene.add(bush3);
    }

    function buildStreetContext(scene) {
        var bx = WORLD_X;
        var bz = WORLD_Z;

        // High Street road strip
        var road1 = createBox(60, 0.1, 8, 0x333333, bx, 0.05, bz - 30);
        scene.add(road1);

        // Side street
        var road2 = createBox(8, 0.1, 40, 0x333333, bx + 20, 0.05, bz - 10);
        scene.add(road2);

        // Generic city buildings — background blocks
        var bld1 = createBox(8, 12, 8, 0xAA9988, bx + 50, 6, bz - 15);
        scene.add(bld1);
        var bld2 = createBox(10, 16, 8, 0xBBAA99, bx + 60, 8, bz - 25);
        scene.add(bld2);
        var bld3 = createBox(7, 9, 7, 0x998877, bx + 52, 4.5, bz - 35);
        scene.add(bld3);
        var bld4 = createBox(9, 14, 9, 0xAAA090, bx - 50, 7, bz - 10);
        scene.add(bld4);
        var bld5 = createBox(8, 11, 10, 0xBBB0A0, bx - 60, 5.5, bz + 20);
        scene.add(bld5);

        // Clock tower (general Leicester street furniture)
        var clockBase = createBox(2.5, 14, 2.5, 0xAA9988, bx + 15, 7, bz - 30);
        scene.add(clockBase);
        var clockTop = createBox(3, 1, 3, 0x998877, bx + 15, 14.5, bz - 30);
        scene.add(clockTop);
        var clockSpire = createCone(0.6, 5, 4, 0x887766, bx + 15, 18, bz - 30);
        scene.add(clockSpire);

        // Clock face (disc suggestion)
        var clockFace = createBox(2, 2, 0.3, 0xEEEECC, bx + 15, 11, bz - 31.3);
        scene.add(clockFace);

        // Pavement strips
        var pave1 = createBox(60, 0.15, 3, 0xBBB0A0, bx, 0.075, bz - 26.5);
        scene.add(pave1);
        var pave2 = createBox(60, 0.15, 3, 0xBBB0A0, bx, 0.075, bz - 33.5);
        scene.add(pave2);
    }

    function build(scene) {
        buildCathedral(scene);
        buildJewryWall(scene);
        buildKingPowerStadium(scene);
        buildLeicesterCastle(scene);
        buildRiverSoar(scene);
        buildStreetContext(scene);
    }

    function getSpawnPoint() {
        return { x: WORLD_X, y: 2, z: WORLD_Z };
    }

    return {
        build: build,
        getSpawnPoint: getSpawnPoint,
        WORLD_X: WORLD_X,
        WORLD_Z: WORLD_Z
    };
}());
