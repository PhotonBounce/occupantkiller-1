window.AthaloneCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 18440;
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

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function box(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function cyl(rt, rb, h, color, x, y, z, segs) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 12);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function sph(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 12, 8);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function cone(r, h, color, x, y, z, segs) {
        var geo = new THREE.ConeGeometry(r, h, segs || 8);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildRiverShannon();
        buildLoughRee();
        buildAthaloneCastle();
        buildRailwayBridge();
        buildRoadBridge();
        buildCathedral();
        buildLeftBank();
        buildRightBank();
        buildMarina();
        buildCruiserFleet();
    }

    function buildGround() {
        // Ground — split into two halves since PlaneGeometry is forbidden, use thin boxes
        // West bank ground
        box(120, 1, 160, 0x4A7C3F, -60, -0.5, 0);
        // East bank ground
        box(120, 1, 160, 0x5A8A4A, 60, -0.5, 0);
    }

    function buildRiverShannon() {
        // Wide river through center — Ireland's longest river
        // Main river body (shallow box slab for water surface)
        box(30, 0.5, 160, 0x006994, 0, 0.1, 0);
        // River edge — west shore dark strip
        box(4, 0.6, 160, 0x004F6E, -17, 0.2, 0);
        // River edge — east shore dark strip
        box(4, 0.6, 160, 0x004F6E, 17, 0.2, 0);
        // River highlights — current ripple strips
        box(2, 0.7, 60, 0x1A7FAA, -4, 0.3, -20);
        box(2, 0.7, 60, 0x1A7FAA, 4, 0.3, 10);
        box(2, 0.7, 40, 0x1A7FAA, 0, 0.3, -40);
    }

    function buildLoughRee() {
        // Large lake expansion to the north — Lough Ree
        box(80, 0.5, 60, 0x006994, 0, 0.1, -90);
        // Lake shoreline details
        box(6, 0.6, 60, 0x004F6E, -43, 0.2, -90);
        box(6, 0.6, 60, 0x004F6E, 43, 0.2, -90);
        box(80, 0.6, 6, 0x004F6E, 0, 0.2, -123);
        // Small island in lake
        box(8, 1.5, 6, 0x4A7C3F, 12, 0.8, -100);
        box(3, 3, 3, 0x3A6A2F, 12, 2.5, -100);
    }

    function buildAthaloneCastle() {
        // Athlone Castle — Norman stronghold, west bank, overlooking river

        // Main circular keep — massive
        cyl(5, 5.5, 15, 0x8B7355, -22, 7.5, -8, 16);
        // Keep crenellations — top row of merlons
        cyl(5.2, 5.2, 1.5, 0x7A6345, -22, 16, -8, 16);
        // Keep roof cone
        cone(5.4, 3, 0x6B5535, -22, 17.5, -8, 16);

        // Curtain wall — south section
        box(18, 6, 1.5, 0x8B7355, -13, 3, -3.5);
        // Curtain wall — north section
        box(18, 6, 1.5, 0x8B7355, -13, 3, -12.5);
        // Curtain wall — west section
        box(1.5, 6, 9, 0x8B7355, -22, 3, -8);
        // Curtain wall crenellations top
        box(18, 1.5, 2, 0x7A6345, -13, 6.75, -3.5);
        box(18, 1.5, 2, 0x7A6345, -13, 6.75, -12.5);

        // NE corner tower
        cyl(2.5, 2.8, 10, 0x8B7355, -4.5, 5, -3.5, 10);
        cone(2.6, 3, 0x6B5535, -4.5, 11.5, -3.5, 10);
        // NW corner tower
        cyl(2.5, 2.8, 10, 0x8B7355, -21.5, 5, -3.5, 10);
        cone(2.6, 3, 0x6B5535, -21.5, 11.5, -3.5, 10);
        // SE corner tower
        cyl(2.5, 2.8, 10, 0x8B7355, -4.5, 5, -12.5, 10);
        cone(2.6, 3, 0x6B5535, -4.5, 11.5, -12.5, 10);
        // SW corner tower
        cyl(2.5, 2.8, 10, 0x8B7355, -21.5, 5, -12.5, 10);
        cone(2.6, 3, 0x6B5535, -21.5, 11.5, -12.5, 10);

        // Gatehouse — main entrance east face
        box(5, 8, 3, 0x7A6345, -4, 4, -8);
        // Gatehouse arch void (darker box representing archway)
        box(2, 3, 4, 0x4A3A25, -4, 2, -8);
        // Gatehouse flanking towers
        cyl(1.5, 1.7, 9, 0x8B7355, -1.8, 4.5, -8, 8);
        cyl(1.5, 1.7, 9, 0x8B7355, -6.2, 4.5, -8, 8);
        cone(1.6, 2.5, 0x6B5535, -1.8, 10.25, -8, 8);
        cone(1.6, 2.5, 0x6B5535, -6.2, 10.25, -8, 8);

        // Bawn / outer ward ground
        box(20, 0.3, 12, 0x9E8B6A, -13, 0.15, -8);

        // Museum building added to castle (modern extension)
        box(8, 5, 6, 0x8B7355, -13, 2.5, -8);
    }

    function buildRailwayBridge() {
        // Athlone railway bridge — steel girder bridge, crosses Shannon

        // Main deck / girder top rail
        box(30, 1.5, 3, 0x5A5A5A, 0, 5, 6);
        // Lower deck beam
        box(30, 1, 3, 0x4A4A4A, 0, 3.2, 6);
        // Side girder trusses — vertical members (simulated as boxes)
        box(0.8, 4, 3, 0x5A5A5A, -12, 4.2, 6);
        box(0.8, 4, 3, 0x5A5A5A, -6, 4.2, 6);
        box(0.8, 4, 3, 0x5A5A5A, 0, 4.2, 6);
        box(0.8, 4, 3, 0x5A5A5A, 6, 4.2, 6);
        box(0.8, 4, 3, 0x5A5A5A, 12, 4.2, 6);

        // Bridge piers in river
        cyl(1.2, 1.5, 5, 0x6A6A6A, -8, 2.5, 6, 8);
        cyl(1.2, 1.5, 5, 0x6A6A6A, 0, 2.5, 6, 8);
        cyl(1.2, 1.5, 5, 0x6A6A6A, 8, 2.5, 6, 8);

        // Rail tracks on bridge
        box(30, 0.2, 0.3, 0x3A3A3A, 0, 5.85, 5.4);
        box(30, 0.2, 0.3, 0x3A3A3A, 0, 5.85, 6.6);

        // Approach embankments
        box(12, 2, 3, 0x7A6A5A, -21, 1, 6);
        box(12, 2, 3, 0x7A6A5A, 21, 1, 6);
    }

    function buildRoadBridge() {
        // Athlone road bridge — stone arched bridge, 0x808080

        // Bridge deck
        box(32, 1, 7, 0x808080, 0, 3.5, -2);
        // Bridge parapet walls
        box(32, 1.5, 0.5, 0x707070, 0, 4.5, 1.2);
        box(32, 1.5, 0.5, 0x707070, 0, 4.5, -5.2);

        // Stone arch piers (simulate arches with vertical box piers + horizontal arch beams)
        // Pier 1
        box(2, 6, 6, 0x808080, -10, 3, -2);
        // Pier 2
        box(2, 6, 6, 0x808080, 0, 3, -2);
        // Pier 3
        box(2, 6, 6, 0x808080, 10, 3, -2);

        // Arch spans (flattened boxes between piers)
        box(10, 0.8, 6, 0x757575, -5, 3, -2);
        box(10, 0.8, 6, 0x757575, 5, 3, -2);
        box(10, 0.8, 6, 0x757575, -15, 3, -2);
        box(10, 0.8, 6, 0x757575, 15, 3, -2);

        // Keystones (decorative box on top of arches)
        box(1.5, 1, 7, 0x696969, -5, 3.9, -2);
        box(1.5, 1, 7, 0x696969, 5, 3.9, -2);

        // Approach road surface
        box(16, 0.5, 7, 0x909090, -24, 3.25, -2);
        box(16, 0.5, 7, 0x909090, 24, 3.25, -2);
    }

    function buildCathedral() {
        // St Peter & Paul's Cathedral — Baroque twin-domed, east bank

        // Main nave body
        box(16, 12, 30, 0xC0C0C0, 22, 6, -5);
        // Nave clerestory
        box(10, 4, 28, 0xD0D0D0, 22, 14, -5);
        // Transept arms
        box(30, 10, 8, 0xC0C0C0, 22, 5, -5);

        // West facade / main front
        box(18, 16, 2, 0xB8B8B8, 11, 8, -5);
        // Facade decorative strips
        box(2, 16, 1, 0xA8A8A8, 8, 8, -5);
        box(2, 16, 1, 0xA8A8A8, 14, 8, -5);

        // Twin bell towers on facade
        // Left tower drum
        cyl(2.5, 3, 14, 0xC0C0C0, 8, 12, -5, 8);
        // Right tower drum
        cyl(2.5, 3, 14, 0xC0C0C0, 14, 12, -5, 8);
        // Left dome
        sph(3.2, 0xD8D8D8, 8, 20, -5);
        // Right dome
        sph(3.2, 0xD8D8D8, 14, 20, -5);
        // Left lantern
        cyl(0.8, 0.8, 2, 0xC8C8C8, 8, 23.6, -5, 8);
        // Right lantern
        cyl(0.8, 0.8, 2, 0xC8C8C8, 14, 23.6, -5, 8);
        // Left cross finial
        box(0.3, 2.5, 0.3, 0x8A8A8A, 8, 25.25, -5);
        // Right cross finial
        box(0.3, 2.5, 0.3, 0x8A8A8A, 14, 25.25, -5);
        // Cross horizontal bars
        box(1.5, 0.3, 0.3, 0x8A8A8A, 8, 25.5, -5);
        box(1.5, 0.3, 0.3, 0x8A8A8A, 14, 25.5, -5);

        // Central crossing dome over nave
        cyl(3, 3.5, 5, 0xC0C0C0, 22, 18.5, -5, 12);
        sph(3.5, 0xD0D0D0, 22, 22, -5);
        cyl(0.8, 0.8, 2, 0xC8C8C8, 22, 25.5, -5, 8);

        // Steps / portico
        box(20, 0.8, 5, 0xB0B0B0, 11, 0.4, -7.5);
        box(18, 0.8, 4, 0xA8A8A8, 11, 1.2, -7);
        box(16, 0.8, 3, 0xA0A0A0, 11, 2.0, -6.5);

        // Presbytery apse at east end
        cyl(5, 5, 12, 0xC0C0C0, 34, 6, -5, 10);
        cone(5.2, 3, 0xB0B0B0, 34, 13.5, -5, 10);
    }

    function buildLeftBank() {
        // Left / west bank — medieval old town

        // Sean's Bar — Ireland's oldest pub — ancient structure
        box(6, 4, 5, 0x8B4513, -30, 2, -5);
        box(6, 0.8, 5, 0x6B3410, -30, 4.4, -5);
        // Pub sign beam
        box(3, 0.4, 0.2, 0x5A3010, -30, 5.2, -7.6);
        // Pub chimney
        box(1, 3, 1, 0x7A3A10, -29, 6.5, -6);

        // Old town buildings — narrow medieval street along river
        box(5, 6, 4, 0xCD5C5C, -32, 3, 5);
        box(5, 5, 4, 0xB04040, -38, 2.5, 5);
        box(5, 7, 4, 0xC05050, -44, 3.5, 5);
        box(5, 5, 4, 0xCD5C5C, -50, 2.5, 5);

        // Medieval street row — north side
        box(5, 5, 4, 0xB85050, -32, 2.5, 14);
        box(6, 6, 4, 0xC04545, -38, 3, 14);
        box(5, 5, 4, 0xB04040, -44, 2.5, 14);

        // Roof gables — south row
        cone(3.5, 3, 0x8B3030, -32, 7.5, 5, 4);
        cone(3.5, 2.5, 0x7B2525, -38, 7.75, 5, 4);
        cone(3.5, 3, 0x8B3030, -44, 8.5, 5, 4);
        cone(3.5, 2.5, 0x8B3030, -50, 7.25, 5, 4);

        // Roof gables — north row
        cone(3.5, 2.5, 0x8B3030, -32, 7.25, 14, 4);
        cone(3.5, 3, 0x7B2525, -38, 7, 14, 4);
        cone(3.5, 2.5, 0x8B3030, -44, 7.25, 14, 4);

        // Narrow medieval lane (cobble surface box)
        box(4, 0.2, 30, 0x8A7A6A, -35, 0.1, 7);

        // Old town wall remnant
        box(20, 3, 1, 0x9E8B6A, -45, 1.5, -18);
        box(1.5, 5, 8, 0x9E8B6A, -36, 2.5, -18);

        // Athlone Castle visitor center / approach path
        box(14, 0.2, 4, 0x9A8A7A, -18, 0.1, -5);
    }

    function buildRightBank() {
        // Right / east bank — modern town, shopping streets

        // Main shopping street buildings
        box(8, 8, 5, 0xF5F5F5, 35, 4, -2);
        box(8, 7, 5, 0xEEEEEE, 44, 3.5, -2);
        box(8, 9, 5, 0xF0F0F0, 53, 4.5, -2);
        box(7, 6, 5, 0xE8E8E8, 61, 3, -2);

        // Shopping street far row
        box(8, 7, 5, 0xF5F5F5, 35, 3.5, 8);
        box(8, 8, 5, 0xEEEEEE, 44, 4, 8);
        box(8, 6, 5, 0xF2F2F2, 53, 3, 8);

        // Flat roofs (modern commercial)
        box(8, 0.5, 5, 0xD0D0D0, 35, 8.25, -2);
        box(8, 0.5, 5, 0xD0D0D0, 44, 7.75, -2);
        box(8, 0.5, 5, 0xD0D0D0, 53, 9.25, -2);
        box(7, 0.5, 5, 0xD0D0D0, 61, 6.25, -2);

        // Pedestrian street surface
        box(40, 0.2, 5, 0xC8C8C0, 49, 0.1, 3);

        // Town car park multi-storey
        box(15, 12, 12, 0xDCDCDC, 55, 6, -20);
        box(15, 0.4, 12, 0xC0C0C0, 55, 12.2, -20);

        // Supermarket / larger retail unit
        box(20, 6, 14, 0xF0F0F0, 38, 3, -22);
        box(20, 0.5, 14, 0xD8D8D8, 38, 6.25, -22);

        // Residential terrace — east side
        box(5, 7, 4, 0xF5F5DC, 45, 3.5, 25);
        box(5, 7, 4, 0xFAF0E6, 51, 3.5, 25);
        box(5, 7, 4, 0xF5F5DC, 57, 3.5, 25);
        cone(3.5, 3, 0xCC4444, 45, 8.5, 25, 4);
        cone(3.5, 3, 0xCC4444, 51, 8.5, 25, 4);
        cone(3.5, 3, 0xCC4444, 57, 8.5, 25, 4);

        // Road surface east bank
        box(8, 0.2, 60, 0xA0A0A0, 22, 0.1, 10);
    }

    function buildMarina() {
        // Marina — south of bridges on east bank, pleasure boats

        // Main jetty deck
        box(24, 0.5, 5, 0x8B6914, 10, 0.4, 30);
        // Jetty planks detail
        box(24, 0.3, 0.4, 0x7A5A10, 10, 0.7, 28.2);
        box(24, 0.3, 0.4, 0x7A5A10, 10, 0.7, 29.2);
        box(24, 0.3, 0.4, 0x7A5A10, 10, 0.7, 30.2);
        box(24, 0.3, 0.4, 0x7A5A10, 10, 0.7, 31.2);
        box(24, 0.3, 0.4, 0x7A5A10, 10, 0.7, 32.2);

        // Side jetty arm
        box(5, 0.5, 12, 0x8B6914, 21, 0.4, 38);

        // Mooring posts — CylinderGeometry
        cyl(0.2, 0.2, 2, 0x5A4A20, -2, 1.2, 28, 6);
        cyl(0.2, 0.2, 2, 0x5A4A20, 4, 1.2, 28, 6);
        cyl(0.2, 0.2, 2, 0x5A4A20, 10, 1.2, 28, 6);
        cyl(0.2, 0.2, 2, 0x5A4A20, 16, 1.2, 28, 6);
        cyl(0.2, 0.2, 2, 0x5A4A20, 22, 1.2, 28, 6);
        cyl(0.2, 0.2, 2, 0x5A4A20, -2, 1.2, 32, 6);
        cyl(0.2, 0.2, 2, 0x5A4A20, 4, 1.2, 32, 6);
        cyl(0.2, 0.2, 2, 0x5A4A20, 10, 1.2, 32, 6);
        cyl(0.2, 0.2, 2, 0x5A4A20, 16, 1.2, 32, 6);
        cyl(0.2, 0.2, 2, 0x5A4A20, 22, 1.2, 32, 6);

        // Small pleasure boat 1
        box(5, 1, 2, 0xFFFFFF, 0, 1, 30);
        box(3, 1.2, 1.8, 0xE0E0E0, -0.5, 2.1, 30);
        // Small pleasure boat 2
        box(5, 1, 2, 0xFF4444, 7, 1, 30);
        box(3, 1.2, 1.8, 0xCC3333, 6.5, 2.1, 30);
        // Small pleasure boat 3
        box(5, 1, 2, 0x4444FF, 14, 1, 30);
        box(3, 1.2, 1.8, 0x3333CC, 13.5, 2.1, 30);

        // Harbour master office
        box(5, 4, 4, 0xCDAA7D, 25, 2, 28);
        cone(3, 2, 0x8B5A2B, 25, 5, 28, 4);
    }

    function buildCruiserFleet() {
        // Cruiser hire fleet — cluster of river cruisers, white hulls with box cabins

        // Cruiser 1
        box(10, 1.2, 3, 0xF5F5F5, -6, 1, 45);
        box(7, 1.5, 2.8, 0xEEEEEE, -6, 2.75, 45);
        box(6, 0.3, 2.6, 0xDDDDDD, -6, 3.65, 45);
        // Cruiser 1 mast
        cyl(0.1, 0.1, 3, 0xAAAAAA, -2, 4.5, 45, 4);

        // Cruiser 2
        box(10, 1.2, 3, 0xF5F5F5, -6, 1, 52);
        box(7, 1.5, 2.8, 0xEEEEEE, -6, 2.75, 52);
        box(6, 0.3, 2.6, 0xDDDDDD, -6, 3.65, 52);
        cyl(0.1, 0.1, 3, 0xAAAAAA, -2, 4.5, 52, 4);

        // Cruiser 3
        box(10, 1.2, 3, 0xF5F5F5, 6, 1, 45);
        box(7, 1.5, 2.8, 0xEEEEEE, 6, 2.75, 45);
        box(6, 0.3, 2.6, 0xDDDDDD, 6, 3.65, 45);
        cyl(0.1, 0.1, 3, 0xAAAAAA, 10, 4.5, 45, 4);

        // Cruiser 4 — larger hire cruiser
        box(14, 1.5, 4, 0xF5F5F5, 6, 1.1, 52);
        box(10, 2, 3.6, 0xEEEEEE, 5, 3.1, 52);
        box(8, 0.3, 3.4, 0xDDDDDD, 5, 4.25, 52);
        cyl(0.15, 0.15, 4, 0xAAAAAA, 11, 5, 52, 4);

        // Cruiser hire office / depot building
        box(8, 4, 6, 0x6B8E6B, -12, 2, 50);
        box(8, 0.5, 6, 0x5A7A5A, -12, 4.25, 50);
        // Company sign board
        box(6, 1.5, 0.2, 0x2A5A2A, -12, 5.75, 47.1);

        // Fuel jetty
        box(4, 0.4, 8, 0x8B6914, -18, 0.3, 50);
        cyl(0.3, 0.3, 3, 0xAA2222, -18, 1.7, 48, 6);
    }

    function update(delta) {
        // Static scene — no per-frame animation needed
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
