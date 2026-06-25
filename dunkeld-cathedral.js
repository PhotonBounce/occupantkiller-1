window.DunkeldCathedral = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 20680;
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

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
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

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeLines(points, color) {
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var lines = new THREE.LineSegments(geo, mat);
        return addMesh(lines);
    }

    function build() {
        buildGround();
        buildCathedralNave();
        buildCathedralChoir();
        buildNWTower();
        buildCathedralGreen();
        buildYewTrees();
        buildRiverTay();
        buildTelfordBridge();
        buildCathedralStreet();
        buildLittleHouses();
        buildBirnamHill();
        buildBirnamVillage();
        buildHermitage();
        buildObelisk();
        buildExtraDetails();
    }

    function buildGround() {
        // Cathedral green lawn
        makeBox(200, 1, 200, 0x4a7c3f, 0, -0.5, 0);
        // Town ground
        makeBox(300, 1, 150, 0x8B7355, 120, -0.5, -80);
        // Riverbank ground south
        makeBox(400, 1, 40, 0x6B8E5A, 0, -0.5, 90);
        // Birnam side ground
        makeBox(300, 1, 200, 0x4a7c3f, 0, -0.5, 200);
    }

    function buildCathedralNave() {
        // Roofless medieval nave ruin — long rectangular nave
        // Nave floor/base
        makeBox(50, 1, 20, 0x9E8F74, -30, 0, 0);

        // North nave wall (long wall, tall, roofless ruin)
        makeBox(50, 18, 2, 0xC8B89A, -30, 9, -10);
        // South nave wall
        makeBox(50, 18, 2, 0xC8B89A, -30, 9, 10);
        // West nave gable wall (partial ruin)
        makeBox(2, 14, 20, 0xC8B89A, -55, 7, 0);

        // Gothic arch buttresses on north wall
        makeBox(3, 18, 2, 0xBAAA8E, -42, 9, -11);
        makeBox(3, 18, 2, 0xBAAA8E, -30, 9, -11);
        makeBox(3, 18, 2, 0xBAAA8E, -18, 9, -11);
        // Gothic arch buttresses on south wall
        makeBox(3, 18, 2, 0xBAAA8E, -42, 9, 11);
        makeBox(3, 18, 2, 0xBAAA8E, -30, 9, 11);
        makeBox(3, 18, 2, 0xBAAA8E, -18, 9, 11);

        // Window tracery blocks — pointed arch windows in north wall
        makeBox(2, 5, 3, 0x7A6E58, -42, 14, -10);
        makeBox(2, 5, 3, 0x7A6E58, -30, 14, -10);
        makeBox(2, 5, 3, 0x7A6E58, -18, 14, -10);
        // Window tracery south wall
        makeBox(2, 5, 3, 0x7A6E58, -42, 14, 10);
        makeBox(2, 5, 3, 0x7A6E58, -30, 14, 10);
        makeBox(2, 5, 3, 0x7A6E58, -18, 14, 10);

        // Wall-top broken battlement sections north
        makeBox(4, 2, 2, 0xC8B89A, -50, 19, -10);
        makeBox(4, 2, 2, 0xC8B89A, -38, 19, -10);
        makeBox(4, 2, 2, 0xC8B89A, -24, 19, -10);
        // Wall-top broken battlement sections south
        makeBox(4, 2, 2, 0xC8B89A, -50, 19, 10);
        makeBox(4, 2, 2, 0xC8B89A, -38, 19, 10);
        makeBox(4, 2, 2, 0xC8B89A, -24, 19, 10);
    }

    function buildCathedralChoir() {
        // Choir is still roofed and in use as parish church
        // Choir walls
        makeBox(30, 15, 18, 0xC8B89A, 10, 7.5, 0);
        // Choir roof (intact pitched roof — two box halves for pitch)
        makeBox(32, 3, 10, 0x8B7355, 10, 17, -4);
        makeBox(32, 3, 10, 0x8B7355, 10, 17, 4);
        // Ridge beam
        makeBox(32, 1, 1, 0x6B5A3E, 10, 19, 0);
        // East window (large perpendicular)
        makeBox(2, 8, 10, 0x9E8F74, 25, 10, 0);
        // Choir interior floor
        makeBox(28, 0.5, 16, 0xB8A882, 10, 0.25, 0);
        // Choir door
        makeBox(2, 5, 3, 0x5C4A2A, 25, 2.5, 0);
        // Choir south transept
        makeBox(10, 14, 12, 0xC8B89A, 5, 7, 15);
        makeBox(10, 3, 12, 0x8B7355, 5, 15.5, 15);
    }

    function buildNWTower() {
        // Massive square NW tower, 30m tall, intact
        makeBox(12, 30, 12, 0xC8B89A, -58, 15, -14);
        // Tower parapet battlements
        makeBox(12, 2, 2, 0xC8B89A, -58, 31, -20);
        makeBox(12, 2, 2, 0xC8B89A, -58, 31, -8);
        makeBox(2, 2, 12, 0xC8B89A, -64, 31, -14);
        makeBox(2, 2, 12, 0xC8B89A, -52, 31, -14);
        // Tower merlons
        makeBox(3, 3, 2, 0xC8B89A, -62, 33, -20);
        makeBox(3, 3, 2, 0xC8B89A, -56, 33, -20);
        makeBox(3, 3, 2, 0xC8B89A, -50, 33, -20);
        makeBox(3, 3, 2, 0xC8B89A, -62, 33, -8);
        makeBox(3, 3, 2, 0xC8B89A, -56, 33, -8);
        makeBox(3, 3, 2, 0xC8B89A, -50, 33, -8);
        // Tower window slots
        makeBox(2, 3, 1, 0x4A3F30, -58, 20, -20);
        makeBox(2, 3, 1, 0x4A3F30, -58, 10, -20);
        // Tower door arch base
        makeBox(4, 6, 2, 0x5C4A2A, -58, 3, -8);
    }

    function buildCathedralGreen() {
        // Gravel path around cathedral
        makeBox(120, 0.5, 3, 0xB8A882, -10, 0.25, -22);
        makeBox(120, 0.5, 3, 0xB8A882, -10, 0.25, 22);
        makeBox(3, 0.5, 44, 0xB8A882, -70, 0.25, 0);
        makeBox(3, 0.5, 44, 0xB8A882, 50, 0.25, 0);
        // Low perimeter wall around precinct
        makeBox(150, 1.5, 1, 0xC8B89A, -10, 0.75, -40);
        makeBox(150, 1.5, 1, 0xC8B89A, -10, 0.75, 40);
        makeBox(1, 1.5, 80, 0xC8B89A, -85, 0.75, 0);
        makeBox(1, 1.5, 80, 0xC8B89A, 65, 0.75, 0);
        // Precinct gate posts
        makeCylinder(0.5, 0.5, 3, 8, 0xC8B89A, 65, 1.5, -5);
        makeCylinder(0.5, 0.5, 3, 8, 0xC8B89A, 65, 1.5, 5);
    }

    function buildYewTrees() {
        // Ancient yew trees on the cathedral green
        makeCylinder(0.4, 0.5, 4, 6, 0x4A3520, -20, 2, -30);
        makeSphere(3, 7, 6, 0x1A3A0F, -20, 6, -30);
        makeCylinder(0.4, 0.5, 4, 6, 0x4A3520, 0, 2, -32);
        makeSphere(2.5, 7, 6, 0x1A3A0F, 0, 6, -32);
        makeCylinder(0.4, 0.5, 5, 6, 0x4A3520, 20, 2, -31);
        makeSphere(3.5, 7, 6, 0x1A3A0F, 20, 5, -31);
        makeCylinder(0.4, 0.5, 4, 6, 0x4A3520, -40, 2, -30);
        makeSphere(2.8, 7, 6, 0x1A3A0F, -40, 5, -30);
        makeCylinder(0.4, 0.5, 5, 6, 0x4A3520, -10, 2, 32);
        makeSphere(3, 7, 6, 0x1A3A0F, -10, 6, 32);
        makeCylinder(0.4, 0.5, 4, 6, 0x4A3520, 30, 2, 31);
        makeSphere(2.5, 7, 6, 0x1A3A0F, 30, 5, 31);
    }

    function buildRiverTay() {
        // River Tay — wide river running roughly east-west at south edge
        makeBox(500, 0.8, 60, 0x006994, 0, -0.4, 110);
        // River bank near-side pebble beach
        makeBox(500, 0.6, 10, 0xA89880, 0, -0.3, 82);
        // River bank far side
        makeBox(500, 0.6, 10, 0x8B9E78, 0, -0.3, 140);
        // River flow ripple suggestion (thin slabs)
        makeBox(80, 0.1, 4, 0x0077AA, -60, 0.1, 105);
        makeBox(80, 0.1, 4, 0x0077AA, 40, 0.1, 115);
        makeBox(80, 0.1, 3, 0x0077AA, -20, 0.1, 120);
    }

    function buildTelfordBridge() {
        // Telford Bridge 1809 — beautiful single-arch stone bridge over River Tay
        // Bridge deck
        makeBox(10, 2, 30, 0xC8B89A, 70, 3, 110);
        // Main arch support (single arch suggestion via cylinder)
        makeCylinder(8, 10, 4, 12, 0xBAAA8E, 70, 0, 110);
        // Bridge parapet north side
        makeBox(10, 2, 2, 0xC8B89A, 70, 5, 96);
        // Bridge parapet south side
        makeBox(10, 2, 2, 0xC8B89A, 70, 5, 124);
        // Parapet pillars
        makeBox(1.5, 3, 1.5, 0xC8B89A, 64, 5.5, 96);
        makeBox(1.5, 3, 1.5, 0xC8B89A, 76, 5.5, 96);
        makeBox(1.5, 3, 1.5, 0xC8B89A, 64, 5.5, 124);
        makeBox(1.5, 3, 1.5, 0xC8B89A, 76, 5.5, 124);
        // Approach road north
        makeBox(10, 0.5, 20, 0xB8A882, 70, 0.25, 76);
        // Approach road south
        makeBox(10, 0.5, 20, 0xB8A882, 70, 0.25, 140);
    }

    function buildCathedralStreet() {
        // Cathedral Street — cobbled main street
        makeBox(200, 0.5, 8, 0x9E9080, 60, 0.25, -50);
        // Side lane
        makeBox(6, 0.5, 60, 0x9E9080, 30, 0.25, -70);
        // High Street continuation
        makeBox(120, 0.5, 8, 0x9E9080, 60, 0.25, -65);
        // Pavement strips
        makeBox(200, 0.3, 2, 0xB8B0A0, 60, 0.3, -46);
        makeBox(200, 0.3, 2, 0xB8B0A0, 60, 0.3, -54);
    }

    function buildLittleHouses() {
        // NTS "Little Houses" — 17th-century whitewashed stone cottages
        // Row 1 — north side of Cathedral Street
        buildCottage(20, -45, -1);
        buildCottage(34, -45, -2);
        buildCottage(48, -45, -3);
        buildCottage(62, -45, 2);
        buildCottage(76, -45, -1);
        buildCottage(90, -45, 1);
        buildCottage(104, -45, 0);
        // Row 2 — south side of Cathedral Street
        buildCottage(20, -55, 0);
        buildCottage(34, -55, 1);
        buildCottage(48, -55, -1);
        buildCottage(62, -55, 2);
        buildCottage(76, -55, 0);
        buildCottage(90, -55, -2);
        // Row along side lane
        buildCottage(30, -68, 3);
        buildCottage(30, -80, -2);
        // A few larger townhouses
        makeBox(12, 10, 10, 0xF5F0E8, 110, 5, -50);
        makeBox(12, 3, 10, 0x8B7355, 110, 11.5, -50);
        makeBox(12, 10, 10, 0xF5F0E8, 130, 5, -55);
        makeBox(12, 3, 10, 0x7A6B4E, 130, 11.5, -55);
    }

    function buildCottage(x, z, jitter) {
        // Whitewashed cottage body
        makeBox(10, 6, 8, 0xF5F0E8, x, 3, z + jitter);
        // Pitched roof
        makeCone(7, 4, 4, 0x8B7355, x, 8, z + jitter);
        // Door
        makeBox(1.5, 3, 1, 0x5C3A1A, x, 1.5, z + jitter - 4);
        // Windows
        makeBox(1.5, 1.5, 1, 0x8EB4C8, x - 2.5, 3.5, z + jitter - 4);
        makeBox(1.5, 1.5, 1, 0x8EB4C8, x + 2.5, 3.5, z + jitter - 4);
        // Chimney
        makeBox(1, 3, 1, 0xD4C4A8, x + 3, 9.5, z + jitter);
    }

    function buildBirnamHill() {
        // Birnam Hill — large wooded hill to the south across the Tay
        // Hill mass
        makeBox(120, 40, 80, 0x3d6b30, 0, 20, 200);
        // Secondary hill ridge
        makeBox(80, 30, 60, 0x3d6b30, -60, 15, 210);
        // Hill peak
        makeSphere(20, 8, 6, 0x3d6b30, 10, 60, 195);
        // Forest canopy blobs (Birnam Wood)
        makeSphere(15, 7, 6, 0x2d5525, -30, 45, 190);
        makeSphere(18, 7, 6, 0x2d5525, 20, 50, 205);
        makeSphere(12, 7, 6, 0x3d6b30, 50, 42, 200);
        makeSphere(14, 7, 6, 0x2d5525, -50, 40, 215);
        makeSphere(10, 7, 6, 0x3d6b30, 5, 55, 185);
        makeSphere(16, 7, 6, 0x2d5525, -15, 52, 200);
        // Scattered trees on hillside
        makeCylinder(0.6, 0.8, 8, 6, 0x3A2510, 30, 4, 165);
        makeSphere(4, 6, 5, 0x3d6b30, 30, 10, 165);
        makeCylinder(0.6, 0.8, 7, 6, 0x3A2510, -20, 4, 170);
        makeSphere(3.5, 6, 5, 0x2d5525, -20, 9, 170);
        makeCylinder(0.6, 0.8, 9, 6, 0x3A2510, 55, 4, 168);
        makeSphere(4.5, 6, 5, 0x3d6b30, 55, 11, 168);
    }

    function buildBirnamVillage() {
        // Victorian houses in Birnam village across the River Tay
        buildVictorianHouse(20, 155, 0);
        buildVictorianHouse(40, 158, 1);
        buildVictorianHouse(60, 153, -1);
        buildVictorianHouse(80, 156, 2);
        buildVictorianHouse(-10, 155, -2);
        buildVictorianHouse(-30, 158, 1);
        // Birnam village road
        makeBox(150, 0.4, 6, 0x9E9080, 25, 0.2, 150);
        // Birnam Oak area (ancient tree)
        makeCylinder(1.2, 1.5, 10, 8, 0x4A3520, -5, 5, 163);
        makeSphere(6, 8, 7, 0x2d5525, -5, 13, 163);
    }

    function buildVictorianHouse(x, z, jitter) {
        // Victorian stone house
        makeBox(10, 9, 9, 0xF5F0E8, x, 4.5, z + jitter);
        // Pitched roof Victorian style
        makeBox(12, 4, 11, 0x6B5A3E, x, 11, z + jitter);
        // Bay window
        makeBox(4, 5, 2, 0xF5F0E8, x, 3.5, z + jitter - 5.5);
        // Chimney stacks (Victorian)
        makeBox(1, 4, 1, 0xD4C4A8, x - 3, 13, z + jitter - 3);
        makeBox(1, 4, 1, 0xD4C4A8, x + 3, 13, z + jitter - 3);
        // Front garden wall
        makeBox(12, 1, 1, 0xC8B89A, x, 0.5, z + jitter - 7);
    }

    function buildHermitage() {
        // The Hermitage — woodland with Ossian's Hall and waterfall
        // Woodland mass
        makeBox(80, 1, 60, 0x4a7c3f, -150, 0.5, -20);
        // Trees in Hermitage woodland
        makeCylinder(0.5, 0.7, 12, 7, 0x3A2510, -140, 6, -10);
        makeSphere(5, 7, 6, 0x2d5525, -140, 14, -10);
        makeCylinder(0.5, 0.7, 14, 7, 0x3A2510, -155, 7, -5);
        makeSphere(5.5, 7, 6, 0x3d6b30, -155, 16, -5);
        makeCylinder(0.5, 0.7, 11, 7, 0x3A2510, -165, 5.5, -20);
        makeSphere(4.5, 7, 6, 0x2d5525, -165, 13, -20);
        makeCylinder(0.5, 0.7, 13, 7, 0x3A2510, -145, 6.5, -30);
        makeSphere(5, 7, 6, 0x3d6b30, -145, 15, -30);
        makeCylinder(0.5, 0.7, 10, 7, 0x3A2510, -170, 5, -35);
        makeSphere(4, 7, 6, 0x2d5525, -170, 12, -35);
        // Ossian's Hall — small Georgian folly building
        makeBox(6, 5, 6, 0xE8DCC8, -155, 2.5, -25);
        makeBox(8, 1, 8, 0xD4C4A8, -155, 5.5, -25);
        makeCone(5, 3, 8, 0x9E8F74, -155, 7, -25);
        // Waterfall — Black Linn waterfall
        makeBox(4, 10, 2, 0x8AB4C8, -148, 5, -40);
        makeBox(6, 1, 3, 0x6698B0, -148, -0.5, -38);
        // Stream/river Braan
        makeBox(60, 0.5, 5, 0x5A8AAA, -150, 0.25, -42);
    }

    function buildObelisk() {
        // Duke of Atholl's obelisk monument — tall tapering stone obelisk
        // Base plinth
        makeBox(5, 2, 5, 0xC8B89A, 50, 1, -30);
        makeBox(4, 1, 4, 0xC8B89A, 50, 2.5, -30);
        // Obelisk shaft — tall tapering box
        makeCylinder(0.3, 1.2, 18, 4, 0xC8B89A, 50, 12, -30);
        // Obelisk pyramidion cap
        makeCone(0.8, 2, 4, 0xBAAA8E, 50, 21.5, -30);
    }

    function buildExtraDetails() {
        // Chapter house ruins (octagonal — approximated with cylinder)
        makeCylinder(7, 8, 8, 8, 0xC8B89A, 20, 4, 20);
        // Chapter house wall tops broken
        makeBox(12, 1, 2, 0xC8B89A, 20, 8.5, 27);
        makeBox(12, 1, 2, 0xC8B89A, 20, 8.5, 13);

        // Cemetery grave markers (in precinct)
        makeBox(0.3, 1.5, 0.8, 0x9E9080, -10, 0.75, 28);
        makeBox(0.3, 1.5, 0.8, 0x9E9080, -15, 0.75, 30);
        makeBox(0.3, 1.5, 0.8, 0x9E9080, -20, 0.75, 29);
        makeBox(0.3, 1.5, 0.8, 0x9E9080, -25, 0.75, 27);
        makeBox(0.3, 1.5, 0.8, 0x9E9080, -8, 0.75, 32);
        makeBox(0.3, 1.5, 0.8, 0x9E9080, -30, 0.75, 31);

        // Well/font in cathedral precinct
        makeCylinder(1.5, 1.8, 1, 10, 0xC8B89A, 40, 0.5, -10);
        makeCylinder(1.8, 1.8, 0.3, 10, 0xC8B89A, 40, 1.15, -10);

        // Information board / noticeboard
        makeBox(2, 3, 0.2, 0x5C4A2A, 55, 1.5, -25);
        makeBox(2.4, 0.3, 0.2, 0x4A3520, 55, 3.2, -25);

        // Lamp posts along Cathedral Street
        makeCylinder(0.1, 0.1, 5, 6, 0x2A2A2A, 25, 2.5, -46);
        makeSphere(0.5, 5, 4, 0xFFEE88, 25, 5.2, -46);
        makeCylinder(0.1, 0.1, 5, 6, 0x2A2A2A, 55, 2.5, -46);
        makeSphere(0.5, 5, 4, 0xFFEE88, 55, 5.2, -46);
        makeCylinder(0.1, 0.1, 5, 6, 0x2A2A2A, 85, 2.5, -46);
        makeSphere(0.5, 5, 4, 0xFFEE88, 85, 5.2, -46);

        // Ruined arch connecting nave to tower
        makeBox(2, 12, 2, 0xC8B89A, -52, 6, -10);
        makeBox(8, 2, 2, 0xC8B89A, -56, 12, -10);

        // Scattered stone rubble around nave
        makeBox(2, 0.8, 1.5, 0xC8B89A, -35, 0.4, 14);
        makeBox(1.5, 0.6, 1, 0xC8B89A, -44, 0.3, 13);
        makeBox(3, 0.5, 2, 0xC8B89A, -20, 0.25, 13);
        makeBox(1, 0.8, 1.5, 0xC8B89A, -55, 0.4, 8);

        // Footpath from Cathedral to bridge
        makeBox(4, 0.3, 80, 0xB0A898, 70, 0.15, 43);

        // Distant hills to north (Craigvinean Forest)
        makeBox(200, 25, 60, 0x3d6b30, 0, 12.5, -120);
        makeSphere(30, 7, 5, 0x2d5525, -40, 40, -130);
        makeSphere(25, 7, 5, 0x3d6b30, 30, 35, -125);

        // River Tay north bank vegetation
        makeCylinder(0.4, 0.5, 6, 6, 0x3A2510, -80, 3, 75);
        makeSphere(3, 6, 5, 0x3d6b30, -80, 7, 75);
        makeCylinder(0.4, 0.5, 7, 6, 0x3A2510, -100, 3.5, 78);
        makeSphere(3.5, 6, 5, 0x2d5525, -100, 8, 78);

        // Lych gate at precinct entrance
        makeBox(1, 4, 1, 0x8B7355, 65, 2, -12);
        makeBox(1, 4, 1, 0x8B7355, 65, 2, 12);
        makeBox(6, 1, 14, 0x6B5A3E, 65, 4.5, 0);
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
