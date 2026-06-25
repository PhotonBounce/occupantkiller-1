window.LjubljanaCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var BASE_X = 23280;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addMeshRot(geo, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.rotation.set(rx, ry, rz);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildLjubljanaCastle();
        buildTripleBridge();
        buildDragonBridge();
        buildOldTown();
        buildLjubljanicaRiver();
        buildNationalMuseum();
        buildMetelkova();
        buildTivoliPark();
        buildPresernSquare();
        buildCongressSquare();
    }

    // -------------------------------------------------------
    // LJUBLJANA CASTLE
    // -------------------------------------------------------
    function buildLjubljanaCastle() {
        var bx = BASE_X + 0;
        var hillY = 0;

        // Castle hill base
        addMesh(new THREE.CylinderGeometry(55, 80, 40, 8), 0x8B7D6B, bx, hillY + 20, -60);

        // Main castle walls - large rectangular perimeter
        addMesh(new THREE.BoxGeometry(90, 18, 6), 0xD4C8A0, bx, hillY + 49, -20);
        addMesh(new THREE.BoxGeometry(90, 18, 6), 0xD4C8A0, bx, hillY + 49, -100);
        addMesh(new THREE.BoxGeometry(6, 18, 80), 0xD4C8A0, bx - 45, hillY + 49, -60);
        addMesh(new THREE.BoxGeometry(6, 18, 80), 0xD4C8A0, bx + 45, hillY + 49, -60);

        // Wall battlements top - north wall
        addMesh(new THREE.BoxGeometry(8, 4, 4), 0xC8BC90, bx - 30, hillY + 60, -20);
        addMesh(new THREE.BoxGeometry(8, 4, 4), 0xC8BC90, bx - 10, hillY + 60, -20);
        addMesh(new THREE.BoxGeometry(8, 4, 4), 0xC8BC90, bx + 10, hillY + 60, -20);
        addMesh(new THREE.BoxGeometry(8, 4, 4), 0xC8BC90, bx + 30, hillY + 60, -20);

        // Round Watchtower - main cylindrical tower
        addMesh(new THREE.CylinderGeometry(8, 10, 50, 12), 0xD4C8A0, bx + 40, hillY + 65, -25);
        // Watchtower conical roof
        addMesh(new THREE.ConeGeometry(10, 16, 12), 0x8B4513, bx + 40, hillY + 98, -25);
        // Watchtower windows
        addMesh(new THREE.BoxGeometry(2, 4, 3), 0x2A2A2A, bx + 48, hillY + 75, -25);
        addMesh(new THREE.BoxGeometry(2, 4, 3), 0x2A2A2A, bx + 40, hillY + 75, -17);

        // Pentagonal tower - southeast
        addMesh(new THREE.CylinderGeometry(7, 9, 40, 5), 0xC8BC90, bx + 38, hillY + 60, -95);
        addMesh(new THREE.ConeGeometry(9, 14, 5), 0x8B4513, bx + 38, hillY + 87, -95);

        // Corner tower northwest
        addMesh(new THREE.CylinderGeometry(6, 8, 35, 8), 0xD4C8A0, bx - 42, hillY + 57, -22);
        addMesh(new THREE.ConeGeometry(8, 12, 8), 0x8B4513, bx - 42, hillY + 81, -22);

        // Corner tower southwest
        addMesh(new THREE.CylinderGeometry(6, 8, 35, 8), 0xD4C8A0, bx - 42, hillY + 57, -98);
        addMesh(new THREE.ConeGeometry(8, 12, 8), 0x8B4513, bx - 42, hillY + 81, -98);

        // Castle keep - main inner building
        addMesh(new THREE.BoxGeometry(30, 22, 20), 0xD4C8A0, bx - 5, hillY + 51, -55);
        // Keep roof
        addMesh(new THREE.BoxGeometry(32, 4, 22), 0x8B4513, bx - 5, hillY + 63, -55);

        // Chapel of St George
        addMesh(new THREE.BoxGeometry(14, 16, 22), 0xE0D8C8, bx + 10, hillY + 48, -70);
        // Chapel apse - semicircular end
        addMesh(new THREE.CylinderGeometry(7, 7, 16, 8), 0xE0D8C8, bx + 10, hillY + 48, -82);
        // Chapel roof ridge
        addMesh(new THREE.BoxGeometry(2, 8, 24), 0x8B4513, bx + 10, hillY + 60, -70);
        // Chapel bell tower
        addMesh(new THREE.BoxGeometry(6, 26, 6), 0xD4C8A0, bx + 20, hillY + 53, -62);
        addMesh(new THREE.ConeGeometry(5, 10, 4), 0x8B4513, bx + 20, hillY + 79, -62);

        // Funicular track up the hill - series of boxes
        addMesh(new THREE.BoxGeometry(4, 3, 60), 0x7A6A5A, bx - 20, hillY + 22, 10);
        addMesh(new THREE.BoxGeometry(4, 3, 60), 0x7A6A5A, bx - 20, hillY + 35, -30);
        // Funicular car
        addMesh(new THREE.BoxGeometry(6, 5, 10), 0xCC4422, bx - 20, hillY + 45, -45);

        // Castle courtyard paving
        addMesh(new THREE.BoxGeometry(50, 2, 40), 0xC8B898, bx, hillY + 41, -58);

        // Gate arch base left
        addMesh(new THREE.BoxGeometry(4, 16, 6), 0xD4C8A0, bx - 8, hillY + 48, -20);
        // Gate arch base right
        addMesh(new THREE.BoxGeometry(4, 16, 6), 0xD4C8A0, bx + 8, hillY + 48, -20);
        // Gate arch top
        addMesh(new THREE.BoxGeometry(20, 5, 6), 0xD4C8A0, bx, hillY + 60, -20);
    }

    // -------------------------------------------------------
    // TRIPLE BRIDGE (Tromostovje)
    // -------------------------------------------------------
    function buildTripleBridge() {
        var bx = BASE_X + 120;
        var by = 0;
        var bz = 20;

        // Central main bridge deck
        addMesh(new THREE.BoxGeometry(50, 3, 12), 0xD0C8B8, bx, by + 1, bz);

        // Left pedestrian bridge (angled slightly)
        addMeshRot(new THREE.BoxGeometry(52, 3, 8), 0xD0C8B8, bx + 2, by + 1, bz + 18, 0, 0.18, 0);

        // Right pedestrian bridge (angled slightly)
        addMeshRot(new THREE.BoxGeometry(52, 3, 8), 0xD0C8B8, bx + 2, by + 1, bz - 18, 0, -0.18, 0);

        // Central bridge piers (stone)
        addMesh(new THREE.BoxGeometry(6, 8, 10), 0xC0B8A8, bx - 14, by - 3, bz);
        addMesh(new THREE.BoxGeometry(6, 8, 10), 0xC0B8A8, bx + 14, by - 3, bz);

        // Balustrades central bridge - north side
        addMesh(new THREE.BoxGeometry(48, 3, 1), 0xE0D8C8, bx, by + 4, bz - 6);
        // Balustrades central bridge - south side
        addMesh(new THREE.BoxGeometry(48, 3, 1), 0xE0D8C8, bx, by + 4, bz + 6);

        // Balustrade posts central bridge north
        addMesh(new THREE.BoxGeometry(1, 4, 1), 0xE0D8C8, bx - 20, by + 4, bz - 6);
        addMesh(new THREE.BoxGeometry(1, 4, 1), 0xE0D8C8, bx - 8, by + 4, bz - 6);
        addMesh(new THREE.BoxGeometry(1, 4, 1), 0xE0D8C8, bx + 8, by + 4, bz - 6);
        addMesh(new THREE.BoxGeometry(1, 4, 1), 0xE0D8C8, bx + 20, by + 4, bz - 6);

        // Balustrade posts left pedestrian bridge
        addMesh(new THREE.BoxGeometry(48, 3, 1), 0xE0D8C8, bx + 2, by + 4, bz + 22);
        addMesh(new THREE.BoxGeometry(48, 3, 1), 0xE0D8C8, bx + 2, by + 4, bz + 14);

        // Balustrade posts right pedestrian bridge
        addMesh(new THREE.BoxGeometry(48, 3, 1), 0xE0D8C8, bx + 2, by + 4, bz - 14);
        addMesh(new THREE.BoxGeometry(48, 3, 1), 0xE0D8C8, bx + 2, by + 4, bz - 22);

        // Lamp posts on central bridge
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 6), 0x888880, bx - 16, by + 6, bz - 5);
        addMesh(new THREE.SphereGeometry(1, 6, 6), 0xFFFFCC, bx - 16, by + 10, bz - 5);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 6), 0x888880, bx + 16, by + 6, bz - 5);
        addMesh(new THREE.SphereGeometry(1, 6, 6), 0xFFFFCC, bx + 16, by + 10, bz - 5);

        // Steps at bridge ends
        addMesh(new THREE.BoxGeometry(12, 2, 4), 0xC8C0B0, bx + 26, by, bz);
        addMesh(new THREE.BoxGeometry(12, 1, 4), 0xC8C0B0, bx + 29, by - 1, bz);
    }

    // -------------------------------------------------------
    // DRAGON BRIDGE
    // -------------------------------------------------------
    function buildDragonBridge() {
        var bx = BASE_X + 200;
        var by = 0;
        var bz = 0;

        // Main bridge deck
        addMesh(new THREE.BoxGeometry(60, 4, 14), 0x228844, bx, by + 2, bz);

        // Stone piers
        addMesh(new THREE.BoxGeometry(8, 10, 12), 0x336633, bx - 20, by - 3, bz);
        addMesh(new THREE.BoxGeometry(8, 10, 12), 0x336633, bx + 20, by - 3, bz);

        // Wrought iron railings north
        addMesh(new THREE.BoxGeometry(56, 4, 1), 0x1A5533, bx, by + 5, bz - 7);
        // Wrought iron railings south
        addMesh(new THREE.BoxGeometry(56, 4, 1), 0x1A5533, bx, by + 5, bz + 7);

        // Railing vertical bars north
        addMesh(new THREE.BoxGeometry(1, 5, 1), 0x1A5533, bx - 22, by + 4, bz - 7);
        addMesh(new THREE.BoxGeometry(1, 5, 1), 0x1A5533, bx - 8, by + 4, bz - 7);
        addMesh(new THREE.BoxGeometry(1, 5, 1), 0x1A5533, bx + 8, by + 4, bz - 7);
        addMesh(new THREE.BoxGeometry(1, 5, 1), 0x1A5533, bx + 22, by + 4, bz - 7);

        // Dragon statues - four corners (bronze green)
        // Dragon NW - body
        addMesh(new THREE.BoxGeometry(5, 6, 8), 0x228844, bx - 28, by + 8, bz - 8);
        // Dragon NW - head
        addMesh(new THREE.BoxGeometry(4, 4, 5), 0x228844, bx - 28, by + 13, bz - 11);
        // Dragon NW - tail
        addMeshRot(new THREE.CylinderGeometry(1, 2.5, 8, 6), 0x228844, bx - 28, by + 8, bz - 2, 0.6, 0, 0);

        // Dragon NE - body
        addMesh(new THREE.BoxGeometry(5, 6, 8), 0x228844, bx + 28, by + 8, bz - 8);
        // Dragon NE - head
        addMesh(new THREE.BoxGeometry(4, 4, 5), 0x228844, bx + 28, by + 13, bz - 11);

        // Dragon SW - body
        addMesh(new THREE.BoxGeometry(5, 6, 8), 0x228844, bx - 28, by + 8, bz + 8);
        // Dragon SW - head
        addMesh(new THREE.BoxGeometry(4, 4, 5), 0x228844, bx - 28, by + 13, bz + 11);

        // Dragon SE - body
        addMesh(new THREE.BoxGeometry(5, 6, 8), 0x228844, bx + 28, by + 8, bz + 8);
        // Dragon SE - head
        addMesh(new THREE.BoxGeometry(4, 4, 5), 0x228844, bx + 28, by + 13, bz + 11);

        // Dragon pedestal corners
        addMesh(new THREE.BoxGeometry(8, 8, 8), 0x336633, bx - 28, by + 4, bz - 8);
        addMesh(new THREE.BoxGeometry(8, 8, 8), 0x336633, bx + 28, by + 4, bz - 8);
        addMesh(new THREE.BoxGeometry(8, 8, 8), 0x336633, bx - 28, by + 4, bz + 8);
        addMesh(new THREE.BoxGeometry(8, 8, 8), 0x336633, bx + 28, by + 4, bz + 8);

        // Art Nouveau lamp columns
        addMesh(new THREE.CylinderGeometry(0.5, 0.8, 12, 8), 0x1A5533, bx - 10, by + 8, bz - 7);
        addMesh(new THREE.SphereGeometry(1.2, 8, 8), 0xFFFFAA, bx - 10, by + 14, bz - 7);
        addMesh(new THREE.CylinderGeometry(0.5, 0.8, 12, 8), 0x1A5533, bx + 10, by + 8, bz - 7);
        addMesh(new THREE.SphereGeometry(1.2, 8, 8), 0xFFFFAA, bx + 10, by + 14, bz - 7);
    }

    // -------------------------------------------------------
    // OLD TOWN - Baroque market square along river
    // -------------------------------------------------------
    function buildOldTown() {
        var bx = BASE_X + 80;
        var by = 0;
        var bz = 80;

        // Town Hall - large baroque building
        addMesh(new THREE.BoxGeometry(28, 20, 18), 0xCC8822, bx, by + 10, bz);
        // Town Hall roof
        addMesh(new THREE.BoxGeometry(30, 5, 20), 0x8B6010, bx, by + 22, bz);
        // Town Hall tower
        addMesh(new THREE.BoxGeometry(7, 30, 7), 0xCC8822, bx, by + 25, bz);
        addMesh(new THREE.ConeGeometry(5, 12, 4), 0x8B6010, bx, by + 46, bz);
        // Town Hall arcade arches
        addMesh(new THREE.BoxGeometry(28, 6, 4), 0xBB7811, bx, by + 3, bz - 9);

        // Baroque facade building 1
        addMesh(new THREE.BoxGeometry(18, 18, 14), 0xCC9933, bx + 35, by + 9, bz);
        addMesh(new THREE.BoxGeometry(20, 3, 16), 0xBB8822, bx + 35, by + 18, bz);

        // Baroque facade building 2
        addMesh(new THREE.BoxGeometry(16, 16, 12), 0xDD8833, bx - 35, by + 8, bz);
        addMesh(new THREE.BoxGeometry(18, 3, 14), 0xCC7722, bx - 35, by + 16, bz);

        // Baroque facade building 3 (colourful)
        addMesh(new THREE.BoxGeometry(20, 22, 14), 0xEE9944, bx + 60, by + 11, bz - 5);
        addMesh(new THREE.BoxGeometry(22, 4, 16), 0xCC8833, bx + 60, by + 24, bz - 5);

        // Robba Fountain - baroque three rivers fountain
        addMesh(new THREE.CylinderGeometry(6, 7, 2, 8), 0xC8C0A8, bx - 10, by + 1, bz - 20);
        addMesh(new THREE.CylinderGeometry(2, 2, 12, 8), 0xD0C8B0, bx - 10, by + 7, bz - 20);
        addMesh(new THREE.SphereGeometry(3, 8, 8), 0xD0C8B0, bx - 10, by + 16, bz - 20);
        // Fountain basin water
        addMesh(new THREE.CylinderGeometry(5, 5, 1, 8), 0x2A6A8A, bx - 10, by + 0.5, bz - 20);

        // Fish market colonnade
        addMesh(new THREE.BoxGeometry(40, 10, 8), 0xDDD0B0, bx + 10, by + 5, bz + 50);
        // Colonnade pillars
        addMesh(new THREE.CylinderGeometry(1, 1, 10, 8), 0xE0D8C0, bx - 8, by + 5, bz + 46);
        addMesh(new THREE.CylinderGeometry(1, 1, 10, 8), 0xE0D8C0, bx + 2, by + 5, bz + 46);
        addMesh(new THREE.CylinderGeometry(1, 1, 10, 8), 0xE0D8C0, bx + 12, by + 5, bz + 46);
        addMesh(new THREE.CylinderGeometry(1, 1, 10, 8), 0xE0D8C0, bx + 22, by + 5, bz + 46);
        addMesh(new THREE.BoxGeometry(40, 3, 8), 0x9B7010, bx + 10, by + 11, bz + 50);

        // Market square paving
        addMesh(new THREE.BoxGeometry(80, 1, 60), 0xC0B898, bx, by, bz + 10);
    }

    // -------------------------------------------------------
    // LJUBLJANICA RIVER
    // -------------------------------------------------------
    function buildLjubljanicaRiver() {
        var bx = BASE_X + 150;
        var by = -1;
        var bz = 0;

        // Main river channel (winding through city)
        addMesh(new THREE.BoxGeometry(300, 2, 20), 0x2A6A8A, bx, by, bz);
        // River curve section
        addMesh(new THREE.BoxGeometry(20, 2, 60), 0x2A6A8A, bx + 140, by, bz + 20);
        addMesh(new THREE.BoxGeometry(20, 2, 60), 0x2A6A8A, bx - 140, by, bz - 20);

        // North riverbank
        addMesh(new THREE.BoxGeometry(280, 2, 6), 0x7A9A6A, bx, by + 1, bz - 13);
        // South riverbank
        addMesh(new THREE.BoxGeometry(280, 2, 6), 0x7A9A6A, bx, by + 1, bz + 13);

        // Willow trees north bank
        addMesh(new THREE.CylinderGeometry(0.6, 0.8, 14, 6), 0x5A4A3A, bx - 80, by + 8, bz - 14);
        addMesh(new THREE.SphereGeometry(5, 8, 6), 0x4A8A3A, bx - 80, by + 18, bz - 14);
        addMesh(new THREE.CylinderGeometry(0.6, 0.8, 14, 6), 0x5A4A3A, bx + 30, by + 8, bz - 14);
        addMesh(new THREE.SphereGeometry(5, 8, 6), 0x4A8A3A, bx + 30, by + 18, bz - 14);
        addMesh(new THREE.CylinderGeometry(0.6, 0.8, 14, 6), 0x5A4A3A, bx + 90, by + 8, bz - 14);
        addMesh(new THREE.SphereGeometry(5, 8, 6), 0x4A8A3A, bx + 90, by + 18, bz - 14);

        // Willow trees south bank
        addMesh(new THREE.CylinderGeometry(0.6, 0.8, 14, 6), 0x5A4A3A, bx - 50, by + 8, bz + 14);
        addMesh(new THREE.SphereGeometry(5, 8, 6), 0x4A8A3A, bx - 50, by + 18, bz + 14);
        addMesh(new THREE.CylinderGeometry(0.6, 0.8, 14, 6), 0x5A4A3A, bx + 60, by + 8, bz + 14);
        addMesh(new THREE.SphereGeometry(5, 8, 6), 0x4A8A3A, bx + 60, by + 18, bz + 14);

        // Cafe terraces south bank - tables
        addMesh(new THREE.CylinderGeometry(2, 2, 1, 6), 0xBB8855, bx - 20, by + 2, bz + 20);
        addMesh(new THREE.CylinderGeometry(2, 2, 1, 6), 0xBB8855, bx + 10, by + 2, bz + 20);
        addMesh(new THREE.CylinderGeometry(2, 2, 1, 6), 0xBB8855, bx + 40, by + 2, bz + 20);
        // Cafe chairs
        addMesh(new THREE.BoxGeometry(2, 3, 2), 0xCC9966, bx - 22, by + 1.5, bz + 22);
        addMesh(new THREE.BoxGeometry(2, 3, 2), 0xCC9966, bx + 8, by + 1.5, bz + 22);

        // Cafe building south bank
        addMesh(new THREE.BoxGeometry(20, 10, 12), 0xEEAA66, bx - 20, by + 5, bz + 30);
        addMesh(new THREE.BoxGeometry(22, 2, 14), 0x9B7040, bx - 20, by + 11, bz + 30);
    }

    // -------------------------------------------------------
    // NATIONAL MUSEUM - neoclassical
    // -------------------------------------------------------
    function buildNationalMuseum() {
        var bx = BASE_X - 80;
        var by = 0;
        var bz = 80;

        // Main museum building
        addMesh(new THREE.BoxGeometry(50, 22, 30), 0xDDD0C0, bx, by + 11, bz);
        // Museum roof
        addMesh(new THREE.BoxGeometry(52, 5, 32), 0xC8C0B0, bx, by + 24, bz);

        // Wide front staircase - 3 steps
        addMesh(new THREE.BoxGeometry(40, 2, 8), 0xD0C8B8, bx, by + 1, bz - 19);
        addMesh(new THREE.BoxGeometry(36, 2, 6), 0xD0C8B8, bx, by + 3, bz - 16);
        addMesh(new THREE.BoxGeometry(32, 2, 5), 0xD0C8B8, bx, by + 5, bz - 13);

        // Ionic columns - front portico
        addMesh(new THREE.CylinderGeometry(1.5, 1.8, 18, 8), 0xE8E0D0, bx - 18, by + 15, bz - 10);
        addMesh(new THREE.CylinderGeometry(1.5, 1.8, 18, 8), 0xE8E0D0, bx - 9, by + 15, bz - 10);
        addMesh(new THREE.CylinderGeometry(1.5, 1.8, 18, 8), 0xE8E0D0, bx + 0, by + 15, bz - 10);
        addMesh(new THREE.CylinderGeometry(1.5, 1.8, 18, 8), 0xE8E0D0, bx + 9, by + 15, bz - 10);
        addMesh(new THREE.CylinderGeometry(1.5, 1.8, 18, 8), 0xE8E0D0, bx + 18, by + 15, bz - 10);

        // Portico entablature
        addMesh(new THREE.BoxGeometry(50, 4, 6), 0xDDD0C0, bx, by + 25, bz - 10);
        // Pediment (triangular) represented as thin box
        addMesh(new THREE.BoxGeometry(48, 6, 2), 0xDDD0C0, bx, by + 30, bz - 10);

        // Side wings
        addMesh(new THREE.BoxGeometry(12, 18, 30), 0xDDD0C0, bx - 31, by + 9, bz);
        addMesh(new THREE.BoxGeometry(12, 18, 30), 0xDDD0C0, bx + 31, by + 9, bz);

        // Museum plaza
        addMesh(new THREE.BoxGeometry(70, 1, 50), 0xC8C0B0, bx, by, bz - 10);
    }

    // -------------------------------------------------------
    // METELKOVA - alternative social centre
    // -------------------------------------------------------
    function buildMetelkova() {
        var bx = BASE_X - 200;
        var by = 0;
        var bz = -60;

        // Former barracks main building
        addMesh(new THREE.BoxGeometry(45, 16, 18), 0xCC4422, bx, by + 8, bz);
        addMesh(new THREE.BoxGeometry(47, 3, 20), 0xAA3311, bx, by + 17, bz);

        // Colourful mural building 1
        addMesh(new THREE.BoxGeometry(18, 14, 14), 0xFF6633, bx + 35, by + 7, bz);
        // Mural pattern on facade (different colour blocks)
        addMesh(new THREE.BoxGeometry(16, 6, 1), 0xFFAA00, bx + 35, by + 10, bz - 7);
        addMesh(new THREE.BoxGeometry(7, 5, 1), 0x4422CC, bx + 30, by + 4, bz - 7);
        addMesh(new THREE.BoxGeometry(6, 5, 1), 0x22CC44, bx + 40, by + 4, bz - 7);

        // Colourful mural building 2
        addMesh(new THREE.BoxGeometry(16, 12, 14), 0x4422AA, bx - 38, by + 6, bz + 5);
        addMesh(new THREE.BoxGeometry(14, 4, 1), 0xFFCC00, bx - 38, by + 9, bz - 2);

        // Art installation tower
        addMesh(new THREE.CylinderGeometry(3, 4, 22, 6), 0xFF4422, bx + 10, by + 11, bz + 22);
        addMesh(new THREE.SphereGeometry(4, 6, 6), 0xFFAA00, bx + 10, by + 24, bz + 22);

        // Metelkova gate / arch structure
        addMesh(new THREE.BoxGeometry(4, 12, 6), 0xCC4422, bx - 10, by + 6, bz - 12);
        addMesh(new THREE.BoxGeometry(4, 12, 6), 0xCC4422, bx + 10, by + 6, bz - 12);
        addMesh(new THREE.BoxGeometry(24, 4, 6), 0xAA3311, bx, by + 14, bz - 12);

        // Outdoor stage / amphitheatre
        addMesh(new THREE.CylinderGeometry(15, 18, 3, 10), 0x884422, bx - 5, by + 1, bz + 40);
        addMesh(new THREE.BoxGeometry(8, 10, 4), 0xCC4422, bx - 5, by + 5, bz + 28);

        // Alternative art space small buildings
        addMesh(new THREE.BoxGeometry(10, 8, 10), 0x22AACC, bx - 55, by + 4, bz - 5);
        addMesh(new THREE.BoxGeometry(10, 8, 10), 0xAA22CC, bx - 55, by + 4, bz + 15);
        addMesh(new THREE.ConeGeometry(6, 8, 8), 0xFF4488, bx - 55, by + 12, bz - 5);

        // Street art pillars / sculptures
        addMesh(new THREE.BoxGeometry(2, 16, 2), 0xFFAA22, bx + 22, by + 8, bz - 8);
        addMesh(new THREE.BoxGeometry(2, 16, 2), 0x22AAFF, bx + 30, by + 8, bz - 8);
        addMesh(new THREE.BoxGeometry(8, 2, 2), 0xFF22AA, bx + 26, by + 16, bz - 8);
    }

    // -------------------------------------------------------
    // TIVOLI PARK
    // -------------------------------------------------------
    function buildTivoliPark() {
        var bx = BASE_X - 300;
        var by = 0;
        var bz = 0;

        // Park ground
        addMesh(new THREE.BoxGeometry(120, 1, 120), 0x3D7A32, bx, by, bz);

        // Tivoli Mansion (Jakopičev sprehod)
        addMesh(new THREE.BoxGeometry(30, 16, 20), 0xDDD0B8, bx, by + 8, bz);
        addMesh(new THREE.BoxGeometry(32, 4, 22), 0xC8C0A8, bx, by + 17, bz);

        // Mansion columns
        addMesh(new THREE.CylinderGeometry(1, 1.2, 14, 8), 0xE0D8C8, bx - 10, by + 9, bz - 10);
        addMesh(new THREE.CylinderGeometry(1, 1.2, 14, 8), 0xE0D8C8, bx, by + 9, bz - 10);
        addMesh(new THREE.CylinderGeometry(1, 1.2, 14, 8), 0xE0D8C8, bx + 10, by + 9, bz - 10);

        // Long tree-lined promenade - trees
        addMesh(new THREE.CylinderGeometry(0.8, 1, 16, 6), 0x4A3A2A, bx - 50, by + 8, bz - 30);
        addMesh(new THREE.SphereGeometry(5, 8, 6), 0x2D6A22, bx - 50, by + 20, bz - 30);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 16, 6), 0x4A3A2A, bx - 30, by + 8, bz - 30);
        addMesh(new THREE.SphereGeometry(5, 8, 6), 0x2D6A22, bx - 30, by + 20, bz - 30);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 16, 6), 0x4A3A2A, bx - 10, by + 8, bz - 30);
        addMesh(new THREE.SphereGeometry(5, 8, 6), 0x2D6A22, bx - 10, by + 20, bz - 30);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 16, 6), 0x4A3A2A, bx + 10, by + 8, bz - 30);
        addMesh(new THREE.SphereGeometry(5, 8, 6), 0x2D6A22, bx + 10, by + 20, bz - 30);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 16, 6), 0x4A3A2A, bx + 30, by + 8, bz - 30);
        addMesh(new THREE.SphereGeometry(5, 8, 6), 0x2D6A22, bx + 30, by + 20, bz - 30);

        // Promenade opposite row of trees
        addMesh(new THREE.CylinderGeometry(0.8, 1, 16, 6), 0x4A3A2A, bx - 50, by + 8, bz + 30);
        addMesh(new THREE.SphereGeometry(5, 8, 6), 0x2D6A22, bx - 50, by + 20, bz + 30);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 16, 6), 0x4A3A2A, bx + 20, by + 8, bz + 30);
        addMesh(new THREE.SphereGeometry(5, 8, 6), 0x2D6A22, bx + 20, by + 20, bz + 30);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 16, 6), 0x4A3A2A, bx + 40, by + 8, bz + 30);
        addMesh(new THREE.SphereGeometry(5, 8, 6), 0x2D6A22, bx + 40, by + 20, bz + 30);

        // Promenade path paving
        addMesh(new THREE.BoxGeometry(100, 1, 10), 0xC0B8A0, bx, by + 0.5, bz - 30);

        // Tivoli pond
        addMesh(new THREE.CylinderGeometry(18, 18, 1, 10), 0x2A6A8A, bx + 40, by, bz + 50);
        // Pond bank
        addMesh(new THREE.CylinderGeometry(20, 20, 1, 10), 0x5A8A50, bx + 40, by - 0.5, bz + 50);

        // Benches near pond
        addMesh(new THREE.BoxGeometry(4, 2, 1), 0x8B6040, bx + 22, by + 1, bz + 48);
        addMesh(new THREE.BoxGeometry(4, 2, 1), 0x8B6040, bx + 58, by + 1, bz + 52);
    }

    // -------------------------------------------------------
    // PRESERN SQUARE
    // -------------------------------------------------------
    function buildPresernSquare() {
        var bx = BASE_X + 110;
        var by = 0;
        var bz = -50;

        // Square paving
        addMesh(new THREE.BoxGeometry(60, 1, 50), 0xC8C0A8, bx, by, bz);

        // Franciscan Church of the Annunciation - pink/red baroque
        addMesh(new THREE.BoxGeometry(28, 24, 20), 0xCC5566, bx, by + 12, bz - 18);
        // Church roof
        addMesh(new THREE.BoxGeometry(30, 5, 22), 0xAA3344, bx, by + 26, bz - 18);
        // Church twin towers
        addMesh(new THREE.BoxGeometry(7, 36, 7), 0xCC5566, bx - 14, by + 28, bz - 18);
        addMesh(new THREE.BoxGeometry(7, 36, 7), 0xCC5566, bx + 14, by + 28, bz - 18);
        addMesh(new THREE.ConeGeometry(5, 12, 4), 0x884455, bx - 14, by + 52, bz - 18);
        addMesh(new THREE.ConeGeometry(5, 12, 4), 0x884455, bx + 14, by + 52, bz - 18);
        // Church rose window representation
        addMesh(new THREE.CylinderGeometry(3, 3, 1, 8), 0xFFEECC, bx, by + 22, bz - 28);
        // Church front steps
        addMesh(new THREE.BoxGeometry(26, 2, 6), 0xDD9999, bx, by + 1, bz - 8);

        // Preseren monument - poet statue
        addMesh(new THREE.CylinderGeometry(3, 4, 2, 8), 0xC8C0A8, bx - 10, by + 1, bz);
        addMesh(new THREE.BoxGeometry(2, 5, 2), 0xD4C8A0, bx - 10, by + 5, bz);
        addMesh(new THREE.SphereGeometry(2, 8, 8), 0xC8C0A0, bx - 10, by + 9, bz);

        // Buildings around square
        addMesh(new THREE.BoxGeometry(22, 20, 14), 0xDDB870, bx + 28, by + 10, bz - 5);
        addMesh(new THREE.BoxGeometry(24, 3, 16), 0xBB9650, bx + 28, by + 21, bz - 5);
        addMesh(new THREE.BoxGeometry(18, 18, 14), 0xEECC88, bx - 28, by + 9, bz - 10);
        addMesh(new THREE.BoxGeometry(20, 3, 16), 0xCCAA66, bx - 28, by + 18, bz - 10);

        // Junction with Triple Bridge approach
        addMesh(new THREE.BoxGeometry(20, 1, 16), 0xC0B8A0, bx + 20, by, bz + 20);
    }

    // -------------------------------------------------------
    // CONGRESS SQUARE
    // -------------------------------------------------------
    function buildCongressSquare() {
        var bx = BASE_X + 50;
        var by = 0;
        var bz = -120;

        // Square paving
        addMesh(new THREE.BoxGeometry(80, 1, 60), 0xC8C8B0, bx, by, bz);

        // Philharmonic Hall - neoclassical
        addMesh(new THREE.BoxGeometry(40, 18, 24), 0xDDD0C0, bx - 20, by + 9, bz - 18);
        addMesh(new THREE.BoxGeometry(42, 4, 26), 0xC8C0B0, bx - 20, by + 19, bz - 18);
        // Philharmonic columns
        addMesh(new THREE.CylinderGeometry(1.2, 1.4, 16, 8), 0xE0D8C8, bx - 34, by + 11, bz - 6);
        addMesh(new THREE.CylinderGeometry(1.2, 1.4, 16, 8), 0xE0D8C8, bx - 26, by + 11, bz - 6);
        addMesh(new THREE.CylinderGeometry(1.2, 1.4, 16, 8), 0xE0D8C8, bx - 18, by + 11, bz - 6);
        addMesh(new THREE.CylinderGeometry(1.2, 1.4, 16, 8), 0xE0D8C8, bx - 10, by + 11, bz - 6);
        addMesh(new THREE.CylinderGeometry(1.2, 1.4, 16, 8), 0xE0D8C8, bx - 2, by + 11, bz - 6);

        // National Gallery building
        addMesh(new THREE.BoxGeometry(36, 16, 22), 0xDDD0C0, bx + 30, by + 8, bz - 15);
        addMesh(new THREE.BoxGeometry(38, 4, 24), 0xC8C0B0, bx + 30, by + 17, bz - 15);
        // Gallery columns
        addMesh(new THREE.CylinderGeometry(1, 1.2, 14, 8), 0xE0D8C8, bx + 18, by + 9, bz - 4);
        addMesh(new THREE.CylinderGeometry(1, 1.2, 14, 8), 0xE0D8C8, bx + 27, by + 9, bz - 4);
        addMesh(new THREE.CylinderGeometry(1, 1.2, 14, 8), 0xE0D8C8, bx + 36, by + 9, bz - 4);
        addMesh(new THREE.CylinderGeometry(1, 1.2, 14, 8), 0xE0D8C8, bx + 45, by + 9, bz - 4);

        // Congress Square fountain
        addMesh(new THREE.CylinderGeometry(5, 6, 2, 8), 0xC0B8A8, bx, by + 1, bz + 5);
        addMesh(new THREE.CylinderGeometry(1.5, 1.5, 10, 8), 0xD0C8B8, bx, by + 6, bz + 5);
        addMesh(new THREE.SphereGeometry(2.5, 8, 8), 0xD0C8B8, bx, by + 13, bz + 5);
        addMesh(new THREE.CylinderGeometry(4, 4, 1, 8), 0x2A6A8A, bx, by + 0.5, bz + 5);

        // Congress Square trees (formal planting)
        addMesh(new THREE.CylinderGeometry(0.7, 0.9, 14, 6), 0x4A3A2A, bx - 30, by + 7, bz + 10);
        addMesh(new THREE.SphereGeometry(4, 8, 6), 0x3D7A32, bx - 30, by + 18, bz + 10);
        addMesh(new THREE.CylinderGeometry(0.7, 0.9, 14, 6), 0x4A3A2A, bx + 30, by + 7, bz + 10);
        addMesh(new THREE.SphereGeometry(4, 8, 6), 0x3D7A32, bx + 30, by + 18, bz + 10);
        addMesh(new THREE.CylinderGeometry(0.7, 0.9, 14, 6), 0x4A3A2A, bx - 30, by + 7, bz - 10);
        addMesh(new THREE.SphereGeometry(4, 8, 6), 0x3D7A32, bx - 30, by + 18, bz - 10);
        addMesh(new THREE.CylinderGeometry(0.7, 0.9, 14, 6), 0x4A3A2A, bx + 30, by + 7, bz - 10);
        addMesh(new THREE.SphereGeometry(4, 8, 6), 0x3D7A32, bx + 30, by + 18, bz - 10);

        // Formal garden path
        addMesh(new THREE.BoxGeometry(80, 1, 8), 0xBCB8A8, bx, by + 0.5, bz - 40);
        addMesh(new THREE.BoxGeometry(8, 1, 50), 0xBCB8A8, bx, by + 0.5, bz - 20);
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
