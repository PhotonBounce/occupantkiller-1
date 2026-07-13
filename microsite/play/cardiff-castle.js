window.CardiffCastle = (function() {
    'use strict';

    var WX = 3280;
    var WZ = 2200;

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        return mesh;
    }

    function makeWireBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var line = new THREE.LineSegments(edges, mat);
        line.position.set(WX + x, y, WZ + z);
        return line;
    }

    function buildCastleWalls(scene) {
        // Main castle keep - Norman stone box
        scene.add(makeBox(20, 14, 16, 0x9A8A78, 0, 7, 0));

        // Castle battlements on top
        scene.add(makeBox(22, 2, 2, 0x9A8A78, 0, 15, -8));
        scene.add(makeBox(22, 2, 2, 0x9A8A78, 0, 15, 8));
        scene.add(makeBox(2, 2, 16, 0x9A8A78, -10, 15, 0));
        scene.add(makeBox(2, 2, 16, 0x9A8A78, 10, 15, 0));

        // Corner towers
        scene.add(makeCylinder(2, 2.5, 12, 8, 0x8A7A68, -10, 6, -8));
        scene.add(makeCylinder(2, 2.5, 12, 8, 0x8A7A68, 10, 6, -8));
        scene.add(makeCylinder(2, 2.5, 12, 8, 0x8A7A68, -10, 6, 8));
        scene.add(makeCylinder(2, 2.5, 12, 8, 0x8A7A68, 10, 6, 8));

        // Corner tower cone tops
        scene.add(makeCone(2.2, 4, 8, 0x7A6A58, -10, 13, -8));
        scene.add(makeCone(2.2, 4, 8, 0x7A6A58, 10, 13, -8));
        scene.add(makeCone(2.2, 4, 8, 0x7A6A58, -10, 13, 8));
        scene.add(makeCone(2.2, 4, 8, 0x7A6A58, 10, 13, 8));
    }

    function buildMotte(scene) {
        // Motte hill - earthen mound
        scene.add(makeCylinder(8, 14, 6, 12, 0x5A6A3A, 0, 3, 0));

        // Shell keep on top of motte
        scene.add(makeCylinder(6, 6, 8, 10, 0x9A8A78, 0, 11, 0));

        // Shell keep battlements ring
        scene.add(makeCylinder(6.5, 6.5, 1.5, 10, 0x8A7A68, 0, 15.5, 0));
    }

    function buildVictorianClockTower(scene) {
        // Main tower shaft
        scene.add(makeBox(4, 22, 4, 0xD4A97A, -12, 11, -4));

        // Clock face boxes (four sides)
        scene.add(makeBox(3.5, 3, 0.5, 0xC0B070, -12, 20, -5.8));
        scene.add(makeBox(3.5, 3, 0.5, 0xC0B070, -12, 20, -2.2));
        scene.add(makeBox(0.5, 3, 3.5, 0xC0B070, -14.2, 20, -4));
        scene.add(makeBox(0.5, 3, 3.5, 0xC0B070, -9.8, 20, -4));

        // Ornate belfry section
        scene.add(makeBox(5, 3, 5, 0xC8A068, -12, 23.5, -4));

        // Ornate cone top spire
        scene.add(makeCone(3, 8, 8, 0xB89058, -12, 29, -4));

        // Tower battlements
        scene.add(makeBox(5.5, 1.5, 1, 0xD4A97A, -12, 22.5, -7));
        scene.add(makeBox(5.5, 1.5, 1, 0xD4A97A, -12, 22.5, -1));
        scene.add(makeBox(1, 1.5, 5, 0xD4A97A, -15, 22.5, -4));
        scene.add(makeBox(1, 1.5, 5, 0xD4A97A, -9, 22.5, -4));
    }

    function buildWelshDragon(scene) {
        // Dragon body on tower battlements
        scene.add(makeBox(3, 1.5, 1.5, 0xCC0000, -12, 34, -4));

        // Dragon head
        scene.add(makeBox(1.2, 1, 1.2, 0xCC0000, -13.5, 34.5, -4));

        // Dragon neck
        scene.add(makeBox(0.8, 1.2, 0.8, 0xCC0000, -13, 34, -4));

        // Dragon wings - left
        scene.add(makeBox(2.5, 0.3, 2, 0xAA0000, -11, 35, -5.5));
        scene.add(makeBox(2, 0.3, 1.5, 0xAA0000, -9.5, 35.4, -6.5));

        // Dragon wings - right
        scene.add(makeBox(2.5, 0.3, 2, 0xAA0000, -11, 35, -2.5));
        scene.add(makeBox(2, 0.3, 1.5, 0xAA0000, -9.5, 35.4, -1.5));

        // Dragon tail
        scene.add(makeBox(2, 0.8, 0.8, 0xCC0000, -10, 33.5, -4));
        scene.add(makeBox(1.2, 0.5, 0.5, 0xBB0000, -8.5, 33, -4));

        // Dragon legs
        scene.add(makeBox(0.5, 1.2, 0.5, 0xCC0000, -12.5, 32.8, -4.5));
        scene.add(makeBox(0.5, 1.2, 0.5, 0xCC0000, -11.5, 32.8, -4.5));
        scene.add(makeBox(0.5, 1.2, 0.5, 0xCC0000, -12.5, 32.8, -3.5));
        scene.add(makeBox(0.5, 1.2, 0.5, 0xCC0000, -11.5, 32.8, -3.5));
    }

    function buildPrincipalityStadium(scene) {
        // Four main stands of the stadium
        // North stand
        scene.add(makeBox(60, 14, 10, 0x888888, 60, 7, -30));
        // South stand
        scene.add(makeBox(60, 14, 10, 0x888888, 60, 7, 30));
        // East stand
        scene.add(makeBox(10, 14, 60, 0x888888, 90, 7, 0));
        // West stand
        scene.add(makeBox(10, 14, 60, 0x888888, 30, 7, 0));

        // Retractable roof sections - steel
        scene.add(makeBox(60, 3, 50, 0x4A4A6A, 60, 17, -5));
        scene.add(makeBox(60, 3, 50, 0x4A4A6A, 60, 17, 5));

        // Roof support pylons
        scene.add(makeCylinder(1.2, 1.5, 22, 6, 0x5A5A7A, 30, 11, -25));
        scene.add(makeCylinder(1.2, 1.5, 22, 6, 0x5A5A7A, 90, 11, -25));
        scene.add(makeCylinder(1.2, 1.5, 22, 6, 0x5A5A7A, 30, 11, 25));
        scene.add(makeCylinder(1.2, 1.5, 22, 6, 0x5A5A7A, 90, 11, 25));

        // Stadium floodlight towers
        scene.add(makeBox(1, 28, 1, 0xAAAAAA, 28, 14, -32));
        scene.add(makeBox(1, 28, 1, 0xAAAAAA, 92, 14, -32));
        scene.add(makeBox(1, 28, 1, 0xAAAAAA, 28, 14, 32));
        scene.add(makeBox(1, 28, 1, 0xAAAAAA, 92, 14, 32));

        // Floodlight heads
        scene.add(makeBox(4, 1, 4, 0xEEEEAA, 28, 28.5, -32));
        scene.add(makeBox(4, 1, 4, 0xEEEEAA, 92, 28.5, -32));
        scene.add(makeBox(4, 1, 4, 0xEEEEAA, 28, 28.5, 32));
        scene.add(makeBox(4, 1, 4, 0xEEEEAA, 92, 28.5, 32));

        // Pitch (green)
        scene.add(makeBox(56, 0.3, 56, 0x2A8A2A, 60, 0.15, 0));

        // Stadium wireframe outline
        scene.add(makeWireBox(62, 15, 62, 0x666666, 60, 7.5, 0));
    }

    function buildRiverTaff(scene) {
        // River Taff - series of water-coloured boxes
        scene.add(makeBox(8, 0.5, 120, 0x2A5A8A, 110, 0.25, 0));
        scene.add(makeBox(8, 0.5, 60, 0x2A5A8A, 112, 0.25, -60));
        scene.add(makeBox(8, 0.5, 60, 0x2A5A8A, 115, 0.25, 60));

        // River bank
        scene.add(makeBox(4, 1, 120, 0x5A6A3A, 106, 0.5, 0));
        scene.add(makeBox(4, 1, 120, 0x5A6A3A, 118, 0.5, 0));
    }

    function buildButePark(scene) {
        // Bute Park - green ground areas
        scene.add(makeBox(40, 0.5, 60, 0x3A7A2A, -20, 0.25, -30));
        scene.add(makeBox(30, 0.5, 40, 0x3A7A2A, 15, 0.25, -50));
        scene.add(makeBox(25, 0.5, 35, 0x3A7A2A, -25, 0.25, 30));

        // Tree clusters - trunks
        scene.add(makeCylinder(0.4, 0.5, 5, 5, 0x5A3A1A, -15, 2.5, -20));
        scene.add(makeCylinder(0.4, 0.5, 5, 5, 0x5A3A1A, -20, 2.5, -28));
        scene.add(makeCylinder(0.4, 0.5, 5, 5, 0x5A3A1A, -10, 2.5, -35));
        scene.add(makeCylinder(0.4, 0.5, 5, 5, 0x5A3A1A, -25, 2.5, -15));
        scene.add(makeCylinder(0.4, 0.5, 5, 5, 0x5A3A1A, -30, 2.5, -40));
        scene.add(makeCylinder(0.4, 0.5, 5, 5, 0x5A3A1A, 10, 2.5, -45));
        scene.add(makeCylinder(0.4, 0.5, 5, 5, 0x5A3A1A, 5, 2.5, -55));
        scene.add(makeCylinder(0.4, 0.5, 5, 5, 0x5A3A1A, -20, 2.5, 35));
        scene.add(makeCylinder(0.4, 0.5, 5, 5, 0x5A3A1A, -28, 2.5, 42));

        // Tree clusters - canopies (spheres)
        scene.add(makeSphere(3, 6, 5, 0x2A6A1A, -15, 7, -20));
        scene.add(makeSphere(3.5, 6, 5, 0x2A6A1A, -20, 7.5, -28));
        scene.add(makeSphere(2.8, 6, 5, 0x2A6A1A, -10, 7, -35));
        scene.add(makeSphere(3, 6, 5, 0x2A6A1A, -25, 7, -15));
        scene.add(makeSphere(3.2, 6, 5, 0x2A6A1A, -30, 7.5, -40));
        scene.add(makeSphere(2.5, 6, 5, 0x2A6A1A, 10, 6.5, -45));
        scene.add(makeSphere(3, 6, 5, 0x2A6A1A, 5, 7, -55));
        scene.add(makeSphere(3.5, 6, 5, 0x2A6A1A, -20, 7.5, 35));
        scene.add(makeSphere(3, 6, 5, 0x2A6A1A, -28, 7, 42));

        // Park path
        scene.add(makeBox(3, 0.4, 50, 0xC8B870, -5, 0.2, -30));
        scene.add(makeBox(30, 0.4, 3, 0xC8B870, -10, 0.2, -20));
    }

    function buildCivicCentre(scene) {
        // Cathays Park civic buildings - Portland stone white
        // City Hall
        scene.add(makeBox(22, 10, 14, 0xF0EED0, -50, 5, -50));
        // City Hall dome
        scene.add(makeSphere(4, 8, 6, 0xE8E8C0, -50, 12, -50));
        // City Hall columns
        scene.add(makeCylinder(0.6, 0.7, 9, 6, 0xEEECD8, -56, 4.5, -50));
        scene.add(makeCylinder(0.6, 0.7, 9, 6, 0xEEECD8, -54, 4.5, -50));
        scene.add(makeCylinder(0.6, 0.7, 9, 6, 0xEEECD8, -46, 4.5, -50));
        scene.add(makeCylinder(0.6, 0.7, 9, 6, 0xEEECD8, -44, 4.5, -50));

        // County Hall
        scene.add(makeBox(20, 9, 12, 0xF0EED0, -50, 4.5, -70));
        scene.add(makeBox(24, 2, 14, 0xE8E6C8, -50, 10, -70));

        // Law Courts
        scene.add(makeBox(18, 8, 12, 0xF0EED0, -50, 4, -30));
        scene.add(makeCylinder(0.5, 0.6, 8, 6, 0xEEECD8, -56, 4, -30));
        scene.add(makeCylinder(0.5, 0.6, 8, 6, 0xEEECD8, -44, 4, -30));

        // Cathays Park greenery
        scene.add(makeBox(50, 0.4, 30, 0x3A7A2A, -50, 0.2, -50));
    }

    function buildNationalMuseum(scene) {
        // National Museum Wales - grand Edwardian building
        scene.add(makeBox(30, 12, 18, 0xF0EED0, -80, 6, -50));

        // Museum dome
        scene.add(makeSphere(6, 10, 7, 0xE8E6C8, -80, 14, -50));
        scene.add(makeCylinder(6.2, 6.5, 3, 10, 0xEEECD8, -80, 12, -50));

        // Corinthian columns - front portico
        scene.add(makeCylinder(0.7, 0.8, 11, 8, 0xEEECD8, -90, 5.5, -58));
        scene.add(makeCylinder(0.7, 0.8, 11, 8, 0xEEECD8, -87, 5.5, -58));
        scene.add(makeCylinder(0.7, 0.8, 11, 8, 0xEEECD8, -84, 5.5, -58));
        scene.add(makeCylinder(0.7, 0.8, 11, 8, 0xEEECD8, -81, 5.5, -58));
        scene.add(makeCylinder(0.7, 0.8, 11, 8, 0xEEECD8, -78, 5.5, -58));
        scene.add(makeCylinder(0.7, 0.8, 11, 8, 0xEEECD8, -75, 5.5, -58));
        scene.add(makeCylinder(0.7, 0.8, 11, 8, 0xEEECD8, -72, 5.5, -58));
        scene.add(makeCylinder(0.7, 0.8, 11, 8, 0xEEECD8, -69, 5.5, -58));

        // Portico pediment
        scene.add(makeBox(24, 2, 2, 0xEEECD8, -80, 12.5, -58));

        // Museum wings
        scene.add(makeBox(10, 10, 14, 0xF0EED0, -96, 5, -50));
        scene.add(makeBox(10, 10, 14, 0xF0EED0, -64, 5, -50));

        // Museum steps
        scene.add(makeBox(32, 1.5, 4, 0xE8E6C8, -80, 0.75, -60));
        scene.add(makeBox(30, 1, 4, 0xE8E6C8, -80, 1.5, -62));
    }

    function buildCastleGatehouse(scene) {
        // Main gatehouse entrance
        scene.add(makeBox(8, 10, 4, 0x9A8A78, 0, 5, 10));

        // Gateway arch represented by boxes
        scene.add(makeBox(2, 8, 4, 0x9A8A78, -2, 4, 10));
        scene.add(makeBox(2, 8, 4, 0x9A8A78, 2, 4, 10));
        scene.add(makeBox(5, 2, 4, 0x8A7A68, 0, 9, 10));

        // Portcullis slot detail
        scene.add(makeBox(0.3, 6, 0.3, 0x5A4A38, -1, 6, 9.6));
        scene.add(makeBox(0.3, 6, 0.3, 0x5A4A38, 1, 6, 9.6));

        // Drawbridge
        scene.add(makeBox(4, 0.5, 5, 0x7A6A4A, 0, 0.25, 13));

        // Castle wall sections connecting to towers
        scene.add(makeBox(6, 8, 2, 0x9A8A78, -7, 4, 10));
        scene.add(makeBox(6, 8, 2, 0x9A8A78, 7, 4, 10));
    }

    function buildSurroundingStreets(scene) {
        // Castle Street
        scene.add(makeBox(60, 0.3, 8, 0x444444, 20, 0.15, 18));
        // High Street
        scene.add(makeBox(8, 0.3, 80, 0x444444, 40, 0.15, -20));
        // Westgate Street
        scene.add(makeBox(50, 0.3, 8, 0x444444, 30, 0.15, -8));

        // Pavement areas
        scene.add(makeBox(60, 0.2, 3, 0x888880, 20, 0.1, 22));
        scene.add(makeBox(60, 0.2, 3, 0x888880, 20, 0.1, 15));
    }

    function buildAnimalWall(scene) {
        // Animal Wall - famous low wall with stone animals
        scene.add(makeBox(30, 1.5, 1, 0x9A8A78, 5, 0.75, 15));

        // Stone animal sculptures on wall (simplified boxes)
        // Bear
        scene.add(makeBox(1.2, 1.2, 1, 0x8A7A68, -4, 2.1, 15));
        // Lion
        scene.add(makeBox(1.5, 1, 1, 0x9A8060, 0, 2, 15));
        // Lynx
        scene.add(makeBox(1, 1, 0.8, 0x8A8070, 4, 2, 15));
        // Seal
        scene.add(makeBox(1.2, 0.8, 1.2, 0x5A6A7A, 8, 1.9, 15));
        // Wolverine
        scene.add(makeBox(1, 1, 0.9, 0x6A5A4A, 12, 2, 15));
    }

    function buildExtraDetails(scene) {
        // Ground plane around castle (courtyard)
        scene.add(makeBox(24, 0.3, 24, 0x8A8070, 0, 0.15, 0));

        // Moat (water boxes around castle)
        scene.add(makeBox(30, 0.4, 4, 0x2A5A8A, 0, 0.2, 15));
        scene.add(makeBox(30, 0.4, 4, 0x2A5A8A, 0, 0.2, -15));
        scene.add(makeBox(4, 0.4, 22, 0x2A5A8A, 16, 0.2, 0));
        scene.add(makeBox(4, 0.4, 22, 0x2A5A8A, -16, 0.2, 0));

        // Flag pole on main keep
        scene.add(makeCylinder(0.15, 0.15, 6, 4, 0xBBBBBB, 0, 18, 0));
        // Welsh flag (red top, white middle rep)
        scene.add(makeBox(2, 0.8, 0.1, 0xCC0000, 1, 21.5, 0));
        scene.add(makeBox(2, 0.8, 0.1, 0xFFFFFF, 1, 20.7, 0));
        scene.add(makeBox(2, 0.8, 0.1, 0x00AA00, 1, 19.9, 0));

        // Street lamps
        scene.add(makeCylinder(0.1, 0.15, 4, 4, 0x7A7A7A, 25, 2, 18));
        scene.add(makeCylinder(0.1, 0.15, 4, 4, 0x7A7A7A, -25, 2, 18));
        scene.add(makeCylinder(0.1, 0.15, 4, 4, 0x7A7A7A, 25, 2, -18));
        scene.add(makeCylinder(0.1, 0.15, 4, 4, 0x7A7A7A, -25, 2, -18));

        // Lamp heads
        scene.add(makeSphere(0.4, 4, 3, 0xFFFFAA, 25, 4.4, 18));
        scene.add(makeSphere(0.4, 4, 3, 0xFFFFAA, -25, 4.4, 18));
        scene.add(makeSphere(0.4, 4, 3, 0xFFFFAA, 25, 4.4, -18));
        scene.add(makeSphere(0.4, 4, 3, 0xFFFFAA, -25, 4.4, -18));
    }

    function build(scene) {
        buildMotte(scene);
        buildCastleWalls(scene);
        buildCastleGatehouse(scene);
        buildVictorianClockTower(scene);
        buildWelshDragon(scene);
        buildPrincipalityStadium(scene);
        buildRiverTaff(scene);
        buildButePark(scene);
        buildCivicCentre(scene);
        buildNationalMuseum(scene);
        buildAnimalWall(scene);
        buildSurroundingStreets(scene);
        buildExtraDetails(scene);
    }

    return {
        build: build
    };

}());
